// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
// Hooks optimisés avec cache intelligent et métriques
import { useTasks, type Task } from '@/hooks/optimized';
import { useProjects } from '@/hooks/optimized';
import { useEmployees } from '@/hooks/useEmployees';
import { useViewMode } from '@/contexts/ViewModeContext';
import { useIsMobile, useIsMobileLayout } from '@/hooks/use-mobile';
// import { MobileDynamicTable } from '../responsive/MobileDynamicTable';
import { TaskTableHeader } from './TaskTableHeader';
import { TaskTableBody } from './TaskTableBody';
import { TaskFixedColumns } from './TaskFixedColumns';
import { TaskActionColumns } from './TaskActionColumns';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { TaskDetailDialog } from '@/components/tasks/TaskDetailDialog';
import { ModernTaskCreationDialog } from '@/components/tasks/ModernTaskCreationDialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ProjectTableView } from '../projects/ProjectTableView';
import { AdvancedFilters, type TaskFilters } from '@/components/tasks/AdvancedFilters';
import { useTaskFilters } from '@/hooks/useTaskFilters';

interface DynamicTableProps {
  demoTasks?: Task[];
  isDemoMode?: boolean;
}

const DynamicTable = ({ demoTasks, isDemoMode = false }: DynamicTableProps = {}) => {
  const {
    tasks: realTasks,
    loading,
    error,
    duplicateTask,
    deleteTask,
    toggleAction,
    addActionColumn,
    addDetailedAction,
    createSubTask,
    createSubTaskWithActions,
    updateTaskAssignee,
    refetch,
    createTask,
    updateTask,
  } = useTasks();

  // Utiliser demoTasks si en mode démo, sinon utiliser les vraies tâches
  const tasks = isDemoMode && demoTasks ? demoTasks : realTasks;
  const isMobile = useIsMobile(); // Pour les modales (< 768px)
  const isMobileLayout = useIsMobileLayout(); // Pour l'UI (< 1024px)
  const { projects, loading: projectsLoading, error: projectsError } = useProjects();
  const { employees } = useEmployees();

  // Wrapper pour createMainTask avec compatibilité ancienne API
  const createMainTask = async (taskData: {
    title: string;
    assignee: string;
    department: string;
    project: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'todo' | 'doing' | 'blocked' | 'done';
    effort_estimate_h: number;
  }) => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    return createTask({
      title: taskData.title,
      description: '',
      status: taskData.status,
      priority: taskData.priority,
      start_date: today.toISOString().split('T')[0],
      due_date: nextWeek.toISOString().split('T')[0],
    });
  };
  const { defaultDisplayMode } = useViewMode();

  const [newActionTitle, setNewActionTitle] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'tasks' | 'projects'>(defaultDisplayMode);
  const [optimisticTasks, setOptimisticTasks] = useState<Task[]>([]);
  const [filters, setFilters] = useState<TaskFilters>({
    search: '',
    status: [],
    priority: [],
    assignee: [],
    project: [],
    dateFrom: '',
    dateTo: '',
  });

  // Appliquer les filtres
  const { filteredTasks, stats } = useTaskFilters(optimisticTasks, filters);

  // Refs pour la synchronisation du scroll
  const fixedColumnsScrollRef = useRef<HTMLDivElement>(null);
  const actionColumnsScrollRef = useRef<HTMLDivElement>(null);
  const isSyncingScroll = useRef(false);

  // Synchroniser les tâches optimistes avec les vraies tâches
  useEffect(() => {
    setOptimisticTasks(tasks);
    // Vérifier si les actions sont chargées
  }, [tasks]);

  // Fonction de synchronisation du scroll robuste
  const syncScroll = useCallback((source: 'fixed' | 'action') => {
    const fixed = fixedColumnsScrollRef.current;
    const action = actionColumnsScrollRef.current;

    if (!fixed || !action) return;

    const target = source === 'fixed' ? action : fixed;
    const sourceEl = source === 'fixed' ? fixed : action;

    // Synchroniser seulement si la différence est significative (> 1px)
    // Cela évite les boucles infinies car l'événement de scroll déclenché par la mise à jour
    // aura une différence de 0 (ou très proche)
    if (Math.abs(target.scrollTop - sourceEl.scrollTop) > 1) {
      target.scrollTop = sourceEl.scrollTop;
    }
  }, []);

  const handleAddActionColumn = async () => {
    if (newActionTitle.trim() && selectedTaskId && addActionColumn) {
      try {
        await addActionColumn(newActionTitle.trim(), selectedTaskId);
        setNewActionTitle('');
        setSelectedTaskId(undefined);
        if (refetch) await refetch(); // Rafraîchir les données après l'ajout
      } catch (error) {
        console.error('Error adding action column:', error);
      }
    }
  };

  const handleCreateDetailedAction = async (actionData: {
    title: string;
    weight_percentage: number;
    due_date?: string;
    notes?: string;
  }) => {
    if (!selectedTaskId || !addDetailedAction) return;

    try {
      await addDetailedAction(selectedTaskId, actionData);
      if (refetch) await refetch(); // Rafraîchir les données après l'ajout
    } catch (error) {
      console.error('Error creating detailed action:', error);
    }
  };

  const handleToggleAction = async (taskId: string, actionId: string) => {
    if (!toggleAction) return;
    try {
      // Mise à jour optimiste : on met à jour l'interface immédiatement
      const updatedTasks = optimisticTasks.map(task => {
        if (task.id === taskId && task.task_actions) {
          const updatedActions = task.task_actions.map(action =>
            action.id === actionId ? { ...action, is_done: !action.is_done } : action
          );

          // Calculer la nouvelle progression
          const totalWeight = updatedActions.reduce(
            (sum, action) => sum + action.weight_percentage,
            0
          );
          const completedWeight = updatedActions
            .filter(action => action.is_done)
            .reduce((sum, action) => sum + action.weight_percentage, 0);

          const newProgress =
            totalWeight === 0 ? 0 : Math.round((completedWeight / totalWeight) * 100);

          // Calculer le nouveau statut
          let newStatus = task.status;
          if (newProgress === 100) {
            newStatus = 'done';
          } else if (newProgress > 0) {
            newStatus = 'doing';
          } else {
            newStatus = 'todo';
          }

          return {
            ...task,
            task_actions: updatedActions,
            progress: newProgress,
            status: newStatus as any,
          };
        }
        return task;
      });

      setOptimisticTasks(updatedTasks);

      // Ensuite on fait la vraie mise à jour
      await toggleAction(taskId, actionId);
      // La subscription temps réel synchronisera automatiquement
    } catch (error) {
      console.error('Error in handleToggleAction:', error);
      // En cas d'erreur, on refetch pour revenir à l'état correct
      if (refetch) await refetch();
    }
  };

  const handleDuplicateTask = (taskId: string) => {
    if (isDemoMode) {
      // En mode démo, afficher un message informatif
      const toast = require('@/hooks/use-toast').toast;
      toast({
        title: '🎨 Mode Découverte',
        description: 'Ces données sont fictives. Créez votre première vraie tâche pour commencer!',
      });
      return;
    }
    if (duplicateTask) duplicateTask(taskId);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (isDemoMode) {
      // En mode démo, afficher un message informatif
      const toast = require('@/hooks/use-toast').toast;
      toast({
        title: '🎨 Mode Découverte',
        description: 'Ces données sont fictives. Créez votre première vraie tâche pour commencer!',
      });
      return;
    }
    if (deleteTask) {
      await deleteTask(taskId);
      if (refetch) await refetch();
    }
  };

  const handleEditTask = (taskId: string) => {
    const task = optimisticTasks.find(t => t.id === taskId);
    if (task) {
      setTaskToEdit(task);
      setEditDialogOpen(true);
    }
  };

  const handleCreateMainTask = async (taskData: {
    title: string;
    assignee: string;
    department: string;
    project: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'todo' | 'doing' | 'blocked' | 'done';
    effort_estimate_h: number;
  }) => {
    try {
      await createMainTask(taskData);
      if (refetch) await refetch(); // Recharger les données
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      throw error;
    }
  };

  const handleCreateSubtask = async (
    parentId: string,
    linkedActionId?: string,
    customData?: {
      title: string;
      start_date: string;
      due_date: string;
      effort_estimate_h: number;
    }
  ) => {
    if (!createSubTask) return;
    try {
      await createSubTask(parentId, linkedActionId, customData);

      // Rafraîchir les données immédiatement après la création
      if (refetch) await refetch();
    } catch (error) {
      console.error('Error creating subtask:', error);
    }
  };

  const handleCreateSubtaskWithActions = async (
    parentId: string,
    customData: {
      title: string;
      start_date: string;
      due_date: string;
      effort_estimate_h: number;
    },
    actions: Array<{
      id: string;
      title: string;
      weight_percentage: number;
      due_date?: string;
      notes?: string;
    }>
  ) => {
    if (!createSubTaskWithActions) return;
    try {
      await createSubTaskWithActions(parentId, customData, actions);

      // Rafraîchir les données immédiatement après la création
      if (refetch) await refetch();
    } catch (error) {
      console.error('Error creating subtask with actions:', error);
    }
  };

  const handleUpdateAssignee = async (taskId: string, assignee: string) => {
    if (!updateTaskAssignee) return;
    try {
      await updateTaskAssignee(taskId, assignee);
      if (refetch) await refetch();
    } catch (error) {
      console.error('Error updating assignee:', error);
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    if (isDemoMode) {
      return; // Mode démo : pas de mise à jour
    }

    try {
      // Mise à jour optimiste
      setOptimisticTasks(prev =>
        prev.map(task => (task.id === taskId ? { ...task, ...updates } : task))
      );

      // Mise à jour réelle
      if (updateTask) await updateTask(taskId, updates);
    } catch (error) {
      console.error('Error updating task:', error);
      if (refetch) await refetch(); // Recharger en cas d'erreur
    }
  };

  const handleSelectTask = (taskId: string) => {
    setSelectedTaskId(taskId === selectedTaskId ? undefined : taskId);
  };

  const isActionButtonEnabled = !!(selectedTaskId && newActionTitle.trim());

  return (
    <Card className="modern-card glow-accent transition-smooth w-full">
      <TaskTableHeader
        newActionTitle={newActionTitle}
        setNewActionTitle={setNewActionTitle}
        onAddActionColumn={handleAddActionColumn}
        onCreateDetailedAction={handleCreateDetailedAction}
        selectedTaskId={selectedTaskId}
        isActionButtonEnabled={isActionButtonEnabled}
        onCreateTask={() => setCreateTaskDialogOpen(true)}
        tasks={filteredTasks}
        filters={filters}
      />

      {/* Boutons de basculement Projet/Tâches - Masqué sur mobile */}
      {!isMobileLayout && (
        <div className="px-6 pb-4">
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={value => value && setViewMode(value as 'tasks' | 'projects')}
            className="justify-start"
          >
            <ToggleGroupItem
              value="tasks"
              className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              📝 Tâches
            </ToggleGroupItem>
            <ToggleGroupItem
              value="projects"
              className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              📁 Projets
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      )}

      {/* Filtres avancés - uniquement en mode Tâches */}
      {viewMode === 'tasks' && (
        <div className="px-6 pb-4">
          <AdvancedFilters
            onFiltersChange={setFilters}
            projects={projects}
            employees={employees}
            totalTasks={optimisticTasks.length}
            filteredCount={filteredTasks.length}
          />
        </div>
      )}
      <CardContent className={`bg-gantt-header/20 backdrop-blur-sm ${isMobile ? 'p-0' : ''}`}>
        {viewMode === 'tasks' ? (
          <ResizablePanelGroup
            direction="horizontal"
            className="border-border/50 overflow-hidden rounded-lg border"
          >
            <ResizablePanel defaultSize={60} minSize={40} maxSize={80}>
              <TaskFixedColumns
                tasks={filteredTasks}
                selectedTaskId={selectedTaskId}
                onSelectTask={handleSelectTask}
                onDuplicate={handleDuplicateTask}
                onDelete={handleDeleteTask}
                onEdit={handleEditTask}
                onCreateSubtask={handleCreateSubtask}
                onCreateSubtaskWithActions={handleCreateSubtaskWithActions}
                onUpdateAssignee={handleUpdateAssignee}
                onUpdateTask={handleUpdateTask}
                scrollRef={fixedColumnsScrollRef}
                onScroll={() => syncScroll('fixed')}
              />
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={40} minSize={20} maxSize={60}>
              <TaskActionColumns
                tasks={filteredTasks}
                onToggleAction={handleToggleAction}
                selectedTaskId={selectedTaskId}
                scrollRef={actionColumnsScrollRef}
                onScroll={() => syncScroll('action')}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <ProjectTableView
            projects={projects.map(p => ({
              id: p.id,
              name: p.name,
              status: p.status,
              progress: p.progress || 0,
              manager: p.manager_name || 'Non assigné',
              skills: [], // À implémenter avec une table séparée
              start_date: p.start_date || '',
              end_date: p.end_date || '',
            }))}
            tasks={optimisticTasks.map(t => ({
              id: t.id,
              title: t.title,
              project_id: t.project_id,
              project_name: t.project_name || '',
              progress: t.progress,
              assignee: t.assignee,
              status: t.status,
            }))}
          />
        )}
      </CardContent>

      {/* Dialog de modification de tâche */}
      <TaskDetailDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        task={taskToEdit}
        onSave={async taskData => {
          await updateTask(taskData);
          refetch();
          setTaskToEdit(null);
        }}
      />

      {/* Dialog de création de tâche */}
      <ModernTaskCreationDialog
        open={createTaskDialogOpen}
        onOpenChange={setCreateTaskDialogOpen}
        onCreateTask={handleCreateMainTask}
      />
    </Card>
  );
};

export default DynamicTable;
