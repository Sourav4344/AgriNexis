from __future__ import annotations

from datetime import datetime
from typing import Any, Protocol
from uuid import UUID

from pydantic import ValidationError

from .errors import failure
from .models import QuoteRequest
from .service import LogisticsService


class Agent4Request(Protocol):
    request_id: UUID
    as_of: datetime
    configuration_version: str
    subject: dict[str, Any]


class Agent4ResultFactory(Protocol):
    def __call__(self, **kwargs: Any) -> Any: ...


class Agent4LogisticsEngineAdapter:
    def __init__(
        self, service: LogisticsService, result_factory: Agent4ResultFactory | None = None
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

    async def quote(self, request: Agent4Request) -> Any:
        subject = dict(request.subject)
        subject.update(
            request_id=request.request_id,
            as_of=request.as_of,
            configuration_version=request.configuration_version,
        )
        try:
            quote_request = QuoteRequest.model_validate(subject)
        except ValidationError as exc:
            raise failure("INVALID_REQUEST") from exc
        result = await self.service.quote(quote_request)
        factory = self._result_factory or self._default_result_factory
        return factory(
            engine_version=result.engine_version,
            calculated_at=result.calculated_at,
            data_mode=result.data_mode.value,
            source=result.source,
            confidence=None,
            warnings=result.warnings,
            payload={"quote": result.model_dump(mode="json")},
        )
