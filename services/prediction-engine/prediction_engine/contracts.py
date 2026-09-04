from __future__ import annotations

from datetime import datetime
from typing import Any, Protocol
from uuid import UUID

from .models import HistoryObservation, PredictionQuery


class PredictionHistoryRepository(Protocol):
    async def history(
        self, query: PredictionQuery, as_of: datetime, limit: int
    ) -> list[HistoryObservation]: ...


class Agent4Request(Protocol):
    request_id: UUID
    as_of: datetime
    configuration_version: str
    subject: dict[str, Any]


class Agent4ResultFactory(Protocol):
    def __call__(self, **kwargs: Any) -> Any: ...


class CompatiblePredictionEngine(Protocol):
    async def predict(self, request: Agent4Request) -> Any: ...
