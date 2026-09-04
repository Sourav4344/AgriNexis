from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Any

from .config import MarketSettings
from .errors import (
    CropVarietyMismatch,
    MarketDataUnavailable,
    MarketSourceUnavailable,
    UnknownCrop,
    UnknownVariety,
)
from .freshness import FreshnessClass, FreshnessPolicy
from .history import HISTORY_TRANSFORMATION_VERSION, history_date
from .models import DataMode, DeliveredMarketResult, NormalizedMarketObservation, RawMarketRecord
from .normalization import normalize_record
from .repositories.protocol import MarketRepository
from .sources.demo import DEMO_WARNING, DemoMarketSource
from .sources.protocol import MarketSource

logger = logging.getLogger("agrinexis.market_engine")
CACHE_WARNING = "Live market provider unavailable or bypassed; returning cached observation"


class MarketService:
    def __init__(
        self,
        repository: MarketRepository,
        settings: MarketSettings,
        source: MarketSource | None = None,
        demo_source: DemoMarketSource | None = None,
    ) -> None:
        self.repository = repository
        self.settings = settings
        self.source = source
        self.demo_source = demo_source or DemoMarketSource(repository)
        self.freshness = FreshnessPolicy(
            timedelta(minutes=settings.market_live_max_age_minutes),
            timedelta(hours=settings.market_cache_max_age_hours),
        )

    async def _normalize_and_persist(
        self, raw: RawMarketRecord
    ) -> tuple[NormalizedMarketObservation, bool]:
        crop_id = await self.repository.resolve_crop(raw.crop_code)
        if crop_id is None:
            raise UnknownCrop("market record references an unknown crop")
        variety_id = None
        if raw.variety_name is not None:
            variety = await self.repository.resolve_variety(raw.variety_name)
            if variety is None:
                raise UnknownVariety("market record references an unknown crop variety")
            variety_id, variety_crop_id = variety
            if variety_crop_id != crop_id or not await self.repository.validate_crop_variety(
                crop_id, variety_id
            ):
                raise CropVarietyMismatch("market variety does not belong to the selected crop")
        mandi_id = await self.repository.resolve_mandi(
            raw.mandi_provider_name, raw.mandi_external_id
        )
        if mandi_id is None:
            mandi_id = await self.repository.upsert_provider_mandi(
                raw.mandi_provider_name,
                raw.mandi_external_id,
                raw.mandi_name,
                raw.district,
                raw.state,
            )
        observation = normalize_record(
            raw, mandi_id=mandi_id, crop_id=crop_id, variety_id=variety_id
        )
        persisted, created = await self.repository.insert_observation(observation)
        await self.repository.create_history(
            persisted,
            history_date(persisted.observed_at, self.settings.market_source_timezone),
            HISTORY_TRANSFORMATION_VERSION,
        )
        logger.info(
            "market_observation_persisted",
            extra={
                "provider": persisted.source_name,
                "created": created,
                "data_mode": persisted.data_mode.value,
            },
        )
        return persisted, created

    def _deliver(
        self,
        observation: NormalizedMarketObservation,
        mode: DataMode,
        as_of: datetime,
        warnings: list[str] | None = None,
    ) -> DeliveredMarketResult:
        if observation.data_mode == DataMode.DEMO and mode != DataMode.DEMO:
            raise MarketDataUnavailable("DEMO observations cannot be mode-laundered")
        age = self.freshness.age_seconds(observation.observed_at, as_of)
        logger.info(
            "market_delivery_selected",
            extra={
                "provider": observation.source_name,
                "data_mode": mode.value,
                "age_seconds": age,
            },
        )
        return DeliveredMarketResult(
            observation=observation,
            delivery_mode=mode,
            calculated_at=as_of,
            source_age_seconds=age,
            warnings=warnings or [],
        )

    async def _fallback(self, subject: dict[str, Any], as_of: datetime) -> DeliveredMarketResult:
        cached = await self.repository.latest_genuine_observation(subject, as_of)
        if (
            cached is not None
            and self.freshness.classify(cached.observed_at, as_of, cached.data_mode)
            != FreshnessClass.STALE
        ):
            return self._deliver(cached, DataMode.CACHED, as_of, [CACHE_WARNING])
        if self.settings.market_demo_fallback_enabled:
            demo = await self.demo_source.resolve(subject, as_of)
            if demo is not None:
                return self._deliver(demo, DataMode.DEMO, as_of, [DEMO_WARNING])
        raise MarketDataUnavailable("no eligible market observation is available")

    async def observe_subject(
        self, subject: dict[str, Any], as_of: datetime
    ) -> DeliveredMarketResult:
        if as_of.tzinfo is None or as_of.utcoffset() is None:
            raise ValueError("as_of must be timezone-aware")
        if self.source is None:
            logger.info("market_provider_bypassed", extra={"reason": "not_configured"})
            return await self._fallback(subject, as_of)
        logger.info("market_provider_attempt", extra={"provider": self.source.provider_name})
        try:
            records = await self.source.fetch(subject, as_of)
        except MarketSourceUnavailable:
            logger.warning(
                "market_provider_unavailable", extra={"provider": self.source.provider_name}
            )
            return await self._fallback(subject, as_of)
        if not records:
            logger.info("market_provider_empty", extra={"provider": self.source.provider_name})
            return await self._fallback(subject, as_of)
        logger.info(
            "market_provider_success",
            extra={"provider": self.source.provider_name, "records_received": len(records)},
        )
        accepted: list[NormalizedMarketObservation] = []
        for raw in records:
            observation, _ = await self._normalize_and_persist(raw)
            accepted.append(observation)
        newest = max(accepted, key=lambda item: item.observed_at)
        if (
            self.freshness.classify(newest.observed_at, as_of, newest.data_mode)
            == FreshnessClass.FRESH
        ):
            return self._deliver(newest, DataMode.LIVE, as_of)
        return await self._fallback(subject, as_of)
