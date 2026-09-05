# ==============================================================================
# AgriNexis Core API Dockerfile
# Modular monolith Python backend orchestrating intelligence engines
# ==============================================================================

# --- Stage 1: Build & Dependency Resolution ---
FROM python:3.12-slim AS builder

WORKDIR /build

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install build dependencies if needed
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies to a prefix
RUN pip install --prefix=/install --no-warn-script-location \
    "fastapi>=0.115.0" \
    "uvicorn[standard]>=0.34.0" \
    "pydantic>=2.10.0" \
    "pydantic-settings>=2.8.0" \
    "asyncpg>=0.30.0" \
    "httpx>=0.28.0" \
    "PyJWT[crypto]>=2.10.0" \
    "tzdata>=2025.1"

# --- Stage 2: Runtime Environment ---
FROM python:3.12-slim AS runner

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/install/bin:$PATH" \
    PYTHONPATH="/app/services/api:/app/services/market-engine:/app/services/matching-engine:/app/services/prediction-engine:/app/services/logistics-engine:/app/services/quality-engine:/app/services/transactions:$PYTHONPATH"

# Install curl for reliable container healthchecks
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy installed dependencies from builder
COPY --from=builder /install /usr/local

# Create non-root system user and group for least-privilege security
RUN groupadd -g 10001 agrinexis && \
    useradd -u 10001 -g agrinexis -s /bin/false -m agrinexis

# Copy service source code
COPY --chown=agrinexis:agrinexis services /app/services

USER agrinexis

EXPOSE 8000

# Health check verifies API process liveness
HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

WORKDIR /app/services/api

CMD ["uvicorn", "app.main:create_app", "--factory", "--host", "0.0.0.0", "--port", "8000"]
