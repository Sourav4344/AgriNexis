from decimal import Decimal

from prediction_engine.baselines import LAST_VALUE, last_value
from prediction_engine.evaluation import improvement_fraction, metrics, walk_forward_residuals

from .helpers import observation


def test_walk_forward_is_ordered_horizon_aware_and_leakage_free() -> None:
    rows = [observation(index, str(10 + index)) for index in range(10)]
    seen_training_ends = []

    def tracked(training):  # type: ignore[no-untyped-def]
        seen_training_ends.append(training[-1].price_date)
        return last_value(training)

    folds = walk_forward_residuals(rows, 3, tracked, 3)
    assert [fold[0].price_date for fold in folds] == [row.price_date for row in rows[5:]]
    assert all(
        origin < target.price_date
        for origin, (target, _, _) in zip(seen_training_ends, folds, strict=False)
    )
    assert all(residual == Decimal("3") for _, _, residual in folds)


def test_metrics_mae_rmse_mape_and_promotion_threshold() -> None:
    rows = [observation(index, str(10 + index)) for index in range(10)]
    folds = walk_forward_residuals(rows, 1, last_value, 3)
    result = metrics(LAST_VALUE, 1, folds)
    assert result is not None
    assert result.mae == Decimal("1")
    assert result.rmse == Decimal("1")
    assert result.mape is not None
    assert improvement_fraction(Decimal("10"), Decimal("9.5")) == Decimal("0.05")


def test_mape_is_omitted_when_actual_can_be_zero() -> None:
    target = observation(1, "0")
    result = metrics("TEST", 1, [(target, Decimal("1"), Decimal("-1"))])
    assert result is not None and result.mape is None
