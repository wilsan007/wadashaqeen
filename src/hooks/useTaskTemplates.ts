/**
 * useTaskTemplates - Hook pour gérer les templates de tâches
 * Pattern: Notion, Linear, ClickUp
 *
 * Fonctionnalités:
 * - CRUD templates (Create, Read, Update, Delete)
 * - Templates personnels + publics du tenant
 * - Catégorisation des templates
 * - Compteur d'utilisation
 * - Cache intelligent via react-query
 */

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/contexts/TenantContext';
import { CACHE_TTL } from '@/lib/queryConfig';

export interface TaskTemplateData {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'doing' | 'blocked' | 'done';
  effort_estimate_h?: number;
  actions?: Array<{
    title: string;
    weight_percentage: number;
    notes?: string;
  }>;
}

export interface TaskTemplate {
  id: string;
  tenant_id: string;
  created_by: string;
  name: string;
  description?: string;
  category?: string;
  template_data: TaskTemplateData;
  is_public: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

interface UseTaskTemplatesReturn {
  templates: TaskTemplate[];
  loading: boolean;
  error: Error | null;
  createTemplate: (
    template: Omit<
      TaskTemplate,
      'id' | 'tenant_id' | 'created_by' | 'usage_count' | 'created_at' | 'updated_at'
    >
  ) => Promise<TaskTemplate | null>;
  updateTemplate: (id: string, updates: Partial<TaskTemplate>) => Promise<boolean>;
  deleteTemplate: (id: string) => Promise<boolean>;
  incrementUsage: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useTaskTemplates = (): UseTaskTemplatesReturn => {
  const { toast } = useToast();
  const { currentTenant } = useTenant();
  const queryClient = useQueryClient();

  // useQuery pour charger les templates
  const query = useQuery<TaskTemplate[]>({
    queryKey: ['task-templates', currentTenant?.id],
    queryFn: async () => {
      if (!currentTenant?.id) return [];

      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        throw new Error('Non authentifié');
      }

      const { data, error } = await supabase
        .from('task_templates')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .or(`created_by.eq.${session.session.user.id},is_public.eq.true`)
        .order('usage_count', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentTenant?.id,
    ...CACHE_TTL.semiStatic,
  });

  // Mutation — créer un template
  const createMutation = useMutation({
    mutationFn: async (
      template: Omit<
        TaskTemplate,
        'id' | 'tenant_id' | 'created_by' | 'usage_count' | 'created_at' | 'updated_at'
      >
    ): Promise<TaskTemplate> => {
      if (!currentTenant?.id) throw new Error('Tenant non disponible');

      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('task_templates')
        .insert({
          tenant_id: currentTenant.id,
          created_by: session.session.user.id,
          name: template.name,
          description: template.description,
          category: template.category,
          template_data: template.template_data,
          is_public: template.is_public,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['task-templates'] });
      toast({
        title: '✅ Template créé',
        description: `"${data.name}" a été enregistré`,
      });
    },
    onError: () => {
      toast({
        title: '❌ Erreur',
        description: 'Impossible de créer le template',
        variant: 'destructive',
      });
    },
  });

  // Mutation — mettre à jour un template
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<TaskTemplate> }) => {
      const { error } = await supabase.from('task_templates').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-templates'] });
      toast({
        title: '✅ Template mis à jour',
        description: 'Les modifications ont été enregistrées',
      });
    },
    onError: () => {
      toast({
        title: '❌ Erreur',
        description: 'Impossible de mettre à jour le template',
        variant: 'destructive',
      });
    },
  });

  // Mutation — supprimer un template
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('task_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-templates'] });
      toast({
        title: '✅ Template supprimé',
        description: 'Le template a été supprimé',
      });
    },
    onError: () => {
      toast({
        title: '❌ Erreur',
        description: 'Impossible de supprimer le template',
        variant: 'destructive',
      });
    },
  });

  // Mutation — incrémenter le compteur d'utilisation
  const incrementUsageMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('increment_template_usage', { template_id: id });
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      // Optimistic update local sans refetch complet
      queryClient.setQueryData<TaskTemplate[]>(
        ['task-templates', currentTenant?.id],
        (prev) => prev?.map(t => t.id === id ? { ...t, usage_count: t.usage_count + 1 } : t) ?? []
      );
    },
    // Silencieux en cas d'erreur — pas critique
  });

  const createTemplate = useCallback(
    async (
      template: Omit<
        TaskTemplate,
        'id' | 'tenant_id' | 'created_by' | 'usage_count' | 'created_at' | 'updated_at'
      >
    ): Promise<TaskTemplate | null> => {
      try {
        return await createMutation.mutateAsync(template);
      } catch {
        return null;
      }
    },
    [createMutation]
  );

  const updateTemplate = useCallback(
    async (id: string, updates: Partial<TaskTemplate>): Promise<boolean> => {
      try {
        await updateMutation.mutateAsync({ id, updates });
        return true;
      } catch {
        return false;
      }
    },
    [updateMutation]
  );

  const deleteTemplate = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await deleteMutation.mutateAsync(id);
        return true;
      } catch {
        return false;
      }
    },
    [deleteMutation]
  );

  const incrementUsage = useCallback(
    async (id: string): Promise<void> => {
      try {
        await incrementUsageMutation.mutateAsync(id);
      } catch {
        // Silencieux
      }
    },
    [incrementUsageMutation]
  );

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['task-templates'] });
  }, [queryClient]);

  return {
    templates: query.data || [],
    loading: query.isLoading,
    error: query.error as Error | null,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    incrementUsage,
    refresh,
  };
};
