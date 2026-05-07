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

      // Activity last 14 days
      const days = Array.from({ length: 14 }, (_, i) => {
        const d = subDays(new Date(), 13 - i);
        return { date: format(d, 'dd/MM', { locale: fr }), count: 0 };
      });
      tasks.forEach(t => {
        if (!t.updated_at) return;
        const dayStr = format(new Date(t.updated_at), 'dd/MM', { locale: fr });
        const slot = days.find(d => d.date === dayStr);
        if (slot) slot.count++;
      });

      // KPIs
      const total = tasks.length;
      const completed = tasks.filter(t => t.status === 'done').length;
      const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length;
      const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      return { statusCount, priorityCount, activityDays: days, total, completed, overdue, successRate };
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

const STATUS_LABELS: Record<string, string> = {
  todo: 'À faire',
  in_progress: 'En cours',
  done: 'Terminé',
  blocked: 'Bloqué',
  review: 'En revue',
};

const PRIORITY_COLORS: Record<string, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#10b981',
  urgent: '#dc2626',
};

const PRIORITY_LABELS: Record<string, string> = {
  high: 'Élevé',
  medium: 'Moyen',
  low: 'Faible',
  urgent: 'Urgent',
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-slate-800/90 px-4 py-3 text-sm shadow-2xl backdrop-blur-sm">
      <p className="mb-1 font-semibold text-white">{label}</p>
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

  const statusData = useMemo(() =>
    Object.entries(data?.statusCount ?? {}).map(([key, value]) => ({
      name: STATUS_LABELS[key] ?? key,
      value,
      color: STATUS_COLORS[key] ?? '#94a3b8',
    })),
    [data]
  );

  const priorityData = useMemo(() =>
    Object.entries(data?.priorityCount ?? {}).map(([key, value]) => ({
      name: PRIORITY_LABELS[key] ?? key,
      tasks: value,
      fill: PRIORITY_COLORS[key] ?? '#94a3b8',
    })),
    [data]
  );

  const achievements = [
    { title: '🏆 Expert Productivité', desc: '50 tâches complétées', unlocked: (data?.completed ?? 0) >= 50 },
    { title: '⚡ Vitesse Éclair', desc: 'Bonne cadence de travail', unlocked: (data?.completed ?? 0) >= 10 },
    { title: '📅 Régularité', desc: '30 jours consécutifs actif', unlocked: false },
    { title: '🎯 Précision', desc: 'Taux de réussite de 100%', unlocked: data?.successRate === 100 },
  ];

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-500/30">
          <Activity className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Mes Statistiques</h1>
          <p className="text-sm text-slate-400">Votre performance en temps réel</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl bg-slate-800" />
          ))
        ) : (
          <>
            <StatCard
              icon={CheckCircle} label="Tâches complétées" value={data?.completed ?? 0}
              sub={`sur ${data?.total ?? 0} au total`}
              gradient="from-emerald-600 to-teal-600" iconColor="text-emerald-200"
            />
            <StatCard
              icon={Target} label="Taux de réussite" value={`${data?.successRate ?? 0}%`}
              gradient="from-violet-600 to-purple-600" iconColor="text-violet-200"
            />
            <StatCard
              icon={Calendar} label="Total tâches" value={data?.total ?? 0}
              gradient="from-blue-600 to-cyan-600" iconColor="text-blue-200"
            />
            <StatCard
              icon={Clock} label="En retard" value={data?.overdue ?? 0}
              sub="tâches à traiter"
              gradient="from-rose-600 to-pink-600" iconColor="text-rose-200"
            />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Area Chart — Activité 14 jours */}
        <Card className="border-slate-800 bg-slate-900/60 shadow-xl backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-white">Activité — 14 derniers jours</CardTitle>
            <CardDescription className="text-slate-400">Tâches mises à jour par jour</CardDescription>
          </CardHeader>
          <CardContent className="h-60 pt-2">
            {isLoading ? (
              <Skeleton className="h-full w-full rounded-xl bg-slate-800" />
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
                    type="monotone" dataKey="count" name="Tâches"
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
        <Card className="border-slate-800 bg-slate-900/60 shadow-xl backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-white">Répartition par statut</CardTitle>
            <CardDescription className="text-slate-400">Distribution de vos tâches</CardDescription>
          </CardHeader>
          <CardContent className="h-60 pt-2">
            {isLoading ? (
              <Skeleton className="h-full w-full rounded-xl bg-slate-800" />
            ) : statusData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-slate-500 text-sm">
                Aucune donnée disponible
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
        <Card className="border-slate-800 bg-slate-900/60 shadow-xl backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-white">Tâches par priorité</CardTitle>
            <CardDescription className="text-slate-400">Répartition selon l'urgence</CardDescription>
          </CardHeader>
          <CardContent className="h-60 pt-2">
            {isLoading ? (
              <Skeleton className="h-full w-full rounded-xl bg-slate-800" />
            ) : priorityData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-slate-500 text-sm">
                Aucune donnée disponible
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="tasks" name="Tâches" radius={[6, 6, 0, 0]}>
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
        <Card className="border-slate-800 bg-slate-900/60 shadow-xl backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-white">
              <div className="rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 p-1.5">
                <Award className="h-4 w-4 text-white" />
              </div>
              Réalisations
            </CardTitle>
            <CardDescription className="text-slate-400">Débloquez des badges en travaillant</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {achievements.map((a, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${
                  a.unlocked
                    ? 'border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20'
                    : 'border-slate-700/50 bg-slate-800/30 opacity-40'
                }`}
              >
                <span className="text-2xl">{a.title.split(' ')[0]}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{a.title.split(' ').slice(1).join(' ')}</p>
                  <p className="text-xs text-slate-400">{a.desc}</p>
                </div>
                {a.unlocked && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs border-0">
                    ✓ Débloqué
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
