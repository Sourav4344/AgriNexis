# AgriNexis logistics engine

This package produces deterministic, itemized logistics evidence for Agent 8. It does not
rank buyers, calculate NFR, persist quotes, or claim live carrier/warehouse data.

`LogisticsService` accepts a strict `QuoteRequest` and versioned configuration. Routes come
from an injected provider, an explicit reference distance, or a configured reference. Missing
route data fails and is never treated as zero. Money uses `Decimal`, `ROUND_HALF_UP`, and two
decimal places. Every configured component retains its provenance.

The canonical `demo_configuration()` contains two visibly DEMO lanes matching the SIH fixture:
Buyer A costs INR 6,500 and Buyer B costs INR 2,250. Quote results retain quantity and candidate
references, but the current database table cannot persist quoted quantity or direct buyer/FPO
identity; callers must not claim otherwise.

Run `pytest`, `ruff format --check .`, `ruff check .`, `mypy logistics_engine`, and
`python -m compileall logistics_engine` from this directory.
