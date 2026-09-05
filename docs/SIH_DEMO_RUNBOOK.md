# AgriNexis — SIH 2026 Judge Demonstration Runbook

> **Smart India Hackathon 2026** | Problem Statement ID: **26132**  
> **Problem Statement:** Strengthening market linkages and price discovery for farmers  
> **Organization:** Government of Maharashtra (Maharashtra State Innovation Society / Department of Skills, Employment, Entrepreneurship & Innovation)  
> **Theme:** Agriculture, FoodTech & Rural Development  
> **Team / Project:** AgriNexis  
> **Tagline:** *"Not Just the Best Price. The Best Decision."*  
> **Target Demo Duration:** 5 to 7 Minutes  
> **Canonical Persona:** Farmer Rahul Patil (1,000 kg Tomato)  

---

## 1. Pre-Demo Checklist

### T-15 Minutes: Environment Preparation
- [ ] **Display Setup:** Connect laptop to presentation display. Disable OS sleep and notifications.
- [ ] **Browser Tabs:**
  - Tab 1: `http://localhost:3000/demo` (Admin Web — Judge Demo Hub).
  - Tab 2: `http://localhost:3001` (Buyer Web — Buyer Dashboard).
- [ ] **Terminal Ready:**
  - Services API running on `http://localhost:8000`.
  - Terminal tab open with reset command prepared:
    ```powershell
    psql "$DATABASE_URL" -c "SET app.demo_seed_enabled = 'on';" -c "SET app.demo_reset_enabled = 'on';" -f database/seeds/002_sih_demo_reset.sql
    ```

### T-5 Minutes: Data Verification
- [ ] Verify Canonical Fixture Invariants:
  - Buyer A: Unit ₹32.00/kg | Gross ₹32,000 | Total Deductions ₹6,500 | Net Realization ₹25,500
  - Buyer B: Unit ₹31.00/kg | Gross ₹31,000 | Total Deductions ₹2,250 | Net Realization ₹28,750
  - Net Delta: **+₹3,250 net farmer income** in favor of Buyer B despite ₹1/kg lower headline price.
  - Timing Decision: `INSUFFICIENT_DATA` (Reason: `WAIT_ECONOMICS_UNAVAILABLE`, Confidence: `null`).
  - Canonical Demo Target State: Order = `CONFIRMED`, Payment = `PENDING`.
- [ ] Inspect visual demo indicators: Ensure banner `DEMO DATA — NOT LIVE GOVERNMENT DATA` is clearly visible.

---

## 2. 5–7 Minute Talk Track (Minute-by-Minute)

```
+----------------------------------------------------------------------------------------------------+
| 0:00 - 1:00 | HOOK & THESIS: The Headline Price Trap & The Net Realization Principle               |
| 1:00 - 2:30 | PROBLEM & CANONICAL SCENARIO: Rahul Patil (1,000 kg Tomato) & Two Competing Bids     |
| 2:30 - 4:30 | LIVE DEMO & NFR REVEAL: Side-by-Side Breakdown (+₹3,250 Net Farmer Gain)             |
| 4:30 - 5:30 | CONTRACT CONFIRMATION: Immutable Financial Snapshot (Order = CONFIRMED, Payment = PENDING) |
| 5:30 - 7:00 | ARCHITECTURE & GOVERNANCE: Separation of Engines, Database Security & Truthful AI     |
+----------------------------------------------------------------------------------------------------+
```

### [0:00 – 1:00] Hook & Thesis: The Headline Price Trap
* **Speaker 1:**  
  "Respected judges, today most price discovery platforms show farmers only the highest headline price quote.  
  A tomato farmer sees ₹32/kg from one buyer and ₹31/kg from another. The farmer naturally gravitates to ₹32/kg.  
  However, after deducting logistics, storage, handling, and fees, that ₹32 quote nets only ₹25,500. The ₹31 quote, with lower logistics deductions, nets ₹28,750.  
  Relying solely on headline price causes a net cash loss of ₹3,250—over 11% of the harvest value.  
  **AgriNexis** addresses Problem Statement 26132 with our guiding principle:  
  **'Not Just the Best Price. The Best Decision.'**  
  We introduce **Net Farm-Gate Realization (NFR)**: transparently calculating net returns after all applicable costs."

### [1:00 – 2:30] Problem & Canonical Scenario: Rahul Patil's Harvest
* **Speaker 1:**  
  "Meet farmer Rahul Patil with 1,000 kg of tomatoes.  
  On screen is the AgriNexis Judge Demo Hub at `/demo`."  
* **Speaker 2 (Navigation):**  
  Display **Step 1: Farmer Produce Listing**.  
* **Speaker 1:**  
  "Rahul lists 1,000 kg of tomatoes. AgriNexis retrieves market intelligence and available buyer bids.  
  Notice our price advisory in Step 3: AgriNexis does not issue a Sell/Wait recommendation because complete future holding economics are not available. It still identifies the best CURRENT opportunity: Buyer B."

### [2:30 – 4:30] Live Demo & NFR Reveal: The Math
* **Speaker 2 (Navigation):**  
  Navigate to **Step 5: NFR Intelligence (HERO)**.  
* **Speaker 1:**  
  "Here is the core comparison:  
  - **Buyer A:** Headline price **₹32.00/kg**. Gross: ₹32,000. Configured logistics and handling deductions: ₹6,500. **Net Realization: ₹25,500**.  
  - **Buyer B:** Headline price **₹31.00/kg**. Gross: ₹31,000. Configured logistics and handling deductions: ₹2,250. **Net Realization: ₹28,750**.  
  **Buyer B has a lower configured logistics cost, so its lower headline price produces a higher Net Farmer Realization (+₹3,250 net gain).**  
  AgriNexis ranks Buyer B as Rank #1 Recommended."

### [4:30 – 5:30] Contract Confirmation & Snapshot
* **Speaker 2 (Navigation):**  
  Navigate through Step 6 and Step 7.  
* **Speaker 1:**  
  "When the farmer accepts Buyer B, the backend executes an atomic stored procedure (`internal.accept_offer`).  
  The order is created with authoritative status **`CONFIRMED`**.  
  All 10 financial columns are frozen into an immutable snapshot on the order contract.  
  Payment tracking status is initialized to **`PENDING`**.  
  Our canonical SIH demonstration stops at **Order = CONFIRMED, Payment = PENDING**."

### [5:30 – 7:00] Architecture & Governance
* **Speaker 1:**  
  "Engineering architecture highlights:  
  1. **Modular Monolith:** 7 distinct domain engines (Matching, Logistics, Market, Prediction, Quality, Transactions, Core API).  
  2. **Security & Authorization:** PostgreSQL Row-Level Security (RLS) protects tenant data. JWT proves authentication identity, while application roles are strictly resolved from active database records, not user-controlled token metadata.  
  3. **Truthful Engineering:** All demo records are explicitly watermarked `DEMO DATA — NOT LIVE GOVERNMENT DATA`. We do not hallucinate predictions or make unverified laboratory claims.  
  AgriNexis: **Not Just the Best Price. The Best Decision.**  
  Thank you. We welcome your questions."

---

## 3. Screen-by-Screen Flow & Button Classification

| Step | Screen / Route | Visual Anchor | User Action | Action Type | Expected Outcome |
|---|---|---|---|---|---|
| **Header** | `/demo` | SIH Header Banner | Click *Reset Demo from Terminal* | **Presentation Navigation** | Opens terminal instructions modal showing SQL reset command. |
| **1** | `/demo` | Farmer Listing Card | Review Rahul Patil's lot | **Presentation Navigation** | Shows 1,000 kg Tomato listing. |
| **2** | `/demo` | Market Intel | Review APMC rates | **Presentation Navigation** | Explicitly displays `DEMO DATA — NOT LIVE GOVERNMENT DATA`. |
| **3** | `/demo` | Price Advisory | Review Prediction Status | **Presentation Navigation** | Shows `INSUFFICIENT_DATA` with reason `WAIT_ECONOMICS_UNAVAILABLE`. |
| **4** | `/demo` | Buyer Offers | Compare Buyer A vs Buyer B | **Presentation Navigation** | Displays headline quotes: Buyer A (₹32/kg) vs Buyer B (₹31/kg). |
| **5** | `/demo` | NFR Hero Card | Inspect Comparison Table | **Presentation Navigation** | Side-by-side matrix showing +₹3,250 net advantage for Buyer B. |
| **6** | `/demo` | Offer Acceptance | Review Acceptance Details | **Presentation Navigation** | Explains atomic acceptance parameters; button navigates to Step 7. |
| **7** | `/demo` | Order Contract | 10 Columns Snapshot Table | **Presentation Navigation** | Displays Order status **`CONFIRMED`** with immutable snapshot columns. |
| **8** | `/demo` | Payment Status | Direct Settlement Card | **Presentation Navigation** | Displays Payment status **`PENDING`**. Displays final outcome summary. |

---

## 4. Expected Values Cheatsheet

| Parameter | Buyer A | Buyer B | Delta / Notes |
|---|---|---|---|
| **Offered Unit Price** | ₹32.00 / kg | ₹31.00 / kg | Buyer A is +₹1.00/kg higher headline price |
| **Quantity** | 1,000 kg | 1,000 kg | Identical produce volume |
| **Gross Value** | ₹32,000.00 | ₹31,000.00 | Buyer A gross is ₹1,000 higher |
| **Transportation** | ₹5,500.00 | ₹1,500.00 | Configured lane tariff |
| **Storage** | ₹500.00 | ₹300.00 | Configured storage deduction |
| **Handling** | ₹300.00 | ₹300.00 | Configured handling deduction |
| **Other Costs** | ₹200.00 | ₹150.00 | Mandi / statutory fees |
| **Total Deductions** | **₹6,500.00** | **₹2,250.00** | Buyer A deductions are ₹4,250 higher |
| **Net Realization (NFR)** | **₹25,500.00** | **₹28,750.00** | **Buyer B yields +₹3,250.00 net gain** |
| **Engine Rank** | Rank #2 | Rank #1 Recommended | Recommended based on Net Realization |
| **Timing Decision** | `INSUFFICIENT_DATA` | `INSUFFICIENT_DATA` | Reason: `WAIT_ECONOMICS_UNAVAILABLE` |
| **Canonical Order Status** | — | **`CONFIRMED`** | Canonical SIH demo target order status |
| **Canonical Payment Status** | — | **`PENDING`** | Canonical SIH demo target payment status |

---

## 5. Failure Recovery Plan

| Scenario | Detection | Immediate Action | Grounded Explanation |
|---|---|---|---|
| **Services API (Port 8000) Unreachable** | UI shows network error badge | Restart API in terminal: `python -m uvicorn services.api.main:app --port 8000` | "In LIVE mode, server errors prompt retry. In explicit DEMO mode, deterministic fixtures are loaded." |
| **PostgreSQL Disconnected** | Terminal reset script fails | Verify PostgreSQL service is running | Check local PostgreSQL daemon status. |
| **Display Scaling Issues** | Content clipped on projector | Adjust browser zoom (`Ctrl + 0`) | Responsive UI adapts to viewport width. |

---

## 6. Reset Procedure

To restore the demo to its pristine state before or after a judging session:

### Approved Source: `database/seeds/002_sih_demo_reset.sql`
Run the safe reset script from your terminal:
```powershell
psql "$DATABASE_URL" -c "SET app.demo_seed_enabled = 'on';" -c "SET app.demo_reset_enabled = 'on';" -f database/seeds/002_sih_demo_reset.sql
```

### Verification Query:
```sql
SELECT title, status FROM listings WHERE title LIKE '%Rahul%';
-- Expected: 1 active listing
SELECT status, count(*) FROM orders WHERE order_number LIKE 'ORD-2026-DEMO%' GROUP BY status;
-- Expected: 0 rows before acceptance, or 1 row in 'CONFIRMED' after acceptance.
```

---

## 7. Backup Demo Plan

If local server environments encounter unexpected operating system failure during presentation:
1. **Pre-Rendered Web Pages:** Both `apps/admin-web` and `apps/buyer-web` are built as static Next.js pages and can be viewed directly in Chrome.
2. **Slide Deck Reference:** PDF presentation deck with exact screenshots of the canonical comparison matrix.
3. **Source Code Proof:** Open `services/matching-engine/engine.py` and `database/migrations/005_orders_lifecycle.sql` to demonstrate the NFR sorting logic and immutable snapshot schema.

---

## 8. Grounded Judge Questions & Answers (14 Scenarios)

### Q1: "Why shouldn't a farmer just take the ₹32/kg price?"
> **Answer:**  
> "Because headline price ignores deductions. In our canonical scenario, Buyer A quotes ₹32/kg, but configured deductions total ₹6,500, leaving ₹25,500 net. Buyer B quotes ₹31/kg, but has lower configured deductions of ₹2,250, leaving ₹28,750 net. Buyer B puts ₹3,250 more cash into the farmer's pocket."

### Q2: "How accurate is your price prediction model?"
> **Answer:**  
> "Our prediction engine contract restricts forecasts strictly to 1-day and 3-day horizons based on historical mandi trends. In the demo dataset, because sufficient historical points are not available, the engine outputs `INSUFFICIENT_DATA`. We refuse to hallucinate price confidence."

### Q3: "What if the buyer rejects produce on quality at delivery?"
> **Answer:**  
> "Our produce quality engine provides assistive visual assessment only (ASSISTIVE_VISUAL_ASSESSMENT_ONLY). It is an assistive visual assessment tool, not a laboratory quality test or food safety certification. The order contract records agreed specifications, and dispute handling transitions orders to `DISPUTED` for administrative review."

### Q4: "Where do logistics cost estimates come from? Are they real rates?"
> **Answer:**  
> "In this demo, logistics costs are derived from configured deterministic lane tariffs. AgriNexis does not run an active live routing provider during the demo."

### Q5: "How does this differ from eNAM or existing agri-marketing platforms?"
> **Answer:**  
> "eNAM operates primarily as an auction board for produce already physically brought to an APMC yard. AgriNexis enables farm-gate decision making before transit, ranking opportunities by Net Farm-Gate Realization after deducting logistics and handling costs."

### Q6: "Can a farmer use this without a smartphone or internet?"
> **Answer:**  
> "For farmers without personal devices, the primary engagement model is through local Farmer Producer Organizations (FPOs) and aggregation centers where an FPO operator manages listings and reviews buyer bids."

### Q7: "How do you prevent buyer fraud or payment defaults?"
> **Answer:**  
> "AgriNexis tracks payment states through an authoritative database state machine (`PENDING` -> `PROCESSING` -> `PAID` / `FAILED` / `REFUNDED`). Contracts capture immutable financial terms at confirmation. Live fund movement requires integration with an authorized external payment provider."

### Q8: "Why does the platform show 'Insufficient data' for timing instead of telling farmers when to sell?"
> **Answer:**  
> "AgriNexis does not issue a Sell/Wait recommendation because complete future holding economics are not available. It still identifies the best CURRENT opportunity: Buyer B."

### Q9: "What if transport rates spike after an offer is accepted?"
> **Answer:**  
> "At offer acceptance, the 10 financial columns are frozen into an immutable database snapshot. The agreed net realization of ₹28,750 is locked on the order contract."

### Q10: "How do you handle dispute resolution?"
> **Answer:**  
> "If an order encounters an issue, its status transitions to `DISPUTED`. This pauses standard lifecycle progression and surfaces the case in the Admin Dashboard (`/grievances`) for mediation."

### Q11: "What is your data source for mandi prices and how fresh is it?"
> **Answer:**  
> "The platform architecture ingests official Agmarknet daily modal prices. In the current SIH demonstration, all displayed market records are explicitly labelled deterministic DEMO fixtures carrying `data_mode: DEMO`."

### Q12: "How do you scale across Maharashtra?"
> **Answer:**  
> "Through modular architecture: independent stateless engines for matching, logistics tariffs, and market ingestion, with PostgreSQL managing transactional integrity and Row-Level Security."

### Q13: "Is this tested with real farmers?"
> **Answer:**  
> "The canonical scenario is calibrated to realistic tomato production and marketing parameters in Maharashtra. While demonstrated using deterministic test fixtures, the cost categories reflect real farmer deductions."

### Q14: "What is the business model / who pays for this platform?"
> **Answer:**  
> "The platform is designed to be zero-cost for smallholder farmers. Revenue models focus on institutional buyer subscription tiers, bulk logistics aggregation commissions, and enterprise analytics for FPO federations."

---

## 9. Known Production Blockers & Honest Status Disclosure

1. **Migration 016 DB Check Limitation:**  
   In `internal.accept_offer` (`database/migrations/016_acceptance_contract_hardening.sql`), validation for `offered_quantity >= demand.minimum_quantity` is enforced at the application service level, but lacks a database-level `CHECK` constraint inside the stored procedure. Known production blocker; no corrective migration has been added in this branch.
2. **Payment Processing:**  
   Payment status tracking is implemented. LIVE fund movement requires a configured external payment provider.
3. **Price Advisory Conservatism:**  
   The prediction engine strictly limits horizons to 1-day and 3-day. Timing decisions remain `INSUFFICIENT_DATA` when full holding economics are unavailable.
4. **Demo Data Mode:**  
   All demonstration fixtures are explicitly tagged with `data_mode: DEMO` and watermarked `DEMO DATA — NOT LIVE GOVERNMENT DATA`.

---

*AgriNexis — Smart India Hackathon 2026 — Government of Maharashtra*  
*“Not Just the Best Price. The Best Decision.”*
