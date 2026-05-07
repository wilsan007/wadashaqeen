import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

vi.mock('@/services/task.service', () => ({
  TaskService: {
    getMetrics: vi.fn().mockResolvedValue([
      { status: 'todo', count: 5 },
      { status: 'done', count: 3 },
    ]),
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client: qc }, children);
};

describe('useTaskMetrics', () => {
  it('fetches and returns task metrics', async () => {
    const { useTaskMetrics } = await import('@/hooks/useTaskMetrics');
    const { result } = renderHook(() => useTaskMetrics(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0]).toMatchObject({ status: 'todo', count: 5 });
  });
});
