from __future__ import annotations

import json
from datetime import datetime
from decimal import Decimal
from typing import Any, Literal, cast

import asyncpg  # type: ignore[import-untyped]

from .errors import PredictionPersistenceReadError
from .models import DataMode, HistoryObservation, PredictionQuery


class PostgresPredictionHistoryRepository:
    """Read-only, leakage-safe access to one exact normalized market series."""

    def __init__(self, pool: asyncpg.Pool) -> None:
        self.pool = pool

    @staticmethod
    def _observation(row: asyncpg.Record | dict[str, Any]) -> HistoryObservation:
        values = dict(row)
        provenance = values["provenance"]
        if isinstance(provenance, str):
            provenance = json.loads(provenance)
        return HistoryObservation(
            id=values["id"],
            source_observation_id=values["source_observation_id"],
            mandi_id=values["mandi_id"],
            crop_id=values["crop_id"],
            variety_id=values["variety_id"],
            price_date=values["price_date"],
            modal_price=Decimal(values["modal_price"]),
            currency=cast(Literal["INR"], str(values["currency"]).strip()),
            normalized_unit=values["normalized_unit"],
            arrival_quantity=values["arrival_quantity"],
            observed_at=values["observed_at"],
            source_name=values["source_name"],
            transformation_version=values["transformation_version"],
            data_mode=values["data_mode"],
            dataset_id=values["dataset_id"],
            provenance=provenance,
        )

    async def history(
        self, query: PredictionQuery, as_of: datetime, limit: int
    ) -> list[HistoryObservation]:
        if as_of.tzinfo is None or as_of.utcoffset() is None:
            raise ValueError("as_of must be timezone-aware")
        if limit <= 0:
            raise ValueError("history limit must be positive")
        stored_mode = (
            DataMode.DEMO.value if query.data_mode == DataMode.DEMO else DataMode.LIVE.value
        )
        sql = """with eligible as (
          select distinct on (ph.price_date)
            ph.id,ph.source_observation_id,ph.mandi_id,ph.crop_id,ph.variety_id,
            ph.price_date,ph.modal_price,ph.currency,ph.transformation_version,
            ph.data_mode,ph.dataset_id,ph.provenance,mp.normalized_unit,
            mp.arrival_quantity,mp.observed_at,mp.source_name
          from public.price_history ph
          join public.mandi_prices mp on mp.id=ph.source_observation_id
          where ph.crop_id=$1 and ph.variety_id is not distinct from $2
            and ph.mandi_id=$3 and btrim(ph.currency::text)=$4
            and mp.normalized_unit=$5 and ph.data_mode=$6
            and ph.dataset_id is not distinct from $7 and mp.observed_at<=$8
          order by ph.price_date,mp.observed_at desc,ph.id desc
        ), bounded as (
          select * from eligible order by price_date desc,id desc limit $9
        ) select * from bounded order by price_date,id"""
        try:
            rows = await self.pool.fetch(
                sql,
                query.crop_id,
                query.variety_id,
                query.mandi_id,
                query.currency,
                query.normalized_unit,
                stored_mode,
                query.dataset_id,
                as_of,
                limit,
            )
        except asyncpg.PostgresError as exc:
            raise PredictionPersistenceReadError("market history could not be read") from exc
        return [self._observation(row) for row in rows]


def memory_series_matches(item: HistoryObservation, query: PredictionQuery) -> bool:
    stored_mode = DataMode.DEMO if query.data_mode == DataMode.DEMO else DataMode.LIVE
    return (
        item.crop_id == query.crop_id
        and item.variety_id == query.variety_id
        and item.mandi_id == query.mandi_id
        and item.currency == query.currency
        and item.normalized_unit == query.normalized_unit
        and item.data_mode == stored_mode
        and item.dataset_id == query.dataset_id
    )


class MemoryPredictionHistoryRepository:
    def __init__(self, rows: list[HistoryObservation] | None = None, fail: Exception | None = None) -> None:
        self.rows = rows or []
        self.fail = fail

    async def history(
        self, request: PredictionQuery, as_of: datetime, limit: int
    ) -> list[HistoryObservation]:
        if self.fail:
            raise self.fail
        rows = [
            row
            for row in self.rows
            if memory_series_matches(row, request) and row.observed_at <= as_of
        ]
        return sorted(rows, key=lambda row: (row.price_date, row.observed_at, row.id.hex))[-limit:]
