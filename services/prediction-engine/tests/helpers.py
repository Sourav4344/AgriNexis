from __future__ import annotations

from datetime import UTC, date, datetime, time, timedelta
from decimal import Decimal
from uuid import UUID

from prediction_engine.models import DataMode, HistoryObservation, PredictionQuery
from prediction_engine.repository import memory_series_matches

CROP = UUID("10000000-0000-4000-8000-000000000001")
VARIETY = UUID("20000000-0000-4000-8000-000000000001")
MANDI = UUID("30000000-0000-4000-8000-000000000001")
OTHER_MANDI = UUID("30000000-0000-4000-8000-000000000002")
AS_OF = datetime(2026, 9, 8, 12, tzinfo=UTC)


def observation(
    offset: int,
    price: str | Decimal,
    *,
    mode: DataMode = DataMode.LIVE,
    dataset_id: str | None = None,
    mandi_id: UUID = MANDI,
    observed_hour: int = 9,
) -> HistoryObservation:
    day = date(2026, 9, 1) + timedelta(days=offset)
    suffix = offset * 10 + observed_hour
    return HistoryObservation(
        id=UUID(f"00000000-0000-4000-8000-{suffix:012d}"),
        source_observation_id=UUID(f"00000000-0000-4001-8000-{suffix:012d}"),
        mandi_id=mandi_id,
        crop_id=CROP,
        variety_id=VARIETY,
        price_date=day,
        modal_price=Decimal(price),
        currency="INR",
        normalized_unit="kg",
        arrival_quantity=None,
        observed_at=datetime.combine(day, time(observed_hour), UTC),
        source_name="AGRINEXIS_DEMO" if mode == DataMode.DEMO else "TEST_PROVIDER",
        transformation_version="market-history-v1",
        data_mode=mode,
        dataset_id=dataset_id,
        provenance={"test": True},
    )


def query(
    *,
    horizon: int = 3,
    mode: DataMode = DataMode.LIVE,
    dataset_id: str | None = None,
    mandi_id: UUID = MANDI,
) -> PredictionQuery:
    return PredictionQuery(
        crop_id=CROP,
        variety_id=VARIETY,
        mandi_id=mandi_id,
        horizon_days=horizon,
        data_mode=mode,
        dataset_id=dataset_id,
    )


class MemoryRepository:
    def __init__(self, rows: list[HistoryObservation], fail: Exception | None = None) -> None:
        self.rows = rows
        self.fail = fail
        self.requested_limit: int | None = None

    async def history(
        self, request: PredictionQuery, as_of: datetime, limit: int
    ) -> list[HistoryObservation]:
        if self.fail:
            raise self.fail
        self.requested_limit = limit
        rows = [
            row
            for row in self.rows
            if memory_series_matches(row, request) and row.observed_at <= as_of
        ]
        return sorted(rows, key=lambda row: (row.price_date, row.observed_at, row.id.hex))[-limit:]
