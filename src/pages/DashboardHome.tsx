import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRoleBasedAccess } from '@/hooks/useRoleBasedAccess';
import { KPICard } from '@/components/analytics/KPICard';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CACHE_TTL } from '@/lib/queryConfig';
import { useTranslation } from '@/hooks/useTranslation';
import { ManagerDashboard } from '@/pages/Dashboard/components/ManagerDashboard';
import { TeamLeaderDashboard } from '@/pages/Dashboard/components/TeamLeaderDashboard';
import { useAuth } from '@/contexts/AuthContext';
import {
  CheckCircle2,
  ListTodo,
  AlertCircle,
  Percent,
  Users,
  FolderKanban,
  Activity,
  Crown,
  BarChart3,
  ArrowRight,
  Briefcase,
  Database,
  Server,
} from '@/lib/icons';

// ─── Queries ──────────────────────────────────────────────────────────────────

function usePersonalMetrics() {
  return useQuery({
    queryKey: ['dashboard', 'personal'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { completed: 0, inProgress: 0, overdue: 0, total: 0, successRate: 0 };

      const { data: tasks } = await supabase
        .from('tasks')
        .select('status, due_date')
        .eq('assignee_id', user.id);

      if (!tasks) return { completed: 0, inProgress: 0, overdue: 0, total: 0, successRate: 0 };

      const total = tasks.length;
      const completed = tasks.filter(t => t.status === 'done' || t.status === 'completed').length;
      const inProgress = tasks.filter(t => t.status === 'in_progress' || t.status === 'doing').length;
      const overdue = tasks.filter(
        t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done' && t.status !== 'completed'
      ).length;
      const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      return { completed, inProgress, overdue, total, successRate };
    },
    ...CACHE_TTL.realtime,
  });
}

function useTeamMetrics(enabled: boolean, providedTenantId: string | null) {
  return useQuery({
    queryKey: ['dashboard', 'team'],
    enabled,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { totalTasks: 0, activeProjects: 0, activeMembers: 0 };

      // Utiliser le tenantId fourni par le contexte
      const tenantId = providedTenantId;


      const tasksQuery = supabase.from('tasks').select('id', { count: 'exact', head: true });
      const projectsQuery = supabase.from('projects')
        .select('id', { count: 'exact', head: true })
        .in('status', ['in_progress', 'active', 'planning']);
      const membersQuery = supabase.from('profiles').select('id', { count: 'exact', head: true });

      const [tasksRes, projectsRes, membersRes] = await Promise.all([
        tenantId ? tasksQuery.eq('tenant_id', tenantId) : tasksQuery,
        tenantId ? projectsQuery.eq('tenant_id', tenantId) : projectsQuery,
        tenantId ? membersQuery.eq('tenant_id', tenantId) : membersQuery,
      ]);

      return {
        totalTasks: tasksRes.count ?? 0,
        activeProjects: projectsRes.count ?? 0,
        activeMembers: membersRes.count ?? 0,
      };
    },
    ...CACHE_TTL.semiStatic,
  });
}

function useHRMetrics(enabled: boolean, providedTenantId: string | null) {
  return useQuery({
    queryKey: ['dashboard', 'hr'],
    enabled,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { totalStaff: 0, pendingAbsences: 0 };

      const tenantId = providedTenantId;


      const staffQuery = supabase.from('profiles').select('id', { count: 'exact', head: true });
      const absencesQuery = supabase
        .from('leave_requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');

      const [staffRes, absencesRes] = await Promise.all([
        tenantId ? staffQuery.eq('tenant_id', tenantId) : staffQuery,
        tenantId ? absencesQuery.eq('tenant_id', tenantId) : absencesQuery,
      ]);

      return {
        totalStaff: staffRes.count ?? 0,
        pendingAbsences: absencesRes.error ? 0 : (absencesRes.count ?? 0),
      };
    },
    ...CACHE_TTL.semiStatic,
  });
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function KPICardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-12 w-12 rounded-lg" />
      </div>
    </div>
  );
}

function GridSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <KPICardSkeleton key={i} />
      ))}
    </div>
  );
}

// ─── Types et constantes de rôles ─────────────────────────────────────────────

type RoleKey = 'super_admin' | 'admin' | 'advanced' | 'basic' | 'none';

const ROLE_VARIANTS: Record<RoleKey, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  super_admin: 'destructive',
  admin: 'default',
  advanced: 'secondary',
  basic: 'outline',
  none: 'outline',
};

// ─── Sous-composants ──────────────────────────────────────────────────────────

function SectionTitle({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h2
      id={id}
      className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground"
    >
      {children}
    </h2>
  );
}

function QuickActionCard({
  to,
  icon: Icon,
  label,
  description,
}: {
  to: string;
  icon: React.ElementType;
  label: string;
  description: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm transition-all duration-150 hover:border-primary/30 hover:shadow-md"
    >
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{label}</p>
        <p className="truncate text-xs text-muted-foreground">{description}</p>
      </div>
      <ArrowRight
        className="h-4 w-4 flex-shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
        aria-hidden="true"
      />
    </Link>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function DashboardHome() {
  const {
    isSuperAdmin,
    isTenantAdmin,
    isHRManager,
    isProjectManager,
    accessRights,
    isLoading: roleLoading,
  } = useRoleBasedAccess();

  const { t } = useTranslation();
  const accessLevel = accessRights.accessLevel as RoleKey;

  const roleLabels: Record<RoleKey, string> = {
    super_admin: t('roles.super_admin'),
    admin: t('roles.admin'),
    advanced: t('roles.advanced'),
    basic: t('roles.basic'),
    none: t('roles.none'),
  };

  const canSeeTeam = isProjectManager || isTenantAdmin || isSuperAdmin;
  const canSeeHR = isHRManager || isTenantAdmin || isSuperAdmin;

  const { profile } = useAuth();
  const tenantId = profile?.tenantId ?? null;

  const personal = usePersonalMetrics();
  const team = useTeamMetrics(canSeeTeam, tenantId);
  const hr = useHRMetrics(canSeeHR, tenantId);

  const roleSubtitle = useMemo(() => {
    if (isSuperAdmin) return t('roles.subtitles.super_admin');
    if (isTenantAdmin) return t('roles.subtitles.tenant_admin');
    if (isHRManager && isProjectManager) return t('roles.subtitles.hr_and_pm');
    if (isHRManager) return t('roles.subtitles.hr');
    if (isProjectManager) return t('roles.subtitles.pm');
    return t('roles.subtitles.personal');
  }, [isSuperAdmin, isTenantAdmin, isHRManager, isProjectManager, t]);

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <GridSkeleton count={4} />
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-8">

        {/* En-tête */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('dashboard.title')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{roleSubtitle}</p>
          </div>
          <Badge variant={ROLE_VARIANTS[accessLevel]}>
            {roleLabels[accessLevel]}
          </Badge>
        </div>

        {/* Section : Mes indicateurs personnels */}
        <section aria-labelledby="section-personal">
          <SectionTitle id="section-personal">{t('dashboard.myIndicators')}</SectionTitle>
          {personal.isLoading ? (
            <GridSkeleton count={4} />
          ) : (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <KPICard
                title={t('kpi.completedTasks')}
                value={personal.data?.completed ?? 0}
                icon={CheckCircle2}
                color="success"
              />
              <KPICard
                title={t('kpi.inProgress')}
                value={personal.data?.inProgress ?? 0}
                icon={ListTodo}
                color="primary"
              />
              <KPICard
                title={t('kpi.overdue')}
                value={personal.data?.overdue ?? 0}
                icon={AlertCircle}
                color="destructive"
              />
              <KPICard
                title={t('kpi.successRate')}
                value={personal.data?.successRate ?? 0}
                icon={Percent}
                format="percentage"
                color={
                  (personal.data?.successRate ?? 0) >= 70
                    ? 'success'
                    : (personal.data?.successRate ?? 0) >= 40
                      ? 'warning'
                      : 'destructive'
                }
              />
            </div>
          )}
        </section>

        {/* ── Séparateur ─────────────────────────────────────────────── */}
        {(isSuperAdmin || isTenantAdmin || isProjectManager) && (
          <div className="border-t border-border/50" />
        )}

        {/* ── Admin / Super Admin → ManagerDashboard complet ─────────── */}
        {(isSuperAdmin || isTenantAdmin) && (
          <section aria-labelledby="section-manager-kpis">
            <ManagerDashboard />
          </section>
        )}

        {/* ── Chef d'équipe / PM → TeamLeaderDashboard ───────────────── */}
        {isProjectManager && !isTenantAdmin && !isSuperAdmin && (
          <section aria-labelledby="section-teamleader-kpis">
            <TeamLeaderDashboard />
          </section>
        )}

        {/* ── Système (Super Admin uniquement) ───────────────────────── */}
        {isSuperAdmin && (
          <section aria-labelledby="section-system">
            <SectionTitle id="section-system">{t('dashboard.systemInfra')}</SectionTitle>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              <KPICard title={t('kpi.database')} value={t('kpi.operational')} icon={Database} color="success" />
              <KPICard title={t('kpi.activeServices')} value={t('kpi.online')} icon={Server} color="success" />
              <KPICard title={t('kpi.adminAccess')} value={t('kpi.fullAccess')} icon={Crown} color="accent" />
            </div>
          </section>
        )}

        {/* Accès rapides */}
        <section aria-labelledby="section-shortcuts">
          <SectionTitle id="section-shortcuts">{t('dashboard.quickAccess')}</SectionTitle>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <QuickActionCard
              to="/dashboard"
              icon={BarChart3}
              label={t('dashboard.workViews')}
              description={t('dashboard.workViewsDesc')}
            />
            {accessRights.canAccessProjects && (
              <QuickActionCard
                to="/projects"
                icon={FolderKanban}
                label={t('nav.projects')}
                description={t('dashboard.projectsDesc')}
              />
            )}
            {accessRights.canAccessTasks && (
              <QuickActionCard
                to="/tasks"
                icon={ListTodo}
                label={t('dashboard.myTasks')}
                description={t('dashboard.myTasksDesc')}
              />
            )}
            {(accessRights.canViewReports || isSuperAdmin) && (
              <QuickActionCard
                to="/analytics"
                icon={BarChart3}
                label={t('nav.analytics')}
                description={t('dashboard.analyticsDesc')}
              />
            )}
            {canSeeHR && (
              <QuickActionCard
                to="/hr"
                icon={Users}
                label={t('nav.hr')}
                description={t('dashboard.hrDesc')}
              />
            )}
            {isSuperAdmin && (
              <QuickActionCard
                to="/super-admin"
                icon={Crown}
                label={t('nav.superAdmin')}
                description={t('dashboard.superAdminDesc')}
              />
            )}
          </div>
        </section>

      </div>
    </main>
  );
}
