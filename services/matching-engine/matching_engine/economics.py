from __future__ import annotations

from decimal import ROUND_HALF_UP, Decimal

from .models import MONEY_QUANTUM, RATIO_QUANTUM, Economics, LogisticsQuote


def money(value: Decimal) -> Decimal:
    return value.quantize(MONEY_QUANTUM, rounding=ROUND_HALF_UP)


def validate_quote_total(quote: LogisticsQuote) -> bool:
    expected = money(
        quote.transportation_cost
        + quote.storage_cost
        + quote.handling_cost
        + quote.other_applicable_cost
    )
    return quote.total_applicable_cost == expected


def calculate_economics(
    quantity_kg: Decimal, unit_price_per_kg: Decimal, quote: LogisticsQuote
) -> Economics:
    if quantity_kg <= 0:
        raise ValueError("quantity must be positive")
    if not validate_quote_total(quote):
        raise ValueError("quote total does not equal itemized costs")
    gross = money(quantity_kg * unit_price_per_kg)
    total = quote.total_applicable_cost
    nfr = money(gross - total)
    nfr_per_kg = (nfr / quantity_kg).quantize(RATIO_QUANTUM, rounding=ROUND_HALF_UP)
    return Economics(
        gross_selling_value=gross,
        transportation_cost=quote.transportation_cost,
        storage_cost=quote.storage_cost,
        handling_cost=quote.handling_cost,
        other_applicable_cost=quote.other_applicable_cost,
        total_applicable_cost=total,
        net_farmer_realization=nfr,
        net_farmer_realization_per_kg=nfr_per_kg,
    )
