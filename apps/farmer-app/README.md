# AgriNexis — Farmer Mobile Application (Agent 1)

> **“Not Just the Best Price. The Best Decision.”**
> *Smart India Hackathon 2026 — Problem Statement ID: 26132*
> *“Strengthening market linkages and price discovery for farmers”*

---

## 🌾 Overview & Purpose

The **AgriNexis Farmer Mobile Application** empowers Indian farmers by transforming market intelligence from basic headline price quotes into actionable **Net Farmer Realization (NFR)** decisions.

### 💡 The Signature Decision Difference

Traditional agriculture apps merely show the highest mandi rate or buyer quote. AgriNexis reveals the true cash in hand:

$$\text{Gross Selling Price} - (\text{Transport} + \text{Storage} + \text{Handling} + \text{Other Applicable Cost}) = \textbf{Net Farmer Realization (NFR)}$$

#### Canonical SIH Demonstration:
- **Buyer A (Mumbai):** Headline ₹32.00/kg $\rightarrow$ Gross ₹32,000 $\rightarrow$ Costs ₹6,500 $\rightarrow$ **Farmer gets ₹25,500**
- **Buyer B (Pune):** Headline ₹31.00/kg $\rightarrow$ Gross ₹31,000 $\rightarrow$ Costs ₹2,250 $\rightarrow$ **Farmer gets ₹28,750**
- **Decision:** AgriNexis recommends **Buyer B**, earning the farmer **₹3,250 more** despite a ₹1/kg lower headline price!

---

## 🏗 Architecture & Code Structure

The application follows a clean layered architecture adhering to the shared contracts (`docs/API_CONTRACT.md`, `docs/DATABASE.md`, `docs/DESIGN_SYSTEM.md`):

```
apps/farmer-app/
├── lib/
│   ├── app.dart                        # MaterialApp root, theme, localization delegates
│   ├── main.dart                       # Entry point, dependency injection, MultiProvider
│   ├── core/
│   │   ├── constants/                  # API endpoints, Demo IDs, Problem statement constants
│   │   ├── network/                    # ApiClient, ApiException, ApiResponse envelopes
│   │   ├── theme/                      # AppColors, AppTypography, AppSpacing, AppTheme
│   │   └── utils/                      # CurrencyFormatter (₹ INR), DateFormatter, IdGenerator
│   ├── l10n/                           # Multilingual localization (English, Hindi, Marathi)
│   ├── models/                         # Domain models (Profile, Crop, Listing, MandiPrice, NFR, Offer, Order, Grievance)
│   ├── repositories/                   # Abstract repository interfaces with API & offline demo fallbacks
│   ├── state/                          # Provider change notifiers for UI reactivity
│   └── presentation/
│       ├── widgets/                    # DemoBadge, StatusChip, AppButton, AppCard, NfrBreakdownCard, ComparisonCallout
│       └── screens/
│           ├── main_navigation_screen.dart # 5-tab bottom navigation
│           ├── home/                   # Farmer dashboard & quick recommendation summary
│           ├── sell/                   # Multi-step produce listing creation & details
│           ├── markets/                # Mandi price discovery & Price Prediction AI
│           ├── recommendations/        # Detailed NFR comparisons & accept offer workflow
│           ├── offers/                 # Incoming buyer offers with accept/reject state
│           ├── orders/                 # Order fulfillment timeline & immutable financial snapshots
│           ├── grievances/             # Farmer dispute tracking & ticket creation
│           └── profile/                # Language selection (EN/HI/MR) & security disclosures
└── test/
    ├── unit/                           # Currency formatting, NFR calculations, listing validation, JSON parsing
    └── widget/                         # Demo badge banner, NFR breakdown card, comparison callouts
```

---

## 🔒 Security & Data Provenance Rules

1. **Immutable Accepted Snapshots:** When an offer is accepted, the resulting order contains the exact agreed economics (`snapshot_gross_selling_value`, `snapshot_total_applicable_cost`, `snapshot_net_farmer_realization`).
2. **Visible Demo Labeling:** All mock fixtures and non-government observations carry the prominent **`DEMO DATA — NOT LIVE GOVERNMENT DATA`** banner.
3. **Honest Insufficient Data States:** If the AI price prediction engine lacks sufficient historical market arrivals, it explicitly displays an honest empty state rather than fabricating confidence.
4. **Zero Client Secrets:** Client code never stores Supabase service keys or sensitive credentials.
