import { useQuery } from '@tanstack/react-query';
import { EmployeeService } from '@/services/employee.service';
import { CACHE_TTL } from '@/lib/queryConfig';

export const useAbsenteeismRate = () =>
  useQuery({
    queryKey: ['absenteeism-rate'],
    queryFn: () => EmployeeService.getAbsenteeismRate(),
    ...CACHE_TTL.semiStatic,
  });
