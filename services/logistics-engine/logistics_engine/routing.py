from __future__ import annotations

from typing import Protocol

from .models import DecimalValue, Geography


class RoutingProvider(Protocol):
    async def distance_km(
        self, origin: Geography, destination: Geography
    ) -> DecimalValue | None: ...


class UnavailableRoutingProvider:
    async def distance_km(self, origin: Geography, destination: Geography) -> None:
        return None
