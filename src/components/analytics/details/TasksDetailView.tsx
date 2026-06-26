import React, { useMemo } from 'react';
import { useTasks } from '@/hooks/optimized';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Clock, CheckCircle2, AlertTriangle, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isBefore, startOfDay } from 'date-fns';

interface TasksDetailViewProps {
    filterType: 'in_progress' | 'overdue' | 'blocked' | 'completed';
}

export const TasksDetailView: React.FC<TasksDetailViewProps> = ({ filterType }) => {
    const { tasks, loading } = useTasks();

    const filteredTasks = useMemo(() => {
        if (!tasks) return [];

        const today = startOfDay(new Date());

        return tasks.filter(task => {
            if (filterType === 'in_progress') {
                return task.status === 'in_progress' || task.status === 'doing';
            }
            if (filterType === 'blocked') {
                return task.status === 'blocked';
            }
            if (filterType === 'completed') {
                return task.status === 'done' || task.status === 'completed';
            }
            if (filterType === 'overdue') {
                if (task.status === 'done' || task.status === 'completed') return false;
                if (!task.end_date && !task.due_date) return false;
                const dueDate = new Date(task.end_date || task.due_date);
                return isBefore(startOfDay(dueDate), today);
            }
            return false;
        });
    }, [tasks, filterType]);

    if (loading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
            </div>
        );
    }

    if (filteredTasks.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground flex flex-col items-center justify-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-muted/50" />
                <p>Aucune tâche ne correspond à ce critère pour le moment.</p>
            </div>
        );
    }

    const getPriorityColor = (priority: string) => {
        switch (priority?.toLowerCase()) {
            case 'high': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
            case 'urgent': return 'bg-destructive/10 text-destructive border-destructive/20';
            case 'low': return 'bg-muted text-muted-foreground border-border';
            default: return 'bg-primary/20 text-primary border-primary/20';
        }
    };

    return (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between mb-4 border-b pb-2">
                <h3 className="font-medium text-sm text-foreground">{filteredTasks.length} Tâche(s)</h3>
            </div>

            {filteredTasks.map((task) => (
                <div key={task.id} className="modern-card p-4 hover:shadow-md transition-shadow bg-card/60 backdrop-blur-sm border-l-2 border-l-primary/30">
                    <div className="flex gap-4">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <h4 className="font-semibold text-sm line-clamp-2">{task.name || task.title}</h4>
                                <Badge variant="outline" className={cn("text-[10px] uppercase whitespace-nowrap", getPriorityColor(task.priority))}>
                                    {task.priority || 'Normal'}
                                </Badge>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                                {task.project_name && (
                                    <span className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded-md truncate max-w-[150px]">
                                        {task.project_name}
                                    </span>
                                )}
                                {filterType === 'overdue' && (task.end_date || task.due_date) && (
                                    <span className="flex items-center gap-1 text-destructive font-medium">
                                        <Clock className="w-3 h-3" />
                                        {new Date(task.end_date || task.due_date).toLocaleDateString()}
                                    </span>
                                )}
                                <span className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {task.assignee_name || 'Non assigné'}
                                </span>
                            </div>

                            <div className="relative pt-1">
                                <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                                    <span>{(task.progress || 0)}%</span>
                                </div>
                                <Progress value={task.progress || 0} className="h-1.5" />
                            </div>
                        </div>

                        {filterType === 'blocked' && (
                            <div className="flex items-center text-destructive">
                                <AlertCircle className="w-5 h-5" />
                            </div>
                        )}
                        {filterType === 'overdue' && (
                            <div className="flex items-center text-destructive">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};
