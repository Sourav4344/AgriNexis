# AgriNexis

> **Not Just the Best Price. The Best Decision.**

AgriNexis is a proposed market-linkage, price-discovery, and transaction-enablement platform for farmers, FPOs, and agricultural buyers. It is the architecture foundation for Smart India Hackathon 2026 Problem Statement **26132**, “Strengthening market linkages and price discovery for farmers,” from the Government of Maharashtra.

## The problem

Price, demand, quality, logistics, storage, payment reliability, and buyer credibility are fragmented across channels. A high quoted price can still leave a farmer with a lower actual earning after costs. Smallholders also face pressure to sell soon after harvest, while buyers struggle to find consistent, verified supply.

## The AgriNexis decision

The platform is designed to answer: **Where, when, and to whom should a farmer sell produce to get the best actual return?**

Its primary ranking metric is **Net Farmer Realization (NFR)**:

```text
gross_selling_value
- transportation_cost
- storage_cost
- handling_cost
- other_applicable_cost
= net_farmer_realization
```

For example, a nearby buyer offering ₹31,000 with ₹2,250 costs yields ₹28,750, and should outrank a distant buyer offering ₹32,000 with ₹6,500 costs, which yields ₹25,500.

## Planned capabilities

- Current and historical market-price discovery
- Short-term price outlook and explainable Sell Now / Wait guidance
- Buyer and FPO demand discovery and matching
- Net-realization-aware opportunity ranking
- Quality-assistance reports with explicit limitations and human verification
- Transport, storage, and handling estimates
- Offers, orders, delivery, payment, ratings, and grievances
- English, Hindi, and Bengali farmer experiences

## Architecture

- Farmer app: Flutter and Dart
- Buyer/FPO and admin dashboards: Next.js and TypeScript
- Backend: Python and FastAPI
- Database and authentication: PostgreSQL, Supabase, and Supabase Auth
- Intelligence: Python, scikit-learn, and XGBoost where justified
- Maps: OpenStreetMap ecosystem and Leaflet for web
- Notifications: Firebase Cloud Messaging where appropriate
- Style: modular monolith with separately owned intelligence modules

```text
apps/       farmer, buyer/FPO, and admin clients
services/   API and intelligence-engine boundaries
database/   reviewed migrations and clearly labelled seeds
packages/   shared contracts and generated client types
tests/      cross-module contract, integration, and security tests
docs/       architecture and delivery contracts
```

See [Architecture](docs/ARCHITECTURE.md), [Database](docs/DATABASE.md), [API contract](docs/API_CONTRACT.md), [Security](docs/SECURITY.md), [Design system](docs/DESIGN_SYSTEM.md), [Demo](docs/DEMO.md), and [decisions](docs/DECISIONS.md).

## Development status

**Phase 1 — architecture foundation.** The repository currently contains contracts, ownership rules, and placeholders only. The applications, database schema, integrations, and ML models are not yet implemented or production-ready. Demo fixtures will always be labelled as demo data and never presented as live government data.
