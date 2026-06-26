import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CACHE_TTL } from '@/lib/queryConfig';

export interface TaskHistoryEntry {
  id: string;
  action_type: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  changed_by?: string;
  changed_at: string;
  user_email?: string;
  metadata?: any;
}

export interface RecentActivity {
  task_id: string;
  task_title: string;
  action_type: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  changed_by?: string;
  changed_at: string;
  user_email?: string;
}

export const useTaskHistory = (taskId?: string) => {
  const queryClient = useQueryClient();

  // useQuery pour l'historique d'une tâche spécifique
  const historyQuery = useQuery<TaskHistoryEntry[]>({
    queryKey: ['task-history', taskId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_task_history', {
        p_task_id: taskId!,
      });
      if (error) throw error;
      return data || [];
    },
    enabled: !!taskId,
    ...CACHE_TTL.realtime,
  });

  // useQuery pour les activités récentes
  const recentActivitiesQuery = useQuery<RecentActivity[]>({
    queryKey: ['task-recent-activities'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_recent_task_activities', {
        p_limit: 50,
      });
      if (error) throw error;
      return data || [];
    },
    ...CACHE_TTL.realtime,
  });

  // useMutation pour enregistrer une modification
  const logTaskChangeMutation = useMutation({
    mutationFn: async ({
      taskId,
      actionType,
      fieldName,
      oldValue,
      newValue,
      metadata,
    }: {
      taskId: string;
      actionType: string;
      fieldName?: string;
      oldValue?: string;
      newValue?: string;
      metadata?: any;
    }) => {
      const { data, error } = await supabase.rpc('log_task_change', {
        p_task_id: taskId,
        p_action_type: actionType,
        p_field_name: fieldName,
        p_old_value: oldValue,
        p_new_value: newValue,
        p_metadata: metadata || {},
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-history', variables.taskId] });
    },
  });

  // supabase.channel() reste dans useEffect — NE PAS migrer
  useEffect(() => {
    if (!taskId) return;

    const channel = supabase
      .channel(`task_history_${taskId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_history',
          filter: `task_id=eq.${taskId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['task-history', taskId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId, queryClient]);

  // Formater le message d'historique pour l'affichage
  const formatHistoryMessage = (entry: TaskHistoryEntry): string => {
    const { action_type, field_name, old_value, new_value } = entry;

    switch (action_type) {
      case 'created':
        return 'Tâche créée';

      case 'deleted':
        return 'Tâche supprimée';

      case 'status_changed':
        return `Statut changé de "${old_value}" à "${new_value}"`;

      case 'updated':
        switch (field_name) {
          case 'title':
            return `Titre modifié: "${old_value}" → "${new_value}"`;
          case 'assigned_name':
            return `Responsable changé: "${old_value || 'Non assigné'}" → "${new_value || 'Non assigné'}"`;
          case 'priority':
            return `Priorité changée: "${old_value}" → "${new_value}"`;
          case 'start_date':
            return `Date de début modifiée: ${old_value} → ${new_value}`;
          case 'due_date':
            return `Date d'échéance modifiée: ${old_value} → ${new_value}`;
          case 'progress':
            return `Progression modifiée: ${old_value}% → ${new_value}%`;
          case 'effort_estimate_h':
            return `Charge estimée modifiée: ${old_value}h → ${new_value}h`;
          case 'description':
            return 'Description modifiée';
          default:
            return `${field_name} modifié: "${old_value}" → "${new_value}"`;
        }

      default:
        return `Action: ${action_type}`;
    }
  };

  // Obtenir l'icône pour le type d'action
  const getActionIcon = (actionType: string): string => {
    switch (actionType) {
      case 'created':
        return '✨';
      case 'deleted':
        return '🗑️';
      case 'status_changed':
        return '🔄';
      case 'updated':
        return '✏️';
      default:
        return '📝';
    }
  };

  // Obtenir la couleur pour le type d'action
  const getActionColor = (actionType: string): string => {
    switch (actionType) {
      case 'created':
        return 'text-green-600';
      case 'deleted':
        return 'text-red-600';
      case 'status_changed':
        return 'text-blue-600';
      case 'updated':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  const logTaskChange = async (
    taskId: string,
    actionType: string,
    fieldName?: string,
    oldValue?: string,
    newValue?: string,
    metadata?: any
  ) => {
    return logTaskChangeMutation.mutateAsync({
      taskId,
      actionType,
      fieldName,
      oldValue,
      newValue,
      metadata,
    });
  };

  const fetchTaskHistory = async (id: string) => {
    await queryClient.invalidateQueries({ queryKey: ['task-history', id] });
  };

  const fetchRecentActivities = async (_limit: number = 50) => {
    await queryClient.invalidateQueries({ queryKey: ['task-recent-activities'] });
  };

  return {
    history: historyQuery.data || [],
    recentActivities: recentActivitiesQuery.data || [],
    loading: historyQuery.isLoading || recentActivitiesQuery.isLoading,
    error: historyQuery.error
      ? (historyQuery.error as Error).message
      : recentActivitiesQuery.error
        ? (recentActivitiesQuery.error as Error).message
        : null,
    fetchTaskHistory,
    fetchRecentActivities,
    logTaskChange,
    formatHistoryMessage,
    getActionIcon,
    getActionColor,
  };
};

// Hook spécialisé pour les activités récentes globales
export const useRecentActivities = (limit: number = 50) => {
  const queryClient = useQueryClient();

  const query = useQuery<RecentActivity[]>({
    queryKey: ['task-recent-activities', limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_recent_task_activities', {
        p_limit: limit,
      });
      if (error) throw error;
      return data || [];
    },
    ...CACHE_TTL.realtime,
  });

  // supabase.channel() reste dans useEffect — NE PAS migrer
  useEffect(() => {
    const channel = supabase
      .channel('recent_activities')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_history',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['task-recent-activities', limit] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [limit, queryClient]);

  return {
    activities: query.data || [],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: () => query.refetch(),
  };
};
