from datetime import UTC, datetime, timedelta

from market_engine.freshness import FreshnessClass, FreshnessPolicy
from market_engine.models import DataMode


def test_freshness_boundaries() -> None:
    policy = FreshnessPolicy(timedelta(minutes=180), timedelta(hours=48))
    now = datetime(2026, 9, 4, 12, tzinfo=UTC)
    assert policy.classify(now - timedelta(minutes=180), now, DataMode.LIVE) == FreshnessClass.FRESH
    assert (
        policy.classify(now - timedelta(minutes=181), now, DataMode.LIVE)
        == FreshnessClass.CACHE_ELIGIBLE
    )
    assert (
        policy.classify(now - timedelta(hours=48), now, DataMode.LIVE)
        == FreshnessClass.CACHE_ELIGIBLE
    )
    assert (
        policy.classify(now - timedelta(hours=48, seconds=1), now, DataMode.LIVE)
        == FreshnessClass.STALE
    )
    assert policy.classify(now, now, DataMode.DEMO) == FreshnessClass.STALE
