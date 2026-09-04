from __future__ import annotations

from datetime import datetime
from decimal import ROUND_HALF_UP, Decimal

from .economics import calculate_economics
from .eligibility import evaluate_eligibility
from .models import (
    CandidateFailure,
    CandidateState,
    CoverageClass,
    DataMode,
    ExplanationFact,
    MatchingRequest,
    RankedOption,
    RecommendationResult,
    SellWait,
    VerificationStatus,
)
from .provenance import propagate_data_mode
from .ranking import rank_options


class MatchingService:
    engine_version = "matching-engine-v1"
    source = "AGRINEXIS_MATCHING_ENGINE"

    async def recommend(
        self, request: MatchingRequest, as_of: datetime, configuration_version: str
    ) -> RecommendationResult:
        if as_of.tzinfo is None or as_of.utcoffset() is None:
            raise ValueError("as_of must be timezone-aware")
        eligible: list[RankedOption] = []
        failures: list[CandidateFailure] = []
        common_warnings: list[str] = []
        if request.prediction is None:
            common_warnings.append("PREDICTION_UNAVAILABLE")
        else:
            common_warnings.extend(request.prediction.warnings)
            if request.prediction.advisory == "INSUFFICIENT_DATA":
                common_warnings.append("PREDICTION_UNAVAILABLE")
        if request.market_reference is None:
            common_warnings.append("MARKET_REFERENCE_UNAVAILABLE")

        for candidate in request.candidates:
            state, reasons, quality_state = evaluate_eligibility(request.listing, candidate, as_of)
            if state is not CandidateState.ELIGIBLE:
                failures.append(
                    CandidateFailure(offer_id=candidate.offer.id, state=state, reasons=reasons)
                )
                continue
            quote = candidate.quote
            assert quote is not None
            offer = candidate.offer
            economics = calculate_economics(offer.quantity_kg, offer.unit_price_per_kg, quote)
            coverage_ratio = (offer.quantity_kg / request.listing.available_quantity_kg).quantize(
                Decimal("0.000001"), rounding=ROUND_HALF_UP
            )
            coverage_class = (
                CoverageClass.FULL_LOT
                if offer.quantity_kg == request.listing.available_quantity_kg
                else CoverageClass.PARTIAL_LOT
            )
            counterparty = candidate.counterparty
            candidate_id = counterparty.buyer_profile_id or counterparty.fpo_id
            assert candidate_id is not None
            modes: list[DataMode | None] = [quote.data_mode]
            if request.prediction is not None:
                modes.append(request.prediction.data_mode)
            if request.market_reference is not None:
                modes.append(request.market_reference.data_mode)
            mode = propagate_data_mode(modes)
            if mode is None:
                failures.append(
                    CandidateFailure(
                        offer_id=offer.id,
                        state=CandidateState.UNAVAILABLE,
                        reasons=["CRITICAL_PROVENANCE_UNKNOWN"],
                    )
                )
                continue
            warnings = list(common_warnings)
            facts = [ExplanationFact(code=coverage_class.value)]
            if counterparty.verification_status is VerificationStatus.VERIFIED:
                facts.append(ExplanationFact(code="BUYER_VERIFIED"))
            else:
                facts.append(ExplanationFact(code="BUYER_UNVERIFIED"))
                warnings.append("COUNTERPARTY_NOT_VERIFIED")
            if mode is DataMode.DEMO:
                facts.append(ExplanationFact(code="DEMO_DATA"))
            if request.prediction is not None:
                facts.append(
                    ExplanationFact(
                        code="PRICE_ONLY_ADVISORY",
                        values={
                            "advisory": request.prediction.advisory,
                            "direction": request.prediction.direction,
                        },
                    )
                )
            facts.append(ExplanationFact(code="WAIT_ECONOMICS_UNAVAILABLE"))
            eligible.append(
                RankedOption(
                    rank=1,
                    candidate_type="BUYER" if counterparty.buyer_profile_id else "FPO",
                    candidate_id=candidate_id,
                    candidate_name=counterparty.display_name,
                    offer_id=offer.id,
                    demand_id=offer.demand_id,
                    logistics_quote_id=quote.id,
                    listing_id=request.listing.id,
                    listing_version=request.listing.version,
                    offer_version=offer.version,
                    quantity_kg=offer.quantity_kg,
                    listing_available_quantity_kg=request.listing.available_quantity_kg,
                    coverage_class=coverage_class,
                    coverage_ratio=coverage_ratio,
                    coverage_percent=(coverage_ratio * Decimal(100)).quantize(
                        Decimal("0.01"), rounding=ROUND_HALF_UP
                    ),
                    unit_price_per_kg=offer.unit_price_per_kg,
                    currency=offer.currency,
                    economics=economics,
                    distance_km=quote.distance_km,
                    verification_status=counterparty.verification_status,
                    quality_match_state=quality_state,
                    data_mode=mode,
                    source=quote.source_name,
                    dataset_id=quote.dataset_id,
                    source_version=quote.source_version,
                    checksum=quote.checksum,
                    calculated_at=as_of,
                    valid_until=min(offer.expires_at, quote.expires_at),
                    component_evidence={
                        "logistics_confidence": quote.confidence,
                        "prediction_confidence": (
                            request.prediction.confidence if request.prediction else None
                        ),
                        "quality_confidence": None,
                        "configuration_version": configuration_version,
                        "listing_version": request.listing.version,
                        "offer_version": offer.version,
                    },
                    explanation_facts=facts,
                    warnings=sorted(set(warnings)),
                )
            )
        ranked = rank_options(eligible)
        if ranked:
            winner = ranked[0]
            winner.explanation_facts.append(ExplanationFact(code="HIGHER_NET_REALIZATION"))
            if any(
                item.economics.gross_selling_value > winner.economics.gross_selling_value
                and item.economics.net_farmer_realization < winner.economics.net_farmer_realization
                for item in ranked[1:]
            ):
                winner.explanation_facts.append(ExplanationFact(code="HIGHER_GROSS_LOWER_NFR"))
            if any(
                item.economics.total_applicable_cost > winner.economics.total_applicable_cost
                for item in ranked[1:]
            ):
                winner.explanation_facts.append(ExplanationFact(code="LOWER_TOTAL_COST"))
        all_modes = [item.data_mode for item in ranked]
        result_mode = propagate_data_mode(all_modes)
        result_warnings = sorted(set(common_warnings + ["WAIT_ECONOMICS_UNAVAILABLE"]))
        if not ranked:
            result_warnings.append("NO_ELIGIBLE_ACTIONABLE_OFFERS")
        return RecommendationResult(
            listing_id=request.listing.id,
            options=ranked,
            failures=failures,
            best_offer_id=ranked[0].offer_id if ranked else None,
            timing_decision=SellWait.INSUFFICIENT_DATA,
            timing_reason="WAIT_ECONOMICS_UNAVAILABLE",
            sell_wait=SellWait.INSUFFICIENT_DATA,
            confidence=None,
            data_mode=result_mode,
            source=self.source,
            calculated_at=as_of,
            warnings=sorted(set(result_warnings)),
            explanation_facts=[ExplanationFact(code="WAIT_ECONOMICS_UNAVAILABLE")],
        )
