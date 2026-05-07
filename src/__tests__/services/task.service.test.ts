import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSelect = vi.fn();
const mockFrom = vi.fn(() => ({ select: mockSelect }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: mockFrom },
}));

describe('TaskService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getMetrics groups tasks by status', async () => {
    mockSelect.mockResolvedValue({
      data: [{ status: 'todo' }, { status: 'todo' }, { status: 'done' }],
      error: null,
    });
    const { TaskService } = await import('@/services/task.service');
    const metrics = await TaskService.getMetrics();
    expect(metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ status: 'todo', count: 2 }),
        expect.objectContaining({ status: 'done', count: 1 }),
      ])
    );
  });

  it('throws ServiceError on database error', async () => {
    mockSelect.mockResolvedValue({ data: null, error: { message: 'DB error', code: '42P01' } });
    const { TaskService, ServiceError } = await import('@/services/task.service');
    await expect(TaskService.getMetrics()).rejects.toThrow(ServiceError);
  });

  it('getMetrics returns empty array when no tasks', async () => {
    mockSelect.mockResolvedValue({ data: [], error: null });
    const { TaskService } = await import('@/services/task.service');
    const metrics = await TaskService.getMetrics();
    expect(metrics).toEqual([]);
  });
});
