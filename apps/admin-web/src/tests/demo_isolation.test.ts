import { describe, it, expect } from 'vitest';
import {
  DEMO_PROFILES,
  DEMO_LISTINGS,
  DEMO_MANDI_PRICES,
  DEMO_RECOMMENDATIONS,
} from '../lib/fixtures/sihDemoData';

describe('Demo Fixture Isolation & Non-Promotion Invariants', () => {
  it('ensures all demo market prices carry DEMO data_mode and data warning', () => {
    for (const price of DEMO_MANDI_PRICES) {
      expect(price.data_mode).toBe('DEMO');
      expect(price.provenance.label).toContain('DEMO DATA — NOT LIVE GOVERNMENT DATA');
      expect(price.data_warning).toBe('DEMO DATA — NOT LIVE GOVERNMENT DATA');
    }
  });

  it('ensures demo recommendations carry explicit DEMO mode and warning', () => {
    for (const rec of DEMO_RECOMMENDATIONS) {
      expect(rec.data_mode).toBe('DEMO');
      expect(rec.data_warning).toBe('DEMO DATA — NOT LIVE GOVERNMENT DATA');
    }
  });

  it('ensures Rahul demo profile has deterministic UUIDs matching database seed', () => {
    const rahul = DEMO_PROFILES.find((p) => p.display_name.includes('Rahul'));
    expect(rahul).toBeDefined();
    expect(rahul?.id).toBe('20000000-0000-4000-8000-000000000001');
    expect(rahul?.user_id).toBe('10000000-0000-4000-8000-000000000001');
  });

  it('ensures live mode does not silently return demo fixtures on missing backend', async () => {
    const { fetchAllUsers } = await import('../lib/api/endpoints');
    const result = await fetchAllUsers({ baseUrl: 'http://localhost:8000/api/v1', demoMode: false });
    expect(result.isBackendAvailable).toBe(false);
    expect(result.profiles).toEqual([]);
  });
});
