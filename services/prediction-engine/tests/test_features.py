from decimal import Decimal

from prediction_engine.features import (
    chronological_distinct,
    lagged_prices,
    percentage_changes,
    price_differences,
)

from .helpers import observation


def test_chronological_order_duplicate_resolution_and_gaps() -> None:
    rows = [observation(3, "34"), observation(0, "30"), observation(0, "31", observed_hour=10)]
    ordered, report = chronological_distinct(rows)
    assert [row.modal_price for row in ordered] == [Decimal("31"), Decimal("34")]
    assert report.duplicate_dates_removed == 1
    assert report.missing_calendar_days == 2
    assert report.maximum_gap_days == 3


def test_decimal_feature_generation_and_zero_protection() -> None:
    rows = [observation(0, "0"), observation(1, "2.25"), observation(2, "3.25")]
    assert lagged_prices(rows, 2) == [Decimal("2.25"), Decimal("3.25")]
    assert price_differences(rows) == [Decimal("2.25"), Decimal("1.00")]
    assert percentage_changes(rows) == [None, Decimal("1.00") / Decimal("2.25")]
