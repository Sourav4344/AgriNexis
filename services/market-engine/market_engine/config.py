from __future__ import annotations

from functools import lru_cache
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class MarketSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", case_sensitive=False)

    database_url: str | None = Field(default=None, repr=False)
    market_data_provider: str | None = None
    market_live_max_age_minutes: int = Field(default=180, gt=0)
    market_cache_max_age_hours: int = Field(default=48, gt=0)
    market_source_timezone: str = "Asia/Kolkata"
    market_demo_fallback_enabled: bool = False

    @model_validator(mode="after")
    def validate_policy(self) -> MarketSettings:
        try:
            ZoneInfo(self.market_source_timezone)
        except ZoneInfoNotFoundError as exc:
            raise ValueError("MARKET_SOURCE_TIMEZONE is not a known timezone") from exc
        if self.market_cache_max_age_hours * 60 < self.market_live_max_age_minutes:
            raise ValueError("cache maximum age must not be shorter than live maximum age")
        return self


@lru_cache
def get_market_settings() -> MarketSettings:
    return MarketSettings()
