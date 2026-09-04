from datetime import timedelta
from decimal import Decimal

from prediction_engine.config import PredictionSettings
from prediction_engine.errors import PredictionPersistenceReadError
from prediction_engine.models import Advisory, DataMode, Direction
from prediction_engine.service import PredictionService

from .helpers import AS_OF, MANDI, OTHER_MANDI, MemoryRepository, observation, query


async def test_fewer_than_seven_dates_is_insufficient_without_fake_point() -> None:
    service = PredictionService(MemoryRepository([observation(i, str(30 + i)) for i in range(6)]))
    result = await service.forecast(query(horizon=1), AS_OF, "request-config-v1")
    assert result.status == Direction.INSUFFICIENT_DATA
    assert result.point_estimate is None
    assert result.confidence is None
    assert "INSUFFICIENT_HISTORY" in result.warnings


async def test_seven_dates_is_eligible_for_one_and_three_day_last_value() -> None:
    rows = [observation(i, str(30 + i)) for i in range(7)]
    for horizon in (1, 3):
        result = await PredictionService(MemoryRepository(rows)).forecast(
            query(horizon=horizon), AS_OF, "request-config-v1"
        )
        assert result.point_estimate == Decimal("36")
        assert result.method_name == "LAST_VALUE"
        assert result.benchmark_method == "LAST_VALUE"
        assert result.selected_method == "LAST_VALUE"
        assert result.horizon_days == horizon
        assert result.direction == Direction.STABLE
        assert result.advisory == Advisory.INSUFFICIENT_DATA
        assert result.confidence is None


async def test_future_rows_and_other_series_are_excluded() -> None:
    rows = [observation(i, str(30 + i)) for i in range(7)]
    rows += [observation(9, "999"), observation(6, "888", mandi_id=OTHER_MANDI)]
    result = await PredictionService(MemoryRepository(rows)).forecast(
        query(horizon=1, mandi_id=MANDI), AS_OF - timedelta(hours=1), "request-config-v1"
    )
    assert result.point_estimate == Decimal("36")
    assert result.observation_count == 7


async def test_demo_and_live_histories_never_mix() -> None:
    demo = [observation(i, str(30 + i), mode=DataMode.DEMO, dataset_id="DEMO-A") for i in range(2)]
    live = [observation(i, str(40 + i)) for i in range(7)]
    result = await PredictionService(MemoryRepository(demo + live)).forecast(
        query(mode=DataMode.DEMO, dataset_id="DEMO-A"), AS_OF, "request-config-v1"
    )
    assert result.status == Direction.INSUFFICIENT_DATA
    assert result.observation_count == 2
    assert result.data_mode == DataMode.DEMO
    assert result.dataset_id == "DEMO-A"


async def test_canonical_two_row_demo_is_explicitly_insufficient() -> None:
    rows = [
        observation(0, "30", mode=DataMode.DEMO, dataset_id="SIH-2026-TOMATO-V1"),
        observation(1, "31", mode=DataMode.DEMO, dataset_id="SIH-2026-TOMATO-V1"),
    ]
    result = await PredictionService(MemoryRepository(rows)).forecast(
        query(mode=DataMode.DEMO, dataset_id="SIH-2026-TOMATO-V1"),
        AS_OF,
        "request-config-v1",
    )
    assert result.point_estimate is None
    assert result.confidence is None
    assert "DEMO_HISTORY_INSUFFICIENT_FOR_EVALUATED_FORECAST" in result.warnings


async def test_stale_genuine_history_is_insufficient() -> None:
    rows = [observation(i, str(30 + i)) for i in range(7)]
    stale_as_of = rows[-1].observed_at + timedelta(hours=49)
    result = await PredictionService(MemoryRepository(rows)).forecast(
        query(), stale_as_of, "request-config-v1"
    )
    assert result.status == Direction.INSUFFICIENT_DATA
    assert "STALE_GENUINE_HISTORY" in result.warnings


async def test_output_is_deterministic_and_versioned_and_read_is_bounded() -> None:
    repository = MemoryRepository([observation(i, "30") for i in range(7)])
    settings = PredictionSettings(maximum_history_rows=100)
    service = PredictionService(repository, settings)
    first = await service.forecast(query(), AS_OF, "request-config-v9")
    second = await service.forecast(query(), AS_OF, "request-config-v9")
    assert first == second
    assert first.configuration_version == "request-config-v9"
    assert first.feature_version == "price-features-v1"
    assert first.model_version == "last-value-v1"
    assert first.selection_reason == "LAST_VALUE_RETAINED_NO_BETTER_ROLLING_EVALUATION"
    assert repository.requested_limit == 100


async def test_last_value_wins_when_rolling_mae_is_higher() -> None:
    rows = [observation(index, str(20 + index)) for index in range(9)]
    as_of = rows[-1].observed_at + timedelta(hours=1)
    result = await PredictionService(MemoryRepository(rows)).forecast(
        query(horizon=1), as_of, "request-config-v1"
    )
    assert result.benchmark_mae is not None
    assert result.selected_method == "LAST_VALUE"
    assert result.selected_method_mae == result.benchmark_mae
    assert result.point_estimate == rows[-1].modal_price


async def test_equal_mae_deterministically_keeps_last_value() -> None:
    rows = [observation(index, "30") for index in range(9)]
    as_of = rows[-1].observed_at + timedelta(hours=1)
    service = PredictionService(MemoryRepository(rows))
    first = await service.forecast(query(horizon=1), as_of, "request-config-v1")
    second = await service.forecast(query(horizon=1), as_of, "request-config-v1")
    assert first.benchmark_mae == Decimal("0")
    assert first.selected_method_mae == Decimal("0")
    assert first.selected_method == "LAST_VALUE"
    assert first.selection_reason == "LAST_VALUE_RETAINED_NO_BETTER_ROLLING_EVALUATION"
    assert first == second


async def test_rolling_mean_lower_mae_is_selected_and_can_naturally_rise() -> None:
    prices = ["100", "80"] * 5
    rows = [observation(index, price) for index, price in enumerate(prices)]
    as_of = rows[-1].observed_at + timedelta(hours=1)
    result = await PredictionService(MemoryRepository(rows)).forecast(
        query(horizon=1), as_of, "request-config-v1"
    )
    natural_mean = sum((row.modal_price for row in rows[-3:]), Decimal(0)) / Decimal(3)
    assert result.benchmark_mae is not None
    assert result.selected_method_mae is not None
    assert result.selected_method_mae < result.benchmark_mae
    assert result.selected_method == "ROLLING_MEAN"
    assert result.point_estimate == natural_mean
    assert result.direction == Direction.RISING
    assert result.selection_reason == "ROLLING_MEAN_LOWER_OUT_OF_SAMPLE_MAE"


async def test_selected_rolling_mean_can_naturally_fall_without_offset() -> None:
    prices = (["100", "80"] * 5)[:-1]
    rows = [observation(index, price) for index, price in enumerate(prices)]
    as_of = rows[-1].observed_at + timedelta(hours=1)
    result = await PredictionService(MemoryRepository(rows)).forecast(
        query(horizon=1), as_of, "request-config-v1"
    )
    natural_mean = sum((row.modal_price for row in rows[-3:]), Decimal(0)) / Decimal(3)
    assert result.selected_method == "ROLLING_MEAN"
    assert result.point_estimate == natural_mean
    assert result.direction == Direction.FALLING


async def test_selection_metadata_contains_benchmark_evidence() -> None:
    rows = [observation(index, str(30 + index)) for index in range(9)]
    result = await PredictionService(MemoryRepository(rows)).forecast(
        query(horizon=1), rows[-1].observed_at + timedelta(hours=1), "request-config-v1"
    )
    payload = result.model_dump(mode="json")
    assert payload["benchmark_method"] == "LAST_VALUE"
    assert payload["benchmark_mae"] is not None
    assert payload["selected_method"] == "LAST_VALUE"
    assert payload["selected_method_mae"] is not None
    assert payload["selection_reason"]


async def test_repository_read_failure_is_not_converted_to_demo() -> None:
    error = PredictionPersistenceReadError("market history could not be read")
    service = PredictionService(MemoryRepository([], fail=error))
    try:
        await service.forecast(query(), AS_OF, "request-config-v1")
    except PredictionPersistenceReadError as caught:
        assert str(caught) == "market history could not be read"
    else:
        raise AssertionError("read failure must propagate")


def test_configuration_retains_thirty_date_ml_gate() -> None:
    assert PredictionSettings().minimum_ml_dates == 30
