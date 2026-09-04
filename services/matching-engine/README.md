# AgriNexis matching engine

AgriNexis ranks farmer realization, not headline gross price. This package is the pure
Agent 8 foundation: it validates actionable offers, consumes existing logistics quotes,
calculates transparent economics, and returns deterministic ranked explanations. It does
not expose HTTP routes, estimate logistics, forecast prices, analyze images, or accept orders.

## Economics and cost ownership

All calculations use `Decimal`; binary floats are rejected. Quantity follows
`numeric(14,3)` semantics. Money is rounded to two decimals using `ROUND_HALF_UP`.

```text
gross = round(quantity_kg * unit_price_per_kg, 2)
total_cost = transportation_cost + storage_cost + handling_cost + other_applicable_cost
NFR = gross - total_cost
NFR_per_kg = NFR / quantity_kg
```

The four costs and supplied total come only from a valid logistics quote. The engine verifies
that the total equals the itemized sum and never adds the total a second time. A missing,
expired, mismatched, invalid, or provenance-unknown quote makes the candidate unavailable;
zero-cost fallback is forbidden. Taxes, commissions, fees, and quality adjustments are not
invented.

## Eligibility and ranking

Only current `PENDING` offers are actionable. Hard filters cover listing availability,
crop/variety, demand state/window/remaining and minimum quantity, offer quantity/expiry,
buyer or FPO identity, counterparty state, currency, quote association, and conservative
quality compatibility. Exclusions return stable reason codes. Demand indicative prices are
not ranked as offers.

Full-lot options rank before partial-lot options. Within a coverage class, equal quantities
use absolute NFR then NFR/kg; differing quantities use NFR/kg then absolute NFR. Remaining
tie-breakers are lower total cost, distance only when all compared options have distance,
verified status, earlier offer validity, and stable candidate UUID. There is no weighted or
opaque score.

Verification uses only stored facts. Rejected or inactive counterparties are excluded.
Pending/unverified but active counterparties remain eligible with an explicit warning.
No trust, credit, KYC, or payment-reliability score is generated.

## Quality, prediction, and timing limitations

Quality matching compares only exact scalar keys supplied in the typed request. Mismatches
are excluded, and unresolved required keys are unavailable. Unknown semantics are never
guessed; this engine does not inspect images or make laboratory claims.

Agent 7 `PRICE_ONLY_ADVISORY` output is optional explanatory evidence. Prediction failure or
the two-row demo's `INSUFFICIENT_DATA` degrades the explanation but does not stop current NFR
ranking. Prediction never overrides the ranking.

Complete WAIT economics do not yet exist. Final timing is therefore always
`INSUFFICIENT_DATA` with `WAIT_ECONOMICS_UNAVAILABLE`, including for an explicitly declared
current-opportunity-only request. The ranked current winner remains available separately as
`best_offer_id`. The engine never maps prediction `WAIT` or `SELL_NOW` to its final timing
decision and never fabricates a WAIT candidate.

## Provenance and confidence

Material modes propagate conservatively in priority order `DEMO > CACHED > LIVE`. Unknown
critical quote provenance cannot become LIVE. Results preserve quote source, dataset,
version, checksum, calculation/validity timestamps, input IDs, and listing/offer versions.
Combined recommendation confidence is always `None`; component evidence remains separate.

## Integration boundaries

`Agent4MatchingEngineAdapter.recommend(request)` matches Agent 4's current `EngineRequest ->
EngineResult` protocol and validates `subject` strictly. The adapter is intentionally unwired:
Agent 4 does not yet implement recommendation-generation HTTP orchestration. Repository
protocols describe candidate reads and trusted recommendation persistence without providing
an RLS bypass or modifying shared code. Accepted orders remain exclusively owned by Agent 4
and the immutable database acceptance function.

Agent 9 is required to generate live itemized logistics quotes. This package only consumes
quotes. The deterministic demo already provides DEMO quotes and reproduces Buyer B at rank 1:
₹31,000 gross - ₹2,250 costs = ₹28,750 NFR, ahead of Buyer A's ₹32,000 gross - ₹6,500 costs
= ₹25,500 NFR.

## Checks

From this directory run:

```text
pytest
ruff format --check .
ruff check .
mypy matching_engine
python -m compileall matching_engine
```

Database integration tests require `MATCHING_INTEGRATION_DATABASE_URL` for a disposable,
migrated database. Trusted persistence and RLS integration remain skipped until Agent 4 owns
that wiring. Matching enforces demand minimum quantity now; the acceptance function still
needs later cross-owner enforcement and is not changed by this foundation.
