import React from 'react';
import { useTenantOwnerSetup } from '@/hooks/useTenantOwnerSetup';
import TenantOwnerWelcome from '@/components/auth/TenantOwnerWelcome';
import { BrandedLoadingScreen } from '@/components/layout/BrandedLoadingScreen';
import { useProjectStats } from '@/hooks/useProjectStats';
import { useTeamStats } from '@/hooks/useTeamStats';
import { useTaskMetrics } from '@/hooks/useTaskMetrics';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FolderKanban, Users, CheckSquare, AlertTriangle,
  TrendingUp, ArrowRight, BarChart3, Activity,
} from 'lucide-react';

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard: React.FC<{
  icon: React.ElementType;
  title: string;
  value: string | number;
  sub?: string;
  to?: string;
  loading?: boolean;
  gradient: string;
  iconBg: string;
  accent: string;
}> = ({ icon: Icon, title, value, sub, to, loading, gradient, iconBg, accent }) => (
  <div className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-6 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`}>
    <div className="absolute inset-0 bg-white/5 opacity-0 transition-opacity group-hover:opacity-100" />
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-white/70">{title}</p>
        {loading ? (
          <Skeleton className="mt-2 h-10 w-20 bg-white/20" />
        ) : (
          <p className="mt-2 text-4xl font-extrabold text-white">{value}</p>
        )}
        {sub && <p className="mt-1 text-xs text-white/60">{sub}</p>}
        {to && (
          <Link
            to={to}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-white/80 transition-colors hover:text-white"
          >
            Voir détails <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      <div className={`rounded-2xl ${iconBg} p-3.5 shadow-lg`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
    </div>
    <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${accent} opacity-40`} />
  </div>
);

// ─── Task status bar ──────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  todo:        { label: 'À faire',   color: 'bg-slate-400',  bg: 'bg-slate-400/20' },
  in_progress: { label: 'En cours',  color: 'bg-amber-400',  bg: 'bg-amber-400/20' },
  done:        { label: 'Terminé',   color: 'bg-emerald-400', bg: 'bg-emerald-400/20' },
  blocked:     { label: 'Bloqué',    color: 'bg-rose-400',   bg: 'bg-rose-400/20' },
  review:      { label: 'En revue',  color: 'bg-violet-400', bg: 'bg-violet-400/20' },
};

const TaskBar: React.FC<{ status: string; count: number; total: number }> = ({ status, count, total }) => {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: 'bg-blue-400', bg: 'bg-blue-400/20' };
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-sm text-slate-300">{cfg.label}</span>
      <div className={`h-2.5 flex-1 overflow-hidden rounded-full ${cfg.bg}`}>
        <div
          className={`h-full rounded-full ${cfg.color} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 text-right text-sm font-bold text-white">{count}</span>
      <span className="w-10 text-right text-xs text-slate-500">{pct}%</span>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const Dashboard: React.FC = () => {
  const { isLoading, isPendingTenantOwner, userEmail } = useTenantOwnerSetup();
  const { data: projectStats, isLoading: projectsLoading } = useProjectStats();
  const { data: teamStats, isLoading: teamLoading } = useTeamStats();
  const { data: taskMetrics, isLoading: tasksLoading } = useTaskMetrics();

  if (isLoading) {
    return <BrandedLoadingScreen appName="Wadashaqayn" logoSrc="/logo-w.svg" />;
  }

  if (isPendingTenantOwner && userEmail) {
    return <TenantOwnerWelcome userEmail={userEmail} />;
  }

  const totalTasks = taskMetrics?.reduce((acc, m) => acc + m.count, 0) ?? 0;
  const doneTasks = taskMetrics?.find(m => m.status === 'done')?.count ?? 0;
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-blue-500/30">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">Tableau de bord</h1>
            <p className="text-sm text-slate-400">Vue d'ensemble de votre activité</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={FolderKanban} title="Projets totaux"
            value={projectsLoading ? '…' : (projectStats?.total ?? 0)}
            sub={`${projectStats?.active ?? 0} actifs`}
            to="/projects" loading={projectsLoading}
            gradient="from-blue-700 to-cyan-600"
            iconBg="bg-white/15" accent="bg-gradient-to-r from-blue-400 to-cyan-400"
          />
          <StatCard
            icon={TrendingUp} title="Projets actifs"
            value={projectsLoading ? '…' : (projectStats?.active ?? 0)}
            sub={`${projectStats?.completed ?? 0} terminés`}
            to="/projects" loading={projectsLoading}
            gradient="from-violet-700 to-purple-600"
            iconBg="bg-white/15" accent="bg-gradient-to-r from-violet-400 to-purple-400"
          />
          <StatCard
            icon={Users} title="Membres d'équipe"
            value={teamLoading ? '…' : (teamStats?.active ?? 0)}
            sub={`${teamStats?.departments ?? 0} départements`}
            to="/hr" loading={teamLoading}
            gradient="from-emerald-700 to-teal-600"
            iconBg="bg-white/15" accent="bg-gradient-to-r from-emerald-400 to-teal-400"
          />
          <StatCard
            icon={AlertTriangle} title="Projets en retard"
            value={projectsLoading ? '…' : (projectStats?.overdue ?? 0)}
            sub="nécessitent une attention"
            to="/projects" loading={projectsLoading}
            gradient="from-rose-700 to-pink-600"
            iconBg="bg-white/15" accent="bg-gradient-to-r from-rose-400 to-pink-400"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Task distribution */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-sm">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 p-2.5 shadow-lg">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Répartition des tâches</h2>
                  <p className="text-xs text-slate-400">{totalTasks} tâches au total</p>
                </div>
              </div>
              <Link to="/tasks" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                Voir tout <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {tasksLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 rounded-lg bg-slate-800" />
                ))}
              </div>
            ) : taskMetrics && taskMetrics.length > 0 ? (
              <div className="space-y-4">
                {taskMetrics.map(m => (
                  <TaskBar key={m.status} status={m.status} count={m.count} total={totalTasks} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                <CheckSquare className="mb-2 h-10 w-10" />
                <p className="text-sm">Aucune tâche pour le moment</p>
              </div>
            )}
          </div>

          {/* Completion rate */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 p-2.5 shadow-lg">
                <CheckSquare className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Taux d'achèvement</h2>
                <p className="text-xs text-slate-400">Tâches terminées</p>
              </div>
            </div>

            {/* Circular progress */}
            <div className="flex flex-col items-center py-4">
              <div className="relative h-36 w-36">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="10" />
                  <circle
                    cx="50" cy="50" r="40" fill="none"
                    stroke="url(#emeraldGrad)" strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 40 * completionRate / 100} ${2 * Math.PI * 40}`}
                    style={{ transition: 'stroke-dasharray 1s ease' }}
                  />
                  <defs>
                    <linearGradient id="emeraldGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#14b8a6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold text-white">{completionRate}%</span>
                  <span className="text-xs text-slate-400">complété</span>
                </div>
              </div>

              <div className="mt-6 w-full space-y-2 text-sm">
                <div className="flex justify-between text-slate-400">
                  <span>Terminées</span>
                  <span className="font-semibold text-emerald-400">{doneTasks}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>En cours</span>
                  <span className="font-semibold text-amber-400">
                    {taskMetrics?.find(m => m.status === 'in_progress')?.count ?? 0}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Restantes</span>
                  <span className="font-semibold text-slate-300">{totalTasks - doneTasks}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { to: '/tasks', label: 'Tâches', icon: CheckSquare, color: 'text-blue-400', bg: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20' },
            { to: '/projects', label: 'Projets', icon: FolderKanban, color: 'text-violet-400', bg: 'bg-violet-500/10 hover:bg-violet-500/20 border-violet-500/20' },
            { to: '/hr', label: 'RH', icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20' },
            { to: '/analytics', label: 'Analytics', icon: BarChart3, color: 'text-amber-400', bg: 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20' },
          ].map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-3 rounded-xl border p-4 transition-all duration-200 ${link.bg}`}
            >
              <link.icon className={`h-5 w-5 ${link.color}`} />
              <span className="text-sm font-medium text-white">{link.label}</span>
              <ArrowRight className="ml-auto h-4 w-4 text-slate-500" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
