import React from 'react';
import { useHealthScore } from '@/hooks/useHealthScore';
import { Skeleton } from '@/components/ui/skeleton';
import { Gauge, TrendingUp, Clock, Zap, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

const GaugeArc: React.FC<{ value: number; color: string }> = ({ value, color }) => {
    const radius = 40;
    const circumference = Math.PI * radius;
    const dashOffset = circumference * (1 - Math.min(value, 100) / 100);

    return (
        <svg width="100" height="55" viewBox="0 0 100 55" className="mx-auto">
            <path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="10"
                strokeLinecap="round"
            />
            <path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke={color}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
            <text x="50" y="54" textAnchor="middle" fontSize="14" fontWeight="700" fill="currentColor" className="fill-foreground">
                {value}%
            </text>
        </svg>
    );
};

export const HealthScoreView: React.FC = () => {
    const { data: health, isLoading } = useHealthScore();

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-32 w-full rounded-xl" />
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
            </div>
        );
    }

    if (!health) {
        return <div className="p-4 text-center text-muted-foreground">Données insuffisantes pour calculer le score de santé.</div>;
    }

    const colorMap: Record<string, string> = {
        success: '#10b981',
        warning: '#f59e0b',
        destructive: '#ef4444',
    };
    const arcColor = colorMap[health.color] || '#10b981';

    const Icon = health.score >= 70 ? CheckCircle : health.score >= 40 ? AlertTriangle : XCircle;
    const iconColor = health.color === 'success' ? 'text-emerald-500' : health.color === 'warning' ? 'text-amber-500' : 'text-destructive';

    const pillars = [
        {
            label: 'Taux de complétion des tâches',
            value: health.breakdown.completion,
            icon: TrendingUp,
            description: 'Proportion de tâches terminées sur le total',
            weight: '40%',
        },
        {
            label: 'Respect des délais projets',
            value: health.breakdown.timeliness,
            icon: Clock,
            description: 'Inverse du taux de projets en retard',
            weight: '40%',
        },
        {
            label: 'Tendance de vélocité',
            value: health.breakdown.velocity,
            icon: Zap,
            description: 'Vitesse d\'exécution vs. semaine précédente',
            weight: '20%',
        },
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-5">
            {/* Global score */}
            <div className={cn(
                'rounded-xl p-5 flex flex-col sm:flex-row items-center gap-5 border',
                health.color === 'success' ? 'bg-emerald-500/5 border-emerald-500/20' :
                    health.color === 'warning' ? 'bg-amber-500/5 border-amber-500/20' :
                        'bg-destructive/5 border-destructive/20'
            )}>
                <div className="flex flex-col items-center">
                    <GaugeArc value={health.score} color={arcColor} />
                    <Badge variant="outline" className={cn('mt-1 font-semibold', iconColor, 'border-current/30')}>
                        <Icon className="w-3 h-3 mr-1" /> {health.label}
                    </Badge>
                </div>
                <div className="flex-1 text-sm text-muted-foreground">
                    <p className="font-semibold text-foreground text-base mb-1">Score de Santé Global</p>
                    <p>Ce score composite reflète la performance opérationnelle de l'ensemble de l'organisation. Il est calculé à partir de 3 piliers clés avec des pondérations différentes.</p>
                </div>
            </div>

            {/* Breakdown pillars */}
            <div className="space-y-3">
                <h3 className="font-semibold text-sm text-foreground border-b pb-2">Décomposition du score</h3>
                {pillars.map(pillar => {
                    const PillarIcon = pillar.icon;
                    const barColor = pillar.value >= 70 ? 'bg-emerald-500' : pillar.value >= 40 ? 'bg-amber-500' : 'bg-destructive';
                    return (
                        <div key={pillar.label} className="modern-card p-4 bg-card/60 backdrop-blur-sm">
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-primary/10 rounded-lg">
                                        <PillarIcon className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-sm">{pillar.label}</h4>
                                        <p className="text-[11px] text-muted-foreground">{pillar.description}</p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="font-bold text-lg">{pillar.value}%</span>
                                    <p className="text-[10px] text-muted-foreground">Poids : {pillar.weight}</p>
                                </div>
                            </div>
                            <Progress value={pillar.value} className="h-1.5" indicatorColor={barColor} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Re-export Badge inline
const Badge: React.FC<{ children: React.ReactNode; variant?: string; className?: string }> = ({ children, className }) => (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border', className)}>{children}</span>
);
