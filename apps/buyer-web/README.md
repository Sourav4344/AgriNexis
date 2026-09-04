# AgriNexis Buyer & FPO Web Dashboard (`apps/buyer-web`)

Production-grade Next.js / TypeScript Web Application for Institutional Buyers and Farmer Producer Organization (FPO) operators.

## Key Capabilities

1. **Dual Persona Switching**: Seamless switching between **Institutional Buyer** (procurement demands, marketplace browsing, bidding, fulfillment tracking) and **FPO Operator** (member farmer directory, aggregate supply lots, freight pooling).
2. **Deterministic SIH Evaluation Mode**: Full adherence to `docs/DEMO.md` with visible `DEMO DATA — NOT LIVE GOVERNMENT DATA` alert banner, canonical 1,000 kg Tomato listing (Rahul Patil), Buyer A vs. Buyer B NFR comparison scenario, and one-click demo data reset.
3. **Transparent Net Farmer Realization (NFR)**: All offers and accepted orders display immutable itemized financial snapshots: Gross Value, Transportation, Handling, Storage, Other deductions, and resulting NFR.
4. **Order State Machine**: Enforces strict lifecycle transitions: `CONFIRMED` $\rightarrow$ `PICKUP_SCHEDULED` $\rightarrow$ `IN_TRANSIT` $\rightarrow$ `DELIVERED` $\rightarrow$ `COMPLETED` (or `DISPUTED` / `CANCELLED`).
5. **Market Intelligence & APMC Benchmarks**: Cross-district APMC modal price comparison with AI-driven 7 to 14 day price movement forecasts.
6. **Logistics & Warehousing**: Cold storage locator and deterministic freight estimation tool.

## Development & Build

```bash
# Navigate to buyer web app
cd apps/buyer-web

# Install dependencies
npm install

# Run development server on port 3001
npm run dev

# Build for production
npm run build
```
