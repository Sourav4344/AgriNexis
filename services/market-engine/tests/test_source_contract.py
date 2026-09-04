from datetime import UTC, datetime

import pytest

from market_engine.errors import (
    MarketConfigurationError,
    MarketSourceInvalid,
    MarketSourceUnavailable,
)
from market_engine.sources.configured import (
    ConfiguredMarketSource,
    ProviderAuthenticationError,
    ProviderRateLimitError,
    ProviderServerError,
    ProviderTimeoutError,
)


def valid_payload() -> dict[str, object]:
    return {
        "crop_code": "TOMATO",
        "mandi_provider_name": "TEST_PROVIDER",
        "mandi_external_id": "1",
        "mandi_name": "Pune",
        "state": "Maharashtra",
        "min_price": "28",
        "modal_price": "31",
        "max_price": "34",
        "price_unit": "INR/kg",
        "currency": "INR",
        "observed_at": "2026-09-04T09:00:00Z",
        "fetched_at": "2026-09-04T09:05:00Z",
        "source_name": "TEST_PROVIDER",
    }


@pytest.mark.asyncio
async def test_valid_and_empty_payload() -> None:
    async def fetch_valid(subject: dict[str, object], as_of: datetime) -> list[dict[str, object]]:
        return [valid_payload()]

    source = ConfiguredMarketSource("TEST_PROVIDER", fetch_valid)
    assert len(await source.fetch({}, datetime.now(UTC))) == 1

    async def fetch_empty(subject: dict[str, object], as_of: datetime) -> list[dict[str, object]]:
        return []

    assert (
        await ConfiguredMarketSource("TEST_PROVIDER", fetch_empty).fetch({}, datetime.now(UTC))
        == []
    )


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "change",
    [
        {"modal_price": "bad"},
        {"observed_at": "bad"},
        {"source_name": "OTHER"},
    ],
)
async def test_malformed_and_schema_drift(change: dict[str, object]) -> None:
    async def fetch(subject: dict[str, object], as_of: datetime) -> list[dict[str, object]]:
        payload = valid_payload()
        payload.update(change)
        return [payload]

    with pytest.raises(MarketSourceInvalid):
        await ConfiguredMarketSource("TEST_PROVIDER", fetch).fetch({}, datetime.now(UTC))


@pytest.mark.asyncio
async def test_missing_required_field() -> None:
    async def fetch(subject: dict[str, object], as_of: datetime) -> list[dict[str, object]]:
        payload = valid_payload()
        del payload["crop_code"]
        return [payload]

    with pytest.raises(MarketSourceInvalid):
        await ConfiguredMarketSource("TEST_PROVIDER", fetch).fetch({}, datetime.now(UTC))


@pytest.mark.asyncio
@pytest.mark.parametrize("error", [TimeoutError(), ConnectionError()])
async def test_transport_failure_mapping(error: Exception) -> None:
    async def fetch(subject: dict[str, object], as_of: datetime) -> list[dict[str, object]]:
        raise error

    with pytest.raises(MarketSourceUnavailable):
        await ConfiguredMarketSource("TEST_PROVIDER", fetch).fetch({}, datetime.now(UTC))


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "error",
    [ProviderTimeoutError(), ProviderRateLimitError(), ProviderServerError()],
)
async def test_provider_retryable_failure_mapping(error: Exception) -> None:
    async def fetch(subject: dict[str, object], as_of: datetime) -> list[dict[str, object]]:
        raise error

    with pytest.raises(MarketSourceUnavailable):
        await ConfiguredMarketSource("TEST_PROVIDER", fetch).fetch({}, datetime.now(UTC))


@pytest.mark.asyncio
async def test_provider_auth_failure_is_configuration_error() -> None:
    async def fetch(subject: dict[str, object], as_of: datetime) -> list[dict[str, object]]:
        raise ProviderAuthenticationError

    with pytest.raises(MarketConfigurationError):
        await ConfiguredMarketSource("TEST_PROVIDER", fetch).fetch({}, datetime.now(UTC))
