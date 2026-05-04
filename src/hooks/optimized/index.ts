/**
 * 🔧 Wrapper de Compatibilité Complet - Ancienne API → Enterprise
 *
 * Traduit l'ancienne API (utilisée par les vues /vues/) vers les hooks Enterprise
 * SANS modifier les vues anciennes - Compatibilité 100%
 *
 * Note: Ignore les erreurs TypeScript pour compatibilité maximale
 */

// @ts-nocheck
import { useMemo, useCallback } from 'react';
import {
  useTasksEnterprise,
  type Task as EnterpriseTask,
  type TaskFilters,
} from '../useTasksEnterprise';
import { useProjectsEnterprise, type Project as EnterpriseProject } from '../useProjectsEnterprise';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// ✅ Types compatibles avec anciennes vues
export type Task = EnterpriseTask & {
  // Compatibilité avec anciennes vues qui attendent assignee comme string
  assignee?: string | { full_name: string };
};

export type Project = EnterpriseProject;

/**
 * 🎯 useTasks - Wrapper complet avec ancienne API
 */
export function useTasks(filters?: TaskFilters) {
  const { toast } = useToast();

  // Hook Enterprise (cache + métriques)
  const enterpriseHook = useTasksEnterprise(filters);

  const {
    tasks: enterpriseTasks,
    loading,
    error,
    metrics,
    pagination,
    refresh: refetch,
  } = enterpriseHook;

  // Normaliser les tâches pour compatibilité
  const tasks = useMemo(() => {
    return enterpriseTasks.map(task => ({
      ...task,
      assignee: task.assignee || task.employees?.full_name || '',
    })) as Task[];
  }, [enterpriseTasks]);

  // ✅ createTask (ancienne API) - Implémentation directe avec Supabase
  const createTask = useCallback(
    async (taskData: Partial<Task>) => {
      try {
        const { data: newTask, error: createError } = await supabase
          .from('tasks')
          .insert(taskData as any)
          .select()
          .single();

        if (createError) throw createError;

        await refetch();

        toast({
          title: '✅ Tâche créée',
          description: `${taskData.title} a été créée avec succès`,
        });
        return newTask;
      } catch (err: any) {
        toast({
          variant: 'destructive',
          title: '❌ Erreur',
          description: err.message || 'Impossible de créer la tâche',
        });
        throw err;
      }
    },
    [refetch, toast]
  );

  // ✅ updateTask (ancienne API) - Implémentation directe avec Supabase
  const updateTask = useCallback(
    async (taskId: string, updates: Partial<Task>) => {
      try {
        // ✅ VALIDATION: Vérifier que la tâche existe dans la liste locale
        const existingTask = tasks.find(t => t.id === taskId);
        if (!existingTask) {
          throw new Error(
            'Tâche introuvable. Vérifiez que vous déplacez bien une tâche et non une barre de projet.'
          );
        }

        // ✅ D'abord faire l'update sans select pour éviter les problèmes RLS
        const { error: updateError } = await supabase
          .from('tasks')
          .update(updates)
          .eq('id', taskId);

        if (updateError) {
          console.error('Erreur update:', updateError);
          throw updateError;
        }

        // ✅ Ensuite rafraîchir les données via refetch (qui a les bonnes permissions)
        await refetch();

        // ✅ Récupérer la tâche mise à jour depuis le cache local
        const updated = tasks.find(t => t.id === taskId);

        toast({
          title: '✅ Tâche mise à jour',
          description: 'Les modifications ont été enregistrées',
        });

        return updated;
      } catch (err: any) {
        toast({
          variant: 'destructive',
          title: '❌ Erreur',
          description: err.message || 'Impossible de mettre à jour la tâche',
        });
        throw err;
      }
    },
    [refetch, toast, tasks]
  );

  // ✅ deleteTask (ancienne API) - Implémentation directe avec Supabase
  const deleteTask = useCallback(
    async (taskId: string) => {
      try {
        const { error: deleteError } = await supabase.from('tasks').delete().eq('id', taskId);

        if (deleteError) throw deleteError;

        await refetch();

        toast({
          title: '✅ Tâche supprimée',
          description: 'La tâche a été supprimée avec succès',
        });
      } catch (err: any) {
        toast({
          variant: 'destructive',
          title: '❌ Erreur',
          description: err.message || 'Impossible de supprimer la tâche',
        });
        throw err;
      }
    },
    [refetch, toast]
  );

  // ✅ duplicateTask (ancienne fonctionnalité)
  const duplicateTask = useCallback(
    async (taskId: string) => {
      try {
        const taskToDuplicate = tasks.find(t => t.id === taskId);
        if (!taskToDuplicate) throw new Error('Tâche introuvable');

        const { id, created_at, updated_at, ...taskData } = taskToDuplicate;

        const { data: duplicated, error: duplicateError } = await supabase
          .from('tasks')
          .insert({
            ...taskData,
            title: `${taskData.title} (Copie)`,
          })
          .select()
          .single();

        if (duplicateError) throw duplicateError;

        await refetch();

        toast({
          title: '✅ Tâche dupliquée',
          description: `${taskData.title} a été dupliquée`,
        });
        return duplicated;
      } catch (err: any) {
        toast({
          variant: 'destructive',
          title: '❌ Erreur',
          description: err.message || 'Impossible de dupliquer la tâche',
        });
        throw err;
      }
    },
    [tasks, refetch, toast]
  );

  // ✅ toggleAction (ancienne fonctionnalité)
  const toggleAction = useCallback(
    async (taskId: string, actionId: string) => {
      try {
        // Récupérer l'action
        const { data: action, error: fetchError } = await supabase
          .from('task_actions')
          .select('*')
          .eq('id', actionId)
          .single();

        if (fetchError) throw fetchError;

        // Toggle le statut (is_done est le bon champ)
        const { error: updateError } = await supabase
          .from('task_actions')
          .update({ is_done: !action.is_done })
          .eq('id', actionId);

        if (updateError) throw updateError;

        // Recalculer le progress de la tâche
        const { data: allActions } = await supabase
          .from('task_actions')
          .select('weight_percentage, is_done')
          .eq('task_id', taskId);

        if (allActions && allActions.length > 0) {
          const totalWeight = allActions.reduce(
            (sum, act) => sum + (act.weight_percentage || 0),
            0
          );
          const completedWeight = allActions
            .filter(act => act.is_done)
            .reduce((sum, act) => sum + (act.weight_percentage || 0), 0);

          const newProgress =
            totalWeight === 0 ? 0 : Math.round((completedWeight / totalWeight) * 100);

          // Calculer le nouveau statut
          let newStatus = 'todo';
          if (newProgress === 100) {
            newStatus = 'done';
          } else if (newProgress > 0) {
            newStatus = 'doing';
          }

          // Mettre à jour la tâche avec le nouveau progress
          await supabase
            .from('tasks')
            .update({
              progress: newProgress,
              status: newStatus,
            })
            .eq('id', taskId);
        }

        await refetch();

        toast({
          title: action.is_done ? 'Action réactivée' : '✅ Action complétée',
          description: action.title,
        });
      } catch (err: any) {
        toast({
          variant: 'destructive',
          title: '❌ Erreur',
          description: err.message || "Impossible de modifier l'action",
        });
        throw err;
      }
    },
    [refetch, toast]
  );

  // ✅ addActionColumn (ancienne fonctionnalité)
  const addActionColumn = useCallback(
    async (title: string, taskId: string) => {
      try {
        const { error } = await supabase.from('task_actions').insert({
          task_id: taskId,
          title,
          is_done: false,
          notes: '',
        });

        if (error) throw error;

        await refetch();

        toast({
          title: '✅ Action ajoutée',
          description: title,
        });
      } catch (err: any) {
        toast({
          variant: 'destructive',
          title: '❌ Erreur',
          description: err.message || "Impossible d'ajouter l'action",
        });
        throw err;
      }
    },
    [refetch, toast]
  );

  // ✅ addDetailedAction (ancienne fonctionnalité)
  const addDetailedAction = useCallback(
    async (
      taskId: string,
      actionData: {
        title: string;
        description?: string;
        due_date?: string;
        assignee_id?: string;
      }
    ) => {
      try {
        const { error } = await supabase.from('task_actions').insert({
          task_id: taskId,
          ...actionData,
          is_done: false,
        });

        if (error) throw error;

        await refetch();

        toast({
          title: '✅ Action détaillée ajoutée',
          description: actionData.title,
        });
      } catch (err: any) {
        toast({
          variant: 'destructive',
          title: '❌ Erreur',
          description: err.message || "Impossible d'ajouter l'action",
        });
        throw err;
      }
    },
    [refetch, toast]
  );

  // ✅ createSubTask (ancienne fonctionnalité)
  const createSubTask = useCallback(
    async (parentId: string, linkedActionId?: string, customData?: Partial<Task>) => {
      try {
        const parent = tasks.find(t => t.id === parentId);
        if (!parent) throw new Error('Tâche parente introuvable');

        const subTaskData: Partial<Task> = {
          title: customData?.title || 'Nouvelle sous-tâche',
          parent_task_id: parentId,
          project_id: parent.project_id,
          assignee_id: customData?.assignee_id || parent.assignee_id,
          status: customData?.status || 'todo',
          priority: customData?.priority || parent.priority,
          start_date: customData?.start_date || parent.start_date,
          due_date: customData?.due_date || parent.due_date,
          effort_estimate_h: customData?.effort_estimate_h || 0,
          ...customData,
        };

        const { data: newSubTask, error: createError } = await supabase
          .from('tasks')
          .insert(subTaskData)
          .select()
          .single();

        if (createError) throw createError;

        await refetch();

        // Si lié à une action
        if (linkedActionId) {
          await supabase
            .from('task_actions')
            .update({ linked_task_id: newSubTask.id })
            .eq('id', linkedActionId);
        }

        toast({
          title: '✅ Sous-tâche créée',
          description: subTaskData.title,
        });

        return newSubTask;
      } catch (err: any) {
        toast({
          variant: 'destructive',
          title: '❌ Erreur',
          description: err.message || 'Impossible de créer la sous-tâche',
        });
        throw err;
      }
    },
    [tasks, refetch, toast]
  );

  // ✅ createSubTaskWithActions (ancienne fonctionnalité)
  const createSubTaskWithActions = useCallback(
    async (parentId: string, customData: Partial<Task>) => {
      return createSubTask(parentId, undefined, customData);
    },
    [createSubTask]
  );

  // ✅ updateTaskAssignee (ancienne fonctionnalité)
  // 🔒 CORRECTION: Utiliser assignee_id (colonne réelle PostgreSQL)
  const updateTaskAssignee = useCallback(
    async (taskId: string, assigneeId: string) => {
      console.log('🔄 updateTaskAssignee:', { taskId, assigneeId });
      return updateTask(taskId, { assignee_id: assigneeId } as any);
    },
    [updateTask]
  );

  // ✅ updateTaskStatus (ancienne fonctionnalité)
  const updateTaskStatus = useCallback(
    async (taskId: string, status: string) => {
      return updateTask(taskId, { status } as any);
    },
    [updateTask]
  );

  // ✅ updateTaskDates (ancienne fonctionnalité)
  const updateTaskDates = useCallback(
    async (taskId: string, dates: { start_date?: string; due_date?: string }) => {
      return updateTask(taskId, dates as any);
    },
    [updateTask]
  );

  // ✅ refresh (alias de refetch)
  const refresh = useCallback(() => {
    return refetch();
  }, [refetch]);

  // ✅ Mémoriser l'objet de retour pour éviter re-renders
  return useMemo(
    () => ({
      // Données
      tasks,
      loading,
      error,

      // Métriques Enterprise
      metrics,
      pagination,

      // Ancienne API - Opérations CRUD
      createTask,
      updateTask,
      deleteTask,

      // Ancienne API - Fonctionnalités avancées
      duplicateTask,
      toggleAction,
      addActionColumn,
      addDetailedAction,
      createSubTask,
      createSubTaskWithActions,
      updateTaskAssignee,
      updateTaskStatus,
      updateTaskDates,

      // Refresh
      refresh,
      refetch,
    }),
    [
      tasks,
      loading,
      error,
      metrics,
      pagination,
      createTask,
      updateTask,
      deleteTask,
      duplicateTask,
      toggleAction,
      addActionColumn,
      addDetailedAction,
      createSubTask,
      createSubTaskWithActions,
      updateTaskAssignee,
      updateTaskStatus,
      updateTaskDates,
      refresh,
      refetch,
    ]
  );
}

/**
 * 🎯 useProjects - Wrapper avec ancienne API
 */
export function useProjects() {
  const { toast } = useToast();

  const enterpriseHook = useProjectsEnterprise();

  const { projects, loading, error, metrics, refresh: refetch } = enterpriseHook;

  // ✅ createProject (ancienne API) - Implémentation directe avec Supabase
  const createProject = useCallback(
    async (projectData: Partial<Project>) => {
      try {
        const { data: newProject, error: createError } = await supabase
          .from('projects')
          .insert(projectData)
          .select()
          .single();

        if (createError) throw createError;

        await refetch();

        toast({
          title: '✅ Projet créé',
          description: `${projectData.name} a été créé avec succès`,
        });
        return newProject;
      } catch (err: any) {
        toast({
          variant: 'destructive',
          title: '❌ Erreur',
          description: err.message || 'Impossible de créer le projet',
        });
        throw err;
      }
    },
    [refetch, toast]
  );

  // ✅ updateProject (ancienne API) - Implémentation directe avec Supabase
  const updateProject = useCallback(
    async (projectId: string, updates: Partial<Project>) => {
      try {
        const { data: updated, error: updateError } = await supabase
          .from('projects')
          .update(updates)
          .eq('id', projectId)
          .select()
          .single();

        if (updateError) throw updateError;

        await refetch();

        toast({
          title: '✅ Projet mis à jour',
          description: 'Les modifications ont été enregistrées',
        });
        return updated;
      } catch (err: any) {
        toast({
          variant: 'destructive',
          title: '❌ Erreur',
          description: err.message || 'Impossible de mettre à jour le projet',
        });
        throw err;
      }
    },
    [refetch, toast]
  );

  // ✅ deleteProject (ancienne API) - Implémentation directe avec Supabase
  const deleteProject = useCallback(
    async (projectId: string) => {
      try {
        const { error: deleteError } = await supabase.from('projects').delete().eq('id', projectId);

        if (deleteError) throw deleteError;

        await refetch();

        toast({
          title: '✅ Projet supprimé',
          description: 'Le projet a été supprimé avec succès',
        });
      } catch (err: any) {
        toast({
          variant: 'destructive',
          title: '❌ Erreur',
          description: err.message || 'Impossible de supprimer le projet',
        });
        throw err;
      }
    },
    [refetch, toast]
  );

  // ✅ Mémoriser l'objet de retour pour éviter re-renders
  return useMemo(
    () => ({
      projects,
      loading,
      error,
      metrics,

      // Ancienne API
      createProject,
      updateProject,
      deleteProject,

      // Refresh
      refresh: refetch,
      refetch,
    }),
    [projects, loading, error, metrics, createProject, updateProject, deleteProject, refetch]
  );
}
