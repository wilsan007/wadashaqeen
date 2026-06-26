/**
 * HR Dashboard Minimal - Solution Anti-Boucle Définitive
 * Inspiré de GitHub, Stripe, Linear Dashboard
 *
 * Principe: Composant statique, pas de re-renders inutiles
 */

import React from 'react';
import { useHRMinimal } from '@/hooks/useHRMinimal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/ui/badges';
import { AccessDenied } from '@/components/ui/access-denied';
import {
  Users,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Shield,
  TrendingDown,
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useAbsenteeismRate } from '@/hooks/useAbsenteeismRate';
import { KPICard } from '@/components/analytics/KPICard';

export const HRDashboardMinimal = () => {
  const { t } = useTranslation();
  const { data: absenteeism, isLoading: absenteeismLoading } = useAbsenteeismRate();

  const {
    leaveRequests,
    attendances,
    employees,
    absenceTypes,
    loading,
    error,
    canAccess,
    isSuperAdmin,
    accessInfo,
    refresh,
  } = useHRMinimal({
    enabled: {
      employees: true,
      leaveRequests: true,
      attendances: true,
      departments: true,
      absenceTypes: true,
      leaveBalances: false, // Pas affiché dans le dashboard
    },
    limits: {
      employees: 10, // Seulement 10 pour le dashboard
      leaveRequests: 5, // Seulement les 5 dernières demandes
      attendances: 5, // Seulement les 5 dernières présences
    },
  });

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <RefreshCw className="text-primary mx-auto mb-4 h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Chargement des données RH...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="max-w-md text-center">
          <XCircle className="text-destructive mx-auto mb-4 h-12 w-12" />
          <h3 className="mb-2 text-lg font-semibold">Erreur de chargement</h3>
          <p className="text-muted-foreground mb-4 text-sm">{error}</p>
          <Button onClick={refresh} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  // Access denied - Utiliser le composant AccessDenied avec les infos du rôle
  if (!canAccess && accessInfo?.reason) {
    return (
      <AccessDenied
        reason={accessInfo.reason as any}
        module="Ressources Humaines"
        currentRole={accessInfo.currentRole}
        requiredRole={accessInfo.requiredRole}
      />
    );
  }

  // Calculs des statistiques (simples)
  const stats = {
    totalEmployees: employees?.length || 0,
    pendingRequests: leaveRequests?.filter(req => req.status === 'pending')?.length || 0,
    approvedRequests: leaveRequests?.filter(req => req.status === 'approved')?.length || 0,
    todayAttendances:
      attendances?.filter(att => att.date === new Date().toISOString().split('T')[0])?.length || 0,
  };

  const recentRequests = leaveRequests?.slice(0, 5) || [];

  return (
    <div className="animate-fade-in mx-auto max-w-7xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="from-primary to-accent bg-gradient-to-r bg-clip-text text-3xl font-bold text-transparent">
            {t('hrDashboard.title')}
          </h1>
          <div className="text-muted-foreground mt-1 flex items-center gap-2">
            <span>{t('hrDashboard.subtitle')}</span>
            {isSuperAdmin && (
              <Badge variant="secondary">
                <Shield className="mr-1 h-3 w-3" />
                {t('hrDashboard.superAdmin')}
              </Badge>
            )}
          </div>
        </div>

        <Button onClick={refresh} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          {t('hrDashboard.refresh')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard
          label={t('hrDashboard.totalEmployees')}
          value={stats.totalEmployees}
          subtitle={t('hrDashboard.currentStaff')}
          icon={<Users className="h-6 w-6" />}
          color="blue"
        />

        <MetricCard
          label={t('hrDashboard.pending')}
          value={stats.pendingRequests}
          subtitle={t('hrDashboard.toProcess')}
          icon={<AlertCircle className="h-6 w-6" />}
          color="orange"
        />

        <MetricCard
          label={t('hrDashboard.approved')}
          value={stats.approvedRequests}
          subtitle={t('hrDashboard.validatedRequests')}
          icon={<CheckCircle className="h-6 w-6" />}
          color="green"
        />

        <MetricCard
          label={t('hrDashboard.attendances')}
          value={stats.todayAttendances}
          subtitle={t('hrDashboard.today')}
          icon={<Clock className="h-6 w-6" />}
          color="blue"
        />
      </div>

      {/* Absenteeism KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KPICard
          title="Taux d'absentéisme (mois)"
          value={absenteeismLoading ? '...' : (absenteeism?.rate ?? 0)}
          icon={TrendingDown}
          color={
            (absenteeism?.rate ?? 0) > 10
              ? 'destructive'
              : (absenteeism?.rate ?? 0) > 5
                ? 'warning'
                : 'success'
          }
          format="percentage"
          progress={absenteeismLoading ? undefined : Math.min(absenteeism?.rate ?? 0, 20) * 5}
          subtitle={
            absenteeism
              ? `${absenteeism.totalAbsenceDays}j absence · ${absenteeism.workingDaysInMonth}j ouvrés`
              : undefined
          }
          trend={
            absenteeism
              ? {
                value: 0,
                isPositive: absenteeism.rate <= 5,
                label:
                  absenteeism.rate <= 5
                    ? 'Excellent — objectif < 5%'
                    : absenteeism.rate <= 10
                      ? 'Acceptable — objectif < 5%'
                      : 'Élevé — action requise',
              }
              : undefined
          }
        />
      </div>

      {/* Recent Leave Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t('hrDashboard.recentLeaveRequests')}
            <Badge variant="secondary" className="ml-auto">
              {recentRequests.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentRequests.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">
              <Calendar className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>{t('hrDashboard.noRecentLeaveRequests')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentRequests.map(request => {
                const employee = employees?.find(emp => emp.user_id === request.employee_id);
                return (
                  <div
                    key={request.id}
                    className="bg-muted/30 hover:bg-muted/50 flex items-center justify-between rounded-lg p-3 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">
                        {employee?.full_name || request.profiles?.full_name || t('hrDashboard.unknownEmployee')}
                        {isSuperAdmin && request.profiles?.tenant_id && (
                          <span className="ml-2 text-xs font-normal text-[hsl(var(--tech-blue))]">
                            ({request.profiles.tenant_id})
                          </span>
                        )}
                      </div>
                      <div className="text-muted-foreground text-sm">
                        {new Date(request.start_date).toLocaleDateString()} -{' '}
                        {new Date(request.end_date).toLocaleDateString()}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {request.total_days} {t('hrDashboard.days')}
                        {request.reason && ` • ${request.reason}`}
                      </div>
                    </div>
                    <Badge
                      className={
                        `ml-3 flex-shrink-0 border-0 font-medium ` +
                        (request.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                          : request.status === 'rejected'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400')
                      }
                    >
                      {request.status === 'approved'
                        ? t('hrDashboard.statusApproved')
                        : request.status === 'rejected'
                          ? t('hrDashboard.statusRejected')
                          : t('hrDashboard.statusPending')}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employees List - Enhanced for Super Admin */}
      {isSuperAdmin && employees.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('hrDashboard.allSystemEmployees')}
              <Badge variant="outline" className="ml-auto">
                {employees.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {employees.slice(0, 12).map(employee => (
                <div
                  key={employee.id}
                  className="bg-card rounded-lg border p-3 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                      <Users className="text-primary h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{employee.full_name}</div>
                      <div className="text-muted-foreground text-sm">
                        {employee.job_title || t('hrDashboard.undefinedJob')}
                      </div>
                      <div className="text-xs text-[hsl(var(--tech-blue))]">ID: {employee.employee_id}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {employees.length > 12 && (
              <div className="text-muted-foreground mt-4 text-center text-sm">
                {t('hrDashboard.otherEmployees').replace('%s', String(employees.length - 12))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Debug Info for Super Admin */}
      {isSuperAdmin && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-muted-foreground text-sm">
              {t('hrDashboard.debugInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-1 text-xs">
            <div>Super Admin: ✅</div>
            <div>Can Access: {canAccess ? '✅' : '❌'}</div>
            <div>Data Loaded: {new Date().toLocaleTimeString()}</div>
            <div>
              Total Items: {stats.totalEmployees + recentRequests.length + stats.todayAttendances}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
