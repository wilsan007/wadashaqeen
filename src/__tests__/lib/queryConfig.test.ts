import { describe, it, expect } from 'vitest';
import { CACHE_TTL, queryClient } from '@/lib/queryConfig';

describe('queryConfig', () => {
  it('CACHE_TTL.static has longest staleTime', () => {
    expect(CACHE_TTL.static.staleTime).toBeGreaterThan(CACHE_TTL.semiStatic.staleTime);
    expect(CACHE_TTL.semiStatic.staleTime).toBeGreaterThan(CACHE_TTL.realtime.staleTime);
  });

  it('gcTime is always greater than staleTime', () => {
    for (const config of Object.values(CACHE_TTL)) {
      expect(config.gcTime).toBeGreaterThanOrEqual(config.staleTime);
    }
  });

  it('queryClient is a QueryClient instance', () => {
    expect(queryClient).toBeDefined();
    expect(typeof queryClient.getQueryCache).toBe('function');
  });
});
