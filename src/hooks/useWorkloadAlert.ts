import { useMemo } from 'react';
import { useTasksEnterprise as useTasks } from '@/hooks/useTasksEnterprise';
import { useEmployees } from '@/hooks/useEmployees';
import { useRoleBasedAccess } from '@/hooks/useRoleBasedAccess';

export const useWorkloadAlert = (taskId: string | null) => {
    const { tasks } = useTasks();
    const { employees } = useEmployees();
    const { accessRights, isSuperAdmin, isTenantAdmin, isHRManager, isProjectManager } = useRoleBasedAccess();

    // Seuls certains rôles peuvent voir la charge de travail
    const canSeeWorkload =
        accessRights.canManageEmployees ||
        accessRights.canManageAllTasks ||
        isSuperAdmin ||
        isTenantAdmin ||
        isHRManager ||
        isProjectManager;

    return useMemo(() => {
        // Record qui va stocker les infos de charge par employé
        const workloads: Record<string, { isOverloaded: boolean; workloadPercentage: number; totalHours: number; availableHours: number }> = {};

        if (!canSeeWorkload || !taskId || !tasks.length || !employees.length) {
            return workloads;
        }

        const targetTask = tasks.find(t => t.id === taskId);
        if (!targetTask || !targetTask.start_date || !targetTask.due_date) return workloads;

        const start = new Date(targetTask.start_date);
        const end = new Date(targetTask.due_date);
        const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

        // Calculer pour chaque employé
        employees.forEach(employee => {
            const tasksInPeriod = tasks.filter(task => {
                if (task.id === targetTask.id) return false;

                const taskAssigneeName = typeof task.assignee === 'string' ? task.assignee : task.assignee?.full_name;
                const isAssigned =
                    taskAssigneeName === employee.full_name ||
                    task.assignee_id === employee.id ||
                    task.assignee_id === employee.user_id;

                if (!isAssigned) return false;
                if (!task.start_date || !task.due_date) return false;

                const taskStart = new Date(task.start_date);
                const taskEnd = new Date(task.due_date);

                return taskStart <= end && taskEnd >= start;
            });

            let totalHours = tasksInPeriod.reduce((sum, t) => sum + (t.effort_estimate_h || 0), 0);
            totalHours += (targetTask.effort_estimate_h || 0);

            const weeklyHours = employee.weekly_hours || 35;
            const availableHours = (weeklyHours / 7) * days;

            const workloadPercentage = Math.round((totalHours / Math.max(1, availableHours)) * 100);
            const isOverloaded = workloadPercentage > 100;

            // On enregistre avec l'ID pour un accès facile, mais aussi avec le nom complet au cas où
            const info = {
                isOverloaded,
                workloadPercentage,
                totalHours,
                availableHours: Math.round(availableHours)
            };

            workloads[employee.id] = info;
            if (employee.user_id) workloads[employee.user_id] = info;
            if (employee.full_name) workloads[employee.full_name] = info;
        });

        return workloads;
    }, [taskId, tasks, employees, canSeeWorkload]);
};
