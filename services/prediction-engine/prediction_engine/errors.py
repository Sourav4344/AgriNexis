class PredictionError(Exception):
    """Base prediction error with a safe internal message."""


class PredictionInvalidRequest(PredictionError):
    """The caller supplied an invalid prediction request."""


class PredictionDataUnavailable(PredictionError):
    """Historical market data could not be read."""


class PredictionConfigurationError(PredictionError):
    """Prediction configuration is invalid."""


class PredictionModelError(PredictionError):
    """A forecasting method failed safely."""


class PredictionPersistenceReadError(PredictionDataUnavailable):
    """The read-only historical repository failed."""
