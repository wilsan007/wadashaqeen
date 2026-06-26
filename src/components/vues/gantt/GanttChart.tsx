import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
// Hooks optimisés avec cache intelligent et métriques
import { useTasks, type Task } from '@/hooks/optimized';
import { useProjects } from '@/hooks/optimized';
import { useIsMobile } from '@/hooks/use-mobile';
import { GanttHeader } from '../gantt/GanttHeader';
import { GanttTimeline } from '../gantt/GanttTimeline';
import { GanttLoadingState, GanttErrorState } from '../gantt/GanttStates';
// import { MobileGanttChart } from '../responsive/MobileGanttChart';
import { ProjectProgressBar } from '../gantt/ProjectProgressBar';
import { useGanttDrag } from '@/hooks/useGanttDrag';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { AdvancedFilters, type TaskFilters } from '@/components/tasks/AdvancedFilters';
import { useTaskFilters } from '@/hooks/useTaskFilters';
import { ExportButton } from '@/components/tasks/ExportButton';
// ✅ NOUVEAUX IMPORTS POUR GESTION D'ERREUR
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X } from '@/lib/icons';
import { useToast } from '@/hooks/use-toast';
import {
  ViewMode,
  GanttTask,
  getViewConfig,
  statusColors,
  getTotalUnits,
  ViewConfig,
} from '@/lib/ganttHelpers';
import { TaskDependency } from '@/types/taskDependencies';
import { CACHE_TTL } from '@/lib/queryConfig';
import { supabase } from '@/integrations/supabase/client';
import { assignProjectColors, getTaskColor, ProjectColorMap } from '@/lib/ganttColors';
import { useEmployees } from '@/hooks/useEmployees';
import { useRoleBasedAccess } from '@/hooks/useRoleBasedAccess';
import { useTranslation } from '@/hooks/useTranslation';

const GanttChart = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [yearBuffer, setYearBuffer] = useState<number>(5);

  const [displayMode, setDisplayMode] = useState<'tasks' | 'projects'>('tasks');
  const [filters, setFilters] = useState<TaskFilters>({
    search: '',
    status: [],
    priority: [],
    assignee: [],
    project: [],
    dateFrom: '',
    dateTo: '',
  });
  // ✅ État pour gérer les erreurs de mise à jour de dates
  const [dateUpdateError, setDateUpdateError] = useState<{
    message: string;
    details?: string;
    suggestion?: string;
  } | null>(null);

  // ✅ État pour suivre la tâche qui a causé l'erreur et ses dates originales
  const [errorTaskInfo, setErrorTaskInfo] = useState<{
    taskId: string;
    originalStartDate: Date;
    originalEndDate: Date;
  } | null>(null);


  const { tasks, loading, error, updateTaskDates, refresh } = useTasks();
  const {
    projects,
    loading: projectsLoading,
    updateProject,
    refresh: refreshProjects,
  } = useProjects();
  const { employees } = useEmployees();
  const { accessRights, isSuperAdmin, isTenantAdmin, isHRManager, isProjectManager } = useRoleBasedAccess();
  const isMobile = useIsMobile();

  const canSeeWorkload =
    accessRights.canManageEmployees ||
    accessRights.canManageAllTasks ||
    isSuperAdmin ||
    isTenantAdmin ||
    isHRManager ||
    isProjectManager;

  const overloadedTaskIds = React.useMemo(() => {
    const overloaded = new Set<string>();
    if (!canSeeWorkload || !employees.length || !tasks.length) return overloaded;

    const empMap = new Map();
    employees.forEach(e => {
      empMap.set(e.id, e);
      if (e.user_id) empMap.set(e.user_id, e);
      if (e.full_name) empMap.set(e.full_name, e);
    });

    tasks.forEach(task => {
      if (!task.assignee || !task.start_date || !task.due_date) return;
      const employee = empMap.get(task.assignee);
      if (!employee) return;

      const start = new Date(task.start_date);
      const end = new Date(task.due_date);
      const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

      const overlapping = tasks.filter(t => {
        if (t.assignee !== employee.full_name && t.assignee !== employee.id && t.assignee !== employee.user_id) return false;
        if (!t.start_date || !t.due_date) return false;
        const tStart = new Date(t.start_date);
        const tEnd = new Date(t.due_date);
        return tStart <= end && tEnd >= start;
      });

      const totalHours = overlapping.reduce((sum, t) => sum + (t.effort_estimate_h || 0), 0);
      const weeklyHours = employee.weekly_hours || 35;
      const availableHours = (weeklyHours / 7) * days;

      if (totalHours > availableHours) {
        overloaded.add(task.id);
      }
    });

    return overloaded;
  }, [tasks, employees, canSeeWorkload]);

  // Appliquer les filtres uniquement en mode tâches
  const { filteredTasks } = useTaskFilters(tasks, filters);

  // ─── Dépendances entre tâches ──────────────────────────────────────────────
  // IDs des tâches actuellement affichées (triés → clé de cache stable)
  const taskIds = React.useMemo(
    () =>
      (displayMode === 'tasks' ? filteredTasks.map(t => t.id) : projects.map(p => p.id)).sort(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [displayMode, filteredTasks.length, projects.length]
  );

  // Query TanStack v5 : fetch des dépendances pour les tâches visibles
  const { data: dependenciesData } = useQuery<TaskDependency[]>({
    queryKey: ['task-dependencies', taskIds.join(',')],
    queryFn: async () => {
      if (!taskIds.length) return [];
      const { data, error } = await supabase
        .from('task_dependencies')
        .select('id, task_id, depends_on_task_id, dependency_type, tenant_id, created_at, updated_at')
        .in('task_id', taskIds);
      if (error) throw error;
      // Mapper null → undefined pour aligner avec l'interface TaskDependency
      return (data ?? []).map(row => ({
        id: row.id,
        task_id: row.task_id,
        depends_on_task_id: row.depends_on_task_id,
        dependency_type: row.dependency_type,
        tenant_id: row.tenant_id ?? undefined,
        created_at: row.created_at,
        updated_at: row.updated_at ?? undefined,
      }));
    },
    enabled: taskIds.length > 0,
    ...CACHE_TTL.realtime,
  });

  const dependencies = dependenciesData ?? [];
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const taskListScrollRef = React.useRef<HTMLDivElement>(null);
  const timelineScrollRef = React.useRef<HTMLDivElement>(null);

  const config = getViewConfig(viewMode);
  const rowHeight = 60;

  // Créer le map de couleurs pour les projets
  const projectColorMap: ProjectColorMap = React.useMemo(() => {
    return assignProjectColors(projects);
  }, [projects]);

  // ⚡ Calculer la plage de dates AVANT de l'utiliser
  const calculateDateRange = () => {
    const items = displayMode === 'tasks' ? filteredTasks : projects;
    if (items.length === 0) {
      return {
        start: new Date(new Date().getFullYear(), 0, 1),
        end: new Date(new Date().getFullYear(), 11, 31),
      };
    }

    let minDate: Date | null = null;
    let maxDate: Date | null = null;

    items.forEach((item: any) => {
      const startDateStr = item.start_date;
      const endDateStr = item.due_date || item.end_date;

      if (!startDateStr || !endDateStr) return;

      const start = new Date(startDateStr);
      const end = new Date(endDateStr);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

      if (minDate === null || start < minDate) minDate = start;
      if (maxDate === null || end > maxDate) maxDate = end;
    });

    if (!minDate || !maxDate) {
      return {
        start: new Date(new Date().getFullYear(), 0, 1),
        end: new Date(new Date().getFullYear(), 11, 31),
      };
    }

    const startWithMargin = new Date(minDate);
    const endWithMargin = new Date(maxDate);

    // Ajustement de la marge selon la vue pour permettre de drag & drop plus loin
    if (viewMode === 'year') {
      startWithMargin.setFullYear(startWithMargin.getFullYear() - 1);
      endWithMargin.setFullYear(endWithMargin.getFullYear() + Math.max(1, yearBuffer)); // buffer dynamique
    } else if (viewMode === 'quarter') {
      startWithMargin.setMonth(startWithMargin.getMonth() - 2);
      endWithMargin.setMonth(endWithMargin.getMonth() + 24); // 2 ans max
    } else if (viewMode === 'month') {
      startWithMargin.setMonth(startWithMargin.getMonth() - 1);
      endWithMargin.setMonth(endWithMargin.getMonth() + 12); // 1 an max
    } else {
      startWithMargin.setMonth(startWithMargin.getMonth() - 1);
      endWithMargin.setMonth(endWithMargin.getMonth() + 1);
    }

    return { start: startWithMargin, end: endWithMargin };
  };

  const { start: startDate, end: endDate } = calculateDateRange();

  // ✅ Fonction pour remettre les barres à leur position originale (appelée par le hook)
  const resetTaskPositions = React.useCallback(async () => {
    // Forcer le rafraîchissement des données depuis Supabase
    if (displayMode === 'projects') {
      await refreshProjects();
    } else {
      await refresh();
    }

    // Animation visuelle après le refresh
    if (errorTaskInfo) {
      const { taskId } = errorTaskInfo;

      // Attendre que le DOM soit mis à jour après le refresh
      setTimeout(() => {
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`) as HTMLElement;
        if (taskElement) {
          // Flash visuel pour indiquer le reset
          taskElement.style.outline = '3px solid #ef4444';
          taskElement.style.transition = 'outline 0.3s ease-out';

          setTimeout(() => {
            taskElement.style.outline = '';
            setTimeout(() => {
              taskElement.style.transition = '';
            }, 300);
          }, 500);
        }
      }, 100);
    }
  }, [errorTaskInfo, refresh]);

  // ✅ Fonction wrapper pour gérer les erreurs de mise à jour de dates
  const handleUpdateTaskDates = async (taskId: string, startDate: string, endDate: string) => {
    try {
      setDateUpdateError(null); // Effacer les erreurs précédentes
      setErrorTaskInfo(null); // Effacer les infos de tâche en erreur

      // ✅ Mode Projets: Mettre à jour les dates du projet
      if (displayMode === 'projects') {
        const project = projects.find(p => p.id === taskId);
        if (project) {
          await updateProject(taskId, { start_date: startDate, end_date: endDate });
          return; // Mise à jour réussie
        } else {
          throw new Error(t('gantt.projectNotFound'));
        }
      }

      // ✅ Mode Tâches : VALIDATION: Vérifier que la tâche reste dans les limites du projet
      const task = tasks.find(t => t.id === taskId);
      if (task && task.project_id) {
        const project = projects.find(p => p.id === task.project_id);
        if (project && project.start_date && project.end_date) {
          const projectStart = new Date(project.start_date);
          const projectEnd = new Date(project.end_date);
          const newStart = new Date(startDate);
          const newEnd = new Date(endDate);

          // Vérifier si la tâche sort des limites du projet
          if (newStart < projectStart || newEnd > projectEnd) {
            throw new Error(
              `❌ ${t('gantt.taskMustStayInProject')}\n\n` +
              `📅 ${t('gantt.projectPeriod')}: ${projectStart.toLocaleDateString()} - ${projectEnd.toLocaleDateString()}\n` +
              `📅 ${t('gantt.requestedDates')}: ${newStart.toLocaleDateString()} - ${newEnd.toLocaleDateString()}\n\n` +
              `💡 ${t('gantt.moveTaskInProject')} "${project.name}"`
            );
          }
        }
      }

      if (!task) {
        throw new Error(t('gantt.taskNotFound'));
      }

      // ✅ CORRECTION : updateTaskDates attend un objet {start_date, due_date}
      await updateTaskDates(taskId, { start_date: startDate, due_date: endDate });
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour des dates:', error);

      // ✅ Sauvegarder les dates originales avant modification
      if (displayMode === 'projects') {
        const originalProject = projects.find(p => p.id === taskId);
        if (originalProject && originalProject.start_date && originalProject.end_date) {
          setErrorTaskInfo({
            taskId,
            originalStartDate: new Date(originalProject.start_date),
            originalEndDate: new Date(originalProject.end_date),
          });

          setTimeout(() => {
            resetTaskPositions();
          }, 100);
        }
      } else {
        const originalTask = tasks.find(t => t.id === taskId);
        if (originalTask) {
          setErrorTaskInfo({
            taskId,
            originalStartDate: new Date(originalTask.start_date),
            originalEndDate: new Date(originalTask.due_date),
          });

          // ✅ Remettre immédiatement la barre à sa position originale
          setTimeout(() => {
            resetTaskPositions();
          }, 100); // Petit délai pour laisser le DOM se mettre à jour
        }
      }

      // ✅ Parser l'erreur pour afficher un message utilisateur-friendly
      let errorMessage = 'Erreur lors de la mise à jour des dates';
      let errorDetails = '';
      let errorSuggestion = '';

      if (error?.message) {
        // Extraire les informations de l'erreur formatée
        const messageMatch = error.message.match(/❌ (.+?)\n\n/);
        if (messageMatch) {
          errorMessage = messageMatch[1];
        }

        const detailsMatch = error.message.match(/📅 (.+?)\n/);
        if (detailsMatch) {
          errorDetails = detailsMatch[1];
        }

        const suggestionMatch = error.message.match(/💡 (.+)/);
        if (suggestionMatch) {
          errorSuggestion = suggestionMatch[1];
        }
      }

      // ✅ Afficher l'erreur à l'utilisateur avec un toast
      toast({
        variant: 'destructive',
        title: '❌ ' + errorMessage,
        description: (
          <div className="mt-2 space-y-2">
            {errorDetails && <p className="text-sm">📅 {errorDetails}</p>}
            {errorSuggestion && <p className="text-sm font-medium">💡 {errorSuggestion}</p>}
            <p className="text-muted-foreground mt-2 text-xs">
              {t('gantt.barReset')}
            </p>
          </div>
        ),
        duration: 7000,
      });

      // Garder aussi la modal pour les cas où le toast n'est pas visible
      setDateUpdateError({
        message: errorMessage,
        details: errorDetails,
        suggestion: errorSuggestion,
      });

      // Fermeture automatique de la modal après 6 secondes
      setTimeout(() => {
        setDateUpdateError(null);
      }, 6000);
    }
  };

  // Synchroniser le scroll vertical entre la liste et la timeline
  const handleScroll = (source: 'list' | 'timeline') => (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;

    if (source === 'list' && timelineScrollRef.current) {
      timelineScrollRef.current.scrollTop = scrollTop;
    } else if (source === 'timeline' && taskListScrollRef.current) {
      taskListScrollRef.current.scrollTop = scrollTop;
    }
  };

  // Fonction helper pour rendre le header de la timeline
  const renderTimelineHeader = (start: Date, end: Date, viewConfig: ViewConfig) => {
    const totalUnits = getTotalUnits(start, end, viewConfig);
    const units = [];
    let currentDate = new Date(start);

    for (let i = 0; i < totalUnits; i++) {
      if (viewConfig.unitDuration === 30) {
        currentDate = new Date(start.getFullYear(), start.getMonth() + i, 1);
      } else {
        currentDate = new Date(start.getTime() + i * viewConfig.unitDuration * 24 * 60 * 60 * 1000);
      }

      units.push(
        <div
          key={i}
          className="border-gantt-grid text-foreground/70 flex h-full items-center justify-center border-r text-xs"
          style={{ minWidth: viewConfig.unitWidth }}
        >
          <div className="text-center">
            <div className="text-foreground font-medium">{viewConfig.getUnit(currentDate)}</div>
            <div className="text-foreground/60 text-xs opacity-60">
              {viewConfig.getSubUnit(currentDate)}
            </div>
          </div>
        </div>
      );
    }
    return units;
  };

  // Compter les tâches sans projet pour l'attribution des couleurs
  const tasksWithoutProject = React.useMemo(() => {
    return tasks.filter(t => !t.project_id);
  }, [tasks]);

  const getGanttTask = (task: Task, index: number): GanttTask => {
    // Obtenir la couleur selon le projet_id UNIQUEMENT
    const taskColor = getTaskColor(
      { project_id: task.project_id },
      projectColorMap,
      index,
      projects.length
    );

    return {
      id: task.id,
      name: task.title,
      startDate: new Date(task.start_date),
      endDate: new Date(task.due_date),
      progress: task.progress || 0,
      color: taskColor,
      assignee: task.assigned_name || t('gantt.unassigned'),
      priority: task.priority,
      status: task.status,
      project_id: task.project_id, // ✅ Uniquement project_id, pas project_name
      parent_id: task.parent_id, // ✅ ID de la tâche parente (si sous-tâche)
      isOverloaded: overloadedTaskIds.has(task.id),
    };
  };

  const getGanttProject = (project: any, index: number): GanttTask => {
    const projectColor = projectColorMap[project.id] || '#6b7280';

    return {
      id: project.id,
      name: project.name,
      startDate: project.start_date ? new Date(project.start_date) : new Date(),
      endDate: project.end_date ? new Date(project.end_date) : new Date(),
      progress: project.progress || 0,
      color: projectColor,
      assignee: project.manager_name || t('gantt.unassigned'),
      priority: project.priority || 'medium',
      status: project.status || 'planning',
      project_id: project.id,
    };
  };

  // Utiliser filteredTasks au lieu de tasks en mode tâches pour appliquer les filtres
  const ganttTasks =
    displayMode === 'tasks' ? filteredTasks.map(getGanttTask) : projects.map(getGanttProject);

  // Calculer les données des projets pour affichage dans le timeline
  const projectsData = React.useMemo(() => {
    if (displayMode !== 'tasks' || !ganttTasks.length) return [];

    const grouped = ganttTasks.reduce((groups: { [key: string]: typeof ganttTasks }, task) => {
      const projectKey = task.project_id || 'no-project';
      if (!groups[projectKey]) groups[projectKey] = [];
      groups[projectKey].push(task);
      return groups;
    }, {});

    return projects
      .filter(project => grouped[project.id] && project.start_date && project.end_date)
      .map(project => {
        const projectTasks = grouped[project.id];

        // ✅ Utiliser les vraies dates du projet depuis la base de données
        const projectStart = new Date(project.start_date!);
        const projectEnd = new Date(project.end_date!);
        const durationDays = Math.ceil(
          (projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24)
        );

        // ✅ Calculer la progression moyenne des tâches pour le projet
        const totalProgress = projectTasks.reduce((sum, task) => sum + (task.progress || 0), 0);
        const avgProgress =
          projectTasks.length > 0 ? Math.round(totalProgress / projectTasks.length) : 0;

        return {
          projectId: project.id,
          projectName: project.name,
          projectColor: projectColorMap[project.id],
          projectProgress: project.progress || avgProgress, // Utiliser le progress du projet ou calculé
          projectDuration: durationDays,
          projectStart,
          projectEnd,
        };
      });
  }, [displayMode, ganttTasks, projects, projectColorMap]);

  const {
    draggedTask,
    resizeTask,
    chartRef,
    taskMouseDownHandler,
    handleMouseMove,
    handleMouseUp,
  } = useGanttDrag(config, startDate, handleUpdateTaskDates, resetTaskPositions);

  const onTaskMouseDown = (
    e: React.MouseEvent,
    taskId: string,
    action: 'drag' | 'resize-left' | 'resize-right'
  ) => {
    taskMouseDownHandler(e, taskId, action, ganttTasks);
  };

  useEffect(() => {
    if (draggedTask || resizeTask) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedTask, resizeTask, handleMouseMove, handleMouseUp]);

  return (
    <>
      <Card className="modern-card glow-primary transition-smooth w-full">
        <GanttHeader
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          yearBuffer={yearBuffer}
          onYearBufferChange={setYearBuffer}
        />

        {/* Boutons de basculement Projet/Tâches */}
        <div
          className={`bg-gantt-header/20 ${isMobile ? 'space-y-2 px-2 pt-2 pb-2' : 'space-y-4 px-6 pb-4'}`}
        >
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <ToggleGroup
                type="single"
                value={displayMode}
                onValueChange={value => value && setDisplayMode(value as 'tasks' | 'projects')}
                className="justify-start"
              >
                <ToggleGroupItem
                  value="tasks"
                  className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  📝 {t('gantt.tasks')}
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="projects"
                  className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  📁 {t('gantt.projects')}
                </ToggleGroupItem>
              </ToggleGroup>
              {displayMode === 'tasks' && filteredTasks.length > 0 && (
                <ExportButton tasks={filteredTasks} filters={filters} variant="outline" size="sm" />
              )}
            </div>
            {displayMode === 'projects' && (
              <p className="text-muted-foreground text-sm">
                {t('gantt.projectsView')}
              </p>
            )}
          </div>

          {/* Filtres avancés - uniquement en mode Tâches et Desktop */}
          {!isMobile && displayMode === 'tasks' && (
            <AdvancedFilters
              onFiltersChange={setFilters}
              projects={projects}
              employees={[]}
              totalTasks={tasks.length}
              filteredCount={filteredTasks.length}
            />
          )}
        </div>

        <CardContent className="bg-gantt-header/50 p-0 backdrop-blur-sm">
          <div className="flex h-[600px] flex-col overflow-hidden rounded-b-xl lg:h-[700px]">
            {/* Headers fixes (ne scrollent pas) */}
            <div className="border-gantt-grid/50 z-20 flex flex-shrink-0 border-b">
              {/* Header liste tâches */}
              <div className="bg-gantt-header border-gantt-grid/50 flex h-20 w-64 items-center border-r px-4">
                <span className="text-foreground font-medium">
                  {displayMode === 'projects' ? t('gantt.projects') : t('gantt.tasks')}
                </span>
              </div>

              {/* Header timeline - scroll horizontal uniquement */}
              <div
                ref={chartRef}
                className="bg-gantt-header scrollbar-thin flex-1 overflow-x-auto overflow-y-hidden"
                onScroll={e => {
                  // Synchroniser le scroll horizontal avec le contenu
                  if (timelineScrollRef.current) {
                    timelineScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
                  }
                }}
              >
                <div
                  className="border-gantt-grid flex h-20 border-b"
                  style={{ minWidth: getTotalUnits(startDate, endDate, config) * config.unitWidth }}
                >
                  {renderTimelineHeader(startDate, endDate, config)}
                </div>
              </div>
            </div>

            {/* Contenu scrollable verticalement */}
            <div className="flex flex-1 overflow-hidden">
              {/* Liste des tâches - scroll vertical */}
              <div
                ref={taskListScrollRef}
                className="scrollbar-thin border-gantt-grid/50 bg-gantt-task-bg/30 w-64 overflow-x-hidden overflow-y-auto border-r"
                onScroll={handleScroll('list')}
              >
                {displayMode === 'projects'
                  ? ganttTasks.map(task => (
                    <div
                      key={task.id}
                      className="border-gantt-grid/30 hover:bg-gantt-hover/20 transition-smooth flex cursor-pointer items-center border-b px-4"
                      style={{ height: rowHeight }}
                    >
                      <div>
                        <div
                          className="text-lg font-bold"
                          style={{ color: task.color }}
                        >
                          📁 {task.name}
                        </div>
                        <div
                          className="text-sm"
                          style={{ color: task.color, opacity: 0.8 }}
                        >
                          {task.assignee}
                        </div>
                      </div>
                    </div>
                  ))
                  : // Mode tâches : regroupement par project_id UNIQUEMENT
                  (() => {
                    // Étape 1: Regrouper les tâches par project_id (pas par nom !)
                    const groupedTasks = ganttTasks.reduce(
                      (groups: { [key: string]: typeof ganttTasks }, task) => {
                        const projectKey = task.project_id || 'no-project';

                        if (!groups[projectKey]) {
                          groups[projectKey] = [];
                        }
                        groups[projectKey].push(task);
                        return groups;
                      },
                      {}
                    );

                    // Étape 2: Utiliser l'ordre original des projets pour garantir la cohérence numéros/couleurs
                    // Le nom et la couleur viennent UNIQUEMENT du tableau projects[] via project_id
                    const orderedProjectGroups = projects
                      .filter(
                        project =>
                          groupedTasks[project.id] && project.start_date && project.end_date
                      ) // Garder seulement les projets avec tâches ET dates
                      .map((project, index) => {
                        const projectTasks = groupedTasks[project.id];

                        // ✅ Utiliser les vraies dates du projet depuis la base de données
                        const projectStart = new Date(project.start_date!);
                        const projectEnd = new Date(project.end_date!);
                        const durationDays = Math.ceil(
                          (projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24)
                        );

                        // ✅ Calculer la progression moyenne des tâches pour le projet
                        const totalProgress = projectTasks.reduce(
                          (sum, task) => sum + (task.progress || 0),
                          0
                        );
                        const avgProgress =
                          projectTasks.length > 0
                            ? Math.round(totalProgress / projectTasks.length)
                            : 0;

                        return {
                          projectId: project.id,
                          projectName: project.name, // ✅ Nom du projet depuis projects[] via project_id
                          projectNumber: index + 1,
                          projectColor: projectColorMap[project.id], // ✅ Couleur du projet via project_id
                          projectProgress: project.progress || avgProgress, // Utiliser le progress du projet ou calculé
                          projectDuration: durationDays,
                          tasks: projectTasks,
                        };
                      });

                    // Ajouter les tâches sans projet à la fin
                    if (groupedTasks['no-project']) {
                      const noProjectTasks = groupedTasks['no-project'];
                      const totalProgress = noProjectTasks.reduce(
                        (sum, task) => sum + (task.progress || 0),
                        0
                      );
                      const avgProgress =
                        noProjectTasks.length > 0
                          ? Math.round(totalProgress / noProjectTasks.length)
                          : 0;

                      const startDates = noProjectTasks.map(t => new Date(t.startDate).getTime());
                      const endDates = noProjectTasks.map(t => new Date(t.endDate).getTime());
                      const durationDays = Math.ceil(
                        (Math.max(...endDates) - Math.min(...startDates)) / (1000 * 60 * 60 * 24)
                      );

                      orderedProjectGroups.push({
                        projectId: 'no-project',
                        projectName: t('gantt.noProject'),
                        projectNumber: null,
                        projectColor: '#6b7280',
                        projectProgress: avgProgress,
                        projectDuration: durationDays,
                        tasks: noProjectTasks,
                      });
                    }

                    // Étape 3: Afficher dans l'ordre correct
                    return orderedProjectGroups.map(
                      ({
                        projectId,
                        projectName,
                        projectNumber,
                        projectColor,
                        projectProgress,
                        projectDuration,
                        tasks,
                      }) => (
                        <div key={projectId}>
                          <div
                            className="border-gantt-grid/50 border-b-2 px-4"
                            style={{
                              height: rowHeight,
                              backgroundColor: projectColor,
                              opacity: 0.9,
                            }}
                          >
                            <ProjectProgressBar
                              projectNumber={projectNumber}
                              projectName={projectName}
                              projectColor={projectColor}
                              projectProgress={projectProgress}
                              projectDuration={projectDuration}
                              taskCount={tasks.length}
                            />
                          </div>
                          {(() => {
                            // Organiser les tâches hiérarchiquement : parents d'abord, puis leurs sous-tâches
                            const parentTasks = tasks.filter(t => !t.parent_id);
                            const childTasks = tasks.filter(t => t.parent_id);

                            const orderedTasks: typeof tasks = [];
                            parentTasks.forEach(parent => {
                              orderedTasks.push(parent);
                              // Ajouter les sous-tâches de ce parent juste après
                              const children = childTasks.filter(
                                child => child.parent_id === parent.id
                              );
                              orderedTasks.push(...children);
                            });

                            return orderedTasks.map(task => {
                              const isSubtask = !!task.parent_id;
                              const subtaskHeight = isSubtask ? rowHeight * 0.7 : rowHeight; // 30% plus petit

                              return (
                                <div
                                  key={task.id}
                                  className="border-gantt-grid/30 hover:bg-gantt-hover/20 transition-smooth flex cursor-pointer items-center border-b"
                                  style={{
                                    height: subtaskHeight,
                                    paddingLeft: isSubtask ? '3rem' : '1.5rem', // 3rem = retrait pour sous-tâches
                                    paddingRight: '1.5rem',
                                  }}
                                >
                                  <div className="min-w-0 flex-1">
                                    <div
                                      className="truncate"
                                      style={{
                                        fontWeight: isSubtask ? 'normal' : '500',
                                        fontStyle: isSubtask ? 'italic' : 'normal',
                                        fontSize: isSubtask ? '0.9rem' : '1rem',
                                        color: task.color,
                                      }}
                                      title={task.name}
                                    >
                                      {isSubtask && '↳ '}
                                      {task.name}
                                    </div>
                                    <div
                                      className="truncate text-sm"
                                      style={{ color: task.color, opacity: 0.8 }}
                                      title={task.assignee}
                                    >
                                      {task.assignee}
                                    </div>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      )
                    );
                  })()}
              </div>

              {/* Timeline - scroll vertical + horizontal synchronisé */}
              <div
                ref={timelineScrollRef}
                className="bg-gantt-task-bg/30 scrollbar-thin min-w-0 flex-1 overflow-auto"
                onScroll={e => {
                  // Synchroniser scroll vertical avec la liste
                  if (taskListScrollRef.current) {
                    taskListScrollRef.current.scrollTop = e.currentTarget.scrollTop;
                  }
                  // Synchroniser scroll horizontal avec le header
                  if (chartRef.current) {
                    chartRef.current.scrollLeft = e.currentTarget.scrollLeft;
                  }
                }}
              >
                <GanttTimeline
                  tasks={ganttTasks}
                  config={config}
                  startDate={startDate}
                  endDate={endDate}
                  rowHeight={rowHeight}
                  draggedTask={draggedTask}
                  resizeTask={resizeTask}
                  onTaskMouseDown={onTaskMouseDown}
                  displayMode={displayMode}
                  projectsOrder={projects}
                  projectsData={projectsData}
                  dependencies={dependencies}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ✅ Modal d'erreur centré pour les problèmes de mise à jour de dates */}
      {dateUpdateError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="border-border bg-background mx-4 w-full max-w-md rounded-lg border p-6 shadow-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-destructive mt-0.5 h-5 w-5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-destructive mb-2 font-semibold">{dateUpdateError.message}</h3>
                {dateUpdateError.details && (
                  <p className="text-muted-foreground mb-2 text-sm">
                    <strong>{t('gantt.details')}</strong> {dateUpdateError.details}
                  </p>
                )}
                {dateUpdateError.suggestion && (
                  <p className="text-muted-foreground mb-4 text-sm">
                    <strong>{t('gantt.solution')}</strong> {dateUpdateError.suggestion}
                  </p>
                )}
                <Button onClick={() => setDateUpdateError(null)} className="w-full">
                  {t('gantt.understood')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GanttChart;
