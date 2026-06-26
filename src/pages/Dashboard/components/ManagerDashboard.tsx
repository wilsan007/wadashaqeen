/**
 * ManagerDashboard - KPIs pour super_admin et tenant_admin
 * Données: tous projets, tous employés, toutes tâches
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { KPICard } from '@/components/analytics/KPICard';
import {
  FolderKanban,
  Users,
  CheckSquare,
  AlertTriangle,
  TrendingUp,
  Clock,
  ArrowRight,
  Zap,
  Timer,
  ShieldCheck,
  BatteryMedium,
  OctagonX,
  Gauge,
  MoonStar,
} from 'lucide-react';
import { useProjectStats } from '@/hooks/useProjectStats';
import { useTeamStats } from '@/hooks/useTeamStats';
import { useTaskMetrics } from '@/hooks/useTaskMetrics';
import { useOverdueTaskCount } from '@/hooks/useMyTaskMetrics';
import { useTaskVelocity, useTaskResolutionTime } from '@/hooks/useTaskVelocity';
import { useBlockedTasks } from '@/hooks/useBlockedTasks';
import { useResourceUtilization } from '@/hooks/useResourceUtilization';
import { useInactiveProjects } from '@/hooks/useInactiveProjects';
import { useHealthScore } from '@/hooks/useHealthScore';
import { TopContributors } from '@/components/analytics/TopContributors';
import { useTranslation } from '@/hooks/useTranslation';

import { KPISelectionModal, type KPICategoryId } from '@/components/analytics/KPISelectionModal';
import { KPIDetailsModal } from '@/components/analytics/KPIDetailsModal';
import { Button } from '@/components/ui/button';
import { Settings2 } from 'lucide-react';
import { useKPIPreferences } from '@/hooks/useKPIPreferences';

export const ManagerDashboard: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [drillDownKpi, setDrillDownKpi] = useState<{ id: string, title?: string } | null>(null);
  const { t, locale } = useTranslation();
  const durationUnit = locale === 'fr' ? 'j' : 'd';
  const { data: projectStats, isLoading: projectsLoading } = useProjectStats();
  const { data: teamStats, isLoading: teamLoading } = useTeamStats();
  const { data: taskMetrics, isLoading: tasksLoading } = useTaskMetrics();
  const { data: overdueCount, isLoading: overdueLoading } = useOverdueTaskCount();
  const { data: velocity, isLoading: velocityLoading } = useTaskVelocity();
  const { data: resolution, isLoading: resolutionLoading } = useTaskResolutionTime();
  const { data: blocked, isLoading: blockedLoading } = useBlockedTasks();
  const { data: utilization, isLoading: utilizationLoading } = useResourceUtilization();
  const { data: inactive, isLoading: inactiveProjectsLoading } = useInactiveProjects();
  const { data: health, isLoading: healthLoading } = useHealthScore();

  const totalTasks = taskMetrics?.reduce((acc, m) => acc + m.count, 0) ?? 0;
  const doneTasks = taskMetrics
    ? (taskMetrics.find(m => m.status === 'done')?.count ?? 0) +
    (taskMetrics.find(m => m.status === 'completed')?.count ?? 0)
    : 0;
  const inProgressTasks = (taskMetrics?.find(m => m.status === 'in_progress')?.count ?? 0)
    + (taskMetrics?.find(m => m.status === 'doing')?.count ?? 0);
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const ALL_KPIS: { id: string; label: string; category: KPICategoryId; card: React.ReactNode }[] = [
    {
      id: 'active_projects', label: t('kpi.activeProjects'), category: 'projects',
      card: <KPICard key="active_projects" onClick={() => setDrillDownKpi({ id: 'active_projects', title: t('kpi.activeProjects') })} title={t('kpi.activeProjects')} value={projectsLoading ? '...' : (projectStats?.active ?? 0)} icon={FolderKanban} color="primary" progress={projectStats ? Math.round((projectStats.active / Math.max(projectStats.total, 1)) * 100) : undefined} trend={projectStats ? { value: projectStats.completed, isPositive: true, label: t('managerDashboard.completedLabel').replace('%s', String(projectStats.completed)).replace('%s', String(projectStats.total)) } : undefined} />
    },
    {
      id: 'overdue_projects', label: t('kpi.overdueProjects'), category: 'projects',
      card: <KPICard key="overdue_projects" onClick={() => setDrillDownKpi({ id: 'overdue_projects', title: t('kpi.overdueProjects') })} title={t('kpi.overdueProjects')} value={projectsLoading ? '...' : (projectStats?.overdue ?? 0)} icon={AlertTriangle} color="destructive" progress={projectStats ? Math.round((projectStats.overdue / Math.max(projectStats.total, 1)) * 100) : undefined} trend={projectStats?.overdue !== undefined ? { value: 0, isPositive: projectStats.overdue === 0, label: t('managerDashboard.overdueAttention') } : undefined} />
    },
    {
      id: 'active_members', label: t('kpi.activeMembers'), category: 'team',
      card: <KPICard key="active_members" onClick={() => setDrillDownKpi({ id: 'active_members', title: t('kpi.activeMembers') })} title={t('kpi.activeMembers')} value={teamLoading ? '...' : (teamStats?.active ?? 0)} icon={Users} color="success" trend={teamStats ? { value: 0, isPositive: true, label: t('managerDashboard.departments').replace('%s', String(teamStats.departments)) } : undefined} />
    },
    {
      id: 'completion_rate', label: t('kpi.completionRate'), category: 'tasks',
      card: <KPICard key="completion_rate" onClick={() => setDrillDownKpi({ id: 'completion_rate', title: t('kpi.completionRate') })} title={t('kpi.completionRate')} value={tasksLoading ? '...' : completionRate} icon={TrendingUp} color="accent" format="percentage" progress={tasksLoading ? undefined : completionRate} trend={!tasksLoading ? { value: completionRate, isPositive: completionRate >= 50, label: t('kpi.doneCount').replace('%s', `${doneTasks}`) + ` / ${totalTasks}` } : undefined} />
    },
    {
      id: 'in_progress_tasks', label: t('kpi.inProgressTasks'), category: 'tasks',
      card: <KPICard key="in_progress_tasks" onClick={() => setDrillDownKpi({ id: 'in_progress_tasks', title: t('kpi.inProgressTasks') })} title={t('kpi.inProgressTasks')} value={tasksLoading ? '...' : inProgressTasks} icon={Clock} color="warning" progress={tasksLoading ? undefined : totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0} trend={!tasksLoading ? { value: 0, isPositive: true, label: t('kpi.inProgressShort') } : undefined} />
    },
    {
      id: 'overdue_tasks', label: t('kpi.overdueTasks'), category: 'tasks',
      card: <KPICard key="overdue_tasks" onClick={() => setDrillDownKpi({ id: 'overdue_tasks', title: t('kpi.overdueTasks') })} title={t('kpi.overdueTasks')} value={overdueLoading ? '...' : (overdueCount ?? 0)} icon={AlertTriangle} color="destructive" />
    },
    {
      id: 'velocity', label: t('kpi.velocity'), category: 'performance',
      card: <KPICard key="velocity" onClick={() => setDrillDownKpi({ id: 'velocity', title: t('kpi.velocity') })} title={t('kpi.velocity')} value={velocityLoading ? '...' : (velocity?.currentWeek ?? 0)} icon={Zap} color="accent" subtitle={velocity ? t('kpi.velocityPrev').replace('%s', String(velocity.previousWeek)) : undefined} progress={velocity ? Math.min(Math.round((velocity.currentWeek / Math.max(velocity.previousWeek * 1.2, 5)) * 100), 100) : undefined} trend={velocity && velocity.trendPct !== 0 ? { value: Math.abs(velocity.trendPct), isPositive: velocity.trendPct >= 0, label: t('kpi.velocityVsPrev').replace('%s', String(velocity.previousWeek)) } : velocity ? { value: 0, isPositive: true, label: t('kpi.velocitySame') } : undefined} />
    },
    {
      id: 'resolution_time', label: t('kpi.resolutionTime'), category: 'performance',
      card: <KPICard key="resolution_time" onClick={() => setDrillDownKpi({ id: 'resolution_time', title: t('kpi.resolutionTime') })} title={t('kpi.resolutionTime')} value={resolutionLoading ? '...' : (resolution?.medianDays ?? 0)} icon={Timer} color={resolution?.color ?? 'success'} format="duration" durationUnit={durationUnit} subtitle={resolution?.sampleSize ? t('kpi.resolutionSample').replace('%s', String(resolution.sampleSize)) : undefined} trend={resolution?.sampleSize ? { value: 0, isPositive: (resolution.medianDays ?? 0) <= 3, label: (resolution.medianDays ?? 0) <= 3 ? t('kpi.resolutionExcellent') : (resolution.medianDays ?? 0) <= 7 ? t('kpi.resolutionOk') : t('kpi.resolutionImprove') } : undefined} />
    },
    {
      id: 'health_score', label: t('kpi.healthScore'), category: 'performance',
      card: <KPICard key="health_score" onClick={() => setDrillDownKpi({ id: 'health_score', title: t('kpi.healthScore') })} title={t('kpi.healthScore')} value={healthLoading ? '...' : (health?.score ?? 0)} icon={Gauge} color={health?.color ?? 'success'} format="percentage" progress={healthLoading ? undefined : (health?.score ?? 0)} subtitle={health?.label} trend={health ? { value: 0, isPositive: health.score >= 70, label: t('kpi.healthBreakdown').replace('%s', String(health.breakdown.completion)).replace('%s', String(health.breakdown.timeliness)) } : undefined} />
    },
    {
      id: 'resource_utilization', label: t('kpi.resourceUtilization'), category: 'team',
      card: <KPICard key="resource_utilization" onClick={() => setDrillDownKpi({ id: 'resource_utilization', title: t('kpi.resourceUtilization') })} title={t('kpi.resourceUtilization')} value={utilizationLoading ? '...' : (utilization?.avgUtilization ?? 0)} icon={BatteryMedium} color="primary" format="percentage" progress={utilizationLoading ? undefined : (utilization?.avgUtilization ?? 0)} subtitle={utilization ? t('kpi.resourceSubtitle').replace('%s', String(utilization.overloadedCount)).replace('%s', String(utilization.availableCount)) : undefined} trend={utilization ? { value: 0, isPositive: (utilization.avgUtilization ?? 0) <= 85, label: (utilization.avgUtilization ?? 0) > 85 ? t('kpi.resourceOverload') : t('kpi.resourceBalanced') } : undefined} />
    },
    {
      id: 'blocked_tasks', label: t('kpi.blockedTasks'), category: 'tasks',
      card: <KPICard key="blocked_tasks" onClick={() => setDrillDownKpi({ id: 'blocked_tasks', title: t('kpi.blockedTasks') })} title={t('kpi.blockedTasks')} value={blockedLoading ? '...' : (blocked?.blockedOver3d ?? 0)} icon={OctagonX} color="destructive" subtitle={blocked ? t('kpi.blockedSub').replace('%s', String(blocked.blockedOver7d)) : undefined} trend={blocked ? { value: 0, isPositive: blocked.blockedOver3d === 0, label: blocked.blockedOver3d === 0 ? t('kpi.blockedNone') : t('kpi.blockedAlert') } : undefined} />
    },
    {
      id: 'inactive_projects', label: t('kpi.inactiveProjects'), category: 'projects',
      card: <KPICard key="inactive_projects" onClick={() => setDrillDownKpi({ id: 'inactive_projects', title: t('kpi.inactiveProjects') })} title={t('kpi.inactiveProjects')} value={inactiveProjectsLoading ? '...' : (inactive?.count ?? 0)} icon={MoonStar} color="warning" progress={inactive ? Math.round((inactive.count / Math.max(inactive.total, 1)) * 100) : undefined} subtitle={inactive ? t('kpi.inactiveSubtitle').replace('%s', String(inactive.total)) : undefined} trend={inactive ? { value: 0, isPositive: inactive.count === 0, label: inactive.count === 0 ? t('kpi.inactiveAllActive') : t('kpi.inactiveAlert') } : undefined} />
    }
  ];

  const { preferences, toggleKPI, showAll, hideAll } = useKPIPreferences(
    'manager_dashboard',
    ALL_KPIS.map(k => k.id)
  );

  return (
    <section aria-label={t('managerDashboard.title')}>
      {/* Titre section & Filtres */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{t('managerDashboard.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('managerDashboard.subtitle')}</p>
        </div>

        <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsModalOpen(true)}>
          <Settings2 className="h-4 w-4" />
          {t('managerDashboard.customizeBtn')}
        </Button>
      </div>

      <KPIDetailsModal
        isOpen={!!drillDownKpi}
        onOpenChange={(open) => !open && setDrillDownKpi(null)}
        kpiId={drillDownKpi?.id || null}
        kpiTitle={drillDownKpi?.title}
      />

      <KPISelectionModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        kpis={ALL_KPIS}
        preferences={preferences}
        onToggle={toggleKPI}
        onShowAll={showAll}
        onHideAll={hideAll}
      />

      {/* Grille dynamique des KPIs */}
      {ALL_KPIS.filter(kpi => preferences[kpi.id]).length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ALL_KPIS.filter(kpi => preferences[kpi.id]).map(kpi => kpi.card)}
        </div>
      ) : (
        <div className="text-center p-8 border border-dashed rounded-xl bg-muted/20">
          <p className="text-sm text-muted-foreground">{t('managerDashboard.hiddenMessage')}</p>
        </div>
      )}

      {/* Top Contributeurs */}
      <div className="mt-4">
        <TopContributors />
      </div>

      {/* Raccourcis */}
      <nav
        className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4"
        aria-label={t('managerDashboard.title')}
      >
        {[
          { to: '/projects', label: t('managerDashboard.shortcutProjects'), icon: FolderKanban, cls: 'border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary' },
          { to: '/tasks', label: t('managerDashboard.shortcutTasks'), icon: CheckSquare, cls: 'border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
          { to: '/hr', label: t('managerDashboard.shortcutHR'), icon: Users, cls: 'border-violet-500/20 bg-violet-500/5 hover:bg-violet-500/10 text-violet-700 dark:text-violet-400' },
          { to: '/analytics', label: t('managerDashboard.shortcutAnalytics'), icon: TrendingUp, cls: 'border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 text-amber-700 dark:text-amber-400' },
        ].map(link => (
          <Link
            key={link.to}
            to={link.to}
            className={`flex items-center gap-2.5 rounded-xl border p-3.5 text-sm font-medium transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${link.cls}`}
          >
            <link.icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span className="flex-1">{link.label}</span>
            <ArrowRight className="ml-auto h-3.5 w-3.5 opacity-50" aria-hidden="true" />
          </Link>
        ))}
      </nav>
    </section>
  );
};
