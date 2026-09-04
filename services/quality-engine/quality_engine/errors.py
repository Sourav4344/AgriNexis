class QualityError(Exception):
    """Base error with a deliberately non-sensitive message."""


class QualityInvalidRequest(QualityError):
    """The caller supplied an invalid quality request."""
