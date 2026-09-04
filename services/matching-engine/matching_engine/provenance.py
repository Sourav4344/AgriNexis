from __future__ import annotations

from collections.abc import Iterable

from .models import DataMode


def propagate_data_mode(modes: Iterable[DataMode | None]) -> DataMode | None:
    values = list(modes)
    if not values or any(value is None for value in values):
        return None
    if DataMode.DEMO in values:
        return DataMode.DEMO
    if DataMode.CACHED in values:
        return DataMode.CACHED
    return DataMode.LIVE
