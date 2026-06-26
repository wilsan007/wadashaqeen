/**
 * Project Dashboard Enterprise - Pattern SaaS Leaders
 * Inspiré de Monday.com, Asana, Linear
 *
 * Fonctionnalités:
 * - Vue d'ensemble des projets avec métriques
 * - Filtres avancés et recherche
 * - Pagination intelligente
 * - Actions en masse
 * - Export et rapports
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useProjectsEnterprise, ProjectFilters } from '@/hooks/useProjectsEnterprise';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PriorityBadge, StatusBadge, MetricCard, ProgressBar } from '@/components/ui/badges';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { AccessDenied } from '@/components/ui/access-denied';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  RefreshCw,
  Plus,
  Filter,
  Download,
  MoreHorizontal,
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ProjectCreationDialog } from '@/components/projects/ProjectCreationDialog';
import { ProjectDetailsDialog } from '@/components/projects/ProjectDetailsDialog';
import { ProjectTableInline } from '@/components/projects/ProjectTableInline';
import { LayoutGrid, LayoutList } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatCurrency } from '@/components/common/CurrencySelect';
import { useTranslation } from '@/hooks/useTranslation';

interface ProjectDashboardEnterpriseProps {
  showMetrics?: boolean;
  compactMode?: boolean;
}

export const ProjectDashboardEnterprise: React.FC<ProjectDashboardEnterpriseProps> = ({
  showMetrics = true,
  compactMode = false,
}) => {
  const isMobile = useIsMobile();
  // États locaux pour les filtres
  const [filters, setFilters] = useState<ProjectFilters>({});

  // États pour les dialogs
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table'); // ✅ Table par défaut pour édition inline

  // Hook enterprise optimisé
  const {
    projects,
    totalCount,
    activeProjects,
    completedProjects,
    overdueProjects,
    loading,
    error,
    metrics,
    pagination,
    canAccess,
    isSuperAdmin,
    accessInfo,
    refresh,
    createProject,
    loadMore,
    goToPage,
    setFilters: updateFilters,
    isDataStale,
    cacheKey,
    updateProject,
  } = useProjectsEnterprise(filters);

  const { toast } = useToast();
  const { t } = useTranslation();

  // Handler pour mise à jour inline
  const handleUpdateProject = useCallback(
    async (projectId: string, updates: any) => {
      try {
        await updateProject(projectId, updates);
        toast({
          title: t('projectsBloc.enterprise.updateSuccess'),
          description: t('projectsBloc.enterprise.updateSuccessDesc'),
        });
      } catch (error) {
        console.error('Erreur mise à jour projet:', error);
        toast({
          title: t('projectsBloc.enterprise.updateError'),
          description: t('projectsBloc.enterprise.updateErrorDesc'),
          variant: 'destructive',
        });
      }
    },
    [updateProject, toast]
  );

  // Filtres memoizés pour performance
  const appliedFilters = useMemo(
    () => ({
      ...filters,
      search: searchTerm || undefined,
      status: statusFilter.length > 0 ? statusFilter : undefined,
      priority: priorityFilter.length > 0 ? priorityFilter : undefined,
    }),
    [filters, searchTerm, statusFilter, priorityFilter]
  );

  // Appliquer les filtres avec debounce
  const handleFiltersChange = useCallback(() => {
    updateFilters(appliedFilters);
  }, [appliedFilters, updateFilters]);

  // Gestionnaires d'événements optimisés
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchTerm(value);
      // Debounce de 300ms
      const timeoutId = setTimeout(() => {
        handleFiltersChange();
      }, 300);
      return () => clearTimeout(timeoutId);
    },
    [handleFiltersChange]
  );

  const handleStatusFilterChange = useCallback(
    (status: string) => {
      setStatusFilter(prev =>
        prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
      );
      handleFiltersChange();
    },
    [handleFiltersChange]
  );

  const handlePriorityFilterChange = useCallback(
    (priority: string) => {
      setPriorityFilter(prev =>
        prev.includes(priority) ? prev.filter(p => p !== priority) : [...prev, priority]
      );
      handleFiltersChange();
    },
    [handleFiltersChange]
  );

  // Fonctions utilitaires
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'on_hold':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Vérification des permissions - Utiliser AccessDenied avec les infos du rôle
  if (!canAccess && accessInfo?.reason) {
    return (
      <AccessDenied
        reason={accessInfo.reason as any}
        module="Gestion de Projets"
        currentRole={accessInfo.currentRole}
        requiredRole={accessInfo.requiredRole}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Métriques de Performance (Pattern Stripe) */}
      {showMetrics && !compactMode && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <MetricCard
            label={t('projectsBloc.analytics.totalProjects')}
            value={totalCount}
            subtitle={t('projectsBloc.analytics.allProjects')}
            icon={<BarChart3 className="h-6 w-6" />}
            color="blue"
          />

          <MetricCard
            label={t('projectsBloc.analytics.activeProjects')}
            value={activeProjects}
            subtitle={t('projectsBloc.analytics.inProgress')}
            icon={<TrendingUp className="h-6 w-6" />}
            color="green"
            trend="up"
          />

          <MetricCard
            label={t('projectsBloc.analytics.completedProjects')}
            value={completedProjects}
            subtitle={t('projectsBloc.analytics.completedSub')}
            icon={<CheckCircle2 className="h-6 w-6" />}
            color="green"
          />

          <MetricCard
            label={t('projectsBloc.analytics.overdueProjects')}
            value={overdueProjects}
            subtitle={t('projectsBloc.analytics.needsAction')}
            icon={<AlertTriangle className="h-6 w-6" />}
            color="red"
            trend="down"
          />
        </div>
      )}

      {/* Filtres et Actions (Pattern Linear) - Ultra Responsive */}
      <Card>
        {/* Header visible sur mobile aussi */}
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Titre et badge */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <CardTitle className="flex flex-wrap items-center gap-2 text-lg sm:text-xl">
                  <span className="truncate">{t('projectsBloc.enterprise.title')}</span>
                  {isSuperAdmin && (
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      {t('projectsBloc.enterprise.superAdmin')}
                    </Badge>
                  )}
                </CardTitle>
                {!compactMode && (
                  <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
                    <span className="font-medium">{totalCount} {t('projectsBloc.enterprise.projectsCount')}</span>
                    {/* Métriques techniques masquées sur mobile */}
                    <span className="hidden md:inline">
                      {' '}
                      • {t('projectsBloc.enterprise.cacheLabel')} {metrics.cacheHit ? '✅' : '❌'} • {t('projectsBloc.enterprise.dataLabel')}{' '}
                      {(metrics.dataSize / 1024).toFixed(1)}KB • {t('projectsBloc.enterprise.fetchLabel')}{' '}
                      {metrics.fetchTime.toFixed(0)}ms
                    </span>
                    {isDataStale && <span className="text-orange-600"> • {t('projectsBloc.enterprise.staleData')}</span>}
                  </p>
                )}
              </div>

              {/* Bouton refresh toujours visible */}
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                disabled={loading}
                className="shrink-0"
              >
                <RefreshCw className={`h-4 w-4 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{t('projectsBloc.analytics.refreshBtn')}</span>
              </Button>
            </div>

            {/* Actions principales - Stack sur mobile, inline sur desktop */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                variant="default"
                size="sm"
                className="w-full justify-center sm:w-auto"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('projectsBloc.enterprise.newProject')}
              </Button>

              {/* Toggle vue grille/tableau */}
              <div className="flex gap-1 self-start rounded-md border p-1 sm:self-auto">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setViewMode('table')}
                >
                  <LayoutList className="h-4 w-4" />
                </Button>
              </div>

              <Button variant="outline" size="sm" className="w-full justify-center sm:w-auto">
                <Download className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">{t('projectsBloc.analytics.exportBtn')}</span>
                <span className="sm:hidden">Export</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className={isMobile ? 'p-4' : 'p-6'}>
          {/* Barre de recherche et filtres - Visible sur mobile aussi */}
          <div className="mb-6 space-y-3 sm:space-y-0">
            {/* Recherche - Pleine largeur sur mobile */}
            <div className="w-full">
              <div className="relative">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
                <Input
                  placeholder={t('projectsBloc.enterprise.searchPlaceholder')}
                  value={searchTerm}
                  onChange={e => handleSearchChange(e.target.value)}
                  className="h-10 pl-10 text-base sm:h-9 sm:text-sm"
                />
              </div>
            </div>

            {/* Filtres - Stack mobile, inline desktop */}
            <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2 sm:pt-4">
              <Select onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="h-10 sm:h-9 sm:w-40">
                  <Filter className="mr-2 h-3.5 w-3.5 shrink-0 sm:hidden" />
                  <SelectValue placeholder={t('projectsBloc.enterprise.filterStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t('projectsBloc.analytics.statusActive')}</SelectItem>
                  <SelectItem value="completed">{t('projectsBloc.analytics.statusCompleted')}</SelectItem>
                  <SelectItem value="on_hold">{t('projectsBloc.analytics.statusOnHold')}</SelectItem>
                  <SelectItem value="cancelled">{t('projectsBloc.analytics.statusCancelled')}</SelectItem>
                </SelectContent>
              </Select>

              <Select onValueChange={handlePriorityFilterChange}>
                <SelectTrigger className="h-10 sm:h-9 sm:w-40">
                  <SelectValue placeholder={t('projectsBloc.enterprise.filterPriority')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">{t('projectsBloc.analytics.priorityHigh')}</SelectItem>
                  <SelectItem value="medium">{t('projectsBloc.analytics.priorityMedium')}</SelectItem>
                  <SelectItem value="low">{t('projectsBloc.analytics.priorityLow')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Grille des projets */}
          {loading && projects.length === 0 ? (
            <div className="py-8 text-center">
              <RefreshCw className="text-muted-foreground mx-auto mb-4 h-8 w-8 animate-spin" />
              <p className="text-muted-foreground">{t('projectsBloc.enterprise.loading')}</p>
            </div>
          ) : error ? (
            <div className="py-8 text-center">
              <AlertTriangle className="mx-auto mb-4 h-8 w-8 text-red-500" />
              <p className="mb-4 text-red-600">{t('projectsBloc.enterprise.loadError')}</p>
              <Button onClick={refresh} variant="outline">
                {t('projectsBloc.enterprise.retryBtn')}
              </Button>
            </div>
          ) : projects.length === 0 ? (
            <div className="py-8 text-center">
              <BarChart3 className="text-muted-foreground mx-auto mb-4 h-8 w-8" />
              <p className="text-muted-foreground">{t('projectsBloc.enterprise.noProjects')}</p>
              <Button
                className="mt-4"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('projectsBloc.enterprise.createFirstProject')}
              </Button>
            </div>
          ) : viewMode === 'table' ? (
            <ProjectTableInline
              projects={projects as any}
              onUpdateProject={handleUpdateProject}
              onProjectClick={project => {
                setSelectedProject(project);
                setIsDetailsDialogOpen(true);
              }}
              selectedProjectId={selectedProject?.id}
              compactMode={compactMode}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
                {projects.map(project => {
                  const isOverdue =
                    project.end_date &&
                    new Date(project.end_date) < new Date() &&
                    project.status !== 'completed';

                  return (
                    <Card
                      key={project.id}
                      onClick={() => {
                        setSelectedProject(project);
                        setIsDetailsDialogOpen(true);
                      }}
                      className={`group cursor-pointer overflow-hidden transition-all duration-200 hover:shadow-lg active:scale-[0.98] ${isOverdue
                          ? 'border-red-300 bg-red-50/30 dark:border-red-800 dark:bg-red-950/20'
                          : ''
                        }`}
                    >
                      <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="mb-1.5 text-base leading-tight font-semibold sm:mb-2 sm:text-lg">
                              {project.name}
                            </h3>
                            {project.description && (
                              <p className="text-muted-foreground line-clamp-2 text-xs sm:text-sm">
                                {project.description}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 shrink-0 p-0 opacity-0 transition-opacity group-hover:opacity-100 sm:opacity-100"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3 p-4 sm:space-y-4 sm:p-6">
                        {/* Statut et Priorité - Badges optimisés mobile */}
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={getStatusColor(project.status)} className="text-xs">
                            {project.status}
                          </Badge>
                          <Badge variant={getPriorityColor(project.priority)} className="text-xs">
                            {project.priority}
                          </Badge>
                        </div>

                        {/* Progression - Barre plus visible mobile */}
                        {project.progress !== undefined && (
                          <div className="space-y-1.5 sm:space-y-2">
                            <div className="flex items-center justify-between text-xs sm:text-sm">
                              <span className="text-muted-foreground">{t('projectsBloc.table.colProgress')}</span>
                              <span className="font-semibold">{project.progress}%</span>
                            </div>
                            <Progress value={project.progress} className="h-2.5 sm:h-2" />
                          </div>
                        )}

                        {/* Métadonnées - Grid adaptatif */}
                        <div className="grid grid-cols-2 gap-3 text-xs sm:gap-4 sm:text-sm">
                          {/* Dates - Labels condensés mobile */}
                          <div className="space-y-0.5 sm:space-y-1">
                            <div className="text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3 shrink-0" />
                              <span className="truncate">{t('projectsBloc.enterprise.startDate')}</span>
                            </div>
                            <div className="truncate font-medium">
                              {formatDate(project.start_date)}
                            </div>
                          </div>

                          <div className="space-y-0.5 sm:space-y-1">
                            <div className="text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3 shrink-0" />
                              <span className="truncate">{t('projectsBloc.enterprise.endDate')}</span>
                            </div>
                            <div
                              className={`truncate font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : ''}`}
                            >
                              {formatDate(project.end_date)}
                            </div>
                          </div>

                          {/* Budget */}
                          {project.budget && (
                            <div className="space-y-0.5 sm:space-y-1">
                              <div className="text-muted-foreground flex items-center gap-1">
                                <DollarSign className="h-3 w-3 shrink-0" />
                                <span className="truncate">{t('projectsBloc.enterprise.budget')}</span>
                              </div>
                              <div className="truncate font-medium">
                                {formatCurrency(project.budget, 'DJF')}
                              </div>
                            </div>
                          )}

                          {/* Équipe */}
                          {project.team_size && (
                            <div className="space-y-0.5 sm:space-y-1">
                              <div className="text-muted-foreground flex items-center gap-1">
                                <Users className="h-3 w-3 shrink-0" />
                                <span className="truncate">{t('projectsBloc.enterprise.team')}</span>
                              </div>
                              <div className="truncate font-medium">
                                {project.team_size} {t('projectsBloc.enterprise.membersCount')}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Créateur - Avatar plus petit mobile */}
                        {project.profiles && (
                          <div className="flex items-center gap-2 border-t pt-2.5">
                            <Avatar className="h-5 w-5 sm:h-6 sm:w-6">
                              <AvatarImage src={(project.profiles as any).avatar_url} />
                              <AvatarFallback className="text-[10px] sm:text-xs">
                                {project.profiles.full_name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-muted-foreground truncate text-xs sm:text-sm">
                              {t('projectsBloc.enterprise.createdBy').replace('%s', project.profiles.full_name)}
                            </span>
                          </div>
                        )}

                        {/* Tenant (Super Admin) */}
                        {isSuperAdmin && project.tenants && (
                          <div className="bg-muted/50 text-muted-foreground rounded p-2 text-xs">
                            🏢 {project.tenants.name}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Pagination (Pattern Stripe) - Ultra Responsive Mobile */}
              {pagination.totalPages > 1 && (
                <div className="mt-6 space-y-3 sm:mt-8 sm:space-y-0">
                  {/* Info pagination - Centré mobile */}
                  <div className="text-muted-foreground text-center text-xs sm:text-left sm:text-sm">
                    {t('projectsBloc.enterprise.pageFormat').replace('%s', pagination.page.toString()).replace('%s', pagination.totalPages.toString())}
                    <span className="hidden sm:inline"> {t('projectsBloc.enterprise.totalFormat').replace('%s', totalCount.toString())}</span>
                  </div>

                  {/* Contrôles pagination - Full width mobile */}
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(pagination.page - 1)}
                      disabled={pagination.page === 1 || loading}
                      className="h-9 w-9 p-0 sm:h-auto sm:w-auto sm:px-3"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="sr-only">{t('projectsBloc.enterprise.prevPage')}</span>
                    </Button>

                    {/* Numéros de page - Moins sur mobile */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(3, pagination.totalPages) }, (_, i) => {
                        // Sur mobile : afficher 3 pages max autour de la page courante
                        const pageNum = Math.max(1, pagination.page - 1) + i;
                        if (pageNum > pagination.totalPages) return null;

                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === pagination.page ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => goToPage(pageNum)}
                            disabled={loading}
                            className="h-9 w-9 p-0 sm:h-auto sm:w-auto sm:px-3"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}

                      {/* Pages supplémentaires desktop uniquement */}
                      <div className="hidden items-center gap-1 sm:flex">
                        {Array.from({ length: Math.min(2, pagination.totalPages - 3) }, (_, i) => {
                          const pageNum = Math.max(1, pagination.page - 1) + 3 + i;
                          if (pageNum > pagination.totalPages) return null;

                          return (
                            <Button
                              key={pageNum}
                              variant={pageNum === pagination.page ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => goToPage(pageNum)}
                              disabled={loading}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages || loading}
                      className="h-9 w-9 p-0 sm:h-auto sm:w-auto sm:px-3"
                    >
                      <ChevronRight className="h-4 w-4" />
                      <span className="sr-only">{t('projectsBloc.enterprise.nextPage')}</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* Lazy Loading - Full width mobile */}
              {pagination.hasMore && (
                <div className="mt-4 text-center sm:mt-6">
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    disabled={loading}
                    className="w-full sm:w-auto"
                  >
                    {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {t('projectsBloc.enterprise.loadMore')}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* 🎨 Dialogs Projets Modernes */}
      <ProjectCreationDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreateProject={async projectData => {
          try {
            await createProject({
              name: projectData.name,
              description: projectData.description,
              manager: projectData.manager,
              status: projectData.status,
              priority: projectData.priority,
              skills_required: projectData.skills_required,
              budget: projectData.budget,
            });
            toast({
              title: t('projectsBloc.creation.successTitle'),
              description: t('projectsBloc.creation.successDesc').replace('%s', projectData.name),
            });
            setIsCreateDialogOpen(false);
          } catch (err: any) {
            toast({
              title: t('projectsBloc.creation.createError'),
              description: err.message ?? t('projectsBloc.creation.createErrorDesc'),
              variant: 'destructive',
            });
          }
        }}
      />

      <ProjectDetailsDialog
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        project={selectedProject}
      />
    </div>
  );
};
