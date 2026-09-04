from decimal import Decimal

import pytest
from pydantic import ValidationError

from matching_engine.economics import calculate_economics, money, validate_quote_total
from matching_engine.models import Offer

from .helpers import candidate


def test_money_is_half_up_and_float_is_rejected() -> None:
    assert money(Decimal("1.005")) == Decimal("1.01")
    values = candidate().offer.model_dump()
    values["unit_price_per_kg"] = 31.5
    with pytest.raises(ValidationError, match="decimal values"):
        Offer.model_validate(values)


def test_economics_and_no_double_counting() -> None:
    item = candidate()
    assert item.quote is not None
    result = calculate_economics(item.offer.quantity_kg, item.offer.unit_price_per_kg, item.quote)
    assert result.gross_selling_value == Decimal("31000.00")
    assert result.total_applicable_cost == Decimal("2250.00")
    assert result.net_farmer_realization == Decimal("28750.00")
    assert result.net_farmer_realization_per_kg == Decimal("28.750000")
    assert validate_quote_total(item.quote)


def test_invalid_quote_total_is_rejected_by_economics() -> None:
    item = candidate(quote__total_applicable_cost="2251")
    assert item.quote is not None
    with pytest.raises(ValueError, match="itemized"):
        calculate_economics(item.offer.quantity_kg, item.offer.unit_price_per_kg, item.quote)
