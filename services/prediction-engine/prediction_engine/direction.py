from __future__ import annotations

from decimal import Decimal

from .models import Advisory, Direction, Uncertainty


def classify_direction(
    forecast: Decimal | None, reference: Decimal | None, threshold: Decimal
) -> Direction:
    if forecast is None or reference is None or reference <= 0:
        return Direction.INSUFFICIENT_DATA
    change = (forecast - reference) / reference
    if change > threshold:
        return Direction.RISING
    if change < -threshold:
        return Direction.FALLING
    return Direction.STABLE


def price_only_advisory(
    reference: Decimal | None, uncertainty: Uncertainty, threshold: Decimal
) -> Advisory:
    if (
        reference is None
        or reference <= 0
        or uncertainty.lower_bound is None
        or uncertainty.upper_bound is None
    ):
        return Advisory.INSUFFICIENT_DATA
    if uncertainty.lower_bound > reference * (Decimal(1) + threshold):
        return Advisory.WAIT
    if uncertainty.upper_bound < reference * (Decimal(1) - threshold):
        return Advisory.SELL_NOW
    return Advisory.INSUFFICIENT_DATA
