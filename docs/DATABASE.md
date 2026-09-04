# Database contract

This document is a logical schema for Agent 5. It is not an applied migration. Use UUID primary keys (`gen_random_uuid()`), `timestamptz`, explicit foreign keys/checks, and `numeric` for money/quantity. Mutable tables include `created_at`, `updated_at`; event/history tables are append-only. Prefer `public` only for intentionally exposed objects and a non-exposed `internal` schema for privileged helpers/audit internals.

## Common conventions

- `auth.users.id` is referenced by `profiles.user_id` with lifecycle behavior chosen explicitly.
- Role enum: `FARMER`, `BUYER`, `FPO`, `ADMIN`. Role assignment is server/admin controlled, never sourced from user metadata.
- Money: `numeric(14,2)`, ISO `currency char(3)` default `INR`, values `>= 0` unless a documented adjustment permits negative.
- Quantity: `numeric(14,3)` plus canonical unit; matching normalizes to kilograms.
- Locations store coarse display geography separately from precise coordinates; precise data has stricter access.
- Enumerations may be lookup tables when admin extensibility matters; state-machine statuses should use constrained values.
- Soft deletion is preferred for referenced business records; immutable histories are never overwritten.
- Demo rows include `data_mode='DEMO'`, `dataset_id`, and visible provenance.

## Identity and organizations

| Table | Essential fields and constraints |
|---|---|
| `profiles` | `id`, unique `user_id -> auth.users`, `role`, `display_name`, `phone` (protected), `preferred_locale` in `en/hi/bn`, `status`, timestamps |
| `farmer_profiles` | PK/FK `profile_id`, address/geography, optional farm summary; owner-only private writes |
| `buyer_profiles` | PK/FK `profile_id`, organization/trade details, verification and reliability status controlled by server/admin |
| `fpos` | `id`, legal/display name, registration reference, contact/location, verification status |
| `fpo_members` | `id`, `fpo_id`, `farmer_profile_id`, membership role/status, unique active membership pair |
| `fpo_operators` | `id`, `fpo_id`, `profile_id` (profile role must be `FPO`), operator role/status, unique active operator pair |

An FPO operator is a profile with role `FPO` linked through `fpo_operators`; farmer membership never grants operator privileges.

## Catalog, supply, and quality

| Table | Essential fields and constraints |
|---|---|
| `crops` | `id`, unique canonical code, localized names, default unit, active flag |
| `crop_varieties` | `id`, `crop_id`, canonical/local names, unique per crop |
| `produce_listings` | `id`, `farmer_profile_id`, crop/variety, quantity/available quantity, unit, harvest/availability dates, coarse district/state/postal area, quality summary, status, version |
| `listing_private_locations` | PK/FK `listing_id`, precise coordinates and address; owner/order-party/admin RLS only |
| `quality_reports` | `id`, `listing_id`, method, structured observations, confidence, `verification_status`, verifier, limitations, model/version, timestamps |
| `quality_assets` | `id`, `quality_report_id`, private storage object reference, MIME, size, checksum, scan status; no public bucket URL |

Listing quantity and availability must be positive; available quantity cannot exceed original quantity. Concurrency uses a version or row lock during offer acceptance.

## Markets and prices

| Table | Essential fields and constraints |
|---|---|
| `mandis` | `id`, external/provider identifiers, name, geography, coordinates, active flag |
| `mandi_prices` | `id`, mandi/crop/variety, min/modal/max price, normalized unit/currency, `observed_at`, `retrieved_at`, source/provenance, `data_mode`, quality flags |
| `price_history` | Prefer a curated/materialized read model derived from immutable observations; if a table, retain source linkage and transformation version |

Deduplicate observations by provider + external record ID, or a documented natural-key hash. Index `(crop_id, variety_id, observed_at desc)`, `(mandi_id, observed_at desc)`, and common geography filters.

## Demand, offers, and recommendations

| Table | Essential fields and constraints |
|---|---|
| `buyer_demands` | `id`, exactly one of `buyer_profile_id` or `fpo_id`, crop/variety, quantity range, quality requirements, delivery window/location, indicative price, status |
| `offers` | `id`, `listing_id`, optional `demand_id`, exactly one of `buyer_profile_id` or `fpo_id`, offered quantity/unit price, delivery terms, expiry, status, idempotency key, version |
| `recommendations` | `id`, farmer/listing, exactly one candidate buyer/FPO/mandi, optional demand/quote, rank, gross and itemized estimated costs, estimated NFR, mode/confidence, explanation facts, engine/input metadata, calculated/expiry times; derived and not an accepted transaction |

Demand and offer ownership uses separate nullable buyer/FPO foreign keys with an exactly-one check. Do not replace this with an unconstrained polymorphic text pair.

## Logistics

| Table | Essential fields and constraints |
|---|---|
| `transport_providers` | `id`, identity/contact, service geography, vehicle/capacity metadata, verification/status |
| `warehouses` | `id`, owner/provider, location, capacity/unit, crop support, rate metadata, verification/status |
| `logistics_quotes` | `id`, listing/opportunity, provider optional, itemized decimal costs, distance, assumptions, source/mode/confidence, calculated/expiry times |

Quotes are expiring estimates. An accepted order copies applicable amounts into its snapshot rather than depending on the mutable quote.

## Transactions and trust

| Table | Essential fields and constraints |
|---|---|
| `orders` | `farmer_profile_id`, exactly one of `buyer_profile_id` or `fpo_id`, `listing_id`, unique `accepted_offer_id`, accepted quantity/unit price, immutable snapshot fields below, status/version, accepted timestamp |
| `order_status_history` | `id`, `order_id`, from/to status, actor, reason, timestamp; append-only |
| `payments` | `id`, order, amount/currency, provider reference, status, method, timestamps; provider callbacks idempotent |
| `ratings` | `id`, order, rater/ratee, score 1..5, comment, visibility/moderation, unique rater+order+dimension |
| `grievances` | `id`, order optional, complainant, category, description, status, assignee, resolution, timestamps |
| `notifications` | `id`, recipient, type, payload reference, channel, status, read/sent timestamps |
| `notification_devices` | authenticated profile owner, hashed device token, platform, enabled and last-seen timestamps |
| `audit_events` | append-only actor/action/resource/correlation/outcome and safe change metadata in non-exposed schema |
| `grievance_messages` | append-only grievance messages; internal notes hidden from parties |
| `order_financial_adjustments` | signed append-oriented adjustment requests with approval state; never rewrites the order snapshot |
| `idempotency_records` | non-exposed actor/service-scoped operation keys, request fingerprints, outcomes and expiry |

### Accepted order financial snapshot

Required immutable fields on `orders`:

- `snapshot_currency`
- `snapshot_quantity_kg`
- `snapshot_unit_price_per_kg`
- `snapshot_gross_selling_value`
- `snapshot_transportation_cost`
- `snapshot_storage_cost`
- `snapshot_handling_cost`
- `snapshot_other_applicable_cost`
- `snapshot_total_applicable_cost`
- `snapshot_net_farmer_realization`
- `snapshot_calculation_version`, `snapshot_calculated_at`, source quote/recommendation references

Checks enforce total cost equals component sum and NFR equals gross minus total, subject to one documented rounding rule. Snapshot fields cannot be client-updated. Legitimate post-acceptance differences are separate `order_financial_adjustments` records with reason, approval, and audit history; the original remains reproducible.

## State machines

- Listing: `DRAFT -> ACTIVE -> RESERVED -> SOLD`; `DRAFT/ACTIVE -> CANCELLED`; expiry from `ACTIVE`.
- Offer: `PENDING -> ACCEPTED|REJECTED|WITHDRAWN|EXPIRED`; acceptance is terminal and idempotent.
- Order: `CONFIRMED -> PICKUP_SCHEDULED -> IN_TRANSIT -> DELIVERED -> COMPLETED`, with controlled `CANCELLED` or `DISPUTED` branches.
- Payment: `PENDING -> PROCESSING|FAILED`; `PROCESSING -> PAID|FAILED`; `PAID -> REFUNDED`. Terminal failures require a new payment attempt.
- Grievance: `OPEN -> UNDER_REVIEW -> RESOLVED|CLOSED`; Phase 2A does not reopen a row.

## RLS and grants matrix

Every exposed table has RLS enabled and explicit grants. `anon` gets only intentionally public reference/aggregated reads. `authenticated` plus policies is not sufficient by itself: each policy checks ownership, party membership, or admin authorization. Updates include both `USING` and `WITH CHECK`, with a matching SELECT policy. Index ownership/party columns used by RLS.

- Farmers: own profile/listings; see offers/orders/recommendations to which they are a party.
- Buyers: own profile/demands/offers; see listings only at approved visibility and their transactions.
- FPO operators: access scoped to the represented FPO; members do not gain operator access.
- Admins: privileged backend workflows with audited authorization; no self-promotion.
- Service/secret key: server jobs only, never clients. Prefer user-scoped DB access where possible.

Use `auth.uid()` ownership checks or authoritative database associations. If JWT application metadata accelerates role checks, database state remains authoritative and stale-token behavior is handled. Never authorize from user-editable metadata. Views exposed to clients must be security-invoker or isolated/revoked. Privileged functions live outside exposed schemas, validate the actor, pin `search_path`, and have PUBLIC execution revoked.

## Index and integrity plan

Add indexes to all foreign keys and to active listing, demand, offer-expiry, order-party/status, payment-provider-reference, unread-notification, and grievance-status access paths. Use partial indexes for active/pending records after query validation. Agent 5 must test unique/idempotency constraints, RLS for every role and cross-tenant denial, state transitions, NFR checks, and concurrent offer acceptance.

## Phase 2A implementation clarifications

The ordered SQL migrations in `database/migrations/` are the executable Phase 2A
contract. The following choices close previously identified ambiguities:

- **Auth lifecycle:** `profiles.user_id` references `auth.users.id ON DELETE
  CASCADE`. Application identity/profile extensions therefore follow deletion of
  the Auth identity. Business and transaction records use restrictive foreign
  keys and preserve participant display-name snapshots and accepted economics;
  an Auth identity with referenced transactions must be deactivated/anonymized
  through a future controlled backend workflow rather than blindly deleted.
- **Account authority:** roles are `FARMER`, `BUYER`, `FPO`, and `ADMIN`, stored in
  `profiles`; account states are `ACTIVE`, `SUSPENDED`, and `DEACTIVATED`.
  Client grants exclude role/status mutation, and active database state is checked
  by RLS helpers. FPO membership and operator authority remain separate.
- **Listing lifecycle:** the exact vocabulary is `DRAFT`, `ACTIVE`, `RESERVED`,
  `SOLD`, `EXPIRED`, and `CANCELLED`.
- **Demand lifecycle:** `DRAFT` is unpublished, `ACTIVE` is discoverable,
  `PARTIALLY_FILLED` has remaining quantity, `FULFILLED` has no remaining demand,
  `EXPIRED` passed its window, and `CANCELLED` was owner/admin terminated.
- **Offer lifecycle:** the existing API vocabulary remains `PENDING`, `ACCEPTED`,
  `REJECTED`, `WITHDRAWN`, and `EXPIRED`. Acceptance is service-controlled;
  authenticated clients receive no direct offer update grant.
- **Order lifecycle:** to preserve the existing contract, orders begin at
  `CONFIRMED` after atomic acceptance and proceed through `PICKUP_SCHEDULED`,
  `IN_TRANSIT`, `DELIVERED`, and `COMPLETED`. Controlled `CANCELLED` and
  `DISPUTED` branches are permitted from documented intermediate states.
  `COMPLETED`, `CANCELLED`, and `DISPUTED` are terminal in Phase 2A. Every status
  change is validated by a trigger and appended to `order_status_history`.
- **Financial rounding:** persisted transaction money is `numeric(14,2)`.
  Components must be rounded to two decimal places by the application before
  persistence. Constraints operate on those stored decimal values; gross value is
  `round(snapshot_quantity_kg * snapshot_unit_price_per_kg, 2)`, total cost is the
  exact stored component sum, and NFR is gross minus total cost. No banker's-rounding
  behavior is assumed by constraints.
- **Accepted economics:** order snapshot identity and financial columns are
  trigger-protected from mutation. Adjustments are append-oriented signed amounts
  with `PENDING`, `APPROVED`, or `REJECTED` status and never rewrite the snapshot.
  Accepted offer and listing references use `RESTRICT`; expiring quote and
  recommendation references use `SET NULL` because the snapshot remains complete.
- **Location privacy:** discoverable listings store only coarse district/state/
  postal-area data. Address and coordinates live in `listing_private_locations`,
  whose RLS permits only the farmer owner, an accepted-order party, or admin.
- **Provenance:** detailed provenance is limited to external/derived records such
  as market observations/history, quality reports, logistics quotes, and
  recommendations. Transaction-owned rows do not carry artificial provenance.
- **Recommendations:** ranked candidate recommendations are persisted as expiring,
  derived snapshots with component costs, estimated NFR, structured explanation
  facts, confidence, mode, engine version, and reproducibility metadata. They are
  not authoritative transaction history.
- **Grievances:** Phase 2A states are `OPEN`, `UNDER_REVIEW`, `RESOLVED`, and
  `CLOSED`. There is no automatic reopen transition. Follow-up work creates a new
  grievance linked by `prior_grievance_id`; a future audited admin workflow may
  extend this behavior.
- **Demo Auth:** SQL fixtures never insert password hashes or write to Auth
  internals. The deterministic Auth UUIDs in `database/seeds/README.md` must be
  provisioned with the Supabase Admin API or a supported local Auth seed facility.
- **Schema exposure:** `public` is assumed to be available to the Supabase Data
  API, so every public application table enables and forces RLS and begins with
  explicit privilege revocation. `internal` is not to be exposed through the Data
  API and contains audit, idempotency, and privileged helpers with PUBLIC access
  revoked and fixed `search_path` where privilege is elevated.
- **Atomic acceptance:** `internal.accept_offer` is executable only by
  `service_role`. It validates the actor and versions, locks offer/listing/demand
  rows, checks expiry and acknowledged financials, consumes available quantity,
  updates demand fulfillment, creates exactly one order per accepted offer, stores
  the immutable snapshot, records history/audit data, and returns an existing
  result for a matching idempotent replay.

## Phase 2B integration contract

- API `recommendation_option_id` maps directly to `public.recommendations.id`.
  Each row is one ranked option; no separate recommendation-options table exists.
  The internal parameter remains `p_recommendation_id`.
- `internal.accept_offer` requires `p_ack_currency char(3)` in addition to the
  acknowledged gross, total cost, and NFR. Acknowledged, offer, quote, and supplied
  recommendation currencies must agree.
- A selected quote must match the listing and the offer's nullable demand context,
  remain unexpired, and use the offer currency. The current `logistics_quotes`
  schema does not store a quoted quantity or direct buyer/FPO columns, so quantity
  suitability cannot be proven from a standalone quote. When a recommendation is
  supplied, its exact quantity/economics and candidate association provide that
  additional binding. Agent 4 must create quotes in the correct transaction
  context and must not claim an independently stored quote-quantity validation.
- A supplied recommendation must match the listing farmer, buyer or FPO candidate,
  demand, compatible quote, currency, accepted quantity, unit price, gross value,
  itemized costs, and total cost, and must remain unexpired. A mandi candidate
  cannot be attached to a direct buyer/FPO offer acceptance.
- An offer-linked demand is locked before update and must exist, be `ACTIVE` or
  `PARTIALLY_FILLED`, be within its delivery window, match crop and optional
  variety, match the offer owner and currency, and have enough remaining maximum
  quantity. Exact exhaustion produces `FULFILLED`; otherwise it produces
  `PARTIALLY_FILLED`.
- Partial offer acceptance leaves a listing `ACTIVE` with reduced
  `available_quantity`; exact exhaustion sets `SOLD`. `RESERVED` remains available
  for a future explicit reservation workflow.
- Domain failures use SQLSTATE `P0001`, message `AGRINEXIS_DOMAIN_ERROR`, and a
  stable `PG_EXCEPTION_DETAIL` value of
  `AGRINEXIS_CODE=<CODE>;HTTP_STATUS=<STATUS>`. Agent 4 must parse only the code and
  map it to its sanitized API error response; raw database messages, detail, hint,
  and SQL text must never be returned to clients. Acceptance codes are:
  `ACTOR_MISMATCH`, `IDEMPOTENCY_CONFLICT`, `OFFER_NOT_PENDING`, `OFFER_EXPIRED`,
  `OFFER_VERSION_CONFLICT`, `LISTING_VERSION_CONFLICT`, `INSUFFICIENT_QUANTITY`,
  `QUOTE_INVALID`, `QUOTE_EXPIRED`, `RECOMMENDATION_INVALID`,
  `RECOMMENDATION_EXPIRED`, `DEMAND_INVALID`, `DEMAND_EXPIRED`,
  `DEMAND_QUANTITY_EXCEEDED`, `CURRENCY_MISMATCH`, and `FINANCIALS_CHANGED`.
  Actor failures map to 403, transactional conflicts to 409, and invalid/expired
  supplied references to 422 as encoded in the detail.
- `internal.transition_payment` is service-role-only, locks the payment, requires
  the expected current state, applies only the payment transitions above, sets
  `paid_at` on entry to `PAID`, and appends an audit event. A trigger also rejects
  invalid direct privileged updates. Ordinary authenticated roles retain no
  payment update grant.
- A successful same-key/same-fingerprint acceptance replay returns the original
  order ID. Same key/different fingerprint and in-progress duplicates return
  `IDEMPOTENCY_CONFLICT`. Failed transactions roll back their marker and may be
  retried under normal backend policy; Phase 2B does not persist/replay elaborate
  failed outcomes. The request fingerprint must be computed from the canonical
  complete acceptance request, including versions, quote/recommendation IDs,
  acknowledged amounts, and acknowledged currency.
- Phase 2 anonymous access is limited to backend `GET /health` and optional
  `GET /ready`. No public application table receives an anonymous database grant.
- The guarded `internal.reset_sih_demo()` resets only records tied to the two known
  deterministic demo offer UUIDs. It requires both `app.demo_seed_enabled=on` and
  `app.demo_reset_enabled=on`, deletes only their transaction descendants, restores
  canonical quantities/economics, and moves demo validity windows relative to the
  reset time without changing `data_mode='DEMO'`.
