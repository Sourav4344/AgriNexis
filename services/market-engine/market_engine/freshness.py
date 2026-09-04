from __future__ import annotations

from datetime import datetime, timedelta
from enum import StrEnum

from .models import DataMode


class FreshnessClass(StrEnum):
    FRESH = "FRESH"
    CACHE_ELIGIBLE = "CACHE_ELIGIBLE"
    STALE = "STALE"


class FreshnessPolicy:
    def __init__(self, live_max_age: timedelta, cache_max_age: timedelta) -> None:
        if live_max_age <= timedelta(0) or cache_max_age < live_max_age:
            raise ValueError("freshness thresholds are invalid")
        self.live_max_age = live_max_age
        self.cache_max_age = cache_max_age

    def classify(
        self, observed_at: datetime, as_of: datetime, stored_mode: DataMode
    ) -> FreshnessClass:
        if observed_at.tzinfo is None or as_of.tzinfo is None:
            raise ValueError("freshness timestamps must be timezone-aware")
        if stored_mode == DataMode.DEMO:
            return FreshnessClass.STALE
        age = max(as_of - observed_at, timedelta(0))
        if age <= self.live_max_age:
            return FreshnessClass.FRESH
        if age <= self.cache_max_age:
            return FreshnessClass.CACHE_ELIGIBLE
        return FreshnessClass.STALE

    @staticmethod
    def age_seconds(observed_at: datetime, as_of: datetime) -> int:
        return max(0, int((as_of - observed_at).total_seconds()))
