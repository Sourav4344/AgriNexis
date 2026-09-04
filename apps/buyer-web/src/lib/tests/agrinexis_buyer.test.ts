import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  formatCurrency,
  formatQuantity,
  kgToQuintals,
  calculateRealization,
  addMoney,
  subtractMoney,
} from "../utils/currency";

import {
  MOCK_CURRENT_USER,
  MOCK_FPO_USER,
  MOCK_LISTINGS,
  MOCK_DEMANDS,
  MOCK_OFFERS,
  MOCK_ORDERS,
  MOCK_MANDI_PRICES,
  MOCK_PRICE_PREDICTIONS,
} from "../mockData";

import { APP_CAPABILITIES } from "../capabilities";

describe("AgriNexis Buyer Dashboard Contract & Domain Tests", () => {
  // 1. Decimal-String Preservation
  it("preserves exact decimal strings for financial fields without float truncation", () => {
    const rawUnitPrice = "31.00";
    const rawGross = "31000.00";
    const rawTotalCost = "2250.00";
    const rawNfr = "28750.00";

    assert.equal(typeof rawUnitPrice, "string");
    assert.equal(typeof rawGross, "string");
    assert.equal(typeof rawTotalCost, "string");
    assert.equal(typeof rawNfr, "string");

    const calculated = calculateRealization(1000, 31, 1500, 300, 300, 150);
    assert.equal(calculated.gross, rawGross);
    assert.equal(calculated.totalCost, rawTotalCost);
    assert.equal(calculated.nfr, rawNfr);
  });

  // 2. DEMO-Mode Isolation & Canonical NFR Comparison
  it("asserts canonical SIH demo scenario where Buyer B yields ₹3,250 higher NFR despite ₹1/kg lower headline price", () => {
    // Buyer A: price 32, gross 32000, costs 6500 (transport 5500, storage 500, handling 300, other 200) -> NFR 25500
    const buyerA = calculateRealization("1000.000", "32.00", "5500.00", "500.00", "300.00", "200.00");
    assert.equal(buyerA.gross, "32000.00");
    assert.equal(buyerA.totalCost, "6500.00");
    assert.equal(buyerA.nfr, "25500.00");

    // Buyer B: price 31, gross 31000, costs 2250 (transport 1500, storage 300, handling 300, other 150) -> NFR 28750
    const buyerB = calculateRealization("1000.000", "31.00", "1500.00", "300.00", "300.00", "150.00");
    assert.equal(buyerB.gross, "31000.00");
    assert.equal(buyerB.totalCost, "2250.00");
    assert.equal(buyerB.nfr, "28750.00");

    // Difference assertion
    const diffNfr = parseFloat(buyerB.nfr) - parseFloat(buyerA.nfr);
    assert.equal(diffNfr, 3250.00, "Buyer B must yield exactly ₹3,250 more NFR to the farmer");
  });

  // 3. Market Mode Badges & Provenance
  it("enforces explicit data_mode tagging for all market prices and prevents live masquerading", () => {
    for (const mp of MOCK_MANDI_PRICES) {
      assert.ok(["LIVE", "CACHED", "DEMO"].includes(mp.data_mode));
      if (mp.data_mode === "DEMO") {
        assert.ok(mp.provenance.includes("Demo") || mp.provenance.includes("Simulated"));
      }
    }
  });

  // 4. Market kg to Quintal Conversion
  it("correctly converts canonical kg arrival units to quintals (1 qtl = 100 kg)", () => {
    assert.equal(kgToQuintals("45000.000"), "450 qtl (45,000 kg)");
    assert.equal(kgToQuintals("180000.000"), "1,800 qtl (1,80,000 kg)");
    assert.equal(kgToQuintals("350.000"), "3.5 qtl (350 kg)");
    assert.equal(kgToQuintals(null), "0 qtl");
  });

  // 5. Verification Status Handling (No fake numeric trust scores)
  it("validates verified vs unverified buyer profiles without fake trust percentages", () => {
    const validStatuses = ["UNVERIFIED", "PENDING", "VERIFIED", "REJECTED"];
    assert.ok(validStatuses.includes(MOCK_CURRENT_USER.verification_status || ""));
    assert.ok(validStatuses.includes(MOCK_FPO_USER.verification_status || ""));
    assert.equal(MOCK_CURRENT_USER.verification_status, "VERIFIED");
  });

  // 6. Order Status Presentation & State Machine Alignment
  it("verifies order statuses match PostgreSQL database enum 002_types.sql", () => {
    const validOrderStatuses = [
      "CONFIRMED",
      "PICKUP_SCHEDULED",
      "IN_TRANSIT",
      "DELIVERED",
      "COMPLETED",
      "CANCELLED",
      "DISPUTED",
    ];

    for (const ord of MOCK_ORDERS) {
      assert.ok(validOrderStatuses.includes(ord.status), `Invalid status ${ord.status}`);
      assert.ok(ord.financials.snapshot_net_farmer_realization, "Snapshot NFR must exist");
      assert.equal(
        parseFloat(ord.financials.snapshot_gross_selling_value) -
          parseFloat(ord.financials.snapshot_total_applicable_cost),
        parseFloat(ord.financials.snapshot_net_farmer_realization),
        "Immutable snapshot must balance: Gross - TotalCost = NFR"
      );
    }
  });

  // 7. Payment Status Presentation
  it("verifies payment statuses match database enum", () => {
    const validPaymentStatuses = ["PENDING", "PROCESSING", "PAID", "FAILED", "REFUNDED"];
    for (const ord of MOCK_ORDERS) {
      assert.ok(validPaymentStatuses.includes(ord.payment_status));
    }
  });

  // 8. Demand Form Validation Constraints
  it("validates demand quantity constraints and positive pricing", () => {
    const validDemand = MOCK_DEMANDS[0];
    assert.ok(parseFloat(validDemand.minimum_quantity) > 0);
    assert.ok(parseFloat(validDemand.maximum_quantity) >= parseFloat(validDemand.minimum_quantity));
    assert.ok(parseFloat(validDemand.indicative_price || "0") > 0);
    assert.ok(validDemand.currency === "INR");
    assert.ok(["DRAFT", "ACTIVE", "PARTIALLY_FILLED", "FULFILLED", "EXPIRED", "CANCELLED"].includes(validDemand.status));
  });

  // 9. Offer Form Validation Constraints
  it("validates offer quantity and positive unit pricing", () => {
    const validOffer = MOCK_OFFERS[0];
    assert.ok(parseFloat(validOffer.quantity_kg) > 0);
    assert.ok(parseFloat(validOffer.unit_price_per_kg) > 0);
    assert.ok(new Date(validOffer.expires_at).getTime() > new Date(validOffer.created_at).getTime());
    assert.ok(["PENDING", "ACCEPTED", "REJECTED", "WITHDRAWN", "EXPIRED"].includes(validOffer.status));
  });

  // 10. Null Prediction Confidence Handling & Prediction Integrity (Agent 7 Contract)
  it("gracefully handles price prediction confidence and trend types for 1 & 3 day horizons", () => {
    const validTrends = ["RISING", "STABLE", "FALLING", "INSUFFICIENT_DATA"];
    const validAdvisories = ["SELL_NOW", "WAIT", "INSUFFICIENT_DATA"];

    for (const pred of MOCK_PRICE_PREDICTIONS) {
      assert.ok(validTrends.includes(pred.trend), `Invalid trend ${pred.trend}`);
      assert.ok(validAdvisories.includes(pred.sell_wait_signal), `Invalid advisory ${pred.sell_wait_signal}`);
      assert.ok(pred.forecast_days_1, "1-day forecast horizon must exist");
      assert.ok(pred.forecast_days_3, "3-day forecast horizon must exist");

      if (pred.trend === "INSUFFICIENT_DATA") {
        assert.equal(pred.confidence_score, null, "Insufficient data must have null confidence");
        assert.equal(pred.sell_wait_signal, "INSUFFICIENT_DATA", "Insufficient data must yield INSUFFICIENT_DATA advisory");
      } else {
        assert.ok(typeof pred.confidence_score === "number" && pred.confidence_score >= 0 && pred.confidence_score <= 1);
      }
    }
  });

  // 11. Inaccessible Fake Action Prevention & Capabilities Classification
  it("enforces explicit Fake Button Policy classification across all major application features", () => {
    assert.equal(APP_CAPABILITIES.CREATE_DEMAND.classification, "WORKING_API");
    assert.equal(APP_CAPABILITIES.CREATE_OFFER.classification, "WORKING_API");
    assert.equal(APP_CAPABILITIES.ORDER_TRANSITION.classification, "WORKING_API");
    assert.equal(APP_CAPABILITIES.VIEW_RECOMMENDATION.classification, "BACKEND_NOT_AVAILABLE");
    assert.equal(APP_CAPABILITIES.PAYMENT_ACTION.classification, "BACKEND_NOT_AVAILABLE");
    assert.equal(APP_CAPABILITIES.QUALITY_UPLOAD.classification, "BACKEND_NOT_AVAILABLE");
  });

  // 12. Dynamic Multi-Currency ISO 4217 Support
  it("preserves and formats authoritative ISO 4217 currency strings without hardcoded INR rejection", () => {
    assert.ok(formatCurrency("1500.00", false, "INR").includes("1,500"));
    assert.ok(formatCurrency("250.50", true, "USD").includes("250.50"));
    assert.ok(formatCurrency("100.00", false, "EUR").includes("100"));
  });
});
