from __future__ import annotations

from decimal import ROUND_CEILING, Decimal

from .models import Uncertainty


def empirical_interval(
    point_estimate: Decimal,
    residuals: list[Decimal],
    minimum_samples: int = 20,
    coverage_target: Decimal = Decimal("0.90"),
) -> Uncertainty:
    if len(residuals) < minimum_samples:
        return Uncertainty(
            lower_bound=None,
            upper_bound=None,
            interval_method=None,
            residual_sample_count=len(residuals),
            coverage_target=None,
        )
    absolute = sorted(abs(value) for value in residuals)
    rank = int((coverage_target * Decimal(len(absolute))).to_integral_value(rounding=ROUND_CEILING))
    radius = absolute[min(max(rank - 1, 0), len(absolute) - 1)]
    return Uncertainty(
        lower_bound=max(Decimal(0), point_estimate - radius),
        upper_bound=point_estimate + radius,
        interval_method="WALK_FORWARD_ABSOLUTE_RESIDUAL_QUANTILE",
        residual_sample_count=len(residuals),
        coverage_target=coverage_target,
    )
