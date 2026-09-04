from __future__ import annotations

import hashlib
import json
from decimal import Decimal
from enum import Enum
from typing import Any
from uuid import UUID


def _canonical(value: Any) -> Any:
    if isinstance(value, Decimal):
        return format(value, "f")
    if isinstance(value, UUID):
        return str(value)
    if isinstance(value, Enum):
        return value.value
    if isinstance(value, dict):
        return {key: _canonical(value[key]) for key in sorted(value)}
    if isinstance(value, list | tuple):
        return [_canonical(item) for item in value]
    return value


def request_fingerprint(payload: dict[str, Any]) -> str:
    encoded = json.dumps(_canonical(payload), sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return f"sha256:{hashlib.sha256(encoded.encode()).hexdigest()}"
