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


def get_matching_engine() -> MatchingEngine:
    from matching_engine.adapter import Agent4MatchingEngineAdapter
    from matching_engine.service import MatchingService
    return Agent4MatchingEngineAdapter(MatchingService(), result_factory=lambda **kw: EngineResult(**kw))


def get_prediction_engine(repository=None) -> PredictionEngine:
    from prediction_engine.adapter import Agent4PredictionEngineAdapter
    from prediction_engine.repository import MemoryPredictionHistoryRepository
    from prediction_engine.service import PredictionService
    repo = repository or MemoryPredictionHistoryRepository()
    return Agent4PredictionEngineAdapter(PredictionService(repo), result_factory=lambda **kw: EngineResult(**kw))


def get_market_engine(repository=None) -> MarketEngine:
    from market_engine.adapter import Agent4MarketEngineAdapter
    from market_engine.repositories.memory import MemoryMarketRepository
    from market_engine.service import MarketService
    from market_engine.settings import MarketSettings
    repo = repository or MemoryMarketRepository()
    return Agent4MarketEngineAdapter(MarketService(repo, MarketSettings()), result_factory=lambda **kw: EngineResult(**kw))


def get_quality_service():
    from quality_engine.service import QualityService
    return QualityService()
