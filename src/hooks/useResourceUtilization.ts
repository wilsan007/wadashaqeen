import { useQuery } from '@tanstack/react-query';
import { EmployeeService } from '@/services/employee.service';
import { CACHE_TTL } from '@/lib/queryConfig';

export const useResourceUtilization = () =>
  useQuery({
    queryKey: ['resource-utilization'],
    queryFn: () => EmployeeService.getResourceUtilizationStats(),
    ...CACHE_TTL.semiStatic,
  });
