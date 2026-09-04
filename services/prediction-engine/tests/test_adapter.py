from dataclasses import dataclass
from typing import Any
from uuid import uuid4

import pytest

from prediction_engine.adapter import Agent4PredictionEngineAdapter
from prediction_engine.errors import PredictionInvalidRequest
from prediction_engine.service import PredictionService

from .helpers import AS_OF, CROP, MANDI, VARIETY, MemoryRepository, observation


@dataclass
class Request:
    request_id: Any
    as_of: Any
    configuration_version: str
    subject: dict[str, Any]


class Result:
    def __init__(self, **values: Any) -> None:
        self.__dict__.update(values)


async def test_agent4_adapter_shape_decimal_json_and_default_horizon() -> None:
    adapter = Agent4PredictionEngineAdapter(
        PredictionService(MemoryRepository([observation(i, "30.25") for i in range(7)])),
        Result,
    )
    result = await adapter.predict(
        Request(
            uuid4(),
            AS_OF,
            "request-config-v1",
            {"crop_id": str(CROP), "variety_id": str(VARIETY), "mandi_id": str(MANDI)},
        )
    )
    assert result.engine_version == "prediction-engine-v1"
    assert result.data_mode == "LIVE"
    assert result.confidence is None
    assert result.payload["prediction"]["point_estimate"] == "30.25"
    assert result.payload["prediction"]["horizon_days"] == 3


@pytest.mark.parametrize(
    "subject",
    [
        {},
        {"crop_id": str(CROP), "mandi_id": str(MANDI), "horizon_days": 7},
        {
            "crop_id": str(CROP),
            "mandi_id": str(MANDI),
            "data_mode": "DEMO",
        },
        {"crop_id": str(CROP), "mandi_id": str(MANDI), "private_coordinates": [1, 2]},
    ],
)
async def test_invalid_subject_is_sanitized(subject: dict[str, Any]) -> None:
    adapter = Agent4PredictionEngineAdapter(PredictionService(MemoryRepository([])), Result)
    with pytest.raises(PredictionInvalidRequest, match="prediction subject is invalid"):
        await adapter.predict(Request(uuid4(), AS_OF, "v1", subject))
