/**
 * Hook Operational Tasks Enterprise - Pattern SaaS Leaders
 * Inspiré de useProjectsEnterprise - ZERO boucle infinie
 *
 * Fonctionnalités:
 * - Query-level filtering (sécurité maximale)
 * - Cache intelligent via react-query
 * - Pagination et lazy loading
 * - Métriques de performance
 * - Gestion d'erreurs robuste
 */

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/hooks/useTenant';
import { useRolesCompat as useUserRoles } from '@/contexts/RolesContext';
import { CACHE_TTL } from '@/lib/queryConfig';

// Type brut de la base de données
interface OperationalActivityRaw {
  id: string;
  name: string;
  description: string | null;
  kind: string; // Sera 'recurring' ou 'one_off' en pratique
  scope: string;
  department_id: string | null;
  owner_id: string | null;
  owner_employee_id: string | null;
  owner_name: string | null;
  project_id: string | null;
  task_title_template: string | null;
  one_off_date: string | null;
  is_active: boolean;
  tenant_id: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Type optimisé pour l'enterprise (après mapping)
export interface OperationalTask {
  id: string;
  name: string;
  description?: string | null;
  kind: 'recurring' | 'one_off';
  scope: 'org' | 'department' | 'team' | 'person';
  department_id?: string | null;
  owner_id?: string | null;
  owner_employee_id?: string | null;
  owner_name?: string | null;
  project_id?: string | null;
  task_title_template?: string | null;
  one_off_date?: string | null;
  is_active: boolean;
  tenant_id: string;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  // Ajouts pour compatibilité UI
  title: string; // Alias de 'name' - TOUJOURS présent après mapping
  status?: string;
  priority?: string;
  category?: string;
  assigned_to?: string | { id: string; full_name: string } | null;
  due_date?: string;
  department?: string;
  is_recurring?: boolean;
}

export interface OperationalTaskMetrics {
  fetchTime: number;
  cacheHit: boolean;
  dataSize: number;
  lastUpdate: Date;
}

export interface OperationalTaskPagination {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  totalPages: number;
}

export interface OperationalTaskFilters {
  status?: string[];
  priority?: string[];
  category?: string[];
  search?: string;
  isRecurring?: boolean;
}

export interface OperationalTasksData {
  tasks: OperationalTask[];
  totalCount: number;
  todoCount: number;
  inProgressCount: number;
  completedCount: number;
  recurringCount: number;
}

/**
 * Hook Operational Tasks Enterprise - STABLE
 */
export const useOperationalTasksEnterprise = (filters?: OperationalTaskFilters) => {
  const { toast } = useToast();
  const { tenantId } = useTenant();
  const { isLoading: rolesLoading, userRoles } = useUserRoles();
  const queryClient = useQueryClient();

  // Pagination state local (UI state — NE PAS migrer)
  const [pagination, setPagination] = useState<OperationalTaskPagination>({
    page: 1,
    limit: 50,
    total: 0,
    hasMore: false,
    totalPages: 0,
  });

  // Calcul stable de isSuperAdmin depuis userRoles
  const isSuperAdminValue = useMemo(() => {
    return userRoles.some(role => role.roles?.name === 'super_admin');
  }, [userRoles]);

  const enabled = !rolesLoading && (!!tenantId || isSuperAdminValue);

  // queryKey incluant les filtres (reactive)
  const queryKey = useMemo(
    () => ['operational-tasks', { tenantId, isSuperAdmin: isSuperAdminValue, filters, limit: pagination.limit }],
    [tenantId, isSuperAdminValue, filters, pagination.limit]
  );

  // useQuery principal
  const query = useQuery<OperationalTasksData>({
    queryKey,
    queryFn: async () => {
      const startTime = performance.now();

      // Construire la requête - utiliser la vraie table
      let q = supabase.from('operational_activities').select('*');

      // Filtrage par tenant
      if (!isSuperAdminValue && tenantId) {
        q = q.eq('tenant_id', tenantId);
      }

      // Appliquer les filtres (colonnes réelles de la table)
      if (filters?.search) {
        q = q.ilike('name', `%${filters.search}%`);
      }

      if (filters?.isRecurring !== undefined) {
        q = q.eq('kind', filters.isRecurring ? 'recurring' : 'one_off');
      }

      // Exécuter la requête
      const { data: rawActivities, error: fetchError } = await q
        .order('created_at', { ascending: false })
        .limit(pagination.limit);

      if (fetchError) throw fetchError;

      // Mapper les activités
      const tasksData: OperationalTask[] = (rawActivities || []).map(
        (activity: OperationalActivityRaw) => ({
          ...activity,
          kind: activity.kind as 'recurring' | 'one_off',
          scope: activity.scope as 'org' | 'department' | 'team' | 'person',
          title: activity.name,
          is_recurring: activity.kind === 'recurring',
          status: activity.is_active ? 'active' : 'inactive',
          assigned_to: activity.owner_name || null,
          due_date: activity.one_off_date || undefined,
        })
      );

      const newData: OperationalTasksData = {
        tasks: tasksData,
        totalCount: tasksData.length,
        todoCount: tasksData.filter(t => !t.is_active).length,
        inProgressCount: tasksData.filter(t => t.is_active && t.kind === 'recurring').length,
        completedCount: 0,
        recurringCount: tasksData.filter(t => t.kind === 'recurring').length,
      };

      // Mettre à jour la pagination après fetch
      const endTime = performance.now();
      const fetchTime = endTime - startTime;
      const dataSize = JSON.stringify(newData).length;

      // Mise à jour pagination côté state (les valeurs sont stables)
      setPagination(prev => ({
        ...prev,
        total: newData.totalCount,
        totalPages: Math.ceil(newData.totalCount / prev.limit),
        hasMore: newData.totalCount > prev.limit,
      }));

      // Métriques attachées à la donnée retournée (accessible via query.data)
      (newData as any)._metrics = {
        fetchTime,
        cacheHit: false,
        dataSize,
        lastUpdate: new Date(),
      };

      return newData;
    },
    enabled,
    ...CACHE_TTL.semiStatic,
    placeholderData: (prev) => prev,
  });

  // Dériver les métriques depuis les données ou des valeurs par défaut
  const metrics: OperationalTaskMetrics = useMemo(() => {
    const m = (query.data as any)?._metrics;
    return m ?? {
      fetchTime: 0,
      cacheHit: false,
      dataSize: 0,
      lastUpdate: new Date(),
    };
  }, [query.data]);

  // Mutation — mettre à jour une activité
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: Partial<OperationalTask> }) => {
      // Mapper les updates vers les vraies colonnes
      const activityUpdates: any = {};
      if (updates.title) activityUpdates.name = updates.title;
      if (updates.name) activityUpdates.name = updates.name;
      if (updates.description !== undefined) activityUpdates.description = updates.description;
      if (updates.kind) activityUpdates.kind = updates.kind;
      if (updates.is_active !== undefined) activityUpdates.is_active = updates.is_active;

      const { error } = await supabase
        .from('operational_activities')
        .update(activityUpdates)
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operational-tasks'] });
    },
    onError: (error: any) => {
      console.error('Error updating operational activity:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour la tâche',
        variant: 'destructive',
      });
    },
  });

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['operational-tasks'] });
  }, [queryClient]);

  const updateTask = useCallback(
    async (taskId: string, updates: Partial<OperationalTask>) => {
      await updateTaskMutation.mutateAsync({ taskId, updates });
    },
    [updateTaskMutation]
  );

  // Permissions
  const canAccess = isSuperAdminValue || !!tenantId;

  const data = query.data ?? {
    tasks: [],
    totalCount: 0,
    todoCount: 0,
    inProgressCount: 0,
    completedCount: 0,
    recurringCount: 0,
  };

  const CACHE_TTL_MS = 5 * 60 * 1000;

  return {
    // Données
    ...data,

    // États
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,

    // Métriques de performance
    metrics,
    pagination,

    // Permissions
    canAccess,
    isSuperAdmin: isSuperAdminValue,

    // Actions
    refresh,
    updateTask,

    // Utilitaires
    isDataStale: metrics.lastUpdate && Date.now() - metrics.lastUpdate.getTime() > CACHE_TTL_MS,
    cacheKey: JSON.stringify(queryKey),
  };
};
