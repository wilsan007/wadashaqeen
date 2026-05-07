import React, { useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BrandedLoadingScreen } from '@/components/layout/BrandedLoadingScreen';
import { differenceInDays, parseISO, isValid, format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface GanttTask {
  id: string;
  title: string;
  start_date?: string | null;
  due_date?: string | null;
  status: string;
  priority: string;
  progress?: number;
}

const STATUS_COLORS: Record<string, string> = {
  todo: '#94a3b8',
  in_progress: '#3b82f6',
  done: '#22c55e',
  completed: '#22c55e',
  blocked: '#ef4444',
  review: '#f59e0b',
};

const PRIORITY_BORDER: Record<string, string> = {
  urgent: '#7c3aed',
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#94a3b8',
};

const DAY_WIDTH = 30;
const ROW_HEIGHT = 48;
const LABEL_WIDTH = 220;
const HEADER_HEIGHT = 40;

const useGanttTasks = (projectId?: string) =>
  useQuery<GanttTask[]>({
    queryKey: ['gantt-tasks', projectId],
    queryFn: async () => {
      let q = supabase
        .from('tasks')
        .select('id, title, start_date, due_date, status, priority, progress');
      if (projectId) q = q.eq('project_id', projectId);
      const { data, error } = await q.order('start_date', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });

interface BarProps {
  task: GanttTask;
  startDay: number;
  durationDays: number;
  rowIndex: number;
}

const GanttBar: React.FC<BarProps> = ({ task, startDay, durationDays, rowIndex }) => {
  const color = STATUS_COLORS[task.status] ?? '#94a3b8';
  const borderColor = PRIORITY_BORDER[task.priority] ?? 'transparent';
  const x = startDay * DAY_WIDTH;
  const width = Math.max(durationDays * DAY_WIDTH, DAY_WIDTH);
  const y = HEADER_HEIGHT + rowIndex * ROW_HEIGHT + 8;
  const progress = task.progress ?? 0;
  const barHeight = ROW_HEIGHT - 16;

  return (
    <g>
      <rect x={x} y={y} width={width} height={barHeight} rx={4}
        fill={color} stroke={borderColor} strokeWidth={borderColor !== 'transparent' ? 2 : 0}
        opacity={0.75}
      />
      {progress > 0 && (
        <rect x={x} y={y} width={width * (progress / 100)} height={barHeight} rx={4}
          fill={color} opacity={1}
        />
      )}
      <text x={x + 6} y={y + barHeight / 2 + 4} fontSize={11} fill="white" fontWeight={500}>
        {task.title.length > 20 ? task.title.slice(0, 20) + '…' : task.title}
      </text>
    </g>
  );
};

const GanttPage: React.FC = () => {
  const { projectId } = useParams<{ projectId?: string }>();
  const queryClient = useQueryClient();
  const { data: tasks, isLoading, error } = useGanttTasks(projectId);
  const svgRef = useRef<SVGSVGElement>(null);

  React.useEffect(() => {
    const channel = supabase
      .channel('gantt-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        queryClient.invalidateQueries({ queryKey: ['gantt-tasks', projectId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [projectId, queryClient]);

  const { chartStart, totalDays, layout } = useMemo(() => {
    const valid = (tasks ?? []).filter(
      t => t.start_date && isValid(parseISO(t.start_date))
    );
    if (!valid.length) return { chartStart: new Date(), totalDays: 30, layout: [] };

    const allDates = valid.flatMap(t =>
      [t.start_date, t.due_date].filter(Boolean).map(d => parseISO(d!))
    );
    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
    const totalDays = Math.max(differenceInDays(maxDate, minDate) + 7, 30);

    const layout = valid.map(task => {
      const start = parseISO(task.start_date!);
      const end = task.due_date ? parseISO(task.due_date) : start;
      return {
        task,
        startDay: Math.max(differenceInDays(start, minDate), 0),
        durationDays: Math.max(differenceInDays(end, start) + 1, 1),
      };
    });

    return { chartStart: minDate, totalDays, layout };
  }, [tasks]);

  const svgWidth = LABEL_WIDTH + totalDays * DAY_WIDTH;
  const svgHeight = HEADER_HEIGHT + ROW_HEIGHT * (layout.length || 1);

  if (isLoading) return <BrandedLoadingScreen appName="Wadashaqayn" logoSrc="/logo-w.svg" />;

  if (error) return (
    <div className="flex h-full items-center justify-center text-red-500">
      Erreur de chargement du Gantt.
    </div>
  );

  if (!tasks?.length) return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-500">
      <p className="text-lg font-medium">Aucune tâche à afficher</p>
      <p className="text-sm">Ajoutez des tâches avec des dates de début et fin pour voir le Gantt.</p>
    </div>
  );

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vue Gantt</h1>
        <p className="text-sm text-gray-500">
          {tasks.length} tâches · Synchronisation temps réel activée
        </p>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="overflow-x-auto rounded-lg border bg-white shadow dark:border-gray-700 dark:bg-gray-800">
          <svg ref={svgRef} width={svgWidth} height={svgHeight}>
            {/* En-tête des jours */}
            {Array.from({ length: totalDays }).map((_, i) => {
              const date = new Date(chartStart.getTime() + i * 86_400_000);
              const isMonday = date.getDay() === 1;
              return (
                <g key={i}>
                  <rect
                    x={LABEL_WIDTH + i * DAY_WIDTH} y={0}
                    width={DAY_WIDTH} height={HEADER_HEIGHT}
                    fill={i % 2 === 0 ? '#f8fafc' : '#f1f5f9'}
                    stroke="#e2e8f0" strokeWidth={0.5}
                  />
                  {isMonday && (
                    <text
                      x={LABEL_WIDTH + i * DAY_WIDTH + 3}
                      y={HEADER_HEIGHT - 10}
                      fontSize={10} fill="#64748b"
                    >
                      {format(date, 'd MMM', { locale: fr })}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Lignes de tâches */}
            {layout.map(({ task, startDay, durationDays }, rowIndex) => (
              <g key={task.id}>
                <rect
                  x={0} y={HEADER_HEIGHT + rowIndex * ROW_HEIGHT}
                  width={svgWidth} height={ROW_HEIGHT}
                  fill={rowIndex % 2 === 0 ? 'white' : '#f8fafc'}
                  stroke="#f1f5f9" strokeWidth={0.5}
                />
                {/* Label */}
                <text
                  x={8}
                  y={HEADER_HEIGHT + rowIndex * ROW_HEIGHT + ROW_HEIGHT / 2 + 4}
                  fontSize={12} fill="#1e293b"
                >
                  {task.title.length > 26 ? task.title.slice(0, 26) + '…' : task.title}
                </text>
                {/* Barre */}
                <g transform={`translate(${LABEL_WIDTH}, 0)`}>
                  <GanttBar
                    task={task}
                    startDay={startDay}
                    durationDays={durationDays}
                    rowIndex={rowIndex}
                  />
                </g>
              </g>
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
};

export default GanttPage;
