# Architecture

## Scope and principles

Phase 1 defines boundaries and contracts; it does not initialize frameworks or implement the product. AgriNexis is a modular monolith: one deployable FastAPI backend owns transactions and orchestration, while intelligence modules remain separately testable Python packages/process-local adapters. This minimizes prototype cost and distributed-system failure modes while preserving future extraction seams.

Core invariants:

- Optimize and explain **Net Farmer Realization**, not headline price.
- Keep recommendations live/derived; snapshot accepted transaction economics.
- Prefer deterministic rules and simple models over opaque complexity.
- Treat data provenance, observation time, freshness, and demo/live status as first-class.
- Enforce access in FastAPI and PostgreSQL RLS; client checks are presentation only.
- All farmer-facing copy uses localization keys for English, Hindi, and Bengali.

## Context and components

```text
Flutter farmer app       Next.js buyer/FPO       Next.js admin
          \                    |                    /
                       FastAPI /api/v1
          auth + profiles + listings + transaction workflow
                    orchestration + audit
       / market / prediction / matching / quality / logistics /
                 PostgreSQL + Supabase Auth/Storage
       external adapters: market feeds, OSM, FCM (fallback-aware)
```

The clients authenticate with Supabase Auth and present the access token to FastAPI. Sign-up, sign-in, password recovery, and token refresh use the maintained Supabase client flow; `/api/v1/auth/me` resolves the application profile after authentication. FastAPI validates issuer, audience, signature, expiry, and subject, resolves the authoritative profile/role, then applies resource authorization. Direct client database access, if used, is limited by explicit grants and RLS. Privileged database access is server-only.

## Module boundaries

### `services/api`

Owns HTTP contracts, validation, identity/authorization, profiles, listings, demands, offers, orders, payments, notifications, ratings, grievances, audit events, and transactional orchestration. It calls engines through typed interfaces and is the only component allowed to accept an offer and create an order snapshot.

### `services/market-engine`

Ingests provider records through adapters, records provenance/freshness, normalizes crop/variety/unit/market identifiers, serves history/comparisons, and marks fallback data. It does not forecast or rank buyers.

### `services/prediction-engine`

Builds versioned features, produces a price estimate/range, trend (`RISING`, `STABLE`, `FALLING`, `INSUFFICIENT_DATA`), horizon, confidence, and model/version metadata. Sell/Wait is advisory and includes drivers and uncertainty.

### `services/logistics-engine`

Returns versioned, itemized transport, storage, handling, and other-cost estimates with distance, assumptions, validity, source, and confidence. It must remain usable with deterministic distance slabs when maps are unavailable.

### `services/quality-engine`

Accepts metadata and validated imagery and returns observations, confidence, limitations, and verification status. Images can assist grading but cannot certify pesticide residue, chemical composition, moisture, internal defects, or laboratory-grade safety without appropriate measurements.

### `services/matching-engine`

Filters opportunities by crop, quantity, timing, geography, and quality requirements; combines market/buyer, prediction, logistics, and trust signals; calculates comparable NFR; returns ranked explanations. Trust/confidence may break close ties or flag risk, but financial amounts remain visible and are never silently altered by a score.

## Net Farmer Realization contract

All money values are decimal strings at API boundaries and `numeric(14,2)` in PostgreSQL. Quantities use decimal strings and normalized units.

```text
gross_selling_value = accepted_quantity_kg * accepted_unit_price_per_kg
total_applicable_cost = transportation_cost + storage_cost
                      + handling_cost + other_applicable_cost
net_farmer_realization = gross_selling_value - total_applicable_cost
```

A recommendation contains live/derived values, component sources, `calculated_at`, `valid_until`, confidence, and explanation. On offer acceptance, the API recalculates and atomically writes immutable order snapshot fields. Later quote changes create adjustments/audit records; clients cannot rewrite the snapshot.

## Main product flow

1. Farmer signs in and maintains an owned profile.
2. Farmer creates a produce listing with crop, variety, quantity, quality, availability, and location.
3. API gathers normalized market observations, forecast, demands, quality context, and logistics estimates.
4. Matching engine filters and ranks opportunities by NFR and explains Sell Now/Wait, best buyer, and best market.
5. Buyer/FPO creates a demand or offer; ownership and status rules are enforced.
6. Farmer accepts or rejects. Acceptance locks the offer, reserves quantity, snapshots financials, and creates an order atomically/idempotently.
7. Allowed actors advance delivery/payment states; every change is appended to history.
8. Eligible completed parties may rate; grievances are access-controlled and auditable.

## Reliability and observability

External sources are behind timeout/circuit-breaker/cache adapters. Responses expose `data_mode` (`LIVE`, `CACHED`, `DEMO`), provider, observed time, retrieved time, and freshness. Failure degrades one signal rather than the whole recommendation; low confidence is explicit. Structured logs include correlation ID, actor ID (pseudonymized where possible), action, resource, outcome, and adapter state without tokens or sensitive payloads.

## Deployment shape (future)

Start with three static/server-rendered clients as appropriate, one FastAPI deployment, one managed Supabase project, and optional scheduled ingestion worker using the same codebase. Engines run in-process initially. Extraction requires measured scaling or isolation need and a recorded decision.

## Localization and accessibility

Farmer UI message catalogs use stable keys, pluralization, locale-aware numbers/currency/dates, and layouts tested for longer Hindi/Bengali text. Backend returns codes and structured explanation facts, not preformatted English. Critical choices remain understandable with text, icons, and accessible labels.
