from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from enum import StrEnum
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from .money import DecimalString, money, quantity


class ApiModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class ProfilePatch(ApiModel):
    display_name: str | None = Field(default=None, min_length=1, max_length=160)
    phone: str | None = Field(default=None, max_length=40)
    preferred_locale: Literal["en", "hi", "bn"] | None = None
    farm_summary: str | None = Field(default=None, max_length=2000)
    district: str | None = Field(default=None, max_length=160)
    state: str | None = Field(default=None, max_length=160)
    postal_area: str | None = Field(default=None, max_length=40)
    organization_name: str | None = Field(default=None, max_length=200)
    trade_reference: str | None = Field(default=None, max_length=200)


class ListingCreate(ApiModel):
    crop_id: UUID
    variety_id: UUID | None = None
    quantity: DecimalString
    unit: Literal["kg"] = "kg"
    harvest_date: date | None = None
    available_from: date
    available_until: date | None = None
    district: str = Field(min_length=1, max_length=160)
    state: str = Field(min_length=1, max_length=160)
    postal_area: str | None = Field(default=None, max_length=40)
    quality_summary: dict[str, Any] = Field(default_factory=dict)

    @field_validator("quantity")
    @classmethod
    def valid_quantity(cls, value: Decimal) -> Decimal:
        value = quantity(value)
        if value <= 0:
            raise ValueError("quantity must be positive")
        return value


class ListingPatch(ApiModel):
    version: int = Field(gt=0)
    crop_id: UUID | None = None
    variety_id: UUID | None = None
    quantity: DecimalString | None = None
    harvest_date: date | None = None
    available_from: date | None = None
    available_until: date | None = None
    district: str | None = Field(default=None, min_length=1, max_length=160)
    state: str | None = Field(default=None, min_length=1, max_length=160)
    postal_area: str | None = Field(default=None, max_length=40)
    quality_summary: dict[str, Any] | None = None


class DemandCreate(ApiModel):
    fpo_id: UUID | None = None
    crop_id: UUID
    variety_id: UUID | None = None
    minimum_quantity: DecimalString
    maximum_quantity: DecimalString
    unit: Literal["kg"] = "kg"
    quality_requirements: dict[str, Any] = Field(default_factory=dict)
    delivery_from: date
    delivery_until: date
    delivery_district: str | None = Field(default=None, max_length=160)
    delivery_state: str = Field(min_length=1, max_length=160)
    indicative_price: DecimalString | None = None
    currency: str = Field(default="INR", pattern=r"^[A-Z]{3}$")

    @field_validator("minimum_quantity", "maximum_quantity")
    @classmethod
    def valid_quantity(cls, value: Decimal) -> Decimal:
        value = quantity(value)
        if value <= 0:
            raise ValueError("quantity must be positive")
        return value


class DemandPatch(ApiModel):
    version: int = Field(gt=0)
    minimum_quantity: DecimalString | None = None
    maximum_quantity: DecimalString | None = None
    quality_requirements: dict[str, Any] | None = None
    delivery_from: date | None = None
    delivery_until: date | None = None
    delivery_district: str | None = None
    delivery_state: str | None = None
    indicative_price: DecimalString | None = None


class OfferCreate(ApiModel):
    listing_id: UUID
    demand_id: UUID | None = None
    fpo_id: UUID | None = None
    quantity_kg: DecimalString
    unit_price_per_kg: DecimalString
    currency: str = Field(default="INR", pattern=r"^[A-Z]{3}$")
    delivery_terms: str = Field(min_length=1, max_length=500)
    expires_at: datetime


class AcknowledgedAmounts(ApiModel):
    gross_selling_value: DecimalString
    total_applicable_cost: DecimalString
    net_farmer_realization: DecimalString
    currency: str = Field(pattern=r"^[A-Z]{3}$")

    @field_validator("gross_selling_value", "total_applicable_cost", "net_farmer_realization")
    @classmethod
    def normalize_money(cls, value: Decimal) -> Decimal:
        return money(value)


class OfferAccept(ApiModel):
    offer_version: int = Field(gt=0)
    listing_version: int = Field(gt=0)
    logistics_quote_id: UUID
    recommendation_option_id: UUID | None = None
    acknowledged_amounts: AcknowledgedAmounts


class OrderTransition(ApiModel):
    to_status: Literal["PICKUP_SCHEDULED", "IN_TRANSIT", "DELIVERED", "COMPLETED", "CANCELLED", "DISPUTED"]
    version: int = Field(gt=0)
    occurred_at: datetime | None = None
    note: str | None = Field(default=None, max_length=1000)


class PaymentStatus(StrEnum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    PAID = "PAID"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"


class PaymentTransition(ApiModel):
    expected_status: PaymentStatus
    new_status: PaymentStatus
    reason: str | None = Field(default=None, max_length=500)


class RecommendationGenerateRequest(ApiModel):
    as_of: datetime | None = None
    horizon_days: Literal[1, 3] = 3
    include_storage_scenarios: bool = True


class LogisticsQuoteCreate(ApiModel):
    listing_id: UUID
    demand_id: UUID | None = None
    origin_district: str = Field(min_length=1, max_length=160)
    origin_state: str = Field(min_length=1, max_length=160)
    destination_district: str = Field(min_length=1, max_length=160)
    destination_state: str = Field(min_length=1, max_length=160)
    quantity_kg: DecimalString
    no_storage_required: bool = False
    storage_days: int | None = None
    reference_distance_km: DecimalString | None = None
    currency: str = Field(default="INR", pattern=r"^[A-Z]{3}$")
    data_mode: Literal["DEMO", "LIVE", "CACHED"] = "DEMO"


class PricePredictionRequest(ApiModel):
    crop_id: UUID
    variety_id: UUID | None = None
    mandi_id: UUID | None = None
    horizon_days: Literal[1, 3] = 3
    dataset_id: str | None = None
    data_mode: Literal["DEMO", "LIVE", "CACHED"] = "DEMO"


class QualityReportCreate(ApiModel):
    crop: str = Field(min_length=1, max_length=100)
    mime_type: str | None = None
    width_px: int | None = None
    height_px: int | None = None
    data_mode: Literal["DEMO", "LIVE", "CACHED"] = "DEMO"
