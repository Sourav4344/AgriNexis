from __future__ import annotations

from typing import Any

from pydantic import ValidationError

from .contracts import Agent4Request, Agent4ResultFactory
from .errors import QualityInvalidRequest
from .models import QualityRequest
from .service import QualityService


class Agent4QualityEngineAdapter:
    def __init__(
        self, service: QualityService, result_factory: Agent4ResultFactory | None = None
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

    async def assess(self, request: Agent4Request) -> Any:
        subject = dict(request.subject)
        subject.update(
            request_id=request.request_id,
            as_of=request.as_of,
            configuration_version=request.configuration_version,
        )
        try:
            quality_request = QualityRequest.model_validate(subject)
        except ValidationError as exc:
            raise QualityInvalidRequest("quality request is invalid") from exc
        result = self.service.assess(quality_request)
        factory = self._result_factory or self._default_result_factory
        return factory(
            engine_version=result.engine_version,
            calculated_at=result.calculated_at,
            data_mode=result.data_mode.value,
            source=result.source,
            confidence=None,
            warnings=result.warnings,
            payload={"quality": result.model_dump(mode="json")},
        )
