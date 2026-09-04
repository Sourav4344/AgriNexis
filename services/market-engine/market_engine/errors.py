class MarketError(Exception):
    """Base exception whose message is safe for internal orchestration logs."""


class MarketSourceUnavailable(MarketError):
    """The configured provider could not be reached."""


class MarketSourceInvalid(MarketError):
    """A provider response could not be safely interpreted."""


class UnsupportedMarketUnit(MarketSourceInvalid):
    """A price or arrival unit has no approved conversion."""


class UnsupportedCurrency(MarketSourceInvalid):
    """The source currency is outside the Phase 2 INR contract."""


class UnknownCrop(MarketSourceInvalid):
    """The source crop does not resolve to the canonical catalog."""


class UnknownVariety(MarketSourceInvalid):
    """The source variety does not resolve to the canonical catalog."""


class CropVarietyMismatch(MarketSourceInvalid):
    """The resolved variety belongs to a different crop."""


class UnknownMandi(MarketSourceInvalid):
    """The source market identity cannot be resolved."""


class MarketDataUnavailable(MarketError):
    """No eligible current observation can be delivered."""


class MarketConfigurationError(MarketError):
    """Market-engine configuration is invalid or incomplete."""


class MarketPersistenceError(MarketError):
    """A trusted persistence operation failed."""
