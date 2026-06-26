import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { applyRoleFilters } from '@/lib/roleBasedFiltering';
import { CACHE_TTL } from '@/lib/queryConfig';

export interface AlertType {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  auto_trigger_conditions?: any;
  created_at: string;
  tenant_id?: string;
}

export interface AlertSolution {
  id: string;
  title: string;
  description: string;
  action_steps?: any;
  effectiveness_score: number;
  implementation_time: 'immediate' | 'short_term' | 'long_term';
  required_roles?: string[];
  cost_level: 'low' | 'medium' | 'high';
  category: string;
  created_at: string;
  tenant_id?: string;
}

export interface AlertInstance {
  id: string;
  alert_type_id: string;
  title: string;
  description?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
  entity_type?: string;
  entity_id?: string;
  entity_name?: string;
  context_data?: any;
  triggered_at: string;
  acknowledged_at?: string;
  resolved_at?: string;
  resolved_by?: string;
  tenant_id?: string;
  created_at: string;
  updated_at: string;
  alert_type?: AlertType;
  recommendations?: AlertInstanceRecommendation[];
}

export interface AlertInstanceRecommendation {
  id: string;
  alert_instance_id: string;
  solution_id: string;
  recommended_score?: number;
  is_primary: boolean;
  tenant_id?: string;
  created_at: string;
  solution?: AlertSolution;
}

export const useAlerts = () => {
  const queryClient = useQueryClient();

  // 🔒 Contexte utilisateur pour le filtrage
  const { userContext } = useAuth();

  // --- Fetch alert types ---
  const {
    data: alertTypes = [],
    isLoading: loadingTypes,
    error: errorTypes,
  } = useQuery<AlertType[]>({
    queryKey: ['alerts', 'types', userContext?.tenantId],
    queryFn: async () => {
      if (!userContext) return [];
      let query = supabase.from('alert_types').select('*').order('created_at', { ascending: false });
      query = applyRoleFilters(query, userContext, 'alert_types');
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as AlertType[];
    },
    enabled: !!userContext,
    ...CACHE_TTL.realtime,
  });

  // --- Fetch alert solutions ---
  const {
    data: alertSolutions = [],
    isLoading: loadingSolutions,
    error: errorSolutions,
  } = useQuery<AlertSolution[]>({
    queryKey: ['alerts', 'solutions', userContext?.tenantId],
    queryFn: async () => {
      if (!userContext) return [];
      let query = supabase
        .from('alert_solutions')
        .select('*')
        .order('effectiveness_score', { ascending: false });
      query = applyRoleFilters(query, userContext, 'alert_solutions');
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as AlertSolution[];
    },
    enabled: !!userContext,
    ...CACHE_TTL.realtime,
  });

  // --- Fetch alert instances ---
  const {
    data: alertInstances = [],
    isLoading: loadingInstances,
    error: errorInstances,
    refetch: refetchInstances,
  } = useQuery<AlertInstance[]>({
    queryKey: ['alerts', 'instances', userContext?.tenantId],
    queryFn: async () => {
      if (!userContext) return [];
      let query = supabase
        .from('alert_instances')
        .select(
          `
          *,
          alert_type:alert_types(*),
          recommendations:alert_instance_recommendations(
            *,
            solution:alert_solutions(*)
          )
        `
        )
        .order('triggered_at', { ascending: false });
      query = applyRoleFilters(query, userContext, 'alert_instances');
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as AlertInstance[];
    },
    enabled: !!userContext,
    ...CACHE_TTL.realtime,
  });

  const loading = loadingTypes || loadingSolutions || loadingInstances;
  const firstError = errorTypes || errorSolutions || errorInstances;
  const error = firstError ? (firstError as Error).message : null;

  const refetchAll = async () => {
    await queryClient.invalidateQueries({ queryKey: ['alerts'] });
  };

  // --- Mutation: create alert instance ---
  const createAlertInstanceMutation = useMutation({
    mutationFn: async (alertData: Omit<AlertInstance, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('alert_instances')
        .insert([alertData])
        .select()
        .single();
      if (error) throw error;
      // Calculer les recommandations automatiquement
      await supabase.rpc('calculate_alert_recommendations', {
        p_alert_instance_id: data.id,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts', 'instances'] });
    },
  });

  const createAlertInstance = async (
    alertData: Omit<AlertInstance, 'id' | 'created_at' | 'updated_at'>
  ) => {
    return createAlertInstanceMutation.mutateAsync(alertData);
  };

  // --- Mutation: update alert status ---
  const updateAlertStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      resolvedBy,
    }: {
      id: string;
      status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
      resolvedBy?: string;
    }) => {
      const updates: any = {
        status,
        updated_at: new Date().toISOString(),
      };
      if (status === 'acknowledged') {
        updates.acknowledged_at = new Date().toISOString();
      } else if (status === 'resolved') {
        updates.resolved_at = new Date().toISOString();
        if (resolvedBy) {
          updates.resolved_by = resolvedBy;
        }
      }
      const { error } = await supabase.from('alert_instances').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts', 'instances'] });
    },
  });

  const updateAlertStatus = async (
    id: string,
    status: 'active' | 'acknowledged' | 'resolved' | 'dismissed',
    resolvedBy?: string
  ) => {
    return updateAlertStatusMutation.mutateAsync({ id, status, resolvedBy });
  };

  const getActiveAlerts = () => {
    return alertInstances.filter(alert => alert.status === 'active');
  };

  const getHighPriorityAlerts = () => {
    return alertInstances.filter(
      alert =>
        alert.status === 'active' && (alert.severity === 'high' || alert.severity === 'critical')
    );
  };

  const getAlertsByCategory = (category: string) => {
    return alertInstances.filter(alert => alert.alert_type?.category === category);
  };

  const initializeAlertData = async () => {
    // Vérifier si des données existent déjà
    const { data: existingTypes } = await supabase.from('alert_types').select('id').limit(1);

    if (existingTypes && existingTypes.length > 0) {
      return;
    }

    // Insérer les types d'alertes
    const alertTypesToInsert = [
      {
        code: 'WORKLOAD_HIGH',
        name: 'Surcharge de travail',
        description: 'Employé avec une charge de travail excessive',
        category: 'capacity',
        severity: 'high',
      },
      {
        code: 'ABSENCE_PATTERN',
        name: "Pattern d'absences anormal",
        description: 'Augmentation significative des absences',
        category: 'hr',
        severity: 'medium',
      },
      {
        code: 'PERFORMANCE_DROP',
        name: 'Baisse de performance',
        description: 'Diminution notable des performances',
        category: 'performance',
        severity: 'medium',
      },
      {
        code: 'DEADLINE_RISK',
        name: "Risque d'échéance",
        description: 'Projet en retard ou à risque',
        category: 'project',
        severity: 'high',
      },
      {
        code: 'TEAM_TURNOVER',
        name: "Rotation d'équipe élevée",
        description: 'Turnover anormalement élevé',
        category: 'hr',
        severity: 'critical',
      },
      // ... Ajouter les 45 autres types d'alertes
    ];

    await supabase.from('alert_types').insert(alertTypesToInsert);

    // Insérer les solutions
    const solutionsToInsert = [
      {
        title: 'Redistribution des tâches',
        description: "Répartir les tâches vers d'autres membres",
        category: 'capacity',
        implementation_time: 'immediate',
        effectiveness_score: 85,
      },
      {
        title: "Planification d'entretien individuel",
        description: 'Organiser un entretien pour comprendre les causes',
        category: 'hr',
        implementation_time: 'short_term',
        effectiveness_score: 75,
      },
      {
        title: 'Formation ciblée',
        description: 'Proposer une formation adaptée aux besoins',
        category: 'performance',
        implementation_time: 'long_term',
        effectiveness_score: 70,
      },
      {
        title: 'Extension de délai',
        description: 'Négocier une extension du délai avec le client',
        category: 'project',
        implementation_time: 'immediate',
        effectiveness_score: 60,
      },
      {
        title: 'Plan de rétention',
        description: "Mise en place d'un plan de rétention des talents",
        category: 'hr',
        implementation_time: 'long_term',
        effectiveness_score: 80,
      },
      // ... Ajouter les 90 autres solutions
    ];

    await supabase.from('alert_solutions').insert(solutionsToInsert);

    await refetchAll();
  };

  return {
    alertTypes,
    alertSolutions,
    alertInstances,
    loading,
    error,
    refetch: refetchAll,
    createAlertInstance,
    updateAlertStatus,
    getActiveAlerts,
    getHighPriorityAlerts,
    getAlertsByCategory,
    initializeAlertData,
  };
};
