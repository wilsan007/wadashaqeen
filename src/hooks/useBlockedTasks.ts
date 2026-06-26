import { useQuery } from '@tanstack/react-query';
import { TaskService } from '@/services/task.service';
import { CACHE_TTL } from '@/lib/queryConfig';

export const useBlockedTasks = () =>
  useQuery({
    queryKey: ['blocked-tasks-stats'],
    queryFn: () => TaskService.getBlockedTasksStats(),
    ...CACHE_TTL.realtime,
  });
