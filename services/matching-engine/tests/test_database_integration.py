import os

import pytest


@pytest.mark.integration
def test_database_integration_requires_disposable_database() -> None:
    if not os.getenv("MATCHING_INTEGRATION_DATABASE_URL"):
        pytest.skip("MATCHING_INTEGRATION_DATABASE_URL is not configured")
    pytest.skip("trusted Agent 4 persistence wiring is intentionally outside Agent 8 foundation")
