from __future__ import annotations

from typing import Any

from pydantic import ValidationError

from .contracts import Agent4Request, Agent4ResultFactory
from .errors import MatchingInvalidRequest
from .models import MatchingRequest
from .service import MatchingService


class Agent4MatchingEngineAdapter:
    def __init__(
        self, service: MatchingService, result_factory: Agent4ResultFactory | None = None
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

    async def recommend(self, request: Agent4Request) -> Any:
        try:
            subject = MatchingRequest.model_validate(request.subject)
        except ValidationError as exc:
            raise MatchingInvalidRequest("matching subject is invalid") from exc
        result = await self.service.recommend(subject, request.as_of, request.configuration_version)
        factory = self._result_factory or self._default_result_factory
        return factory(
            engine_version=self.service.engine_version,
            calculated_at=result.calculated_at,
            data_mode=result.data_mode.value if result.data_mode is not None else "UNKNOWN",
            source=result.source,
            confidence=None,
            warnings=result.warnings,
            payload={"recommendation": result.model_dump(mode="json")},
        )
