from __future__ import annotations

import json
from datetime import date, datetime
from decimal import Decimal
from typing import Any, cast
from uuid import UUID

import asyncpg  # type: ignore[import-untyped]

from ..errors import MarketPersistenceError
from ..freshness import FreshnessPolicy
from ..models import ComparisonItem, NormalizedMarketObservation


class PostgresMarketRepository:
    def __init__(self, pool: asyncpg.Pool) -> None:
        self.pool = pool

    async def resolve_crop(self, canonical_code: str) -> UUID | None:
        return cast(
            UUID | None,
            await self.pool.fetchval(
                "select id from public.crops where canonical_code=$1 and active", canonical_code
            ),
        )

    async def resolve_variety(self, canonical_name: str) -> tuple[UUID, UUID] | None:
        row = await self.pool.fetchrow(
            """select id,crop_id from public.crop_varieties
               where canonical_name=$1 and active order by id limit 1""",
            canonical_name,
        )
        return (row["id"], row["crop_id"]) if row else None

    async def validate_crop_variety(self, crop_id: UUID, variety_id: UUID) -> bool:
        return bool(
            await self.pool.fetchval(
                "select exists(select 1 from public.crop_varieties where id=$1 and crop_id=$2 and active)",
                variety_id,
                crop_id,
            )
        )

    async def resolve_mandi(self, provider_name: str, external_id: str) -> UUID | None:
        return cast(
            UUID | None,
            await self.pool.fetchval(
                "select id from public.mandis where provider_name=$1 and external_id=$2",
                provider_name,
                external_id,
            ),
        )

    async def upsert_provider_mandi(
        self, provider_name: str, external_id: str, name: str, district: str | None, state: str
    ) -> UUID:
        try:
            return cast(
                UUID,
                await self.pool.fetchval(
                    """insert into public.mandis(provider_name,external_id,name,district,state)
                   values($1,$2,$3,$4,$5)
                   on conflict (provider_name,external_id)
                   where provider_name is not null and external_id is not null
                   do update set name=excluded.name,district=excluded.district,state=excluded.state,
                                 active=true
                   returning id""",
                    provider_name,
                    external_id,
                    name,
                    district,
                    state,
                ),
            )
        except asyncpg.PostgresError as exc:
            raise MarketPersistenceError("provider mandi could not be persisted") from exc

    @staticmethod
    def _from_row(row: asyncpg.Record | dict[str, Any]) -> NormalizedMarketObservation:
        values = dict(row)
        flags = values.get("quality_flags", [])
        provenance = values.get("provenance", {})
        if isinstance(flags, str):
            flags = json.loads(flags)
        if isinstance(provenance, str):
            provenance = json.loads(provenance)
        currency = str(values["currency"]).strip()
        if currency != "INR":
            raise MarketPersistenceError("persisted market observation has unsupported currency")
        return NormalizedMarketObservation(
            id=values["id"],
            mandi_id=values["mandi_id"],
            crop_id=values["crop_id"],
            variety_id=values["variety_id"],
            min_price=values["min_price"],
            modal_price=values["modal_price"],
            max_price=values["max_price"],
            normalized_unit=values["normalized_unit"],
            currency=currency,  # type: ignore[arg-type]
            arrival_quantity=values["arrival_quantity"],
            observed_at=values["observed_at"],
            fetched_at=values["fetched_at"],
            source_name=values["source_name"],
            source_id=values["source_id"],
            provenance=provenance,
            data_mode=values["data_mode"],
            dataset_id=values["dataset_id"],
            source_version=values["source_version"],
            checksum=values["checksum"] or "",
            quality_flags=flags,
        )

    async def insert_observation(
        self, observation: NormalizedMarketObservation
    ) -> tuple[NormalizedMarketObservation, bool]:
        query = """insert into public.mandi_prices(
          mandi_id,crop_id,variety_id,min_price,modal_price,max_price,normalized_unit,currency,
          arrival_quantity,observed_at,fetched_at,source_name,source_id,provenance,data_mode,
          dataset_id,source_version,checksum,quality_flags)
          values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb,$15,$16,$17,$18,$19::jsonb)
          on conflict (source_name,source_id,mandi_id,crop_id,variety_id,observed_at)
          do nothing returning *"""
        args = (
            observation.mandi_id,
            observation.crop_id,
            observation.variety_id,
            observation.min_price,
            observation.modal_price,
            observation.max_price,
            observation.normalized_unit,
            observation.currency,
            observation.arrival_quantity,
            observation.observed_at,
            observation.fetched_at,
            observation.source_name,
            observation.source_id,
            json.dumps(observation.provenance),
            observation.data_mode.value,
            observation.dataset_id,
            observation.source_version,
            observation.checksum,
            json.dumps(observation.quality_flags),
        )
        try:
            row = await self.pool.fetchrow(query, *args)
            if row:
                return self._from_row(row), True
            row = await self.pool.fetchrow(
                """select * from public.mandi_prices where source_name=$1
                   and source_id is not distinct from $2 and mandi_id=$3 and crop_id=$4
                   and variety_id is not distinct from $5 and observed_at=$6""",
                observation.source_name,
                observation.source_id,
                observation.mandi_id,
                observation.crop_id,
                observation.variety_id,
                observation.observed_at,
            )
            if not row:
                raise MarketPersistenceError("duplicate observation could not be resolved")
            existing = self._from_row(row)
            if existing.checksum != observation.checksum:
                raise MarketPersistenceError(
                    "source identity collision has different normalized content"
                )
            return existing, False
        except asyncpg.PostgresError as exc:
            raise MarketPersistenceError("market observation could not be persisted") from exc

    async def _latest(
        self, subject: dict[str, Any], as_of: datetime, mode: str, dataset_id: str | None = None
    ) -> NormalizedMarketObservation | None:
        crop_id = UUID(str(subject["crop_id"]))
        variety = subject.get("variety_id")
        mandi = subject.get("mandi_id")
        row = await self.pool.fetchrow(
            """select * from public.mandi_prices where crop_id=$1
               and ($2::uuid is null or variety_id=$2) and ($3::uuid is null or mandi_id=$3)
               and data_mode=$4 and ($5::text is null or dataset_id=$5) and observed_at<=$6
               order by observed_at desc,id desc limit 1""",
            crop_id,
            UUID(str(variety)) if variety else None,
            UUID(str(mandi)) if mandi else None,
            mode,
            dataset_id,
            as_of,
        )
        return self._from_row(row) if row else None

    async def latest_genuine_observation(
        self, subject: dict[str, Any], as_of: datetime
    ) -> NormalizedMarketObservation | None:
        return await self._latest(subject, as_of, "LIVE")

    async def latest_demo_observation(
        self, subject: dict[str, Any], dataset_id: str, as_of: datetime
    ) -> NormalizedMarketObservation | None:
        return await self._latest(subject, as_of, "DEMO", dataset_id)

    async def create_history(
        self, observation: NormalizedMarketObservation, price_date: date, version: str
    ) -> UUID:
        if observation.id is None:
            raise MarketPersistenceError("persisted observation ID is required for history")
        row_id = await self.pool.fetchval(
            """insert into public.price_history(source_observation_id,mandi_id,crop_id,variety_id,
               price_date,modal_price,currency,transformation_version,data_mode,dataset_id,provenance)
               values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb)
               on conflict (source_observation_id,transformation_version) do nothing returning id""",
            observation.id,
            observation.mandi_id,
            observation.crop_id,
            observation.variety_id,
            price_date,
            observation.modal_price,
            observation.currency,
            version,
            observation.data_mode.value,
            observation.dataset_id,
            json.dumps(observation.provenance),
        )
        if row_id:
            return cast(UUID, row_id)
        existing = await self.pool.fetchval(
            "select id from public.price_history where source_observation_id=$1 and transformation_version=$2",
            observation.id,
            version,
        )
        if not existing:
            raise MarketPersistenceError("history row could not be resolved")
        return cast(UUID, existing)

    async def market_history(
        self, crop_id: UUID, variety_id: UUID | None, mandi_ids: list[UUID], limit: int
    ) -> list[dict[str, Any]]:
        rows = await self.pool.fetch(
            """select * from public.price_history where crop_id=$1
               and ($2::uuid is null or variety_id=$2)
               and (cardinality($3::uuid[])=0 or mandi_id=any($3::uuid[]))
               order by price_date desc,id desc limit $4""",
            crop_id,
            variety_id,
            mandi_ids,
            limit,
        )
        return [dict(row) for row in rows]

    async def comparison(
        self, crop_id: UUID, variety_id: UUID | None, mandi_ids: list[UUID], as_of: datetime
    ) -> list[ComparisonItem]:
        rows = await self.pool.fetch(
            """select distinct on (mandi_id) mandi_id,min_price,modal_price,max_price,
               arrival_quantity,observed_at,data_mode from public.mandi_prices
               where crop_id=$1 and ($2::uuid is null or variety_id=$2)
               and (cardinality($3::uuid[])=0 or mandi_id=any($3::uuid[])) and observed_at<=$4
               order by mandi_id,observed_at desc,id desc""",
            crop_id,
            variety_id,
            mandi_ids,
            as_of,
        )
        result = [
            ComparisonItem(
                mandi_id=row["mandi_id"],
                min_price=Decimal(row["min_price"]),
                modal_price=Decimal(row["modal_price"]),
                max_price=Decimal(row["max_price"]),
                arrival_quantity=row["arrival_quantity"],
                observed_at=row["observed_at"],
                source_age_seconds=FreshnessPolicy.age_seconds(row["observed_at"], as_of),
                data_mode=row["data_mode"],
            )
            for row in rows
        ]
        return sorted(result, key=lambda item: (-item.modal_price, item.mandi_id.hex))
