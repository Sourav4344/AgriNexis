from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator

SafeText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=120)]


class DataMode(StrEnum):
    LIVE = "LIVE"
    CACHED = "CACHED"
    DEMO = "DEMO"


class ResultStatus(StrEnum):
    AVAILABLE = "AVAILABLE"
    UNAVAILABLE = "UNAVAILABLE"


class ImageMetadata(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    asset_id: UUID
    mime_type: SafeText
    size_bytes: int = Field(gt=0, le=20_000_000)
    width_px: int = Field(gt=0, le=50_000)
    height_px: int = Field(gt=0, le=50_000)
    checksum_sha256: Annotated[str, StringConstraints(pattern=r"^[a-fA-F0-9]{64}$")]
    blur_score: float | None = Field(default=None, ge=0, le=1)
    visible_produce_area_ratio: float | None = Field(default=None, ge=0, le=1)
    detected_produce_types: tuple[SafeText, ...] = ()

    @field_validator("mime_type")
    @classmethod
    def normalize_mime(cls, value: str) -> str:
        return value.lower()


class QualityRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    request_id: UUID
    listing_id: UUID
    image: ImageMetadata | None
    crop: SafeText
    variety: SafeText | None = None
    as_of: datetime
    configuration_version: SafeText
    data_mode: DataMode

    @field_validator("as_of")
    @classmethod
    def require_timezone(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("as_of must be timezone-aware")
        return value


class Observation(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    value: str | float | bool | None
    confidence: float | None = Field(default=None, ge=0, le=1)


class VisualObservations(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    visible_color_uniformity: Observation
    visible_surface_defect_ratio: Observation
    visible_damage_observed: Observation
    size_consistency: Observation
    ripeness_stage: Observation
    image_quality: Observation


class QualityResult(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    request_id: UUID
    listing_id: UUID
    status: ResultStatus
    assessment_type: str
    observations: VisualObservations
    verification_status: str
    engine_version: str
    model_version: str | None
    configuration_version: str
    calculated_at: datetime
    data_mode: DataMode
    source: str
    warnings: tuple[str, ...]
    limitations: tuple[str, ...]
