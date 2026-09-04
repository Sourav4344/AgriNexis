# Tests

Database verification scripts are under `tests/database/`. Apply all migrations,
provision the documented demo Auth UUIDs, enable and apply the guarded demo seed,
then run `001_constraints.sql`, `002_rls.sql`, and `003_acceptance.sql` using a
migration-capable local PostgreSQL/Supabase connection. All scripts use
transactions and roll back their test mutations.

After migrations 016-018, also run `004_contract_hardening.sql`. It verifies
transaction binding, demand failures, acknowledged currency, partial/full listing
behavior, idempotent replay, payment transitions, and guarded demo reset behavior.

After migration 019, run `005_market_identity.sql` to verify provider-managed
mandi identity, null/manual identities, unchanged observation deduplication,
append-only market records, ingestion privileges, and the market read indexes.

Reserved for cross-module contract, integration, formula, concurrency, RLS/authorization abuse, fallback, accessibility, and deterministic demo tests.
