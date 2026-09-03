# AgriNexis multi-agent working agreement

## Shared rules

All agents work inside this repository and preserve the modular-monolith boundary. `docs/DATABASE.md`, `docs/API_CONTRACT.md`, `docs/SECURITY.md`, and types generated into `packages/shared/` are shared contracts. An agent proposing an incompatible contract change must update the relevant document, add an entry to `docs/DECISIONS.md`, notify affected owners, and include contract tests. Do not independently invent schemas, routes, roles, statuses, money fields, or authentication claims.

Money uses fixed-precision decimals and INR unless an explicit currency is stored. Accepted order financials are immutable snapshots. Roles are `FARMER`, `BUYER`, `FPO`, and `ADMIN`; users cannot self-assign roles. Demo data must be visibly labelled. Frontend checks never replace backend authorization and RLS.

Agents may read any directory. They should write primarily within their ownership area and avoid unrelated refactors. Cross-owned edits require coordination with that owner.

| Agent | Ownership | Responsibilities | Must not change independently |
|---|---|---|---|
| 0 Lead Architecture | `docs/`, root contracts | Architecture, decisions, cross-contract consistency | Feature implementations |
| 1 Farmer Flutter | `apps/farmer-app/` | Mobile farmer UX, localization, offline-tolerant presentation | Backend/schema contracts |
| 2 Buyer/FPO Web | `apps/buyer-web/` | Buyer and FPO dashboard | Admin app, API/schema contracts |
| 3 Admin Dashboard | `apps/admin-web/` | Admin operations and audit UX | Privilege rules or backend policy |
| 4 FastAPI Core | `services/api/` | `/api/v1`, JWT validation, orchestration, domain services | Database contract without Agent 5 review |
| 5 Database | `database/` | Migrations, constraints, indexes, RLS, seeds | API semantics without Agent 4 review |
| 6 Market Data | `services/market-engine/` | Ingestion adapters, normalization, price history | Prediction or matching rules |
| 7 Price Prediction | `services/prediction-engine/` | Features, forecasts, confidence, Sell/Wait signal | Transaction workflow |
| 8 Matching | `services/matching-engine/` | Eligibility, ranking, explanations, NFR-aware scoring | Source cost calculations |
| 9 Logistics & Storage | `services/logistics-engine/` | Distance, transport/storage/handling estimates | Final ranking or orders |
| 10 Produce Quality AI | `services/quality-engine/` | Visual assistance, confidence, verification states | Lab-grade or safety certification claims |
| 11 Transaction Workflow | `services/api/` transaction modules | Offers, state machine, delivery, payment, disputes | Auth/RLS or financial snapshot rules |
| 12 Full-Stack Integration | `tests/`, integration adapters | Client/API integration and contract tests | Redefining contracts to mask incompatibility |
| 13 QA & Security | `tests/`, security review docs | Test strategy, authorization/RLS abuse tests | Product scope changes |
| 14 UI/UX Polish | all `apps/` by coordination | Accessibility, consistency, responsive/localized polish | Business logic or API contracts |
| 15 Deployment / DevOps | future infra/config | CI/CD, environments, observability, secrets | Committing secrets or changing product logic |
| 16 SIH Demo Reliability | `database/seeds/`, demo adapters/tests | Deterministic scenario, fallback switches, rehearsal | Presenting fixtures as live data |

## Integration discipline

1. Database changes land as ordered migrations with rollback notes and RLS tests.
2. API changes update the OpenAPI contract and generated/shared types.
3. Engine inputs/outputs remain typed, deterministic for identical inputs, versioned when breaking.
4. Status vocabularies and NFR component names come from the shared contracts.
5. Agent 5 establishes the database contract before Agent 4 implements persistence-heavy endpoints.
