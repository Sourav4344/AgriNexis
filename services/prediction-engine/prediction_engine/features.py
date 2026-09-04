from __future__ import annotations

from datetime import date
from decimal import Decimal

from .models import GapReport, HistoryObservation


def chronological_distinct(
    observations: list[HistoryObservation],
) -> tuple[list[HistoryObservation], GapReport]:
    """Sort and retain the latest observed row per market-local price date."""
    selected: dict[date, HistoryObservation] = {}
    for item in observations:
        current = selected.get(item.price_date)
        if current is None or (item.observed_at, item.id.hex) > (
            current.observed_at,
            current.id.hex,
        ):
            selected[item.price_date] = item
    ordered = sorted(selected.values(), key=lambda item: (item.price_date, item.id.hex))
    gaps = [
        (right.price_date - left.price_date).days
        for left, right in zip(ordered, ordered[1:], strict=False)
    ]
    return ordered, GapReport(
        missing_calendar_days=sum(max(0, gap - 1) for gap in gaps),
        maximum_gap_days=max(gaps, default=0),
        duplicate_dates_removed=len(observations) - len(ordered),
    )


def lagged_prices(observations: list[HistoryObservation], count: int) -> list[Decimal]:
    if count <= 0:
        raise ValueError("lag count must be positive")
    return [item.modal_price for item in observations[-count:]]


def price_differences(observations: list[HistoryObservation]) -> list[Decimal]:
    prices = [item.modal_price for item in observations]
    return [right - left for left, right in zip(prices, prices[1:], strict=False)]


def percentage_changes(observations: list[HistoryObservation]) -> list[Decimal | None]:
    prices = [item.modal_price for item in observations]
    return [
        None if left == 0 else (right - left) / left
        for left, right in zip(prices, prices[1:], strict=False)
    ]
