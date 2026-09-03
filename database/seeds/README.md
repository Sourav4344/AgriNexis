# Seeds

`001_sih_demo.sql` is deterministic and idempotent. It refuses to execute unless
the session explicitly runs `SET app.demo_seed_enabled = 'on'`. Use it only in a
dedicated local/demo Supabase project.

Provision these Auth identities first through the Supabase Admin API or supported
local Auth seed mechanism:

| Identity | Auth UUID |
|---|---|
| Rahul | `10000000-0000-4000-8000-000000000001` |
| Buyer A | `10000000-0000-4000-8000-000000000002` |
| Buyer B | `10000000-0000-4000-8000-000000000003` |

No passwords or reusable credentials belong in this repository. The SQL seed does
not write to `auth.users`; it only verifies that those identities already exist.
Every externally sourced fixture is marked `DEMO`, uses dataset
`SIH-2026-TOMATO-V1`, and carries an explicit non-live label/provenance marker.
