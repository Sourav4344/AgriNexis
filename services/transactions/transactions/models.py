from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from datetime import UTC, datetime
from decimal import ROUND_HALF_UP, Decimal
from enum import StrEnum
from types import MappingProxyType

MONEY_QUANTUM = Decimal("0.01")
QUANTITY_QUANTUM = Decimal("0.001")


class OrderStatus(StrEnum):
    CONFIRMED = "CONFIRMED"
    PICKUP_SCHEDULED = "PICKUP_SCHEDULED"
    IN_TRANSIT = "IN_TRANSIT"
    DELIVERED = "DELIVERED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    DISPUTED = "DISPUTED"


class PaymentStatus(StrEnum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    PAID = "PAID"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"


class DataMode(StrEnum):
    LIVE = "LIVE"
    DEMO = "DEMO"
    SANDBOX = "SANDBOX"


class ActorRole(StrEnum):
    FARMER = "FARMER"
    BUYER = "BUYER"
    FPO = "FPO"
    ADMIN = "ADMIN"


class EventType(StrEnum):
    OFFER_ACCEPTED = "OFFER_ACCEPTED"
    ORDER_CREATED = "ORDER_CREATED"
    ORDER_STATUS_CHANGED = "ORDER_STATUS_CHANGED"
    PAYMENT_STATUS_CHANGED = "PAYMENT_STATUS_CHANGED"


def _money(value: Decimal) -> Decimal:
    return value.quantize(MONEY_QUANTUM, rounding=ROUND_HALF_UP)


def _quantity(value: Decimal) -> Decimal:
    return value.quantize(QUANTITY_QUANTUM, rounding=ROUND_HALF_UP)


@dataclass(frozen=True, slots=True)
class FinancialSnapshot:
    currency: str
    quantity_kg: Decimal
    unit_price_per_kg: Decimal
    gross: Decimal
    transportation: Decimal
    storage: Decimal
    handling: Decimal
    other: Decimal
    total_cost: Decimal
    net_farmer_realization: Decimal

    def __post_init__(self) -> None:
        object.__setattr__(self, "currency", self.currency.strip().upper())
        object.__setattr__(self, "quantity_kg", _quantity(self.quantity_kg))
        for name in (
            "unit_price_per_kg",
            "gross",
            "transportation",
            "storage",
            "handling",
            "other",
            "total_cost",
            "net_farmer_realization",
        ):
            object.__setattr__(self, name, _money(getattr(self, name)))
        if len(self.currency) != 3 or not self.currency.isalpha():
            raise ValueError("currency must be a three-letter code")
        if self.quantity_kg <= 0 or self.unit_price_per_kg < 0:
            raise ValueError("quantity must be positive and unit price non-negative")
        costs = self.transportation + self.storage + self.handling + self.other
        if self.gross != _money(self.quantity_kg * self.unit_price_per_kg):
            raise ValueError("gross does not match quantity times unit price")
        if self.total_cost != costs:
            raise ValueError("total cost does not match itemized costs")
        if self.net_farmer_realization != self.gross - self.total_cost:
            raise ValueError("NFR does not match gross minus total cost")

    def decimal_strings(self) -> Mapping[str, str]:
        return MappingProxyType(
            {
                "currency": self.currency,
                "quantity_kg": format(self.quantity_kg, ".3f"),
                "unit_price_per_kg": format(self.unit_price_per_kg, ".2f"),
                "gross": format(self.gross, ".2f"),
                "transportation": format(self.transportation, ".2f"),
                "storage": format(self.storage, ".2f"),
                "handling": format(self.handling, ".2f"),
                "other": format(self.other, ".2f"),
                "total_cost": format(self.total_cost, ".2f"),
                "net_farmer_realization": format(self.net_farmer_realization, ".2f"),
            }
        )


@dataclass(frozen=True, slots=True)
class Order:
    id: str
    status: OrderStatus
    version: int
    snapshot: FinancialSnapshot


@dataclass(frozen=True, slots=True)
class Payment:
    id: str
    status: PaymentStatus
    mode: DataMode


@dataclass(frozen=True, slots=True)
class Actor:
    profile_id: str
    role: ActorRole


@dataclass(frozen=True, slots=True)
class TransactionEvent:
    event_type: EventType
    resource_type: str
    resource_id: str
    actor_profile_id: str | None
    occurred_at: datetime
    facts: Mapping[str, str]

    @classmethod
    def create(
        cls,
        event_type: EventType,
        resource_type: str,
        resource_id: str,
        actor_profile_id: str | None,
        facts: Mapping[str, str],
        occurred_at: datetime | None = None,
    ) -> TransactionEvent:
        return cls(
            event_type,
            resource_type,
            resource_id,
            actor_profile_id,
            occurred_at or datetime.now(UTC),
            MappingProxyType(dict(facts)),
        )
