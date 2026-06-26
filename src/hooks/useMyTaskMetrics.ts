import { useQuery } from '@tanstack/react-query';
import { TaskService } from '@/services/task.service';
import { CACHE_TTL } from '@/lib/queryConfig';

export const useMyTaskMetrics = (userId: string | undefined) =>
  useQuery<{ status: string; count: number }[]>({
    queryKey: ['my-task-metrics', userId],
    queryFn: () => TaskService.getMyMetrics(userId!),
    enabled: !!userId,
    ...CACHE_TTL.realtime,
  });

export const useMyOverdueTasks = (userId: string | undefined) =>
  useQuery<number>({
    queryKey: ['my-overdue-tasks', userId],
    queryFn: () => TaskService.getMyOverdueTasks(userId!),
    enabled: !!userId,
    ...CACHE_TTL.realtime,
  });

export const useOverdueTaskCount = () =>
  useQuery<number>({
    queryKey: ['overdue-task-count'],
    queryFn: () => TaskService.getOverdueCount(),
    ...CACHE_TTL.realtime,
  });

export const useMyProjectCount = (userId: string | undefined) =>
  useQuery<number>({
    queryKey: ['my-project-count', userId],
    queryFn: () => TaskService.getMyProjectCount(userId!),
    enabled: !!userId,
    ...CACHE_TTL.semiStatic,
  });
