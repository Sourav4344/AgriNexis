from __future__ import annotations

import asyncio
import sys
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from pathlib import Path
from typing import Any
from uuid import UUID, uuid4

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi.testclient import TestClient

# Ensure services are on sys.path
root_path = Path(__file__).resolve().parent.parent
for svc in [
    "services/api",
    "services/matching-engine",
    "services/logistics-engine",
    "services/prediction-engine",
    "services/quality-engine",
    "services/market-engine",
    "services/transactions",
]:
    p = str(root_path / svc)
    if p not in sys.path:
        sys.path.insert(0, p)

from app.auth import JWKSVerifier
from app.config import Settings
from app.database import Database
from app.errors import ApiError
from app.main import create_app
from app.money import calculate_nfr
from app.schemas import ProfilePatch
from matching_engine.eligibility import evaluate_eligibility
from matching_engine.models import (
    CandidateInput,
    CandidateState,
    Counterparty,
    Demand,
    Listing,
    LogisticsQuote,
    Offer,
    VerificationStatus,
)
from matching_engine.models import (
    DataMode as MatchingDataMode,
)
from quality_engine.models import (
    DataMode as QualityDataMode,
)
from quality_engine.models import (
    ImageMetadata,
    QualityRequest,
    ResultStatus,
)
from quality_engine.service import QualityService
from transactions.errors import ErrorCode, TransactionError
from transactions.models import (
    Actor,
    ActorRole,
    FinancialSnapshot,
    OrderStatus,
    Payment,
    PaymentStatus,
)
from transactions.models import (
    DataMode as TxDataMode,
)
from transactions.ports import (
    EventRepository,
    PaymentRepository,
    ProviderGate,
)
from transactions.workflows import (
    PaymentWorkflow,
    validate_order_transition,
    validate_payment_transition,
)


class MockDatabase(Database):
    """In-memory database stub faithfully implementing domain queries for security tests."""
    def __init__(self) -> None:
        super().__init__(None)
        self.profiles: dict[UUID, dict[str, Any]] = {}
        self.farmer_profiles: dict[UUID, dict[str, Any]] = {}
        self.buyer_profiles: dict[UUID, dict[str, Any]] = {}
        self.crops: dict[UUID, dict[str, Any]] = {}
        self.crop_varieties: dict[UUID, dict[str, Any]] = {}
        self.listings: dict[UUID, dict[str, Any]] = {}
        self.listing_locations: dict[UUID, dict[str, Any]] = {}
        self.demands: dict[UUID, dict[str, Any]] = {}
        self.offers: dict[UUID, dict[str, Any]] = {}
        self.quotes: dict[UUID, dict[str, Any]] = {}
        self.recommendations: dict[UUID, dict[str, Any]] = {}
        self.orders: dict[UUID, dict[str, Any]] = {}
        self.order_history: list[dict[str, Any]] = []
        self.payments: dict[UUID, dict[str, Any]] = {}
        self.idempotency_records: dict[str, dict[str, Any]] = {}

    async def connect(self) -> None:
        pass

    async def close(self) -> None:
        pass

    async def fetch(self, query: str, *args: Any) -> list[dict[str, Any]]:
        q = " ".join(query.split()).lower()
        if "from public.produce_listings" in q:
            return list(self.listings.values())
        if "from public.buyer_demands" in q:
            return list(self.demands.values())
        if "from public.offers" in q:
            return list(self.offers.values())
        if "from public.orders" in q:
            return list(self.orders.values())
        if "from public.payments" in q:
            order_id = args[0]
            return [p for p in self.payments.values() if p["order_id"] == order_id]
        return []

    async def fetchrow(self, query: str, *args: Any) -> dict[str, Any] | None:
        q = " ".join(query.split()).lower()

        if "from public.profiles" in q:
            if "where user_id=$1" in q:
                uid = args[0]
                for p in self.profiles.values():
                    if p["user_id"] == uid and p["status"] == "ACTIVE":
                        return dict(p)
                return None
            if "where p.id=$1" in q or "where id=$1" in q:
                pid = args[0]
                prof = self.profiles.get(pid)
                if not prof:
                    return None
                res = dict(prof)
                if pid in self.buyer_profiles:
                    res.update(self.buyer_profiles[pid])
                return res

        if "update public.profiles" in q:
            pid = args[0]
            row = self.profiles.get(pid)
            if row:
                if args[1] is not None:
                    row["display_name"] = args[1]
                if args[2] is not None:
                    row["phone"] = args[2]
                if args[3] is not None:
                    row["preferred_locale"] = args[3]
            return row

        if "from public.produce_listings" in q:
            lid = args[0]
            return self.listings.get(lid)

        if "insert into public.produce_listings" in q:
            lid = uuid4()
            row = {
                "id": lid,
                "farmer_profile_id": args[0],
                "crop_id": args[1],
                "variety_id": args[2],
                "quantity": Decimal(str(args[3])),
                "available_quantity": Decimal(str(args[3])),
                "unit": args[4],
                "harvest_date": args[5],
                "available_from": args[6],
                "available_until": args[7],
                "district": args[8],
                "state": args[9],
                "postal_area": args[10],
                "quality_summary": args[11] or {},
                "status": "DRAFT",
                "version": 1,
                "created_at": datetime.now(UTC),
                "updated_at": datetime.now(UTC),
            }
            self.listings[lid] = row
            return row

        if "insert into public.offers" in q:
            oid = uuid4()
            row = {
                "id": oid,
                "listing_id": args[0],
                "demand_id": args[1],
                "buyer_profile_id": args[2],
                "fpo_id": args[3],
                "offered_quantity": Decimal(str(args[4])),
                "unit": "kg",
                "unit_price": Decimal(str(args[5])),
                "currency": args[6],
                "delivery_terms": args[7],
                "expires_at": args[8],
                "status": "PENDING",
                "version": 1,
                "created_at": datetime.now(UTC),
                "updated_at": datetime.now(UTC),
            }
            self.offers[oid] = row
            return row

        if "update public.produce_listings" in q:
            lid = args[0]
            row = self.listings.get(lid)
            if not row:
                return None
            if "farmer_profile_id=$2" in q and row["farmer_profile_id"] != args[1] and args[3] != "ADMIN":
                return None
            if "status=any(" in q and row["status"] not in args[4]:
                return None
            if "status=" in q:
                row["status"] = args[2] if "farmer_profile_id=$2" in q else args[1]
            row["version"] += 1
            return row

        if "from public.listing_private_locations" in q:
            lid = args[0]
            return self.listing_locations.get(lid)

        if "from public.buyer_demands" in q:
            did = args[0]
            return self.demands.get(did)

        if "insert into public.buyer_demands" in q:
            did = uuid4()
            row = {
                "id": did,
                "buyer_profile_id": args[0],
                "fpo_id": args[1],
                "crop_id": args[2],
                "variety_id": args[3],
                "minimum_quantity": Decimal(str(args[4])),
                "maximum_quantity": Decimal(str(args[5])),
                "unit": "kg",
                "quality_requirements": {},
                "delivery_from": args[6],
                "delivery_until": args[7],
                "delivery_district": args[8],
                "delivery_state": args[9],
                "indicative_price": Decimal(str(args[10])) if args[10] else None,
                "currency": args[11],
                "status": "DRAFT",
                "version": 1,
                "created_at": datetime.now(UTC),
                "updated_at": datetime.now(UTC),
            }
            self.demands[did] = row
            return row

        if "update public.buyer_demands" in q:
            did = args[0]
            row = self.demands.get(did)
            if not row:
                return None
            if "buyer_profile_id=$2" in q and row["buyer_profile_id"] != args[1] and args[3] != "ADMIN":
                return None
            if "status=" in q:
                row["status"] = args[2] if "buyer_profile_id=$2" in q else args[1]
            row["version"] += 1
            return row

        if "from public.offers" in q:
            oid = args[0]
            off = self.offers.get(oid)
            if not off:
                return None
            res = dict(off)
            listing = self.listings.get(off["listing_id"])
            if listing:
                res["farmer_profile_id"] = listing["farmer_profile_id"]
            return res

        if "update public.offers" in q:
            oid = args[0]
            row = self.offers.get(oid)
            if not row:
                return None
            row["status"] = args[1]
            row["version"] += 1
            return row

        if "from public.orders" in q:
            oid = args[0]
            return self.orders.get(oid)

        if "update public.orders" in q:
            oid = args[0]
            target_status = args[1]
            row = self.orders.get(oid)
            if not row:
                return None
            validate_order_transition(OrderStatus(row["status"]), OrderStatus(target_status))
            row["status"] = target_status
            row["version"] += 1
            return row

        if "from public.payments" in q:
            pid = args[0]
            return self.payments.get(pid)

        return None

    async def call_row(self, query: str, *args: Any) -> dict[str, Any]:
        q = " ".join(query.split()).lower()
        if "accept_offer" in q:
            farmer_profile_id = args[0]
            offer_id = args[1]
            offer_version = args[2]
            listing_version = args[3]
            logistics_quote_id = args[4]
            recommendation_option_id = args[5]
            idempotency_key = args[6]
            fingerprint = args[7]
            ack_gross = Decimal(str(args[8]))
            ack_total_cost = Decimal(str(args[9]))
            ack_nfr = Decimal(str(args[10]))
            ack_currency = args[11]

            if idempotency_key in self.idempotency_records:
                rec = self.idempotency_records[idempotency_key]
                if rec["fingerprint"] != fingerprint:
                    raise ApiError("IDEMPOTENCY_CONFLICT", "This idempotency key is already in use", 409)
                return {"order_id": rec["order_id"]}

            offer = self.offers.get(offer_id)
            if not offer:
                raise ApiError("OFFER_NOT_PENDING", "The offer is no longer pending", 409)
            if offer["status"] != "PENDING":
                raise ApiError("OFFER_NOT_PENDING", "The offer is no longer pending", 409)
            if offer["expires_at"] <= datetime.now(UTC):
                raise ApiError("OFFER_EXPIRED", "The offer has expired", 409)
            if offer["version"] != offer_version:
                raise ApiError("OFFER_VERSION_CONFLICT", "The offer changed; refresh and try again", 409)

            listing = self.listings.get(offer["listing_id"])
            if not listing or listing["farmer_profile_id"] != farmer_profile_id:
                raise ApiError("ACTOR_MISMATCH", "The action is not permitted for this account", 403)
            if listing["version"] != listing_version:
                raise ApiError("LISTING_VERSION_CONFLICT", "The listing changed; refresh and try again", 409)
            if listing["available_quantity"] < offer["offered_quantity"]:
                raise ApiError("INSUFFICIENT_QUANTITY", "The requested quantity is no longer available", 409)

            quote = self.quotes.get(logistics_quote_id)
            if not quote or quote["listing_id"] != listing["id"]:
                raise ApiError("QUOTE_INVALID", "The logistics quote does not match this transaction", 422)
            if quote["expires_at"] <= datetime.now(UTC):
                raise ApiError("QUOTE_EXPIRED", "The logistics quote has expired", 422)

            if ack_currency != offer["currency"] or quote["currency"] != offer["currency"]:
                raise ApiError("CURRENCY_MISMATCH", "Transaction currencies do not match", 409)

            if recommendation_option_id:
                reco = self.recommendations.get(recommendation_option_id)
                if not reco or reco["listing_id"] != listing["id"]:
                    raise ApiError("RECOMMENDATION_INVALID", "The recommendation does not match this transaction", 422)
                if reco["expires_at"] <= datetime.now(UTC):
                    raise ApiError("RECOMMENDATION_EXPIRED", "The recommendation has expired", 422)

            calc_gross = round(offer["offered_quantity"] * offer["unit_price"], 2)
            calc_nfr = calc_gross - quote["total_applicable_cost"]
            if ack_gross != calc_gross or ack_total_cost != quote["total_applicable_cost"] or ack_nfr != calc_nfr:
                raise ApiError("FINANCIALS_CHANGED", "Transaction economics changed and require review", 409)

            order_id = uuid4()
            order = {
                "id": order_id,
                "listing_id": listing["id"],
                "accepted_offer_id": offer_id,
                "farmer_profile_id": farmer_profile_id,
                "buyer_profile_id": offer["buyer_profile_id"],
                "fpo_id": offer["fpo_id"],
                "snapshot_quantity_kg": offer["offered_quantity"],
                "snapshot_unit_price_per_kg": offer["unit_price"],
                "snapshot_gross_selling_value": calc_gross,
                "snapshot_total_applicable_cost": quote["total_applicable_cost"],
                "snapshot_net_farmer_realization": calc_nfr,
                "snapshot_currency": ack_currency,
                "status": "CONFIRMED",
                "version": 1,
                "accepted_at": datetime.now(UTC),
            }
            self.orders[order_id] = order
            offer["status"] = "ACCEPTED"
            listing["available_quantity"] -= offer["offered_quantity"]
            if listing["available_quantity"] == Decimal(0):
                listing["status"] = "SOLD"

            self.idempotency_records[idempotency_key] = {
                "order_id": order_id,
                "fingerprint": fingerprint,
            }
            return {"order_id": order_id}

        return {}


def _setup_test_env():
    settings = Settings(
        app_env="test",
        supabase_url="https://test.supabase.co",
        supabase_jwt_issuer="https://test.supabase.co/auth/v1",
        supabase_jwks_url="https://test.supabase.co/auth/v1/.well-known/jwks.json",
    )
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    verifier = JWKSVerifier(settings)
    verifier._keys = {"test-key": private_key.public_key()}
    verifier._expires_at = float("inf")

    db = MockDatabase()
    app = create_app(settings, db)
    app.state.verifier = verifier

    farmer1_id = uuid4()
    farmer1_user = uuid4()
    farmer2_id = uuid4()
    farmer2_user = uuid4()
    buyer1_id = uuid4()
    buyer1_user = uuid4()
    buyer2_id = uuid4()
    buyer2_user = uuid4()
    admin_id = uuid4()
    admin_user = uuid4()

    db.profiles[farmer1_id] = {"id": farmer1_id, "user_id": farmer1_user, "role": "FARMER", "status": "ACTIVE", "display_name": "Farmer 1"}
    db.profiles[farmer2_id] = {"id": farmer2_id, "user_id": farmer2_user, "role": "FARMER", "status": "ACTIVE", "display_name": "Farmer 2"}
    db.profiles[buyer1_id] = {"id": buyer1_id, "user_id": buyer1_user, "role": "BUYER", "status": "ACTIVE", "display_name": "Buyer 1"}
    db.buyer_profiles[buyer1_id] = {"profile_id": buyer1_id, "verification_status": "VERIFIED"}
    db.profiles[buyer2_id] = {"id": buyer2_id, "user_id": buyer2_user, "role": "BUYER", "status": "ACTIVE", "display_name": "Buyer 2"}
    db.buyer_profiles[buyer2_id] = {"profile_id": buyer2_id, "verification_status": "UNVERIFIED"}
    db.profiles[admin_id] = {"id": admin_id, "user_id": admin_user, "role": "ADMIN", "status": "ACTIVE", "display_name": "Admin"}

    crop_id = uuid4()
    db.crops[crop_id] = {"id": crop_id, "canonical_code": "TOMATO", "name_en": "Tomato", "active": True}

    now = datetime.now(UTC)
    def make_token(uid: UUID, exp: datetime | None = None) -> str:
        return jwt.encode(
            {"sub": str(uid), "aud": "authenticated", "iss": settings.supabase_jwt_issuer,
             "iat": now, "exp": exp or (now + timedelta(hours=1))},
            private_key, algorithm="RS256", headers={"kid": "test-key"},
        )

    tokens = {
        "farmer1": make_token(farmer1_user),
        "farmer2": make_token(farmer2_user),
        "buyer1": make_token(buyer1_user),
        "buyer2": make_token(buyer2_user),
        "admin": make_token(admin_user),
        "expired": make_token(farmer1_user, exp=now - timedelta(minutes=5)),
        "farmer1_id": farmer1_id,
        "farmer2_id": farmer2_id,
        "buyer1_id": buyer1_id,
        "buyer2_id": buyer2_id,
        "admin_id": admin_id,
        "crop_id": crop_id,
        "private_key": private_key,
        "verifier": verifier,
    }
    return TestClient(app), db, tokens


def test_missing_auth_rejected():
    client, _, _ = _setup_test_env()
    resp = client.get("/api/v1/me")
    assert resp.status_code == 401
    assert resp.json()["error"]["code"] == "AUTHENTICATION_REQUIRED"


def test_malformed_and_tampered_jwt_rejected():
    client, _, tokens = _setup_test_env()
    resp = client.get("/api/v1/me", headers={"Authorization": "Bearer not-a-valid-jwt"})
    assert resp.status_code == 401
    assert resp.json()["error"]["code"] == "INVALID_TOKEN"

    resp = client.get("/api/v1/me", headers={"Authorization": f"Bearer {tokens['expired']}"})
    assert resp.status_code == 401
    assert resp.json()["error"]["code"] == "INVALID_TOKEN"

    wrong_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    forged = jwt.encode(
        {"sub": str(tokens["farmer1_id"]), "aud": "authenticated", "iss": "https://test.supabase.co/auth/v1",
         "iat": datetime.now(UTC), "exp": datetime.now(UTC) + timedelta(hours=1)},
        wrong_key, algorithm="RS256", headers={"kid": "test-key"},
    )
    resp = client.get("/api/v1/me", headers={"Authorization": f"Bearer {forged}"})
    assert resp.status_code == 401
    assert resp.json()["error"]["code"] == "INVALID_TOKEN"


def test_role_isolation_enforced():
    client, _, tokens = _setup_test_env()
    farmer_headers = {"Authorization": f"Bearer {tokens['farmer1']}"}
    buyer_headers = {"Authorization": f"Bearer {tokens['buyer1']}"}

    resp = client.post("/api/v1/demands", headers=farmer_headers, json={
        "crop_id": str(tokens["crop_id"]),
        "minimum_quantity": "500.000",
        "maximum_quantity": "1000.000",
        "delivery_from": str(datetime.now(UTC).date()),
        "delivery_until": str(datetime.now(UTC).date() + timedelta(days=5)),
        "delivery_state": "Maharashtra",
        "currency": "INR",
    })
    assert resp.status_code == 403
    assert resp.json()["error"]["code"] == "FORBIDDEN"

    resp = client.post("/api/v1/listings", headers=buyer_headers, json={
        "crop_id": str(tokens["crop_id"]),
        "quantity": "1000.000",
        "unit": "kg",
        "available_from": str(datetime.now(UTC).date()),
        "available_until": str(datetime.now(UTC).date() + timedelta(days=5)),
        "district": "Pune",
        "state": "Maharashtra",
        "postal_area": "411001",
    })
    assert resp.status_code == 403
    assert resp.json()["error"]["code"] == "FORBIDDEN"

    with pytest.raises(ValueError):
        ProfilePatch.model_validate({"role": "ADMIN"})


def test_cross_user_listing_isolation():
    client, _db, tokens = _setup_test_env()
    farmer1_headers = {"Authorization": f"Bearer {tokens['farmer1']}"}
    farmer2_headers = {"Authorization": f"Bearer {tokens['farmer2']}"}

    res = client.post("/api/v1/listings", headers=farmer1_headers, json={
        "crop_id": str(tokens["crop_id"]),
        "quantity": "500.000",
        "unit": "kg",
        "available_from": str(datetime.now(UTC).date()),
        "available_until": str(datetime.now(UTC).date() + timedelta(days=5)),
        "district": "Pune",
        "state": "Maharashtra",
        "postal_area": "411001",
    })
    listing_id = res.json()["data"]["id"]

    resp = client.patch(f"/api/v1/listings/{listing_id}", headers=farmer2_headers, json={
        "version": 1,
        "quantity": "600.000",
    })
    assert resp.status_code == 404

    resp = client.post(f"/api/v1/listings/{listing_id}/cancel", headers=farmer2_headers)
    assert resp.status_code == 409

    resp = client.get(f"/api/v1/listings/{listing_id}/private-location", headers=farmer2_headers)
    assert resp.status_code == 404


def test_cross_user_demand_and_offer_isolation():
    client, _db, tokens = _setup_test_env()
    farmer1_headers = {"Authorization": f"Bearer {tokens['farmer1']}"}
    buyer1_headers = {"Authorization": f"Bearer {tokens['buyer1']}"}
    buyer2_headers = {"Authorization": f"Bearer {tokens['buyer2']}"}

    res = client.post("/api/v1/demands", headers=buyer1_headers, json={
        "crop_id": str(tokens["crop_id"]),
        "minimum_quantity": "500.000",
        "maximum_quantity": "1000.000",
        "delivery_from": str(datetime.now(UTC).date()),
        "delivery_until": str(datetime.now(UTC).date() + timedelta(days=5)),
        "delivery_state": "Maharashtra",
        "currency": "INR",
    })
    demand_id = res.json()["data"]["id"]

    resp = client.patch(f"/api/v1/demands/{demand_id}", headers=buyer2_headers, json={"version": 1, "delivery_district": "Nagpur"})
    assert resp.status_code == 404
    resp = client.post(f"/api/v1/demands/{demand_id}/cancel", headers=buyer2_headers)
    assert resp.status_code == 404

    listing_res = client.post("/api/v1/listings", headers=farmer1_headers, json={
        "crop_id": str(tokens["crop_id"]),
        "quantity": "1000.000",
        "unit": "kg",
        "available_from": str(datetime.now(UTC).date()),
        "available_until": str(datetime.now(UTC).date() + timedelta(days=5)),
        "district": "Pune",
        "state": "Maharashtra",
        "postal_area": "411001",
    })
    listing_id = listing_res.json()["data"]["id"]

    offer_res = client.post("/api/v1/offers", headers=buyer1_headers, json={
        "listing_id": listing_id,
        "quantity_kg": "1000.000",
        "unit_price_per_kg": "31.00",
        "currency": "INR",
        "delivery_terms": "buyer_pickup",
        "expires_at": (datetime.now(UTC) + timedelta(days=2)).isoformat(),
    })
    offer_id = offer_res.json()["data"]["id"]

    resp = client.get(f"/api/v1/offers/{offer_id}", headers=buyer2_headers)
    assert resp.status_code == 404
    resp = client.post(f"/api/v1/offers/{offer_id}/withdraw", headers=buyer2_headers)
    assert resp.status_code == 404


def test_acceptance_contract_and_security_guards():
    client, db, tokens = _setup_test_env()
    farmer1_headers = {"Authorization": f"Bearer {tokens['farmer1']}"}
    farmer2_headers = {"Authorization": f"Bearer {tokens['farmer2']}"}
    buyer1_headers = {"Authorization": f"Bearer {tokens['buyer1']}"}

    lid = uuid4()
    db.listings[lid] = {
        "id": lid, "farmer_profile_id": tokens["farmer1_id"], "crop_id": tokens["crop_id"],
        "available_quantity": Decimal("1000.000"), "unit": "kg", "version": 1, "status": "ACTIVE",
    }
    oid = uuid4()
    db.offers[oid] = {
        "id": oid, "listing_id": lid, "buyer_profile_id": tokens["buyer1_id"], "fpo_id": None,
        "offered_quantity": Decimal("1000.000"), "unit_price": Decimal("31.00"), "currency": "INR",
        "status": "PENDING", "version": 1, "expires_at": datetime.now(UTC) + timedelta(days=1),
    }
    qid = uuid4()
    db.quotes[qid] = {
        "id": qid, "listing_id": lid, "demand_id": None, "transportation_cost": Decimal("1500.00"),
        "storage_cost": Decimal("300.00"), "handling_cost": Decimal("300.00"), "other_applicable_cost": Decimal("150.00"),
        "total_applicable_cost": Decimal("2250.00"), "currency": "INR", "expires_at": datetime.now(UTC) + timedelta(days=1),
    }

    base_payload = {
        "offer_version": 1,
        "listing_version": 1,
        "logistics_quote_id": str(qid),
        "recommendation_option_id": None,
        "acknowledged_amounts": {
            "gross_selling_value": "31000.00",
            "total_applicable_cost": "2250.00",
            "net_farmer_realization": "28750.00",
            "currency": "INR",
        },
    }

    resp = client.post(f"/api/v1/offers/{oid}/accept", headers={**farmer2_headers, "Idempotency-Key": "test-key-1"}, json=base_payload)
    assert resp.status_code == 403
    assert resp.json()["error"]["code"] == "ACTOR_MISMATCH"

    resp = client.post(f"/api/v1/offers/{oid}/accept", headers={**buyer1_headers, "Idempotency-Key": "test-key-1"}, json=base_payload)
    assert resp.status_code == 403
    assert resp.json()["error"]["code"] == "FORBIDDEN"

    resp = client.post(f"/api/v1/offers/{oid}/accept", headers=farmer1_headers, json=base_payload)
    assert resp.status_code == 400
    assert resp.json()["error"]["code"] == "IDEMPOTENCY_KEY_REQUIRED"

    stale_offer = dict(base_payload, offer_version=99)
    resp = client.post(f"/api/v1/offers/{oid}/accept", headers={**farmer1_headers, "Idempotency-Key": "test-key-stale-off"}, json=stale_offer)
    assert resp.status_code == 409
    assert resp.json()["error"]["code"] == "OFFER_VERSION_CONFLICT"

    stale_listing = dict(base_payload, listing_version=99)
    resp = client.post(f"/api/v1/offers/{oid}/accept", headers={**farmer1_headers, "Idempotency-Key": "test-key-stale-list"}, json=stale_listing)
    assert resp.status_code == 409
    assert resp.json()["error"]["code"] == "LISTING_VERSION_CONFLICT"

    curr_mismatch = dict(base_payload, acknowledged_amounts={
        "gross_selling_value": "31000.00", "total_applicable_cost": "2250.00",
        "net_farmer_realization": "28750.00", "currency": "USD",
    })
    resp = client.post(f"/api/v1/offers/{oid}/accept", headers={**farmer1_headers, "Idempotency-Key": "test-key-curr"}, json=curr_mismatch)
    assert resp.status_code == 409
    assert resp.json()["error"]["code"] == "CURRENCY_MISMATCH"

    tampered = dict(base_payload, acknowledged_amounts={
        "gross_selling_value": "31000.00", "total_applicable_cost": "2250.00",
        "net_farmer_realization": "30000.00", "currency": "INR",
    })
    resp = client.post(f"/api/v1/offers/{oid}/accept", headers={**farmer1_headers, "Idempotency-Key": "test-key-tamper"}, json=tampered)
    assert resp.status_code == 409
    assert resp.json()["error"]["code"] == "FINANCIALS_CHANGED"

    # Case 11: Wrong logistics quote binding
    wrong_quote = dict(base_payload, logistics_quote_id=str(uuid4()))
    resp = client.post(f"/api/v1/offers/{oid}/accept", headers={**farmer1_headers, "Idempotency-Key": "test-key-wrong-quote"}, json=wrong_quote)
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "QUOTE_INVALID"

    # Case 12: Expired logistics quote
    exp_qid = uuid4()
    db.quotes[exp_qid] = dict(db.quotes[qid], id=exp_qid, expires_at=datetime.now(UTC) - timedelta(minutes=5))
    expired_quote = dict(base_payload, logistics_quote_id=str(exp_qid))
    resp = client.post(f"/api/v1/offers/{oid}/accept", headers={**farmer1_headers, "Idempotency-Key": "test-key-exp-quote"}, json=expired_quote)
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "QUOTE_EXPIRED"

    # Case 10: Wrong recommendation binding
    other_lid = uuid4()
    wrong_rid = uuid4()
    db.recommendations[wrong_rid] = {
        "id": wrong_rid, "listing_id": other_lid, "farmer_profile_id": tokens["farmer1_id"],
        "expires_at": datetime.now(UTC) + timedelta(days=1),
    }
    wrong_reco = dict(base_payload, recommendation_option_id=str(wrong_rid))
    resp = client.post(f"/api/v1/offers/{oid}/accept", headers={**farmer1_headers, "Idempotency-Key": "test-key-wrong-reco"}, json=wrong_reco)
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "RECOMMENDATION_INVALID"

    # Case 13: Expired recommendation
    exp_rid = uuid4()
    db.recommendations[exp_rid] = {
        "id": exp_rid, "listing_id": lid, "farmer_profile_id": tokens["farmer1_id"],
        "expires_at": datetime.now(UTC) - timedelta(minutes=5),
    }
    expired_reco = dict(base_payload, recommendation_option_id=str(exp_rid))
    resp = client.post(f"/api/v1/offers/{oid}/accept", headers={**farmer1_headers, "Idempotency-Key": "test-key-exp-reco"}, json=expired_reco)
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "RECOMMENDATION_EXPIRED"

    resp1 = client.post(f"/api/v1/offers/{oid}/accept", headers={**farmer1_headers, "Idempotency-Key": "idemp-safe-1"}, json=base_payload)
    assert resp1.status_code == 200
    order_id = resp1.json()["data"]["id"]

    resp2 = client.post(f"/api/v1/offers/{oid}/accept", headers={**farmer1_headers, "Idempotency-Key": "idemp-safe-1"}, json=base_payload)
    assert resp2.status_code == 200
    assert resp2.json()["data"]["id"] == order_id

    altered = dict(base_payload, offer_version=2)
    resp3 = client.post(f"/api/v1/offers/{oid}/accept", headers={**farmer1_headers, "Idempotency-Key": "idemp-safe-1"}, json=altered)
    assert resp3.status_code == 409
    assert resp3.json()["error"]["code"] == "IDEMPOTENCY_CONFLICT"


def test_financial_precision_and_exact_decimal_nfr():
    gross_b, total_b, nfr_b = calculate_nfr(
        Decimal("1000.000"), Decimal("31.00"), Decimal("1500.00"), Decimal("300.00"), Decimal("300.00"), Decimal("150.00")
    )
    assert gross_b == Decimal("31000.00")
    assert total_b == Decimal("2250.00")
    assert nfr_b == Decimal("28750.00")

    gross_a, total_a, nfr_a = calculate_nfr(
        Decimal("1000.000"), Decimal("32.00"), Decimal("5500.00"), Decimal("500.00"), Decimal("300.00"), Decimal("200.00")
    )
    assert gross_a == Decimal("32000.00")
    assert total_a == Decimal("6500.00")
    assert nfr_a == Decimal("25500.00")

    assert nfr_b - nfr_a == Decimal("3250.00")

    snapshot = FinancialSnapshot(
        currency="INR",
        quantity_kg=Decimal("1.000"),
        unit_price_per_kg=Decimal("1.005"),
        gross=Decimal("1.01"),
        transportation=Decimal("0.00"),
        storage=Decimal("0.00"),
        handling=Decimal("0.00"),
        other=Decimal("0.00"),
        total_cost=Decimal("0.00"),
        net_farmer_realization=Decimal("1.01"),
    )
    assert snapshot.gross == Decimal("1.01")


def test_financial_float_rejection():
    client, _db, tokens = _setup_test_env()
    farmer_headers = {"Authorization": f"Bearer {tokens['farmer1']}"}
    buyer_headers = {"Authorization": f"Bearer {tokens['buyer1']}"}

    # Case 18: Float in listing quantity rejected
    resp = client.post("/api/v1/listings", headers=farmer_headers, json={
        "crop_id": str(tokens["crop_id"]),
        "quantity": 500.5,
        "unit": "kg",
        "available_from": str(datetime.now(UTC).date()),
        "district": "Pune",
        "state": "Maharashtra",
    })
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "VALIDATION_ERROR"
    assert any(d["field"] == "quantity" for d in resp.json()["error"]["details"])

    # Direct Pydantic schema validation verifies exact rejection message
    from app.schemas import ListingCreate
    from pydantic import ValidationError
    with pytest.raises(ValidationError) as pyd_exc:
        ListingCreate.model_validate({
            "crop_id": tokens["crop_id"],
            "quantity": 500.5,
            "unit": "kg",
            "available_from": datetime.now(UTC).date(),
            "district": "Pune",
            "state": "Maharashtra",
        })
    assert "decimal values must be strings or exact integers" in str(pyd_exc.value)

    # Case 18: Float in offer price rejected
    resp = client.post("/api/v1/offers", headers=buyer_headers, json={
        "listing_id": str(uuid4()),
        "quantity_kg": "500.000",
        "unit_price_per_kg": 31.25,
        "currency": "INR",
        "delivery_terms": "buyer_pickup",
        "expires_at": (datetime.now(UTC) + timedelta(days=2)).isoformat(),
    })
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "VALIDATION_ERROR"
    assert any(d["field"] == "unit_price_per_kg" for d in resp.json()["error"]["details"])


def test_missing_geography_has_no_fabricated_fallback():
    from app.orchestration import resolve_or_create_quote

    target_listing_id = uuid4()
    db = MockDatabase()
    with pytest.raises(ApiError) as exc:
        asyncio.run(resolve_or_create_quote(
            database=db,
            listing_id=target_listing_id,
            demand_id=None,
            origin_district=None,
            origin_state="Maharashtra",
            dest_district="Pune",
            dest_state="Maharashtra",
            quantity_kg=Decimal("1000.000"),
        ))
    assert exc.value.code == "ROUTE_DATA_NOT_AVAILABLE"
    assert "Origin geography unavailable" in exc.value.message

    with pytest.raises(ApiError) as exc2:
        asyncio.run(resolve_or_create_quote(
            database=db,
            listing_id=target_listing_id,
            demand_id=None,
            origin_district="Pune",
            origin_state="Maharashtra",
            dest_district="Mumbai",
            dest_state=None,
            quantity_kg=Decimal("1000.000"),
        ))
    assert exc2.value.code == "ROUTE_DATA_NOT_AVAILABLE"
    assert "Destination geography unavailable" in exc2.value.message


def test_provenance_and_live_unavailability():
    quality_svc = QualityService()
    target_listing_id = uuid4()
    dummy_meta = ImageMetadata(
        asset_id=uuid4(), mime_type="image/jpeg", size_bytes=2048,
        width_px=800, height_px=600, checksum_sha256="a" * 64,
        blur_score=0.1, visible_produce_area_ratio=0.8,
    )
    req = QualityRequest(
        request_id=uuid4(), listing_id=target_listing_id, image=dummy_meta, crop="tomato",
        as_of=datetime.now(UTC), configuration_version="v1", data_mode=QualityDataMode.LIVE,
    )
    res = quality_svc.assess(req)
    assert res.status == ResultStatus.UNAVAILABLE
    assert "NO_CONFIGURED_VISUAL_MODEL" in res.warnings

    quote = LogisticsQuote(
        id=uuid4(), listing_id=target_listing_id,
        transportation_cost=Decimal("1500.00"), storage_cost=Decimal("300.00"),
        handling_cost=Decimal("300.00"), other_applicable_cost=Decimal("150.00"),
        total_applicable_cost=Decimal("2250.00"), currency="INR",
        distance_km=Decimal("35.000"), source_name="logistics-v1",
        data_mode=MatchingDataMode.DEMO, calculated_at=datetime.now(UTC),
        expires_at=datetime.now(UTC) + timedelta(days=1),
    )
    assert quote.data_mode == MatchingDataMode.DEMO


def test_shared_data_mode_contract_and_sandbox_exclusion():
    from app.orchestration import resolve_or_create_quote
    from logistics_engine.models import DataMode as LogisticsDataMode
    from market_engine.models import DataMode as MarketDataMode
    from matching_engine.models import DataMode as MatchingDataMode
    from prediction_engine.models import DataMode as PredictionDataMode
    from quality_engine.models import DataMode as QualityDataMode

    # Shared engine provenance is strictly LIVE, CACHED, DEMO. SANDBOX is prohibited across all 5 engines.
    for enum_cls in (MatchingDataMode, LogisticsDataMode, PredictionDataMode, MarketDataMode, QualityDataMode):
        assert set(enum_cls._value2member_map_.keys()) == {"LIVE", "CACHED", "DEMO"}
        with pytest.raises(ValueError):
            enum_cls("SANDBOX")

    # Case 20: LIVE -> DEMO prohibition in logistics orchestration (LIVE mode does not fall back to demo)
    target_listing_id = uuid4()
    db = MockDatabase()
    with pytest.raises(ApiError) as exc:
        asyncio.run(resolve_or_create_quote(
            database=db,
            listing_id=target_listing_id,
            demand_id=None,
            origin_district="Nashik",
            origin_state="Maharashtra",
            dest_district="Buyer B",
            dest_state="Maharashtra",
            quantity_kg=Decimal("1000.000"),
            data_mode="LIVE",
        ))
    assert exc.value.status_code == 503
    assert exc.value.code == "LOGISTICS_UNAVAILABLE"
    assert "No live logistics quote available" in exc.value.message

    # Recommendation provenance output can only be LIVE, CACHED, or DEMO
    from matching_engine.provenance import propagate_data_mode
    assert propagate_data_mode([MatchingDataMode.DEMO, MatchingDataMode.LIVE]) == MatchingDataMode.DEMO
    assert propagate_data_mode([MatchingDataMode.CACHED, MatchingDataMode.LIVE]) == MatchingDataMode.CACHED
    assert propagate_data_mode([MatchingDataMode.LIVE, MatchingDataMode.LIVE]) == MatchingDataMode.LIVE


def test_missing_verification_remains_unverified():
    client, _, tokens = _setup_test_env()
    buyer2_headers = {"Authorization": f"Bearer {tokens['buyer2']}"}
    resp = client.get("/api/v1/me", headers=buyer2_headers)
    assert resp.status_code == 200
    assert resp.json()["data"]["verification_status"] == "UNVERIFIED"
    assert resp.json()["data"]["status"] == "ACTIVE"
    assert "trust_score" not in resp.json()["data"]

    # Approved Agent 8 rule: UNVERIFIED counterparties remain active and eligible.
    # Verification is an evidence signal and late tie-break only, not an eligibility gate.
    now = datetime.now(UTC)
    listing = Listing(
        id=uuid4(), farmer_profile_id=uuid4(), crop_id=uuid4(), variety_id=None,
        available_quantity_kg=Decimal("1000.000"), unit="kg",
        available_from=now.date(), available_until=now.date() + timedelta(days=7),
        status="ACTIVE", version=1, quality_facts={},
    )
    offer = Offer(
        id=uuid4(), listing_id=listing.id, buyer_profile_id=uuid4(), fpo_id=None,
        quantity_kg=Decimal("1000.000"), unit_price_per_kg=Decimal("31.00"), unit="kg",
        currency="INR", expires_at=now + timedelta(days=2), status="PENDING", version=1,
    )
    quote = LogisticsQuote(
        id=uuid4(), listing_id=listing.id, demand_id=None,
        transportation_cost=Decimal("1500.00"), storage_cost=Decimal("300.00"),
        handling_cost=Decimal("300.00"), other_applicable_cost=Decimal("150.00"),
        total_applicable_cost=Decimal("2250.00"), currency="INR",
        distance_km=Decimal("35.000"), source_name="logistics-v1",
        data_mode=MatchingDataMode.DEMO, calculated_at=now,
        expires_at=now + timedelta(days=1),
    )

    # 1. Active account + missing verification => active=True, verification=UNVERIFIED => ELIGIBLE
    unverified_active_counterparty = Counterparty(
        buyer_profile_id=offer.buyer_profile_id,
        display_name="Active Unverified Buyer",
        verification_status=VerificationStatus.UNVERIFIED,
        active=True,
    )
    state, reasons, _ = evaluate_eligibility(
        listing, CandidateInput(offer=offer, demand=None, quote=quote, counterparty=unverified_active_counterparty), now
    )
    assert state == CandidateState.ELIGIBLE
    assert "COUNTERPARTY_INACTIVE" not in reasons

    # 2. Inactive account => excluded independently of verification status
    inactive_counterparty = Counterparty(
        buyer_profile_id=offer.buyer_profile_id,
        display_name="Inactive Buyer",
        verification_status=VerificationStatus.VERIFIED,
        active=False,
    )
    state_inact, reasons_inact, _ = evaluate_eligibility(
        listing, CandidateInput(offer=offer, demand=None, quote=quote, counterparty=inactive_counterparty), now
    )
    assert state_inact == CandidateState.EXCLUDED
    assert "COUNTERPARTY_INACTIVE" in reasons_inact


def test_order_and_payment_state_machines():
    validate_order_transition(OrderStatus.CONFIRMED, OrderStatus.PICKUP_SCHEDULED)
    validate_order_transition(OrderStatus.PICKUP_SCHEDULED, OrderStatus.IN_TRANSIT)
    validate_order_transition(OrderStatus.IN_TRANSIT, OrderStatus.DELIVERED)
    validate_order_transition(OrderStatus.DELIVERED, OrderStatus.COMPLETED)

    with pytest.raises(TransactionError) as exc1:
        validate_order_transition(OrderStatus.CONFIRMED, OrderStatus.DELIVERED)
    assert exc1.value.code == ErrorCode.INVALID_ORDER_TRANSITION

    with pytest.raises(TransactionError) as exc2:
        validate_order_transition(OrderStatus.COMPLETED, OrderStatus.IN_TRANSIT)
    assert exc2.value.code == ErrorCode.TERMINAL_STATE

    with pytest.raises(TransactionError) as exc3:
        validate_order_transition(OrderStatus.CANCELLED, OrderStatus.CONFIRMED)
    assert exc3.value.code == ErrorCode.TERMINAL_STATE

    validate_payment_transition(PaymentStatus.PENDING, PaymentStatus.PROCESSING)
    validate_payment_transition(PaymentStatus.PROCESSING, PaymentStatus.PAID)
    validate_payment_transition(PaymentStatus.PAID, PaymentStatus.REFUNDED)

    with pytest.raises(TransactionError):
        validate_payment_transition(PaymentStatus.PENDING, PaymentStatus.REFUNDED)


def test_provider_gated_live_payment():
    class DummyRepo(PaymentRepository):
        def get(self, payment_id: str) -> Payment | None:
            return Payment(id=payment_id, status=PaymentStatus.PENDING, mode=TxDataMode.LIVE)
        def save_transition(self, candidate: Payment, expected_status: str) -> Payment | None:
            return candidate

    class UnverifiedGate(ProviderGate):
        def verified(self, payment: Payment, provider_evidence: str | None) -> bool:
            return False

    class DummyEvents(EventRepository):
        def append(self, event: Any) -> None:
            pass

    wf = PaymentWorkflow(DummyRepo(), UnverifiedGate(), DummyEvents())
    with pytest.raises(TransactionError) as exc:
        wf.transition("pay-1", PaymentStatus.PENDING, PaymentStatus.PROCESSING, Actor("actor-1", ActorRole.ADMIN))
    assert exc.value.code == ErrorCode.PAYMENT_PROVIDER_REQUIRED


def test_persistence_error_sanitized():
    from app.orchestration import resolve_or_create_quote

    target_listing_id = uuid4()
    class CrashingDatabase(Database):
        def __init__(self) -> None:
            super().__init__(None)
        @property
        def configured(self) -> bool:
            return True
        async def fetchrow(self, query: str, *args: Any) -> Any:
            q = query.lower()
            if "insert into public.logistics_quotes" in q:
                raise RuntimeError("CRITICAL_INTERNAL_DB_PASSWORD_LEAK: server at /var/run/postgresql")
            return None

    with pytest.raises(ApiError) as exc:
        asyncio.run(resolve_or_create_quote(
            database=CrashingDatabase(),
            listing_id=target_listing_id,
            demand_id=None,
            origin_district="Nashik",
            origin_state="Maharashtra",
            dest_district="Buyer B",
            dest_state="Maharashtra",
            quantity_kg=Decimal("1000.000"),
        ))
    assert exc.value.status_code == 500
    assert "CRITICAL_INTERNAL_DB_PASSWORD_LEAK" not in exc.value.message
    assert exc.value.message == "Failed to persist logistics quote to database"


def test_demand_minimum_quantity_gap_demonstration():
    now = datetime.now(UTC)
    listing = Listing(
        id=uuid4(), farmer_profile_id=uuid4(), crop_id=uuid4(), variety_id=None,
        available_quantity_kg=Decimal("1000.000"), unit="kg",
        available_from=now.date(), available_until=now.date() + timedelta(days=7),
        status="ACTIVE", version=1, quality_facts={},
    )
    demand = Demand(
        id=uuid4(), buyer_profile_id=uuid4(), fpo_id=None, crop_id=listing.crop_id, variety_id=None,
        minimum_quantity_kg=Decimal("500.000"), maximum_quantity_kg=Decimal("1000.000"),
        fulfilled_quantity_kg=Decimal("0.000"), unit="kg", quality_requirements={},
        delivery_from=now.date(), delivery_until=now.date() + timedelta(days=7),
        currency="INR", status="ACTIVE",
    )
    small_offer = Offer(
        id=uuid4(), listing_id=listing.id, buyer_profile_id=demand.buyer_profile_id, fpo_id=None,
        quantity_kg=Decimal("100.000"), unit_price_per_kg=Decimal("31.00"), unit="kg",
        currency="INR", expires_at=now + timedelta(days=2), status="PENDING", version=1,
    )
    counterparty = Counterparty(
        buyer_profile_id=demand.buyer_profile_id, display_name="Buyer",
        verification_status=VerificationStatus.VERIFIED, active=True,
    )

    state, reasons, _ = evaluate_eligibility(
        listing, CandidateInput(offer=small_offer, demand=demand, quote=None, counterparty=counterparty), now
    )
    assert state == CandidateState.EXCLUDED
    assert "DEMAND_MINIMUM_QUANTITY_NOT_MET" in reasons
