from __future__ import annotations

import asyncio
import time
from typing import Any
from uuid import UUID

import httpx
import jwt
from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .config import Settings
from .database import Database
from .errors import ApiError
from .models import AccountStatus, Principal, Role

bearer = HTTPBearer(auto_error=False)


class JWKSVerifier:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self._keys: dict[str, Any] = {}
        self._expires_at = 0.0
        self._lock = asyncio.Lock()

    @property
    def configured(self) -> bool:
        return bool(
            self.settings.supabase_jwks_url
            and self.settings.supabase_jwt_issuer
            and self.settings.supabase_jwt_audience
        )

    async def _refresh(self) -> None:
        if not self.settings.supabase_jwks_url:
            raise ApiError("AUTH_NOT_CONFIGURED", "Authentication is not configured", 503)
        async with self._lock:
            if self._expires_at > time.monotonic() and self._keys:
                return
            try:
                async with httpx.AsyncClient(timeout=5) as client:
                    response = await client.get(str(self.settings.supabase_jwks_url))
                    response.raise_for_status()
                    jwks = response.json()
                keys = {
                    item["kid"]: jwt.PyJWK.from_dict(item).key
                    for item in jwks.get("keys", [])
                    if item.get("kid")
                }
            except (httpx.HTTPError, ValueError, KeyError, jwt.PyJWTError) as exc:
                raise ApiError("AUTH_PROVIDER_UNAVAILABLE", "Authentication provider unavailable", 503) from exc
            if not keys:
                raise ApiError("AUTH_PROVIDER_UNAVAILABLE", "Authentication provider unavailable", 503)
            self._keys = keys
            self._expires_at = time.monotonic() + self.settings.jwks_cache_seconds

    async def verify(self, token: str) -> dict[str, Any]:
        if not self.configured:
            raise ApiError("AUTH_NOT_CONFIGURED", "Authentication is not configured", 503)
        try:
            header = jwt.get_unverified_header(token)
            algorithm = header.get("alg")
            key_id = header.get("kid")
        except jwt.PyJWTError as exc:
            raise ApiError("INVALID_TOKEN", "Authentication credentials are invalid", 401) from exc
        if algorithm not in {"RS256", "ES256"} or not key_id:
            raise ApiError("INVALID_TOKEN", "Authentication credentials are invalid", 401)
        if key_id not in self._keys or self._expires_at <= time.monotonic():
            await self._refresh()
        key = self._keys.get(key_id)
        if key is None:
            self._expires_at = 0
            await self._refresh()
            key = self._keys.get(key_id)
        if key is None:
            raise ApiError("INVALID_TOKEN", "Authentication credentials are invalid", 401)
        try:
            claims = jwt.decode(
                token,
                key,
                algorithms=[algorithm],
                audience=self.settings.supabase_jwt_audience,
                issuer=self.settings.supabase_jwt_issuer,
                options={"require": ["exp", "iat", "sub"]},
            )
            UUID(claims["sub"])
        except (jwt.PyJWTError, ValueError, KeyError) as exc:
            raise ApiError("INVALID_TOKEN", "Authentication credentials are invalid", 401) from exc
        return claims


def get_database(request: Request) -> Database:
    return request.app.state.database


def get_verifier(request: Request) -> JWKSVerifier:
    return request.app.state.verifier


async def current_principal(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    verifier: JWKSVerifier = Depends(get_verifier),
    database: Database = Depends(get_database),
) -> Principal:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise ApiError("AUTHENTICATION_REQUIRED", "Authentication is required", 401)
    claims = await verifier.verify(credentials.credentials)
    row = await database.fetchrow(
        """select id,user_id,role,status,display_name from public.profiles
           where user_id=$1 and status='ACTIVE'""",
        UUID(claims["sub"]),
    )
    if not row:
        raise ApiError("PROFILE_UNAVAILABLE", "An active application profile is required", 403)
    return Principal(
        profile_id=row["id"], user_id=row["user_id"], role=Role(row["role"]),
        status=AccountStatus(row["status"]), display_name=row["display_name"]
    )


def require_roles(*allowed: Role):
    async def dependency(principal: Principal = Depends(current_principal)) -> Principal:
        if principal.role not in allowed:
            raise ApiError("FORBIDDEN", "You are not allowed to perform this action", 403)
        return principal
    return dependency


async def require_fpo_operator(
    fpo_id: UUID,
    principal: Principal = Depends(require_roles(Role.FPO, Role.ADMIN)),
    database: Database = Depends(get_database),
) -> Principal:
    if principal.role is Role.ADMIN:
        return principal
    exists = await database.fetchrow(
        "select id from public.fpo_operators where fpo_id=$1 and profile_id=$2 and status='ACTIVE'",
        fpo_id, principal.profile_id,
    )
    if not exists:
        raise ApiError("FPO_OPERATOR_REQUIRED", "Active FPO operator authority is required", 403)
    return principal

