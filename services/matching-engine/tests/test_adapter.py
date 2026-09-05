from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any
from uuid import UUID

import pytest

from matching_engine.adapter import Agent4MatchingEngineAdapter
from matching_engine.errors import MatchingInvalidRequest
from matching_engine.models import MatchingRequest
from matching_engine.service import MatchingService

from .helpers import NOW, candidate, listing, uid


@dataclass
class Request:
    request_id: UUID
    as_of: datetime
    configuration_version: str
    subject: dict[str, Any]


@pytest.mark.asyncio
async def test_agent4_adapter_compatibility() -> None:
    adapter = Agent4MatchingEngineAdapter(MatchingService(), result_factory=lambda **kw: kw)
    subject = MatchingRequest(listing=listing(), candidates=[candidate()]).model_dump(mode="json")
    result = await adapter.recommend(Request(uid(90), NOW, "v1", subject))
    assert result["engine_version"] == "matching-engine-v1"
    assert result["confidence"] is None
    assert result["data_mode"] == "LIVE"
    assert result["payload"]["recommendation"]["options"][0]["rank"] == 1


@pytest.mark.asyncio
async def test_agent4_adapter_rejects_invalid_subject() -> None:
    adapter = Agent4MatchingEngineAdapter(MatchingService(), result_factory=lambda **kw: kw)
    with pytest.raises(MatchingInvalidRequest):
        await adapter.recommend(Request(uid(90), NOW, "v1", {"unknown": True}))
