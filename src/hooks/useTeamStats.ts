import { useQuery } from '@tanstack/react-query';
import { EmployeeService, type TeamStats } from '@/services/employee.service';
import { CACHE_TTL } from '@/lib/queryConfig';

export const useTeamStats = () =>
  useQuery<TeamStats>({
    queryKey: ['team-stats'],
    queryFn: () => EmployeeService.getTeamStats(),
    ...CACHE_TTL.semiStatic,
  });
