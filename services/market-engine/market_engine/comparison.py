from __future__ import annotations

from datetime import datetime

from .models import ComparisonItem, MarketQuery
from .repositories.protocol import MarketRepository


async def compare_observed_markets(
    repository: MarketRepository, query: MarketQuery, as_of: datetime
) -> list[ComparisonItem]:
    """Return latest observed values ranked by modal price; this is not a forecast."""
    if as_of.tzinfo is None or as_of.utcoffset() is None:
        raise ValueError("as_of must be timezone-aware")
    return await repository.comparison(query.crop_id, query.variety_id, query.mandi_ids, as_of)
