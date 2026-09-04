from __future__ import annotations

from datetime import datetime
from typing import Any, Protocol
from uuid import UUID

from .models import CandidateInput, Listing, RecommendationResult


class Agent4Request(Protocol):
    request_id: UUID
    as_of: datetime
    configuration_version: str
    subject: dict[str, Any]


class Agent4ResultFactory(Protocol):
    def __call__(self, **kwargs: Any) -> Any: ...


class CandidateRepository(Protocol):
    async def actionable_candidates(
        self, listing: Listing, as_of: datetime
    ) -> list[CandidateInput]: ...


class RecommendationRepository(Protocol):
    """Trusted-backend persistence seam; it is intentionally not wired to HTTP or RLS bypass."""

    async def persist(self, result: RecommendationResult) -> list[UUID]: ...
