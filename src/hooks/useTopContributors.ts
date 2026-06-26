import { useQuery } from '@tanstack/react-query';
import { TaskService } from '@/services/task.service';
import { CACHE_TTL } from '@/lib/queryConfig';

export const useTopContributors = (limit = 5) =>
  useQuery({
    queryKey: ['top-contributors', limit],
    queryFn: () => TaskService.getTopContributors(limit),
    ...CACHE_TTL.semiStatic,
  });
