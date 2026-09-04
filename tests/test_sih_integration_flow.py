from __future__ import annotations

import sys
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from pathlib import Path
from uuid import uuid4

# Ensure services are importable
root_path = Path(__file__).resolve().parent.parent
for svc in [
    "services/api",
    "services/matching-engine",
    "services/logistics-engine",
    "services/prediction-engine",
    "services/quality-engine",
    "services/market-engine",
    "services/transactions",
]:
    p = str(root_path / svc)
    if p not in sys.path:
        sys.path.insert(0, p)

from logistics_engine.models import (
    DataMode as LogisticsDataMode,
)
from logistics_engine.models import (
    DeliveryWindow,
    Geography,
    QuoteRequest,
)
from logistics_engine.service import LogisticsService
from matching_engine.models import (
    CandidateInput,
    Counterparty,
    Listing,
    LogisticsQuote,
    MatchingRequest,
    Offer,
    VerificationStatus,
)
from matching_engine.models import (
    DataMode as MatchingDataMode,
)
from matching_engine.service import MatchingService
from prediction_engine.models import DataMode as PredictionDataMode
from prediction_engine.models import PredictionQuery
from prediction_engine.repository import MemoryPredictionHistoryRepository
from prediction_engine.service import PredictionService
from quality_engine.models import (
    DataMode as QualityDataMode,
)
from quality_engine.models import (
    ImageMetadata,
    QualityRequest,
    ResultStatus,
)
from quality_engine.service import QualityService


def test_engines_direct_chain_integration() -> None:
    """Test the direct integration and data exchange between all 5 AgriNexis engines."""
    # 1. Prediction Engine: Price forecast under demo mode (1d and 3d horizons only)
    import asyncio
    now = datetime.now(UTC)
    repo = MemoryPredictionHistoryRepository()
    pred_svc = PredictionService(repo)
    crop_id = uuid4()
    variety_id = uuid4()
    pred_query = PredictionQuery(
        crop_id=crop_id,
        variety_id=variety_id,
        mandi_id=uuid4(),
        horizon_days=3,
        data_mode=PredictionDataMode.DEMO,
        dataset_id="sih-demo-market-v1",
    )
    pred_res = asyncio.run(pred_svc.forecast(pred_query, as_of=now, configuration_version="pred-v1"))
    assert pred_res.advisory.value in ("INSUFFICIENT_DATA", "SELL_NOW", "WAIT")
    assert pred_res.horizon_days == 3

    from matching_engine.models import PredictionEvidence
    pred_evidence = PredictionEvidence(
        advisory_type="PRICE_ONLY_ADVISORY",
        advisory=pred_res.advisory.value,
        direction=pred_res.direction.value,
        confidence=pred_res.confidence,
        warnings=list(pred_res.warnings),
        data_mode=MatchingDataMode(pred_res.data_mode.value),
        source=pred_res.source,
        dataset_id=pred_res.dataset_id,
        model_version=pred_res.model_version,
    )

    # 2. Logistics Engine: Quote calculation for Buyer A (distant) and Buyer B (local)
    from app.orchestration import get_default_logistics_configuration
    logistics_cfg = get_default_logistics_configuration()
    log_svc = LogisticsService(logistics_cfg)

    # Buyer A (Mumbai ~160km)
    quote_req_a = QuoteRequest(
        request_id=uuid4(),
        listing_id=uuid4(),
        origin=Geography(district="Pune", state="Maharashtra"),
        destination=Geography(district="Mumbai", state="Maharashtra"),
        quantity_kg=Decimal("1000.000"),
        delivery_window=DeliveryWindow(starts_on=now.date(), ends_on=now.date() + timedelta(days=3)),
        reference_distance_km=Decimal("160.000"),
        storage_days=1,
        no_storage_required=False,
        currency="INR",
        as_of=now,
        data_mode=LogisticsDataMode.DEMO,
        configuration_version=logistics_cfg.version,
    )
    res_a = asyncio.run(log_svc.quote(quote_req_a))
    assert res_a.total_applicable_cost > Decimal(0)

    # Buyer B (Pune ~25km)
    quote_req_b = QuoteRequest(
        request_id=uuid4(),
        listing_id=uuid4(),
        origin=Geography(district="Pune", state="Maharashtra"),
        destination=Geography(district="Pune", state="Maharashtra"),
        quantity_kg=Decimal("1000.000"),
        delivery_window=DeliveryWindow(starts_on=now.date(), ends_on=now.date() + timedelta(days=3)),
        reference_distance_km=Decimal("25.000"),
        storage_days=1,
        no_storage_required=False,
        currency="INR",
        as_of=now,
        data_mode=LogisticsDataMode.DEMO,
        configuration_version=logistics_cfg.version,
    )
    res_b = asyncio.run(log_svc.quote(quote_req_b))
    assert res_b.total_applicable_cost > Decimal(0)

    # 3. Quality Engine: Assistive AI visual inspection
    quality_svc = QualityService()
    dummy_meta = ImageMetadata(
        asset_id=uuid4(),
        mime_type="image/jpeg",
        size_bytes=2048,
        width_px=800,
        height_px=600,
        checksum_sha256="a" * 64,
        blur_score=0.1,
        visible_produce_area_ratio=0.8,
    )

    # Live mode is honestly UNAVAILABLE because no production model is deployed
    live_q_req = QualityRequest(
        request_id=uuid4(),
        listing_id=uuid4(),
        image=dummy_meta,
        crop="tomato",
        as_of=now,
        configuration_version="quality-v1",
        data_mode=QualityDataMode.LIVE,
    )
    live_q_res = quality_svc.assess(live_q_req)
    assert live_q_res.status == ResultStatus.UNAVAILABLE
    assert "NO_CONFIGURED_VISUAL_MODEL" in live_q_res.warnings

    # Demo mode returns deterministic inspection fixture
    demo_q_req = QualityRequest(
        request_id=uuid4(),
        listing_id=uuid4(),
        image=dummy_meta,
        crop="tomato",
        as_of=now,
        configuration_version="quality-v1",
        data_mode=QualityDataMode.DEMO,
    )
    demo_q_res = quality_svc.assess(demo_q_req)
    assert demo_q_res.status == ResultStatus.AVAILABLE
    assert demo_q_res.verification_status == "MANUAL_VERIFICATION_REQUIRED"
    assert demo_q_res.observations.visible_color_uniformity.value == "HIGH"

    # 4. Matching Engine: Net Farmer Realization (NFR) ranking
    matching_svc = MatchingService()
    listing_id = uuid4()
    farmer_id = uuid4()
    buyer_a_id = uuid4()
    buyer_b_id = uuid4()

    listing = Listing(
        id=listing_id,
        farmer_profile_id=farmer_id,
        crop_id=crop_id,
        variety_id=variety_id,
        available_quantity_kg=Decimal("1000.000"),
        unit="kg",
        available_from=now.date(),
        available_until=now.date() + timedelta(days=7),
        status="ACTIVE",
        version=1,
        quality_facts={},
    )

    # Candidate A: Buyer A Mumbai (Gross: ₹32,000, Costs: ₹6,500 -> NFR: ₹25,500)
    candidate_a = CandidateInput(
        offer=Offer(
            id=uuid4(),
            listing_id=listing_id,
            buyer_profile_id=buyer_a_id,
            quantity_kg=Decimal("1000.000"),
            unit_price_per_kg=Decimal("32.00"),
            unit="kg",
            currency="INR",
            expires_at=now + timedelta(days=2),
            status="PENDING",
            version=1,
        ),
        demand=None,
        quote=LogisticsQuote(
            id=uuid4(),
            listing_id=listing_id,
            transportation_cost=Decimal("5000.00"),
            storage_cost=Decimal("1000.00"),
            handling_cost=Decimal("500.00"),
            other_applicable_cost=Decimal("0.00"),
            total_applicable_cost=Decimal("6500.00"),
            currency="INR",
            distance_km=Decimal("160.000"),
            source_name="logistics-v1",
            data_mode=MatchingDataMode.DEMO,
            calculated_at=now,
            expires_at=now + timedelta(days=1),
        ),
        counterparty=Counterparty(
            buyer_profile_id=buyer_a_id,
            display_name="Buyer A Mumbai Fresh",
            verification_status=VerificationStatus.VERIFIED,
            active=True,
        ),
    )

    # Candidate B: Buyer B Pune (Gross: ₹31,000, Costs: ₹2,250 -> NFR: ₹28,750)
    candidate_b = CandidateInput(
        offer=Offer(
            id=uuid4(),
            listing_id=listing_id,
            buyer_profile_id=buyer_b_id,
            quantity_kg=Decimal("1000.000"),
            unit_price_per_kg=Decimal("31.00"),
            unit="kg",
            currency="INR",
            expires_at=now + timedelta(days=2),
            status="PENDING",
            version=1,
        ),
        demand=None,
        quote=LogisticsQuote(
            id=uuid4(),
            listing_id=listing_id,
            transportation_cost=Decimal("1500.00"),
            storage_cost=Decimal("300.00"),
            handling_cost=Decimal("450.00"),
            other_applicable_cost=Decimal("0.00"),
            total_applicable_cost=Decimal("2250.00"),
            currency="INR",
            distance_km=Decimal("25.000"),
            source_name="logistics-v1",
            data_mode=MatchingDataMode.DEMO,
            calculated_at=now,
            expires_at=now + timedelta(days=1),
        ),
        counterparty=Counterparty(
            buyer_profile_id=buyer_b_id,
            display_name="Buyer B Pune Mart",
            verification_status=VerificationStatus.VERIFIED,
            active=True,
        ),
    )

    match_req = MatchingRequest(
        listing=listing,
        candidates=[candidate_a, candidate_b],
        prediction=pred_evidence,
        market_reference=None,
        current_opportunity_only=False,
    )

    # Execute matching
    reco_result = asyncio.run(matching_svc.recommend(match_req, now, "matching-v1"))

    # Assert ranking
    assert len(reco_result.options) == 2
    assert reco_result.options[0].rank == 1
    assert reco_result.options[0].candidate_id == buyer_b_id
    assert reco_result.options[0].economics.net_farmer_realization == Decimal("28750.00")
    assert reco_result.options[0].economics.gross_selling_value == Decimal("31000.00")
    assert reco_result.options[0].economics.total_applicable_cost == Decimal("2250.00")

    assert reco_result.options[1].rank == 2
    assert reco_result.options[1].candidate_id == buyer_a_id
    assert reco_result.options[1].economics.net_farmer_realization == Decimal("25500.00")
    assert reco_result.options[1].economics.gross_selling_value == Decimal("32000.00")
    assert reco_result.options[1].economics.total_applicable_cost == Decimal("6500.00")

    # Prove SIH thesis: Buyer B net gain = +₹3,250 over Buyer A despite lower headline price
    net_gain = reco_result.options[0].economics.net_farmer_realization - reco_result.options[1].economics.net_farmer_realization
    assert net_gain == Decimal("3250.00")

    # Contract hardening: matching timing stays INSUFFICIENT_DATA without complete wait economics
    assert reco_result.sell_wait.value == "INSUFFICIENT_DATA"
    assert reco_result.timing_reason == "WAIT_ECONOMICS_UNAVAILABLE"
    assert reco_result.confidence is None

    # Transaction State Machine alignment: order CONFIRMED, payment PENDING, no escrow states
    from transactions.models import OrderStatus, PaymentStatus
    assert OrderStatus.CONFIRMED == "CONFIRMED"
    assert PaymentStatus.PENDING == "PENDING"
    assert "ESCROW_FUNDED" not in PaymentStatus.__members__
    assert "ESCROW_FUNDED" not in OrderStatus.__members__
