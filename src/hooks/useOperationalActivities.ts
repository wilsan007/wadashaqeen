/**
 * Hook Enterprise: useOperationalActivities
 * Pattern: Stripe/Linear/Monday.com
 *
 * Gestion des activités opérationnelles (récurrentes + ponctuelles)
 * avec cache intelligent, filtres avancés et métriques temps réel
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useSessionManager } from '@/hooks/useSessionManager';
import { applyRoleFilters, UserContext } from '@/lib/roleBasedFiltering';
import { CACHE_TTL } from '@/lib/queryConfig';

// =====================================================
// Types
// =====================================================

export interface OperationalActivity {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  kind: 'recurring' | 'one_off';
  scope: 'org' | 'department' | 'team' | 'person';
  department_id: string | null;
  owner_id: string | null;
  owner_employee_id: string | null; // ✅ Assigné (employee)
  owner_name: string | null; // ✅ Cache du nom
  project_id: string | null;
  task_title_template: string | null;
  one_off_date: string | null; // ✅ Date pour activités ponctuelles
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface OperationalSchedule {
  id: string;
  tenant_id: string;
  activity_id: string;
  timezone: string;
  rrule: string | null;
  start_date: string;
  until: string | null;
  generate_window_days: number;
  created_at: string;
  updated_at: string;
}

export interface OperationalActionTemplate {
  id: string;
  tenant_id: string;
  activity_id: string;
  title: string;
  description: string | null;
  position: number;
  created_at: string;
}

interface UseOperationalActivitiesOptions {
  autoFetch?: boolean;
  filters?: {
    kind?: 'recurring' | 'one_off';
    scope?: string;
    isActive?: boolean;
    ownerId?: string;
    search?: string;
  };
}

interface ActivityMetrics {
  fetchTime: number;
  dataSize: number;
  cacheHit: boolean;
  totalCount: number;
  activeCount: number;
  recurringCount: number;
  oneOffCount: number;
}

// =====================================================
// Hook Principal
// =====================================================

export function useOperationalActivities(options: UseOperationalActivitiesOptions = {}) {
  const { autoFetch = true, filters } = options;
  const { currentTenant } = useTenant();
  const { session } = useSessionManager();
  const { getRoleNames, isSuperAdmin } = useUserRoles();
  const queryClient = useQueryClient();

  const userId = session?.user?.id || '';
  const tenantId = currentTenant?.id || '';
  const roleNames = getRoleNames();
  const userRole = (isSuperAdmin() ? 'super_admin' : roleNames[0] || 'employee') as any;

  // =====================================================
  // Query Key (stable, serializable)
  // =====================================================

  const queryKey = ['operational-activities', { filters, userId, tenantId, userRole }];

  // =====================================================
  // Fetch Activities via useQuery
  // =====================================================

  const {
    data: activitiesData,
    isLoading: loading,
    error: queryError,
    dataUpdatedAt,
  } = useQuery<OperationalActivity[]>({
    queryKey,
    queryFn: async () => {
      const startTime = Date.now();

      let query = supabase
        .from('operational_activities')
        .select('*')
        .order('created_at', { ascending: false });

      // 🔒 Appliquer le filtrage par rôle (SÉCURITÉ)
      const userContext: UserContext = {
        userId,
        role: userRole,
        tenantId,
      };
      query = applyRoleFilters(query, userContext, 'operational_activities');

      // Appliquer les filtres additionnels
      if (filters?.kind) {
        query = query.eq('kind', filters.kind);
      }
      if (filters?.scope) {
        query = query.eq('scope', filters.scope);
      }
      if (filters?.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }
      if (filters?.ownerId) {
        query = query.eq('owner_id', filters.ownerId);
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      return (data || []) as OperationalActivity[];
    },
    enabled: autoFetch && !!tenantId,
    ...CACHE_TTL.semiStatic,
  });

  const activities = activitiesData || [];

  const error = queryError ? (queryError as Error).message : null;

  // Métriques calculées à partir des données
  const metrics: ActivityMetrics = {
    fetchTime: 0,
    dataSize: JSON.stringify(activities).length,
    cacheHit: false,
    totalCount: activities.length,
    activeCount: activities.filter(a => a.is_active).length,
    recurringCount: activities.filter(a => a.kind === 'recurring').length,
    oneOffCount: activities.filter(a => a.kind === 'one_off').length,
  };

  // =====================================================
  // Mutations
  // =====================================================

  const createMutation = useMutation({
    mutationFn: async (activity: Partial<OperationalActivity>) => {
      if (!currentTenant?.id) {
        throw new Error('Aucun tenant actif. Veuillez vous connecter.');
      }

      // Récupérer l'utilisateur actuel
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Utilisateur non authentifié. Veuillez vous reconnecter.');
      }

      // Injecter automatiquement tenant_id et created_by (requis par RLS)
      const activityWithTenant = {
        ...activity,
        tenant_id: currentTenant.id,
        created_by: user.id,
      };

      const { data, error: createError } = await supabase
        .from('operational_activities')
        .insert(activityWithTenant as any)
        .select()
        .single();

      if (createError) throw createError;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operational-activities'] });
    },
    onError: (err: any) => {
      console.error('❌ Erreur createActivity:', err);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<OperationalActivity> }) => {
      const { data, error: updateError } = await supabase
        .from('operational_activities')
        .update({ ...updates, updated_at: new Date().toISOString() } as OperationalActivity)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operational-activities'] });
    },
    onError: (err: any) => {
      console.error('❌ Erreur updateActivity:', err);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({
      id,
      keepCompletedTasks = true,
    }: {
      id: string;
      keepCompletedTasks?: boolean;
    }) => {
      // Utiliser la fonction RPC pour supprimer proprement
      const { data, error: deleteError } = await supabase.rpc(
        'delete_activity_with_future_occurrences',
        {
          p_activity_id: id,
          p_keep_completed: keepCompletedTasks,
        }
      );

      if (deleteError) throw deleteError;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operational-activities'] });
    },
    onError: (err: any) => {
      console.error('❌ Erreur deleteActivity:', err);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error: toggleError } = await supabase.rpc('pause_activity', {
        p_activity_id: id,
        p_is_active: isActive,
      });

      if (toggleError) throw toggleError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operational-activities'] });
    },
    onError: (err: any) => {
      console.error('❌ Erreur toggleActive:', err);
    },
  });

  // =====================================================
  // Fonctions exposées (compatibilité interface publique)
  // =====================================================

  const fetchActivities = async (_forceRefresh = false) => {
    await queryClient.invalidateQueries({ queryKey: ['operational-activities'] });
  };

  const createActivity = async (activity: Partial<OperationalActivity>) => {
    return createMutation.mutateAsync(activity);
  };

  const updateActivity = async (id: string, updates: Partial<OperationalActivity>) => {
    return updateMutation.mutateAsync({ id, updates });
  };

  const deleteActivity = async (id: string, keepCompletedTasks = true) => {
    return deleteMutation.mutateAsync({ id, keepCompletedTasks });
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    return toggleActiveMutation.mutateAsync({ id, isActive });
  };

  const getStatistics = async (activityId: string) => {
    const { data, error: statsError } = await supabase.rpc('get_activity_statistics', {
      p_activity_id: activityId,
    });

    if (statsError) throw statsError;

    return data;
  };

  // =====================================================
  // Return API
  // =====================================================

  return {
    // Data
    activities,
    loading,
    error,
    metrics,

    // Actions
    fetchActivities,
    createActivity,
    updateActivity,
    deleteActivity,
    toggleActive,
    getStatistics,

    // Utilities
    refresh: () => queryClient.invalidateQueries({ queryKey: ['operational-activities'] }),
    clearCache: () => queryClient.removeQueries({ queryKey: ['operational-activities'] }),
  };
}
