from __future__ import annotations

from datetime import timedelta
from decimal import Decimal

import pytest

from matching_engine.models import DataMode, MatchingRequest, PredictionEvidence, SellWait
from matching_engine.service import MatchingService

from .helpers import NOW, candidate, fpo_candidate, listing, uid


async def run(*items: object, **changes: object):  # type: ignore[no-untyped-def]
    request = MatchingRequest(
        listing=listing(),
        candidates=list(items),  # type: ignore[arg-type]
        **changes,
    )
    return await MatchingService().recommend(request, NOW, "test-v1")


@pytest.mark.asyncio
async def test_canonical_demo_buyer_b_ranks_above_higher_gross_buyer_a() -> None:
    buyer_a = candidate(
        100,
        offer__unit_price_per_kg="32",
        quote__transportation_cost="5500",
        quote__storage_cost="500",
        quote__handling_cost="300",
        quote__other_applicable_cost="200",
        quote__total_applicable_cost="6500",
        quote__distance_km="160",
        quote__data_mode="DEMO",
        quote__dataset_id="SIH-2026-TOMATO-V1",
        counterparty__display_name="Buyer A",
    )
    buyer_b = candidate(
        200,
        quote__data_mode="DEMO",
        quote__dataset_id="SIH-2026-TOMATO-V1",
        counterparty__display_name="Buyer B",
    )
    result = await run(buyer_a, buyer_b)
    assert [item.candidate_name for item in result.options] == ["Buyer B", "Buyer A"]
    assert result.options[0].economics.net_farmer_realization == Decimal("28750.00")
    assert result.options[1].economics.gross_selling_value == Decimal("32000.00")
    assert result.options[1].economics.net_farmer_realization == Decimal("25500.00")
    assert result.options[0].economics.net_farmer_realization_per_kg == Decimal("28.750000")
    assert result.data_mode is DataMode.DEMO
    assert result.best_offer_id == buyer_b.offer.id
    assert result.timing_decision is SellWait.INSUFFICIENT_DATA
    assert result.timing_reason == "WAIT_ECONOMICS_UNAVAILABLE"
    assert "HIGHER_GROSS_LOWER_NFR" in {fact.code for fact in result.options[0].explanation_facts}


@pytest.mark.asyncio
async def test_full_lot_precedes_partial_even_with_higher_partial_rate() -> None:
    full = candidate(10, offer__unit_price_per_kg="20", quote__total_applicable_cost="2250")
    partial = candidate(
        20,
        offer__quantity_kg="500",
        offer__unit_price_per_kg="40",
        demand__maximum_quantity_kg="500",
        quote__total_applicable_cost="2250",
    )
    result = await run(partial, full)
    assert result.options[0].coverage_class.value == "FULL_LOT"
    assert result.options[1].coverage_ratio == Decimal("0.500000")
    assert result.options[1].coverage_percent == Decimal("50.00")


@pytest.mark.asyncio
async def test_different_partial_quantities_use_nfr_per_kg() -> None:
    larger = candidate(
        10,
        offer__quantity_kg="800",
        offer__unit_price_per_kg="20",
        demand__maximum_quantity_kg="800",
    )
    smaller = candidate(
        20,
        offer__quantity_kg="500",
        offer__unit_price_per_kg="30",
        demand__maximum_quantity_kg="500",
    )
    result = await run(larger, smaller)
    assert result.options[0].offer_id == smaller.offer.id


@pytest.mark.asyncio
async def test_equal_quantities_use_absolute_nfr() -> None:
    lower = candidate(10, offer__quantity_kg="500", demand__maximum_quantity_kg="500")
    higher = candidate(
        20,
        offer__quantity_kg="500",
        offer__unit_price_per_kg="32",
        demand__maximum_quantity_kg="500",
    )
    result = await run(lower, higher)
    assert result.options[0].offer_id == higher.offer.id


@pytest.mark.asyncio
async def test_ties_use_verification_then_uuid_and_missing_distance_is_not_zero() -> None:
    unverified = candidate(
        30,
        quote__distance_km=None,
        counterparty__verification_status="UNVERIFIED",
    )
    verified = candidate(20, quote__distance_km="999")
    result = await run(unverified, verified)
    assert result.options[0].offer_id == verified.offer.id
    assert "COUNTERPARTY_NOT_VERIFIED" in result.options[1].warnings
    first = candidate(10, quote__distance_km=None)
    second = candidate(20, quote__distance_km="1")
    tied = await run(second, first)
    assert tied.options[0].candidate_id == min(
        first.counterparty.buyer_profile_id, second.counterparty.buyer_profile_id
    )  # type: ignore[type-var]


@pytest.mark.asyncio
async def test_prediction_wait_does_not_change_ranking_or_final_timing() -> None:
    prediction = PredictionEvidence(
        advisory="WAIT",
        direction="RISING",
        data_mode="LIVE",
        warnings=[],
    )
    result = await run(candidate(), prediction=prediction)
    assert result.options
    assert result.sell_wait is SellWait.INSUFFICIENT_DATA
    assert result.timing_decision is SellWait.INSUFFICIENT_DATA
    assert "WAIT_ECONOMICS_UNAVAILABLE" in result.warnings


@pytest.mark.asyncio
async def test_prediction_sell_now_does_not_override_final_timing() -> None:
    prediction = PredictionEvidence(
        advisory="SELL_NOW",
        direction="FALLING",
        data_mode="LIVE",
        warnings=[],
    )
    result = await run(candidate(), prediction=prediction)
    assert result.options[0].rank == 1
    assert result.timing_decision is SellWait.INSUFFICIENT_DATA
    assert result.timing_reason == "WAIT_ECONOMICS_UNAVAILABLE"


@pytest.mark.asyncio
async def test_demo_insufficient_prediction_and_cached_propagation() -> None:
    prediction = PredictionEvidence(
        advisory="INSUFFICIENT_DATA",
        direction="INSUFFICIENT_DATA",
        data_mode="DEMO",
        warnings=["INSUFFICIENT_HISTORY"],
    )
    demo = await run(candidate(quote__data_mode="LIVE"), prediction=prediction)
    assert demo.data_mode is DataMode.DEMO
    assert demo.options
    cached = await run(candidate(quote__data_mode="CACHED"))
    assert cached.data_mode is DataMode.CACHED
    live = await run(candidate())
    assert live.data_mode is DataMode.LIVE


@pytest.mark.asyncio
async def test_unknown_critical_provenance_is_unavailable_and_confidence_is_none() -> None:
    result = await run(candidate(quote__data_mode=None))
    assert not result.options
    assert "CRITICAL_PROVENANCE_UNKNOWN" in result.failures[0].reasons
    assert result.data_mode is None
    assert result.confidence is None


@pytest.mark.asyncio
@pytest.mark.parametrize("current_opportunity_only", [False, True])
async def test_no_request_mode_can_emit_sell_now_without_wait_economics(
    current_opportunity_only: bool,
) -> None:
    result = await run(candidate(), current_opportunity_only=current_opportunity_only)
    assert result.options[0].rank == 1
    assert result.best_offer_id == candidate().offer.id
    assert result.timing_decision is SellWait.INSUFFICIENT_DATA
    assert result.sell_wait is SellWait.INSUFFICIENT_DATA
    assert result.timing_reason == "WAIT_ECONOMICS_UNAVAILABLE"
    assert "WAIT_ECONOMICS_UNAVAILABLE" in result.warnings


@pytest.mark.asyncio
async def test_fpo_candidate_is_supported() -> None:
    result = await run(fpo_candidate())
    assert result.options[0].candidate_type == "FPO"


@pytest.mark.asyncio
async def test_expiry_tie_break_and_structured_acceptance_references() -> None:
    later = candidate(20, offer__expires_at=NOW + timedelta(days=2))
    earlier = candidate(10, offer__expires_at=NOW + timedelta(hours=2))
    result = await run(later, earlier)
    option = result.options[0]
    assert option.offer_id == earlier.offer.id
    assert option.listing_id == uid(1)
    assert option.logistics_quote_id == earlier.quote.id  # type: ignore[union-attr]
    assert option.currency == "INR"
    assert option.economics.total_applicable_cost == Decimal("2250.00")
