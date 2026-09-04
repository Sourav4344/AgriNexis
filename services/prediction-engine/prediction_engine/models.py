from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from enum import StrEnum
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class DataMode(StrEnum):
    LIVE = "LIVE"
    CACHED = "CACHED"
    DEMO = "DEMO"


class Direction(StrEnum):
    RISING = "RISING"
    STABLE = "STABLE"
    FALLING = "FALLING"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"


class Advisory(StrEnum):
    SELL_NOW = "SELL_NOW"
    WAIT = "WAIT"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"


class PredictionQuery(StrictModel):
    crop_id: UUID
    variety_id: UUID | None = None
    mandi_id: UUID
    horizon_days: Literal[1, 3] = 3
    currency: Literal["INR"] = "INR"
    normalized_unit: Literal["kg"] = "kg"
    data_mode: DataMode = DataMode.LIVE
    dataset_id: str | None = Field(default=None, min_length=1, max_length=200)

    @model_validator(mode="after")
    def validate_dataset(self) -> PredictionQuery:
        if self.data_mode == DataMode.DEMO and self.dataset_id is None:
            raise ValueError("dataset_id is required for DEMO history")
        return self


class HistoryObservation(StrictModel):
    id: UUID
    source_observation_id: UUID
    mandi_id: UUID
    crop_id: UUID
    variety_id: UUID | None
    price_date: date
    modal_price: Decimal
    currency: Literal["INR"]
    normalized_unit: Literal["kg"]
    arrival_quantity: Decimal | None = None
    observed_at: datetime
    source_name: str
    transformation_version: str
    data_mode: Literal[DataMode.LIVE, DataMode.DEMO]
    dataset_id: str | None = None
    provenance: dict[str, Any] = Field(default_factory=dict)

    @field_validator("modal_price")
    @classmethod
    def nonnegative_price(cls, value: Decimal) -> Decimal:
        if not value.is_finite() or value < 0:
            raise ValueError("modal price must be finite and nonnegative")
        return value


class GapReport(StrictModel):
    missing_calendar_days: int
    maximum_gap_days: int
    duplicate_dates_removed: int


class EvaluationMetrics(StrictModel):
    method_name: str
    horizon_days: int
    sample_count: int
    start_date: date
    end_date: date
    mae: Decimal
    rmse: Decimal
    mape: Decimal | None


class Uncertainty(StrictModel):
    lower_bound: Decimal | None
    upper_bound: Decimal | None
    interval_method: str | None
    residual_sample_count: int
    coverage_target: Decimal | None


class PredictionResult(StrictModel):
    status: Direction
    point_estimate: Decimal | None
    reference_price: Decimal | None
    direction: Direction
    advisory_type: Literal["PRICE_ONLY_ADVISORY"] = "PRICE_ONLY_ADVISORY"
    advisory: Advisory
    horizon_days: int
    forecast_origin: datetime
    forecast_date: date
    method_name: str | None
    model_version: str
    feature_version: str
    configuration_version: str
    dataset_id: str | None
    data_mode: DataMode
    source: str
    training_cutoff: date | None
    history_start: date | None
    history_end: date | None
    observation_count: int
    gap_report: GapReport | None
    evaluation: EvaluationMetrics | None
    benchmark_method: str
    benchmark_mae: Decimal | None
    selected_method: str | None
    selected_method_mae: Decimal | None
    selection_reason: str
    uncertainty: Uncertainty
    confidence: Decimal | None = None
    generated_at: datetime
    warnings: list[str] = Field(default_factory=list)
    explanation_facts: list[str] = Field(default_factory=list)

    @field_validator("confidence")
    @classmethod
    def valid_confidence(cls, value: Decimal | None) -> Decimal | None:
        if value is not None and not Decimal(0) <= value <= Decimal(1):
            raise ValueError("confidence must be between zero and one")
        return value
