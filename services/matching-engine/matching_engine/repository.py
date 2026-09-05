from __future__ import annotations

from datetime import datetime
from uuid import UUID

from .contracts import CandidateRepository, RecommendationRepository
from .errors import MatchingPersistenceError
from .models import CandidateInput, Listing, RecommendationResult


async def read_actionable_candidates(
    repository: CandidateRepository, listing: Listing, as_of: datetime
) -> list[CandidateInput]:
    try:
        return await repository.actionable_candidates(listing, as_of)
    except Exception as exc:
        raise MatchingPersistenceError("candidate records could not be read") from exc


async def persist_recommendation(
    repository: RecommendationRepository, result: RecommendationResult
) -> list[UUID]:
    try:
        return await repository.persist(result)
    except Exception as exc:
        raise MatchingPersistenceError("recommendation could not be persisted") from exc


__all__ = [
    "CandidateRepository",
    "RecommendationRepository",
    "persist_recommendation",
    "read_actionable_candidates",
]
