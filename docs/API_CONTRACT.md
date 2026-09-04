# API contract

Base path: `/api/v1`. JSON uses `snake_case`, UTF-8, ISO 8601 UTC timestamps, UUID strings, decimal strings for money/quantity, and ISO currency codes. This is a design contract; no endpoints are implemented in Phase 1.

## Authentication and authorization

For Phase 2, only `GET /health` and optionally `GET /ready` are anonymous. Every other route requires `Authorization: Bearer <Supabase access token>`. References to a “public” profile/FPO view mean redacted visibility among authenticated callers, not anonymous access. FastAPI validates the token and loads the authoritative active profile. Role abbreviations below: F = Farmer, B = Buyer, O = FPO operator, A = Admin. “Party” means only a user/organization participating in that resource. Resource ownership is checked on every object route; knowing a UUID grants nothing.

## Response conventions

Success:

```json
{"data": {}, "meta": {"request_id": "uuid"}}
```

Collection:

```json
{"data": [], "meta": {"request_id": "uuid", "next_cursor": "opaque-or-null", "limit": 25}}
```

Error uses stable codes and never exposes stack traces:

```json
{"error": {"code": "VALIDATION_ERROR", "message": "Request validation failed", "details": [{"field": "quantity_kg", "reason": "must_be_positive"}], "request_id": "uuid"}}
```

Expected statuses include 400 malformed request, 401 missing/invalid token, 403 authenticated but forbidden, 404 absent or deliberately concealed resource, 409 state/version/idempotency conflict, 422 semantic validation, 429 rate limited, 502 upstream unavailable, and 503 temporarily unavailable. Adapter degradation that still yields a safe result returns 200 with explicit provenance/confidence warnings.

## Pagination, filtering, and concurrency

Collections use cursor pagination: `limit` default 25, maximum 100, and opaque `cursor`. Allowlisted filters use repeated/query values; dates use `from`/`to`. Sorting uses `sort=field` or `sort=-field` from an endpoint-specific allowlist; default is stable (`-created_at,-id`). Reject unknown filters/sorts. Mutable resources return `version`; updates require `If-Match` or request `version`. POST commands accept `Idempotency-Key` where duplicate effects are dangerous (offer acceptance, order transitions, payments).

## Route groups

| Group | Routes (major contract) | Access |
|---|---|---|
| Auth | `GET /auth/me`, `POST /auth/logout-all` | authenticated; logout-all affects self |
| Profile | `GET/PATCH /profile`, `GET /profiles/{id}/public` | self; public view redacted |
| Farmers | `GET /farmers/{id}`, `GET /farmers/{id}/listings` | self/authorized party/A |
| Buyers | `GET /buyers/{id}`, `GET /buyers/{id}/demands` | owner/public-redacted/A |
| FPOs | `GET /fpos`, `GET /fpos/{id}`, `GET/POST /fpos/{id}/members`, `DELETE /fpos/{id}/members/{membership_id}`, `GET/POST /fpos/{id}/operators`, `DELETE /fpos/{id}/operators/{operator_id}` | public-redacted; member self-read, operator-scoped writes, A manages operators |
| Crops | `GET /crops`, `GET /crops/{id}/varieties` | authenticated (optionally public later) |
| Produce | `POST/GET /produce-listings`, `GET/PATCH /produce-listings/{id}`, `POST /produce-listings/{id}/publish`, `POST /.../cancel` | F owner; eligible B/O read; A |
| Markets | `GET /markets`, `GET /markets/{id}/prices`, `GET /market-prices/history`, `GET /market-prices/compare` | authenticated; filters required |
| Predictions | `POST /predictions/price`, `GET /predictions/{id}` | F owner/authorized party/A |
| Recommendations | `POST /produce-listings/{id}/recommendations`, `GET /recommendations/{id}` | listing owner/A; controlled sharing |
| Buyer demands | `POST/GET /buyer-demands`, `GET/PATCH /buyer-demands/{id}`, `POST /.../close` | B/O owner; matching F read; A |
| Offers | `POST/GET /offers`, `GET /offers/{id}`, `POST /offers/{id}/accept|reject|withdraw` | parties/A; action-specific owner |
| Logistics | `POST /logistics/quotes`, `GET /logistics/quotes/{id}`, `GET /warehouses`, `GET /transport-providers` | authenticated; private details scoped |
| Quality | `POST /produce-listings/{id}/quality-reports`, `POST /quality-reports/{id}/upload-intent`, `GET /quality-reports/{id}` | F owner; relevant parties/A; verification server/A |
| Orders | `GET /orders`, `GET /orders/{id}`, `POST /orders/{id}/transitions`, `GET /orders/{id}/history` | parties/A; allowed transition roles |
| Payments | `GET /orders/{id}/payments`, `POST /orders/{id}/payments`, `POST /payments/webhooks/{provider}` | parties read; trusted server/provider writes |
| Notifications | `GET /notifications`, `POST /notifications/{id}/read`, `POST /notification-devices` | recipient only |
| Ratings | `POST /orders/{id}/ratings`, `GET /profiles/{id}/ratings` | completed-order party; public aggregate/redacted |
| Grievances | `POST/GET /grievances`, `GET /grievances/{id}`, `POST /grievances/{id}/messages`, `POST /.../resolve` | complainant/relevant party/A; resolution A |
| Admin | `GET /admin/*`, `POST /admin/verifications/{id}/decisions`, moderation/audit actions | A only; step-up controls for sensitive actions |

Static route segments must be registered before `{id}` routes where frameworks could confuse commands with identifiers.

## Representative requests

Create listing (`POST /produce-listings`, F):

```json
{"crop_id":"uuid","variety_id":"uuid","quantity":"1000.000","unit":"kg","harvest_date":"2026-09-01","available_from":"2026-09-03","location":{"district":"Pune","state":"Maharashtra","latitude":"18.5204","longitude":"73.8567"},"quality":{"declared_grade":"A"}}
```

Create offer (`POST /offers`, B/O):

```json
{"listing_id":"uuid","demand_id":"uuid","quantity_kg":"1000.000","unit_price_per_kg":"31.00","currency":"INR","delivery_terms":"buyer_pickup","expires_at":"2026-09-04T12:00:00Z"}
```

Generate recommendation (`POST /produce-listings/{id}/recommendations`, F):

```json
{"as_of":"2026-09-03T09:00:00Z","horizon_days":3,"include_storage_scenarios":true}
```

Recommendation response facts include `sell_wait`, expected price/range, ranked options, gross value, each cost component, total costs, NFR, buyer/market identity, trust/confidence, reasons, warnings, `data_mode`, provenance, `calculated_at`, and `valid_until`. Explanations are structured localization facts such as `LOWER_TRANSPORT_COST`, never English-only prose.

Accept offer (`POST /offers/{id}/accept`, F, idempotent):

```json
{"offer_version":3,"listing_version":5,"logistics_quote_id":"uuid","recommendation_option_id":"uuid","acknowledged_amounts":{"gross_selling_value":"31000.00","total_applicable_cost":"2250.00","net_farmer_realization":"28750.00","currency":"INR"}}
```

The server revalidates ownership, availability, offer expiry/status, quantity, current trusted cost inputs, and formulas. In one transaction it marks the offer accepted, prevents competing acceptance for reserved quantity, creates the order with immutable financial snapshot fields defined in `DATABASE.md`, and appends history. Client-supplied acknowledged amounts are comparison guards, not trusted values; mismatch returns `409 FINANCIALS_CHANGED` with a new reviewable quote.

`recommendation_option_id` maps to `public.recommendations.id`; each database row
is one ranked option. FastAPI passes it to the internal acceptance function as
`p_recommendation_id`. It must also pass the acknowledged currency as
`p_ack_currency`. The database binds supplied quotes, recommendations, and demands
to the offer as specified in `DATABASE.md` and returns stable domain diagnostics
using SQLSTATE `P0001`, message `AGRINEXIS_DOMAIN_ERROR`, and detail
`AGRINEXIS_CODE=<CODE>;HTTP_STATUS=<STATUS>`. FastAPI parses the code, emits the
corresponding sanitized 403/409/422 response, and never exposes raw SQL diagnostics.
Partial acceptance leaves remaining inventory `ACTIVE`; only exact exhaustion
sets the listing to `SOLD`.

The idempotency request fingerprint covers the complete canonical acceptance
payload, including acknowledged currency and all selected/version identifiers.

Order transition (`POST /orders/{id}/transitions`):

```json
{"to_status":"IN_TRANSIT","version":2,"occurred_at":"2026-09-04T08:30:00Z","note":"optional","proof_asset_id":"uuid"}
```

Allowed roles and predecessor states are enforced server-side. Payment status cannot be set through this general transition route.

## Validation rules

- IDs must be valid UUIDs; references must exist and be visible to the actor.
- Money/quantity arrive as decimal strings, are normalized server-side, and obey documented scale/range.
- Currency must agree across a calculation; Phase 1 default is INR.
- Coordinates, dates, chronology, offer expiry, quantity availability, MIME/size, and status transitions are validated.
- No mass assignment: request DTOs exclude role, verification, reliability, snapshot, payment-provider, audit, and ownership fields.
- Search input is length-limited; database operations are parameterized.
- Upload flow uses short-lived intents, private object paths, content sniffing/scanning, and ownership-bound object keys.

## Engine contracts

Engines are internal Python interfaces, not public microservices. Each input includes `request_id`, subject/listing, normalized units, `as_of`, and versioned configuration. Each result includes `engine_version`, `calculated_at`, source/mode, confidence, warnings, and deterministic explanation facts. Timeouts are bounded. Partial failure is represented explicitly; it never silently substitutes demo data into a live-labelled response.

## Versioning and change control

Breaking HTTP changes require a new major path or an agreed compatibility window. Additive fields are allowed; clients ignore unknown fields. OpenAPI is the executable source generated by Agent 4 but must remain semantically aligned with this document. Shared DTO/type generation belongs in `packages/shared/` and CI checks drift.
