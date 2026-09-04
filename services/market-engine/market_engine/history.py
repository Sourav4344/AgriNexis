from __future__ import annotations

from datetime import date, datetime
from zoneinfo import ZoneInfo

HISTORY_TRANSFORMATION_VERSION = "market-history-v1"


def history_date(observed_at: datetime, timezone_name: str = "Asia/Kolkata") -> date:
    if observed_at.tzinfo is None or observed_at.utcoffset() is None:
        raise ValueError("observed_at must be timezone-aware")
    return observed_at.astimezone(ZoneInfo(timezone_name)).date()
