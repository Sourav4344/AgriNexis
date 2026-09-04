from __future__ import annotations

from datetime import datetime
from typing import Any, Protocol
from uuid import UUID

from pydantic import BaseModel, Field


class EngineRequest(BaseModel):
    request_id: UUID
    as_of: datetime
    configuration_version: str
    subject: dict[str, Any]


class EngineResult(BaseModel):
    engine_version: str
    calculated_at: datetime
    data_mode: str
    source: str
    confidence: str | None = None
    warnings: list[str] = Field(default_factory=list)
    payload: dict[str, Any]


class MarketEngine(Protocol):
    async def observe(self, request: EngineRequest) -> EngineResult: ...


class PredictionEngine(Protocol):
    async def predict(self, request: EngineRequest) -> EngineResult: ...


class MatchingEngine(Protocol):
    async def recommend(self, request: EngineRequest) -> EngineResult: ...


class LogisticsEngine(Protocol):
    async def quote(self, request: EngineRequest) -> EngineResult: ...


class QualityEngine(Protocol):
    async def assess(self, request: EngineRequest) -> EngineResult: ...

