import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

vi.mock('@/services/employee.service', () => ({
  EmployeeService: {
    getTeamStats: vi.fn().mockResolvedValue({ total: 12, active: 10, departments: 3 }),
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client: qc }, children);
};

describe('useTeamStats', () => {
  it('fetches team stats correctly', async () => {
    const { useTeamStats } = await import('@/hooks/useTeamStats');
    const { result } = renderHook(() => useTeamStats(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ total: 12, active: 10, departments: 3 });
  });
});
