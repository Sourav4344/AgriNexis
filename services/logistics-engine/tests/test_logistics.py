from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, date, datetime, timedelta
from decimal import Decimal
from typing import Any
from uuid import UUID

import pytest
from pydantic import ValidationError

from logistics_engine.adapter import Agent4LogisticsEngineAdapter
from logistics_engine.config import LogisticsConfiguration, demo_configuration
from logistics_engine.errors import LogisticsError
from logistics_engine.models import CostComponent, QuoteRequest, QuoteResult
from logistics_engine.service import LogisticsService, money

NOW = datetime(2026, 9, 3, 3, 30, tzinfo=UTC)


def uid(number: int) -> UUID:
    return UUID(f"00000000-0000-4000-8000-{number:012d}")


def request(destination: str = "Buyer B", **changes: object) -> QuoteRequest:
    values: dict[str, object] = {
        "request_id": uid(1),
        "as_of": NOW,
        "listing_id": uid(2),
        "demand_id": uid(3),
        "buyer_profile_id": uid(4),
        "quantity_kg": "1000",
        "origin": {"district": "Nashik", "state": "Maharashtra"},
        "destination": {"district": destination, "state": "Maharashtra"},
        "delivery_window": {"starts_on": date(2026, 9, 3), "ends_on": date(2026, 9, 4)},
        "configuration_version": "sih-demo-logistics-v1",
        "data_mode": "DEMO",
        "currency": "INR",
        "storage_days": 1,
    }
    values.update(changes)
    return QuoteRequest.model_validate(values)


async def quote(destination: str = "Buyer B", **changes: object) -> QuoteResult:
    return await LogisticsService(demo_configuration()).quote(request(destination, **changes))


@pytest.mark.asyncio
async def test_demo_buyer_a_exact_costs() -> None:
    result = await quote("Buyer A")
    assert (
        result.transportation_cost,
        result.storage_cost,
        result.handling_cost,
        result.other_applicable_cost,
        result.total_applicable_cost,
    ) == (
        Decimal("5500.00"),
        Decimal("500.00"),
        Decimal("300.00"),
        Decimal("200.00"),
        Decimal("6500.00"),
    )


@pytest.mark.asyncio
async def test_demo_buyer_b_exact_costs() -> None:
    result = await quote()
    assert (
        result.transportation_cost,
        result.storage_cost,
        result.handling_cost,
        result.other_applicable_cost,
        result.total_applicable_cost,
    ) == (
        Decimal("1500.00"),
        Decimal("300.00"),
        Decimal("300.00"),
        Decimal("150.00"),
        Decimal("2250.00"),
    )


@pytest.mark.asyncio
async def test_agent8_compatible_economics() -> None:
    result = await quote()
    assert money(Decimal("1000") * Decimal("31") - result.total_applicable_cost) == Decimal(
        "28750.00"
    )


@pytest.mark.asyncio
async def test_quantity_binding_is_explicit() -> None:
    result = await quote(quantity_kg="999.125")
    assert result.quoted_quantity_kg == Decimal("999.125")
    assert "QUOTED_QUANTITY_NOT_PERSISTABLE_IN_CURRENT_SCHEMA" in result.warnings


@pytest.mark.asyncio
async def test_counterparty_binding_is_explicit() -> None:
    result = await quote()
    assert result.buyer_profile_id == uid(4)
    assert "DIRECT_COUNTERPARTY_NOT_PERSISTABLE_IN_CURRENT_QUOTE_SCHEMA" in result.warnings


@pytest.mark.parametrize("field", ["quantity_kg", "reference_distance_km"])
def test_float_inputs_are_rejected(field: str) -> None:
    with pytest.raises(ValidationError):
        request(**{field: 1.25})


@pytest.mark.parametrize("value", ["NaN", "Infinity", "-Infinity"])
def test_nonfinite_quantity_is_rejected(value: str) -> None:
    with pytest.raises(ValidationError):
        request(quantity_kg=value)


@pytest.mark.parametrize("value", ["0", "-1"])
def test_nonpositive_quantity_is_rejected(value: str) -> None:
    with pytest.raises(ValidationError):
        request(quantity_kg=value)


def test_negative_distance_is_rejected() -> None:
    with pytest.raises(ValidationError):
        request(reference_distance_km="-1")


def test_round_half_up() -> None:
    assert money(Decimal("1.005")) == Decimal("1.01")


def test_component_rounds_and_rejects_negative() -> None:
    assert CostComponent(code="X", amount="1.005", source="S", basis="B").amount == Decimal("1.01")
    with pytest.raises(ValidationError):
        CostComponent(code="X", amount="-0.01", source="S", basis="B")


def result_fields() -> dict[str, Any]:
    return {
        "request_id": uid(1),
        "listing_id": uid(2),
        "quoted_quantity_kg": "1",
        "currency": "INR",
        "distance_km": "1",
        "transportation_cost": "1",
        "storage_cost": "1",
        "handling_cost": "1",
        "other_applicable_cost": "1",
        "total_applicable_cost": "4",
        "components": [],
        "explanation_facts": [],
        "engine_version": "v1",
        "configuration_version": "c1",
        "calculated_at": NOW,
        "valid_from": NOW,
        "valid_until": NOW + timedelta(hours=1),
        "data_mode": "DEMO",
        "source": "TEST",
    }


def test_quote_total_invariant() -> None:
    values = result_fields()
    values["total_applicable_cost"] = "1"
    with pytest.raises(ValidationError):
        QuoteResult.model_validate(values)


def test_quote_expiry() -> None:
    result = QuoteResult.model_validate(result_fields())
    with pytest.raises(LogisticsError, match="expired") as raised:
        result.assert_valid_at(result.valid_until)
    assert raised.value.code == "QUOTE_EXPIRED"


def test_invalid_validity_is_rejected() -> None:
    values = result_fields()
    values["valid_until"] = NOW
    with pytest.raises(ValidationError):
        QuoteResult.model_validate(values)


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "change,code",
    [
        ({"currency": "USD"}, "UNSUPPORTED_CURRENCY"),
        ({"configuration_version": "wrong"}, "CONFIGURATION_VERSION_MISMATCH"),
        ({"data_mode": "CACHED"}, "PROVENANCE_NOT_AVAILABLE"),
    ],
)
async def test_structured_contract_failures(change: dict[str, object], code: str) -> None:
    with pytest.raises(LogisticsError) as raised:
        await quote(**change)
    assert raised.value.code == code


@pytest.mark.asyncio
async def test_unknown_lane_is_structured() -> None:
    with pytest.raises(LogisticsError) as raised:
        await quote("Unknown")
    assert raised.value.code == "LANE_NOT_CONFIGURED"


@pytest.mark.asyncio
async def test_explicit_distance_wins() -> None:
    result = await quote(reference_distance_km="42.4567")
    assert result.distance_km == Decimal("42.457")
    assert result.explanation_facts[0].values["basis"] == "REQUEST_REFERENCE"


@pytest.mark.asyncio
async def test_configured_reference_distance_is_used() -> None:
    result = await quote()
    assert result.distance_km == Decimal("35.000")
    assert result.explanation_facts[0].values["basis"] == "CONFIGURED_REFERENCE"


class Router:
    async def distance_km(self, origin: object, destination: object) -> Decimal:
        return Decimal("44.4444")


@pytest.mark.asyncio
async def test_routing_provider_precedes_configured_reference() -> None:
    result = await LogisticsService(demo_configuration(), Router()).quote(request())
    assert result.distance_km == Decimal("44.444")


@pytest.mark.asyncio
async def test_route_unavailable_is_not_zero() -> None:
    config = demo_configuration()
    config.lanes[1].reference_distance_km = None
    with pytest.raises(LogisticsError) as raised:
        await LogisticsService(config).quote(request())
    assert raised.value.code == "ROUTE_DATA_NOT_AVAILABLE"


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "change_config,change_request", [(True, {}), (False, {"storage_days": None})]
)
async def test_storage_evidence_required(
    change_config: bool, change_request: dict[str, object]
) -> None:
    config = demo_configuration()
    if change_config:
        config.lanes[1].storage_rate_per_kg_per_day = None
    with pytest.raises(LogisticsError) as raised:
        await LogisticsService(config).quote(request(**change_request))
    assert raised.value.code == "STORAGE_RATE_NOT_AVAILABLE"


@pytest.mark.asyncio
async def test_explicit_no_storage_is_zero_with_reason() -> None:
    result = await quote(storage_days=None, no_storage_required=True)
    assert result.storage_cost == Decimal("0.00")
    assert result.explanation_facts[3].values["basis"] == "NO_STORAGE_DECLARED"


def test_no_storage_conflict_rejected() -> None:
    with pytest.raises(ValidationError):
        request(storage_days=2, no_storage_required=True)


def test_deterministic_configuration_cannot_claim_live() -> None:
    values = demo_configuration().model_dump(mode="json")
    values["data_mode"] = "LIVE"
    with pytest.raises(ValidationError):
        LogisticsConfiguration.model_validate(values)


def test_duplicate_lane_rejected() -> None:
    values = demo_configuration().model_dump(mode="json")
    values["lanes"].append(values["lanes"][0])
    with pytest.raises(ValidationError):
        LogisticsConfiguration.model_validate(values)


@pytest.mark.asyncio
async def test_deterministic_repeatability() -> None:
    assert await quote() == await quote()


@pytest.mark.asyncio
async def test_component_provenance_and_explanations() -> None:
    result = await quote()
    assert all(component.source for component in result.components)
    assert {fact.code for fact in result.explanation_facts} == {
        "DISTANCE_KM",
        "RATE_BASIS",
        "QUANTITY_KG",
        "STORAGE_DAYS",
        "TRANSPORT_COMPONENT",
        "STORAGE_COMPONENT",
        "HANDLING_COMPONENT",
        "OTHER_COMPONENT",
    }


@pytest.mark.asyncio
async def test_generic_distance_tariff_and_minimum() -> None:
    config = demo_configuration()
    lane = config.lanes[1]
    lane.configured_transport_charge = None
    lane.base_transport_charge = Decimal("100")
    lane.transport_rate_per_km = Decimal("10")
    lane.minimum_transport_charge = Decimal("500")
    result = await LogisticsService(config).quote(request(reference_distance_km="20"))
    assert result.transportation_cost == Decimal("500.00")


@dataclass
class AgentRequest:
    request_id: UUID
    as_of: datetime
    configuration_version: str
    subject: dict[str, Any]


@pytest.mark.asyncio
async def test_agent4_adapter_output() -> None:
    item = request()
    subject = item.model_dump(mode="json", exclude={"request_id", "as_of", "configuration_version"})
    adapter = Agent4LogisticsEngineAdapter(
        LogisticsService(demo_configuration()), result_factory=lambda **kwargs: kwargs
    )
    result = await adapter.quote(
        AgentRequest(item.request_id, item.as_of, item.configuration_version, subject)
    )
    assert result["confidence"] is None and result["data_mode"] == "DEMO"
    assert result["payload"]["quote"]["total_applicable_cost"] == "2250.00"


@pytest.mark.asyncio
async def test_adapter_sanitizes_validation_errors() -> None:
    adapter = Agent4LogisticsEngineAdapter(
        LogisticsService(demo_configuration()), result_factory=lambda **kwargs: kwargs
    )
    with pytest.raises(LogisticsError) as raised:
        await adapter.quote(AgentRequest(uid(1), NOW, "sih-demo-logistics-v1", {"secret": "bad"}))
    assert raised.value.code == "INVALID_REQUEST" and "secret" not in str(raised.value)
