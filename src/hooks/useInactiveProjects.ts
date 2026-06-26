import { useQuery } from '@tanstack/react-query';
import { ProjectService } from '@/services/project.service';
import { CACHE_TTL } from '@/lib/queryConfig';

export const useInactiveProjects = (days = 1) =>
  useQuery({
    queryKey: ['inactive-projects', days],
    queryFn: () => ProjectService.getInactiveProjectsCount(days),
    ...CACHE_TTL.semiStatic,
  });
