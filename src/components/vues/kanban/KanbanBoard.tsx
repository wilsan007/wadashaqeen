// @ts-nocheck
import React, { useState, useMemo } from 'react';
// Hooks optimisés avec cache intelligent et métriques
import { useTasks } from '@/hooks/optimized';
import { useProjects } from '@/hooks/optimized';
import { useEmployees } from '@/hooks/useEmployees';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileKanbanBoard } from '../responsive/MobileKanbanBoard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { AdvancedFilters, type TaskFilters } from '@/components/tasks/AdvancedFilters';
import { useTaskFilters } from '@/hooks/useTaskFilters';
import { ExportButton } from '@/components/tasks/ExportButton';
import { useTranslation } from '@/hooks/useTranslation';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '@/hooks/optimized';
import { assignProjectColors, getTaskColor } from '@/lib/ganttColors';

const TASK_COLUMNS = [
  { id: 'todo', title: 'À faire', status: 'todo' as const },
  { id: 'doing', title: 'En cours', status: 'doing' as const },
  { id: 'blocked', title: 'Bloqué', status: 'blocked' as const },
  { id: 'done', title: 'Terminé', status: 'done' as const },
];

const PROJECT_COLUMNS = [
  { id: 'planning', title: 'Planification', status: 'planning' as const },
  { id: 'active', title: 'En cours', status: 'active' as const },
  { id: 'on_hold', title: 'En pause', status: 'on_hold' as const },
  { id: 'completed', title: 'Terminé', status: 'completed' as const },
];

const PRIORITY_COLORS = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-warning/20 text-warning border-warning/30',
  high: 'bg-tech-orange/20 text-tech-orange border-tech-orange/30',
  urgent: 'bg-destructive/20 text-destructive border-destructive/30',
};

interface KanbanCardProps {
  task: Task | any; // Peut être une tâche ou un projet
  color?: string;
}

function KanbanCard({ task, color }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50' : ''}`}
    >
      <Card className="transition-smooth glass hover-glow border-primary/30 bg-card/40 mb-3 cursor-grab backdrop-blur-sm hover:shadow-md active:cursor-grabbing">
        <CardHeader className="pb-2">
          <CardTitle
            className="text-sm font-medium"
            style={{ color: color || 'inherit' }}
          >
            {task.title || task.name}
          </CardTitle>

          {/* Badges priorité et projet */}
          <div className="flex flex-wrap items-center gap-1 py-1">
            <Badge
              className={`border text-xs font-medium ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium}`}
            >
              {task.priority}
            </Badge>
            {(task.projects?.name || task.project_name) && (
              <Badge
                className="text-xs"
                style={color ? { backgroundColor: color, color: '#fff', borderColor: color } : undefined}
                variant={color ? 'default' : 'secondary'}
              >
                📁 {task.projects?.name || task.project_name}
              </Badge>
            )}
          </div>

          {/* Assigné avec nom complet */}
          <div className="flex items-center gap-2 pt-1">
            <Avatar className="ring-primary/40 h-6 w-6 ring-2">
              {(() => {
                // Normaliser assignee qui peut être string ou objet
                const assigneeStr =
                  typeof task.assignee === 'string'
                    ? task.assignee
                    : (task.assignee as any)?.full_name || task.manager_name || 'NA';
                return (
                  <>
                    <AvatarImage src="" alt={assigneeStr} />
                    <AvatarFallback className="bg-primary/40 text-primary-foreground text-xs font-semibold">
                      {assigneeStr.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </>
                );
              })()}
            </Avatar>
            <span className="text-muted-foreground flex-1 truncate text-xs">
              {(() => {
                const assigneeStr =
                  typeof task.assignee === 'string'
                    ? task.assignee
                    : (task.assignee as any)?.full_name || task.manager_name || 'Non assigné';
                return assigneeStr;
              })()}
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <Progress value={task.progress || 0} className="bg-muted/50 h-2" indicatorColor={color} />
            <div className="text-muted-foreground flex items-center justify-between text-xs">
              <span>{task.progress || 0}% terminé</span>
              <span className="bg-accent/30 text-accent-foreground rounded px-2 py-1 font-medium">
                {task.status}
              </span>
            </div>
            {/* Affichage spécifique aux projets */}
            {task.task_count !== undefined && (
              <div className="text-muted-foreground text-xs">
                📝 {task.task_count} tâche{task.task_count > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface KanbanColumnProps {
  column: (typeof TASK_COLUMNS)[0] | (typeof PROJECT_COLUMNS)[0];
  tasks: Task[] | any[];
  projectColorMap?: Record<string, string>;
  totalProjects?: number;
}

function KanbanColumn({ column, tasks, projectColorMap, totalProjects = 0 }: KanbanColumnProps) {
  return (
    <div className="min-w-0 flex-1">
      <Card className="glass glow-accent transition-smooth border-primary/30 h-full">
        <CardHeader className="border-primary/30 from-primary/15 to-accent/15 border-b bg-gradient-to-r pb-3 backdrop-blur-sm">
          <CardTitle className="flex items-center justify-between text-lg">
            <span className="text-foreground font-bold">{column.title}</span>
            <Badge
              variant="secondary"
              className="border-primary/50 bg-primary/40 text-primary-foreground ml-2 font-semibold shadow-lg"
            >
              {tasks.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="bg-card/30 max-h-[calc(100vh-300px)] overflow-y-auto backdrop-blur-sm">
          <SortableContext items={tasks.filter(Boolean).map(t => t.id)} strategy={verticalListSortingStrategy}>
            {tasks.filter(Boolean).map((task, index) => {
              // Determine task color
              let color = undefined;
              if (projectColorMap) {
                // If it's a project, use its own color
                if (task.name && projectColorMap[task.id]) {
                  color = projectColorMap[task.id];
                }
                // If it's a task, use getTaskColor
                else {
                  color = getTaskColor({ project_id: task.project_id || task.projects?.id }, projectColorMap, index, totalProjects);
                }
              }
              return <KanbanCard key={task.id} task={task} color={color} />;
            })}
          </SortableContext>
        </CardContent>
      </Card>
    </div>
  );
}

export default function KanbanBoard() {
  const { t } = useTranslation();
  const { tasks, updateTaskStatus, loading } = useTasks();
  const { projects, loading: projectsLoading } = useProjects();
  const { employees } = useEmployees();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [displayMode, setDisplayMode] = useState<'tasks' | 'projects'>('tasks');
  const isMobile = useIsMobile();
  const [filters, setFilters] = useState<TaskFilters>({
    search: '',
    status: [],
    priority: [],
    assignee: [],
    project: [],
    dateFrom: '',
    dateTo: '',
  });

  const projectColorMap = React.useMemo(() => {
    return assignProjectColors(projects || []);
  }, [projects]);

  // Appliquer les filtres uniquement en mode tâches
  const { filteredTasks } = useTaskFilters(tasks, filters);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || !active) {
      setActiveTask(null);
      return;
    }

    // Pour l'instant, le drag & drop n'est actif que pour les tâches
    if (displayMode === 'projects') {
      setActiveTask(null);
      return;
    }

    const taskId = active.id as string;
    const overId = over.id as string;

    // Check if dropped over a column (seulement pour les tâches)
    const targetColumn = TASK_COLUMNS.find(col => col.id === overId);
    if (targetColumn) {
      updateTaskStatus(taskId, targetColumn.status);
    } else {
      // Check if dropped over another task
      const targetTask = tasks.find(t => t.id === overId);
      if (targetTask && targetTask.status !== tasks.find(t => t.id === taskId)?.status) {
        updateTaskStatus(taskId, targetTask.status);
      }
    }

    setActiveTask(null);
  };

  if (loading || (displayMode === 'projects' && projectsLoading)) {
    return (
      <div className="glass modern-card flex h-64 items-center justify-center">
        <div className="glow-primary border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
        <span className="text-foreground ml-3 font-medium">Chargement...</span>
      </div>
    );
  }

  // Use mobile version on small screens
  if (isMobile) {
    return <MobileKanbanBoard />;
  }

  // Apply translations to columns based on the display mode
  const rawColumns = displayMode === 'tasks' ? TASK_COLUMNS : PROJECT_COLUMNS;
  const columns = rawColumns.map(col => {
    let keyPart = '';
    if (col.id === 'todo') keyPart = 'Todo';
    if (col.id === 'doing') keyPart = 'Doing';
    if (col.id === 'blocked') keyPart = 'Blocked';
    if (col.id === 'done') keyPart = 'Done';
    if (col.id === 'planning') keyPart = 'Planning';
    if (col.id === 'active') keyPart = 'Active';
    if (col.id === 'on_hold') keyPart = 'OnHold';
    if (col.id === 'completed') keyPart = 'Completed';
    return { ...col, title: t(`taskManagement.kanban.col${keyPart}`, col.title) };
  });

  // Utiliser filteredTasks au lieu de tasks en mode tâches avec sécurité anti-null
  const items = (displayMode === 'tasks' ? filteredTasks : projects) || [];

  const itemsByStatus = columns.map(column => ({
    ...column,
    tasks: items.filter((item: any) => item.status === column.status),
  }));

  return (
    <div className="space-y-4">
      {/* Boutons de basculement Projet/Tâches */}
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
              {t('taskManagement.kanban.tasksToggle')}
            </ToggleGroupItem>
            <ToggleGroupItem
              value="projects"
              className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              {t('taskManagement.kanban.projectsToggle')}
            </ToggleGroupItem>
          </ToggleGroup>
          {displayMode === 'tasks' && filteredTasks.length > 0 && (
            <ExportButton tasks={filteredTasks} filters={filters} variant="outline" size="sm" />
          )}
        </div>
        {displayMode === 'projects' && (
          <p className="text-muted-foreground text-sm">{t('taskManagement.kanban.projectsSubtitle')}</p>
        )}
      </div>

      {/* Filtres avancés - uniquement en mode Tâches et Desktop */}
      {!isMobile && displayMode === 'tasks' && (
        <AdvancedFilters
          onFiltersChange={setFilters}
          projects={projects}
          employees={employees}
          totalTasks={tasks.length}
          filteredCount={filteredTasks.length}
        />
      )}

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="h-full">
          <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {itemsByStatus.map(column => (
              <div key={column.id}>
                <KanbanColumn
                  column={column}
                  tasks={column.tasks}
                  projectColorMap={projectColorMap}
                  totalProjects={projects?.length || 0}
                />
              </div>
            ))}
          </div>
        </div>

        <DragOverlay>{activeTask ? <KanbanCard task={activeTask} /> : null}</DragOverlay>
      </DndContext>
    </div>
  );
}
