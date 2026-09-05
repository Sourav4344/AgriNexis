# AgriNexis Deployment & Environment Operations Guide

> **Smart India Hackathon 2026 — Problem Statement 26132**
> **Target Authority**: Government of Maharashtra
> **Architecture**: Modular Monolith with Process-Local Intelligence Engines

---

## 1. System Prerequisites

| Component | Minimum Version | Recommended | Notes |
|---|---|---|---|
| **Python** | 3.12+ | 3.12.x / 3.14.x | Required for FastAPI backend and intelligence engines |
| **Node.js** | 20.x LTS | 20.x or 24.x | Required for Buyer Web (Next 14) and Admin Web (Next 15) |
| **npm** | 10.x+ | 10.x / 11.x | Package manager with lockfile reproducibility |
| **PostgreSQL** | 15+ | 16.x (Alpine) | Required for production & persistent development |
| **Docker** | 24+ | Latest Engine | Optional for bare-metal demo, required for container stack |
| **Docker Compose** | v2.20+ | v2.30+ | Multi-service orchestration |
| **Flutter SDK** | 3.24+ | 3.24+ | Optional: Mobile Farmer App (can run separately) |

---

## 2. Environment Configuration & Trust Boundaries

AgriNexis enforces strict trust boundaries between client-facing environments and trusted server boundaries:

- **Untrusted Tier**: Flutter Mobile App, Web Browsers (Buyer Web, Admin Web).
- **Trusted Tier**: FastAPI Core, PostgreSQL, Background Tasks.

### Environment Variable Matrix

| Variable | Scope | Description | Default / Example |
|---|---|---|---|
| `APP_ENV` | Server | Runtime profile (`development`, `test`, `demo`, `production`) | `development` |
| `LOG_LEVEL` | Server | Logging threshold (`DEBUG`, `INFO`, `WARNING`, `ERROR`) | `INFO` |
| `DEMO_MODE` | Server | Explicit demo mode toggle. Prevents live/demo ambiguity. | `false` (safe default), `true` (demo) |
| `API_BASE_URL` | Server/Client | Canonical API URL prefix | `http://localhost:8000/api/v1` |
| `API_ALLOWED_ORIGINS` | Server | CORS allowlist (comma-separated, ports 3000, 3001, 3002) | `http://localhost:3000,http://localhost:3001,http://localhost:3002` |
| `DATABASE_URL` | Server Only | PostgreSQL connection URI (never use hardcoded `postgres:postgres`) | `postgresql://postgres:${POSTGRES_PASSWORD}@localhost:5432/agrinexis` |
| `SUPABASE_URL` | Client & Server | Project reference base URL | `https://your-project.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | Client & Server | Client-safe anonymous API key | `your_publishable_anon_key` |
| `SUPABASE_SECRET_KEY` | Server Only | Privileged administrative key. **Never expose to web/app.** | `your_server_secret_key` |
| `NEXT_PUBLIC_API_URL` | Buyer Web | Public API endpoint for buyer dashboard | `http://localhost:8000/api/v1` |
| `NEXT_PUBLIC_DEMO_MODE` | Buyer Web | Explicit demo banner and fixture mode for Buyer Web | `false` (prod), `true` (demo) |
| `NEXT_PUBLIC_ADMIN_API_URL` | Admin Web | Public API endpoint for admin dashboard | `http://localhost:8000/api/v1` |
| `NEXT_PUBLIC_ADMIN_DEMO_MODE` | Admin Web | Explicit demo banner and fixture mode for Admin Web | `false` (prod), `true` (demo) |
| `MARKET_DATA_PROVIDER` | Server | Ingestion provider (`demo` for SIH presentation, `live` for mandi feeds) | `demo` |
| `MARKET_DEMO_FALLBACK_ENABLED` | Server | Explicit fallback permission when upstream feeds fail | `false` (safe default), `true` (demo) |
| `STORAGE_BUCKET` | Server | Private Supabase bucket for produce quality images | `produce-quality-images` |

> [!CAUTION]
> **Secret Leakage Prevention**: Never prefix `DATABASE_URL`, `SUPABASE_SECRET_KEY`, or `FCM_SERVER_CREDENTIALS_JSON` with `NEXT_PUBLIC_`. Frontend builds verify this invariant.

---

## 3. Local Startup Options

### Option A: SIH Demo Scripts (Fastest for Judges & Evaluators)

Pre-built PowerShell and Bash scripts automate dependency checking, demo environment flags, background launching, and health verification.

#### On Windows (PowerShell):
```powershell
# 1. Start all demo services (FastAPI on :8000, Buyer Web on :3001, Admin Web on :3002)
.\scripts\start-demo.ps1

# 2. Check health and endpoint readiness at any time
.\scripts\check-demo.ps1

# 3. Gracefully stop all demo services
.\scripts\stop-demo.ps1
```

#### On Linux / macOS (Bash):
```bash
# 1. Make executable and start
chmod +x scripts/*.sh
./scripts/start-demo.sh

# 2. Check health and endpoint readiness
./scripts/check-demo.sh

# 3. Stop services
./scripts/stop-demo.sh
```

### Option B: Docker Compose (Full Containerized Stack)

Starts PostgreSQL 16, FastAPI backend, Buyer Web, and Admin Web with isolated bridge networking and persistent volumes:

```bash
# Start all containers in the background
docker compose up -d

# Verify container health
docker compose ps

# View unified logs
docker compose logs -f api

# Teardown stack
docker compose down
```

### Option C: Manual Development Startup

#### Terminal 1 — FastAPI Backend:
```powershell
# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Set multi-service PYTHONPATH
$services = @("services/api", "services/market-engine", "services/matching-engine", "services/prediction-engine", "services/logistics-engine", "services/quality-engine", "services/transactions")
$env:PYTHONPATH = $services -join ";"
$env:DEMO_MODE = "true"

# Start uvicorn
cd services/api
uvicorn app.main:create_app --factory --host 127.0.0.1 --port 8000 --reload
```

#### Terminal 2 — Buyer & FPO Dashboard:
```bash
cd apps/buyer-web
npm ci
npm run dev
# Accessible at http://localhost:3001
```

#### Terminal 3 — Admin Operations Dashboard:
```bash
cd apps/admin-web
npm ci
npm run dev
# Accessible at http://localhost:3002
```

---

## 4. Database Bootstrap & Reset Procedure

AgriNexis maintains 19 ordered PostgreSQL migrations in `database/migrations/`:

```text
001_extensions_schemas.sql          # PostGIS, uuid-ossp, schemas
002_types.sql                       # Roles, statuses, units, currencies
003_identity_fpo.sql                # Profiles, farmer/buyer profiles, FPOs
004_reference_market.sql            # Crops, varieties, mandis, prices
005_listings_quality.sql            # Produce listings, quality reports
006_demands_offers.sql              # Buyer demands, offers
007_recommendations_logistics.sql   # NFR recommendations, logistics quotes
008_orders_adjustments.sql          # Orders, financial snapshots, adjustments
009_payments_ratings.sql            # Direct payments (PENDING/PROCESSING/PAID/FAILED/REFUNDED; no escrow), ratings
010_notifications_grievances.sql    # Notifications, grievances
011_audit_idempotency.sql           # Append-only audit log, idempotency keys
012_functions_triggers.sql          # Timestamp triggers, inventory guards
013_indexes.sql                     # Performance & composite query indexes
014_rls_grants.sql                  # Row-Level Security policies & role grants
015_accept_offer_function.sql       # Atomic offer acceptance transaction
016_acceptance_contract_hardening.sql # Strict currency & NFR validation
017_payment_transition_hardening.sql  # Payment state machine guarantees
018_demo_reset.sql                  # Safe demo dataset isolation & reset
019_market_identity_hardening.sql   # Provider external ID unique index
```

### Applying Migrations:
```bash
# Apply in numerical order via psql
for file in database/migrations/*.sql; do
    psql "$DATABASE_URL" -f "$file"
done
```

### Loading Canonical SIH Demo Seed:
```bash
# Seed 001 requires explicit session flag
psql "$DATABASE_URL" -c "SET app.demo_seed_enabled = 'on';" -f database/seeds/001_sih_demo.sql
```

### Resetting Demo Dataset for Re-Judgement:
```bash
psql "$DATABASE_URL" \
    -c "SET app.demo_seed_enabled = 'on';" \
    -c "SET app.demo_reset_enabled = 'on';" \
    -f database/seeds/002_sih_demo_reset.sql
```

---

## 5. Testing & Verification Guide

### Backend Python Suite (All 7 Services + Integration Flows):
```powershell
$services = @("services/api", "services/market-engine", "services/matching-engine", "services/prediction-engine", "services/logistics-engine", "services/quality-engine", "services/transactions")
$env:PYTHONPATH = $services -join ";"

# Bytecode check
python -m compileall services

# Linting
ruff check services/api
ruff check services/market-engine --select E,F,I,B,UP --ignore B008,E501,I001
ruff check services/matching-engine
ruff check services/prediction-engine --ignore E501
ruff check services/logistics-engine
ruff check services/quality-engine
ruff check services/transactions

# Type checking with Mypy
mypy --ignore-missing-imports --no-warn-unused-ignores `
  services/api/app `
  services/market-engine/market_engine `
  services/matching-engine/matching_engine `
  services/prediction-engine/prediction_engine `
  services/logistics-engine/logistics_engine `
  services/quality-engine/quality_engine `
  services/transactions/transactions

# Test execution (260 passing unit & contract tests)
foreach ($s in $services) { pytest -c "$s/pyproject.toml" "$s/tests" }
pytest tests/test_sih_integration_flow.py tests/test_qa_security_hardening.py
```

### Buyer Web Suite:
```bash
cd apps/buyer-web
npm test          # 13 contract tests
npm run lint      # ESLint validation
npm run build     # Optimized Next.js 14 production bundle
```

### Admin Web Suite:
```bash
cd apps/admin-web
npm test          # 28 vitest tests
npm run typecheck # tsc --noEmit
npm run lint      # ESLint validation
npm run build     # Optimized Next.js 15 production bundle
```

---

## 6. Known Production Blockers & Honest Status Disclosure

The following items are documented architectural invariants and external dependencies required for live production deployment. **They do not impede the SIH Hackathon Demo**, which runs deterministically in `DEMO_MODE=true`:

1. **Acceptance Invariant**: `internal.accept_offer` currently lacks an explicit SQL assertion checking `offered_quantity >= demand.minimum_quantity`. A future database migration must enforce this at the database constraint layer.
2. **Live Database Runtime Verification**: Production deployment requires end-to-end verification against a live Supabase PostgreSQL instance with active RLS roles (`anon`, `authenticated`, `service_role`).
3. **Live Market Ingestion Provider**: Real-time government mandi API adapters (AGMARKNET) are not integrated in the current runtime; live operation requires official credential provisioning and scheduled ingestion workers.
4. **Logistics & Routing Provider**: No active OSRM, OSM, or Haversine live routing provider is approved or integrated. Current SIH demo logistics uses deterministic configured lane tariffs (`services/logistics-engine`). Any missing/unconfigured live provider evidence returns HTTP 503 / UNAVAILABLE. Production live routing requires approved commercial routing adapters.
5. **Produce Quality AI Boundaries**: Produce quality assessment is strictly `ASSISTIVE_VISUAL_ASSESSMENT_ONLY`. The engine does not implement a universal Grade A/B/C/REJECTED classifier or fabricated combined confidence. A production computer vision inference pipeline is currently unavailable; requests in non-DEMO mode return `UNAVAILABLE` (`NO_CONFIGURED_VISUAL_MODEL`). Visual assessment cannot certify laboratory properties, chemical residues, moisture content, or internal defects.
6. **Payment Gateway**: No live external payment gateway (Razorpay/Cashfree) adapter is integrated. Financial transactions strictly follow the 5-state machine (`PENDING` -> `PROCESSING` -> `PAID` / `FAILED` / `REFUNDED`). There is NO escrow lifecycle or unapproved intermediary fund-holding mechanism.
7. **Ingress & Rate Limiting**: Production exposure requires a reverse proxy (e.g., Traefik / NGINX / Cloudflare) with rate limiting (`429 Too Many Requests`), DDoS protection, and TLS termination.
