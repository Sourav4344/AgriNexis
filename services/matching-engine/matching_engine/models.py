from __future__ import annotations

from datetime import date, datetime
from decimal import ROUND_HALF_UP, Decimal, InvalidOperation
from enum import StrEnum
from typing import Annotated, Any, Literal
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
RATIO_QUANTUM = Decimal("0.000001")


def _decimal(value: object) -> Decimal:
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
    BeforeValidator(_decimal),
    PlainSerializer(lambda value: format(value, "f"), return_type=str),
]
QualityScalar = str | int | bool


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class DataMode(StrEnum):
    LIVE = "LIVE"
    CACHED = "CACHED"
    DEMO = "DEMO"


class VerificationStatus(StrEnum):
    UNVERIFIED = "UNVERIFIED"
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"


class CandidateState(StrEnum):
    ELIGIBLE = "ELIGIBLE"
    EXCLUDED = "EXCLUDED"
    UNAVAILABLE = "UNAVAILABLE"


class CoverageClass(StrEnum):
    FULL_LOT = "FULL_LOT"
    PARTIAL_LOT = "PARTIAL_LOT"


class SellWait(StrEnum):
    SELL_NOW = "SELL_NOW"
    WAIT = "WAIT"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"


class QualityMatchState(StrEnum):
    MATCH = "MATCH"
    NOT_REQUIRED = "NOT_REQUIRED"
    MISMATCH = "MISMATCH"
    UNRESOLVED = "UNRESOLVED"


class Listing(StrictModel):
    id: UUID
    farmer_profile_id: UUID
    crop_id: UUID
    variety_id: UUID | None = None
    available_quantity_kg: DecimalValue
    unit: Literal["kg"] = "kg"
    available_from: date
    available_until: date | None = None
    status: str
    version: int = Field(gt=0)
    deleted_at: datetime | None = None
    quality_facts: dict[str, QualityScalar] = Field(default_factory=dict)

    @field_validator("available_quantity_kg")
    @classmethod
    def quantity_scale(cls, value: Decimal) -> Decimal:
        return value.quantize(QUANTITY_QUANTUM, rounding=ROUND_HALF_UP)


class QualityRequirement(StrictModel):
    expected: QualityScalar
    required: bool = True


class Demand(StrictModel):
    id: UUID
    buyer_profile_id: UUID | None = None
    fpo_id: UUID | None = None
    crop_id: UUID
    variety_id: UUID | None = None
    minimum_quantity_kg: DecimalValue
    maximum_quantity_kg: DecimalValue
    fulfilled_quantity_kg: DecimalValue = Decimal("0")
    unit: Literal["kg"] = "kg"
    delivery_from: date
    delivery_until: date
    currency: str = Field(pattern=r"^[A-Z]{3}$")
    status: str
    quality_requirements: dict[str, QualityRequirement] = Field(default_factory=dict)

    @model_validator(mode="after")
    def valid_demand(self) -> Demand:
        if (self.buyer_profile_id is None) == (self.fpo_id is None):
            raise ValueError("demand must have exactly one buyer or FPO owner")
        for name in (
            "minimum_quantity_kg",
            "maximum_quantity_kg",
            "fulfilled_quantity_kg",
        ):
            setattr(
                self,
                name,
                getattr(self, name).quantize(QUANTITY_QUANTUM, rounding=ROUND_HALF_UP),
            )
        if self.minimum_quantity_kg <= 0 or self.maximum_quantity_kg < self.minimum_quantity_kg:
            raise ValueError("invalid demand quantity range")
        if not Decimal(0) <= self.fulfilled_quantity_kg <= self.maximum_quantity_kg:
            raise ValueError("invalid fulfilled quantity")
        if self.delivery_until < self.delivery_from:
            raise ValueError("invalid demand delivery window")
        return self


class Offer(StrictModel):
    id: UUID
    listing_id: UUID
    demand_id: UUID | None = None
    buyer_profile_id: UUID | None = None
    fpo_id: UUID | None = None
    quantity_kg: DecimalValue
    unit_price_per_kg: DecimalValue
    unit: Literal["kg"] = "kg"
    currency: str = Field(pattern=r"^[A-Z]{3}$")
    expires_at: datetime
    status: str
    version: int = Field(gt=0)

    @model_validator(mode="after")
    def valid_offer(self) -> Offer:
        if (self.buyer_profile_id is None) == (self.fpo_id is None):
            raise ValueError("offer must have exactly one buyer or FPO owner")
        self.quantity_kg = self.quantity_kg.quantize(QUANTITY_QUANTUM, rounding=ROUND_HALF_UP)
        self.unit_price_per_kg = self.unit_price_per_kg.quantize(
            MONEY_QUANTUM, rounding=ROUND_HALF_UP
        )
        if self.quantity_kg <= 0 or self.unit_price_per_kg < 0:
            raise ValueError("offer quantity and price must be nonnegative")
        if self.expires_at.tzinfo is None or self.expires_at.utcoffset() is None:
            raise ValueError("offer expiry must be timezone-aware")
        return self


class LogisticsQuote(StrictModel):
    id: UUID
    listing_id: UUID
    demand_id: UUID | None = None
    transportation_cost: DecimalValue
    storage_cost: DecimalValue
    handling_cost: DecimalValue
    other_applicable_cost: DecimalValue
    total_applicable_cost: DecimalValue
    currency: str = Field(pattern=r"^[A-Z]{3}$")
    distance_km: DecimalValue | None = None
    source_name: str
    data_mode: DataMode | None
    confidence: DecimalValue | None = None
    dataset_id: str | None = None
    source_version: str | None = None
    checksum: str | None = None
    calculated_at: datetime
    expires_at: datetime

    @model_validator(mode="after")
    def valid_quote(self) -> LogisticsQuote:
        for name in (
            "transportation_cost",
            "storage_cost",
            "handling_cost",
            "other_applicable_cost",
            "total_applicable_cost",
        ):
            value = getattr(self, name).quantize(MONEY_QUANTUM, rounding=ROUND_HALF_UP)
            if value < 0:
                raise ValueError("quote costs cannot be negative")
            setattr(self, name, value)
        if self.distance_km is not None and self.distance_km < 0:
            raise ValueError("distance cannot be negative")
        if self.confidence is not None and not Decimal(0) <= self.confidence <= Decimal(1):
            raise ValueError("confidence must be between zero and one")
        for value in (self.calculated_at, self.expires_at):
            if value.tzinfo is None or value.utcoffset() is None:
                raise ValueError("quote timestamps must be timezone-aware")
        return self


class Counterparty(StrictModel):
    buyer_profile_id: UUID | None = None
    fpo_id: UUID | None = None
    display_name: str
    verification_status: VerificationStatus
    active: bool

    @model_validator(mode="after")
    def exactly_one_identity(self) -> Counterparty:
        if (self.buyer_profile_id is None) == (self.fpo_id is None):
            raise ValueError("counterparty must be a buyer or FPO")
        return self


class PredictionEvidence(StrictModel):
    advisory_type: Literal["PRICE_ONLY_ADVISORY"] = "PRICE_ONLY_ADVISORY"
    advisory: str
    direction: str
    confidence: DecimalValue | None = None
    warnings: list[str] = Field(default_factory=list)
    data_mode: DataMode | None = None
    source: str | None = None
    dataset_id: str | None = None
    model_version: str | None = None


class MarketReference(StrictModel):
    mandi_id: UUID
    modal_price_per_kg: DecimalValue
    currency: str = Field(pattern=r"^[A-Z]{3}$")
    data_mode: DataMode | None = None
    source: str
    dataset_id: str | None = None
    source_version: str | None = None


class CandidateInput(StrictModel):
    offer: Offer
    demand: Demand | None = None
    quote: LogisticsQuote | None = None
    counterparty: Counterparty


class MatchingRequest(StrictModel):
    listing: Listing
    candidates: list[CandidateInput]
    prediction: PredictionEvidence | None = None
    market_reference: MarketReference | None = None
    current_opportunity_only: bool = False


class Economics(StrictModel):
    gross_selling_value: DecimalValue
    transportation_cost: DecimalValue
    storage_cost: DecimalValue
    handling_cost: DecimalValue
    other_applicable_cost: DecimalValue
    total_applicable_cost: DecimalValue
    net_farmer_realization: DecimalValue
    net_farmer_realization_per_kg: DecimalValue


class ExplanationFact(StrictModel):
    code: str
    values: dict[str, Any] = Field(default_factory=dict)


class RankedOption(StrictModel):
    rank: int = Field(gt=0)
    candidate_type: Literal["BUYER", "FPO"]
    candidate_id: UUID
    candidate_name: str
    offer_id: UUID
    demand_id: UUID | None
    logistics_quote_id: UUID
    listing_id: UUID
    listing_version: int
    offer_version: int
    quantity_kg: DecimalValue
    listing_available_quantity_kg: DecimalValue
    coverage_class: CoverageClass
    coverage_ratio: DecimalValue
    coverage_percent: DecimalValue
    unit_price_per_kg: DecimalValue
    currency: str
    economics: Economics
    distance_km: DecimalValue | None
    verification_status: VerificationStatus
    quality_match_state: QualityMatchState
    data_mode: DataMode
    source: str
    dataset_id: str | None
    source_version: str | None
    checksum: str | None
    calculated_at: datetime
    valid_until: datetime
    component_evidence: dict[str, Any]
    explanation_facts: list[ExplanationFact]
    warnings: list[str]


class CandidateFailure(StrictModel):
    offer_id: UUID
    state: Literal[CandidateState.EXCLUDED, CandidateState.UNAVAILABLE]
    reasons: list[str]


class RecommendationResult(StrictModel):
    listing_id: UUID
    options: list[RankedOption]
    failures: list[CandidateFailure]
    best_offer_id: UUID | None
    timing_decision: Literal[SellWait.INSUFFICIENT_DATA]
    timing_reason: Literal["WAIT_ECONOMICS_UNAVAILABLE"]
    sell_wait: SellWait
    confidence: None = None
    data_mode: DataMode | None
    source: str
    calculated_at: datetime
    warnings: list[str]
    explanation_facts: list[ExplanationFact]
