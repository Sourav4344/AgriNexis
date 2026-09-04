from __future__ import annotations

from datetime import datetime

from .economics import validate_quote_total
from .models import (
    CandidateInput,
    CandidateState,
    Listing,
    QualityMatchState,
    VerificationStatus,
)


def quality_compatibility(
    listing: Listing, candidate: CandidateInput
) -> tuple[QualityMatchState, list[str]]:
    demand = candidate.demand
    if demand is None or not demand.quality_requirements:
        return QualityMatchState.NOT_REQUIRED, []
    unresolved: list[str] = []
    mismatched: list[str] = []
    for key, requirement in sorted(demand.quality_requirements.items()):
        if key not in listing.quality_facts:
            if requirement.required:
                unresolved.append(key)
            continue
        if listing.quality_facts[key] != requirement.expected:
            mismatched.append(key)
    if mismatched:
        return QualityMatchState.MISMATCH, ["QUALITY_MISMATCH"]
    if unresolved:
        return QualityMatchState.UNRESOLVED, ["QUALITY_REQUIRED_UNRESOLVED"]
    return QualityMatchState.MATCH, []


def evaluate_eligibility(
    listing: Listing, candidate: CandidateInput, as_of: datetime
) -> tuple[CandidateState, list[str], QualityMatchState]:
    offer, demand, quote = candidate.offer, candidate.demand, candidate.quote
    reasons: list[str] = []
    today = as_of.date()
    if listing.deleted_at is not None:
        reasons.append("LISTING_DELETED")
    if listing.status != "ACTIVE":
        reasons.append("LISTING_NOT_ACTIVE")
    if listing.available_quantity_kg <= 0:
        reasons.append("LISTING_UNAVAILABLE")
    if today < listing.available_from or (
        listing.available_until is not None and today > listing.available_until
    ):
        reasons.append("LISTING_OUTSIDE_AVAILABILITY_WINDOW")
    if offer.listing_id != listing.id:
        reasons.append("OFFER_LISTING_MISMATCH")
    if offer.status != "PENDING":
        reasons.append("OFFER_NOT_PENDING")
    if offer.expires_at <= as_of:
        reasons.append("OFFER_EXPIRED")
    if offer.quantity_kg <= 0 or offer.quantity_kg > listing.available_quantity_kg:
        reasons.append("OFFER_QUANTITY_INVALID")
    counterparty = candidate.counterparty
    if (
        offer.buyer_profile_id != counterparty.buyer_profile_id
        or offer.fpo_id != counterparty.fpo_id
    ):
        reasons.append("COUNTERPARTY_IDENTITY_MISMATCH")
    if not counterparty.active:
        reasons.append("COUNTERPARTY_INACTIVE")
    if counterparty.verification_status is VerificationStatus.REJECTED:
        reasons.append("COUNTERPARTY_REJECTED")
    if demand is None and offer.demand_id is not None:
        reasons.append("DEMAND_MISSING")
    if demand is not None:
        if offer.demand_id != demand.id:
            reasons.append("OFFER_DEMAND_MISMATCH")
        if demand.buyer_profile_id != offer.buyer_profile_id or demand.fpo_id != offer.fpo_id:
            reasons.append("DEMAND_COUNTERPARTY_MISMATCH")
        if demand.crop_id != listing.crop_id:
            reasons.append("CROP_MISMATCH")
        if demand.variety_id is not None and demand.variety_id != listing.variety_id:
            reasons.append("VARIETY_MISMATCH")
        if demand.status not in {"ACTIVE", "PARTIALLY_FILLED"}:
            reasons.append("DEMAND_NOT_ACTIVE")
        if today < demand.delivery_from or today > demand.delivery_until:
            reasons.append("DEMAND_EXPIRED")
        remaining = demand.maximum_quantity_kg - demand.fulfilled_quantity_kg
        if offer.quantity_kg > remaining:
            reasons.append("DEMAND_REMAINING_QUANTITY_EXCEEDED")
        if offer.quantity_kg < demand.minimum_quantity_kg:
            reasons.append("DEMAND_MINIMUM_QUANTITY_NOT_MET")
        if demand.currency != offer.currency:
            reasons.append("CURRENCY_MISMATCH")
    quality_state, quality_reasons = quality_compatibility(listing, candidate)
    reasons.extend(quality_reasons)
    if reasons:
        state = (
            CandidateState.UNAVAILABLE
            if "QUALITY_REQUIRED_UNRESOLVED" in reasons
            else CandidateState.EXCLUDED
        )
        return state, sorted(set(reasons)), quality_state
    unavailable: list[str] = []
    if quote is None:
        unavailable.append("LOGISTICS_QUOTE_MISSING")
    else:
        if quote.listing_id != listing.id or quote.demand_id != offer.demand_id:
            unavailable.append("LOGISTICS_QUOTE_ASSOCIATION_MISMATCH")
        if quote.expires_at <= as_of:
            unavailable.append("LOGISTICS_QUOTE_EXPIRED")
        if quote.currency != offer.currency:
            unavailable.append("CURRENCY_MISMATCH")
        if not validate_quote_total(quote):
            unavailable.append("LOGISTICS_QUOTE_TOTAL_INVALID")
        if quote.data_mode is None:
            unavailable.append("CRITICAL_PROVENANCE_UNKNOWN")
    if unavailable:
        return CandidateState.UNAVAILABLE, sorted(set(unavailable)), quality_state
    return CandidateState.ELIGIBLE, [], quality_state
