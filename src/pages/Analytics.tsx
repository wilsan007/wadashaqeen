/**
 * Analytics — Dashboard de performance avec vrais graphiques Recharts
 */

import React, { useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp, CheckCircle, Clock, Target, Calendar, Award, Activity,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CACHE_TTL } from '@/lib/queryConfig';
import { format, subDays, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useTranslation } from '@/hooks/useTranslation';

// ─── Data hooks ───────────────────────────────────────────────────────────────

function useMyTaskMetrics() {
  return useQuery({
    queryKey: ['analytics', 'my-tasks'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: tasks } = await supabase
        .from('tasks')
        .select('status, priority, created_at, updated_at, due_date')
        .eq('assignee_id', user.id);

      if (!tasks) return null;

      // Status distribution
      const statusCount: Record<string, number> = {};
      tasks.forEach(t => { statusCount[t.status] = (statusCount[t.status] ?? 0) + 1; });

      // Priority distribution
      const priorityCount: Record<string, number> = {};
      tasks.forEach(t => { if (t.priority) priorityCount[t.priority] = (priorityCount[t.priority] ?? 0) + 1; });

      // Activity last 30 days (30 pour le calcul de streak, graphique sur 14j)
      const days30 = Array.from({ length: 30 }, (_, i) => {
        const d = subDays(new Date(), 29 - i);
        return { dateKey: format(d, 'dd/MM', { locale: fr }), isoDate: format(d, 'yyyy-MM-dd'), count: 0 };
      });
      tasks.forEach(t => {
        if (!t.updated_at) return;
        const dayStr = format(new Date(t.updated_at), 'dd/MM', { locale: fr });
        const slot = days30.find(d => d.dateKey === dayStr);
        if (slot) slot.count++;
      });

      // Streak : nombre de jours consécutifs actifs en partant d'aujourd'hui
      let streakDays = 0;
      for (let i = days30.length - 1; i >= 0; i--) {
        if (days30[i].count > 0) streakDays++;
        else break;
      }

      // Graphique sur les 14 derniers jours
      const days = days30.slice(-14).map(d => ({ date: d.dateKey, count: d.count }));

      // KPIs
      const total = tasks.length;
      const completed = tasks.filter(t => t.status === 'done' || t.status === 'completed').length;
      const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done' && t.status !== 'completed').length;
      const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      return { statusCount, priorityCount, activityDays: days, total, completed, overdue, successRate, streakDays };
    },
    ...CACHE_TTL.realtime,
  });
}

// ─── Colors ───────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  todo: '#6366f1',
  in_progress: '#f59e0b',
  done: '#10b981',
  blocked: '#ef4444',
  review: '#8b5cf6',
};

const getStatusLabels = (t: (key: string) => string): Record<string, string> => ({
  todo: t('tasks.status.todo'),
  in_progress: t('tasks.status.in_progress'),
  done: t('tasks.status.done'),
  blocked: t('tasks.status.blocked'),
  review: t('tasks.status.review'),
});

const PRIORITY_COLORS: Record<string, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#10b981',
  urgent: '#dc2626',
};

const getPriorityLabels = (t: (key: string) => string): Record<string, string> => ({
  high: t('tasks.priority.high'),
  medium: t('tasks.priority.medium'),
  low: t('tasks.priority.low'),
  urgent: t('tasks.priority.urgent'),
});

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    /* Tooltip positionné par Recharts — fond adaptatif via tokens CSS */
    <div className="rounded-xl border border-border bg-popover px-4 py-3 text-sm shadow-2xl backdrop-blur-sm">
      <p className="mb-1 font-semibold text-popover-foreground">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }} className="text-xs">
          {entry.name}: <strong>{entry.value}</strong>
        </p>
      ))}
    </div>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, sub, gradient, iconColor,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  gradient: string;
  iconColor: string;
}) {
  return (
    <Card className={`group relative overflow-hidden border-0 bg-gradient-to-br ${gradient} shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`}>
      <div className="absolute inset-0 bg-white/5 opacity-0 transition-opacity group-hover:opacity-100" />
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-white/70">{label}</p>
            <p className="mt-1 text-3xl font-bold text-white">{value}</p>
            {sub && <p className="mt-1 text-xs text-white/60">{sub}</p>}
          </div>
          <div className={`rounded-2xl bg-white/10 p-3 backdrop-blur-sm`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Analytics() {
  const { data, isLoading } = useMyTaskMetrics();
  const { t } = useTranslation();

  const statusData = useMemo(() => {
    const labels = getStatusLabels(t);
    return Object.entries(data?.statusCount ?? {}).map(([key, value]) => ({
      name: labels[key] ?? key,
      value,
      color: STATUS_COLORS[key] ?? '#94a3b8',
    }));
  }, [data, t]);

  const priorityData = useMemo(() => {
    const labels = getPriorityLabels(t);
    return Object.entries(data?.priorityCount ?? {}).map(([key, value]) => ({
      name: labels[key] ?? key,
      tasks: value,
      fill: PRIORITY_COLORS[key] ?? '#94a3b8',
    }));
  }, [data, t]);

  const achievements = [
    { title: '🏆 Expert Productivité', desc: '50 tâches complétées', unlocked: (data?.completed ?? 0) >= 50 },
    { title: '⚡ Vitesse Éclair', desc: 'Bonne cadence de travail', unlocked: (data?.completed ?? 0) >= 10 },
    { title: '📅 Régularité', desc: '30 jours consécutifs actif', unlocked: (data?.streakDays ?? 0) >= 30 },
    { title: '🎯 Précision', desc: 'Taux de réussite de 100%', unlocked: data?.successRate === 100 },
  ];

  return (
    <div className="min-h-full bg-background p-4 sm:p-6">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-500/30"
          aria-hidden="true"
        >
          <Activity className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('analyticsStats.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('analyticsStats.subtitle')}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Indicateurs clés de performance">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl bg-muted" aria-label="Chargement..." />
          ))
        ) : (
          <>
            <StatCard
              icon={CheckCircle} label={t('analyticsStats.completedTasks')} value={data?.completed ?? 0}
              sub={t('analyticsStats.outOf').replace('%s', String(data?.total ?? 0))}
              gradient="from-emerald-600 to-teal-600" iconColor="text-emerald-200"
            />
            <StatCard
              icon={Target} label={t('analyticsStats.successRate')} value={`${data?.successRate ?? 0}%`}
              gradient="from-violet-600 to-purple-600" iconColor="text-violet-200"
            />
            <StatCard
              icon={Calendar} label={t('analyticsStats.totalTasks')} value={data?.total ?? 0}
              gradient="from-indigo-600 to-violet-600" iconColor="text-indigo-200"
            />
            <StatCard
              icon={Clock} label={t('analyticsStats.overdue')} value={data?.overdue ?? 0}
              sub={t('analyticsStats.tasksToProcess')}
              gradient="from-rose-600 to-pink-600" iconColor="text-rose-200"
            />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Area Chart — Activité 14 jours */}
        <Card className="border shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-card-foreground">{t('analyticsStats.activityTitle')}</CardTitle>
            <CardDescription className="text-muted-foreground">{t('analyticsStats.activityDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="h-60 pt-2">
            {isLoading ? (
              <Skeleton className="h-full w-full rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.activityDays ?? []}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone" dataKey="count" name={t('analyticsStats.tasks')}
                    stroke="#6366f1" strokeWidth={2}
                    fill="url(#areaGrad)"
                    dot={{ fill: '#6366f1', r: 3 }}
                    activeDot={{ r: 5, fill: '#a5b4fc' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart — Répartition par statut */}
        <Card className="border shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-card-foreground">{t('analyticsStats.statusTitle')}</CardTitle>
            <CardDescription className="text-muted-foreground">{t('analyticsStats.statusDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="h-60 pt-2">
            {isLoading ? (
              <Skeleton className="h-full w-full rounded-xl" />
            ) : statusData.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground text-sm" role="status">
                <TrendingUp className="h-8 w-8 opacity-40" aria-hidden="true" />
                {t('analyticsStats.noData')}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData} cx="40%" cy="50%" innerRadius={55} outerRadius={90}
                    paddingAngle={3} dataKey="value"
                  >
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    layout="vertical" align="right" verticalAlign="middle"
                    iconType="circle" iconSize={10}
                    formatter={(value) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Bar Chart — Priorités */}
        <Card className="border shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-card-foreground">{t('analyticsStats.priorityTitle')}</CardTitle>
            <CardDescription className="text-muted-foreground">{t('analyticsStats.priorityDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="h-60 pt-2">
            {isLoading ? (
              <Skeleton className="h-full w-full rounded-xl" />
            ) : priorityData.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground text-sm" role="status">
                <CheckCircle className="h-8 w-8 opacity-40" aria-hidden="true" />
                {t('analyticsStats.noData')}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="tasks" name={t('analyticsStats.tasks')} radius={[6, 6, 0, 0]}>
                    {priorityData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card className="border shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-card-foreground">
              <div className="rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 p-1.5" aria-hidden="true">
                <Award className="h-4 w-4 text-white" />
              </div>
              {t('analyticsStats.achievementsTitle')}
            </CardTitle>
            <CardDescription className="text-muted-foreground">{t('analyticsStats.achievementsDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {achievements.map((a, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${a.unlocked
                    ? 'border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20'
                    : 'border-border bg-muted/30 opacity-50'
                  }`}
                aria-disabled={!a.unlocked}
              >
                {/* Emoji séparé du titre pour Screen Reader */}
                <span className="text-2xl" aria-hidden="true">{a.title.split(' ')[0]}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{a.title.split(' ').slice(1).join(' ')}</p>
                  <p className="text-xs text-muted-foreground">{a.desc}</p>
                </div>
                {a.unlocked && (
                  <Badge className="border-0 bg-gradient-to-r from-amber-500 to-orange-500 text-xs text-white">
                    <span aria-hidden="true">✓</span> {t('analyticsStats.unlocked')}
                  </Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
