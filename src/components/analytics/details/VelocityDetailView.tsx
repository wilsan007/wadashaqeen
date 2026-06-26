import React, { useMemo } from 'react';
import { useTasks } from '@/hooks/optimized';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Zap, CheckCircle2, Calendar, User } from 'lucide-react';
import { isAfter, subDays, startOfDay } from 'date-fns';

export const VelocityDetailView: React.FC = () => {
    const { tasks, loading } = useTasks();

    const completedTasksInfo = useMemo(() => {
        if (!tasks) return { thisWeek: [], lastWeek: [] };

        const today = startOfDay(new Date());
        const sevenDaysAgo = subDays(today, 7);
        const fourteenDaysAgo = subDays(today, 14);

        const completed = tasks.filter(t => t.status === 'done' || t.status === 'completed');

        const thisWeek = completed.filter(t => t.updated_at && isAfter(new Date(t.updated_at), sevenDaysAgo));
        const lastWeek = completed.filter(t => t.updated_at && isAfter(new Date(t.updated_at), fourteenDaysAgo) && !isAfter(new Date(t.updated_at), sevenDaysAgo));

        // Sort by most recently updated
        thisWeek.sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime());
        lastWeek.sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime());

        return { thisWeek, lastWeek };
    }, [tasks]);

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
            </div>
        );
    }

    const renderTaskList = (list: any[], title: string, emptyMessage: string) => {
        if (list.length === 0) {
            return (
                <div className="mb-6">
                    <h3 className="font-semibold text-sm mb-3 text-foreground">{title}</h3>
                    <div className="p-4 text-center rounded-xl border border-dashed text-muted-foreground text-sm">
                        {emptyMessage}
                    </div>
                </div>
            );
        }

        return (
            <div className="mb-8">
                <div className="flex items-center justify-between mb-3 border-b border-primary/20 pb-2">
                    <h3 className="font-semibold text-sm text-foreground">{title}</h3>
                    <Badge variant="secondary" className="bg-primary/10 text-primary">{list.length} accomplies</Badge>
                </div>
                <div className="space-y-2">
                    {list.map(task => (
                        <div key={task.id} className="modern-card p-3 flex gap-3 items-center bg-card/60 backdrop-blur-sm border-l-2 border-l-success group hover:shadow-md transition-shadow">
                            <div className="p-2 rounded-full bg-success/10 text-success shrink-0">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">{task.name || task.title}</h4>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                    {task.project_name && <span className="truncate max-w-[120px]">📁 {task.project_name}</span>}
                                    <span className="flex items-center gap-1 shrink-0"><User className="w-3 h-3" /> {task.assignee_name || 'Équipe'}</span>
                                    <span className="flex items-center gap-1 shrink-0"><Calendar className="w-3 h-3" /> {new Date(task.updated_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-accent/10 border border-accent/20">
                <div className="p-3 bg-accent/20 rounded-full text-accent shadow-inner">
                    <Zap className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-foreground">Vélocité actuelle : <span className="text-accent">{completedTasksInfo.thisWeek.length} tâches/sem</span></h2>
                    <p className="text-sm text-muted-foreground">Comparé à {completedTasksInfo.lastWeek.length} tâches la semaine précédente.</p>
                </div>
            </div>

            {renderTaskList(completedTasksInfo.thisWeek, "Cette semaine (7 derniers jours)", "Aucune tâche terminée cette semaine.")}
            {renderTaskList(completedTasksInfo.lastWeek, "Semaine précédente", "Aucune tâche terminée la semaine précédente.")}
        </div>
    );
};
