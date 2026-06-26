/**
 * Hook: useOperationalSchedules
 * Gestion des planifications (RRULE) pour activités récurrentes
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { CACHE_TTL } from '@/lib/queryConfig';

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

export function useOperationalSchedules(activityId?: string) {
  const { currentTenant } = useTenant();
  const queryClient = useQueryClient();

  // =====================================================
  // Query Key
  // =====================================================

  const queryKey = ['operational-schedules', activityId];

  // =====================================================
  // Fetch Schedule via useQuery (une seule planification par activité)
  // =====================================================

  const {
    isLoading: queryLoading,
    error: queryError,
  } = useQuery<OperationalSchedule | null>({
    queryKey,
    queryFn: async () => {
      const { data, error: fetchError } = await supabase
        .from('operational_schedules')
        .select('*')
        .eq('activity_id', activityId!)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      return data ?? null;
    },
    enabled: !!activityId,
    ...CACHE_TTL.semiStatic,
  });

  const loading = queryLoading;
  const error = queryError ? (queryError as Error).message : null;

  // =====================================================
  // Mutations
  // =====================================================

  const upsertMutation = useMutation({
    mutationFn: async (schedule: Partial<OperationalSchedule>) => {
      if (!currentTenant?.id) {
        throw new Error('Aucun tenant actif');
      }

      // Injecter tenant_id automatiquement
      const scheduleWithTenant = {
        ...schedule,
        tenant_id: currentTenant.id,
      };

      const { data, error: upsertError } = await supabase
        .from('operational_schedules')
        .upsert(scheduleWithTenant as any)
        .select()
        .single();

      if (upsertError) throw upsertError;

      return data;
    },
    onSuccess: (data) => {
      const targetActivityId = data?.activity_id || activityId;
      if (targetActivityId) {
        queryClient.invalidateQueries({ queryKey: ['operational-schedules', targetActivityId] });
      }
    },
    onError: (err: any) => {
      console.error('❌ Erreur upsertSchedule:', err);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (targetActivityId: string) => {
      const { error: deleteError } = await supabase
        .from('operational_schedules')
        .delete()
        .eq('activity_id', targetActivityId);

      if (deleteError) throw deleteError;

      return targetActivityId;
    },
    onSuccess: (targetActivityId) => {
      queryClient.invalidateQueries({ queryKey: ['operational-schedules', targetActivityId] });
    },
    onError: (err: any) => {
      console.error('❌ Erreur deleteSchedule:', err);
    },
  });

  // =====================================================
  // Fonctions exposées (compatibilité interface publique)
  // =====================================================

  const getSchedule = async (targetActivityId: string): Promise<OperationalSchedule | null> => {
    // Récupérer depuis le cache si disponible, sinon fetch direct
    const cached = queryClient.getQueryData<OperationalSchedule | null>([
      'operational-schedules',
      targetActivityId,
    ]);
    if (cached !== undefined) {
      return cached;
    }

    const { data, error: fetchError } = await supabase
      .from('operational_schedules')
      .select('*')
      .eq('activity_id', targetActivityId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ Erreur getSchedule:', fetchError);
      return null;
    }

    return data ?? null;
  };

  const upsertSchedule = async (schedule: Partial<OperationalSchedule>) => {
    return upsertMutation.mutateAsync(schedule);
  };

  const deleteSchedule = async (targetActivityId: string) => {
    return deleteMutation.mutateAsync(targetActivityId);
  };

  return {
    loading,
    error,
    getSchedule,
    upsertSchedule,
    deleteSchedule,
  };
}
