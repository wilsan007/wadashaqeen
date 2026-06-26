/**
 * Hook: useOperationalActionTemplates
 * Gestion des templates d'actions (checklist) pour activités opérationnelles
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { CACHE_TTL } from '@/lib/queryConfig';

export interface OperationalActionTemplate {
  id: string;
  tenant_id: string;
  activity_id: string;
  title: string;
  description: string | null;
  position: number;
  assignee_id: string | null;
  assigned_name: string | null;
  inherit_assignee: boolean;
  estimated_hours: number;
  offset_days: number;
  created_at: string;
}

export function useOperationalActionTemplates(activityId?: string) {
  const { currentTenant } = useTenant();
  const queryClient = useQueryClient();

  // =====================================================
  // Query Key
  // =====================================================

  const queryKey = ['action-templates', activityId];

  // =====================================================
  // Fetch Templates via useQuery
  // =====================================================

  const {
    data: templates = [],
    isLoading: loading,
    error: queryError,
  } = useQuery<OperationalActionTemplate[]>({
    queryKey,
    queryFn: async () => {
      const { data, error: fetchError } = await supabase
        .from('operational_action_templates')
        .select('*')
        .eq('activity_id', activityId!)
        .order('position', { ascending: true });

      if (fetchError) throw fetchError;

      return data || [];
    },
    enabled: !!activityId,
    ...CACHE_TTL.semiStatic,
  });

  const error = queryError ? (queryError as Error).message : null;

  // =====================================================
  // Mutations
  // =====================================================

  const createMutation = useMutation({
    mutationFn: async (template: Partial<OperationalActionTemplate>) => {
      if (!currentTenant?.id) {
        throw new Error('Aucun tenant actif');
      }

      const insertData = {
        ...template,
        tenant_id: currentTenant.id,
        created_at: new Date().toISOString(),
      };

      const { data: newTemplate, error: insertError } = await supabase
        .from('operational_action_templates')
        .insert(insertData as any)
        .select()
        .single();

      if (insertError) throw insertError;

      return newTemplate;
    },
    onSuccess: (newTemplate) => {
      const targetActivityId = newTemplate?.activity_id || activityId;
      if (targetActivityId) {
        queryClient.invalidateQueries({ queryKey: ['action-templates', targetActivityId] });
      }
    },
    onError: (err: any) => {
      console.error('❌ Erreur createTemplate:', err);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<OperationalActionTemplate>;
    }) => {
      const { error: updateError } = await supabase
        .from('operational_action_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      return updates;
    },
    onSuccess: (_result, variables) => {
      const targetActivityId = variables.updates.activity_id || activityId;
      if (targetActivityId) {
        queryClient.invalidateQueries({ queryKey: ['action-templates', targetActivityId] });
      }
    },
    onError: (err: any) => {
      console.error(' Erreur updateTemplate:', err);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, targetActivityId }: { id: string; targetActivityId: string }) => {
      const { error: deleteError } = await supabase
        .from('operational_action_templates')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      return targetActivityId;
    },
    onSuccess: (targetActivityId) => {
      queryClient.invalidateQueries({ queryKey: ['action-templates', targetActivityId] });
    },
    onError: (err: any) => {
      console.error('❌ Erreur deleteTemplate:', err);
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async ({
      targetActivityId,
      orderedTemplates,
    }: {
      targetActivityId: string;
      orderedTemplates: OperationalActionTemplate[];
    }) => {
      const { error: updateError } = await supabase.from('operational_action_templates').upsert(
        orderedTemplates.map((template, index) => ({
          id: template.id,
          position: index,
        })) as any
      );

      if (updateError) throw updateError;

      return targetActivityId;
    },
    onSuccess: (targetActivityId) => {
      queryClient.invalidateQueries({ queryKey: ['action-templates', targetActivityId] });
    },
    onError: (err: any) => {
      console.error('❌ Erreur reorderTemplates:', err);
    },
  });

  // =====================================================
  // Fonctions exposées (compatibilité interface publique)
  // =====================================================

  const fetchTemplates = async (targetActivityId: string): Promise<OperationalActionTemplate[]> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('operational_action_templates')
        .select('*')
        .eq('activity_id', targetActivityId)
        .order('position', { ascending: true });

      if (fetchError) throw fetchError;

      const result = data || [];
      // Mettre à jour le cache React Query avec les données fraîches
      queryClient.setQueryData(['action-templates', targetActivityId], result);
      return result;
    } catch (err: any) {
      console.error(' Erreur fetchTemplates:', err);
      return [];
    }
  };

  const createTemplate = async (template: Partial<OperationalActionTemplate>) => {
    return createMutation.mutateAsync(template);
  };

  const updateTemplate = async (id: string, updates: Partial<OperationalActionTemplate>) => {
    return updateMutation.mutateAsync({ id, updates });
  };

  const deleteTemplate = async (id: string, targetActivityId: string) => {
    return deleteMutation.mutateAsync({ id, targetActivityId });
  };

  const reorderTemplates = async (
    targetActivityId: string,
    orderedTemplates: OperationalActionTemplate[]
  ) => {
    return reorderMutation.mutateAsync({ targetActivityId, orderedTemplates });
  };

  return {
    templates,
    loading,
    error,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    reorderTemplates,
  };
}
