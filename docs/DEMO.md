# Deterministic SIH demo strategy

## Demonstration promise

The demo proves AgriNexis recommends the best actual return, not the highest quote. It remains usable when market, map, or internet services fail. Every fixture surface displays **DEMO DATA — NOT LIVE GOVERNMENT DATA** and carries `data_mode: DEMO` in machine-readable responses.

## Canonical scenario

- Farmer: Rahul (demo identity)
- Crop: Tomato
- Quantity: 1,000 kg
- Buyer A: unit price ₹32/kg; gross ₹32,000; transport ₹5,500; storage ₹500; handling ₹300; other ₹200; total costs ₹6,500; NFR ₹25,500
- Buyer B: unit price ₹31/kg; gross ₹31,000; transport ₹1,500; storage ₹300; handling ₹300; other ₹150; total costs ₹2,250; NFR ₹28,750
- Expected result: Buyer B ranks first because NFR is ₹3,250 higher despite a ₹1/kg lower price.

The explanation facts are deterministic: `LOWER_TOTAL_COST`, `HIGHER_NET_REALIZATION`, and `CLOSER_BUYER`. Trust or prediction signals may be shown, but fixtures keep them equal/neutral so the core conclusion cannot be confused.

## Scripted flow

1. Sign in as Rahul using a pre-provisioned local/demo account (credentials supplied out-of-band, never committed).
2. Open the labelled tomato listing and show price freshness/source.
3. Generate the fixed recommendation and show Sell Now/Wait, two opportunity cards, deductions, and NFR.
4. Expand “Why” and compare Buyer A with Buyer B.
5. Accept Buyer B; show the confirmation amounts.
6. Verify the order contains the same immutable snapshot and advance through a scripted delivery/payment state sequence.
7. Optionally submit a rating or grievance to demonstrate the closed loop.

## Fallback architecture

Adapters implement the same typed contract for `live`, `cached`, and `demo` providers. Demo mode is explicit configuration plus a visible banner; it is never silently activated inside a response labelled live. A demo dataset has an ID/version/checksum and frozen clock/as-of timestamp so sorting and predictions remain repeatable.

- Market API failure: use versioned local fixtures with provenance and fixed history.
- Map/routing failure: use stored route distances and deterministic distance-slab estimates.
- Prediction failure: use a precomputed, versioned demonstration result or transparent deterministic baseline labelled DEMO.
- Notification failure: keep in-app event history and show queued/failed state; do not block the order.
- Internet failure: clients retain the prepared read-only scenario; time-sensitive write replay requires explicit confirmation when connectivity returns.

## Guardrails and rehearsal

Seed scripts must be idempotent, confined to a dedicated demo environment, and refuse production unless an explicit protected override exists. No random values, current-time dependence, or third-party availability is needed for the canonical path. Automated tests assert both formulas, Buyer B rank 1, explanation codes, snapshot equality after acceptance, data labels, and adapter failure behavior. Before judging, rehearse online, throttled, and fully offline paths; keep a reset operation that restores only the named demo dataset.
