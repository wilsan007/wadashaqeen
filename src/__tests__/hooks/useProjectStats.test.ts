import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

vi.mock('@/services/project.service', () => ({
  ProjectService: {
    getStats: vi.fn().mockResolvedValue({ total: 5, active: 3, completed: 1, overdue: 1 }),
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client: qc }, children);
};

describe('useProjectStats', () => {
  it('fetches and returns project stats', async () => {
    const { useProjectStats } = await import('@/hooks/useProjectStats');
    const { result } = renderHook(() => useProjectStats(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ total: 5, active: 3, completed: 1, overdue: 1 });
  });
});
