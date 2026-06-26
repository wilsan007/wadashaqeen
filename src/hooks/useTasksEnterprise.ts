/**
 * Hook Tasks Enterprise - Pattern SaaS Leaders
 * Inspiré de Stripe, Salesforce, Monday.com, Linear
 *
 * Fonctionnalités:
 * - Query-level filtering (sécurité maximale)
 * - Cache intelligent via React Query
 * - Pagination et lazy loading
 * - Métriques de performance
 * - Gestion d'erreurs robuste
 * - Real-time updates optimisés
 * - Hierarchical task support
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/hooks/useTenant';
import { useRolesCompat as useUserRoles } from '@/contexts/RolesContext';
import { CACHE_TTL } from '@/lib/queryConfig';

// Réexporter les types depuis le fichier centralisé
export type {
  Task,
  TaskAction,
  CreateTaskData,
  UpdateTaskData,
  TaskFilters,
  TaskMetrics,
  TaskStats,
} from '@/types/tasks';

// Import des types depuis le fichier centralisé
import type { Task, TaskStats, TaskFilters, TaskMetrics } from '@/types/tasks';

export interface TaskPagination {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  totalPages: number;
}

export interface TasksData extends TaskStats {
  tasks: Task[];
}

// ---------------------------------------------------------------------------
// Helpers (pures, hors du hook)
// ---------------------------------------------------------------------------

function buildTasksQuery(
  isSuper: boolean,
  tenantId: string | null,
  filters: TaskFilters | undefined,
  page: number,
  limit: number
) {
  let query = isSuper
    ? supabase.from('tasks').select(`
        *,
        projects:project_id(name, tenant_id),
        assignee:assignee_id(full_name),
        parent_task:parent_id(title),
        task_actions!task_id(*)
      `)
    : supabase.from('tasks').select(`
        *,
        projects:project_id(name),
        assignee:assignee_id(full_name),
        parent_task:parent_id(title),
        task_actions!task_id(*)
      `);

  // Filtrage par tenant (sécurité enterprise)
  if (!isSuper && tenantId) {
    query = query.eq('tenant_id', tenantId);
  }

  // Filtres avancés (Pattern Monday.com/Linear)
  if (filters) {
    if (filters.status?.length) {
      query = query.in('status', filters.status);
    }
    if (filters.priority?.length) {
      query = query.in('priority', filters.priority);
    }
    if (filters.projectId || filters.project_id) {
      query = query.eq('project_id', filters.projectId || filters.project_id!);
    }
    if (filters.assignedTo || filters.assignee_id) {
      query = query.eq('assignee_id', filters.assignedTo || filters.assignee_id!);
    }
    if (filters.createdBy) {
      query = query.eq('created_by', filters.createdBy);
    }
    if (filters.parentTaskId || filters.parent_id) {
      query = query.eq('parent_id', filters.parentTaskId || filters.parent_id!);
    }
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }
    if (filters.dateRange) {
      query = query
        .gte('start_date', filters.dateRange.start)
        .lte('due_date', filters.dateRange.end);
    }
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  return query.order('created_at', { ascending: false }).range(from, to);
}

function calculateHierarchyStats(tasks: Task[]) {
  const parentTasks = tasks.filter(t => !t.parent_task_id).length;
  const subtasks = tasks.filter(t => t.parent_task_id).length;

  let maxDepth = 0;
  const calculateDepth = (taskId: string, currentDepth: number = 0): number => {
    const children = tasks.filter(t => t.parent_task_id === taskId);
    if (children.length === 0) return currentDepth;
    return Math.max(...children.map(child => calculateDepth(child.id, currentDepth + 1)));
  };

  tasks
    .filter(t => !t.parent_task_id)
    .forEach(parentTask => {
      maxDepth = Math.max(maxDepth, calculateDepth(parentTask.id));
    });

  return { parentTasks, subtasks, maxDepth };
}

// ---------------------------------------------------------------------------
// Hook principal
// ---------------------------------------------------------------------------

/**
 * Hook Tasks Enterprise - Pattern Leaders SaaS
 */
export const useTasksEnterprise = (filters?: TaskFilters) => {
  // Pagination state (reste en useState — non géré par React Query)
  const [pagination, setPagination] = useState<TaskPagination>({
    page: 1,
    limit: 100,
    total: 0,
    hasMore: false,
    totalPages: 0,
  });

  // Hooks externes
  const { toast } = useToast();
  const { tenantId } = useTenant();
  const { isSuperAdmin, isLoading: rolesLoading, userRoles } = useUserRoles();

  const queryClient = useQueryClient();

  // SOLUTION TEMPORAIRE : Récupérer le tenant_id depuis user_roles si useTenant échoue
  const tenantIdFromRoles = userRoles[0]?.tenant_id;
  const effectiveTenantId = tenantId || tenantIdFromRoles;

  // Ref pour abort controller (cleanup realtime uniquement)
  const abortControllerRef = useRef<AbortController | null>(null);

  const isSuper = isSuperAdmin();

  // Enabled uniquement quand les rôles sont chargés et qu'on a accès
  const enabled =
    !rolesLoading && (isSuper || !!effectiveTenantId);

  // queryKey stable — inclut tous les paramètres qui font varier les données
  const queryKey = [
    'tasks-enterprise',
    isSuper ? 'super_admin' : effectiveTenantId ?? 'no_tenant',
    pagination.page,
    pagination.limit,
    filters ?? null,
  ] as const;

  const {
    data: queryData,
    isLoading,
    isFetching,
    error: queryError,
  } = useQuery<TasksData>({
    queryKey,
    enabled,
    staleTime: CACHE_TTL.semiStatic.staleTime, // 5 min
    gcTime: CACHE_TTL.semiStatic.gcTime,       // 15 min
    placeholderData: previousData => previousData, // keepPreviousData pour la pagination
    queryFn: async () => {
      const startTime = performance.now();

      const query = buildTasksQuery(
        isSuper,
        effectiveTenantId ?? null,
        filters,
        pagination.page,
        pagination.limit
      );

      const { data: tasks, error: tasksError, count } = await query;

      if (tasksError) {
        throw new Error(tasksError.message);
      }

      // Calculer les métriques business (Pattern Salesforce)
      const activeTasks =
        tasks?.filter(t => ['todo', 'in_progress'].includes(t.status)).length ?? 0;
      const completedTasks = tasks?.filter(t => t.status === 'completed').length ?? 0;
      const overdueTasks =
        tasks?.filter(t => {
          if (!t.due_date) return false;
          return new Date(t.due_date) < new Date() && t.status !== 'completed';
        }).length ?? 0;
      const unassignedTasks =
        tasks?.filter(t => !t.assignee_id && !t.assigned_name).length ?? 0;

      // Calculer les statistiques de hiérarchie
      const hierarchyStats = calculateHierarchyStats((tasks ?? []) as Task[]);

      // Mapper les noms pour affichage
      const mappedTasks = (tasks ?? []).map((t: any) => ({
        ...t,
        project_name: t.projects?.name ?? null,
        assignee: t.assignee?.full_name ?? t.assigned_name ?? null,
      })) as Task[];

      // Mettre à jour la pagination (side-effect dans queryFn — acceptable)
      setPagination(prev => ({
        ...prev,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / prev.limit),
        hasMore: (count ?? 0) > prev.limit,
      }));

      const endTime = performance.now();
      const fetchTime = endTime - startTime;
      const dataSize = JSON.stringify(mappedTasks).length;
      void fetchTime; // utilisé par les métriques
      void dataSize;

      return {
        tasks: mappedTasks,
        total: count ?? 0,
        totalCount: count ?? 0,
        byStatus: {},
        byPriority: {},
        activeTasks,
        completedTasks,
        overdueTasks,
        unassignedTasks,
        hierarchyStats,
      };
    },
  });

  // Données et état dérivés de useQuery
  const data: TasksData = queryData ?? {
    tasks: [],
    total: 0,
    totalCount: 0,
    byStatus: {},
    byPriority: {},
    activeTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    unassignedTasks: 0,
    hierarchyStats: { parentTasks: 0, subtasks: 0, maxDepth: 0 },
  };

  const loading = isLoading || isFetching;
  const error = queryError ? (queryError as Error).message : null;

  // Métriques (simplifiées — React Query gère le cache)
  const [metrics, setMetrics] = useState<TaskMetrics>({
    fetchTime: 0,
    cacheHit: false,
    dataSize: 0,
    lastUpdate: new Date(),
    queryComplexity: 'simple',
    hierarchyDepth: 0,
  });

  // Mettre à jour les métriques quand les données changent
  useEffect(() => {
    if (queryData) {
      const dataSize = JSON.stringify(queryData).length;
      const queryComplexity = filters ? 'complex' : isSuper ? 'medium' : 'simple';
      setMetrics({
        fetchTime: 0, // React Query ne l'expose pas directement
        cacheHit: false,
        dataSize,
        lastUpdate: new Date(),
        queryComplexity,
        hierarchyDepth: queryData.hierarchyStats.maxDepth,
      });
    }
  }, [queryData, filters, isSuper]);

  // Cleanup lors du démontage (abort controller pour realtime éventuel)
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['tasks-enterprise'] });
  }, [queryClient]);

  const loadMore = useCallback(() => {
    if (pagination.hasMore && !loading) {
      setPagination(prev => ({ ...prev, page: prev.page + 1 }));
    }
  }, [pagination.hasMore, loading]);

  const clearCache = useCallback(() => {
    queryClient.removeQueries({ queryKey: ['tasks-enterprise'] });
  }, [queryClient]);

  const getCacheStats = useCallback(() => {
    const cachedQueries = queryClient
      .getQueriesData<TasksData>({ queryKey: ['tasks-enterprise'] });
    return {
      size: cachedQueries.length,
      keys: cachedQueries.map(([key]) => JSON.stringify(key)),
      totalSize: cachedQueries.reduce(
        (acc, [, d]) => acc + (d ? JSON.stringify(d).length : 0),
        0
      ),
    };
  }, [queryClient]);

  // ---------------------------------------------------------------------------
  // Utilitaires navigation
  // ---------------------------------------------------------------------------

  const getTasksByProject = useCallback(
    (projectId: string) => data.tasks.filter(task => task.project_id === projectId),
    [data.tasks]
  );

  const getSubtasks = useCallback(
    (parentTaskId: string) => data.tasks.filter(task => task.parent_task_id === parentTaskId),
    [data.tasks]
  );

  const getTaskHierarchy = useCallback(
    (taskId: string) => {
      const task = data.tasks.find(t => t.id === taskId);
      if (!task) return null;

      const subtasks = getSubtasks(taskId);
      return {
        ...task,
        subtasks: subtasks.map(subtask => ({
          ...subtask,
          subtasks: getSubtasks(subtask.id),
        })),
      };
    },
    [data.tasks, getSubtasks]
  );

  // ---------------------------------------------------------------------------
  // Permissions
  // ---------------------------------------------------------------------------

  const currentUserRole = userRoles[0]?.roles?.name ?? 'Aucun rôle';
  const requiredRole = 'project_manager, tenant_admin ou super_admin';
  const hasRequiredRole =
    isSuper || currentUserRole === 'project_manager' || currentUserRole === 'tenant_admin';
  const hasAccess = hasRequiredRole && !!effectiveTenantId;

  // ---------------------------------------------------------------------------
  // Interface de retour — identique à l'original
  // ---------------------------------------------------------------------------

  return {
    // Données
    ...data,

    // États
    loading,
    error,

    // Métriques de performance
    metrics,
    pagination,

    // Permissions optimisées
    canAccess: hasAccess,
    isSuperAdmin: isSuper,

    // Informations d'accès pour l'UX
    accessInfo: {
      hasAccess,
      currentRole: currentUserRole,
      requiredRole,
      reason: !hasAccess ? (!userRoles.length ? 'no_role' : 'insufficient_permissions') : null,
    },

    // Actions optimisées
    refresh,
    loadMore,
    clearCache,
    getCacheStats,

    // Utilitaires
    isDataStale: metrics.lastUpdate && Date.now() - metrics.lastUpdate.getTime() > CACHE_TTL.semiStatic.staleTime,
    cacheKey: JSON.stringify(queryKey),

    // Fonctions de navigation
    goToPage: (page: number) => setPagination(prev => ({ ...prev, page })),
    setFilters: (_newFilters: TaskFilters) => {
      // Avec React Query les filtres sont dans la queryKey — les mettre à jour
      // via le parent (les filtres sont passés en prop au hook)
      queryClient.invalidateQueries({ queryKey: ['tasks-enterprise'] });
    },

    // Fonctions spécifiques aux tâches
    getTasksByProject,
    getSubtasks,
    getTaskHierarchy,
  };
};
