from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any


@dataclass(slots=True)
class ApiError(Exception):
    code: str
    message: str
    status_code: int
    details: list[dict[str, Any]] = field(default_factory=list)


_DOMAIN_DETAIL = re.compile(
    r"(?:^|;)AGRINEXIS_CODE=([A-Z0-9_]+);HTTP_STATUS=(403|409|422)(?:;|$)"
)


_SAFE_MESSAGES = {
    "ACTOR_MISMATCH": "The action is not permitted for this account",
    "IDEMPOTENCY_CONFLICT": "This idempotency key is already in use",
    "OFFER_NOT_PENDING": "The offer is no longer pending",
    "OFFER_EXPIRED": "The offer has expired",
    "OFFER_VERSION_CONFLICT": "The offer changed; refresh and try again",
    "LISTING_VERSION_CONFLICT": "The listing changed; refresh and try again",
    "INSUFFICIENT_QUANTITY": "The requested quantity is no longer available",
    "QUOTE_INVALID": "The logistics quote does not match this transaction",
    "QUOTE_EXPIRED": "The logistics quote has expired",
    "RECOMMENDATION_INVALID": "The recommendation does not match this transaction",
    "RECOMMENDATION_EXPIRED": "The recommendation has expired",
    "DEMAND_INVALID": "The demand does not match this transaction",
    "DEMAND_EXPIRED": "The demand has expired",
    "DEMAND_QUANTITY_EXCEEDED": "The offer exceeds the remaining demand quantity",
    "CURRENCY_MISMATCH": "Transaction currencies do not match",
    "FINANCIALS_CHANGED": "Transaction economics changed and require review",
    "PAYMENT_NOT_FOUND": "Payment not found",
    "PAYMENT_STATE_CONFLICT": "Payment state changed; refresh and try again",
    "PAYMENT_TRANSITION_INVALID": "Payment transition is not allowed",
    "PAYMENT_IMMUTABLE_FIELDS": "Payment identity and amount are immutable",
}


def parse_domain_error(exc: BaseException) -> ApiError | None:
    sqlstate = getattr(exc, "sqlstate", None)
    message = getattr(exc, "message", str(exc))
    detail = getattr(exc, "detail", None)
    if sqlstate != "P0001" or message != "AGRINEXIS_DOMAIN_ERROR" or not detail:
        return None
    match = _DOMAIN_DETAIL.search(detail)
    if not match:
        return None
    code, status = match.groups()
    return ApiError(code, _SAFE_MESSAGES.get(code, "The operation could not be completed"), int(status))

