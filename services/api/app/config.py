from __future__ import annotations

from functools import lru_cache
from typing import Annotated, Literal

from pydantic import Field, HttpUrl, field_validator, model_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore", case_sensitive=False
    )

    app_env: Literal["development", "test", "demo", "production"] = "development"
    log_level: str = "INFO"
    database_url: str | None = None
    supabase_url: HttpUrl | None = None
    supabase_jwt_audience: str = "authenticated"
    supabase_jwt_issuer: str | None = None
    supabase_jwks_url: HttpUrl | None = None
    supabase_service_role_key: str | None = Field(default=None, repr=False)
    api_allowed_origins: Annotated[list[str], NoDecode] = Field(default_factory=list)
    demo_mode: bool = False
    jwks_cache_seconds: int = Field(default=300, ge=30, le=3600)
    payment_provider: str | None = None
    storage_bucket: str | None = None

    @field_validator("api_allowed_origins", mode="before")
    @classmethod
    def parse_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [part.strip() for part in value.split(",") if part.strip()]
        return value

    @model_validator(mode="after")
    def derive_and_validate(self) -> Settings:
        base = str(self.supabase_url).rstrip("/") if self.supabase_url else None
        if base and self.supabase_jwt_issuer is None:
            self.supabase_jwt_issuer = f"{base}/auth/v1"
        if base and self.supabase_jwks_url is None:
            self.supabase_jwks_url = HttpUrl(f"{base}/auth/v1/.well-known/jwks.json")
        if self.app_env == "production":
            missing = [
                name
                for name, value in (
                    ("DATABASE_URL", self.database_url),
                    ("SUPABASE_URL", self.supabase_url),
                    ("SUPABASE_JWT_ISSUER", self.supabase_jwt_issuer),
                    ("SUPABASE_JWKS_URL", self.supabase_jwks_url),
                )
                if not value
            ]
            if missing:
                raise ValueError(f"Missing production configuration: {', '.join(missing)}")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
