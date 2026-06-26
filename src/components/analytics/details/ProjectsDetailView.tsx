import React from 'react';
import { useProjects } from '@/hooks/optimized';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Clock, AlertTriangle, FolderKanban, MoonStar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isBefore, startOfDay } from 'date-fns';

type ProjectFilter = 'active' | 'inactive' | 'overdue' | 'completed';

interface ProjectsDetailViewProps {
    filterType: ProjectFilter;
}

const STATUS_COLORS: Record<string, string> = {
    planning: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    active: 'bg-primary/10 text-primary border-primary/20',
    on_hold: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    completed: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
};

export const ProjectsDetailView: React.FC<ProjectsDetailViewProps> = ({ filterType }) => {
    const { projects, loading } = useProjects();

    const filtered = React.useMemo(() => {
        if (!projects) return [];
        const today = startOfDay(new Date());

        return projects.filter((p: any) => {
            if (filterType === 'active') return p.status === 'active' || p.status === 'planning';
            if (filterType === 'completed') return p.status === 'completed';
            if (filterType === 'inactive') return p.status === 'on_hold';
            if (filterType === 'overdue') {
                if (p.status === 'completed') return false;
                if (!p.end_date) return false;
                return isBefore(startOfDay(new Date(p.end_date)), today);
            }
            return false;
        });
    }, [projects, filterType]);

    if (loading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
            </div>
        );
    }

    if (filtered.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-2">
                <CheckCircle2 className="w-8 h-8 opacity-40" />
                <p>Aucun projet dans cette catégorie.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider border-b pb-2">
                {filtered.length} projet(s)
            </p>
            {filtered.map((project: any) => {
                const isOverdue = filterType === 'overdue';
                const progress = project.progress ?? 0;
                return (
                    <div
                        key={project.id}
                        className={cn(
                            'modern-card p-4 bg-card/60 backdrop-blur-sm border-l-2 transition-shadow hover:shadow-md',
                            isOverdue ? 'border-l-destructive' : 'border-l-primary/40'
                        )}
                    >
                        <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2 min-w-0">
                                <FolderKanban className="w-4 h-4 text-muted-foreground shrink-0" />
                                <h4 className="font-semibold text-sm truncate">{project.name}</h4>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                {isOverdue && (
                                    <Badge variant="destructive" className="h-5 text-[10px]">
                                        <AlertTriangle className="w-3 h-3 mr-1" /> En retard
                                    </Badge>
                                )}
                                <Badge variant="outline" className={cn('h-5 text-[10px] capitalize', STATUS_COLORS[project.status] || '')}>
                                    {project.status}
                                </Badge>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Pas d\'échéance'}
                            </span>
                            <span className="font-medium">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-1.5" indicatorColor={isOverdue ? 'bg-destructive' : undefined} />
                        {project.manager_name && (
                            <p className="text-xs text-muted-foreground mt-2">👤 {project.manager_name}</p>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
