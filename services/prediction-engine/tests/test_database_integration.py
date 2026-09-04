from __future__ import annotations

import os
from datetime import UTC, datetime
from decimal import Decimal

import asyncpg  # type: ignore[import-untyped]
import pytest

from prediction_engine.models import DataMode, PredictionQuery
from prediction_engine.repository import PostgresPredictionHistoryRepository

from .helpers import CROP, MANDI, VARIETY

pytestmark = pytest.mark.integration


@pytest.fixture
async def pool():  # type: ignore[no-untyped-def]
    database_url = os.getenv("PREDICTION_INTEGRATION_DATABASE_URL")
    if not database_url:
        pytest.skip("PREDICTION_INTEGRATION_DATABASE_URL is not configured")
    result = await asyncpg.create_pool(database_url, min_size=1, max_size=2)
    try:
        yield result
    finally:
        await result.close()


async def test_read_is_exact_oldest_first_decimal_and_non_mutating(pool) -> None:  # type: ignore[no-untyped-def]
    before_observations = await pool.fetchval("select count(*) from public.mandi_prices")
    before_history = await pool.fetchval("select count(*) from public.price_history")
    query = PredictionQuery(
        crop_id=CROP,
        variety_id=VARIETY,
        mandi_id=MANDI,
        horizon_days=3,
        data_mode=DataMode.DEMO,
        dataset_id="SIH-2026-TOMATO-V1",
    )
    rows = await PostgresPredictionHistoryRepository(pool).history(
        query, datetime(2026, 9, 3, tzinfo=UTC), 100
    )
    assert rows == sorted(rows, key=lambda row: (row.price_date, row.id.hex))
    assert all(isinstance(row.modal_price, Decimal) for row in rows)
    assert all(row.data_mode == DataMode.DEMO for row in rows)
    assert all(row.dataset_id == "SIH-2026-TOMATO-V1" for row in rows)
    assert all(row.observed_at <= datetime(2026, 9, 3, tzinfo=UTC) for row in rows)
    assert await pool.fetchval("select count(*) from public.mandi_prices") == before_observations
    assert await pool.fetchval("select count(*) from public.price_history") == before_history
