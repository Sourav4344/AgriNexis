from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from typing import Any
from uuid import UUID

from fastapi import Request


def serialize(value: Any) -> Any:
    if isinstance(value, Decimal):
        return format(value, "f")
    if isinstance(value, datetime | date):
        return value.isoformat()
    if isinstance(value, UUID):
        return str(value)
    if isinstance(value, Enum):
        return value.value
    if isinstance(value, dict):
        return {key: serialize(item) for key, item in value.items()}
    if isinstance(value, list | tuple):
        return [serialize(item) for item in value]
    return value


def envelope(request: Request, data: Any, **meta: Any) -> dict[str, Any]:
    return {
        "data": serialize(data),
        "meta": {"request_id": request.state.request_id, **serialize(meta)},
    }
