from __future__ import annotations

from datetime import UTC, date, datetime, timedelta
from typing import Any
from uuid import UUID

import pytest

from market_engine.adapter import Agent4MarketEngineAdapter
from market_engine.config import MarketSettings
from market_engine.errors import (
    CropVarietyMismatch,
    MarketDataUnavailable,
    MarketSourceInvalid,
    MarketSourceUnavailable,
)
from market_engine.models import (
    ComparisonItem,
    DataMode,
    NormalizedMarketObservation,
    RawMarketRecord,
)
from market_engine.service import CACHE_WARNING, MarketService
from market_engine.sources.demo import DEMO_DATASET, DEMO_SOURCE, DEMO_WARNING

NOW = datetime(2026, 9, 4, 12, tzinfo=UTC)
CROP = UUID(int=1)
VARIETY = UUID(int=2)
MANDI = UUID(int=3)


def observation(
    mode: DataMode, age: timedelta = timedelta(minutes=5)
) -> NormalizedMarketObservation:
    return NormalizedMarketObservation(
        id=UUID(int=4),
        mandi_id=MANDI,
        crop_id=CROP,
        variety_id=VARIETY,
        min_price="28.00",
        modal_price="31.00",
        max_price="34.00",
        currency="INR",
        normalized_unit="kg",
        arrival_quantity="100.000",
        observed_at=NOW - age,
        fetched_at=NOW - age + timedelta(minutes=1),
        source_name=DEMO_SOURCE if mode == DataMode.DEMO else "TEST_PROVIDER",
        source_id="PRICE-1",
        provenance={},
        data_mode=mode,
        dataset_id=DEMO_DATASET if mode == DataMode.DEMO else "provider-v1",
        source_version="1",
        checksum="checksum",
        quality_flags=[],
    )


class MemoryRepository:
    def __init__(
        self,
        cached: NormalizedMarketObservation | None = None,
        demo: NormalizedMarketObservation | None = None,
    ) -> None:
        self.cached = cached
        self.demo = demo
        self.inserted: list[NormalizedMarketObservation] = []
        self.history: list[UUID] = []
        self.variety_crop = CROP

    async def resolve_crop(self, canonical_code: str) -> UUID | None:
        return CROP if canonical_code == "TOMATO" else None

    async def resolve_variety(self, canonical_name: str) -> tuple[UUID, UUID] | None:
        return (VARIETY, self.variety_crop) if canonical_name == "STANDARD" else None

    async def validate_crop_variety(self, crop_id: UUID, variety_id: UUID) -> bool:
        return crop_id == self.variety_crop and variety_id == VARIETY

    async def resolve_mandi(self, provider_name: str, external_id: str) -> UUID | None:
        return MANDI

    async def upsert_provider_mandi(
        self, provider_name: str, external_id: str, name: str, district: str | None, state: str
    ) -> UUID:
        return MANDI

    async def insert_observation(
        self, value: NormalizedMarketObservation
    ) -> tuple[NormalizedMarketObservation, bool]:
        stored = value.model_copy(update={"id": UUID(int=4)})
        self.inserted.append(stored)
        self.cached = stored
        return stored, True

    async def latest_genuine_observation(
        self, subject: dict[str, Any], as_of: datetime
    ) -> NormalizedMarketObservation | None:
        return self.cached

    async def latest_demo_observation(
        self, subject: dict[str, Any], dataset_id: str, as_of: datetime
    ) -> NormalizedMarketObservation | None:
        return self.demo

    async def create_history(
        self, value: NormalizedMarketObservation, price_date: date, version: str
    ) -> UUID:
        self.history.append(value.id or UUID(int=0))
        return UUID(int=5)

    async def market_history(
        self, crop_id: UUID, variety_id: UUID | None, mandi_ids: list[UUID], limit: int
    ) -> list[dict[str, Any]]:
        return []

    async def comparison(
        self, crop_id: UUID, variety_id: UUID | None, mandi_ids: list[UUID], as_of: datetime
    ) -> list[ComparisonItem]:
        return []


class Source:
    provider_name = "TEST_PROVIDER"

    def __init__(
        self, records: list[RawMarketRecord] | None = None, unavailable: bool = False
    ) -> None:
        self.records = records or []
        self.unavailable = unavailable

    async def fetch(self, subject: dict[str, Any], as_of: datetime) -> list[RawMarketRecord]:
        if self.unavailable:
            raise MarketSourceUnavailable("down")
        return self.records


def raw(**changes: object) -> RawMarketRecord:
    values: dict[str, object] = {
        "crop_code": "TOMATO",
        "variety_name": "STANDARD",
        "mandi_provider_name": "TEST_PROVIDER",
        "mandi_external_id": "M1",
        "mandi_name": "Pune",
        "state": "Maharashtra",
        "min_price": "28",
        "modal_price": "31",
        "max_price": "34",
        "price_unit": "INR/kg",
        "currency": "INR",
        "observed_at": NOW - timedelta(minutes=5),
        "fetched_at": NOW,
        "source_name": "TEST_PROVIDER",
        "source_id": "P1",
    }
    values.update(changes)
    return RawMarketRecord.model_validate(values)


def settings(demo: bool = False) -> MarketSettings:
    return MarketSettings(market_demo_fallback_enabled=demo)


@pytest.mark.asyncio
async def test_live_result_is_persisted_and_history_derived() -> None:
    repository = MemoryRepository()
    result = await MarketService(repository, settings(), Source([raw()])).observe_subject(
        {"crop_id": str(CROP)}, NOW
    )
    assert result.delivery_mode == DataMode.LIVE
    assert result.observation.data_mode == DataMode.LIVE
    assert len(repository.inserted) == len(repository.history) == 1


@pytest.mark.asyncio
async def test_provider_failure_delivers_stored_live_as_cached() -> None:
    stored = observation(DataMode.LIVE, timedelta(hours=4))
    result = await MarketService(
        MemoryRepository(cached=stored), settings(), Source(unavailable=True)
    ).observe_subject({"crop_id": str(CROP)}, NOW)
    assert result.delivery_mode == DataMode.CACHED
    assert result.observation.data_mode == DataMode.LIVE
    assert result.warnings == [CACHE_WARNING]


@pytest.mark.asyncio
async def test_provider_failure_then_demo_or_unavailable() -> None:
    demo = observation(DataMode.DEMO)
    result = await MarketService(
        MemoryRepository(demo=demo), settings(True), Source(unavailable=True)
    ).observe_subject({"crop_id": str(CROP)}, NOW)
    assert result.delivery_mode == DataMode.DEMO and result.warnings == [DEMO_WARNING]
    with pytest.raises(MarketDataUnavailable):
        await MarketService(
            MemoryRepository(), settings(), Source(unavailable=True)
        ).observe_subject({"crop_id": str(CROP)}, NOW)


@pytest.mark.asyncio
async def test_stale_cache_is_not_current_fallback() -> None:
    stale = observation(DataMode.LIVE, timedelta(hours=49))
    with pytest.raises(MarketDataUnavailable):
        await MarketService(MemoryRepository(cached=stale), settings()).observe_subject(
            {"crop_id": str(CROP)}, NOW
        )


@pytest.mark.asyncio
async def test_invalid_payload_does_not_silently_fallback() -> None:
    repository = MemoryRepository(cached=observation(DataMode.LIVE))
    service = MarketService(repository, settings(True), Source([raw(price_unit="unknown")]))
    with pytest.raises(MarketSourceInvalid):
        await service.observe_subject({"crop_id": str(CROP)}, NOW)


@pytest.mark.asyncio
async def test_crop_variety_mismatch() -> None:
    repository = MemoryRepository()
    repository.variety_crop = UUID(int=99)
    with pytest.raises(CropVarietyMismatch):
        await MarketService(repository, settings(), Source([raw()])).observe_subject(
            {"crop_id": str(CROP)}, NOW
        )


@pytest.mark.asyncio
async def test_agent4_adapter_shape_and_modes() -> None:
    class Result:
        def __init__(self, **values: Any) -> None:
            self.__dict__.update(values)

    class Request:
        request_id = UUID(int=10)
        as_of = NOW
        configuration_version = "test-v1"
        subject = {"crop_id": str(CROP)}

    adapter = Agent4MarketEngineAdapter(
        MarketService(MemoryRepository(cached=observation(DataMode.LIVE)), settings()), Result
    )
    result = await adapter.observe(Request())
    assert result.data_mode == "CACHED"
    assert result.payload["stored_data_mode"] == "LIVE"
    assert result.payload["configuration_version"] == "test-v1"
