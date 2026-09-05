import { describe, it, expect } from 'vitest';
import { DEMO_RECOMMENDATIONS, DEMO_ORDERS } from '../lib/fixtures/sihDemoData';
import { calculateNFR, subtractMoney } from '../lib/utils/money';

describe('Canonical SIH 2026 NFR Decision Verification', () => {
  it('validates Buyer B rank #1 despite lower headline price', () => {
    const sorted = [...DEMO_RECOMMENDATIONS].sort((a, b) => a.rank - b.rank);
    const topPick = sorted[0];
    const secondPick = sorted[1];

    expect(topPick.candidate_name).toContain('Buyer B');
    expect(topPick.estimated_unit_price_per_kg).toBe('31.00');
    expect(topPick.estimated_net_farmer_realization).toBe('28750.00');

    expect(secondPick.candidate_name).toContain('Buyer A');
    expect(secondPick.estimated_unit_price_per_kg).toBe('32.00');
    expect(secondPick.estimated_net_farmer_realization).toBe('25500.00');

    const realizationAdvantage = subtractMoney(
      topPick.estimated_net_farmer_realization,
      secondPick.estimated_net_farmer_realization
    );
    expect(realizationAdvantage).toBe('3250.00');
  });

  it('validates order snapshot equality with accepted recommendation', () => {
    const order = DEMO_ORDERS[0];
    expect(order.snapshot_gross_selling_value).toBe('31000.00');
    expect(order.snapshot_total_applicable_cost).toBe('2250.00');
    expect(order.snapshot_net_farmer_realization).toBe('28750.00');

    // Mathematical integrity check on order snapshot
    const calculated = calculateNFR(
      order.snapshot_gross_selling_value,
      order.snapshot_transportation_cost,
      order.snapshot_storage_cost,
      order.snapshot_handling_cost,
      order.snapshot_other_applicable_cost
    );

    expect(calculated.totalCost).toBe(order.snapshot_total_applicable_cost);
    expect(calculated.nfr).toBe(order.snapshot_net_farmer_realization);
  });

  it('strictly validates Section 26 canonical demo invariants and timing semantics', () => {
    const sorted = [...DEMO_RECOMMENDATIONS].sort((a, b) => a.rank - b.rank);
    const buyerB = sorted[0];
    const buyerA = sorted[1];

    // Buyer A arithmetic: 32000 - 6500 = 25500
    expect(buyerA.estimated_gross_selling_value).toBe('32000.00');
    expect(buyerA.estimated_total_applicable_cost).toBe('6500.00');
    expect(buyerA.estimated_net_farmer_realization).toBe('25500.00');
    expect(
      calculateNFR(
        buyerA.estimated_gross_selling_value,
        buyerA.estimated_transportation_cost,
        buyerA.estimated_storage_cost,
        buyerA.estimated_handling_cost,
        buyerA.estimated_other_applicable_cost
      ).nfr
    ).toBe('25500.00');

    // Buyer B arithmetic: 31000 - 2250 = 28750
    expect(buyerB.estimated_gross_selling_value).toBe('31000.00');
    expect(buyerB.estimated_total_applicable_cost).toBe('2250.00');
    expect(buyerB.estimated_net_farmer_realization).toBe('28750.00');
    expect(
      calculateNFR(
        buyerB.estimated_gross_selling_value,
        buyerB.estimated_transportation_cost,
        buyerB.estimated_storage_cost,
        buyerB.estimated_handling_cost,
        buyerB.estimated_other_applicable_cost
      ).nfr
    ).toBe('28750.00');

    // Advantage arithmetic: 28750 - 25500 = 3250
    const advantage = subtractMoney(buyerB.estimated_net_farmer_realization, buyerA.estimated_net_farmer_realization);
    expect(advantage).toBe('3250.00');

    // Buyer B: Rank #1
    expect(buyerB.rank).toBe(1);
    expect(buyerA.rank).toBe(2);

    // Timing semantics: INSUFFICIENT_DATA and WAIT_ECONOMICS_UNAVAILABLE
    expect(buyerB.sell_wait).toBe('INSUFFICIENT_DATA');
    expect(buyerB.timing_reason).toBe('WAIT_ECONOMICS_UNAVAILABLE');
    expect(buyerB.confidence).toBeNull();

    expect(buyerA.sell_wait).toBe('INSUFFICIENT_DATA');
    expect(buyerA.timing_reason).toBe('WAIT_ECONOMICS_UNAVAILABLE');
    expect(buyerA.confidence).toBeNull();
  });
});
