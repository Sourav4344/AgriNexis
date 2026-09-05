class MatchingError(Exception):
    """Base error for safe matching-engine failures."""


class MatchingInvalidRequest(MatchingError):
    """The Agent 4 matching subject failed strict validation."""


class MatchingPersistenceError(MatchingError):
    """A repository operation failed without exposing database details."""
