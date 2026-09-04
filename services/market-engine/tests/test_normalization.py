from datetime import UTC, datetime
from decimal import Decimal
from uuid import UUID

import pytest
from pydantic import ValidationError

from market_engine.errors import MarketSourceInvalid, UnsupportedCurrency, UnsupportedMarketUnit
from market_engine.history import history_date
from market_engine.models import DataMode, NormalizedMarketObservation, RawMarketRecord
from market_engine.normalization import (
    exact_decimal,
    normalize_arrival,
    normalize_price,
    normalize_record,
    observation_checksum,
)


def raw_record(**changes: object) -> RawMarketRecord:
    values = {
        "crop_code": "TOMATO",
        "variety_name": "DEMO_STANDARD",
        "mandi_provider_name": "PROVIDER",
        "mandi_external_id": "M-1",
        "mandi_name": "Pune",
        "state": "Maharashtra",
        "min_price": "2800",
        "modal_price": "3100",
        "max_price": "3400",
        "price_unit": "INR/quintal",
        "currency": "inr",
        "arrival_quantity": "2.5",
        "arrival_unit": "quintal",
        "observed_at": datetime(2026, 9, 4, 9, tzinfo=UTC),
        "fetched_at": datetime(2026, 9, 4, 9, 5, tzinfo=UTC),
        "source_name": "PROVIDER",
        "source_id": "PRICE-1",
    }
    values.update(changes)
    return RawMarketRecord.model_validate(values)


def test_decimal_parsing_and_float_rejection() -> None:
    assert exact_decimal("31.25") == Decimal("31.25")
    with pytest.raises(MarketSourceInvalid):
        exact_decimal(31.25)  # type: ignore[arg-type]
    with pytest.raises(ValidationError):
        raw_record(min_price=28.0)


@pytest.mark.parametrize(
    ("unit", "raw", "expected"),
    [
        ("INR/kg", "31.005", Decimal("31.01")),
        ("INR/quintal", "3100", Decimal("31.00")),
        ("INR/q", "3100", Decimal("31.00")),
        ("INR/tonne", "31000", Decimal("31.00")),
        ("INR/metric_ton", "31000", Decimal("31.00")),
    ],
)
def test_price_conversion(unit: str, raw: str, expected: Decimal) -> None:
    assert normalize_price(raw, "INR", unit) == expected


@pytest.mark.parametrize(
    ("unit", "expected"),
    [
        ("kg", Decimal("2.500")),
        ("quintal", Decimal("250.000")),
        ("q", Decimal("250.000")),
        ("tonne", Decimal("2500.000")),
        ("metric_ton", Decimal("2500.000")),
    ],
)
def test_arrival_conversion(unit: str, expected: Decimal) -> None:
    assert normalize_arrival("2.5", unit) == expected


def test_unsupported_units_and_currency_are_rejected() -> None:
    with pytest.raises(UnsupportedMarketUnit):
        normalize_price("31", "INR", "")
    with pytest.raises(UnsupportedMarketUnit):
        normalize_arrival("1", "bag")
    with pytest.raises(UnsupportedCurrency):
        normalize_price("31", "USD", "INR/kg")


def test_normalized_validation_and_scale() -> None:
    result = normalize_record(
        raw_record(), mandi_id=UUID(int=1), crop_id=UUID(int=2), variety_id=UUID(int=3)
    )
    assert (result.min_price, result.modal_price, result.max_price) == (
        Decimal("28.00"),
        Decimal("31.00"),
        Decimal("34.00"),
    )
    assert result.arrival_quantity == Decimal("250.000")
    assert result.currency == "INR" and result.normalized_unit == "kg"


@pytest.mark.parametrize(
    ("minimum", "modal", "maximum", "arrival"),
    [
        (Decimal("-1"), Decimal("1"), Decimal("2"), None),
        (Decimal("2"), Decimal("1"), Decimal("3"), None),
        (Decimal("1"), Decimal("2"), Decimal("3"), Decimal("-1")),
    ],
)
def test_invalid_normalized_values_rejected(
    minimum: Decimal, modal: Decimal, maximum: Decimal, arrival: Decimal | None
) -> None:
    with pytest.raises(ValidationError):
        NormalizedMarketObservation(
            mandi_id=UUID(int=1),
            crop_id=UUID(int=2),
            min_price=minimum,
            modal_price=modal,
            max_price=maximum,
            arrival_quantity=arrival,
            observed_at=datetime.now(UTC),
            fetched_at=datetime.now(UTC),
            source_name="P",
            data_mode=DataMode.LIVE,
            checksum="x",
        )


def test_timezone_validation_and_kolkata_history_date() -> None:
    with pytest.raises(ValidationError):
        raw_record(observed_at=datetime(2026, 9, 4, 9))
    observed = datetime(2026, 9, 3, 20, tzinfo=UTC)
    assert history_date(observed) == datetime(2026, 9, 4).date()


def test_checksum_is_stable_and_ignores_dictionary_order() -> None:
    assert observation_checksum({"a": 1, "b": 2}) == observation_checksum({"b": 2, "a": 1})
    first = normalize_record(
        raw_record(fetched_at=datetime(2026, 9, 4, 10, tzinfo=UTC)),
        mandi_id=UUID(int=1),
        crop_id=UUID(int=2),
        variety_id=None,
    )
    second = normalize_record(
        raw_record(fetched_at=datetime(2026, 9, 4, 11, tzinfo=UTC)),
        mandi_id=UUID(int=1),
        crop_id=UUID(int=2),
        variety_id=None,
    )
    assert first.checksum == second.checksum


def test_cached_cannot_be_persisted() -> None:
    with pytest.raises(MarketSourceInvalid):
        normalize_record(
            raw_record(),
            mandi_id=UUID(int=1),
            crop_id=UUID(int=2),
            variety_id=None,
            mode=DataMode.CACHED,
        )
