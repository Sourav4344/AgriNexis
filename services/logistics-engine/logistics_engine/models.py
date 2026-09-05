from __future__ import annotations

from datetime import date, datetime
from decimal import ROUND_HALF_UP, Decimal, InvalidOperation
from enum import StrEnum
from typing import Annotated, Any
from uuid import UUID

from pydantic import (
    BaseModel,
    BeforeValidator,
    ConfigDict,
    Field,
    PlainSerializer,
    field_validator,
    model_validator,
)

MONEY_QUANTUM = Decimal("0.01")
QUANTITY_QUANTUM = Decimal("0.001")
DISTANCE_QUANTUM = Decimal("0.001")


def exact_decimal(value: object) -> Decimal:
    if isinstance(value, bool | float):
        raise ValueError("decimal values must be strings or exact integers")
    try:
        parsed = Decimal(str(value))
    except (InvalidOperation, ValueError) as exc:
        raise ValueError("invalid decimal value") from exc
    if not parsed.is_finite():
        raise ValueError("decimal value must be finite")
    return parsed


DecimalValue = Annotated[
    Decimal,
    BeforeValidator(exact_decimal),
    PlainSerializer(lambda value: format(value, "f"), return_type=str),
]


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class DataMode(StrEnum):
    LIVE = "LIVE"
    CACHED = "CACHED"
    DEMO = "DEMO"


class Geography(StrictModel):
    district: str = Field(min_length=1, max_length=120)
    state: str = Field(min_length=1, max_length=120)


class DeliveryWindow(StrictModel):
    starts_on: date
    ends_on: date

    @model_validator(mode="after")
    def ordered(self) -> DeliveryWindow:
        if self.ends_on < self.starts_on:
            raise ValueError("delivery window is invalid")
        return self


class QuoteRequest(StrictModel):
    request_id: UUID
    as_of: datetime
    listing_id: UUID
    demand_id: UUID | None = None
    buyer_profile_id: UUID | None = None
    fpo_id: UUID | None = None
    quantity_kg: DecimalValue
    origin: Geography
    destination: Geography
    crop_id: UUID | None = None
    commodity_name: str | None = Field(default=None, max_length=120)
    delivery_window: DeliveryWindow
    configuration_version: str = Field(min_length=1, max_length=80)
    data_mode: DataMode
    currency: str = Field(pattern=r"^[A-Z]{3}$")
    reference_distance_km: DecimalValue | None = None
    storage_days: int | None = Field(default=None, ge=0, le=365)
    no_storage_required: bool = False

    @model_validator(mode="after")
    def valid_request(self) -> QuoteRequest:
        if self.as_of.tzinfo is None or self.as_of.utcoffset() is None:
            raise ValueError("as_of must be timezone-aware")
        self.quantity_kg = self.quantity_kg.quantize(QUANTITY_QUANTUM, rounding=ROUND_HALF_UP)
        if self.quantity_kg <= 0:
            raise ValueError("quantity must be positive")
        if self.reference_distance_km is not None:
            self.reference_distance_km = self.reference_distance_km.quantize(
                DISTANCE_QUANTUM, rounding=ROUND_HALF_UP
            )
            if self.reference_distance_km < 0:
                raise ValueError("distance cannot be negative")
        if self.buyer_profile_id is not None and self.fpo_id is not None:
            raise ValueError("buyer and FPO identities are mutually exclusive")
        if self.no_storage_required and self.storage_days not in (None, 0):
            raise ValueError("storage days conflict with no-storage declaration")
        return self


class CostComponent(StrictModel):
    code: str
    amount: DecimalValue
    source: str
    basis: str

    @field_validator("amount")
    @classmethod
    def money(cls, value: Decimal) -> Decimal:
        value = value.quantize(MONEY_QUANTUM, rounding=ROUND_HALF_UP)
        if value < 0:
            raise ValueError("component amount cannot be negative")
        return value


class ExplanationFact(StrictModel):
    code: str
    values: dict[str, Any] = Field(default_factory=dict)


class QuoteResult(StrictModel):
    request_id: UUID
    listing_id: UUID
    demand_id: UUID | None = None
    buyer_profile_id: UUID | None = None
    fpo_id: UUID | None = None
    quoted_quantity_kg: DecimalValue
    currency: str = Field(pattern=r"^[A-Z]{3}$")
    distance_km: DecimalValue
    transportation_cost: DecimalValue
    storage_cost: DecimalValue
    handling_cost: DecimalValue
    other_applicable_cost: DecimalValue
    total_applicable_cost: DecimalValue
    components: list[CostComponent]
    explanation_facts: list[ExplanationFact]
    engine_version: str
    configuration_version: str
    calculated_at: datetime
    valid_from: datetime
    valid_until: datetime
    data_mode: DataMode
    source: str
    warnings: list[str] = Field(default_factory=list)

    @model_validator(mode="after")
    def valid_quote(self) -> QuoteResult:
        names = (
            "transportation_cost",
            "storage_cost",
            "handling_cost",
            "other_applicable_cost",
            "total_applicable_cost",
        )
        for name in names:
            value = getattr(self, name).quantize(MONEY_QUANTUM, rounding=ROUND_HALF_UP)
            if value < 0:
                raise ValueError("quote costs cannot be negative")
            setattr(self, name, value)
        expected = (
            self.transportation_cost
            + self.storage_cost
            + self.handling_cost
            + self.other_applicable_cost
        ).quantize(MONEY_QUANTUM, rounding=ROUND_HALF_UP)
        if self.total_applicable_cost != expected:
            raise ValueError("total does not equal itemized components")
        if self.valid_until <= self.valid_from or self.valid_from != self.calculated_at:
            raise ValueError("quote validity is invalid")
        return self

    def assert_valid_at(self, instant: datetime) -> None:
        from .errors import failure

        if instant >= self.valid_until:
            raise failure("QUOTE_EXPIRED")
