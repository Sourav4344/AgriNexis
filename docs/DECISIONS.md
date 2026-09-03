# Architecture decision log

Status for all entries: **Accepted for Phase 1**. Revisit with measured evidence and record superseding decisions rather than silently rewriting contracts.

## ADR-001 — Flutter for the farmer application

One mobile codebase supports an Android-first, multilingual, accessible experience with future offline tolerance. Native integrations remain available without maintaining separate platforms. The cost is a separate Dart type-generation/tooling path.

## ADR-002 — Next.js for buyer/FPO and admin dashboards

Next.js with TypeScript fits responsive, data-heavy web workflows and enables shared web UI/types. Buyer and admin remain separate apps because audiences, permissions, and release risks differ, while shared primitives can live in packages.

## ADR-003 — FastAPI for the backend

FastAPI provides typed Python contracts, OpenAPI generation, async I/O, and direct compatibility with the Python intelligence modules. The backend remains the transaction/authorization boundary; generated docs do not replace explicit domain contracts.

## ADR-004 — PostgreSQL and Supabase

PostgreSQL supplies constraints, transactions, decimal arithmetic, indexing, and RLS. Supabase provides managed PostgreSQL and Auth with prototype-friendly pricing. Client publishable keys are paired with least-privilege grants and RLS; privileged keys stay server-only.

## ADR-005 — Modular monolith, not microservices

A single deployment and transaction boundary reduce cost, operational burden, latency, and demo failure modes. Engines keep explicit typed seams so they can scale independently only when evidence justifies extraction.

## ADR-006 — Net Farmer Realization is the primary ranking metric

The farmer's actual earning is more useful than headline price. Rankings expose gross value and every cost component. Eligibility, uncertainty, and trust can filter or annotate unsafe/unreliable options, but they cannot obscure the NFR calculation.

## ADR-007 — Snapshot accepted transaction financials

Recommendation inputs and quotes change over time. Atomic immutable snapshots at acceptance make disputes, history, and audit reproducible. Later changes are adjustments, not edits to the original calculation.

## ADR-008 — Deterministic demo fallbacks

SIH evaluation cannot depend on third-party uptime. Versioned fixtures, stored routes, and precomputed transparent results preserve the story while unmistakably labelling demo data and never masquerading as a live government feed.

## ADR-009 — Server and RLS enforce authorization

Frontend role checks improve UX only. FastAPI validates role, ownership, party, and resource state, while PostgreSQL grants/RLS provide defense in depth. Authoritative role state is not user-editable metadata, and admin promotion is privileged and audited.

## ADR-010 — Structured explanations and localization keys

Engines return facts/codes rather than English prose. Clients render localized English, Hindi, or Bengali explanations and accessible alternatives while preserving consistent calculation meaning.

## ADR-011 — Advisory, bounded quality AI

Visual analysis may assist surface observations but cannot certify laboratory properties without physical measurements. Every result includes confidence, method, limitations, and manual-verification status to prevent unsafe claims.

## ADR-012 — Explicit data provenance and mode

Market, prediction, logistics, and recommendation results carry source, timestamps, freshness, and `LIVE`/`CACHED`/`DEMO`. This prevents a fallback from being mistaken for current official data.
