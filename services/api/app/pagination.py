from __future__ import annotations

import base64
import json
from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

from .errors import ApiError


@dataclass(frozen=True, slots=True)
class Cursor:
    created_at: datetime
    row_id: UUID


def encode_cursor(created_at: datetime, row_id: UUID) -> str:
    raw = json.dumps({"created_at": created_at.isoformat(), "id": str(row_id)}, separators=(",", ":"))
    return base64.urlsafe_b64encode(raw.encode()).decode().rstrip("=")


def decode_cursor(value: str | None) -> Cursor | None:
    if not value:
        return None
    try:
        padding = "=" * (-len(value) % 4)
        payload = json.loads(base64.urlsafe_b64decode(value + padding))
        return Cursor(datetime.fromisoformat(payload["created_at"]), UUID(payload["id"]))
    except (ValueError, KeyError, TypeError, json.JSONDecodeError) as exc:
        raise ApiError("INVALID_CURSOR", "Cursor is invalid", 400) from exc

