from __future__ import annotations

from datetime import UTC, datetime
from types import SimpleNamespace
from uuid import UUID

import pytest
from pydantic import ValidationError

from quality_engine.adapter import Agent4QualityEngineAdapter
from quality_engine.constants import DEMO_DISCLAIMER, DISCLAIMER, UNSUPPORTED_CLAIMS
from quality_engine.errors import QualityInvalidRequest
from quality_engine.models import DataMode, ImageMetadata, QualityRequest, ResultStatus
from quality_engine.service import QualityService

REQUEST_ID = UUID("00000000-0000-4000-8000-000000000010")
LISTING_ID = UUID("00000000-0000-4000-8000-000000000020")
AS_OF = datetime(2026, 9, 3, 9, tzinfo=UTC)


def image(**overrides: object) -> ImageMetadata:
    values: dict[str, object] = {
        "asset_id": "00000000-0000-4000-8000-000000000030",
        "mime_type": "image/jpeg",
        "size_bytes": 500_000,
        "width_px": 1024,
        "height_px": 768,
        "checksum_sha256": "a" * 64,
        "blur_score": 0.1,
        "visible_produce_area_ratio": 0.8,
        "detected_produce_types": ("tomato",),
    }
    values.update(overrides)
    return ImageMetadata.model_validate(values)


def request(**overrides: object) -> QualityRequest:
    values: dict[str, object] = {
        "request_id": REQUEST_ID,
        "listing_id": LISTING_ID,
        "image": image(),
        "crop": "tomato",
        "variety": "Roma",
        "as_of": AS_OF,
        "configuration_version": "quality-demo-v1",
        "data_mode": DataMode.DEMO,
    }
    values.update(overrides)
    return QualityRequest.model_validate(values)


def assess(**overrides: object):  # type: ignore[no-untyped-def]
    return QualityService().assess(request(**overrides))


def test_missing_image_is_structured_unavailable() -> None:
    result = assess(image=None)
    assert result.status is ResultStatus.UNAVAILABLE
    assert result.warnings == ("MISSING_IMAGE",)


@pytest.mark.parametrize("field,value", [("size_bytes", 0), ("width_px", 0), ("height_px", 0)])
def test_invalid_image_numeric_metadata_is_rejected(field: str, value: int) -> None:
    with pytest.raises(ValidationError):
        image(**{field: value})


def test_invalid_checksum_is_rejected() -> None:
    with pytest.raises(ValidationError):
        image(checksum_sha256="private-url-or-not-a-hash")


def test_extra_image_fields_such_as_private_url_are_rejected() -> None:
    with pytest.raises(ValidationError):
        image(url="https://secret.example/token")


def test_unsupported_file_is_unavailable() -> None:
    assert assess(image=image(mime_type="application/pdf")).warnings == ("UNSUPPORTED_FILE_TYPE",)


def test_small_image_is_unavailable() -> None:
    assert assess(image=image(width_px=255)).warnings == ("IMAGE_TOO_SMALL",)


def test_blurred_image_is_unavailable() -> None:
    assert assess(image=image(blur_score=0.75)).warnings == ("IMAGE_BLURRED_OR_UNUSABLE",)


def test_multiple_produce_types_are_unavailable() -> None:
    value = image(detected_produce_types=("tomato", "onion"))
    assert assess(image=value).warnings == ("MULTIPLE_PRODUCE_TYPES",)


def test_insufficient_visible_area_is_unavailable() -> None:
    value = image(visible_produce_area_ratio=0.19)
    assert assess(image=value).warnings == ("INSUFFICIENT_VISIBLE_PRODUCE_AREA",)


def test_unknown_crop_is_unavailable_and_observations_are_null() -> None:
    result = assess(crop="dragon fruit")
    assert result.warnings == ("UNSUPPORTED_CROP",)
    assert result.observations.ripeness_stage.value is None


def test_live_mode_never_uses_demo_fixture() -> None:
    result = assess(data_mode=DataMode.LIVE)
    assert result.status is ResultStatus.UNAVAILABLE
    assert result.model_version is None
    assert result.warnings == ("NO_CONFIGURED_VISUAL_MODEL",)


def test_cached_mode_never_uses_demo_fixture() -> None:
    assert assess(data_mode=DataMode.CACHED).source == "IMAGE_METADATA_VALIDATION"


def test_demo_provenance_is_explicit() -> None:
    result = assess()
    assert result.data_mode is DataMode.DEMO
    assert result.source == "LOCAL_DETERMINISTIC_DEMO_FIXTURE"
    assert DEMO_DISCLAIMER in result.warnings


def test_assessment_disclaimer_is_always_present() -> None:
    result = assess()
    assert result.assessment_type == DISCLAIMER
    assert DISCLAIMER in result.limitations


def test_no_fake_lab_claims_are_returned() -> None:
    serialized = assess().model_dump_json().casefold()
    for claim in UNSUPPORTED_CLAIMS:
        assert f"cannot_determine_{claim}" in serialized


def test_no_universal_grade_field_exists() -> None:
    serialized = assess().model_dump()
    assert "grade" not in serialized
    assert "declared_grade" not in serialized


def test_observation_confidence_is_individual_and_null_when_uncalibrated() -> None:
    result = assess()
    assert result.observations.visible_color_uniformity.confidence is None
    assert "confidence" not in result.model_fields_set


def test_demo_is_deterministic_for_identical_input() -> None:
    assert QualityService().assess(request()) == QualityService().assess(request())


def test_calculated_at_uses_request_as_of_not_wall_clock() -> None:
    assert assess().calculated_at == AS_OF


def test_naive_as_of_is_rejected() -> None:
    with pytest.raises(ValidationError):
        request(as_of=datetime(2026, 9, 3, 9))


def test_request_rejects_unknown_fields() -> None:
    with pytest.raises(ValidationError):
        request(secret="do-not-store")


def test_verification_is_never_certified() -> None:
    assert assess().verification_status == "MANUAL_VERIFICATION_REQUIRED"
    assert assess(image=None).verification_status == "NOT_VERIFIED"


@pytest.mark.asyncio
async def test_adapter_is_agent4_compatible_and_has_no_combined_confidence() -> None:
    agent_request = SimpleNamespace(
        request_id=REQUEST_ID,
        as_of=AS_OF,
        configuration_version="quality-demo-v1",
        subject={
            "listing_id": str(LISTING_ID),
            "image": image().model_dump(mode="json"),
            "crop": "tomato",
            "variety": None,
            "data_mode": "DEMO",
        },
    )
    adapter = Agent4QualityEngineAdapter(QualityService(), result_factory=SimpleNamespace)
    result = await adapter.assess(agent_request)
    assert result.confidence is None
    assert result.payload["quality"]["assessment_type"] == DISCLAIMER


@pytest.mark.asyncio
async def test_adapter_returns_sanitized_validation_error() -> None:
    agent_request = SimpleNamespace(
        request_id=REQUEST_ID,
        as_of=AS_OF,
        configuration_version="v1",
        subject={"listing_id": str(LISTING_ID), "crop": "tomato", "data_mode": "DEMO"},
    )
    adapter = Agent4QualityEngineAdapter(QualityService(), result_factory=SimpleNamespace)
    with pytest.raises(QualityInvalidRequest, match="quality request is invalid") as captured:
        await adapter.assess(agent_request)
    assert "https://" not in str(captured.value)


def test_only_safe_visible_observation_names_are_exposed() -> None:
    names = set(assess().observations.model_dump())
    assert names == {
        "visible_color_uniformity",
        "visible_surface_defect_ratio",
        "visible_damage_observed",
        "size_consistency",
        "ripeness_stage",
        "image_quality",
    }
