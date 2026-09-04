# AgriNexis transaction workflow foundation

This package contains framework-independent order, payment, idempotency, financial snapshot,
and event semantics. It deliberately owns no HTTP routes and no persistence implementation.
FastAPI can adapt the protocols in `transactions.ports` to the existing PostgreSQL functions.

## Contract alignment

- Order transitions mirror `internal.valid_order_transition`.
- Payment transitions mirror `internal.valid_payment_transition`.
- LIVE payment commands require verified provider evidence; DEMO and SANDBOX modes may use
  deterministic transitions.
- Financials use `Decimal`, PostgreSQL-compatible half-up scale normalization, frozen snapshot
  objects, and exact decimal-string serialization.
- Repository exceptions are mapped to a stable sanitized error.
- Typed events are emitted only after a repository transition succeeds.

## Persistence adapter notes

`internal.accept_offer` already provides persistent same-key replay and immutable order snapshots.
The current schema has no generic persisted command result for order transitions, so an Agent 4
adapter must either use the existing `internal.idempotency_records` contract in one transaction or
defer idempotency until that database contract is explicitly extended. Payment provider references
exist on payment rows, but provider verification/webhook replay remains an API adapter concern.
Order `version` exists and is suitable for compare-and-set adapters; payment concurrency uses the
expected current status accepted by `internal.transition_payment`.
