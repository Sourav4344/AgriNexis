from __future__ import annotations

from datetime import datetime
from decimal import Decimal, InvalidOperation
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


class RawMarketRecord(StrictModel):
    crop_code: str
    variety_name: str | None = None
    mandi_provider_name: str
    mandi_external_id: str
    mandi_name: str
    district: str | None = None
    state: str
    min_price: str | int
    modal_price: str | int
    max_price: str | int
    price_unit: str
    currency: str
    arrival_quantity: str | int | None = None
    arrival_unit: str | None = None
    observed_at: datetime
    fetched_at: datetime
    source_name: str
    source_id: str | None = None
    provenance: dict[str, Any] = Field(default_factory=dict)
    dataset_id: str | None = None
    source_version: str | None = None
    quality_flags: list[str] = Field(default_factory=list)

    @field_validator("min_price", "modal_price", "max_price", "arrival_quantity", mode="before")
    @classmethod
    def reject_float(cls, value: object) -> object:
        if isinstance(value, float):
            raise ValueError("decimal input must be a string or exact integer")
        if value is not None:
            try:
                parsed = Decimal(str(value))
            except (InvalidOperation, ValueError) as exc:
                raise ValueError("invalid decimal value") from exc
            if not parsed.is_finite():
                raise ValueError("decimal value must be finite")
        return value

    @field_validator("observed_at", "fetched_at")
    @classmethod
    def timezone_aware(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("datetime must be timezone-aware")
        return value


class NormalizedMarketObservation(StrictModel):
    id: UUID | None = None
    mandi_id: UUID
    crop_id: UUID
    variety_id: UUID | None = None
    min_price: Decimal
    modal_price: Decimal
    max_price: Decimal
    currency: Literal["INR"] = "INR"
    normalized_unit: Literal["kg"] = "kg"
    arrival_quantity: Decimal | None = None
    observed_at: datetime
    fetched_at: datetime
    source_name: str
    source_id: str | None = None
    provenance: dict[str, Any] = Field(default_factory=dict)
    data_mode: Literal[DataMode.LIVE, DataMode.DEMO]
    dataset_id: str | None = None
    source_version: str | None = None
    checksum: str
    quality_flags: list[str] = Field(default_factory=list)

    @field_validator("observed_at", "fetched_at")
    @classmethod
    def timezone_aware(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("datetime must be timezone-aware")
        return value

    @model_validator(mode="after")
    def validate_values(self) -> NormalizedMarketObservation:
        if min(self.min_price, self.modal_price, self.max_price) < 0:
            raise ValueError("prices must be nonnegative")
        if not self.min_price <= self.modal_price <= self.max_price:
            raise ValueError("prices must satisfy min <= modal <= max")
        if self.arrival_quantity is not None and self.arrival_quantity < 0:
            raise ValueError("arrival quantity must be nonnegative")
        if self.data_mode == DataMode.DEMO and self.dataset_id != "SIH-2026-TOMATO-V1":
            raise ValueError("canonical demo dataset identity is required")
        return self


class MarketQuery(StrictModel):
    crop_id: UUID
    variety_id: UUID | None = None
    mandi_ids: list[UUID] = Field(default_factory=list)


class DeliveredMarketResult(StrictModel):
    observation: NormalizedMarketObservation
    delivery_mode: DataMode
    calculated_at: datetime
    source_age_seconds: int
    warnings: list[str] = Field(default_factory=list)


class ComparisonItem(StrictModel):
    mandi_id: UUID
    min_price: Decimal
    modal_price: Decimal
    max_price: Decimal
    arrival_quantity: Decimal | None
    observed_at: datetime
    source_age_seconds: int
    data_mode: DataMode
