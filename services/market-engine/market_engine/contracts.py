from __future__ import annotations

from datetime import datetime
from typing import Any, Protocol
from uuid import UUID

from .models import DeliveredMarketResult


class Agent4Request(Protocol):
    request_id: UUID
    as_of: datetime
    configuration_version: str
    subject: dict[str, Any]


class Agent4ResultFactory(Protocol):
    def __call__(self, **kwargs: Any) -> Any: ...


class CompatibleMarketEngine(Protocol):
    async def observe(self, request: Agent4Request) -> Any: ...


class MarketObserver(Protocol):
    async def observe_subject(
        self, subject: dict[str, Any], as_of: datetime
    ) -> DeliveredMarketResult: ...
