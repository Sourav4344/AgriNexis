from __future__ import annotations

import pytest

from matching_engine.errors import MatchingPersistenceError
from matching_engine.repository import read_actionable_candidates

from .helpers import NOW, listing


class BrokenRepository:
    async def actionable_candidates(self, listing, as_of):  # type: ignore[no-untyped-def]
        raise RuntimeError("secret database detail")


@pytest.mark.asyncio
async def test_database_failure_is_sanitized() -> None:
    with pytest.raises(MatchingPersistenceError, match="could not be read") as raised:
        await read_actionable_candidates(BrokenRepository(), listing(), NOW)
    assert "secret database detail" not in str(raised.value)
