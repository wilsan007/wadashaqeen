import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthFilterContext } from '@/contexts/AuthContext';
import { applyRoleFilters } from '@/lib/roleBasedFiltering';
import { useToast } from '@/hooks/use-toast';
import { CACHE_TTL } from '@/lib/queryConfig';

export interface OnboardingProcess {
  id: string;
  employee_id: string;
  employee_name: string;
  position: string;
  department: string;
  start_date: string;
  status: 'pending' | 'in_progress' | 'completed';
  progress: number;
  created_at: string;
  updated_at: string;
  tenant_id?: string;
}

export interface OnboardingTask {
  id: string;
  process_id: string;
  title: string;
  responsible: string;
  due_date: string;
  status: 'pending' | 'completed' | 'overdue';
  category: 'rh' | 'it' | 'manager' | 'employee';
  description?: string;
  created_at: string;
  updated_at: string;
  tenant_id?: string;
}

export interface OffboardingProcess {
  id: string;
  employee_id: string;
  employee_name: string;
  position: string;
  department: string;
  last_work_day: string;
  status: 'scheduled' | 'in_progress' | 'completed';
  progress: number;
  created_at: string;
  updated_at: string;
  tenant_id?: string;
}

export interface OffboardingTask {
  id: string;
  process_id: string;
  title: string;
  responsible: string;
  due_date: string;
  status: 'pending' | 'completed' | 'overdue';
  category: 'rh' | 'it' | 'manager' | 'employee';
  description?: string;
  created_at: string;
  updated_at: string;
  tenant_id?: string;
}

interface OnboardingData {
  onboardingProcesses: OnboardingProcess[];
  offboardingProcesses: OffboardingProcess[];
  onboardingTasks: OnboardingTask[];
  offboardingTasks: OffboardingTask[];
}

export function useOnboardingOffboarding() {
  const { userContext } = useAuthFilterContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const tenantId = userContext?.tenantId ?? null;

  // ============================================================
  // QUERY — chargement de toutes les données onboarding/offboarding
  // ============================================================
  const {
    data,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery<OnboardingData>({
    queryKey: ['onboarding', tenantId],
    queryFn: async () => {
      if (!userContext) {
        return {
          onboardingProcesses: [],
          offboardingProcesses: [],
          onboardingTasks: [],
          offboardingTasks: [],
        };
      }

      let onboardingQuery = supabase
        .from('onboarding_processes')
        .select('*')
        .order('created_at', { ascending: false });
      onboardingQuery = applyRoleFilters(onboardingQuery, userContext, 'onboarding_processes');

      let offboardingQuery = supabase
        .from('offboarding_processes')
        .select('*')
        .order('created_at', { ascending: false });
      offboardingQuery = applyRoleFilters(offboardingQuery, userContext, 'offboarding_processes');

      let onboardingTasksQuery = supabase.from('onboarding_tasks').select('*').order('due_date');
      onboardingTasksQuery = applyRoleFilters(
        onboardingTasksQuery,
        userContext,
        'onboarding_tasks'
      );

      let offboardingTasksQuery = supabase.from('offboarding_tasks').select('*').order('due_date');
      offboardingTasksQuery = applyRoleFilters(
        offboardingTasksQuery,
        userContext,
        'offboarding_tasks'
      );

      const [onboardingRes, offboardingRes, onboardingTasksRes, offboardingTasksRes] =
        await Promise.all([
          onboardingQuery,
          offboardingQuery,
          onboardingTasksQuery,
          offboardingTasksQuery,
        ]);

      if (onboardingRes.error) throw onboardingRes.error;
      if (offboardingRes.error) throw offboardingRes.error;
      if (onboardingTasksRes.error) throw onboardingTasksRes.error;
      if (offboardingTasksRes.error) throw offboardingTasksRes.error;

      return {
        onboardingProcesses: (onboardingRes.data as OnboardingProcess[]) || [],
        offboardingProcesses: (offboardingRes.data as OffboardingProcess[]) || [],
        onboardingTasks: (onboardingTasksRes.data as OnboardingTask[]) || [],
        offboardingTasks: (offboardingTasksRes.data as OffboardingTask[]) || [],
      };
    },
    enabled: !!userContext,
    ...CACHE_TTL.semiStatic,
  });

  const onboardingProcesses = data?.onboardingProcesses ?? [];
  const offboardingProcesses = data?.offboardingProcesses ?? [];
  const onboardingTasks = data?.onboardingTasks ?? [];
  const offboardingTasks = data?.offboardingTasks ?? [];
  const error = queryError ? (queryError as Error).message : null;

  // ============================================================
  // MUTATION — créer un processus d'onboarding
  // ============================================================
  const createOnboardingMutation = useMutation({
    mutationFn: async (data: Omit<OnboardingProcess, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('onboarding_processes').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Succès', description: "Processus d'onboarding créé avec succès" });
      queryClient.invalidateQueries({ queryKey: ['onboarding', tenantId] });
    },
    onError: (err: any) => {
      console.error('Error creating onboarding process:', err);
      toast({
        title: 'Erreur',
        description: "Impossible de créer le processus d'onboarding",
        variant: 'destructive',
      });
    },
  });

  const createOnboardingProcess = (data: Omit<OnboardingProcess, 'id' | 'created_at' | 'updated_at'>) =>
    createOnboardingMutation.mutate(data);

  // ============================================================
  // MUTATION — créer un processus d'offboarding
  // ============================================================
  const createOffboardingMutation = useMutation({
    mutationFn: async (data: Omit<OffboardingProcess, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('offboarding_processes').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Succès', description: "Processus d'offboarding créé avec succès" });
      queryClient.invalidateQueries({ queryKey: ['onboarding', tenantId] });
    },
    onError: (err: any) => {
      console.error('Error creating offboarding process:', err);
      toast({
        title: 'Erreur',
        description: "Impossible de créer le processus d'offboarding",
        variant: 'destructive',
      });
    },
  });

  const createOffboardingProcess = (data: Omit<OffboardingProcess, 'id' | 'created_at' | 'updated_at'>) =>
    createOffboardingMutation.mutate(data);

  // ============================================================
  // MUTATION — mettre à jour le statut d'une tâche
  // ============================================================
  const updateTaskMutation = useMutation({
    mutationFn: async ({
      taskId,
      status,
      isOnboarding,
    }: {
      taskId: string;
      status: 'pending' | 'completed' | 'overdue';
      isOnboarding: boolean;
    }) => {
      const table = isOnboarding ? 'onboarding_tasks' : 'offboarding_tasks';
      const { error } = await supabase.from(table).update({ status }).eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Succès', description: 'Statut de la tâche mis à jour' });
      queryClient.invalidateQueries({ queryKey: ['onboarding', tenantId] });
    },
    onError: (err: any) => {
      console.error('Error updating task status:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut de la tâche',
        variant: 'destructive',
      });
    },
  });

  const updateTaskStatus = (
    taskId: string,
    status: 'pending' | 'completed' | 'overdue',
    isOnboarding: boolean
  ) => updateTaskMutation.mutate({ taskId, status, isOnboarding });

  return {
    onboardingProcesses,
    offboardingProcesses,
    onboardingTasks,
    offboardingTasks,
    loading,
    error,
    refetch,
    createOnboardingProcess,
    createOffboardingProcess,
    updateTaskStatus,
  };
}
