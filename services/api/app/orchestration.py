from __future__ import annotations

import json
import logging
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from typing import Any, Literal
from uuid import UUID, uuid4

from logistics_engine.config import LaneTariff, LogisticsConfiguration, NamedCharge
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
    Demand,
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

from .database import Database
from .errors import ApiError
from .models import Principal, Role

logger = logging.getLogger("agrinexis.orchestration")


def get_default_logistics_configuration() -> LogisticsConfiguration:
    common_handling = [
        NamedCharge(code="LOADING_UNLOADING", flat_amount=Decimal("300"), source="SIH_DEMO_V1")
    ]
    lanes = [
        LaneTariff(
            origin_district="Pune",
            origin_state="Maharashtra",
            destination_district="Mumbai",
            destination_state="Maharashtra",
            reference_distance_km=Decimal("160"),
            capacity_kg=Decimal("1000"),
            vehicle_class="DEMO_LIGHT_COMMERCIAL",
            configured_transport_charge=Decimal("5500"),
            storage_rate_per_kg_per_day=Decimal("0.50"),
            handling_charges=common_handling,
            other_charges=[NamedCharge(code="DEMO_OTHER", flat_amount=Decimal("200"), source="SIH_DEMO_V1")],
            source="AGRINEXIS_DEMO",
        ),
        LaneTariff(
            origin_district="Pune",
            origin_state="Maharashtra",
            destination_district="Pune",
            destination_state="Maharashtra",
            reference_distance_km=Decimal("35"),
            capacity_kg=Decimal("1000"),
            vehicle_class="DEMO_LIGHT_COMMERCIAL",
            configured_transport_charge=Decimal("1500"),
            storage_rate_per_kg_per_day=Decimal("0.30"),
            handling_charges=common_handling,
            other_charges=[NamedCharge(code="DEMO_OTHER", flat_amount=Decimal("150"), source="SIH_DEMO_V1")],
            source="AGRINEXIS_DEMO",
        ),
        LaneTariff(
            origin_district="Nashik",
            origin_state="Maharashtra",
            destination_district="Buyer A",
            destination_state="Maharashtra",
            reference_distance_km=Decimal("160"),
            capacity_kg=Decimal("1000"),
            vehicle_class="DEMO_LIGHT_COMMERCIAL",
            configured_transport_charge=Decimal("5500"),
            storage_rate_per_kg_per_day=Decimal("0.50"),
            handling_charges=common_handling,
            other_charges=[NamedCharge(code="DEMO_OTHER", flat_amount=Decimal("200"), source="SIH_DEMO_V1")],
            source="AGRINEXIS_DEMO",
        ),
        LaneTariff(
            origin_district="Nashik",
            origin_state="Maharashtra",
            destination_district="Buyer B",
            destination_state="Maharashtra",
            reference_distance_km=Decimal("35"),
            capacity_kg=Decimal("1000"),
            vehicle_class="DEMO_LIGHT_COMMERCIAL",
            configured_transport_charge=Decimal("1500"),
            storage_rate_per_kg_per_day=Decimal("0.30"),
            handling_charges=common_handling,
            other_charges=[NamedCharge(code="DEMO_OTHER", flat_amount=Decimal("150"), source="SIH_DEMO_V1")],
            source="AGRINEXIS_DEMO",
        ),
    ]
    return LogisticsConfiguration(
        version="sih-demo-logistics-v1",
        currency="INR",
        data_mode=LogisticsDataMode.DEMO,
        source="AGRINEXIS_DEMO",
        validity_minutes=1620,
        lanes=lanes,
    )


async def resolve_or_create_quote(
    database: Database,
    listing_id: UUID,
    demand_id: UUID | None = None,
    origin_district: str | None = None,
    origin_state: str | None = None,
    dest_district: str | None = None,
    dest_state: str | None = None,
    quantity_kg: Decimal = Decimal("1000.000"),
    logistics_service: LogisticsService | None = None,
    as_of: datetime | None = None,
    no_storage_required: bool = False,
    storage_days: int | None = None,
    reference_distance_km: Decimal | None = None,
    data_mode: str = "DEMO",
) -> dict[str, Any]:
    if not origin_district or not origin_state:
        raise ApiError("ROUTE_DATA_NOT_AVAILABLE", "Origin geography unavailable", 400)
    if not dest_district or not dest_state:
        raise ApiError("ROUTE_DATA_NOT_AVAILABLE", "Destination geography unavailable", 400)

    l_svc = logistics_service or LogisticsService(get_default_logistics_configuration())
    calc_as_of = as_of or datetime.now(UTC)

    if database.configured:
        existing = await database.fetchrow(
            """select * from public.logistics_quotes
               where listing_id=$1 and ($2::uuid is null or demand_id=$2) and expires_at > $3
                 and data_mode = $4::public.data_mode
               order by created_at desc limit 1""",
            listing_id, demand_id, calc_as_of, data_mode,
        )
        if existing:
            return dict(existing)

    if data_mode == "LIVE":
        raise ApiError(
            "LOGISTICS_UNAVAILABLE",
            f"No live logistics quote available for route {origin_district} -> {dest_district}",
            400,
        )

    quote_req = QuoteRequest(
        request_id=uuid4(),
        listing_id=listing_id,
        demand_id=demand_id,
        origin=Geography(district=origin_district, state=origin_state),
        destination=Geography(district=dest_district, state=dest_state),
        quantity_kg=quantity_kg,
        delivery_window=DeliveryWindow(
            starts_on=calc_as_of.date(),
            ends_on=calc_as_of.date() + timedelta(days=3),
        ),
        no_storage_required=no_storage_required,
        storage_days=0 if no_storage_required else (storage_days or 1),
        reference_distance_km=reference_distance_km,
        currency="INR",
        as_of=calc_as_of,
        data_mode=LogisticsDataMode(data_mode) if data_mode in LogisticsDataMode._value2member_map_ else LogisticsDataMode.DEMO,
        configuration_version=l_svc.configuration.version,
    )
    res = await l_svc.quote(quote_req)
    quote_id = uuid4()
    quote_dict = {
        "id": quote_id,
        "listing_id": listing_id,
        "demand_id": demand_id,
        "transportation_cost": res.transportation_cost,
        "storage_cost": res.storage_cost,
        "handling_cost": res.handling_cost,
        "other_applicable_cost": res.other_applicable_cost,
        "total_applicable_cost": res.total_applicable_cost,
        "currency": res.currency,
        "distance_km": res.distance_km,
        "assumptions": {"method": "CONFIGURED_LANE_TARIFF"},
        "source_name": res.source,
        "data_mode": res.data_mode.value,
        "confidence": None,
        "dataset_id": "SIH-2026-TOMATO-V1",
        "source_version": "1.0",
        "checksum": f"quote-{quote_id}",
        "calculated_at": res.calculated_at,
        "expires_at": res.valid_until,
    }
    if database.configured:
        try:
            await database.fetchrow(
                """insert into public.logistics_quotes(
                     id, listing_id, demand_id, transportation_cost, storage_cost, handling_cost,
                     other_applicable_cost, total_applicable_cost, currency, distance_km, assumptions,
                     source_name, data_mode, confidence, dataset_id, source_version, checksum,
                     calculated_at, expires_at
                   ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::public.data_mode,$14,$15,$16,$17,$18,$19)
                   on conflict (id) do nothing returning *""",
                quote_dict["id"], quote_dict["listing_id"], quote_dict["demand_id"],
                quote_dict["transportation_cost"], quote_dict["storage_cost"], quote_dict["handling_cost"],
                quote_dict["other_applicable_cost"], quote_dict["total_applicable_cost"], quote_dict["currency"],
                quote_dict["distance_km"], json.dumps(quote_dict["assumptions"]), quote_dict["source_name"],
                quote_dict["data_mode"], quote_dict["confidence"], quote_dict["dataset_id"],
                quote_dict["source_version"], quote_dict["checksum"], quote_dict["calculated_at"], quote_dict["expires_at"],
            )
        except Exception as exc:
            logger.error("Failed to persist logistics quote to database: %s", exc)
            raise ApiError("PERSISTENCE_FAILED", f"Failed to persist logistics quote: {exc}", 500) from exc
    return quote_dict


async def generate_and_persist_recommendations(
    database: Database,
    listing_id: UUID,
    principal: Principal | None = None,
    request_id: UUID | None = None,
    as_of: datetime | None = None,
    horizon_days: Literal[1, 3] = 3,
    include_storage_scenarios: bool = True,
    matching_service: MatchingService | None = None,
    logistics_service: LogisticsService | None = None,
    prediction_service: Any = None,
    data_mode: str = "DEMO",
) -> list[dict[str, Any]]:
    m_svc = matching_service or MatchingService()
    l_svc = logistics_service or LogisticsService(get_default_logistics_configuration())
    _ = request_id
    calc_as_of = as_of or datetime.now(UTC)

    listing_row = await database.fetchrow(
        """select l.*, f.district as farmer_district, f.state as farmer_state
           from public.produce_listings l
           join public.farmer_profiles f on f.profile_id = l.farmer_profile_id
           where l.id = $1 and l.deleted_at is null""",
        listing_id,
    )
    if not listing_row:
        listing_row = await database.fetchrow(
            "select * from public.produce_listings where id = $1 and deleted_at is null", listing_id
        )
    if not listing_row:
        raise ApiError("NOT_FOUND", "Listing not found", 404)

    if principal is not None:
        is_owner = listing_row["farmer_profile_id"] == principal.profile_id
        if not is_owner and principal.role is not Role.ADMIN:
            raise ApiError("NOT_FOUND", "Listing not found", 404)

    listing_model = Listing(
        id=listing_row["id"],
        farmer_profile_id=listing_row["farmer_profile_id"],
        crop_id=listing_row["crop_id"],
        variety_id=listing_row.get("variety_id"),
        available_quantity_kg=Decimal(str(listing_row["available_quantity"])),
        unit="kg",
        available_from=listing_row["available_from"],
        available_until=listing_row.get("available_until"),
        status=listing_row["status"],
        version=listing_row["version"],
        quality_facts={},
    )

    offer_rows = await database.fetch(
        """select o.*,
                  coalesce(bp.organization_name, p.display_name, 'Buyer') as buyer_name,
                  bp.verification_status as buyer_verification_status,
                  d.delivery_district, d.delivery_state, d.minimum_quantity as demand_min_qty,
                  d.maximum_quantity as demand_max_qty, d.fulfilled_quantity as demand_fulfilled_qty,
                  d.delivery_from as demand_delivery_from, d.delivery_until as demand_delivery_until,
                  d.status as demand_status
           from public.offers o
           left join public.profiles p on p.id = o.buyer_profile_id
           left join public.buyer_profiles bp on bp.profile_id = o.buyer_profile_id
           left join public.buyer_demands d on d.id = o.demand_id
           where o.listing_id = $1 and o.status = 'PENDING' and o.expires_at > $2""",
        listing_id, calc_as_of,
    )

    candidates: list[CandidateInput] = []
    origin_dist = listing_row.get("district") or listing_row.get("farmer_district")
    origin_st = listing_row.get("state") or listing_row.get("farmer_state")
    if not origin_dist or not origin_st:
        raise ApiError("ROUTE_DATA_NOT_AVAILABLE", "Listing origin geography unavailable", 400)

    for r in offer_rows:
        offered_qty = Decimal(str(r["offered_quantity"]))
        unit_price = Decimal(str(r["unit_price"]))

        demand_model: Demand | None = None
        if r.get("demand_id") and r.get("demand_status"):
            demand_model = Demand(
                id=r["demand_id"],
                buyer_profile_id=r.get("buyer_profile_id"),
                fpo_id=r.get("fpo_id"),
                crop_id=listing_row["crop_id"],
                variety_id=listing_row.get("variety_id"),
                minimum_quantity_kg=Decimal(str(r["demand_min_qty"])),
                maximum_quantity_kg=Decimal(str(r["demand_max_qty"])),
                fulfilled_quantity_kg=Decimal(str(r.get("demand_fulfilled_qty") or "0")),
                unit="kg",
                delivery_from=r["demand_delivery_from"],
                delivery_until=r["demand_delivery_until"],
                currency=r["currency"],
                status=r["demand_status"],
            )

        dest_dist = r.get("delivery_district")
        dest_st = r.get("delivery_state")
        if not dest_dist or not dest_st:
            raise ApiError("ROUTE_DATA_NOT_AVAILABLE", f"Delivery geography unavailable for demand {r.get('demand_id')}", 400)

        quote_data = await resolve_or_create_quote(
            database=database,
            listing_id=listing_id,
            demand_id=r.get("demand_id"),
            origin_district=origin_dist,
            origin_state=origin_st,
            dest_district=dest_dist,
            dest_state=dest_st,
            quantity_kg=offered_qty,
            logistics_service=l_svc,
            as_of=calc_as_of,
            data_mode=data_mode,
        )

        logistics_quote_model = LogisticsQuote(
            id=quote_data["id"],
            listing_id=listing_id,
            demand_id=r.get("demand_id"),
            transportation_cost=Decimal(str(quote_data["transportation_cost"])),
            storage_cost=Decimal(str(quote_data["storage_cost"])),
            handling_cost=Decimal(str(quote_data["handling_cost"])),
            other_applicable_cost=Decimal(str(quote_data["other_applicable_cost"])),
            total_applicable_cost=Decimal(str(quote_data["total_applicable_cost"])),
            currency=quote_data["currency"],
            distance_km=Decimal(str(quote_data["distance_km"])) if quote_data.get("distance_km") is not None else None,
            source_name=quote_data["source_name"],
            data_mode=MatchingDataMode(quote_data["data_mode"]) if quote_data.get("data_mode") else MatchingDataMode.DEMO,
            confidence=None,
            dataset_id=quote_data.get("dataset_id"),
            source_version=quote_data.get("source_version"),
            checksum=quote_data.get("checksum"),
            calculated_at=quote_data["calculated_at"],
            expires_at=quote_data["expires_at"],
        )

        offer_model = Offer(
            id=r["id"],
            listing_id=listing_id,
            demand_id=r.get("demand_id"),
            buyer_profile_id=r.get("buyer_profile_id"),
            fpo_id=r.get("fpo_id"),
            quantity_kg=offered_qty,
            unit_price_per_kg=unit_price,
            unit="kg",
            currency=r["currency"],
            expires_at=r["expires_at"],
            status=r["status"],
            version=r["version"],
        )

        v_status_str = r.get("buyer_verification_status") or "UNVERIFIED"
        v_status = VerificationStatus(v_status_str) if v_status_str in VerificationStatus._value2member_map_ else VerificationStatus.UNVERIFIED

        counterparty = Counterparty(
            buyer_profile_id=r.get("buyer_profile_id"),
            fpo_id=r.get("fpo_id"),
            display_name=r.get("buyer_name") or "Buyer",
            verification_status=v_status,
            active=True,
        )

        candidates.append(
            CandidateInput(
                offer=offer_model,
                demand=demand_model,
                quote=logistics_quote_model,
                counterparty=counterparty,
            )
        )

    from matching_engine.models import PredictionEvidence
    from prediction_engine.models import DataMode as PredictionDataMode
    from prediction_engine.models import PredictionQuery
    from prediction_engine.repository import MemoryPredictionHistoryRepository
    from prediction_engine.service import PredictionService

    pred_svc = prediction_service
    if pred_svc is None:
        pred_svc = PredictionService(MemoryPredictionHistoryRepository())

    pred_evidence: PredictionEvidence | None = None
    try:
        mandi_uuid = listing_row.get("mandi_id") or UUID("32000000-0000-4000-8000-000000000001")
        p_query = PredictionQuery(
            crop_id=listing_row["crop_id"],
            variety_id=listing_row.get("variety_id"),
            mandi_id=mandi_uuid,
            horizon_days=horizon_days,
            data_mode=PredictionDataMode(data_mode) if data_mode in PredictionDataMode._value2member_map_ else PredictionDataMode.DEMO,
        )
        pred_res = await pred_svc.forecast(p_query, calc_as_of, "prediction-config-v1")
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
    except Exception as p_exc:
        logger.warning("Could not obtain prediction evidence: %s", p_exc)
        pred_evidence = None

    matching_request = MatchingRequest(
        listing=listing_model,
        candidates=candidates,
        prediction=pred_evidence,
        market_reference=None,
        current_opportunity_only=False,
    )

    reco_result = await m_svc.recommend(matching_request, calc_as_of, "matching-v1")
    raw_signal = reco_result.sell_wait.value
    db_sell_wait = raw_signal if raw_signal in ("SELL_NOW", "WAIT", "INSUFFICIENT_DATA") else "INSUFFICIENT_DATA"

    persisted_rows: list[dict[str, Any]] = []
    for option in reco_result.options:
        reco_id = uuid4()
        input_meta = {
            "offer_id": str(option.offer_id),
            "offer_version": option.offer_version,
            "listing_version": option.listing_version,
            "candidate_name": option.candidate_name,
            "coverage_class": option.coverage_class.value,
            "coverage_ratio": str(option.coverage_ratio),
            "distance_km": str(option.distance_km) if option.distance_km is not None else None,
            "timing_signal": raw_signal,
            "component_evidence": option.component_evidence,
            "warnings": option.warnings,
        }
        facts_json = [fact.model_dump(mode="json") for fact in option.explanation_facts]

        row_dict = {
            "id": reco_id,
            "farmer_profile_id": listing_row["farmer_profile_id"],
            "listing_id": listing_id,
            "candidate_buyer_profile_id": option.candidate_id if option.candidate_type == "BUYER" else None,
            "candidate_fpo_id": option.candidate_id if option.candidate_type == "FPO" else None,
            "candidate_mandi_id": None,
            "demand_id": option.demand_id,
            "logistics_quote_id": option.logistics_quote_id,
            "estimated_quantity_kg": option.quantity_kg,
            "estimated_unit_price_per_kg": option.unit_price_per_kg,
            "estimated_gross_selling_value": option.economics.gross_selling_value,
            "estimated_transportation_cost": option.economics.transportation_cost,
            "estimated_storage_cost": option.economics.storage_cost,
            "estimated_handling_cost": option.economics.handling_cost,
            "estimated_other_applicable_cost": option.economics.other_applicable_cost,
            "estimated_total_applicable_cost": option.economics.total_applicable_cost,
            "estimated_net_farmer_realization": option.economics.net_farmer_realization,
            "currency": option.currency,
            "rank": option.rank,
            "sell_wait": db_sell_wait,
            "timing_signal": raw_signal,
            "timing_reason": reco_result.timing_reason or "WAIT_ECONOMICS_UNAVAILABLE",
            "explanation_facts": facts_json,
            "confidence": None,
            "data_mode": option.data_mode.value,
            "source_name": option.source,
            "dataset_id": option.dataset_id or "SIH-2026-TOMATO-V1",
            "engine_version": m_svc.engine_version,
            "input_metadata": input_meta,
            "calculated_at": option.calculated_at,
            "expires_at": option.valid_until,
            "candidate_name": option.candidate_name,
            "distance_km": option.distance_km,
        }

        if database.configured:
            try:
                db_row = await database.fetchrow(
                    """insert into public.recommendations(
                         id, farmer_profile_id, listing_id, candidate_buyer_profile_id, candidate_fpo_id,
                         candidate_mandi_id, demand_id, logistics_quote_id, estimated_quantity_kg,
                         estimated_unit_price_per_kg, estimated_gross_selling_value,
                         estimated_transportation_cost, estimated_storage_cost, estimated_handling_cost,
                         estimated_other_applicable_cost, estimated_total_applicable_cost,
                         estimated_net_farmer_realization, currency, rank, sell_wait,
                         explanation_facts, confidence, data_mode, source_name, dataset_id,
                         engine_version, input_metadata, calculated_at, expires_at
                       ) values (
                         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
                         $17, $18, $19, $20, $21, $22, $23::public.data_mode, $24, $25, $26,
                         $27, $28, $29
                       )
                       on conflict (listing_id, engine_version, calculated_at, rank)
                       do update set
                         estimated_net_farmer_realization = excluded.estimated_net_farmer_realization,
                         explanation_facts = excluded.explanation_facts,
                         input_metadata = excluded.input_metadata
                       returning *""",
                    row_dict["id"], row_dict["farmer_profile_id"], row_dict["listing_id"],
                    row_dict["candidate_buyer_profile_id"], row_dict["candidate_fpo_id"],
                    row_dict["candidate_mandi_id"], row_dict["demand_id"], row_dict["logistics_quote_id"],
                    row_dict["estimated_quantity_kg"], row_dict["estimated_unit_price_per_kg"],
                    row_dict["estimated_gross_selling_value"], row_dict["estimated_transportation_cost"],
                    row_dict["estimated_storage_cost"], row_dict["estimated_handling_cost"],
                    row_dict["estimated_other_applicable_cost"], row_dict["estimated_total_applicable_cost"],
                    row_dict["estimated_net_farmer_realization"], row_dict["currency"], row_dict["rank"],
                    row_dict["sell_wait"], json.dumps(row_dict["explanation_facts"]), row_dict["confidence"],
                    row_dict["data_mode"], row_dict["source_name"], row_dict["dataset_id"],
                    row_dict["engine_version"], json.dumps(row_dict["input_metadata"]),
                    row_dict["calculated_at"], row_dict["expires_at"],
                )
                if db_row:
                    saved = dict(db_row)
                    saved["candidate_name"] = row_dict["candidate_name"]
                    saved["distance_km"] = row_dict["distance_km"]
                    persisted_rows.append(saved)
                else:
                    raise ApiError("PERSISTENCE_FAILED", "Failed to persist recommendation option to database", 500)
            except ApiError:
                raise
            except Exception as exc:
                logger.error("Failed to persist recommendation option to database: %s", exc)
                raise ApiError("PERSISTENCE_FAILED", f"Failed to persist recommendation option: {exc}", 500) from exc
        else:
            persisted_rows.append(row_dict)

    if persisted_rows:
        best = Decimal(str(persisted_rows[0]["estimated_net_farmer_realization"]))
        for r in persisted_rows:
            r["difference_from_best"] = best - Decimal(str(r["estimated_net_farmer_realization"]))
            if r["data_mode"] == "DEMO":
                r["data_warning"] = "DEMO DATA — NOT LIVE GOVERNMENT DATA"

    return persisted_rows

