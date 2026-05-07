import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSelect = vi.fn();
const mockFrom = vi.fn(() => ({ select: mockSelect }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: mockFrom },
}));

describe('EmployeeService.getTeamStats', () => {
  beforeEach(() => vi.clearAllMocks());

  it('counts active employees and unique departments', async () => {
    mockSelect.mockResolvedValue({
      data: [
        { status: 'active', department_id: 'dept-1' },
        { status: 'active', department_id: 'dept-1' },
        { status: 'inactive', department_id: 'dept-2' },
        { status: 'active', department_id: 'dept-2' },
      ],
      error: null,
    });
    const { EmployeeService } = await import('@/services/employee.service');
    const stats = await EmployeeService.getTeamStats();
    expect(stats.total).toBe(4);
    expect(stats.active).toBe(3);
    expect(stats.departments).toBe(2);
  });

  it('handles empty table', async () => {
    mockSelect.mockResolvedValue({ data: [], error: null });
    const { EmployeeService } = await import('@/services/employee.service');
    const stats = await EmployeeService.getTeamStats();
    expect(stats).toEqual({ total: 0, active: 0, departments: 0 });
  });
});
