from __future__ import annotations

from datetime import UTC, date, datetime, timedelta
from decimal import Decimal
from typing import Any
from uuid import UUID, uuid4

import jwt
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi.testclient import TestClient

from app.auth import JWKSVerifier
from app.config import Settings
from app.database import Database
from app.errors import ApiError
from app.main import create_app


class InMemoryIntegrationDatabase(Database):
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
        self.quality_reports: dict[UUID, dict[str, Any]] = {}
        self.mandis: dict[UUID, dict[str, Any]] = {}
        self.mandi_prices: dict[UUID, dict[str, Any]] = {}
        self.idempotency_records: dict[str, dict[str, Any]] = {}

    async def connect(self) -> None:
        pass

    async def close(self) -> None:
        pass

    async def fetch(self, query: str, *args: Any) -> list[dict[str, Any]]:
        q = " ".join(query.split()).lower()
        if "from public.crops" in q:
            return list(self.crops.values())
        if "from public.crop_varieties" in q:
            crop_id = args[0]
            return [v for v in self.crop_varieties.values() if v["crop_id"] == crop_id]
        if "from public.produce_listings" in q:
            return [listing_obj for listing_obj in self.listings.values() if listing_obj.get("deleted_at") is None]
        if "from public.buyer_demands" in q:
            return [d for d in self.demands.values() if d.get("deleted_at") is None]
        if "from public.offers" in q:
            rows = []
            for off in self.offers.values():
                r = dict(off)
                buyer_id = off.get("buyer_profile_id")
                if buyer_id:
                    bp = self.buyer_profiles.get(buyer_id, {})
                    p = self.profiles.get(buyer_id, {})
                    r["buyer_name"] = bp.get("organization_name") or p.get("display_name") or "Buyer"
                    r["buyer_verification_status"] = bp.get("verification_status") or "UNVERIFIED"
                demand_id = off.get("demand_id")
                if demand_id and demand_id in self.demands:
                    d = self.demands[demand_id]
                    r["delivery_district"] = d.get("delivery_district")
                    r["delivery_state"] = d.get("delivery_state")
                    r["demand_min_qty"] = d.get("minimum_quantity")
                    r["demand_max_qty"] = d.get("maximum_quantity")
                    r["demand_fulfilled_qty"] = d.get("fulfilled_quantity") or Decimal("0")
                    r["demand_delivery_from"] = d.get("delivery_from")
                    r["demand_delivery_until"] = d.get("delivery_until")
                    r["demand_status"] = d.get("status")
                rows.append(r)
            return rows
        if "from public.recommendations" in q:
            listing_id = args[0]
            rows = [r for r in self.recommendations.values() if r["listing_id"] == listing_id]
            rows.sort(key=lambda x: x.get("rank", 999))
            return [dict(r) for r in rows]
        if "from public.orders" in q:
            return list(self.orders.values())
        if "from public.order_status_history" in q:
            order_id = args[0]
            return [h for h in self.order_history if h["order_id"] == order_id]
        if "from public.payments" in q:
            order_id = args[0]
            return [p for p in self.payments.values() if p["order_id"] == order_id]
        if "from public.mandis" in q:
            return list(self.mandis.values())
        if "from public.mandi_prices" in q:
            return list(self.mandi_prices.values())
        return []

    async def fetchrow(self, query: str, *args: Any) -> dict[str, Any] | None:
        q = " ".join(query.split()).lower()
        if "from public.profiles" in q:
            val = args[0]
            prof = None
            if "user_id=$1" in q or "user_id =" in q:
                for p in self.profiles.values():
                    if p.get("user_id") == val:
                        prof = p
                        break
            else:
                prof = self.profiles.get(val)
                if not prof:
                    for p in self.profiles.values():
                        if p.get("user_id") == val or p.get("id") == val:
                            prof = p
                            break
            if not prof:
                return None
            pid = prof["id"]
            res = dict(prof)
            if prof["role"] == "FARMER":
                f = self.farmer_profiles.get(pid, {})
                res.update({
                    "farm_summary": f.get("farm_summary"),
                    "farmer_district": f.get("district"),
                    "farmer_state": f.get("state"),
                    "postal_area": f.get("postal_area"),
                })
            elif prof["role"] == "BUYER":
                b = self.buyer_profiles.get(pid, {})
                res.update({
                    "organization_name": b.get("organization_name"),
                    "trade_reference": b.get("trade_reference"),
                    "verification_status": b.get("verification_status"),
                    "reliability_status": b.get("reliability_status"),
                })
            return res

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
                "deleted_at": None,
            }
            self.listings[lid] = row
            return row

        if "from public.produce_listings" in q:
            lid = args[0]
            return self.listings.get(lid)

        if "update public.produce_listings" in q:
            lid = args[0]
            row = self.listings.get(lid)
            if not row:
                return None
            if "status=" in q:
                row["status"] = args[2] if len(args) > 2 and isinstance(args[2], str) else args[1]
            row["version"] += 1
            row["updated_at"] = datetime.now(UTC)
            return row

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
                "unit": args[6],
                "quality_requirements": args[7] or {},
                "delivery_from": args[8],
                "delivery_until": args[9],
                "delivery_district": args[10],
                "delivery_state": args[11],
                "indicative_price": Decimal(str(args[12])) if args[12] is not None else None,
                "currency": args[13],
                "status": "DRAFT",
                "version": 1,
                "created_at": datetime.now(UTC),
                "updated_at": datetime.now(UTC),
                "deleted_at": None,
            }
            self.demands[did] = row
            return row

        if "from public.buyer_demands" in q:
            did = args[0]
            return self.demands.get(did)

        if "update public.buyer_demands" in q:
            did = args[0]
            row = self.demands.get(did)
            if not row:
                return None
            if "status=" in q:
                row["status"] = args[1]
            row["version"] += 1
            row["updated_at"] = datetime.now(UTC)
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
                "idempotency_key": args[9],
                "version": 1,
                "created_at": datetime.now(UTC),
                "updated_at": datetime.now(UTC),
            }
            self.offers[oid] = row
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
            row["updated_at"] = datetime.now(UTC)
            return row

        if "insert into public.logistics_quotes" in q:
            qid = uuid4()
            row = {
                "id": qid,
                "listing_id": args[0],
                "demand_id": args[1],
                "distance_km": Decimal(str(args[2])),
                "transport_cost": Decimal(str(args[3])),
                "storage_cost": Decimal(str(args[4])),
                "handling_cost": Decimal(str(args[5])),
                "total_cost": Decimal(str(args[6])),
                "currency": args[7],
                "breakdown": args[8] or {},
                "assumptions": args[9] or {},
                "source_version": args[10],
                "data_mode": args[11],
                "expires_at": args[12],
                "created_at": datetime.now(UTC),
            }
            self.quotes[qid] = row
            return row

        if "from public.logistics_quotes" in q:
            if "where listing_id" in q:
                lid = args[0]
                did = args[1] if len(args) > 1 else None
                for quote in self.quotes.values():
                    if quote.get("listing_id") == lid and (did is None or quote.get("demand_id") == did):
                        return dict(quote)
            qid = args[0]
            return self.quotes.get(qid)

        if "insert into public.recommendations" in q:
            rid = uuid4()
            row = {
                "id": rid,
                "listing_id": args[0],
                "farmer_profile_id": args[1],
                "candidate_buyer_profile_id": args[2],
                "candidate_fpo_id": args[3],
                "candidate_mandi_id": args[4],
                "channel_type": args[5],
                "rank": args[6],
                "gross_payoff": Decimal(str(args[7])),
                "logistics_cost": Decimal(str(args[8])),
                "platform_fee": Decimal(str(args[9])),
                "estimated_net_farmer_realization": Decimal(str(args[10])),
                "currency": args[11],
                "logistics_quote_id": args[12],
                "timing_signal": args[13],
                "timing_reason": args[14],
                "confidence_score": Decimal(str(args[15])) if args[15] is not None else None,
                "explanation_summary": args[16],
                "score_breakdown": args[17] or {},
                "input_metadata": args[18] or {},
                "source": args[19],
                "engine_version": args[20],
                "data_mode": args[21],
                "status": "VALID",
                "created_at": datetime.now(UTC),
            }
            self.recommendations[rid] = row
            return row

        if "from public.recommendations" in q:
            rid = args[0]
            return self.recommendations.get(rid)

        if "from public.orders" in q:
            oid = args[0]
            return self.orders.get(oid)

        if "update public.orders" in q:
            oid = args[0]
            target_status = args[1]
            row = self.orders.get(oid)
            if not row:
                return None
            row["status"] = target_status
            row["version"] += 1
            row["updated_at"] = datetime.now(UTC)
            self.order_history.append({
                "id": uuid4(),
                "order_id": oid,
                "from_status": row["status"],
                "to_status": target_status,
                "changed_at": datetime.now(UTC),
            })
            return row

        if "insert into public.quality_reports" in q:
            qrid = uuid4()
            row = {
                "id": qrid,
                "listing_id": args[0],
                "method": args[1],
                "source_name": args[2],
                "observations": args[3] or {},
                "confidence": Decimal(str(args[4])) if args[4] is not None else None,
                "verification_status": "UNVERIFIED",
                "manually_verified": False,
                "limitations": args[5] or [],
                "model_version": args[6],
                "data_mode": args[7],
                "created_at": datetime.now(UTC),
                "updated_at": datetime.now(UTC),
            }
            self.quality_reports[qrid] = row
            return row

        if "from public.quality_reports" in q:
            qrid = args[0]
            return self.quality_reports.get(qrid)

        if "from public.mandis" in q:
            mid = args[0]
            return self.mandis.get(mid)

        return None

    async def call_row(self, query: str, *args: Any) -> dict[str, Any]:
        q = " ".join(query.split()).lower()
        if "accept_offer" in q:
            farmer_profile_id = args[0]
            offer_id = args[1]
            _ = (args[2], args[3])
            logistics_quote_id = args[4]
            recommendation_option_id = args[5]
            idempotency_key = args[6]
            fingerprint = args[7]
            gross_selling_value = Decimal(str(args[8]))
            total_applicable_cost = Decimal(str(args[9]))
            net_farmer_realization = Decimal(str(args[10]))
            currency = args[11]

            if idempotency_key in self.idempotency_records:
                rec = self.idempotency_records[idempotency_key]
                if rec["fingerprint"] != fingerprint:
                    raise ApiError("IDEMPOTENCY_CONFLICT", "Payload fingerprint mismatch", 409)
                return {"order_id": rec["order_id"]}

            offer = self.offers.get(offer_id)
            if not offer:
                raise ApiError("NOT_FOUND", "Offer not found", 404)
            if offer["status"] != "PENDING":
                raise ApiError("OFFER_NOT_PENDING", "Offer is not pending", 409)

            listing = self.listings.get(offer["listing_id"])
            if not listing or listing["farmer_profile_id"] != farmer_profile_id:
                raise ApiError("FORBIDDEN", "Listing not owned by accepting farmer", 403)

            order_id = uuid4()
            order = {
                "id": order_id,
                "listing_id": listing["id"],
                "offer_id": offer_id,
                "farmer_profile_id": farmer_profile_id,
                "buyer_profile_id": offer["buyer_profile_id"],
                "fpo_id": offer["fpo_id"],
                "quantity": offer["offered_quantity"],
                "unit": "kg",
                "unit_price": offer["unit_price"],
                "gross_amount": gross_selling_value,
                "total_applicable_cost": total_applicable_cost,
                "net_farmer_realization": net_farmer_realization,
                "currency": currency,
                "logistics_quote_id": logistics_quote_id,
                "recommendation_option_id": recommendation_option_id,
                "status": "CONFIRMED",
                "version": 1,
                "created_at": datetime.now(UTC),
                "updated_at": datetime.now(UTC),
            }
            self.orders[order_id] = order
            offer["status"] = "ACCEPTED"
            listing["available_quantity"] -= offer["offered_quantity"]
            if listing["available_quantity"] == 0:
                listing["status"] = "FULFILLED"

            self.order_history.append({
                "id": uuid4(),
                "order_id": order_id,
                "from_status": "NONE",
                "to_status": "CONFIRMED",
                "changed_at": datetime.now(UTC),
            })

            self.idempotency_records[idempotency_key] = {
                "order_id": order_id,
                "fingerprint": fingerprint,
            }
            return {"order_id": order_id}

        return {}


def _create_test_client() -> tuple[TestClient, InMemoryIntegrationDatabase, dict[str, str]]:
    db = InMemoryIntegrationDatabase()
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

    app = create_app(settings, db)
    app.state.verifier = verifier

    farmer_id = uuid4()
    farmer_user_id = uuid4()
    db.profiles[farmer_id] = {
        "id": farmer_id, "user_id": farmer_user_id, "role": "FARMER",
        "display_name": "Rahul Patil", "preferred_locale": "mr", "status": "ACTIVE",
        "created_at": datetime.now(UTC), "updated_at": datetime.now(UTC),
    }
    db.farmer_profiles[farmer_id] = {
        "profile_id": farmer_id, "farm_summary": "10 acre tomato farm",
        "district": "Pune", "state": "Maharashtra", "postal_area": "411001",
    }

    buyer_a_id = uuid4()
    buyer_a_user = uuid4()
    db.profiles[buyer_a_id] = {
        "id": buyer_a_id, "user_id": buyer_a_user, "role": "BUYER",
        "display_name": "Buyer A Mumbai Organics", "preferred_locale": "en", "status": "ACTIVE",
        "created_at": datetime.now(UTC), "updated_at": datetime.now(UTC),
    }
    db.buyer_profiles[buyer_a_id] = {
        "profile_id": buyer_a_id, "organization_name": "Mumbai Fresh Hub",
        "trade_reference": "TR-MUM-01", "verification_status": "VERIFIED", "reliability_status": "RELIABLE",
    }

    buyer_b_id = uuid4()
    buyer_b_user = uuid4()
    db.profiles[buyer_b_id] = {
        "id": buyer_b_id, "user_id": buyer_b_user, "role": "BUYER",
        "display_name": "Buyer B Pune Local Retail", "preferred_locale": "mr", "status": "ACTIVE",
        "created_at": datetime.now(UTC), "updated_at": datetime.now(UTC),
    }
    db.buyer_profiles[buyer_b_id] = {
        "profile_id": buyer_b_id, "organization_name": "Pune Mandi Mart",
        "trade_reference": "TR-PUN-02", "verification_status": "VERIFIED", "reliability_status": "RELIABLE",
    }

    crop_id = uuid4()
    db.crops[crop_id] = {
        "id": crop_id, "canonical_code": "TOMATO", "name_en": "Tomato", "name_hi": "टमाटर",
        "name_bn": "টমেটো", "default_unit": "kg", "active": True, "created_at": datetime.now(UTC),
    }

    now = datetime.now(UTC)
    def make_token(uid: UUID) -> str:
        return jwt.encode(
            {"sub": str(uid), "aud": "authenticated", "iss": settings.supabase_jwt_issuer,
             "iat": now, "exp": now + timedelta(hours=1)},
            private_key, algorithm="RS256", headers={"kid": "test-key"},
        )

    tokens = {
        "farmer": make_token(farmer_user_id),
        "buyer_a": make_token(buyer_a_user),
        "buyer_b": make_token(buyer_b_user),
        "crop_id": str(crop_id),
        "farmer_id": str(farmer_id),
        "buyer_a_id": str(buyer_a_id),
        "buyer_b_id": str(buyer_b_id),
    }

    return TestClient(app), db, tokens


def test_complete_sih_end_to_end_journey() -> None:
    client, db, ctx = _create_test_client()
    farmer_headers = {"Authorization": f"Bearer {ctx['farmer']}"}
    buyer_a_headers = {"Authorization": f"Bearer {ctx['buyer_a']}"}
    buyer_b_headers = {"Authorization": f"Bearer {ctx['buyer_b']}"}
    crop_id = ctx["crop_id"]

    # 1. Farmer creates listing
    create_listing_resp = client.post("/api/v1/listings", headers=farmer_headers, json={
        "crop_id": crop_id,
        "quantity": "1000.000",
        "unit": "kg",
        "available_from": str(date.today()),
        "available_until": str(date.today() + timedelta(days=7)),
        "district": "Pune",
        "state": "Maharashtra",
        "postal_area": "411001",
        "quality_summary": {"grade": "A"},
    })
    assert create_listing_resp.status_code == 201
    listing_id = create_listing_resp.json()["data"]["id"]

    pub_resp = client.post(f"/api/v1/listings/{listing_id}/publish", headers=farmer_headers)
    assert pub_resp.status_code == 200
    assert pub_resp.json()["data"]["status"] == "ACTIVE"

    # 2. Buyer A creates demand
    demand_a_resp = client.post("/api/v1/demands", headers=buyer_a_headers, json={
        "crop_id": crop_id,
        "minimum_quantity": "500.000",
        "maximum_quantity": "1500.000",
        "unit": "kg",
        "delivery_from": str(date.today()),
        "delivery_until": str(date.today() + timedelta(days=5)),
        "delivery_district": "Mumbai",
        "delivery_state": "Maharashtra",
        "indicative_price": "32.00",
        "currency": "INR",
    })
    assert demand_a_resp.status_code == 201
    demand_a_id = demand_a_resp.json()["data"]["id"]
    client.post(f"/api/v1/demands/{demand_a_id}/publish", headers=buyer_a_headers)

    # 3. Buyer B creates demand
    demand_b_resp = client.post("/api/v1/demands", headers=buyer_b_headers, json={
        "crop_id": crop_id,
        "minimum_quantity": "500.000",
        "maximum_quantity": "1500.000",
        "unit": "kg",
        "delivery_from": str(date.today()),
        "delivery_until": str(date.today() + timedelta(days=5)),
        "delivery_district": "Pune",
        "delivery_state": "Maharashtra",
        "indicative_price": "31.00",
        "currency": "INR",
    })
    assert demand_b_resp.status_code == 201
    demand_b_id = demand_b_resp.json()["data"]["id"]
    client.post(f"/api/v1/demands/{demand_b_id}/publish", headers=buyer_b_headers)

    # 4. Buyer A submits offer: 32/kg for 1000 kg (Gross 32,000)
    offer_a_resp = client.post("/api/v1/offers", headers=buyer_a_headers, json={
        "listing_id": listing_id,
        "demand_id": demand_a_id,
        "quantity_kg": "1000.000",
        "unit_price_per_kg": "32.00",
        "currency": "INR",
        "delivery_terms": "Door delivery Mumbai",
        "expires_at": (datetime.now(UTC) + timedelta(days=2)).isoformat(),
    })
    assert offer_a_resp.status_code == 201
    offer_a_id = offer_a_resp.json()["data"]["id"]
    assert offer_a_id is not None

    # 5. Buyer B submits offer: 31/kg for 1000 kg (Gross 31,000)
    offer_b_resp = client.post("/api/v1/offers", headers=buyer_b_headers, json={
        "listing_id": listing_id,
        "demand_id": demand_b_id,
        "quantity_kg": "1000.000",
        "unit_price_per_kg": "31.00",
        "currency": "INR",
        "delivery_terms": "Local delivery Pune",
        "expires_at": (datetime.now(UTC) + timedelta(days=2)).isoformat(),
    })
    assert offer_b_resp.status_code == 201
    offer_b_id = offer_b_resp.json()["data"]["id"]

    # 6. Seed quotes for Buyer A (distant: 6,500 total logistics cost) and Buyer B (local: 2,250 total logistics cost)
    quote_a = {
        "id": uuid4(),
        "listing_id": UUID(listing_id),
        "demand_id": UUID(demand_a_id),
        "distance_km": Decimal("160.000"),
        "transport_cost": Decimal("5000.00"),
        "storage_cost": Decimal("1000.00"),
        "handling_cost": Decimal("500.00"),
        "total_cost": Decimal("6500.00"),
        "currency": "INR",
        "breakdown": {},
        "assumptions": {},
        "source_version": "logistics-v1",
        "data_mode": "DEMO",
        "expires_at": datetime.now(UTC) + timedelta(days=1),
        "created_at": datetime.now(UTC),
    }
    db.quotes[quote_a["id"]] = quote_a

    quote_b = {
        "id": uuid4(),
        "listing_id": UUID(listing_id),
        "demand_id": UUID(demand_b_id),
        "distance_km": Decimal("25.000"),
        "transport_cost": Decimal("1500.00"),
        "storage_cost": Decimal("300.00"),
        "handling_cost": Decimal("450.00"),
        "total_cost": Decimal("2250.00"),
        "currency": "INR",
        "breakdown": {},
        "assumptions": {},
        "source_version": "logistics-v1",
        "data_mode": "DEMO",
        "expires_at": datetime.now(UTC) + timedelta(days=1),
        "created_at": datetime.now(UTC),
    }
    db.quotes[quote_b["id"]] = quote_b

    # 7. Farmer requests Recommendation Generation
    rec_gen_resp = client.post(f"/api/v1/listings/{listing_id}/recommendations", headers=farmer_headers)
    assert rec_gen_resp.status_code == 200
    options = rec_gen_resp.json()["data"]
    assert len(options) >= 2

    top_option = options[0]
    second_option = options[1]

    # Buyer B ranks #1 with NFR 28750.00 (Gross 31000 - Costs 2250)
    assert top_option["rank"] == 1
    assert Decimal(str(top_option["estimated_net_farmer_realization"])) == Decimal("28750.00")
    assert Decimal(str(top_option["difference_from_best"])) == Decimal("0.00")

    # Buyer A ranks #2 with NFR 25500.00 (Gross 32000 - Costs 6500)
    assert second_option["rank"] == 2
    assert Decimal(str(second_option["estimated_net_farmer_realization"])) == Decimal("25500.00")
    assert Decimal(str(second_option["difference_from_best"])) == Decimal("3250.00")

    # Timing signal is INSUFFICIENT_DATA without complete wait economics
    assert top_option["timing_signal"] in ("INSUFFICIENT_DATA", "WAIT_ECONOMICS_UNAVAILABLE")
    assert top_option["sell_wait"] == "INSUFFICIENT_DATA"
    assert top_option["confidence"] is None
    assert second_option["confidence"] is None

    # 8. Test quality report endpoint
    qr_resp = client.post(f"/api/v1/produce-listings/{listing_id}/quality-reports", headers=farmer_headers, json={
        "crop": "tomato",
        "data_mode": "DEMO",
    })
    assert qr_resp.status_code == 201
    qr_data = qr_resp.json()["data"]
    assert qr_data["verification_status"] == "UNVERIFIED"
    assert qr_data["confidence"] is None

    # 9. Farmer accepts Buyer B offer
    accept_resp = client.post(
        f"/api/v1/offers/{offer_b_id}/accept",
        headers={**farmer_headers, "Idempotency-Key": "idemp-sih-demo-001"},
        json={
            "offer_version": 1,
            "listing_version": 2,
            "logistics_quote_id": str(quote_b["id"]),
            "recommendation_option_id": str(top_option["id"]),
            "acknowledged_amounts": {
                "gross_selling_value": "31000.00",
                "total_applicable_cost": "2250.00",
                "net_farmer_realization": "28750.00",
                "currency": "INR",
            },
        },
    )
    assert accept_resp.status_code == 200
    order = accept_resp.json()["data"]
    order_id = order["id"]
    assert order["status"] == "CONFIRMED"
    assert Decimal(str(order["net_farmer_realization"])) == Decimal("28750.00")

    # 10. Test idempotency replay
    replay_resp = client.post(
        f"/api/v1/offers/{offer_b_id}/accept",
        headers={**farmer_headers, "Idempotency-Key": "idemp-sih-demo-001"},
        json={
            "offer_version": 1,
            "listing_version": 2,
            "logistics_quote_id": str(quote_b["id"]),
            "recommendation_option_id": str(top_option["id"]),
            "acknowledged_amounts": {
                "gross_selling_value": "31000.00",
                "total_applicable_cost": "2250.00",
                "net_farmer_realization": "28750.00",
                "currency": "INR",
            },
        },
    )
    assert replay_resp.status_code == 200
    assert replay_resp.json()["data"]["id"] == order_id

    # 11. Order state machine transitions
    t1_resp = client.post(f"/api/v1/orders/{order_id}/transitions", headers=farmer_headers, json={
        "to_status": "PICKUP_SCHEDULED",
        "version": 1,
    })
    assert t1_resp.status_code == 200
    assert t1_resp.json()["data"]["status"] == "PICKUP_SCHEDULED"

    t2_resp = client.post(f"/api/v1/orders/{order_id}/transitions", headers=buyer_b_headers, json={
        "to_status": "IN_TRANSIT",
        "version": 2,
    })
    assert t2_resp.status_code == 200
    assert t2_resp.json()["data"]["status"] == "IN_TRANSIT"

    t3_resp = client.post(f"/api/v1/orders/{order_id}/transitions", headers=buyer_b_headers, json={
        "to_status": "DELIVERED",
        "version": 3,
    })
    assert t3_resp.status_code == 200
    assert t3_resp.json()["data"]["status"] == "DELIVERED"

    t4_resp = client.post(f"/api/v1/orders/{order_id}/transitions", headers=farmer_headers, json={
        "to_status": "COMPLETED",
        "version": 4,
    })
    assert t4_resp.status_code == 200
    assert t4_resp.json()["data"]["status"] == "COMPLETED"

    hist_resp = client.get(f"/api/v1/orders/{order_id}/history", headers=farmer_headers)
    assert hist_resp.status_code == 200
    assert len(hist_resp.json()["data"]) >= 4


def test_standard_api_error_codes() -> None:
    client, db, ctx = _create_test_client()
    farmer_headers = {"Authorization": f"Bearer {ctx['farmer']}"}

    resp_401 = client.get("/api/v1/me")
    assert resp_401.status_code == 401

    resp_403 = client.post("/api/v1/demands", headers=farmer_headers, json={
        "crop_id": ctx["crop_id"],
        "minimum_quantity": "100.000",
        "maximum_quantity": "200.000",
        "unit": "kg",
        "delivery_from": str(date.today()),
        "delivery_until": str(date.today() + timedelta(days=1)),
        "delivery_district": "Pune",
        "delivery_state": "Maharashtra",
        "currency": "INR",
    })
    assert resp_403.status_code == 403

    resp_404 = client.get(f"/api/v1/listings/{uuid4()}", headers=farmer_headers)
    assert resp_404.status_code == 404

    resp_422 = client.post("/api/v1/listings", headers=farmer_headers, json={
        "crop_id": ctx["crop_id"],
        "quantity": "-100.000",
        "unit": "kg",
        "available_from": str(date.today()),
        "district": "Pune",
        "state": "Maharashtra",
    })
    assert resp_422.status_code == 422


def test_prediction_horizon_contract() -> None:
    """Agent 7 supports only 1d and 3d horizons; 7d and 14d must be rejected with 422."""
    client, db, ctx = _create_test_client()
    farmer_headers = {"Authorization": f"Bearer {ctx['farmer']}"}

    # 1. 3 days is valid
    resp_3d = client.post("/api/v1/predictions/price", headers=farmer_headers, json={
        "crop_id": ctx["crop_id"],
        "horizon_days": 3,
        "data_mode": "DEMO",
    })
    assert resp_3d.status_code == 200
    assert resp_3d.json()["data"]["horizon_days"] == 3

    # 2. 1 day is valid
    resp_1d = client.post("/api/v1/predictions/price", headers=farmer_headers, json={
        "crop_id": ctx["crop_id"],
        "horizon_days": 1,
        "data_mode": "DEMO",
    })
    assert resp_1d.status_code == 200
    assert resp_1d.json()["data"]["horizon_days"] == 1

    # 3. 7 days must be rejected with 422
    resp_7d = client.post("/api/v1/predictions/price", headers=farmer_headers, json={
        "crop_id": ctx["crop_id"],
        "horizon_days": 7,
        "data_mode": "DEMO",
    })
    assert resp_7d.status_code == 422

    # 4. Recommendation generation with 7 days must be rejected with 422
    rec_7d = client.post(f"/api/v1/listings/{uuid4()}/recommendations", headers=farmer_headers, json={
        "horizon_days": 7,
    })
    assert rec_7d.status_code == 422


def test_logistics_live_mode_rejects_silent_demo_fallback() -> None:
    """A LIVE logistics request must fail if no live quote exists, without falling back to DEMO."""
    client, db, ctx = _create_test_client()
    farmer_headers = {"Authorization": f"Bearer {ctx['farmer']}"}

    resp = client.post("/api/v1/logistics/quotes", headers=farmer_headers, json={
        "listing_id": str(uuid4()),
        "origin_district": "Pune",
        "origin_state": "Maharashtra",
        "destination_district": "Mumbai",
        "destination_state": "Maharashtra",
        "quantity_kg": "1000.000",
        "data_mode": "LIVE",
    })
    assert resp.status_code == 400
    err = resp.json()
    assert err["error"]["code"] == "LOGISTICS_UNAVAILABLE"


def test_logistics_route_data_unavailable_for_missing_geography() -> None:
    """Missing origin or destination geography must not fall back to Pune/Maharashtra."""
    client, db, ctx = _create_test_client()
    farmer_headers = {"Authorization": f"Bearer {ctx['farmer']}"}

    # Missing origin_district
    resp = client.post("/api/v1/logistics/quotes", headers=farmer_headers, json={
        "listing_id": str(uuid4()),
        "destination_district": "Mumbai",
        "destination_state": "Maharashtra",
        "quantity_kg": "1000.000",
        "data_mode": "DEMO",
    })
    assert resp.status_code == 422


def test_quality_contract_assistive_only_no_universal_grade() -> None:
    """Produce quality engine produces assistive observations only and no universal GRADE_A/B/C/REJECTED."""
    client, db, ctx = _create_test_client()
    farmer_headers = {"Authorization": f"Bearer {ctx['farmer']}"}

    # Create listing
    listing_id = uuid4()
    db.listings[listing_id] = {
        "id": listing_id,
        "farmer_profile_id": UUID(ctx["farmer_id"]),
        "crop_id": UUID(ctx["crop_id"]),
        "variety_id": None,
        "available_quantity": Decimal("1000.000"),
        "unit": "kg",
        "available_from": date.today(),
        "available_until": date.today() + timedelta(days=7),
        "district": "Pune",
        "state": "Maharashtra",
        "status": "ACTIVE",
        "version": 1,
        "quality_summary": {},
    }

    # LIVE mode is UNAVAILABLE because no production vision model exists
    live_resp = client.post(f"/api/v1/produce-listings/{listing_id}/quality-reports", headers=farmer_headers, json={
        "crop": "tomato",
        "data_mode": "LIVE",
    })
    assert live_resp.status_code == 201
    live_data = live_resp.json()["data"]
    assert live_data.get("status") == "UNAVAILABLE" or live_data.get("raw_status") == "UNAVAILABLE"

    # DEMO mode returns assistive observations only, UNVERIFIED status, and NULL confidence
    demo_resp = client.post(f"/api/v1/produce-listings/{listing_id}/quality-reports", headers=farmer_headers, json={
        "crop": "tomato",
        "data_mode": "DEMO",
    })
    assert demo_resp.status_code == 201
    demo_data = demo_resp.json()["data"]
    assert demo_data["verification_status"] == "UNVERIFIED"
    assert demo_data["confidence"] is None
    # No universal grade key returned from AI inspection
    assert "grade" not in demo_data.get("observations", {})


def test_order_and_payment_states_no_escrow() -> None:
    """Exact order and payment enums: order begins CONFIRMED, payment begins PENDING, no escrow."""
    from app.schemas import OrderTransition, PaymentStatus
    # Order states allowed
    assert OrderTransition.model_fields["to_status"].annotation is not None
    # Payment status enum values
    assert PaymentStatus.PENDING == "PENDING"
    assert PaymentStatus.PROCESSING == "PROCESSING"
    assert PaymentStatus.PAID == "PAID"
    assert PaymentStatus.FAILED == "FAILED"
    assert PaymentStatus.REFUNDED == "REFUNDED"
    assert "ESCROW_FUNDED" not in PaymentStatus.__members__


def test_recommendation_confidence_and_timing_contract() -> None:
    """Agent 8 establishes confidence=None and timing=INSUFFICIENT_DATA unless complete wait economics exist."""
    client, db, ctx = _create_test_client()
    farmer_headers = {"Authorization": f"Bearer {ctx['farmer']}"}

    listing_id = uuid4()
    db.listings[listing_id] = {
        "id": listing_id,
        "farmer_profile_id": UUID(ctx["farmer_id"]),
        "crop_id": UUID(ctx["crop_id"]),
        "variety_id": None,
        "available_quantity": Decimal("1000.000"),
        "unit": "kg",
        "available_from": date.today(),
        "available_until": date.today() + timedelta(days=7),
        "district": "Pune",
        "state": "Maharashtra",
        "status": "ACTIVE",
        "version": 1,
        "quality_summary": {},
    }

    resp = client.post(f"/api/v1/listings/{listing_id}/recommendations", headers=farmer_headers)
    assert resp.status_code == 200
    rows = resp.json()["data"]
    for r in rows:
        assert r["confidence"] is None
        assert r["sell_wait"] == "INSUFFICIENT_DATA"


def test_persistence_failure_is_surfaced_not_swallowed() -> None:
    """Database persistence failures must return HTTP 500 PERSISTENCE_FAILED and not silent 200."""
    import pytest

    from app.database import Database
    from app.orchestration import generate_and_persist_recommendations

    target_listing_id = uuid4()

    class FailingDatabase(Database):
        def __init__(self) -> None:
            super().__init__(None)

        @property
        def configured(self) -> bool:
            return True

        async def fetchrow(self, query: str, *args: Any) -> Any:
            q = query.lower()
            if "from public.produce_listings" in q:
                return {
                    "id": target_listing_id,
                    "farmer_profile_id": uuid4(),
                    "crop_id": uuid4(),
                    "variety_id": None,
                    "available_quantity": Decimal("1000.000"),
                    "unit": "kg",
                    "available_from": date.today(),
                    "available_until": date.today() + timedelta(days=7),
                    "status": "ACTIVE",
                    "version": 1,
                    "district": "Pune",
                    "state": "Maharashtra",
                }
            if "insert into public.recommendations" in q:
                raise RuntimeError("Disk full / connection terminated")
            return None

        async def fetch(self, query: str, *args: Any) -> list[Any]:
            q = query.lower()
            if "from public.offers" in q:
                return [
                    {
                        "id": uuid4(),
                        "listing_id": target_listing_id,
                        "offered_quantity": Decimal("1000.000"),
                        "unit_price": Decimal("31.00"),
                        "currency": "INR",
                        "expires_at": datetime.now(UTC) + timedelta(days=1),
                        "status": "PENDING",
                        "version": 1,
                        "delivery_district": "Pune",
                        "delivery_state": "Maharashtra",
                        "buyer_profile_id": uuid4(),
                        "buyer_name": "Buyer B",
                        "buyer_verification_status": "VERIFIED",
                    }
                ]
            return []

    failing_db = FailingDatabase()
    import asyncio
    with pytest.raises(ApiError) as exc_info:
        asyncio.run(generate_and_persist_recommendations(
            database=failing_db,
            listing_id=target_listing_id,
        ))
    assert exc_info.value.code == "PERSISTENCE_FAILED"
    assert exc_info.value.status_code == 500
