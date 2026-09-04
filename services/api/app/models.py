from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum
from uuid import UUID


class Role(StrEnum):
    FARMER = "FARMER"
    BUYER = "BUYER"
    FPO = "FPO"
    ADMIN = "ADMIN"


class AccountStatus(StrEnum):
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    DEACTIVATED = "DEACTIVATED"


@dataclass(frozen=True, slots=True)
class Principal:
    profile_id: UUID
    user_id: UUID
    role: Role
    status: AccountStatus
    display_name: str

