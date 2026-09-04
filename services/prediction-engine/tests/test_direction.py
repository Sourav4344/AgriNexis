from decimal import Decimal

from prediction_engine.direction import classify_direction, price_only_advisory
from prediction_engine.models import Advisory, Direction, Uncertainty


def calibrated(lower: str, upper: str) -> Uncertainty:
    return Uncertainty(
        lower_bound=Decimal(lower),
        upper_bound=Decimal(upper),
        interval_method="TEST",
        residual_sample_count=20,
        coverage_target=Decimal("0.90"),
    )


def test_direction_boundaries_and_zero_reference() -> None:
    threshold = Decimal("0.02")
    assert classify_direction(Decimal("102.01"), Decimal("100"), threshold) == Direction.RISING
    assert classify_direction(Decimal("102"), Decimal("100"), threshold) == Direction.STABLE
    assert classify_direction(Decimal("101"), Decimal("100"), threshold) == Direction.STABLE
    assert classify_direction(Decimal("98"), Decimal("100"), threshold) == Direction.STABLE
    assert classify_direction(Decimal("97.99"), Decimal("100"), threshold) == Direction.FALLING
    assert classify_direction(Decimal("10"), Decimal("0"), threshold) == Direction.INSUFFICIENT_DATA


def test_price_only_advice_requires_entire_calibrated_interval() -> None:
    threshold = Decimal("0.02")
    assert price_only_advisory(Decimal("100"), calibrated("103", "106"), threshold) == Advisory.WAIT
    assert (
        price_only_advisory(Decimal("100"), calibrated("94", "97"), threshold) == Advisory.SELL_NOW
    )
    assert (
        price_only_advisory(Decimal("100"), calibrated("97", "103"), threshold)
        == Advisory.INSUFFICIENT_DATA
    )
