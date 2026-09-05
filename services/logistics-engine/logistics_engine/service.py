from __future__ import annotations

from decimal import ROUND_HALF_UP, Decimal

from .config import LaneTariff, LogisticsConfiguration
from .errors import failure
from .models import (
    DISTANCE_QUANTUM,
    MONEY_QUANTUM,
    CostComponent,
    ExplanationFact,
    QuoteRequest,
    QuoteResult,
)
from .routing import RoutingProvider, UnavailableRoutingProvider


def money(value: Decimal) -> Decimal:
    return value.quantize(MONEY_QUANTUM, rounding=ROUND_HALF_UP)


class LogisticsService:
    engine_version = "logistics-engine-v1"

    def __init__(
        self, configuration: LogisticsConfiguration, routing_provider: RoutingProvider | None = None
    ) -> None:
        self.configuration = configuration
        self.routing_provider = routing_provider or UnavailableRoutingProvider()

    def _lane(self, request: QuoteRequest) -> LaneTariff:
        values = (
            request.origin.district,
            request.origin.state,
            request.destination.district,
            request.destination.state,
        )
        key = tuple(value.casefold() for value in values)
        try:
            return next(lane for lane in self.configuration.lanes if lane.key == key)
        except StopIteration as exc:
            raise failure("LANE_NOT_CONFIGURED") from exc

    async def quote(self, request: QuoteRequest) -> QuoteResult:
        config = self.configuration
        if request.configuration_version != config.version:
            raise failure("CONFIGURATION_VERSION_MISMATCH")
        if request.currency != config.currency:
            raise failure("UNSUPPORTED_CURRENCY")
        if request.data_mode != config.data_mode:
            raise failure("PROVENANCE_NOT_AVAILABLE")
        lane = self._lane(request)
        distance = request.reference_distance_km
        distance_basis = "REQUEST_REFERENCE"
        if distance is None:
            distance = await self.routing_provider.distance_km(request.origin, request.destination)
            distance_basis = "ROUTING_PROVIDER"
        if distance is None:
            distance = lane.reference_distance_km
            distance_basis = "CONFIGURED_REFERENCE"
        if distance is None:
            raise failure("ROUTE_DATA_NOT_AVAILABLE")
        distance = distance.quantize(DISTANCE_QUANTUM, rounding=ROUND_HALF_UP)

        if lane.configured_transport_charge is not None:
            transport = money(lane.configured_transport_charge)
            rate_basis = "CONFIGURED_LANE_CHARGE"
        else:
            transport = money(
                max(
                    lane.minimum_transport_charge,
                    lane.base_transport_charge + lane.transport_rate_per_km * distance,
                )
            )
            rate_basis = "BASE_PLUS_DISTANCE_RATE"
        if request.no_storage_required:
            storage = Decimal("0.00")
            storage_basis = "NO_STORAGE_DECLARED"
        else:
            if request.storage_days is None or lane.storage_rate_per_kg_per_day is None:
                raise failure("STORAGE_RATE_NOT_AVAILABLE")
            storage = money(
                request.quantity_kg
                * lane.storage_rate_per_kg_per_day
                * Decimal(request.storage_days)
            )
            storage_basis = "QUANTITY_X_RATE_X_DAYS"

        components = [
            CostComponent(
                code="TRANSPORT_COMPONENT", amount=transport, source=lane.source, basis=rate_basis
            ),
            CostComponent(
                code="STORAGE_COMPONENT", amount=storage, source=lane.source, basis=storage_basis
            ),
        ]
        components.extend(
            CostComponent(
                code=charge.code,
                amount=charge.flat_amount,
                source=charge.source,
                basis="CONFIGURED_FLAT_CHARGE",
            )
            for charge in lane.handling_charges + lane.other_charges
        )
        handling = money(sum((item.flat_amount for item in lane.handling_charges), Decimal(0)))
        other = money(sum((item.flat_amount for item in lane.other_charges), Decimal(0)))
        total = money(transport + storage + handling + other)
        utilization = (request.quantity_kg / lane.capacity_kg).quantize(
            Decimal("0.0001"), rounding=ROUND_HALF_UP
        )
        warnings = [
            "CONFIGURED_ESTIMATE_NOT_LIVE",
            "QUOTED_QUANTITY_NOT_PERSISTABLE_IN_CURRENT_SCHEMA",
        ]
        if request.buyer_profile_id is not None or request.fpo_id is not None:
            warnings.append("DIRECT_COUNTERPARTY_NOT_PERSISTABLE_IN_CURRENT_QUOTE_SCHEMA")
        facts = [
            ExplanationFact(
                code="DISTANCE_KM", values={"value": format(distance, "f"), "basis": distance_basis}
            ),
            ExplanationFact(
                code="RATE_BASIS", values={"value": rate_basis, "vehicle_class": lane.vehicle_class}
            ),
            ExplanationFact(
                code="QUANTITY_KG",
                values={
                    "value": format(request.quantity_kg, "f"),
                    "capacity_utilization": format(utilization, "f"),
                },
            ),
            ExplanationFact(
                code="STORAGE_DAYS",
                values={"value": request.storage_days or 0, "basis": storage_basis},
            ),
            ExplanationFact(code="TRANSPORT_COMPONENT", values={"amount": format(transport, "f")}),
            ExplanationFact(code="STORAGE_COMPONENT", values={"amount": format(storage, "f")}),
            ExplanationFact(code="HANDLING_COMPONENT", values={"amount": format(handling, "f")}),
            ExplanationFact(code="OTHER_COMPONENT", values={"amount": format(other, "f")}),
        ]
        return QuoteResult(
            request_id=request.request_id,
            listing_id=request.listing_id,
            demand_id=request.demand_id,
            buyer_profile_id=request.buyer_profile_id,
            fpo_id=request.fpo_id,
            quoted_quantity_kg=request.quantity_kg,
            currency=request.currency,
            distance_km=distance,
            transportation_cost=transport,
            storage_cost=storage,
            handling_cost=handling,
            other_applicable_cost=other,
            total_applicable_cost=total,
            components=components,
            explanation_facts=facts,
            engine_version=self.engine_version,
            configuration_version=config.version,
            calculated_at=request.as_of,
            valid_from=request.as_of,
            valid_until=request.as_of + config.validity,
            data_mode=config.data_mode,
            source=config.source,
            warnings=warnings,
        )
