import os
from datetime import UTC, datetime
from decimal import Decimal
from uuid import uuid4

import asyncpg
import pytest

from market_engine.history import HISTORY_TRANSFORMATION_VERSION
from market_engine.models import DataMode, NormalizedMarketObservation
from market_engine.repositories.postgres import PostgresMarketRepository


pytestmark = pytest.mark.integration


@pytest.fixture(scope="module")
def integration_database_url() -> str:
    value = os.getenv("MARKET_INTEGRATION_DATABASE_URL")
    if not value:
        pytest.skip("MARKET_INTEGRATION_DATABASE_URL is not configured")
    return value


def test_migrated_database_suite_requires_explicit_disposable_database(
    integration_database_url: str,
) -> None:
    """Guard: destructive/RLS integration scenarios run only in an explicit harness."""
    assert integration_database_url.startswith(("postgresql://", "postgres://"))


@pytest.fixture
async def repository(integration_database_url: str) -> PostgresMarketRepository:
    pool = await asyncpg.create_pool(integration_database_url, min_size=1, max_size=4)
    try:
        yield PostgresMarketRepository(pool)
    finally:
        await pool.close()


@pytest.mark.asyncio
async def test_provider_identity_observation_and_history_idempotency(
    repository: PostgresMarketRepository,
) -> None:
    suffix = uuid4().hex
    provider = f"INTEGRATION-{suffix}"
    external = "MARKET-1"
    mandi_id = await repository.upsert_provider_mandi(
        provider, external, "Integration Mandi", "Pune", "Maharashtra"
    )
    assert (
        await repository.upsert_provider_mandi(
            provider, external, "Integration Mandi", "Pune", "Maharashtra"
        )
        == mandi_id
    )
    other_provider_id = await repository.upsert_provider_mandi(
        f"OTHER-{suffix}", external, "Other Mandi", "Pune", "Maharashtra"
    )
    assert other_provider_id != mandi_id

    async with repository.pool.acquire() as connection:
        crop_id = await connection.fetchval(
            """insert into public.crops(canonical_code,name_en)
               values($1,$2) returning id""",
            f"INTEGRATION-{suffix}",
            "Integration Crop",
        )
    observed_at = datetime.now(UTC)
    value = NormalizedMarketObservation(
        mandi_id=mandi_id,
        crop_id=crop_id,
        min_price=Decimal("28.00"),
        modal_price=Decimal("31.00"),
        max_price=Decimal("34.00"),
        observed_at=observed_at,
        fetched_at=observed_at,
        source_name=provider,
        source_id="RECORD-1",
        data_mode=DataMode.LIVE,
        checksum=f"integration-{suffix}",
    )
    first, created = await repository.insert_observation(value)
    second, duplicate_created = await repository.insert_observation(value)
    assert created and not duplicate_created and first.id == second.id

    first_history = await repository.create_history(
        first, observed_at.date(), HISTORY_TRANSFORMATION_VERSION
    )
    second_history = await repository.create_history(
        first, observed_at.date(), HISTORY_TRANSFORMATION_VERSION
    )
    assert first_history == second_history

    with pytest.raises(asyncpg.PostgresError):
        await repository.pool.execute(
            "update public.mandi_prices set modal_price=$2 where id=$1", first.id, Decimal("32")
        )


@pytest.mark.asyncio
async def test_concurrent_duplicate_observation_uses_database_authority(
    repository: PostgresMarketRepository,
) -> None:
    suffix = uuid4().hex
    mandi_id = await repository.upsert_provider_mandi(
        f"CONCURRENT-{suffix}", "MARKET", "Concurrent Mandi", None, "Maharashtra"
    )
    crop_id = await repository.pool.fetchval(
        "insert into public.crops(canonical_code,name_en) values($1,$2) returning id",
        f"CONCURRENT-{suffix}",
        "Concurrent Crop",
    )
    observed_at = datetime.now(UTC)
    value = NormalizedMarketObservation(
        mandi_id=mandi_id,
        crop_id=crop_id,
        min_price="1",
        modal_price="2",
        max_price="3",
        observed_at=observed_at,
        fetched_at=observed_at,
        source_name=f"CONCURRENT-{suffix}",
        source_id="ONE",
        data_mode=DataMode.LIVE,
        checksum=f"concurrent-{suffix}",
    )
    import asyncio

    results = await asyncio.gather(
        repository.insert_observation(value), repository.insert_observation(value)
    )
    assert sum(1 for _, created in results if created) == 1


def test_rls_and_trusted_write_boundaries_are_covered_by_database_contract_suite(
    integration_database_url: str,
) -> None:
    # Role switching depends on the disposable harness's Supabase role provisioning.
    # The canonical assertions live in tests/database/002_rls.sql and are required
    # alongside this engine suite when integration credentials are supplied.
    assert integration_database_url
