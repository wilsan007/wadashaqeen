import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProjectService, type Project } from '@/services/project.service';

export const useProjects = () =>
  useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => ProjectService.getAll(),
  });

export const useProject = (id: string) =>
  useQuery<Project>({
    queryKey: ['projects', id],
    queryFn: () => ProjectService.getById(id),
    enabled: !!id,
  });

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  return useMutation<Project, Error, Omit<Project, 'id' | 'created_at'>>({
    mutationFn: (payload) => ProjectService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  return useMutation<Project, Error, { id: string; payload: Partial<Project> }>({
    mutationFn: ({ id, payload }) => ProjectService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};
