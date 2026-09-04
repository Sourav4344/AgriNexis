from decimal import Decimal

import pytest

from prediction_engine.baselines import last_value, rolling_mean

from .helpers import observation


def test_last_value_and_rolling_mean_are_decimal_safe() -> None:
    rows = [observation(0, "10.10"), observation(1, "10.20"), observation(2, "10.30")]
    assert last_value(rows) == Decimal("10.30")
    assert rolling_mean(rows, 3) == Decimal("10.20")


def test_baselines_reject_insufficient_input() -> None:
    with pytest.raises(ValueError):
        last_value([])
    with pytest.raises(ValueError):
        rolling_mean([observation(0, "10")], 2)
