from __future__ import annotations

from datetime import timedelta
from decimal import Decimal

from pydantic import Field, model_validator

from .models import DataMode, DecimalValue, StrictModel


class NamedCharge(StrictModel):
    code: str = Field(min_length=1, max_length=80)
    flat_amount: DecimalValue
    source: str = Field(min_length=1, max_length=160)

    @model_validator(mode="after")
    def nonnegative(self) -> NamedCharge:
        if self.flat_amount < 0:
            raise ValueError("charge cannot be negative")
        return self


class LaneTariff(StrictModel):
    origin_district: str
    origin_state: str
    destination_district: str
    destination_state: str
    reference_distance_km: DecimalValue | None = None
    vehicle_class: str = "CONFIGURED_VEHICLE"
    capacity_kg: DecimalValue
    base_transport_charge: DecimalValue = Decimal("0")
    transport_rate_per_km: DecimalValue = Decimal("0")
    minimum_transport_charge: DecimalValue = Decimal("0")
    configured_transport_charge: DecimalValue | None = None
    storage_rate_per_kg_per_day: DecimalValue | None = None
    handling_charges: list[NamedCharge] = Field(default_factory=list)
    other_charges: list[NamedCharge] = Field(default_factory=list)
    source: str = Field(min_length=1, max_length=160)

    @model_validator(mode="after")
    def valid_tariff(self) -> LaneTariff:
        if self.capacity_kg <= 0:
            raise ValueError("capacity must be positive")
        values = (
            self.base_transport_charge,
            self.transport_rate_per_km,
            self.minimum_transport_charge,
        )
        if any(value < 0 for value in values):
            raise ValueError("tariff values cannot be negative")
        if self.reference_distance_km is not None and self.reference_distance_km < 0:
            raise ValueError("invalid reference distance")
        if self.configured_transport_charge is not None and self.configured_transport_charge < 0:
            raise ValueError("invalid configured transport charge")
        if self.storage_rate_per_kg_per_day is not None and self.storage_rate_per_kg_per_day < 0:
            raise ValueError("invalid storage rate")
        return self

    @property
    def key(self) -> tuple[str, str, str, str]:
        values = (
            self.origin_district,
            self.origin_state,
            self.destination_district,
            self.destination_state,
        )
        return tuple(value.casefold() for value in values)  # type: ignore[return-value]


class LogisticsConfiguration(StrictModel):
    version: str
    currency: str = Field(pattern=r"^[A-Z]{3}$")
    data_mode: DataMode
    source: str = Field(min_length=1, max_length=160)
    validity_minutes: int = Field(gt=0, le=2880)
    lanes: list[LaneTariff]

    @model_validator(mode="after")
    def valid_configuration(self) -> LogisticsConfiguration:
        if self.data_mode is DataMode.LIVE:
            raise ValueError("deterministic configuration cannot claim LIVE mode")
        keys = [lane.key for lane in self.lanes]
        if len(keys) != len(set(keys)):
            raise ValueError("duplicate lane tariff")
        return self

    @property
    def validity(self) -> timedelta:
        return timedelta(minutes=self.validity_minutes)


def demo_configuration() -> LogisticsConfiguration:
    common = {
        "origin_district": "Nashik",
        "origin_state": "Maharashtra",
        "capacity_kg": "1000",
        "vehicle_class": "DEMO_LIGHT_COMMERCIAL",
        "handling_charges": [
            {"code": "LOADING_UNLOADING", "flat_amount": "300", "source": "SIH_DEMO_V1"}
        ],
        "source": "AGRINEXIS_DEMO",
    }
    return LogisticsConfiguration.model_validate(
        {
            "version": "sih-demo-logistics-v1",
            "currency": "INR",
            "data_mode": "DEMO",
            "source": "AGRINEXIS_DEMO",
            "validity_minutes": 1620,
            "lanes": [
                {
                    **common,
                    "destination_district": "Buyer A",
                    "destination_state": "Maharashtra",
                    "reference_distance_km": "160",
                    "configured_transport_charge": "5500",
                    "storage_rate_per_kg_per_day": "0.50",
                    "other_charges": [
                        {"code": "DEMO_OTHER", "flat_amount": "200", "source": "SIH_DEMO_V1"}
                    ],
                },
                {
                    **common,
                    "destination_district": "Buyer B",
                    "destination_state": "Maharashtra",
                    "reference_distance_km": "35",
                    "configured_transport_charge": "1500",
                    "storage_rate_per_kg_per_day": "0.30",
                    "other_charges": [
                        {"code": "DEMO_OTHER", "flat_amount": "150", "source": "SIH_DEMO_V1"}
                    ],
                },
            ],
        }
    )
