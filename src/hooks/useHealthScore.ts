import { useMemo } from 'react';
import { useProjectStats } from '@/hooks/useProjectStats';
import { useTaskMetrics } from '@/hooks/useTaskMetrics';
import { useTaskVelocity } from '@/hooks/useTaskVelocity';

export interface HealthScore {
  score: number;
  color: 'success' | 'warning' | 'destructive';
  label: string;
  breakdown: {
    completion: number;   // 0-100
    timeliness: number;   // 0-100
    velocity: number;     // 0-100
  };
}

export const useHealthScore = (): { data: HealthScore | null; isLoading: boolean } => {
  const { data: projectStats, isLoading: projLoading } = useProjectStats();
  const { data: taskMetrics, isLoading: taskLoading } = useTaskMetrics();
  const { data: velocity, isLoading: velLoading } = useTaskVelocity();

  const isLoading = projLoading || taskLoading || velLoading;

  const data = useMemo((): HealthScore | null => {
    if (!projectStats || !taskMetrics) return null;

    const totalTasks = taskMetrics.reduce((s, m) => s + m.count, 0);
    const doneTasks =
      (taskMetrics.find(m => m.status === 'done')?.count ?? 0) +
      (taskMetrics.find(m => m.status === 'completed')?.count ?? 0);

    // 40% — taux de complétion des tâches
    const completionRate = totalTasks > 0 ? doneTasks / totalTasks : 0;

    // 40% — respect des délais projets (inverse du taux de retard)
    const timelinessRate =
      projectStats.total > 0 ? 1 - projectStats.overdue / projectStats.total : 1;

    // 20% — tendance de vélocité (capped à 150% pour éviter l'effet plafond)
    const velocityScore = velocity
      ? Math.min(velocity.currentWeek / Math.max(velocity.previousWeek, 1), 1.5) / 1.5
      : 0.5;

    const score = Math.round(
      (completionRate * 0.4 + timelinessRate * 0.4 + velocityScore * 0.2) * 100
    );
    const clamped = Math.max(0, Math.min(100, score));

    const color: HealthScore['color'] =
      clamped >= 70 ? 'success' : clamped >= 40 ? 'warning' : 'destructive';
    const label =
      clamped >= 70 ? 'Bonne santé' : clamped >= 40 ? 'À surveiller' : 'Critique';

    return {
      score: clamped,
      color,
      label,
      breakdown: {
        completion: Math.round(completionRate * 100),
        timeliness: Math.round(timelinessRate * 100),
        velocity: Math.round(velocityScore * 100),
      },
    };
  }, [projectStats, taskMetrics, velocity]);

  return { data, isLoading };
};
