from __future__ import annotations

from datetime import datetime
from typing import Any, Protocol

from ..models import RawMarketRecord


class MarketSource(Protocol):
    @property
    def provider_name(self) -> str: ...

    async def fetch(self, subject: dict[str, Any], as_of: datetime) -> list[RawMarketRecord]: ...
