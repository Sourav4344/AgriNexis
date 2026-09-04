# AgriNexis Core API

FastAPI is the application authorization, workflow, and transaction boundary for
AgriNexis. It validates Supabase tokens, resolves the authoritative active
PostgreSQL profile, and applies resource authorization before privileged calls.

## Requirements and run

Python 3.12 and a PostgreSQL/Supabase database with migrations 001–018 applied.
From `services/api`:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -e ".[dev]"
uvicorn app.main:app --reload
```

Copy `.env.example` to `.env`. Production requires `DATABASE_URL`, `SUPABASE_URL`,
`SUPABASE_JWT_ISSUER`, and `SUPABASE_JWKS_URL`. The audience defaults to
`authenticated`. `SUPABASE_SERVICE_ROLE_KEY` is server-only and is never returned
or logged.

`GET /health` is anonymous. `GET /ready` checks database and auth configuration
without leaking connection details. All application routes under `/api/v1`
require a valid Supabase bearer token and an authoritative `ACTIVE` profile.
JWT role/user metadata never grants privileges. FPO operations require an active
`fpo_operators` association; membership alone is insufficient.

Money and quantities are exact decimal strings. Offer acceptance requires
`Idempotency-Key`, expected versions, a quote, optional persisted recommendation
option, acknowledged economics, and currency. It calls the exact 12-argument
Phase 2B function and sanitizes AGRINEXIS domain errors. Payment transitions use
`internal.transition_payment` through an admin-authorized trusted boundary.

General listing responses never join `listing_private_locations`; precise
location has a separate party-authorized endpoint. Persisted `DEMO` market and
recommendation rows retain their mode and explicit non-live warning. No HTTP demo
reset route is exposed.

Engine algorithms are not implemented here. Typed engine ports live in
`app/engines.py`; the prediction route returns an explicit 503 until configured.
The logistics quote schema has no quoted quantity or direct buyer/FPO columns, so
standalone quote responses must not claim those associations were proven.

Run checks with `pytest`, `ruff check .`, and `mypy app`. Database integration
tests require a migrated disposable database and are separate from unit tests.
