import { useQuery } from '@tanstack/react-query';
import { ProjectService, type ProjectStats } from '@/services/project.service';
import { CACHE_TTL } from '@/lib/queryConfig';

export const useProjectStats = () =>
  useQuery<ProjectStats>({
    queryKey: ['project-stats'],
    queryFn: () => ProjectService.getStats(),
    ...CACHE_TTL.semiStatic,
  });
