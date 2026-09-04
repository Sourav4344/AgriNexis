import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiRequest, ApiClientError } from '../lib/api/client';

describe('Centralized API Client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('handles successful API response', async () => {
    const mockData = { id: 'test-123', name: 'Test Market' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ data: mockData, meta: { request_id: 'req-1' } }),
    });

    const res = await apiRequest('http://localhost:8000/api/v1', '/markets/test-123');
    expect(res.data).toEqual(mockData);
    expect(res.meta.request_id).toBe('req-1');
  });

  it('maps HTTP errors with stable codes and details', async () => {
    const errorPayload = {
      error: {
        code: 'ORDER_VERSION_CONFLICT',
        message: 'The order changed; refresh and try again',
        details: [{ field: 'version', reason: 'outdated' }],
        request_id: 'req-err-1',
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      text: async () => JSON.stringify(errorPayload),
    });

    await expect(
      apiRequest('http://localhost:8000/api/v1', '/orders/123/transitions', { method: 'POST' })
    ).rejects.toThrow(ApiClientError);

    try {
      await apiRequest('http://localhost:8000/api/v1', '/orders/123/transitions', { method: 'POST' });
    } catch (err: any) {
      expect(err.code).toBe('ORDER_VERSION_CONFLICT');
      expect(err.status).toBe(409);
      expect(err.requestId).toBe('req-err-1');
      expect(err.details).toEqual([{ field: 'version', reason: 'outdated' }]);
    }
  });

  it('handles network failure with clear NETWORK_ERROR code', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Connection refused'));

    try {
      await apiRequest('http://localhost:8000/api/v1', '/health');
    } catch (err: any) {
      expect(err.code).toBe('NETWORK_ERROR');
      expect(err.status).toBe(0);
      expect(err.message).toContain('Failed to connect to AgriNexis backend');
    }
  });
});
