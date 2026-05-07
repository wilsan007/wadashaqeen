import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSelect = vi.fn();
const mockFrom = vi.fn(() => ({ select: mockSelect }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: mockFrom },
}));

describe('ProjectService.getStats', () => {
  beforeEach(() => vi.clearAllMocks());

  it('counts totals correctly', async () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    mockSelect.mockResolvedValue({
      data: [
        { status: 'active', end_date: null },
        { status: 'in_progress', end_date: null },
        { status: 'completed', end_date: yesterday },
        { status: 'active', end_date: yesterday },
      ],
      error: null,
    });
    const { ProjectService } = await import('@/services/project.service');
    const stats = await ProjectService.getStats();
    expect(stats.total).toBe(4);
    expect(stats.active).toBe(3);
    expect(stats.completed).toBe(1);
    expect(stats.overdue).toBe(1);
  });

  it('returns zeros for empty database', async () => {
    mockSelect.mockResolvedValue({ data: [], error: null });
    const { ProjectService } = await import('@/services/project.service');
    const stats = await ProjectService.getStats();
    expect(stats).toEqual({ total: 0, active: 0, completed: 0, overdue: 0 });
  });

  it('throws ServiceError on DB error', async () => {
    mockSelect.mockResolvedValue({ data: null, error: { message: 'fail', code: '500' } });
    const { ProjectService } = await import('@/services/project.service');
    const { ServiceError } = await import('@/services/task.service');
    await expect(ProjectService.getStats()).rejects.toThrow(ServiceError);
  });
});
