from __future__ import annotations

import json
from collections.abc import AsyncIterator, Mapping
from contextlib import asynccontextmanager
from typing import Any

import asyncpg

from .errors import ApiError, parse_domain_error


class Database:
    def __init__(self, url: str | None) -> None:
        self.url = url
        self.pool: asyncpg.Pool | None = None

    async def connect(self) -> None:
        if self.url:
            async def initialize(connection: asyncpg.Connection) -> None:
                await connection.set_type_codec(
                    "jsonb", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
                )

            self.pool = await asyncpg.create_pool(
                self.url, min_size=1, max_size=10, command_timeout=15, init=initialize
            )

    async def close(self) -> None:
        if self.pool:
            await self.pool.close()
            self.pool = None

    @property
    def configured(self) -> bool:
        return self.pool is not None

    def require_pool(self) -> asyncpg.Pool:
        if not self.pool:
            raise ApiError("DATABASE_NOT_CONFIGURED", "Database is not configured", 503)
        return self.pool

    async def ready(self) -> bool:
        if not self.pool:
            return False
        try:
            return await self.pool.fetchval("select 1") == 1
        except Exception:
            return False

    async def fetchrow(self, query: str, *args: object) -> Mapping[str, Any] | None:
        row = await self.require_pool().fetchrow(query, *args)
        return dict(row) if row else None

    async def fetch(self, query: str, *args: object) -> list[dict[str, Any]]:
        return [dict(row) for row in await self.require_pool().fetch(query, *args)]

    async def execute(self, query: str, *args: object) -> str:
        return await self.require_pool().execute(query, *args)

    async def call_row(self, query: str, *args: object) -> Mapping[str, Any]:
        try:
            row = await self.require_pool().fetchrow(query, *args)
        except asyncpg.PostgresError as exc:
            mapped = parse_domain_error(exc)
            if mapped:
                raise mapped from exc
            raise ApiError("DATABASE_OPERATION_FAILED", "The operation could not be completed", 409) from exc
        if not row:
            raise ApiError("DATABASE_OPERATION_FAILED", "The operation returned no result", 503)
        return dict(row)

    @asynccontextmanager
    async def transaction(self) -> AsyncIterator[asyncpg.Connection]:
        async with self.require_pool().acquire() as connection, connection.transaction():
            yield connection
