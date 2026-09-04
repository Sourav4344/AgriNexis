from __future__ import annotations

from decimal import Decimal

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class PredictionSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", case_sensitive=False)

    supported_horizons: tuple[int, ...] = (1, 3)
    default_horizon_days: int = 3
    minimum_baseline_dates: int = Field(default=7, ge=2)
    minimum_ml_dates: int = Field(default=30, ge=7)
    maximum_history_rows: int = Field(default=500, ge=30, le=5000)
    genuine_max_age_hours: int = Field(default=48, gt=0)
    stable_threshold: Decimal = Field(default=Decimal("0.02"), gt=0, lt=1)
    minimum_interval_residuals: int = Field(default=20, ge=20)
    interval_coverage_target: Decimal = Field(default=Decimal("0.90"), gt=0, lt=1)
    rolling_window: int = Field(default=3, ge=2, le=30)
    configuration_version: str = "prediction-config-v1"
    feature_version: str = "price-features-v1"

    @model_validator(mode="after")
    def validate_policy(self) -> PredictionSettings:
        if not self.supported_horizons or any(value <= 0 for value in self.supported_horizons):
            raise ValueError("supported horizons must be positive")
        if len(set(self.supported_horizons)) != len(self.supported_horizons):
            raise ValueError("supported horizons must be unique")
        if self.default_horizon_days not in self.supported_horizons:
            raise ValueError("default horizon must be supported")
        if self.minimum_ml_dates < self.minimum_baseline_dates:
            raise ValueError("ML minimum cannot be below baseline minimum")
        return self
