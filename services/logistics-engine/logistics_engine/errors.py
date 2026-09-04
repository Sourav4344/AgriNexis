from __future__ import annotations


class LogisticsError(Exception):
    def __init__(self, code: str, message: str) -> None:
        self.code = code
        super().__init__(message)


def failure(code: str) -> LogisticsError:
    messages = {
        "ROUTE_DATA_NOT_AVAILABLE": "route data is not available",
        "INVALID_QUANTITY": "quantity must be positive",
        "INVALID_COST_CONFIGURATION": "cost configuration is invalid",
        "STORAGE_RATE_NOT_AVAILABLE": "storage rate is not available",
        "QUOTE_EXPIRED": "quote validity has expired",
        "UNSUPPORTED_CURRENCY": "currency is not supported by this configuration",
        "PROVENANCE_NOT_AVAILABLE": "cost provenance is not available",
        "CONFIGURATION_VERSION_MISMATCH": "requested configuration version is unavailable",
        "LANE_NOT_CONFIGURED": "no tariff is configured for this lane",
        "INVALID_REQUEST": "logistics request is invalid",
    }
    return LogisticsError(code, messages[code])
