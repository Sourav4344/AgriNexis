from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal
from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Depends, Header, Query, Request, status

from .auth import current_principal, get_database, require_roles
from .database import Database
from .errors import ApiError
from .fingerprint import request_fingerprint
from .models import Principal, Role
from .pagination import decode_cursor, encode_cursor
from .responses import envelope
from .schemas import (
    DemandCreate,
    DemandPatch,
    ListingCreate,
    ListingPatch,
    OfferAccept,
    OfferCreate,
    OrderTransition,
    PaymentTransition,
    ProfilePatch,
)

router = APIRouter()


def _next_cursor(rows: list[dict[str, Any]], limit: int) -> str | None:
    if len(rows) <= limit:
        return None
    rows.pop()
    last = rows[-1]
    return encode_cursor(last["created_at"], last["id"])


def _if_match(value: str | None, body_version: int) -> int:
    if value is None:
        return body_version
    normalized = value.strip().strip('W/').strip('"')
    try:
        parsed = int(normalized)
    except ValueError as exc:
        raise ApiError("INVALID_IF_MATCH", "If-Match must contain a resource version", 400) from exc
    if parsed != body_version:
        raise ApiError("VERSION_MISMATCH", "If-Match and request version differ", 400)
    return parsed


async def _fpo_authorized(database: Database, principal: Principal, fpo_id: UUID) -> bool:
    if principal.role is Role.ADMIN:
        return True
    if principal.role is not Role.FPO:
        return False
    return bool(await database.fetchrow(
        "select 1 from public.fpo_operators where fpo_id=$1 and profile_id=$2 and status='ACTIVE'",
        fpo_id, principal.profile_id,
    ))


@router.get("/me", summary="Return the authoritative application profile")
@router.get("/auth/me", include_in_schema=False)
async def get_me(request: Request, principal: Principal = Depends(current_principal), database: Database = Depends(get_database)):
    row = await database.fetchrow(
        """select p.id,p.user_id,p.role,p.display_name,p.preferred_locale,p.status,p.created_at,p.updated_at,
                  f.farm_summary,f.district as farmer_district,f.state as farmer_state,f.postal_area,
                  b.organization_name,b.trade_reference,b.verification_status,b.reliability_status
           from public.profiles p left join public.farmer_profiles f on f.profile_id=p.id
           left join public.buyer_profiles b on b.profile_id=p.id where p.id=$1""", principal.profile_id,
    )
    return envelope(request, row)


@router.patch("/me", summary="Update safe fields on the current profile")
async def patch_me(body: ProfilePatch, request: Request, principal: Principal = Depends(current_principal), database: Database = Depends(get_database)):
    supplied = body.model_fields_set
    profile_fields = {key: getattr(body, key) for key in ("display_name", "phone", "preferred_locale") if key in supplied}
    if profile_fields:
        await database.fetchrow(
            """update public.profiles set display_name=coalesce($2,display_name),phone=coalesce($3,phone),
               preferred_locale=coalesce($4,preferred_locale) where id=$1
               returning id""", principal.profile_id, profile_fields.get("display_name"), profile_fields.get("phone"), profile_fields.get("preferred_locale"),
        )
    if principal.role is Role.FARMER and supplied & {"farm_summary", "district", "state", "postal_area"}:
        await database.fetchrow(
            """update public.farmer_profiles set farm_summary=coalesce($2,farm_summary),district=coalesce($3,district),
               state=coalesce($4,state),postal_area=coalesce($5,postal_area) where profile_id=$1 returning profile_id""",
            principal.profile_id, body.farm_summary, body.district, body.state, body.postal_area,
        )
    if principal.role is Role.BUYER and supplied & {"organization_name", "trade_reference"}:
        await database.fetchrow(
            """update public.buyer_profiles set organization_name=coalesce($2,organization_name),
               trade_reference=coalesce($3,trade_reference) where profile_id=$1 returning profile_id""",
            principal.profile_id, body.organization_name, body.trade_reference,
        )
    return await get_me(request, principal, database)


@router.get("/farmers/{profile_id}", summary="Get an authenticated redacted farmer profile")
async def get_farmer(profile_id: UUID, request: Request, _: Principal = Depends(current_principal), database: Database = Depends(get_database)):
    row = await database.fetchrow(
        """select p.id,p.display_name,p.preferred_locale,f.farm_summary,f.district,f.state
           from public.profiles p join public.farmer_profiles f on f.profile_id=p.id
           where p.id=$1 and p.status='ACTIVE'""", profile_id,
    )
    if not row:
        raise ApiError("NOT_FOUND", "Farmer profile not found", 404)
    return envelope(request, row)


@router.get("/buyers/{profile_id}", summary="Get an authenticated redacted buyer profile")
async def get_buyer(profile_id: UUID, request: Request, _: Principal = Depends(current_principal), database: Database = Depends(get_database)):
    row = await database.fetchrow(
        """select p.id,p.display_name,b.organization_name,b.verification_status,b.reliability_status
           from public.profiles p join public.buyer_profiles b on b.profile_id=p.id
           where p.id=$1 and p.status='ACTIVE'""", profile_id,
    )
    if not row:
        raise ApiError("NOT_FOUND", "Buyer profile not found", 404)
    return envelope(request, row)


@router.get("/fpos/{fpo_id}", summary="Get an authenticated redacted FPO profile")
async def get_fpo(fpo_id: UUID, request: Request, _: Principal = Depends(current_principal), database: Database = Depends(get_database)):
    row = await database.fetchrow(
        "select id,display_name,district,state,verification_status from public.fpos where id=$1", fpo_id
    )
    if not row:
        raise ApiError("NOT_FOUND", "FPO not found", 404)
    return envelope(request, row)


@router.get("/crops", summary="List active crops")
async def list_crops(request: Request, limit: Annotated[int, Query(ge=1, le=100)] = 25, cursor: str | None = None, _: Principal = Depends(current_principal), database: Database = Depends(get_database)):
    after = decode_cursor(cursor)
    rows = list(await database.fetch(
        """select id,canonical_code,name_en,name_hi,name_bn,default_unit,created_at from public.crops
           where active and ($1::timestamptz is null or (created_at,id)<($1,$2))
           order by created_at desc,id desc limit $3""",
        after.created_at if after else None, after.row_id if after else None, limit + 1,
    ))
    next_cursor = _next_cursor(rows, limit)
    return envelope(request, rows, next_cursor=next_cursor, limit=limit)


@router.get("/crops/{crop_id}", summary="Get a crop")
async def get_crop(crop_id: UUID, request: Request, _: Principal = Depends(current_principal), database: Database = Depends(get_database)):
    row = await database.fetchrow("select id,canonical_code,name_en,name_hi,name_bn,default_unit from public.crops where id=$1 and active", crop_id)
    if not row:
        raise ApiError("NOT_FOUND", "Crop not found", 404)
    return envelope(request, row)


@router.get("/crops/{crop_id}/varieties", summary="List active crop varieties")
async def list_varieties(crop_id: UUID, request: Request, _: Principal = Depends(current_principal), database: Database = Depends(get_database)):
    rows = await database.fetch(
        "select id,crop_id,canonical_name,name_en,name_hi,name_bn from public.crop_varieties where crop_id=$1 and active order by canonical_name,id", crop_id
    )
    return envelope(request, rows, next_cursor=None, limit=len(rows))


@router.post("/listings", status_code=status.HTTP_201_CREATED, summary="Create a farmer listing")
async def create_listing(body: ListingCreate, request: Request, principal: Principal = Depends(require_roles(Role.FARMER)), database: Database = Depends(get_database)):
    if body.available_until and body.available_until < body.available_from:
        raise ApiError("VALIDATION_ERROR", "Availability dates are invalid", 422)
    row = await database.fetchrow(
        """insert into public.produce_listings(farmer_profile_id,crop_id,variety_id,quantity,available_quantity,unit,
           harvest_date,available_from,available_until,district,state,postal_area,quality_summary,status)
           values($1,$2,$3,$4,$4,$5,$6,$7,$8,$9,$10,$11,$12,'DRAFT') returning *""",
        principal.profile_id, body.crop_id, body.variety_id, body.quantity, body.unit, body.harvest_date,
        body.available_from, body.available_until, body.district, body.state, body.postal_area, body.quality_summary,
    )
    return envelope(request, row)


@router.get("/listings", summary="List owned or discoverable listings")
async def list_listings(request: Request, limit: Annotated[int, Query(ge=1, le=100)] = 25, cursor: str | None = None, principal: Principal = Depends(current_principal), database: Database = Depends(get_database)):
    after = decode_cursor(cursor)
    rows = list(await database.fetch(
        """select l.id,l.farmer_profile_id,l.crop_id,l.variety_id,l.quantity,l.available_quantity,l.unit,
                  l.harvest_date,l.available_from,l.available_until,l.district,l.state,l.postal_area,
                  l.quality_summary,l.status,l.version,l.created_at,l.updated_at
           from public.produce_listings l
           where l.deleted_at is null and ($1::timestamptz is null or (l.created_at,l.id)<($1,$2)) and
             (l.farmer_profile_id=$3 or $4='ADMIN' or
              ($4 in ('BUYER','FPO') and l.status='ACTIVE' and l.available_quantity>0))
           order by l.created_at desc,l.id desc limit $5""",
        after.created_at if after else None, after.row_id if after else None,
        principal.profile_id, principal.role.value, limit + 1,
    ))
    next_cursor = _next_cursor(rows, limit)
    return envelope(request, rows, next_cursor=next_cursor, limit=limit)


async def _listing_row(database: Database, listing_id: UUID, principal: Principal) -> dict[str, Any]:
    row = await database.fetchrow(
        """select id,farmer_profile_id,crop_id,variety_id,quantity,available_quantity,unit,harvest_date,
                  available_from,available_until,district,state,postal_area,quality_summary,status,version,created_at,updated_at
           from public.produce_listings where id=$1 and deleted_at is null""", listing_id,
    )
    if not row:
        raise ApiError("NOT_FOUND", "Listing not found", 404)
    visible = row["farmer_profile_id"] == principal.profile_id or principal.role is Role.ADMIN or (
        principal.role in {Role.BUYER, Role.FPO} and row["status"] == "ACTIVE"
    )
    if not visible:
        raise ApiError("NOT_FOUND", "Listing not found", 404)
    return dict(row)


@router.get("/listings/{listing_id}", summary="Get a listing without private location data")
async def get_listing(listing_id: UUID, request: Request, principal: Principal = Depends(current_principal), database: Database = Depends(get_database)):
    return envelope(request, await _listing_row(database, listing_id, principal))


@router.patch("/listings/{listing_id}", summary="Update a draft farmer listing")
async def patch_listing(listing_id: UUID, body: ListingPatch, request: Request, if_match: Annotated[str | None, Header(alias="If-Match")] = None, principal: Principal = Depends(require_roles(Role.FARMER, Role.ADMIN)), database: Database = Depends(get_database)):
    version = _if_match(if_match, body.version)
    current = await _listing_row(database, listing_id, principal)
    if principal.role is not Role.ADMIN and current["farmer_profile_id"] != principal.profile_id:
        raise ApiError("NOT_FOUND", "Listing not found", 404)
    if current["status"] != "DRAFT":
        raise ApiError("LISTING_NOT_EDITABLE", "Only draft listings can be edited", 409)
    values = body.model_dump(exclude={"version"}, exclude_unset=True)
    allowed = ["crop_id", "variety_id", "quantity", "harvest_date", "available_from", "available_until", "district", "state", "postal_area", "quality_summary"]
    assignments, args = [], [listing_id, version]
    for name in allowed:
        if name in values:
            args.append(values[name])
            assignments.append(f"{name}=${len(args)}")
            if name == "quantity":
                assignments.append(f"available_quantity=${len(args)}")
    if not assignments:
        return envelope(request, current)
    row = await database.fetchrow(
        f"update public.produce_listings set {','.join(assignments)},version=version+1 where id=$1 and version=$2 returning *", *args
    )
    if not row:
        raise ApiError("LISTING_VERSION_CONFLICT", "The listing changed; refresh and try again", 409)
    return envelope(request, row)


async def _set_listing_status(listing_id: UUID, target: str, allowed: tuple[str, ...], request: Request, principal: Principal, database: Database):
    row = await database.fetchrow(
        """update public.produce_listings set status=$3,version=version+1 where id=$1 and
           (farmer_profile_id=$2 or $4='ADMIN') and status=any($5::listing_status[]) returning *""",
        listing_id, principal.profile_id, target, principal.role.value, list(allowed),
    )
    if not row:
        raise ApiError("LISTING_STATE_CONFLICT", "Listing cannot make this transition", 409)
    return envelope(request, row)


@router.post("/listings/{listing_id}/publish", summary="Publish a draft listing")
async def publish_listing(listing_id: UUID, request: Request, principal: Principal = Depends(require_roles(Role.FARMER, Role.ADMIN)), database: Database = Depends(get_database)):
    return await _set_listing_status(listing_id, "ACTIVE", ("DRAFT",), request, principal, database)


@router.post("/listings/{listing_id}/cancel", summary="Cancel a listing")
async def cancel_listing(listing_id: UUID, request: Request, principal: Principal = Depends(require_roles(Role.FARMER, Role.ADMIN)), database: Database = Depends(get_database)):
    return await _set_listing_status(listing_id, "CANCELLED", ("DRAFT", "ACTIVE"), request, principal, database)


@router.get("/listings/{listing_id}/private-location", summary="Get an explicitly authorized private listing location")
async def get_private_location(listing_id: UUID, request: Request, principal: Principal = Depends(current_principal), database: Database = Depends(get_database)):
    authorized = await database.fetchrow(
        """select 1 from public.produce_listings l where l.id=$1 and
           (l.farmer_profile_id=$2 or $3='ADMIN' or exists(select 1 from public.orders o where o.listing_id=l.id and
             (o.farmer_profile_id=$2 or o.buyer_profile_id=$2 or exists(select 1 from public.fpo_operators fo where fo.fpo_id=o.fpo_id and fo.profile_id=$2 and fo.status='ACTIVE'))))""",
        listing_id, principal.profile_id, principal.role.value,
    )
    if not authorized:
        raise ApiError("NOT_FOUND", "Private location not found", 404)
    row = await database.fetchrow("select listing_id,latitude,longitude,address_line from public.listing_private_locations where listing_id=$1", listing_id)
    if not row:
        raise ApiError("NOT_FOUND", "Private location not found", 404)
    return envelope(request, row)


@router.post("/demands", status_code=status.HTTP_201_CREATED, summary="Create a buyer or FPO demand")
async def create_demand(body: DemandCreate, request: Request, principal: Principal = Depends(require_roles(Role.BUYER, Role.FPO)), database: Database = Depends(get_database)):
    if body.delivery_until < body.delivery_from or body.maximum_quantity < body.minimum_quantity:
        raise ApiError("VALIDATION_ERROR", "Demand range or dates are invalid", 422)
    buyer_id: UUID | None = None
    fpo_id: UUID | None = None
    if principal.role is Role.BUYER:
        if body.fpo_id is not None:
            raise ApiError("FORBIDDEN", "Buyer demands cannot claim an FPO owner", 403)
        buyer_id = principal.profile_id
    else:
        if body.fpo_id is None or not await _fpo_authorized(database, principal, body.fpo_id):
            raise ApiError("FPO_OPERATOR_REQUIRED", "Active FPO operator authority is required", 403)
        fpo_id = body.fpo_id
    row = await database.fetchrow(
        """insert into public.buyer_demands(buyer_profile_id,fpo_id,crop_id,variety_id,minimum_quantity,
           maximum_quantity,unit,quality_requirements,delivery_from,delivery_until,delivery_district,
           delivery_state,indicative_price,currency,status)
           values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'DRAFT') returning *""",
        buyer_id, fpo_id, body.crop_id, body.variety_id, body.minimum_quantity, body.maximum_quantity,
        body.unit, body.quality_requirements, body.delivery_from, body.delivery_until,
        body.delivery_district, body.delivery_state, body.indicative_price, body.currency,
    )
    return envelope(request, row)


@router.get("/demands", summary="List owned or farmer-visible demands")
async def list_demands(request: Request, limit: Annotated[int, Query(ge=1, le=100)] = 25, principal: Principal = Depends(current_principal), database: Database = Depends(get_database)):
    rows = await database.fetch(
        """select d.* from public.buyer_demands d where d.deleted_at is null and
           (d.buyer_profile_id=$1 or $2='ADMIN' or ($2='FARMER' and d.status in ('ACTIVE','PARTIALLY_FILLED'))
             or ($2='FPO' and exists(select 1 from public.fpo_operators o where o.fpo_id=d.fpo_id and o.profile_id=$1 and o.status='ACTIVE')))
           order by d.created_at desc,d.id desc limit $3""", principal.profile_id, principal.role.value, limit,
    )
    return envelope(request, rows, next_cursor=None, limit=limit)


async def _owned_demand(database: Database, demand_id: UUID, principal: Principal) -> dict[str, Any]:
    row = await database.fetchrow("select * from public.buyer_demands where id=$1 and deleted_at is null", demand_id)
    if not row:
        raise ApiError("NOT_FOUND", "Demand not found", 404)
    own = row["buyer_profile_id"] == principal.profile_id or principal.role is Role.ADMIN
    own = own or (row["fpo_id"] is not None and await _fpo_authorized(database, principal, row["fpo_id"]))
    farmer_visible = principal.role is Role.FARMER and row["status"] in {"ACTIVE", "PARTIALLY_FILLED"}
    if not (own or farmer_visible):
        raise ApiError("NOT_FOUND", "Demand not found", 404)
    return dict(row)


@router.get("/demands/{demand_id}", summary="Get an authorized demand")
async def get_demand(demand_id: UUID, request: Request, principal: Principal = Depends(current_principal), database: Database = Depends(get_database)):
    return envelope(request, await _owned_demand(database, demand_id, principal))


@router.patch("/demands/{demand_id}", summary="Update a draft demand")
async def patch_demand(demand_id: UUID, body: DemandPatch, request: Request, if_match: Annotated[str | None, Header(alias="If-Match")] = None, principal: Principal = Depends(require_roles(Role.BUYER, Role.FPO, Role.ADMIN)), database: Database = Depends(get_database)):
    version = _if_match(if_match, body.version)
    current = await _owned_demand(database, demand_id, principal)
    if current["status"] != "DRAFT":
        raise ApiError("DEMAND_NOT_EDITABLE", "Only draft demands can be edited", 409)
    values = body.model_dump(exclude={"version"}, exclude_unset=True)
    assignments, args = [], [demand_id, version]
    for name, value in values.items():
        args.append(value)
        assignments.append(f"{name}=${len(args)}")
    if not assignments:
        return envelope(request, current)
    row = await database.fetchrow(f"update public.buyer_demands set {','.join(assignments)},version=version+1 where id=$1 and version=$2 returning *", *args)
    if not row:
        raise ApiError("DEMAND_VERSION_CONFLICT", "The demand changed; refresh and try again", 409)
    return envelope(request, row)


async def _set_demand_status(demand_id: UUID, target: str, allowed: tuple[str, ...], request: Request, principal: Principal, database: Database):
    await _owned_demand(database, demand_id, principal)
    row = await database.fetchrow("update public.buyer_demands set status=$2,version=version+1 where id=$1 and status=any($3::demand_status[]) returning *", demand_id, target, list(allowed))
    if not row:
        raise ApiError("DEMAND_STATE_CONFLICT", "Demand cannot make this transition", 409)
    return envelope(request, row)


@router.post("/demands/{demand_id}/publish", summary="Publish a draft demand")
async def publish_demand(demand_id: UUID, request: Request, principal: Principal = Depends(require_roles(Role.BUYER, Role.FPO, Role.ADMIN)), database: Database = Depends(get_database)):
    return await _set_demand_status(demand_id, "ACTIVE", ("DRAFT",), request, principal, database)


@router.post("/demands/{demand_id}/cancel", summary="Cancel a demand")
async def cancel_demand(demand_id: UUID, request: Request, principal: Principal = Depends(require_roles(Role.BUYER, Role.FPO, Role.ADMIN)), database: Database = Depends(get_database)):
    return await _set_demand_status(demand_id, "CANCELLED", ("DRAFT", "ACTIVE", "PARTIALLY_FILLED"), request, principal, database)


@router.post("/offers", status_code=status.HTTP_201_CREATED, summary="Create a buyer or FPO offer")
async def create_offer(body: OfferCreate, request: Request, idempotency_key: Annotated[str | None, Header(alias="Idempotency-Key")] = None, principal: Principal = Depends(require_roles(Role.BUYER, Role.FPO)), database: Database = Depends(get_database)):
    if body.expires_at <= datetime.now(UTC):
        raise ApiError("VALIDATION_ERROR", "Offer expiry must be in the future", 422)
    buyer_id: UUID | None = principal.profile_id if principal.role is Role.BUYER else None
    fpo_id = body.fpo_id if principal.role is Role.FPO else None
    if principal.role is Role.FPO and (fpo_id is None or not await _fpo_authorized(database, principal, fpo_id)):
        raise ApiError("FPO_OPERATOR_REQUIRED", "Active FPO operator authority is required", 403)
    row = await database.fetchrow(
        """insert into public.offers(listing_id,demand_id,buyer_profile_id,fpo_id,offered_quantity,unit,unit_price,
           currency,delivery_terms,expires_at,status,idempotency_key) values($1,$2,$3,$4,$5,'kg',$6,$7,$8,$9,'PENDING',$10)
           on conflict (coalesce(buyer_profile_id,'00000000-0000-0000-0000-000000000000'::uuid),
             coalesce(fpo_id,'00000000-0000-0000-0000-000000000000'::uuid),idempotency_key) where idempotency_key is not null
           do nothing returning *""",
        body.listing_id, body.demand_id, buyer_id, fpo_id, body.quantity_kg,
        body.unit_price_per_kg, body.currency, body.delivery_terms, body.expires_at, idempotency_key,
    )
    if not row:
        raise ApiError("IDEMPOTENCY_CONFLICT", "This idempotency key is already in use", 409)
    return envelope(request, row)


@router.get("/offers", summary="List offers visible to the current party")
async def list_offers(request: Request, limit: Annotated[int, Query(ge=1, le=100)] = 25, principal: Principal = Depends(current_principal), database: Database = Depends(get_database)):
    rows = await database.fetch(
        """select o.* from public.offers o join public.produce_listings l on l.id=o.listing_id where
           o.buyer_profile_id=$1 or l.farmer_profile_id=$1 or $2='ADMIN' or
           exists(select 1 from public.fpo_operators fo where fo.fpo_id=o.fpo_id and fo.profile_id=$1 and fo.status='ACTIVE')
           order by o.created_at desc,o.id desc limit $3""", principal.profile_id, principal.role.value, limit,
    )
    return envelope(request, rows, next_cursor=None, limit=limit)


async def _offer(database: Database, offer_id: UUID, principal: Principal) -> dict[str, Any]:
    row = await database.fetchrow("select o.*,l.farmer_profile_id from public.offers o join public.produce_listings l on l.id=o.listing_id where o.id=$1", offer_id)
    if not row:
        raise ApiError("NOT_FOUND", "Offer not found", 404)
    party = row["buyer_profile_id"] == principal.profile_id or row["farmer_profile_id"] == principal.profile_id or principal.role is Role.ADMIN
    party = party or (row["fpo_id"] is not None and await _fpo_authorized(database, principal, row["fpo_id"]))
    if not party:
        raise ApiError("NOT_FOUND", "Offer not found", 404)
    return dict(row)


@router.get("/offers/{offer_id}", summary="Get an offer visible to a transaction party")
async def get_offer(offer_id: UUID, request: Request, principal: Principal = Depends(current_principal), database: Database = Depends(get_database)):
    return envelope(request, await _offer(database, offer_id, principal))


async def _offer_command(offer_id: UUID, target: str, request: Request, principal: Principal, database: Database, farmer_action: bool):
    offer = await _offer(database, offer_id, principal)
    authorized = offer["farmer_profile_id"] == principal.profile_id if farmer_action else (
        offer["buyer_profile_id"] == principal.profile_id or (offer["fpo_id"] and await _fpo_authorized(database, principal, offer["fpo_id"]))
    )
    if principal.role is Role.ADMIN:
        authorized = True
    if not authorized:
        raise ApiError("FORBIDDEN", "You are not allowed to perform this action", 403)
    row = await database.fetchrow("update public.offers set status=$2,version=version+1 where id=$1 and status='PENDING' returning *", offer_id, target)
    if not row:
        raise ApiError("OFFER_NOT_PENDING", "The offer is no longer pending", 409)
    return envelope(request, row)


@router.post("/offers/{offer_id}/withdraw", summary="Withdraw a pending offer")
async def withdraw_offer(offer_id: UUID, request: Request, principal: Principal = Depends(current_principal), database: Database = Depends(get_database)):
    return await _offer_command(offer_id, "WITHDRAWN", request, principal, database, False)


@router.post("/offers/{offer_id}/reject", summary="Reject a pending offer")
async def reject_offer(offer_id: UUID, request: Request, principal: Principal = Depends(require_roles(Role.FARMER, Role.ADMIN)), database: Database = Depends(get_database)):
    return await _offer_command(offer_id, "REJECTED", request, principal, database, True)


@router.post("/offers/{offer_id}/accept", summary="Atomically accept an offer with acknowledged economics")
async def accept_offer(offer_id: UUID, body: OfferAccept, request: Request, idempotency_key: Annotated[str | None, Header(alias="Idempotency-Key", min_length=1, max_length=200)] = None, principal: Principal = Depends(require_roles(Role.FARMER)), database: Database = Depends(get_database)):
    if not idempotency_key or not idempotency_key.strip():
        raise ApiError("IDEMPOTENCY_KEY_REQUIRED", "Idempotency-Key is required", 400)
    semantic = {
        "actor": principal.profile_id, "offer": offer_id, "offer_version": body.offer_version,
        "listing_version": body.listing_version, "quote": body.logistics_quote_id,
        "recommendation_option": body.recommendation_option_id,
        "gross": body.acknowledged_amounts.gross_selling_value,
        "total_cost": body.acknowledged_amounts.total_applicable_cost,
        "nfr": body.acknowledged_amounts.net_farmer_realization,
        "currency": body.acknowledged_amounts.currency,
    }
    fingerprint = request_fingerprint(semantic)
    row = await database.call_row(
        """select internal.accept_offer($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) as order_id""",
        principal.profile_id, offer_id, body.offer_version, body.listing_version,
        body.logistics_quote_id, body.recommendation_option_id, idempotency_key.strip(), fingerprint,
        body.acknowledged_amounts.gross_selling_value, body.acknowledged_amounts.total_applicable_cost,
        body.acknowledged_amounts.net_farmer_realization, body.acknowledged_amounts.currency,
    )
    order = await database.fetchrow("select * from public.orders where id=$1", row["order_id"])
    return envelope(request, order or {"id": row["order_id"]})


@router.get("/listings/{listing_id}/recommendations", summary="List persisted recommendation options")
async def list_recommendations(listing_id: UUID, request: Request, principal: Principal = Depends(current_principal), database: Database = Depends(get_database)):
    listing = await database.fetchrow("select farmer_profile_id from public.produce_listings where id=$1", listing_id)
    if not listing or (listing["farmer_profile_id"] != principal.profile_id and principal.role is not Role.ADMIN):
        raise ApiError("NOT_FOUND", "Listing not found", 404)
    rows = list(await database.fetch(
        """select r.*,coalesce(bp.organization_name,p.display_name,f.display_name,m.name) as candidate_name,
                  q.distance_km,q.assumptions,q.source_version as logistics_source_version
           from public.recommendations r
           left join public.profiles p on p.id=r.candidate_buyer_profile_id
           left join public.buyer_profiles bp on bp.profile_id=r.candidate_buyer_profile_id
           left join public.fpos f on f.id=r.candidate_fpo_id left join public.mandis m on m.id=r.candidate_mandi_id
           left join public.logistics_quotes q on q.id=r.logistics_quote_id
           where r.listing_id=$1 order by r.rank,r.id""", listing_id,
    ))
    if rows:
        best = Decimal(rows[0]["estimated_net_farmer_realization"])
        for row in rows:
            row["difference_from_best"] = best - Decimal(row["estimated_net_farmer_realization"])
            if row["data_mode"] == "DEMO":
                row["data_warning"] = "DEMO DATA — NOT LIVE GOVERNMENT DATA"
    return envelope(request, rows, next_cursor=None, limit=len(rows))


@router.get("/recommendations/{recommendation_id}", summary="Get a persisted recommendation option")
async def get_recommendation(recommendation_id: UUID, request: Request, principal: Principal = Depends(current_principal), database: Database = Depends(get_database)):
    row = await database.fetchrow("select * from public.recommendations where id=$1", recommendation_id)
    if not row or (row["farmer_profile_id"] != principal.profile_id and principal.role is not Role.ADMIN):
        raise ApiError("NOT_FOUND", "Recommendation not found", 404)
    result = dict(row)
    if result["data_mode"] == "DEMO":
        result["data_warning"] = "DEMO DATA — NOT LIVE GOVERNMENT DATA"
    return envelope(request, result)


@router.get("/orders", summary="List orders for the current party")
async def list_orders(request: Request, limit: Annotated[int, Query(ge=1, le=100)] = 25, principal: Principal = Depends(current_principal), database: Database = Depends(get_database)):
    rows = await database.fetch(
        """select o.* from public.orders o where o.farmer_profile_id=$1 or o.buyer_profile_id=$1 or $2='ADMIN'
           or exists(select 1 from public.fpo_operators fo where fo.fpo_id=o.fpo_id and fo.profile_id=$1 and fo.status='ACTIVE')
           order by o.created_at desc,o.id desc limit $3""", principal.profile_id, principal.role.value, limit,
    )
    return envelope(request, rows, next_cursor=None, limit=limit)


async def _order(database: Database, order_id: UUID, principal: Principal) -> dict[str, Any]:
    row = await database.fetchrow("select * from public.orders where id=$1", order_id)
    if not row:
        raise ApiError("NOT_FOUND", "Order not found", 404)
    party = row["farmer_profile_id"] == principal.profile_id or row["buyer_profile_id"] == principal.profile_id or principal.role is Role.ADMIN
    party = party or (row["fpo_id"] is not None and await _fpo_authorized(database, principal, row["fpo_id"]))
    if not party:
        raise ApiError("NOT_FOUND", "Order not found", 404)
    return dict(row)


@router.get("/orders/{order_id}", summary="Get an order with its immutable accepted snapshot")
async def get_order(order_id: UUID, request: Request, principal: Principal = Depends(current_principal), database: Database = Depends(get_database)):
    return envelope(request, await _order(database, order_id, principal))


@router.get("/orders/{order_id}/history", summary="Get append-only order status history")
async def order_history(order_id: UUID, request: Request, principal: Principal = Depends(current_principal), database: Database = Depends(get_database)):
    await _order(database, order_id, principal)
    rows = await database.fetch("select * from public.order_status_history where order_id=$1 order by changed_at,id", order_id)
    return envelope(request, rows, next_cursor=None, limit=len(rows))


@router.post("/orders/{order_id}/transitions", summary="Apply an allowed order state transition")
async def transition_order(order_id: UUID, body: OrderTransition, request: Request, principal: Principal = Depends(current_principal), database: Database = Depends(get_database)):
    order = await _order(database, order_id, principal)
    if order["version"] != body.version:
        raise ApiError("ORDER_VERSION_CONFLICT", "The order changed; refresh and try again", 409)
    allowed_actor = principal.role is Role.ADMIN or order["farmer_profile_id"] == principal.profile_id or order["buyer_profile_id"] == principal.profile_id
    allowed_actor = allowed_actor or (order["fpo_id"] is not None and await _fpo_authorized(database, principal, order["fpo_id"]))
    if not allowed_actor:
        raise ApiError("FORBIDDEN", "You are not allowed to transition this order", 403)
    try:
        row = await database.fetchrow("update public.orders set status=$2 where id=$1 and version=$3 returning *", order_id, body.to_status, body.version)
    except Exception as exc:
        raise ApiError("ORDER_TRANSITION_INVALID", "Order transition is not allowed", 409) from exc
    if not row:
        raise ApiError("ORDER_VERSION_CONFLICT", "The order changed; refresh and try again", 409)
    return envelope(request, row)


@router.get("/orders/{order_id}/payments", summary="List payments for an order party")
async def list_payments(order_id: UUID, request: Request, principal: Principal = Depends(current_principal), database: Database = Depends(get_database)):
    await _order(database, order_id, principal)
    rows = await database.fetch("select * from public.payments where order_id=$1 order by created_at,id", order_id)
    return envelope(request, rows, next_cursor=None, limit=len(rows))


@router.post("/payments/{payment_id}/transitions", summary="Apply a trusted payment transition")
async def transition_payment(payment_id: UUID, body: PaymentTransition, request: Request, principal: Principal = Depends(require_roles(Role.ADMIN)), database: Database = Depends(get_database)):
    payment = await database.fetchrow("select id,mode from public.payments where id=$1", payment_id)
    if not payment:
        raise ApiError("PAYMENT_NOT_FOUND", "Payment not found", 422)
    if payment["mode"] == "LIVE":
        raise ApiError(
            "PAYMENT_PROVIDER_NOT_CONFIGURED",
            "Live payment transitions require a configured trusted provider",
            503,
        )
    row = await database.call_row(
        "select (internal.transition_payment($1,$2,$3,$4,$5)).*",
        principal.profile_id, payment_id, body.expected_status.value, body.new_status.value, body.reason,
    )
    return envelope(request, row)


@router.get("/markets", summary="List persisted markets")
async def list_markets(request: Request, limit: Annotated[int, Query(ge=1, le=100)] = 25, _: Principal = Depends(current_principal), database: Database = Depends(get_database)):
    rows = await database.fetch("select id,provider_name,external_id,name,district,state,active,created_at from public.mandis where active order by name,id limit $1", limit)
    return envelope(request, rows, next_cursor=None, limit=limit)


@router.get("/markets/{market_id}", summary="Get a persisted market")
async def get_market(market_id: UUID, request: Request, _: Principal = Depends(current_principal), database: Database = Depends(get_database)):
    row = await database.fetchrow("select id,provider_name,external_id,name,district,state,active from public.mandis where id=$1 and active", market_id)
    if not row:
        raise ApiError("NOT_FOUND", "Market not found", 404)
    return envelope(request, row)


@router.get("/markets/{market_id}/prices", summary="List persisted market observations")
async def market_prices(market_id: UUID, request: Request, limit: Annotated[int, Query(ge=1, le=100)] = 25, _: Principal = Depends(current_principal), database: Database = Depends(get_database)):
    rows = list(await database.fetch("select * from public.mandi_prices where mandi_id=$1 order by observed_at desc,id desc limit $2", market_id, limit))
    for row in rows:
        if row["data_mode"] == "DEMO":
            row["data_warning"] = "DEMO DATA — NOT LIVE GOVERNMENT DATA"
    return envelope(request, rows, next_cursor=None, limit=limit)


@router.get("/market-prices", summary="List persisted market observations")
async def list_market_prices(request: Request, crop_id: UUID | None = None, limit: Annotated[int, Query(ge=1, le=100)] = 25, _: Principal = Depends(current_principal), database: Database = Depends(get_database)):
    rows = list(await database.fetch("select * from public.mandi_prices where ($1::uuid is null or crop_id=$1) order by observed_at desc,id desc limit $2", crop_id, limit))
    for row in rows:
        if row["data_mode"] == "DEMO":
            row["data_warning"] = "DEMO DATA — NOT LIVE GOVERNMENT DATA"
    return envelope(request, rows, next_cursor=None, limit=limit)


@router.get("/listings/{listing_id}/prediction", summary="Request the configured price-prediction adapter")
async def listing_prediction(listing_id: UUID, _: Principal = Depends(current_principal)):
    raise ApiError("PREDICTION_ENGINE_NOT_CONFIGURED", "Prediction engine is not configured", 503)
