from __future__ import annotations

from decimal import ROUND_HALF_UP, Decimal, InvalidOperation
from typing import Annotated

from pydantic import BeforeValidator, PlainSerializer

MONEY_QUANTUM = Decimal("0.01")
QUANTITY_QUANTUM = Decimal("0.001")
MAX_MONEY = Decimal("999999999999.99")
MAX_QUANTITY = Decimal("99999999999.999")


def _parse_decimal(value: object) -> Decimal:
    if isinstance(value, bool) or isinstance(value, float):
        raise ValueError("decimal values must be strings or exact integers")
    try:
        parsed = Decimal(str(value))
    except (InvalidOperation, ValueError) as exc:
        raise ValueError("invalid decimal value") from exc
    if not parsed.is_finite():
        raise ValueError("decimal value must be finite")
    return parsed


DecimalString = Annotated[
    Decimal,
    BeforeValidator(_parse_decimal),
    PlainSerializer(lambda value: format(value, "f"), return_type=str),
]


def money(value: Decimal) -> Decimal:
    result = value.quantize(MONEY_QUANTUM, rounding=ROUND_HALF_UP)
    if abs(result) > MAX_MONEY:
        raise ValueError("money amount exceeds numeric(14,2)")
    return result


def quantity(value: Decimal) -> Decimal:
    result = value.quantize(QUANTITY_QUANTUM, rounding=ROUND_HALF_UP)
    if abs(result) > MAX_QUANTITY:
        raise ValueError("quantity exceeds numeric(14,3)")
    return result


def calculate_nfr(
    quantity_kg: Decimal,
    unit_price_per_kg: Decimal,
    transportation_cost: Decimal,
    storage_cost: Decimal,
    handling_cost: Decimal,
    other_applicable_cost: Decimal,
) -> tuple[Decimal, Decimal, Decimal]:
    gross = money(quantity_kg * unit_price_per_kg)
    total = money(
        money(transportation_cost)
        + money(storage_cost)
        + money(handling_cost)
        + money(other_applicable_cost)
    )
    return gross, total, money(gross - total)

