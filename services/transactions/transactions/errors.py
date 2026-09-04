from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum


class ErrorCode(StrEnum):
    INVALID_ORDER_TRANSITION = "INVALID_ORDER_TRANSITION"
    INVALID_PAYMENT_TRANSITION = "INVALID_PAYMENT_TRANSITION"
    FORBIDDEN = "FORBIDDEN"
    ORDER_NOT_FOUND = "ORDER_NOT_FOUND"
    PAYMENT_NOT_FOUND = "PAYMENT_NOT_FOUND"
    VERSION_CONFLICT = "VERSION_CONFLICT"
    TERMINAL_STATE = "TERMINAL_STATE"
    IDEMPOTENCY_CONFLICT = "IDEMPOTENCY_CONFLICT"
    PAYMENT_PROVIDER_REQUIRED = "PAYMENT_PROVIDER_REQUIRED"
    REPOSITORY_FAILURE = "REPOSITORY_FAILURE"


@dataclass(frozen=True, slots=True)
class TransactionError(Exception):
    code: ErrorCode
    message: str

    def __str__(self) -> str:
        return self.message


def sanitized_repository_error() -> TransactionError:
    return TransactionError(ErrorCode.REPOSITORY_FAILURE, "Transaction storage unavailable")
