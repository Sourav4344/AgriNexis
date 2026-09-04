from __future__ import annotations

from typing import Any

from pydantic import ValidationError

from .contracts import Agent4Request, Agent4ResultFactory
from .errors import PredictionInvalidRequest
from .models import PredictionQuery
from .service import PredictionService


class Agent4PredictionEngineAdapter:
    """Maps typed forecasts to Agent 4's existing EngineResult contract."""

    def __init__(
        self, service: PredictionService, result_factory: Agent4ResultFactory | None = None
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

    async def predict(self, request: Agent4Request) -> Any:
        subject = dict(request.subject)
        subject.setdefault("horizon_days", self.service.settings.default_horizon_days)
        try:
            query = PredictionQuery.model_validate(subject)
        except ValidationError as exc:
            raise PredictionInvalidRequest("prediction subject is invalid") from exc
        result = await self.service.forecast(query, request.as_of, request.configuration_version)
        factory = self._result_factory or self._default_result_factory
        confidence = f"{result.confidence:.4f}" if result.confidence is not None else None
        return factory(
            engine_version=self.service.engine_version,
            calculated_at=result.generated_at,
            data_mode=result.data_mode.value,
            source=result.source,
            confidence=confidence,
            warnings=result.warnings,
            payload={"prediction": result.model_dump(mode="json")},
        )
