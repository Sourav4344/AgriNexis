from __future__ import annotations

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any
from uuid import UUID, uuid4

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .auth import JWKSVerifier
from .config import Settings, get_settings
from .database import Database
from .errors import ApiError
from .routes import router

logger = logging.getLogger("agrinexis.api")


def create_app(settings: Settings | None = None, database: Database | None = None) -> FastAPI:
    config = settings or get_settings()
    db = database or Database(config.database_url)

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        await db.connect()
        try:
            yield
        finally:
            await db.close()

    app = FastAPI(
        title="AgriNexis Core API", version="0.1.0",
        description="Authorization and transaction boundary for the AgriNexis modular monolith.",
        lifespan=lifespan,
    )
    app.state.settings = config
    app.state.database = db
    app.state.verifier = JWKSVerifier(config)
    if config.api_allowed_origins:
        app.add_middleware(
            CORSMiddleware, allow_origins=config.api_allowed_origins, allow_credentials=False,
            allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
            allow_headers=["Authorization", "Content-Type", "Idempotency-Key", "If-Match", "X-Request-ID"],
        )

    @app.middleware("http")
    async def request_context(request: Request, call_next):
        supplied = request.headers.get("X-Request-ID")
        try:
            request_id = str(UUID(supplied)) if supplied else str(uuid4())
        except ValueError:
            request_id = str(uuid4())
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response

    @app.exception_handler(ApiError)
    async def api_error_handler(request: Request, exc: ApiError) -> JSONResponse:
        return JSONResponse(status_code=exc.status_code, content={
            "error": {"code": exc.code, "message": exc.message, "details": exc.details},
            "meta": {"request_id": request.state.request_id},
        })

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
        details = [{"field": ".".join(str(part) for part in error["loc"][1:]), "reason": error["type"]} for error in exc.errors()]
        return JSONResponse(status_code=422, content={
            "error": {"code": "VALIDATION_ERROR", "message": "Request validation failed", "details": details},
            "meta": {"request_id": request.state.request_id},
        })

    @app.exception_handler(Exception)
    async def unexpected_error_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled API error", extra={"request_id": request.state.request_id})
        return JSONResponse(status_code=500, content={
            "error": {"code": "INTERNAL_ERROR", "message": "An unexpected error occurred", "details": []},
            "meta": {"request_id": request.state.request_id},
        })

    @app.get("/health", tags=["system"], summary="Process liveness")
    async def health(request: Request) -> dict[str, Any]:
        return {"data": {"status": "alive"}, "meta": {"request_id": request.state.request_id}}

    @app.get("/ready", tags=["system"], summary="Dependency readiness")
    async def ready(request: Request) -> JSONResponse:
        checks = {"database": await db.ready(), "auth": app.state.verifier.configured}
        ready_state = all(checks.values())
        return JSONResponse(status_code=200 if ready_state else 503, content={
            "data": {"status": "ready" if ready_state else "not_ready", "checks": checks},
            "meta": {"request_id": request.state.request_id},
        })

    app.include_router(router, prefix="/api/v1")
    return app


app = create_app()

