from __future__ import annotations

import hashlib
import json
from decimal import ROUND_HALF_UP, Decimal, InvalidOperation
from typing import Any
from uuid import UUID

from .errors import MarketSourceInvalid, UnsupportedCurrency, UnsupportedMarketUnit
from .models import DataMode, NormalizedMarketObservation, RawMarketRecord

PRICE_QUANTUM = Decimal("0.01")
QUANTITY_QUANTUM = Decimal("0.001")
PRICE_DIVISORS = {
    "INR/kg": Decimal("1"),
    "INR/quintal": Decimal("100"),
    "INR/q": Decimal("100"),
    "INR/tonne": Decimal("1000"),
    "INR/metric_ton": Decimal("1000"),
}
ARRIVAL_MULTIPLIERS = {
    "kg": Decimal("1"),
    "quintal": Decimal("100"),
    "q": Decimal("100"),
    "tonne": Decimal("1000"),
    "metric_ton": Decimal("1000"),
}


def exact_decimal(value: str | int | Decimal) -> Decimal:
    if isinstance(value, (float, bool)):
        raise MarketSourceInvalid("decimal input must be a string or exact integer")
    try:
        parsed = Decimal(str(value))
    except (InvalidOperation, ValueError) as exc:
        raise MarketSourceInvalid("invalid decimal value") from exc
    if not parsed.is_finite():
        raise MarketSourceInvalid("decimal value must be finite")
    return parsed


def normalize_price(value: str | int | Decimal, currency: str, unit: str) -> Decimal:
    canonical_currency = currency.upper()
    if canonical_currency != "INR":
        raise UnsupportedCurrency("only INR market prices are supported")
    if unit not in PRICE_DIVISORS:
        raise UnsupportedMarketUnit("unsupported or missing market price unit")
    return (exact_decimal(value) / PRICE_DIVISORS[unit]).quantize(
        PRICE_QUANTUM, rounding=ROUND_HALF_UP
    )


def normalize_arrival(value: str | int | Decimal | None, unit: str | None) -> Decimal | None:
    if value is None:
        return None
    if unit not in ARRIVAL_MULTIPLIERS:
        raise UnsupportedMarketUnit("unsupported or missing arrival unit")
    return (exact_decimal(value) * ARRIVAL_MULTIPLIERS[unit]).quantize(
        QUANTITY_QUANTUM, rounding=ROUND_HALF_UP
    )


def observation_checksum(content: dict[str, Any]) -> str:
    encoded = json.dumps(content, sort_keys=True, separators=(",", ":"), default=str)
    return "sha256:" + hashlib.sha256(encoded.encode("utf-8")).hexdigest()


def normalize_record(
    raw: RawMarketRecord,
    *,
    mandi_id: UUID,
    crop_id: UUID,
    variety_id: UUID | None,
    mode: DataMode = DataMode.LIVE,
) -> NormalizedMarketObservation:
    if mode == DataMode.CACHED:
        raise MarketSourceInvalid("CACHED is a delivery mode and cannot be persisted")
    currency = raw.currency.upper()
    min_price = normalize_price(raw.min_price, currency, raw.price_unit)
    modal_price = normalize_price(raw.modal_price, currency, raw.price_unit)
    max_price = normalize_price(raw.max_price, currency, raw.price_unit)
    arrival_quantity = normalize_arrival(raw.arrival_quantity, raw.arrival_unit)
    checksum_values = {
        "mandi_id": str(mandi_id),
        "crop_id": str(crop_id),
        "variety_id": str(variety_id) if variety_id else None,
        "min_price": str(min_price),
        "modal_price": str(modal_price),
        "max_price": str(max_price),
        "arrival_quantity": str(arrival_quantity) if arrival_quantity is not None else None,
        "observed_at": raw.observed_at.isoformat(),
        "source_name": raw.source_name,
        "source_id": raw.source_id,
        "dataset_id": raw.dataset_id,
        "source_version": raw.source_version,
    }
    return NormalizedMarketObservation(
        mandi_id=mandi_id,
        crop_id=crop_id,
        variety_id=variety_id,
        min_price=min_price,
        modal_price=modal_price,
        max_price=max_price,
        arrival_quantity=arrival_quantity,
        observed_at=raw.observed_at,
        fetched_at=raw.fetched_at,
        source_name=raw.source_name,
        source_id=raw.source_id,
        provenance=raw.provenance,
        data_mode=mode,
        dataset_id=raw.dataset_id,
        source_version=raw.source_version,
        checksum=observation_checksum(checksum_values),
        quality_flags=raw.quality_flags,
    )
