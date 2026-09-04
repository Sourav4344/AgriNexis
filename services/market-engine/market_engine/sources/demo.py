from __future__ import annotations

from datetime import datetime
from typing import Any

from ..models import NormalizedMarketObservation
from ..repositories.protocol import MarketRepository

DEMO_SOURCE = "AGRINEXIS_DEMO"
DEMO_DATASET = "SIH-2026-TOMATO-V1"
DEMO_WARNING = "DEMO DATA — NOT LIVE GOVERNMENT DATA"


class DemoMarketSource:
    def __init__(self, repository: MarketRepository) -> None:
        self.repository = repository

    @property
    def provider_name(self) -> str:
        return DEMO_SOURCE

    async def resolve(
        self, subject: dict[str, Any], as_of: datetime
    ) -> NormalizedMarketObservation | None:
        return await self.repository.latest_demo_observation(subject, DEMO_DATASET, as_of)
