import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CACHE_TTL } from '@/lib/queryConfig';

export interface TaskDetailsData {
  id: string;
  title: string;
  description: string | null;
  acceptance_criteria: string | null;
  status: string;
  priority: string;
  progress: number | null;
  start_date: string;
  due_date: string;
  effort_estimate_h: number | null;
  effort_spent_h: number | null;
  budget: number | null;
  task_level: number | null;
  assignee_id: string | null;
  department_id: string | null;
  project_id: string | null;
  parent_id: string | null;
}

export interface TaskComment {
  id: string;
  content: string;
  comment_type: string | null;
  created_at: string;
  author_id: string | null;
}

export interface TaskSubtask {
  id: string;
  title: string;
  status: string;
  progress: number | null;
  effort_estimate_h: number | null;
}

export interface TaskRisk {
  id: string;
  risk_description: string;
  impact: string;
  probability: string;
  status: string;
  mitigation_plan: string | null;
}

export interface TaskDependencyInfo {
  id: string | null;
  dependency_type: string | null;
  depends_on_task_id: string | null;
  predecessor_title: string | null;
  predecessor_status: string | null;
  predecessor_start: string | null;
  predecessor_end: string | null;
}

export interface DepartmentInfo {
  id: string;
  name: string;
  description: string | null;
  budget: number | null;
}

export interface UseTaskDetailsResult {
  taskDetails: TaskDetailsData | null;
  subtasks: TaskSubtask[];
  comments: TaskComment[];
  risks: TaskRisk[];
  dependencies: TaskDependencyInfo[];
  department: DepartmentInfo | null;
  totalEffort: number;
  participants: string[];
  isLoading: boolean;
  isError: boolean;
}

export function useTaskDetails(taskId: string | null | undefined): UseTaskDetailsResult {
  // ─── Task principal ──────────────────────────────────────────────────────
  const taskQuery = useQuery({
    queryKey: ['task-details', taskId],
    queryFn: async () => {
      if (!taskId) return null;
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();
      if (error) throw error;
      return data as TaskDetailsData;
    },
    enabled: !!taskId,
    ...CACHE_TTL.realtime,
  });

  // ─── Sous-tâches ─────────────────────────────────────────────────────────
  const subtasksQuery = useQuery({
    queryKey: ['task-subtasks', taskId],
    queryFn: async () => {
      if (!taskId) return [];
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, status, progress, effort_estimate_h')
        .eq('parent_id', taskId)
        .order('display_order');
      if (error) throw error;
      return (data ?? []) as TaskSubtask[];
    },
    enabled: !!taskId,
    ...CACHE_TTL.realtime,
  });

  // ─── Commentaires ────────────────────────────────────────────────────────
  const commentsQuery = useQuery({
    queryKey: ['task-comments', taskId],
    queryFn: async () => {
      if (!taskId) return [];
      const { data, error } = await supabase
        .from('task_comments')
        .select('id, content, comment_type, created_at, author_id')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []) as TaskComment[];
    },
    enabled: !!taskId,
    ...CACHE_TTL.realtime,
  });

  // ─── Risques ─────────────────────────────────────────────────────────────
  const risksQuery = useQuery({
    queryKey: ['task-risks', taskId],
    queryFn: async () => {
      if (!taskId) return [];
      const { data, error } = await supabase
        .from('task_risks')
        .select('id, risk_description, impact, probability, status, mitigation_plan')
        .eq('task_id', taskId);
      if (error) throw error;
      return (data ?? []) as TaskRisk[];
    },
    enabled: !!taskId,
    ...CACHE_TTL.realtime,
  });

  // ─── Dépendances (via vue enrichie) ──────────────────────────────────────
  const depsQuery = useQuery({
    queryKey: ['task-dependencies', taskId],
    queryFn: async () => {
      if (!taskId) return [];
      const { data, error } = await supabase
        .from('v_task_dependencies_info')
        .select(
          'id, dependency_type, depends_on_task_id, predecessor_title, predecessor_status, predecessor_start, predecessor_end',
        )
        .eq('task_id', taskId);
      if (error) throw error;
      return (data ?? []) as TaskDependencyInfo[];
    },
    enabled: !!taskId,
    ...CACHE_TTL.realtime,
  });

  // ─── Département ─────────────────────────────────────────────────────────
  const departmentId = taskQuery.data?.department_id ?? null;
  const deptQuery = useQuery({
    queryKey: ['department', departmentId],
    queryFn: async () => {
      if (!departmentId) return null;
      const { data, error } = await supabase
        .from('departments')
        .select('id, name, description, budget')
        .eq('id', departmentId)
        .single();
      if (error) throw error;
      return data as DepartmentInfo;
    },
    enabled: !!departmentId,
    ...CACHE_TTL.semiStatic,
  });

  // ─── Dérivations ─────────────────────────────────────────────────────────
  const subtasks = subtasksQuery.data ?? [];
  const taskData = taskQuery.data ?? null;

  const totalEffort =
    (taskData?.effort_estimate_h ?? 0) +
    subtasks.reduce((sum, s) => sum + (s.effort_estimate_h ?? 0), 0);

  // Participants : assignee du parent + assignees des sous-tâches (dédupliqués par nom)
  const participants: string[] = [];
  if (taskData?.assignee_id) participants.push(taskData.assignee_id);

  const isLoading =
    taskQuery.isLoading ||
    subtasksQuery.isLoading ||
    commentsQuery.isLoading ||
    risksQuery.isLoading ||
    depsQuery.isLoading;

  const isError =
    taskQuery.isError ||
    subtasksQuery.isError ||
    commentsQuery.isError ||
    risksQuery.isError ||
    depsQuery.isError;

  return {
    taskDetails: taskData,
    subtasks,
    comments: commentsQuery.data ?? [],
    risks: risksQuery.data ?? [],
    dependencies: depsQuery.data ?? [],
    department: deptQuery.data ?? null,
    totalEffort,
    participants,
    isLoading,
    isError,
  };
}
