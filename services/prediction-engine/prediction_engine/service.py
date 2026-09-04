from __future__ import annotations

from datetime import date, datetime, timedelta
from functools import partial

from .baselines import LAST_VALUE, ROLLING_MEAN, last_value, rolling_mean
from .config import PredictionSettings
from .contracts import PredictionHistoryRepository
from .direction import classify_direction, price_only_advisory
from .evaluation import metrics, walk_forward_residuals
from .features import chronological_distinct
from .models import (
    Advisory,
    DataMode,
    Direction,
    GapReport,
    PredictionQuery,
    PredictionResult,
    Uncertainty,
)
from .uncertainty import empirical_interval

INSUFFICIENT_HISTORY = "INSUFFICIENT_HISTORY"
STALE_HISTORY = "STALE_GENUINE_HISTORY"
UNCALIBRATED = "UNCERTAINTY_NOT_CALIBRATED"
DEMO_INSUFFICIENT = "DEMO_HISTORY_INSUFFICIENT_FOR_EVALUATED_FORECAST"


class PredictionService:
    engine_version = "prediction-engine-v1"
    baseline_version = "last-value-v1"
    rolling_version = "rolling-mean-v1"

    def __init__(
        self, repository: PredictionHistoryRepository, settings: PredictionSettings | None = None
    ) -> None:
        self.repository = repository
        self.settings = settings or PredictionSettings()

    @staticmethod
    def _empty_uncertainty() -> Uncertainty:
        return Uncertainty(
            lower_bound=None,
            upper_bound=None,
            interval_method=None,
            residual_sample_count=0,
            coverage_target=None,
        )

    def _insufficient(
        self,
        query: PredictionQuery,
        as_of: datetime,
        configuration_version: str,
        warnings: list[str],
        observation_count: int = 0,
        history_start: date | None = None,
        history_end: date | None = None,
        gap_report: GapReport | None = None,
        source: str = "MARKET_HISTORY",
    ) -> PredictionResult:
        return PredictionResult(
            status=Direction.INSUFFICIENT_DATA,
            point_estimate=None,
            reference_price=None,
            direction=Direction.INSUFFICIENT_DATA,
            advisory=Advisory.INSUFFICIENT_DATA,
            horizon_days=query.horizon_days,
            forecast_origin=as_of,
            forecast_date=as_of.date() + timedelta(days=query.horizon_days),
            method_name=None,
            model_version=self.baseline_version,
            feature_version=self.settings.feature_version,
            configuration_version=configuration_version,
            dataset_id=query.dataset_id,
            data_mode=query.data_mode,
            source=source,
            training_cutoff=history_end,
            history_start=history_start,
            history_end=history_end,
            observation_count=observation_count,
            gap_report=gap_report,
            evaluation=None,
            benchmark_method=LAST_VALUE,
            benchmark_mae=None,
            selected_method=None,
            selected_method_mae=None,
            selection_reason="INSUFFICIENT_DATA",
            uncertainty=self._empty_uncertainty(),
            confidence=None,
            generated_at=as_of,
            warnings=warnings,
            explanation_facts=["PRICE_FORECAST_INSUFFICIENT_DATA"],
        )

    async def forecast(
        self, query: PredictionQuery, as_of: datetime, configuration_version: str
    ) -> PredictionResult:
        if as_of.tzinfo is None or as_of.utcoffset() is None:
            raise ValueError("as_of must be timezone-aware")
        if query.horizon_days not in self.settings.supported_horizons:
            raise ValueError("unsupported forecast horizon")
        raw = await self.repository.history(query, as_of, self.settings.maximum_history_rows)
        history, gap_report = chronological_distinct(raw)
        source = history[-1].source_name if history else "MARKET_HISTORY"
        if len(history) < self.settings.minimum_baseline_dates:
            insufficient_warnings = [INSUFFICIENT_HISTORY, UNCALIBRATED]
            if query.data_mode == DataMode.DEMO:
                insufficient_warnings.append(DEMO_INSUFFICIENT)
            return self._insufficient(
                query,
                as_of,
                configuration_version,
                insufficient_warnings,
                len(history),
                history[0].price_date if history else None,
                history[-1].price_date if history else None,
                gap_report,
                source,
            )
        latest = history[-1]
        if query.data_mode != DataMode.DEMO and as_of - latest.observed_at > timedelta(
            hours=self.settings.genuine_max_age_hours
        ):
            return self._insufficient(
                query,
                as_of,
                configuration_version,
                [STALE_HISTORY, UNCALIBRATED],
                len(history),
                history[0].price_date,
                latest.price_date,
                gap_report,
                source,
            )
        evaluation_train_size = self.settings.rolling_window
        benchmark_folds = walk_forward_residuals(
            history,
            query.horizon_days,
            last_value,
            evaluation_train_size,
        )
        benchmark_evaluation = metrics(LAST_VALUE, query.horizon_days, benchmark_folds)
        rolling_forecast = partial(rolling_mean, window=self.settings.rolling_window)
        rolling_folds = walk_forward_residuals(
            history,
            query.horizon_days,
            rolling_forecast,
            evaluation_train_size,
        )
        rolling_evaluation = metrics(ROLLING_MEAN, query.horizon_days, rolling_folds)

        selected_method = LAST_VALUE
        selected_forecast = last_value
        selected_folds = benchmark_folds
        selected_evaluation = benchmark_evaluation
        selected_version = self.baseline_version
        selection_reason = "LAST_VALUE_RETAINED_NO_BETTER_ROLLING_EVALUATION"
        if (
            benchmark_evaluation is not None
            and rolling_evaluation is not None
            and rolling_evaluation.mae < benchmark_evaluation.mae
        ):
            selected_method = ROLLING_MEAN
            selected_forecast = rolling_forecast
            selected_folds = rolling_folds
            selected_evaluation = rolling_evaluation
            selected_version = self.rolling_version
            selection_reason = "ROLLING_MEAN_LOWER_OUT_OF_SAMPLE_MAE"

        point = selected_forecast(history)
        uncertainty = empirical_interval(
            point,
            [residual for _, _, residual in selected_folds],
            self.settings.minimum_interval_residuals,
            self.settings.interval_coverage_target,
        )
        warnings: list[str] = []
        if uncertainty.lower_bound is None:
            warnings.append(UNCALIBRATED)
        direction = classify_direction(point, latest.modal_price, self.settings.stable_threshold)
        advisory = price_only_advisory(
            latest.modal_price, uncertainty, self.settings.stable_threshold
        )
        facts = [
            "PRICE_BENCHMARK_LAST_VALUE",
            f"PRICE_SELECTED_{selected_method}",
            f"PRICE_DIRECTION_{direction.value}",
        ]
        if advisory == Advisory.INSUFFICIENT_DATA:
            facts.append("PRICE_ONLY_ADVISORY_WITHHELD")
        return PredictionResult(
            status=direction,
            point_estimate=point,
            reference_price=latest.modal_price,
            direction=direction,
            advisory=advisory,
            horizon_days=query.horizon_days,
            forecast_origin=as_of,
            forecast_date=as_of.date() + timedelta(days=query.horizon_days),
            method_name=selected_method,
            model_version=selected_version,
            feature_version=self.settings.feature_version,
            configuration_version=configuration_version,
            dataset_id=query.dataset_id,
            data_mode=query.data_mode,
            source=source,
            training_cutoff=latest.price_date,
            history_start=history[0].price_date,
            history_end=latest.price_date,
            observation_count=len(history),
            gap_report=gap_report,
            evaluation=selected_evaluation,
            benchmark_method=LAST_VALUE,
            benchmark_mae=(benchmark_evaluation.mae if benchmark_evaluation else None),
            selected_method=selected_method,
            selected_method_mae=(selected_evaluation.mae if selected_evaluation else None),
            selection_reason=selection_reason,
            uncertainty=uncertainty,
            confidence=None,
            generated_at=as_of,
            warnings=warnings,
            explanation_facts=facts,
        )
