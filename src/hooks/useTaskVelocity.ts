import { useQuery } from '@tanstack/react-query';
import { TaskService } from '@/services/task.service';
import { CACHE_TTL } from '@/lib/queryConfig';

export const useTaskVelocity = () =>
  useQuery({
    queryKey: ['task-velocity'],
    queryFn: () => TaskService.getVelocityStats(),
    ...CACHE_TTL.semiStatic,
  });

export const useTaskResolutionTime = () =>
  useQuery({
    queryKey: ['task-resolution-time'],
    queryFn: () => TaskService.getResolutionTimeStats(),
    ...CACHE_TTL.semiStatic,
  });
