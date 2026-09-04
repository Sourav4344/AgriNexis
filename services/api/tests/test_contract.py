from __future__ import annotations

from datetime import UTC, datetime, timedelta
from decimal import Decimal
from uuid import UUID

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi.testclient import TestClient

from app.auth import JWKSVerifier
from app.config import Settings
from app.database import Database
from app.errors import ApiError, parse_domain_error
from app.fingerprint import request_fingerprint
from app.main import create_app
from app.money import calculate_nfr
from app.pagination import decode_cursor, encode_cursor
from app.schemas import OfferAccept, ProfilePatch


class UnconfiguredDatabase(Database):
    def __init__(self) -> None:
        super().__init__(None)

    async def connect(self) -> None:
        return None

    async def close(self) -> None:
        return None


def test_health_envelope_and_request_id() -> None:
    app = create_app(Settings(app_env="test"), UnconfiguredDatabase())
    with TestClient(app) as client:
        response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["data"] == {"status": "alive"}
    assert UUID(response.json()["meta"]["request_id"])


def test_readiness_is_honestly_not_ready() -> None:
    app = create_app(Settings(app_env="test"), UnconfiguredDatabase())
    with TestClient(app) as client:
        response = client.get("/ready")
    assert response.status_code == 503
    assert response.json()["data"]["status"] == "not_ready"
    assert response.json()["data"]["checks"] == {"database": False, "auth": False}


def test_comma_separated_cors_configuration(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("API_ALLOWED_ORIGINS", "https://buyer.example,https://admin.example")
    settings = Settings(app_env="test")
    assert settings.api_allowed_origins == ["https://buyer.example", "https://admin.example"]


def test_protected_route_rejects_missing_token() -> None:
    app = create_app(Settings(app_env="test"), UnconfiguredDatabase())
    with TestClient(app) as client:
        response = client.get("/api/v1/me")
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "AUTHENTICATION_REQUIRED"


def test_postgres_compatible_nfr_rounding() -> None:
    gross, total, nfr = calculate_nfr(
        Decimal("1000"), Decimal("31"), Decimal("1500"), Decimal("300"),
        Decimal("300"), Decimal("150"),
    )
    assert (gross, total, nfr) == (Decimal("31000.00"), Decimal("2250.00"), Decimal("28750.00"))
    assert calculate_nfr(Decimal("1"), Decimal("1.005"), *(Decimal("0") for _ in range(4)))[0] == Decimal("1.01")


def test_fingerprint_is_order_independent_and_semantic() -> None:
    first = request_fingerprint({"offer": UUID(int=1), "amount": Decimal("31.00"), "nested": {"b": 2, "a": 1}})
    second = request_fingerprint({"nested": {"a": 1, "b": 2}, "amount": Decimal("31.00"), "offer": UUID(int=1)})
    changed = request_fingerprint({"offer": UUID(int=1), "amount": Decimal("32.00"), "nested": {"a": 1, "b": 2}})
    assert first == second
    assert first != changed
    assert first.startswith("sha256:")


def test_cursor_round_trip_and_rejects_invalid() -> None:
    from datetime import UTC, datetime

    expected_time = datetime(2026, 9, 4, tzinfo=UTC)
    expected_id = UUID(int=9)
    cursor = decode_cursor(encode_cursor(expected_time, expected_id))
    assert cursor and cursor.created_at == expected_time and cursor.row_id == expected_id
    with pytest.raises(ApiError):
        decode_cursor("not-a-cursor")


class DomainException(Exception):
    sqlstate = "P0001"
    message = "AGRINEXIS_DOMAIN_ERROR"

    def __init__(self, detail: str) -> None:
        self.detail = detail


def test_domain_error_is_safely_parsed() -> None:
    mapped = parse_domain_error(DomainException("AGRINEXIS_CODE=FINANCIALS_CHANGED;HTTP_STATUS=409"))
    assert mapped and mapped.code == "FINANCIALS_CHANGED" and mapped.status_code == 409
    assert "AGRINEXIS" not in mapped.message


def test_domain_error_rejects_untrusted_status() -> None:
    assert parse_domain_error(DomainException("AGRINEXIS_CODE=FINANCIALS_CHANGED;HTTP_STATUS=500")) is None


def test_offer_accept_uses_recommendation_option_and_currency() -> None:
    model = OfferAccept.model_validate({
        "offer_version": 3, "listing_version": 5,
        "logistics_quote_id": "00000000-0000-0000-0000-000000000001",
        "recommendation_option_id": "00000000-0000-0000-0000-000000000002",
        "acknowledged_amounts": {
            "gross_selling_value": "31000.00", "total_applicable_cost": "2250.00",
            "net_farmer_realization": "28750.00", "currency": "INR",
        },
    })
    assert model.recommendation_option_id == UUID("00000000-0000-0000-0000-000000000002")
    assert model.acknowledged_amounts.currency == "INR"


def test_float_money_is_rejected() -> None:
    with pytest.raises(ValueError):
        OfferAccept.model_validate({
            "offer_version": 1, "listing_version": 1,
            "logistics_quote_id": "00000000-0000-0000-0000-000000000001",
            "acknowledged_amounts": {
                "gross_selling_value": 31000.0, "total_applicable_cost": "2250.00",
                "net_farmer_realization": "28750.00", "currency": "INR",
            },
        })


def _verifier_and_key() -> tuple[JWKSVerifier, object]:
    settings = Settings(
        app_env="test", supabase_url="https://test.supabase.co",
        supabase_jwt_issuer="https://test.supabase.co/auth/v1",
        supabase_jwks_url="https://test.supabase.co/auth/v1/.well-known/jwks.json",
    )
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    verifier = JWKSVerifier(settings)
    verifier._keys = {"test-key": private_key.public_key()}
    verifier._expires_at = float("inf")
    return verifier, private_key


@pytest.mark.asyncio
async def test_expired_jwt_is_rejected() -> None:
    verifier, key = _verifier_and_key()
    now = datetime.now(UTC)
    token = jwt.encode(
        {"sub": str(UUID(int=1)), "aud": "authenticated", "iss": verifier.settings.supabase_jwt_issuer,
         "iat": now - timedelta(minutes=10), "exp": now - timedelta(minutes=1)},
        key, algorithm="RS256", headers={"kid": "test-key"},
    )
    with pytest.raises(ApiError) as caught:
        await verifier.verify(token)
    assert caught.value.code == "INVALID_TOKEN" and caught.value.status_code == 401


@pytest.mark.asyncio
async def test_invalid_jwt_signature_is_rejected() -> None:
    verifier, _ = _verifier_and_key()
    wrong_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    now = datetime.now(UTC)
    token = jwt.encode(
        {"sub": str(UUID(int=1)), "aud": "authenticated", "iss": verifier.settings.supabase_jwt_issuer,
         "iat": now, "exp": now + timedelta(minutes=5)},
        wrong_key, algorithm="RS256", headers={"kid": "test-key"},
    )
    with pytest.raises(ApiError) as caught:
        await verifier.verify(token)
    assert caught.value.code == "INVALID_TOKEN"


def test_profile_patch_rejects_role_self_promotion() -> None:
    with pytest.raises(ValueError):
        ProfilePatch.model_validate({"role": "ADMIN"})
