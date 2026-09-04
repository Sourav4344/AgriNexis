from __future__ import annotations

from collections.abc import Callable
from datetime import timedelta
from decimal import Decimal, localcontext

from .models import EvaluationMetrics, HistoryObservation

ForecastFunction = Callable[[list[HistoryObservation]], Decimal]


def walk_forward_residuals(
    observations: list[HistoryObservation],
    horizon_days: int,
    forecast: ForecastFunction,
    minimum_train_size: int,
) -> list[tuple[HistoryObservation, Decimal, Decimal]]:
    """Return (actual row, prediction, signed residual) in strict time order."""
    if horizon_days <= 0 or minimum_train_size <= 0:
        raise ValueError("evaluation sizes must be positive")
    by_date = {item.price_date: item for item in observations}
    folds: list[tuple[HistoryObservation, Decimal, Decimal]] = []
    for origin_index in range(minimum_train_size - 1, len(observations)):
        origin = observations[origin_index]
        target = by_date.get(origin.price_date + timedelta(days=horizon_days))
        if target is None:
            continue
        training = observations[: origin_index + 1]
        prediction = forecast(training)
        folds.append((target, prediction, target.modal_price - prediction))
    return folds


def metrics(
    method_name: str,
    horizon_days: int,
    folds: list[tuple[HistoryObservation, Decimal, Decimal]],
) -> EvaluationMetrics | None:
    if not folds:
        return None
    absolute = [abs(residual) for _, _, residual in folds]
    squared = [residual * residual for _, _, residual in folds]
    with localcontext() as context:
        context.prec = 28
        mae = sum(absolute, Decimal(0)) / Decimal(len(folds))
        rmse = (sum(squared, Decimal(0)) / Decimal(len(folds))).sqrt()
        actuals = [target.modal_price for target, _, _ in folds]
        mape = None
        if all(actual > Decimal("0.01") for actual in actuals):
            mape = sum(
                (abs(residual) / target.modal_price for target, _, residual in folds), Decimal(0)
            ) / Decimal(len(folds))
    return EvaluationMetrics(
        method_name=method_name,
        horizon_days=horizon_days,
        sample_count=len(folds),
        start_date=folds[0][0].price_date,
        end_date=folds[-1][0].price_date,
        mae=mae,
        rmse=rmse,
        mape=mape,
    )


def improvement_fraction(baseline_mae: Decimal, candidate_mae: Decimal) -> Decimal | None:
    if baseline_mae == 0:
        return None
    return (baseline_mae - candidate_mae) / baseline_mae
