/**
 * TaskCalendar - Vue calendrier/timeline des tâches (Futuristic Edition 🚀)
 *
 * Design : Glassmorphism, Néons, Dégradés
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  AlertTriangle,
  CheckSquare,
  Filter,
  Sparkles,
} from 'lucide-react';
import { useTasks, type Task, useProjects } from '@/hooks/optimized';
import { useEmployees } from '@/hooks/useEmployees';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  DragEndEvent,
  DragStartEvent,
  closestCenter,
  TouchSensor,
  MouseSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  parseISO,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  getDay,
} from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { generateICal } from '@/utils/calendar';
import { GoogleCalendarSync } from '@/components/calendar/GoogleCalendarSync';
import { assignProjectColors, getTaskColor } from '@/lib/ganttColors';
import { useTranslation } from '@/hooks/useTranslation';

// Composant Draggable Task (Point)
const DraggableTaskDot = ({ task, priorityColorClass, projectColor }: { task: Task; priorityColorClass: string; projectColor?: string }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`h-3 w-3 flex-shrink-0 cursor-grab rounded-full active:cursor-grabbing shadow-sm border border-black/10 dark:border-white/10 ${!projectColor ? priorityColorClass : ''} ${isDragging ? 'opacity-50' : ''
        }`}
      style={projectColor ? { backgroundColor: projectColor } : undefined}
      title={task.title}
    />
  );
};

// Composant Droppable Day
const DroppableDay = ({
  day,
  children,
  isCurrentMonth,
  isSelected,
  isTodayDay,
  hasEvents,
  onClick,
}: {
  day: Date;
  children: React.ReactNode;
  isCurrentMonth: boolean;
  isSelected: boolean;
  isTodayDay: boolean;
  hasEvents: boolean;
  onClick: () => void;
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: format(day, 'yyyy-MM-dd'),
    data: { date: day },
  });

  return (
    <button
      ref={setNodeRef}
      onClick={onClick}
      className={`group relative min-h-[90px] rounded-xl p-2 text-left transition-all duration-300 border ${hasEvents && !isSelected ? 'bg-primary/10 border-primary/20' : 'bg-background/40 border-border/40'} ${!isCurrentMonth ? 'opacity-40 grayscale' : 'opacity-100 font-medium text-foreground'
        } ${isSelected
          ? 'bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 shadow-lg ring-2 shadow-violet-500/20 ring-violet-500 border-transparent'
          : 'hover:scale-[1.02] hover:bg-foreground/5'
        } ${isTodayDay && !isSelected ? 'bg-primary/5 ring-1 ring-primary/30 border-transparent' : ''} ${isOver ? 'scale-105 bg-violet-500/30 ring-2 ring-violet-400 border-transparent' : ''
        }`}
    >
      {children}
    </button>
  );
};

type ViewMode = 'month' | 'week' | 'day';

export const TaskCalendar: React.FC = () => {
  const { tasks, loading, updateTask } = useTasks();
  const { projects } = useProjects();
  const { employees, loading: employeesLoading } = useEmployees();
  const projectColorMap = useMemo(() => assignProjectColors(projects || []), [projects]);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');
  const [activeId, setActiveId] = useState<string | null>(null);

  const { t, locale } = useTranslation();
  const dateLocale = locale === 'en' ? enUS : fr;

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  // Calculer la plage de dates affichée
  const { startDate, endDate, days } = useMemo(() => {
    if (viewMode === 'month') {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      const calendarStart = startOfWeek(start, { weekStartsOn: 1 });
      const calendarEnd = endOfWeek(end, { weekStartsOn: 1 });
      return {
        startDate: calendarStart,
        endDate: calendarEnd,
        days: eachDayOfInterval({ start: calendarStart, end: calendarEnd }),
      };
    } else if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return {
        startDate: start,
        endDate: end,
        days: eachDayOfInterval({ start, end }),
      };
    } else {
      return {
        startDate: currentDate,
        endDate: currentDate,
        days: [currentDate],
      };
    }
  }, [currentDate, viewMode]);

  // Filtrer les tâches
  const filteredTasks = useMemo(() => {
    if (selectedAssignee === 'all') {
      return tasks;
    }
    return tasks.filter(task => (task.assigned_to || task.assignee_id) === selectedAssignee);
  }, [tasks, selectedAssignee]);

  // Grouper les tâches par jour
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    filteredTasks.forEach(task => {
      if (!task.due_date) return;
      const dueDate = parseISO(task.due_date);
      const dateKey = format(dueDate, 'yyyy-MM-dd');
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(task);
    });
    return map;
  }, [filteredTasks]);

  // Tâches du jour sélectionné
  const selectedDayTasks = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return tasksByDate.get(dateKey) || [];
  }, [selectedDate, tasksByDate]);

  const navigate = (direction: 'prev' | 'next') => {
    if (viewMode === 'month') {
      setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
    } else if (viewMode === 'week') {
      const days = direction === 'prev' ? -7 : 7;
      setCurrentDate(new Date(currentDate.getTime() + days * 24 * 60 * 60 * 1000));
    } else {
      const days = direction === 'prev' ? -1 : 1;
      setCurrentDate(new Date(currentDate.getTime() + days * 24 * 60 * 60 * 1000));
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-rose-500 shadow-rose-500/50';
      case 'medium':
        return 'bg-amber-500 shadow-amber-500/50';
      case 'low':
        return 'bg-emerald-500 shadow-emerald-500/50';
      case 'urgent':
        return 'bg-purple-600 shadow-purple-600/50 animate-pulse';
      default:
        return 'bg-slate-500 shadow-slate-500/50';
    }
  };


  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const dateStr = over.id as string;
      const taskId = active.id as string;

      // Mettre à jour la tâche
      try {
        await updateTask(taskId, {
          due_date: dateStr, // On suppose que l'API accepte YYYY-MM-DD
        });
        // Feedback visuel ou toast ici
      } catch (error) {
        console.error('Erreur lors du déplacement de la tâche', error);
      }
    }
  };

  if (loading) {
    return <Skeleton className="h-96 w-full rounded-3xl" />;
  }

  return (
    <div className="animate-in fade-in-50 space-y-8 duration-700">
      {/* Header Futuriste */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600/20 via-fuchsia-600/20 to-cyan-600/20 p-[1px] shadow-2xl backdrop-blur-3xl">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-xl dark:bg-black/5" />
        <div className="relative flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-3xl font-bold text-transparent">
              {t('taskCalendar.title')}
            </h2>
            <p className="text-muted-foreground mt-1 font-medium capitalize">
              {format(currentDate, 'MMMM yyyy', { locale: dateLocale })}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* View Mode Pills */}
            <div className="bg-muted/30 flex rounded-full border border-white/10 p-1 backdrop-blur-md">
              {(['month', 'week', 'day'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-300 ${viewMode === mode
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                    }`}
                >
                  {mode === 'month' ? t('taskCalendar.month') : mode === 'week' ? t('taskCalendar.week') : t('taskCalendar.day')}
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate('prev')}
                className="rounded-full border-white/10 hover:bg-white/10"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentDate(new Date());
                  setSelectedDate(new Date());
                }}
                className="rounded-full border-white/10 hover:bg-white/10"
              >
                {t('taskCalendar.today')}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate('next')}
                className="rounded-full border-white/10 hover:bg-white/10"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Export iCal */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => generateICal(tasks)}
              className="ml-2 rounded-full border-white/10 hover:bg-white/10"
              title={t('taskCalendar.exportICal')}
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Calendrier Principal */}
        <Card className="border border-border/50 bg-background/60 shadow-xl backdrop-blur-xl lg:col-span-2">
          <CardContent className="p-6">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              {/* Jours Semaine */}
              <div className="mb-4 grid grid-cols-7">
                {[
                  t('calendar.days.mon'),
                  t('calendar.days.tue'),
                  t('calendar.days.wed'),
                  t('calendar.days.thu'),
                  t('calendar.days.fri'),
                  t('calendar.days.sat'),
                  t('calendar.days.sun')
                ].map(day => (
                  <div
                    key={day}
                    className="text-foreground/80 py-2 text-center text-sm font-bold uppercase tracking-wider"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Grille Jours */}
              <div className="grid grid-cols-7 gap-2">
                {days.map(day => {
                  const dayTasks = tasksByDate.get(format(day, 'yyyy-MM-dd')) || [];
                  const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isTodayDay = isToday(day);

                  return (
                    <DroppableDay
                      key={day.toISOString()}
                      day={day}
                      isCurrentMonth={isCurrentMonth}
                      isSelected={!!isSelected}
                      isTodayDay={isTodayDay}
                      hasEvents={dayTasks.length > 0}
                      onClick={() => setSelectedDate(day)}
                    >
                      <div className="mb-2 flex items-start justify-between">
                        <span
                          className={`text-lg font-extrabold ${isTodayDay ? 'text-violet-500 dark:text-violet-400' : 'text-foreground'}`}
                        >
                          {format(day, 'd')}
                        </span>
                        {dayTasks.length > 0 && (
                          <Badge
                            className="h-6 min-w-[1.5rem] px-2 text-sm font-extrabold shadow-md flex items-center justify-center bg-violet-500 hover:bg-violet-600 text-white"
                          >
                            {dayTasks.length}
                          </Badge>
                        )}
                      </div>

                      {/* Indicateurs de tâches (Points Draggable) */}
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {dayTasks.slice(0, 6).map(task => (
                          <DraggableTaskDot
                            key={task.id}
                            task={task}
                            priorityColorClass={getPriorityColor(task.priority)}
                            projectColor={task.project_id ? projectColorMap[task.project_id] : undefined}
                          />
                        ))}
                        {dayTasks.length > 6 && (
                          <div className="bg-muted-foreground h-2 w-2 rounded-full self-center" />
                        )}
                      </div>
                    </DroppableDay>
                  );
                })}
              </div>

              <DragOverlay>
                {activeId ? (
                  <div className="h-4 w-4 animate-pulse rounded-full bg-violet-500 shadow-lg ring-2 ring-white" />
                ) : null}
              </DragOverlay>
            </DndContext>
          </CardContent>
        </Card>

        {/* Détails du Jour & Stats */}
        <div className="space-y-6">
          {/* Carte Détails Jour */}
          <Card className="relative overflow-hidden border-none bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 shadow-xl backdrop-blur-xl">
            <div className="absolute top-0 right-0 p-4 opacity-20">
              <Sparkles className="h-24 w-24 text-violet-500" />
            </div>

            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarIcon className="h-5 w-5 text-violet-500" />
                {selectedDate
                  ? format(selectedDate, 'EEEE d MMMM', { locale: dateLocale })
                  : t('taskCalendar.selectDay')}
              </CardTitle>
            </CardHeader>

            <CardContent className="custom-scrollbar max-h-[400px] overflow-y-auto pr-2">
              {selectedDayTasks.length === 0 ? (
                <div className="text-muted-foreground py-8 text-center">
                  <p>{t('taskCalendar.noTasks')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDayTasks.map(task => (
                    <div
                      key={task.id}
                      className="group rounded-xl border border-white/10 bg-white/40 p-3 backdrop-blur-md transition-all hover:translate-x-1 hover:border-violet-500/30 dark:bg-black/20"
                    >
                      <div className="mb-1 flex items-start justify-between">
                        <h4
                          className="line-clamp-1 text-sm font-semibold"
                          style={task.project_id && projectColorMap[task.project_id] ? { color: projectColorMap[task.project_id] } : undefined}
                        >
                          {task.title}
                        </h4>
                        <div
                          className={`flex-shrink-0 h-2 w-2 rounded-full ${!task.project_id ? getPriorityColor(task.priority) : ''}`}
                          style={task.project_id && projectColorMap[task.project_id] ? { backgroundColor: projectColorMap[task.project_id] } : undefined}
                        />
                      </div>
                      <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
                        <Badge
                          variant="outline"
                          className="h-5 border-white/20 bg-transparent px-1.5 text-[10px]"
                        >
                          {task.status}
                        </Badge>
                        {task.project_name && (
                          <Badge
                            variant="outline"
                            className="h-5 px-1.5 text-[10px]"
                            style={task.project_id && projectColorMap[task.project_id] ? { backgroundColor: `${projectColorMap[task.project_id]}1A`, color: projectColorMap[task.project_id] } : undefined}
                          >
                            📁 {task.project_name}
                          </Badge>
                        )}
                        {task.due_date && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(parseISO(task.due_date), 'HH:mm')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mini Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="border-none bg-emerald-500/10 backdrop-blur-md">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-emerald-500">{tasks.length}</div>
                <div className="text-muted-foreground text-xs font-medium">{t('taskCalendar.totalTasks')}</div>
              </CardContent>
            </Card>
            <Card className="border-none bg-rose-500/10 backdrop-blur-md">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-rose-500">
                  {tasks.filter(t => t.priority === 'high').length}
                </div>
                <div className="text-muted-foreground text-xs font-medium">{t('taskCalendar.urgent')}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Google Calendar Sync */}
        <GoogleCalendarSync />
      </div>
    </div>
  );
};
