from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from decimal import Decimal
from enum import StrEnum
from typing import Any, Protocol, TypeVar

from .errors import ErrorCode, TransactionError

T = TypeVar("T")


class IdempotencyStatus(StrEnum):
    IN_PROGRESS = "IN_PROGRESS"
    SUCCEEDED = "SUCCEEDED"
    FAILED = "FAILED"


@dataclass(frozen=True, slots=True)
class IdempotencyRecord[T]:
    scope: str
    actor_id: str
    key: str
    fingerprint: str
    status: IdempotencyStatus
    result: T | None = None


class IdempotencyRepository(Protocol):
    def get(self, scope: str, actor_id: str, key: str) -> IdempotencyRecord[Any] | None: ...

    def begin(self, record: IdempotencyRecord[Any]) -> bool: ...

    def succeed(self, record: IdempotencyRecord[Any]) -> None: ...

    def clear_failed(self, scope: str, actor_id: str, key: str) -> None: ...


def _json_default(value: object) -> str:
    if isinstance(value, Decimal):
        return format(value, "f")
    if isinstance(value, StrEnum):
        return value.value
    raise TypeError(f"Unsupported fingerprint value: {type(value).__name__}")


def fingerprint(payload: dict[str, object]) -> str:
    canonical = json.dumps(
        payload, sort_keys=True, separators=(",", ":"), ensure_ascii=True, default=_json_default
    )
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


class InMemoryIdempotencyRepository:
    def __init__(self) -> None:
        self._records: dict[tuple[str, str, str], IdempotencyRecord[Any]] = {}

    def get(self, scope: str, actor_id: str, key: str) -> IdempotencyRecord[Any] | None:
        return self._records.get((scope, actor_id, key))

    def begin(self, record: IdempotencyRecord[Any]) -> bool:
        lookup = (record.scope, record.actor_id, record.key)
        if lookup in self._records:
            return False
        self._records[lookup] = record
        return True

    def succeed(self, record: IdempotencyRecord[Any]) -> None:
        self._records[(record.scope, record.actor_id, record.key)] = record

    def clear_failed(self, scope: str, actor_id: str, key: str) -> None:
        lookup = (scope, actor_id, key)
        if (
            self._records.get(lookup, None)
            and self._records[lookup].status is IdempotencyStatus.FAILED
        ):
            del self._records[lookup]


class IdempotencyGuard:
    def __init__(self, repository: IdempotencyRepository) -> None:
        self._repository = repository

    def begin_or_replay[T](
        self, scope: str, actor_id: str, key: str, request_fingerprint: str
    ) -> tuple[IdempotencyRecord[T], bool]:
        existing = self._repository.get(scope, actor_id, key)
        if existing is not None:
            if existing.fingerprint != request_fingerprint:
                raise TransactionError(ErrorCode.IDEMPOTENCY_CONFLICT, "Idempotency key reused")
            if existing.status is IdempotencyStatus.SUCCEEDED:
                return existing, True
            if existing.status is IdempotencyStatus.FAILED:
                self._repository.clear_failed(scope, actor_id, key)
            else:
                raise TransactionError(ErrorCode.IDEMPOTENCY_CONFLICT, "Command is in progress")
        record: IdempotencyRecord[T] = IdempotencyRecord(
            scope, actor_id, key, request_fingerprint, IdempotencyStatus.IN_PROGRESS
        )
        if not self._repository.begin(record):
            raise TransactionError(ErrorCode.IDEMPOTENCY_CONFLICT, "Concurrent command")
        return record, False

    def succeed[T](self, record: IdempotencyRecord[T], result: T) -> IdempotencyRecord[T]:
        succeeded = IdempotencyRecord(
            record.scope,
            record.actor_id,
            record.key,
            record.fingerprint,
            IdempotencyStatus.SUCCEEDED,
            result,
        )
        self._repository.succeed(succeeded)
        return succeeded
