from __future__ import annotations

from collections.abc import Awaitable, Callable
from datetime import datetime
from typing import Any

from ..errors import MarketConfigurationError, MarketSourceInvalid, MarketSourceUnavailable
from ..models import RawMarketRecord

FetchFunction = Callable[[dict[str, Any], datetime], Awaitable[list[dict[str, Any]]]]


class ProviderTimeoutError(Exception):
    """Provider transport exceeded its configured deadline."""


class ProviderRateLimitError(Exception):
    """Provider rejected the request due to rate limiting."""


class ProviderAuthenticationError(Exception):
    """Provider credentials are missing or rejected."""


class ProviderServerError(Exception):
    """Provider returned a retryable server failure."""


class ConfiguredMarketSource:
    """Explicit provider wrapper; transport and credentials are injected by deployment."""

    def __init__(self, provider_name: str, fetch_records: FetchFunction) -> None:
        if not provider_name:
            raise MarketConfigurationError("configured provider name is required")
        self._provider_name = provider_name
        self._fetch_records = fetch_records

    @property
    def provider_name(self) -> str:
        return self._provider_name

    async def fetch(self, subject: dict[str, Any], as_of: datetime) -> list[RawMarketRecord]:
        try:
            payloads = await self._fetch_records(subject, as_of)
        except ProviderAuthenticationError as exc:
            raise MarketConfigurationError("configured provider authentication failed") from exc
        except (
            TimeoutError,
            ConnectionError,
            ProviderTimeoutError,
            ProviderRateLimitError,
            ProviderServerError,
        ) as exc:
            raise MarketSourceUnavailable("configured market provider is unavailable") from exc
        if not isinstance(payloads, list):
            raise MarketSourceInvalid("configured provider returned an invalid collection")
        try:
            records = [RawMarketRecord.model_validate(item) for item in payloads]
        except ValueError as exc:
            raise MarketSourceInvalid("configured provider returned an invalid record") from exc
        for record in records:
            if record.source_name != self.provider_name:
                raise MarketSourceInvalid("record source does not match configured provider")
        return records
