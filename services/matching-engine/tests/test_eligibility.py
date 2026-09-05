from datetime import date, timedelta

import pytest

from matching_engine.eligibility import evaluate_eligibility
from matching_engine.models import CandidateState, QualityRequirement

from .helpers import NOW, candidate, listing, uid


@pytest.mark.parametrize(
    ("listing_changes", "candidate_changes", "reason"),
    [
        ({"status": "SOLD"}, {}, "LISTING_NOT_ACTIVE"),
        ({"available_quantity_kg": "0"}, {}, "LISTING_UNAVAILABLE"),
        ({}, {"demand__crop_id": uid(99)}, "CROP_MISMATCH"),
        ({}, {"demand__variety_id": uid(99)}, "VARIETY_MISMATCH"),
        ({}, {"demand__status": "CANCELLED"}, "DEMAND_NOT_ACTIVE"),
        ({}, {"demand__delivery_until": date(2026, 9, 2)}, "DEMAND_EXPIRED"),
        (
            {},
            {"demand__minimum_quantity_kg": "1001", "demand__maximum_quantity_kg": "2000"},
            "DEMAND_MINIMUM_QUANTITY_NOT_MET",
        ),
        ({}, {"demand__fulfilled_quantity_kg": "1"}, "DEMAND_REMAINING_QUANTITY_EXCEEDED"),
        ({}, {"offer__expires_at": NOW - timedelta(seconds=1)}, "OFFER_EXPIRED"),
        ({}, {"offer__status": "ACCEPTED"}, "OFFER_NOT_PENDING"),
        ({}, {"quote__currency": "USD"}, "CURRENCY_MISMATCH"),
        ({}, {"counterparty__buyer_profile_id": uid(88)}, "COUNTERPARTY_IDENTITY_MISMATCH"),
        ({}, {"counterparty__verification_status": "REJECTED"}, "COUNTERPARTY_REJECTED"),
        ({}, {"counterparty__active": False}, "COUNTERPARTY_INACTIVE"),
        ({}, {"quote__listing_id": uid(88)}, "LOGISTICS_QUOTE_ASSOCIATION_MISMATCH"),
        ({}, {"quote__expires_at": NOW - timedelta(seconds=1)}, "LOGISTICS_QUOTE_EXPIRED"),
        ({}, {"quote__total_applicable_cost": "2251"}, "LOGISTICS_QUOTE_TOTAL_INVALID"),
    ],
)
def test_exclusion_and_unavailable_reasons(
    listing_changes: dict[str, object], candidate_changes: dict[str, object], reason: str
) -> None:
    state, reasons, _ = evaluate_eligibility(
        listing(**listing_changes), candidate(**candidate_changes), NOW
    )
    assert state in {CandidateState.EXCLUDED, CandidateState.UNAVAILABLE}
    assert reason in reasons


def test_missing_quote_is_unavailable() -> None:
    item = candidate().model_copy(update={"quote": None})
    state, reasons, _ = evaluate_eligibility(listing(), item, NOW)
    assert state is CandidateState.UNAVAILABLE
    assert reasons == ["LOGISTICS_QUOTE_MISSING"]


def test_quality_exact_match_mismatch_and_unresolved() -> None:
    item = candidate()
    assert item.demand is not None
    matched = item.model_copy(
        update={
            "demand": item.demand.model_copy(
                update={
                    "quality_requirements": {"declared_grade": QualityRequirement(expected="A")}
                }
            )
        }
    )
    assert evaluate_eligibility(listing(), matched, NOW)[0] is CandidateState.ELIGIBLE
    mismatch = matched.model_copy(
        update={
            "demand": matched.demand.model_copy(
                update={
                    "quality_requirements": {"declared_grade": QualityRequirement(expected="B")}
                }
            )
        }
    )
    assert "QUALITY_MISMATCH" in evaluate_eligibility(listing(), mismatch, NOW)[1]
    unresolved = matched.model_copy(
        update={
            "demand": matched.demand.model_copy(
                update={"quality_requirements": {"unknown": QualityRequirement(expected="x")}}
            )
        }
    )
    state, reasons, _ = evaluate_eligibility(listing(), unresolved, NOW)
    assert state is CandidateState.UNAVAILABLE
    assert "QUALITY_REQUIRED_UNRESOLVED" in reasons
