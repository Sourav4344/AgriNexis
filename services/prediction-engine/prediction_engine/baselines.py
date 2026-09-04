from __future__ import annotations

from decimal import Decimal

from .models import HistoryObservation

LAST_VALUE = "LAST_VALUE"
ROLLING_MEAN = "ROLLING_MEAN"


def last_value(observations: list[HistoryObservation]) -> Decimal:
    if not observations:
        raise ValueError("LAST_VALUE requires history")
    return observations[-1].modal_price


def rolling_mean(observations: list[HistoryObservation], window: int = 3) -> Decimal:
    if window <= 0:
        raise ValueError("rolling window must be positive")
    if len(observations) < window:
        raise ValueError("rolling mean requires at least window observations")
    values = [item.modal_price for item in observations[-window:]]
    return sum(values, Decimal(0)) / Decimal(len(values))
