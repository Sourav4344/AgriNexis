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

To restore the acceptance-ready scenario on any presentation date, apply migration
018 and run:

```sql
SET app.demo_seed_enabled = 'on';
SET app.demo_reset_enabled = 'on';
\ir database/seeds/002_sih_demo_reset.sql
```

The reset targets only descendants of the two documented deterministic demo offer
UUIDs, restores Rahul's 1,000 kg inventory and canonical Buyer A/Buyer B economics,
and moves only demo validity windows relative to reset time. It never changes the
fixtures from `DEMO` to `LIVE`.
