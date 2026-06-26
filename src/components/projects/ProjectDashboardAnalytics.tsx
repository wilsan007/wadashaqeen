/**
 * Project Dashboard Analytics - Version améliorée avec analytics
 * Pattern: Stripe/Linear - Analytics épurés et impactants
 */

import React, { useMemo } from 'react';
import { useProjectsEnterprise } from '@/hooks/useProjectsEnterprise';
import { MetricCard } from '@/components/ui/badges';
import { DistributionChart } from '@/components/analytics/DistributionChart';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { exportToCSV, formatDateForExport, formatCurrencyForExport } from '@/lib/exportUtils';
import { exportTableToPDF, exportDashboardToPDF, exportHybridPDF } from '@/lib/pdfExportUtils';
import {
  BarChart3,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Download,
  RefreshCw,
  FileText,
  Image,
  Target,
  DollarSign,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const ProjectDashboardAnalytics: React.FC = () => {
  const {
    projects,
    totalCount,
    activeProjects,
    completedProjects,
    overdueProjects,
    loading,
    refresh,
  } = useProjectsEnterprise({});

  const { toast } = useToast();
  const { t } = useTranslation();

  // Calculs des métriques avancées
  const analytics = useMemo(() => {
    if (projects.length === 0) {
      return {
        avgDuration: 0,
        statusDistribution: [],
        priorityDistribution: [],
        trends: {
          total: { value: 0, isPositive: true, label: '' },
          active: { value: 0, isPositive: true, label: '' },
          completed: { value: 0, isPositive: true, label: '' },
          overdue: { value: 0, isPositive: false, label: '' },
        },
      };
    }

    // Durée moyenne des projets (en jours)
    const completedWithDates = projects.filter(
      p => p.status === 'completed' && p.start_date && p.end_date
    );

    const avgDuration =
      completedWithDates.length > 0
        ? Math.round(
          completedWithDates.reduce((sum, p) => {
            const start = new Date(p.start_date!);
            const end = new Date(p.end_date!);
            const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            return sum + days;
          }, 0) / completedWithDates.length
        )
        : 0;

    // Distribution par statut
    const statusCounts = projects.reduce(
      (acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const statusDistribution = [
      { name: t('projectsBloc.analytics.statusActive'), value: statusCounts.active || 0, color: '#10b981' },
      { name: t('projectsBloc.analytics.statusCompleted'), value: statusCounts.completed || 0, color: '#3b82f6' },
      { name: t('projectsBloc.analytics.statusOnHold'), value: statusCounts.on_hold || 0, color: '#f59e0b' },
      { name: t('projectsBloc.analytics.statusCancelled'), value: statusCounts.cancelled || 0, color: '#ef4444' },
    ].filter(item => item.value > 0);

    // Distribution par priorité
    const priorityCounts = projects.reduce(
      (acc, p) => {
        acc[p.priority] = (acc[p.priority] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const priorityDistribution = [
      { name: t('projectsBloc.analytics.priorityHigh'), value: priorityCounts.high || 0, color: '#ef4444' },
      { name: t('projectsBloc.analytics.priorityMedium'), value: priorityCounts.medium || 0, color: '#f59e0b' },
      { name: t('projectsBloc.analytics.priorityLow'), value: priorityCounts.low || 0, color: '#10b981' },
    ].filter(item => item.value > 0);

    // Tendances réelles — comparaison mois courant vs mois précédent
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const lastMonthEnd = currentMonthStart;
    const today = now.toISOString().split('T')[0];
    const currentMonthDay = currentMonthStart.split('T')[0];
    const lastMonthDay = lastMonthStart.split('T')[0];
    const lastMonthEndDay = lastMonthEnd.split('T')[0];

    const thisMonthNew = projects.filter(p => p.created_at && p.created_at >= currentMonthStart).length;
    const lastMonthNew = projects.filter(p => p.created_at && p.created_at >= lastMonthStart && p.created_at < lastMonthEnd).length;

    const thisMonthCompleted = projects.filter(p => (p.status === 'completed' || p.status === 'done') && p.updated_at && p.updated_at >= currentMonthStart).length;
    const lastMonthCompleted = projects.filter(p => (p.status === 'completed' || p.status === 'done') && p.updated_at && p.updated_at >= lastMonthStart && p.updated_at < lastMonthEnd).length;

    const thisMonthOverdue = projects.filter(p => p.end_date && p.end_date >= currentMonthDay && p.end_date < today && p.status !== 'completed' && p.status !== 'done').length;
    const lastMonthOverdue = projects.filter(p => p.end_date && p.end_date >= lastMonthDay && p.end_date < lastMonthEndDay && p.status !== 'completed' && p.status !== 'done').length;

    const calcPct = (current: number, previous: number) =>
      previous > 0 ? Math.round(((current - previous) / previous) * 100) : current > 0 ? 100 : 0;

    const trends = {
      total: { value: Math.abs(calcPct(thisMonthNew, lastMonthNew)), isPositive: thisMonthNew >= lastMonthNew, label: 'nouveaux ce mois' },
      active: { value: Math.abs(calcPct(thisMonthNew, lastMonthNew)), isPositive: thisMonthNew >= lastMonthNew, label: 'vs mois dernier' },
      completed: { value: Math.abs(calcPct(thisMonthCompleted, lastMonthCompleted)), isPositive: thisMonthCompleted >= lastMonthCompleted, label: 'vs mois dernier' },
      overdue: { value: Math.abs(calcPct(thisMonthOverdue, lastMonthOverdue)), isPositive: thisMonthOverdue <= lastMonthOverdue, label: 'vs mois dernier' },
    };

    // On-Time Delivery Rate
    const completedWithDates2 = projects.filter(p => (p.status === 'completed' || p.status === 'done') && p.completion_date && p.end_date);
    const onTimeCount = completedWithDates2.filter(p => p.completion_date! <= p.end_date!).length;
    const onTimeRate = completedWithDates2.length > 0 ? Math.round((onTimeCount / completedWithDates2.length) * 100) : null;

    // Budget total
    const totalBudget = projects.reduce((sum, p) => sum + (p.budget ?? 0), 0);
    const projectsWithBudget = projects.filter(p => p.budget && p.budget > 0).length;

    // RAG Status du portefeuille
    type RAGStatus = 'red' | 'amber' | 'green';
    const computeRAG = (p: typeof projects[0]): RAGStatus => {
      if (p.end_date && p.end_date < today && p.status !== 'completed' && p.status !== 'done') return 'red';
      if (p.start_date && p.end_date) {
        const start = new Date(p.start_date).getTime();
        const end = new Date(p.end_date).getTime();
        const elapsed = end > start ? (Date.now() - start) / (end - start) : 0;
        if (elapsed > 0.5 && (p.progress ?? 0) < 30 && p.status !== 'completed' && p.status !== 'done') return 'amber';
      }
      return 'green';
    };
    const ragRed = projects.filter(p => computeRAG(p) === 'red').length;
    const ragAmber = projects.filter(p => computeRAG(p) === 'amber').length;
    const ragGreen = projects.filter(p => computeRAG(p) === 'green').length;

    return {
      avgDuration,
      statusDistribution,
      priorityDistribution,
      trends,
      onTimeRate,
      totalBudget,
      projectsWithBudget,
      ragRed,
      ragAmber,
      ragGreen,
    };
  }, [projects]);

  // Export CSV
  const handleExportCSV = () => {
    const exportData = projects.map(p => ({
      Nom: p.name,
      Description: p.description || '',
      Statut: p.status,
      Priorité: p.priority,
      'Date début': formatDateForExport(p.start_date),
      'Date fin': formatDateForExport(p.end_date),
      Progression: p.progress || 0,
      Budget: formatCurrencyForExport(p.budget, 'DJF'),
      'Créé par': p.profiles?.full_name || '',
    }));

    exportToCSV(exportData, `projets-${new Date().toISOString().split('T')[0]}.csv`);

    toast({
      title: t('projectsBloc.analytics.exportSuccess'),
      description: t('projectsBloc.analytics.exportCsvDesc').replace('%s', exportData.length.toString()),
    });
  };

  // Export PDF Tabulaire
  const handleExportPDFTable = async () => {
    try {
      const tableData = projects.map(p => ({
        nom: p.name,
        statut: p.status,
        priorite: p.priority,
        debut: formatDateForExport(p.start_date),
        fin: formatDateForExport(p.end_date),
        progression: `${p.progress || 0}%`,
        budget: formatCurrencyForExport(p.budget, 'DJF'),
      }));

      await exportTableToPDF(
        tableData,
        [
          { header: 'Nom', dataKey: 'nom', width: 50 },
          { header: 'Statut', dataKey: 'statut', width: 25 },
          { header: 'Priorité', dataKey: 'priorite', width: 25 },
          { header: 'Début', dataKey: 'debut', width: 25 },
          { header: 'Fin', dataKey: 'fin', width: 25 },
          { header: 'Prog.', dataKey: 'progression', width: 20 },
          { header: 'Budget', dataKey: 'budget', width: 30 },
        ],
        {
          title: 'Rapport Projets',
          subtitle: `${totalCount} projets`,
          filename: `projets-${new Date().toISOString().split('T')[0]}.pdf`,
          orientation: 'landscape',
          footer: 'Généré par Wadashaqayn SaaS',
        }
      );

      toast({
        title: t('projectsBloc.analytics.exportSuccess'),
        description: t('projectsBloc.analytics.exportPdfTableDesc'),
      });
    } catch (error) {
      toast({
        title: t('projectsBloc.analytics.exportError'),
        description: t('projectsBloc.analytics.exportErrorDesc'),
        variant: 'destructive',
      });
    }
  };

  // Export PDF Visuel (Dashboard)
  const handleExportPDFDashboard = async () => {
    try {
      await exportDashboardToPDF('projects-dashboard', {
        title: 'Dashboard Projets',
        filename: `dashboard-projets-${new Date().toISOString().split('T')[0]}.pdf`,
        orientation: 'landscape',
      });

      toast({
        title: t('projectsBloc.analytics.exportSuccess'),
        description: t('projectsBloc.analytics.exportPdfVisualDesc'),
      });
    } catch (error) {
      toast({
        title: t('projectsBloc.analytics.exportError'),
        description: t('projectsBloc.analytics.exportErrorDesc'),
        variant: 'destructive',
      });
    }
  };

  // Export PDF Complet (Métriques + Tableau)
  const handleExportPDFComplete = async () => {
    try {
      const metrics = [
        { label: 'Total Projets', value: totalCount },
        { label: 'Projets Actifs', value: activeProjects },
        { label: 'Projets Terminés', value: completedProjects },
        { label: 'Projets en Retard', value: overdueProjects },
        { label: 'Durée Moyenne', value: `${analytics.avgDuration}j` },
      ];

      const tableData = projects.map(p => ({
        nom: p.name,
        statut: p.status,
        priorite: p.priority,
        debut: formatDateForExport(p.start_date),
        fin: formatDateForExport(p.end_date),
        progression: `${p.progress || 0}%`,
      }));

      await exportHybridPDF(
        metrics,
        tableData,
        [
          { header: 'Nom', dataKey: 'nom' },
          { header: 'Statut', dataKey: 'statut' },
          { header: 'Priorité', dataKey: 'priorite' },
          { header: 'Début', dataKey: 'debut' },
          { header: 'Fin', dataKey: 'fin' },
          { header: 'Progression', dataKey: 'progression' },
        ],
        {
          title: 'Rapport Complet - Projets',
          subtitle: `Analyse détaillée • ${totalCount} projets`,
          filename: `rapport-complet-projets-${new Date().toISOString().split('T')[0]}.pdf`,
          footer: 'Généré par Wadashaqayn SaaS',
        }
      );

      toast({
        title: t('projectsBloc.analytics.exportSuccess'),
        description: t('projectsBloc.analytics.exportPdfCompleteDesc'),
      });
    } catch (error) {
      toast({
        title: t('projectsBloc.analytics.exportError'),
        description: t('projectsBloc.analytics.exportErrorDesc'),
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header avec actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('projectsBloc.analytics.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('projectsBloc.analytics.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={projects.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                {t('projectsBloc.analytics.exportBtn')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCSV}>
                <FileText className="mr-2 h-4 w-4" />
                {t('projectsBloc.analytics.csvTable')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDFTable}>
                <FileText className="mr-2 h-4 w-4" />
                {t('projectsBloc.analytics.pdfTable')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDFDashboard}>
                <Image className="mr-2 h-4 w-4" />
                {t('projectsBloc.analytics.pdfVisual')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDFComplete}>
                <FileText className="mr-2 h-4 w-4" />
                {t('projectsBloc.analytics.pdfComplete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {t('projectsBloc.analytics.refreshBtn')}
          </Button>
        </div>
      </div>

      {/* Section à capturer pour PDF visuel */}
      <div id="projects-dashboard" className="space-y-6">
        {/* KPIs avec tendances */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label={t('projectsBloc.analytics.totalProjects')}
            value={totalCount}
            subtitle={analytics.trends.total.value > 0 ? `${analytics.trends.total.isPositive ? '+' : '-'}${analytics.trends.total.value}% ${analytics.trends.total.label}` : analytics.trends.total.label}
            icon={<BarChart3 className="h-6 w-6" />}
            color="blue"
            trend={analytics.trends.total.isPositive ? 'up' : 'down'}
          />
          <MetricCard
            label={t('projectsBloc.analytics.activeProjects')}
            value={activeProjects}
            subtitle={analytics.trends.active.value > 0 ? `${analytics.trends.active.isPositive ? '+' : '-'}${analytics.trends.active.value}% ${analytics.trends.active.label}` : analytics.trends.active.label}
            icon={<TrendingUp className="h-6 w-6" />}
            color="green"
            trend={analytics.trends.active.isPositive ? 'up' : 'down'}
          />
          <MetricCard
            label={t('projectsBloc.analytics.completedProjects')}
            value={completedProjects}
            subtitle={analytics.trends.completed.value > 0 ? `${analytics.trends.completed.isPositive ? '+' : '-'}${analytics.trends.completed.value}% ${analytics.trends.completed.label}` : analytics.trends.completed.label}
            icon={<CheckCircle2 className="h-6 w-6" />}
            color="green"
            trend={analytics.trends.completed.isPositive ? 'up' : 'down'}
          />
          <MetricCard
            label={t('projectsBloc.analytics.overdueProjects')}
            value={overdueProjects}
            subtitle={analytics.trends.overdue.value > 0 ? `${analytics.trends.overdue.isPositive ? '↓' : '↑'}${analytics.trends.overdue.value}% ${analytics.trends.overdue.label}` : t('projectsBloc.analytics.needsAction')}
            icon={<AlertTriangle className="h-6 w-6" />}
            color="red"
            trend={analytics.trends.overdue.isPositive ? 'down' : 'up'}
          />
        </div>

        {/* Métriques avancées : Durée, On-Time, Budget */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <MetricCard
            label={t('projectsBloc.analytics.avgDuration')}
            value={`${analytics.avgDuration}j`}
            subtitle={t('projectsBloc.analytics.avgDurationSub')}
            icon={<Clock className="h-6 w-6" />}
            color="purple"
          />
          <MetricCard
            label="Taux de livraison à temps"
            value={analytics.onTimeRate !== null ? `${analytics.onTimeRate}%` : '—'}
            subtitle={analytics.onTimeRate !== null ? (analytics.onTimeRate >= 80 ? 'Objectif atteint' : 'À améliorer') : 'Aucun projet terminé'}
            icon={<Target className="h-6 w-6" />}
            color={analytics.onTimeRate !== null && analytics.onTimeRate >= 80 ? 'green' : analytics.onTimeRate !== null ? 'orange' : 'gray'}
            trend={analytics.onTimeRate !== null && analytics.onTimeRate >= 80 ? 'up' : 'neutral'}
            progress={analytics.onTimeRate !== null ? analytics.onTimeRate : undefined}
          />
          <MetricCard
            label="Budget total portefeuille"
            value={analytics.totalBudget > 0 ? `${analytics.totalBudget.toLocaleString('fr-DJ')} DJF` : '—'}
            subtitle={analytics.projectsWithBudget > 0 ? `${analytics.projectsWithBudget} projet(s) budgétisé(s)` : 'Aucun budget renseigné'}
            icon={<DollarSign className="h-6 w-6" />}
            color="blue"
          />
        </div>

        {/* RAG Status — Santé du portefeuille */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Santé du portefeuille (RAG)</h3>
          <div className="grid grid-cols-3 gap-4">
            {/* Red — En danger */}
            <div className="relative overflow-hidden rounded-xl border-l-4 border-l-rose-500 border border-rose-200 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/30">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-red-600 shadow-sm">
                  <ShieldOff className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-black tabular-nums text-rose-700 dark:text-rose-400">
                    {analytics.ragRed}
                  </p>
                  <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">En danger</p>
                  <p className="text-xs text-muted-foreground">Retard avéré</p>
                </div>
              </div>
            </div>

            {/* Amber — À risque */}
            <div className="relative overflow-hidden rounded-xl border-l-4 border-l-amber-500 border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-sm">
                  <ShieldAlert className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-black tabular-nums text-amber-700 dark:text-amber-400">
                    {analytics.ragAmber}
                  </p>
                  <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">À risque</p>
                  <p className="text-xs text-muted-foreground">Progression lente</p>
                </div>
              </div>
            </div>

            {/* Green — En bonne santé */}
            <div className="relative overflow-hidden rounded-xl border-l-4 border-l-emerald-500 border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm">
                  <ShieldCheck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-black tabular-nums text-emerald-700 dark:text-emerald-400">
                    {analytics.ragGreen}
                  </p>
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">En bonne santé</p>
                  <p className="text-xs text-muted-foreground">Sur les rails</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Graphiques de distribution */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <DistributionChart title={t('projectsBloc.analytics.distByStatus')} data={analytics.statusDistribution} />
          <DistributionChart
            title={t('projectsBloc.analytics.distByPriority')}
            data={analytics.priorityDistribution}
          />
        </div>
      </div>
      {/* Fin section à capturer */}
    </div>
  );
};
