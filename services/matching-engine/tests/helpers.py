from __future__ import annotations

from datetime import UTC, date, datetime, timedelta
from uuid import UUID

from matching_engine.models import (
    CandidateInput,
    Counterparty,
    Demand,
    Listing,
    LogisticsQuote,
    Offer,
    VerificationStatus,
)

NOW = datetime(2026, 9, 3, 9, tzinfo=UTC)


def uid(number: int) -> UUID:
    return UUID(f"00000000-0000-4000-8000-{number:012d}")


def listing(**changes: object) -> Listing:
    values: dict[str, object] = {
        "id": uid(1),
        "farmer_profile_id": uid(2),
        "crop_id": uid(3),
        "variety_id": uid(4),
        "available_quantity_kg": "1000",
        "available_from": date(2026, 9, 1),
        "available_until": date(2026, 9, 6),
        "status": "ACTIVE",
        "version": 1,
        "quality_facts": {"declared_grade": "A"},
    }
    values.update(changes)
    return Listing.model_validate(values)


def candidate(number: int = 10, **changes: object) -> CandidateInput:
    buyer_id = uid(number + 1)
    demand_id = uid(number + 2)
    offer_values: dict[str, object] = {
        "id": uid(number),
        "listing_id": uid(1),
        "demand_id": demand_id,
        "buyer_profile_id": buyer_id,
        "quantity_kg": "1000",
        "unit_price_per_kg": "31",
        "currency": "INR",
        "expires_at": NOW + timedelta(days=1),
        "status": "PENDING",
        "version": 1,
    }
    demand_values: dict[str, object] = {
        "id": demand_id,
        "buyer_profile_id": buyer_id,
        "crop_id": uid(3),
        "variety_id": uid(4),
        "minimum_quantity_kg": "1",
        "maximum_quantity_kg": "1000",
        "fulfilled_quantity_kg": "0",
        "delivery_from": date(2026, 9, 1),
        "delivery_until": date(2026, 9, 6),
        "currency": "INR",
        "status": "ACTIVE",
    }
    quote_values: dict[str, object] = {
        "id": uid(number + 3),
        "listing_id": uid(1),
        "demand_id": demand_id,
        "transportation_cost": "1500",
        "storage_cost": "300",
        "handling_cost": "300",
        "other_applicable_cost": "150",
        "total_applicable_cost": "2250",
        "currency": "INR",
        "distance_km": "35",
        "source_name": "TEST_LOGISTICS",
        "data_mode": "LIVE",
        "confidence": None,
        "calculated_at": NOW,
        "expires_at": NOW + timedelta(days=1),
    }
    counterparty_values: dict[str, object] = {
        "buyer_profile_id": buyer_id,
        "display_name": f"Buyer {number}",
        "verification_status": "VERIFIED",
        "active": True,
    }
    for key, value in changes.items():
        target, _, field = key.partition("__")
        containers = {
            "offer": offer_values,
            "demand": demand_values,
            "quote": quote_values,
            "counterparty": counterparty_values,
        }
        if target in containers and field:
            containers[target][field] = value
        else:
            raise KeyError(key)
    return CandidateInput(
        offer=Offer.model_validate(offer_values),
        demand=Demand.model_validate(demand_values),
        quote=LogisticsQuote.model_validate(quote_values),
        counterparty=Counterparty.model_validate(counterparty_values),
    )


def fpo_candidate(number: int = 50) -> CandidateInput:
    item = candidate(number)
    fpo_id = uid(number + 4)
    return CandidateInput(
        offer=item.offer.model_copy(update={"buyer_profile_id": None, "fpo_id": fpo_id}),
        demand=item.demand.model_copy(update={"buyer_profile_id": None, "fpo_id": fpo_id})
        if item.demand
        else None,
        quote=item.quote,
        counterparty=Counterparty(
            fpo_id=fpo_id,
            display_name="Test FPO",
            verification_status=VerificationStatus.VERIFIED,
            active=True,
        ),
    )
