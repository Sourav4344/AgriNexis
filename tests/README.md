# Tests

Database verification scripts are under `tests/database/`. Apply all migrations,
provision the documented demo Auth UUIDs, enable and apply the guarded demo seed,
then run `001_constraints.sql`, `002_rls.sql`, and `003_acceptance.sql` using a
migration-capable local PostgreSQL/Supabase connection. All scripts use
transactions and roll back their test mutations.

Reserved for cross-module contract, integration, formula, concurrency, RLS/authorization abuse, fallback, accessibility, and deterministic demo tests.
