import React from 'react';
import { useResourceUtilization } from '@/hooks/useResourceUtilization';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Battery, BatteryWarning, BatteryFull } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

export const ResourceUtilizationView: React.FC = () => {
    const { data, isLoading } = useResourceUtilization();
    const { t } = useTranslation();

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
            </div>
        );
    }

    if (!data || !data.details || data.details.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground">
                Aucune donnée d'utilisation disponible.
            </div>
        );
    }

    // The details are already sorted in descending order of utilization from the service.

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 text-center">
                    <div className="text-destructive font-bold text-2xl">{data.overloadedCount}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">En surcharge</div>
                </div>
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 text-center">
                    <div className="text-primary font-bold text-2xl">{data.avgUtilization}%</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Taux moyen</div>
                </div>
                <div className="bg-success/10 border border-success/20 rounded-xl p-3 text-center">
                    <div className="text-success font-bold text-2xl">{data.availableCount}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Sous-utilisés</div>
                </div>
            </div>

            <div className="space-y-3">
                {data.details.map((emp) => {
                    const isOverloaded = emp.utilization > 100;
                    const isUnderutilized = emp.utilization < 60;

                    return (
                        <div key={emp.id} className="modern-card p-4 flex flex-col sm:flex-row sm:items-center gap-4 bg-card/60 backdrop-blur-sm border-l-4" style={{ borderLeftColor: isOverloaded ? 'hsl(var(--destructive))' : isUnderutilized ? 'hsl(var(--success))' : 'hsl(var(--primary))' }}>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-sm truncate">{emp.name}</h4>
                                    {isOverloaded && (
                                        <Badge variant="destructive" className="h-5 text-[10px]">
                                            <BatteryWarning className="w-3 h-3 mr-1" /> {'>'} 100%
                                        </Badge>
                                    )}
                                    {isUnderutilized && (
                                        <Badge variant="outline" className="h-5 text-[10px] bg-success/20 text-success border-success/30 hover:bg-success/30">
                                            <BatteryFull className="w-3 h-3 mr-1" /> {'<'} 60%
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                                    <span>{emp.plannedHours}h prévues / {emp.capacity}h capacité</span>
                                    <span className={cn("font-bold", isOverloaded ? "text-destructive" : isUnderutilized ? "text-success" : "text-primary")}>
                                        {emp.utilization}%
                                    </span>
                                </div>
                                <Progress
                                    value={Math.min(emp.utilization, 100)}
                                    className={cn("h-1.5", isOverloaded ? "bg-destructive/20" : "")}
                                    indicatorColor={isOverloaded ? "bg-destructive" : isUnderutilized ? "bg-success" : "bg-primary"}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
