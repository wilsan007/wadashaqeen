import { useQuery } from '@tanstack/react-query';
import { EmployeeService, type HRDashboardStats, type MyLeaveBalance } from '@/services/employee.service';
import { CACHE_TTL } from '@/lib/queryConfig';

export const useHRDashboardStats = () =>
  useQuery<HRDashboardStats>({
    queryKey: ['hr-dashboard-stats'],
    queryFn: () => EmployeeService.getHRDashboardStats(),
    ...CACHE_TTL.semiStatic,
  });

export const useMyLeaveBalance = (userId: string | undefined) =>
  useQuery<MyLeaveBalance>({
    queryKey: ['my-leave-balance', userId],
    queryFn: () => EmployeeService.getMyLeaveBalance(userId!),
    enabled: !!userId,
    ...CACHE_TTL.semiStatic,
  });
