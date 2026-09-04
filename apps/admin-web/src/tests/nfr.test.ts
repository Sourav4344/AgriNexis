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
});
