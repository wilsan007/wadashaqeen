import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Medal, Award } from 'lucide-react';
import { useTopContributors } from '@/hooks/useTopContributors';
import { cn } from '@/lib/utils';

const RANK_CONFIG = [
  { icon: Trophy, colorClass: 'text-yellow-500', bgClass: 'bg-yellow-50 dark:bg-yellow-950/30' },
  { icon: Medal,  colorClass: 'text-slate-400',  bgClass: 'bg-slate-50 dark:bg-slate-900/30' },
  { icon: Award,  colorClass: 'text-amber-600',  bgClass: 'bg-amber-50 dark:bg-amber-950/30' },
];

export const TopContributors: React.FC = () => {
  const { data: contributors, isLoading } = useTopContributors(5);

  return (
    <Card className="modern-card border-l-4 border-l-violet-500">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Trophy className="h-4 w-4 text-violet-500" />
          Top 5 Contributeurs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))
        ) : !contributors || contributors.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Aucune donnée disponible
          </p>
        ) : (
          contributors.map((c, i) => {
            const cfg = RANK_CONFIG[i] ?? { icon: Award, colorClass: 'text-muted-foreground', bgClass: 'bg-muted/30' };
            const RankIcon = cfg.icon;
            return (
              <div
                key={c.assigneeId}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/40',
                  i === 0 && 'ring-1 ring-yellow-300/50 dark:ring-yellow-700/30'
                )}
              >
                {/* Rang */}
                <div className={cn('flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg', cfg.bgClass)}>
                  <RankIcon className={cn('h-4 w-4', cfg.colorClass)} />
                </div>

                {/* Nom + barre */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="truncate text-sm font-medium">{c.name}</span>
                    <span className="ml-2 flex-shrink-0 text-xs font-semibold text-muted-foreground">
                      {c.done}/{c.total}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        c.rate >= 75 ? 'bg-emerald-500' :
                        c.rate >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                      )}
                      style={{ width: `${c.rate}%` }}
                    />
                  </div>
                </div>

                {/* % */}
                <span className={cn(
                  'flex-shrink-0 text-sm font-bold tabular-nums',
                  c.rate >= 75 ? 'text-emerald-600 dark:text-emerald-400' :
                  c.rate >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
                )}>
                  {c.rate}%
                </span>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};
