from __future__ import annotations

from typing import Any

from .contracts import Agent4Request, Agent4ResultFactory
from .service import MarketService


class Agent4MarketEngineAdapter:
    """Maps typed market results to Agent 4's existing EngineResult contract."""

    engine_version = "market-engine-v1"

    def __init__(
        self, service: MarketService, result_factory: Agent4ResultFactory | None = None
    ) -> None:
        self.service = service
        self._result_factory = result_factory

    @staticmethod
    def _default_result_factory(**kwargs: Any) -> Any:
        try:
            from app.engines import EngineResult  # type: ignore[import-untyped]
        except ImportError as exc:
            raise RuntimeError(
                "Agent 4 app package is not importable; inject EngineResult as result_factory"
            ) from exc
        return EngineResult(**kwargs)

    async def observe(self, request: Agent4Request) -> Any:
        result = await self.service.observe_subject(request.subject, request.as_of)
        observation = result.observation
        factory = self._result_factory or self._default_result_factory
        return factory(
            engine_version=self.engine_version,
            calculated_at=result.calculated_at,
            data_mode=result.delivery_mode.value,
            source=observation.source_name,
            confidence=None,
            warnings=result.warnings,
            payload={
                "stored_data_mode": observation.data_mode.value,
                "observation": observation.model_dump(mode="json"),
                "source_age_seconds": result.source_age_seconds,
                "configuration_version": request.configuration_version,
            },
        )
