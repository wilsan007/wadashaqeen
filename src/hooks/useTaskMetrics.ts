import { useQuery } from '@tanstack/react-query';
import { TaskService } from '@/services/task.service';
import { CACHE_TTL } from '@/lib/queryConfig';

export const useTaskMetrics = () =>
  useQuery<{ status: string; count: number }[]>({
    queryKey: ['task-metrics'],
    queryFn: () => TaskService.getMetrics(),
    ...CACHE_TTL.realtime,
  });
