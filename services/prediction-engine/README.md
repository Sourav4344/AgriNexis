# AgriNexis prediction engine

The prediction engine provides on-demand, short-horizon price forecasts from
normalized Agent 6 market history. It is read-only: it does not ingest market
data, persist predictions, rank buyers, calculate NFR, or implement HTTP routes.

## Forecast contract

- Supported horizons are 1 and 3 calendar days; the default is 3 days.
- A forecast requires one exact crop/variety/mandi/currency/unit/mode/dataset
  series, at least seven distinct dates, and no observations after `as_of`.
- Genuine operational history must have a latest observation no more than 48
  hours old.
- Price-facing values use `Decimal` and are serialized as decimal strings by the
  Agent 4 adapter.

`LAST_VALUE` is always evaluated as the mandatory benchmark. `ROLLING_MEAN` is
served only when the same expanding-window folds produce a strictly lower MAE;
missing evaluation and exact ties retain `LAST_VALUE`. This simple baseline does
not require the future ML promotion margin. A moving average is not represented
as AI. No trained production ML model is bundled merely for presentation. A
future ML candidate needs at least 30 dates and may replace the baseline only
after time-ordered evaluation demonstrates at least 5% lower MAE without obvious
fold instability.

Evaluation uses expanding-window walk-forward folds and never random splitting.
It reports MAE, RMSE, conditionally MAPE, date range, horizon, and sample count.

## Direction, uncertainty, and advice

Direction compares the estimate with the latest eligible modal price. A change
above +2% is `RISING`, below -2% is `FALLING`, and the inclusive band is `STABLE`.
The threshold is versioned configuration.

Empirical residual intervals require at least 20 horizon-specific out-of-sample
errors. Without those residuals, bounds and confidence are `None` and the result
warns `UNCERTAINTY_NOT_CALIBRATED`. Numeric confidence is never invented.

The output labelled `PRICE_ONLY_ADVISORY` is conservative. It emits `WAIT` only
when the complete calibrated interval is above the rising threshold, and
`SELL_NOW` only when the complete interval is below the falling threshold.
Otherwise it emits `INSUFFICIENT_DATA`. Agent 8 owns the final NFR-aware Sell/Wait
recommendation using buyers, logistics, storage, deterioration, trust, and NFR.

## Demo and persistence policy

The canonical `SIH-2026-TOMATO-V1` dataset has only two observations, so normal
forecasting returns `INSUFFICIENT_DATA`, preserves its DEMO identity, and supplies
no fabricated forecast or confidence. No presentation-only extrapolation exists.

Predictions are on demand. There is no predictions table, model registry, or
prediction write path. A future recommendation orchestrator may copy result
metadata into `recommendations.input_metadata`.

## Agent 4 adapter and testing

`Agent4PredictionEngineAdapter.predict(request)` implements the current Agent 4
protocol without changing Agent 4. It validates subject identity and uses
`request.as_of` as the hard history cutoff.

Run `pytest`, `ruff format --check .`, `ruff check .`, and `mypy
prediction_engine` from this directory. Database integration tests require
`PREDICTION_INTEGRATION_DATABASE_URL` for a disposable database with migrations
001-019 and are skipped otherwise.
