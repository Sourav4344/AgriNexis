from __future__ import annotations

from datetime import datetime
from typing import Any, Protocol
from uuid import UUID


class Agent4Request(Protocol):
    request_id: UUID
    as_of: datetime
    configuration_version: str
    subject: dict[str, Any]


class Agent4ResultFactory(Protocol):
    def __call__(self, **kwargs: Any) -> Any: ...
