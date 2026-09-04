from __future__ import annotations

from dataclasses import dataclass

from .constants import (
    DEMO_DISCLAIMER,
    DISCLAIMER,
    MIN_DIMENSION_PX,
    MIN_PRODUCE_AREA_RATIO,
    SUPPORTED_MIME_TYPES,
    UNSUPPORTED_CLAIMS,
)
from .models import (
    DataMode,
    Observation,
    QualityRequest,
    QualityResult,
    ResultStatus,
    VisualObservations,
)


@dataclass(frozen=True)
class DemoFixture:
    crop: str
    color_uniformity: str
    defect_ratio: float
    damage: bool
    size_consistency: str
    ripeness: str


DEMO_FIXTURES = {
    "tomato": DemoFixture("tomato", "HIGH", 0.06, False, "CONSISTENT", "RIPE"),
    "potato": DemoFixture("potato", "MEDIUM", 0.08, True, "MIXED", "MATURE"),
}


class QualityService:
    engine_version = "quality-engine/0.1.0"
    demo_model_version = "deterministic-demo-fixture/1.0.0"

    def assess(self, request: QualityRequest) -> QualityResult:
        warnings = self._validate_image(request)
        if warnings:
            return self._unavailable(request, warnings)

        crop = request.crop.casefold()
        if request.data_mode is not DataMode.DEMO:
            return self._unavailable(request, ("NO_CONFIGURED_VISUAL_MODEL",))
        fixture = DEMO_FIXTURES.get(crop)
        if fixture is None:
            return self._unavailable(request, ("UNSUPPORTED_CROP",))

        observations = VisualObservations(
            visible_color_uniformity=Observation(value=fixture.color_uniformity),
            visible_surface_defect_ratio=Observation(value=fixture.defect_ratio),
            visible_damage_observed=Observation(value=fixture.damage),
            size_consistency=Observation(value=fixture.size_consistency),
            ripeness_stage=Observation(value=fixture.ripeness),
            image_quality=Observation(value="USABLE"),
        )
        return QualityResult(
            request_id=request.request_id,
            listing_id=request.listing_id,
            status=ResultStatus.AVAILABLE,
            assessment_type=DISCLAIMER,
            observations=observations,
            verification_status="MANUAL_VERIFICATION_REQUIRED",
            engine_version=self.engine_version,
            model_version=self.demo_model_version,
            configuration_version=request.configuration_version,
            calculated_at=request.as_of,
            data_mode=request.data_mode,
            source="LOCAL_DETERMINISTIC_DEMO_FIXTURE",
            warnings=(DEMO_DISCLAIMER,),
            limitations=self._limitations(),
        )

    @staticmethod
    def _validate_image(request: QualityRequest) -> tuple[str, ...]:
        image = request.image
        if image is None:
            return ("MISSING_IMAGE",)
        if image.mime_type not in SUPPORTED_MIME_TYPES:
            return ("UNSUPPORTED_FILE_TYPE",)
        if min(image.width_px, image.height_px) < MIN_DIMENSION_PX:
            return ("IMAGE_TOO_SMALL",)
        if image.blur_score is not None and image.blur_score >= 0.75:
            return ("IMAGE_BLURRED_OR_UNUSABLE",)
        if len(image.detected_produce_types) > 1:
            return ("MULTIPLE_PRODUCE_TYPES",)
        if (
            image.visible_produce_area_ratio is not None
            and image.visible_produce_area_ratio < MIN_PRODUCE_AREA_RATIO
        ):
            return ("INSUFFICIENT_VISIBLE_PRODUCE_AREA",)
        return ()

    def _unavailable(self, request: QualityRequest, warnings: tuple[str, ...]) -> QualityResult:
        unknown = Observation(value=None, confidence=None)
        image_quality = Observation(value="UNUSABLE", confidence=None)
        return QualityResult(
            request_id=request.request_id,
            listing_id=request.listing_id,
            status=ResultStatus.UNAVAILABLE,
            assessment_type=DISCLAIMER,
            observations=VisualObservations(
                visible_color_uniformity=unknown,
                visible_surface_defect_ratio=unknown,
                visible_damage_observed=unknown,
                size_consistency=unknown,
                ripeness_stage=unknown,
                image_quality=image_quality,
            ),
            verification_status="NOT_VERIFIED",
            engine_version=self.engine_version,
            model_version=None,
            configuration_version=request.configuration_version,
            calculated_at=request.as_of,
            data_mode=request.data_mode,
            source="IMAGE_METADATA_VALIDATION",
            warnings=warnings,
            limitations=self._limitations(),
        )

    @staticmethod
    def _limitations() -> tuple[str, ...]:
        return (DISCLAIMER, *(f"CANNOT_DETERMINE_{claim.upper()}" for claim in UNSUPPORTED_CLAIMS))
