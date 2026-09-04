from decimal import Decimal

from prediction_engine.uncertainty import empirical_interval


def test_uncertainty_requires_twenty_residuals() -> None:
    result = empirical_interval(Decimal("10"), [Decimal("1")] * 19)
    assert result.lower_bound is None and result.upper_bound is None
    assert result.coverage_target is None
    assert result.residual_sample_count == 19


def test_calibrated_bounds_are_ordered_and_clamped() -> None:
    result = empirical_interval(Decimal("0.5"), [Decimal(index) for index in range(20)])
    assert result.lower_bound == 0
    assert result.upper_bound is not None and result.upper_bound >= Decimal("0.5")
    assert result.lower_bound <= Decimal("0.5") <= result.upper_bound
    assert result.interval_method == "WALK_FORWARD_ABSOLUTE_RESIDUAL_QUANTILE"
