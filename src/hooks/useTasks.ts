import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TaskService, type Task, type CreateTaskDTO, type UpdateTaskDTO } from '@/services/task.service';

export const useTasksByProject = (projectId: string) =>
  useQuery<Task[]>({
    queryKey: ['tasks', projectId],
    queryFn: () => TaskService.getByProject(projectId),
    enabled: !!projectId,
  });

export const useTask = (id: string) =>
  useQuery<Task>({
    queryKey: ['tasks', id],
    queryFn: () => TaskService.getById(id),
    enabled: !!id,
  });

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  return useMutation<Task, Error, CreateTaskDTO>({
    mutationFn: (payload) => TaskService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  return useMutation<Task, Error, { id: string; payload: UpdateTaskDTO }>({
    mutationFn: ({ id, payload }) => TaskService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => TaskService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};
