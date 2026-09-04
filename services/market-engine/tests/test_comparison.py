from datetime import UTC, datetime, timedelta
from decimal import Decimal
from uuid import UUID

from market_engine.models import ComparisonItem, DataMode


def test_observed_comparison_order_contains_no_prediction() -> None:
    now = datetime(2026, 9, 4, tzinfo=UTC)
    rows = [
        ComparisonItem(
            mandi_id=UUID(int=1),
            min_price="25",
            modal_price="30",
            max_price="32",
            observed_at=now,
            source_age_seconds=0,
            data_mode=DataMode.LIVE,
            arrival_quantity=None,
        ),
        ComparisonItem(
            mandi_id=UUID(int=2),
            min_price="28",
            modal_price="31",
            max_price="34",
            observed_at=now - timedelta(hours=1),
            source_age_seconds=3600,
            data_mode=DataMode.LIVE,
            arrival_quantity="100",
        ),
    ]
    ordered = sorted(rows, key=lambda item: (-item.modal_price, item.mandi_id.hex))
    assert [item.modal_price for item in ordered] == [Decimal("31"), Decimal("30")]
    assert "prediction" not in ComparisonItem.model_fields
