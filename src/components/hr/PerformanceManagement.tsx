import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Target,
  TrendingUp,
  Users,
  Star,
  Calendar,
  Award,
  CheckCircle2,
  Loader2,
  KeyRound,
} from 'lucide-react';
import { useOKRStats } from '@/hooks/useOKRStats';
import { KPICard } from '@/components/analytics/KPICard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePerformance } from '@/hooks/usePerformance';
import { CreateObjectiveDialog } from './CreateObjectiveDialog';
import { CreateEvaluationDialog } from './CreateEvaluationDialog';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Interfaces moved to usePerformance hook

export const PerformanceManagement = () => {
  const [activeView, setActiveView] = useState('objectives');
  const {
    objectives,
    objectiveTemplates,
    evaluations,
    createObjectiveTemplate,
    keyResults,
    evaluationCategories,
    loading,
    error,
    createObjective,
    createEvaluation,
    getKeyResultsByObjective,
    getCategoriesByEvaluation,
    getPerformanceStats,
  } = usePerformance();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement des données de performance...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="mb-2 text-red-500">Erreur lors du chargement des données</p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const stats = getPerformanceStats();
  const { data: okrStats, isLoading: okrLoading } = useOKRStats();

  const getObjectiveStatusClasses = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400';
      case 'active':
        return 'border-0 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400';
      case 'draft':
        return 'border-0 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
      case 'cancelled':
        return 'border-0 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400';
      default:
        return 'border-0 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  const getEvaluationStatusClasses = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400';
      case 'in-progress':
      case 'in_progress':
        return 'border-0 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400';
      case 'scheduled':
        return 'border-0 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400';
      default:
        return 'border-0 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 3.5) return 'text-blue-600 dark:text-blue-400';
    if (score >= 2.5) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground text-2xl font-bold">Évaluations & Objectifs</h2>
          <p className="text-muted-foreground">Gestion de la performance et des objectifs</p>
        </div>
        <div className="flex gap-2">
          <CreateObjectiveDialog
            onCreateObjective={createObjective}
            objectiveTemplates={objectiveTemplates}
            onCreateTemplate={createObjectiveTemplate}
          />
          <CreateEvaluationDialog onCreateEvaluation={createEvaluation} />
        </div>
      </div>

      <Tabs value={activeView} onValueChange={setActiveView}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="objectives" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Objectifs & OKR
          </TabsTrigger>
          <TabsTrigger value="evaluations" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Évaluations
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="objectives" className="space-y-4">
          {objectives.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center p-8">
                <div className="text-center">
                  <Target className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                  <h3 className="mb-2 text-lg font-medium">Aucun objectif trouvé</h3>
                  <p className="text-muted-foreground mb-4">
                    Commencez par créer votre premier objectif
                  </p>
                  <CreateObjectiveDialog
                    onCreateObjective={createObjective}
                    objectiveTemplates={objectiveTemplates}
                    onCreateTemplate={createObjectiveTemplate}
                  />
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {objectives.map(objective => {
                const objectiveKeyResults = getKeyResultsByObjective(objective.id);
                return (
                  <Card
                    key={objective.id}
                    className={
                      'transition-shadow hover:shadow-md border-l-4 ' +
                      (objective.status === 'active'
                        ? 'border-l-blue-500'
                        : objective.status === 'completed'
                          ? 'border-l-emerald-500'
                          : objective.status === 'cancelled'
                            ? 'border-l-red-500'
                            : 'border-l-slate-300')
                    }
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            {objective.type === 'individual' && <Target className="h-5 w-5" />}
                            {objective.type === 'team' && <Users className="h-5 w-5" />}
                            {objective.type === 'okr' && <Award className="h-5 w-5" />}
                            {objective.title}
                          </CardTitle>
                          <p className="text-muted-foreground text-sm">
                            {objective.employee_name} • {objective.department}
                          </p>
                        </div>
                        <Badge variant="outline" className={getObjectiveStatusClasses(objective.status)}>
                          {objective.status === 'active'
                            ? 'Actif'
                            : objective.status === 'completed'
                              ? 'Terminé'
                              : objective.status === 'draft'
                                ? 'Brouillon'
                                : 'Annulé'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {objective.description && (
                        <p className="text-muted-foreground text-sm">{objective.description}</p>
                      )}

                      <div className="flex items-center gap-4">
                        <Calendar className="text-muted-foreground h-4 w-4" />
                        <span className="text-sm">
                          Échéance:{' '}
                          {format(new Date(objective.due_date), 'dd MMMM yyyy', { locale: fr })}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Progression générale</span>
                          <span className="text-muted-foreground text-sm">
                            {objective.progress}%
                          </span>
                        </div>
                        <Progress value={objective.progress} className="h-2" />
                      </div>

                      {objectiveKeyResults.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-medium">Résultats clés</h4>
                          {objectiveKeyResults.map(kr => (
                            <div key={kr.id} className="bg-muted/50 space-y-2 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">{kr.title}</p>
                                <span className="text-muted-foreground text-xs">
                                  {kr.current_value || '0'} / {kr.target}
                                </span>
                              </div>
                              <Progress value={kr.progress} className="h-1" />
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="evaluations" className="space-y-4">
          {evaluations.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center p-8">
                <div className="text-center">
                  <Star className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                  <h3 className="mb-2 text-lg font-medium">Aucune évaluation trouvée</h3>
                  <p className="text-muted-foreground mb-4">
                    Commencez par créer votre première évaluation
                  </p>
                  <CreateEvaluationDialog onCreateEvaluation={createEvaluation} />
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {evaluations.map(evaluation => {
                const evaluationCategories = getCategoriesByEvaluation(evaluation.id);
                return (
                  <Card key={evaluation.id} className="transition-shadow hover:shadow-lg">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{evaluation.employee_name}</CardTitle>
                          <p className="text-muted-foreground text-sm">
                            Évaluateur: {evaluation.evaluator_name} • Période: {evaluation.period}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="uppercase">
                            {evaluation.type === 'annual'
                              ? 'Annuelle'
                              : evaluation.type === 'quarterly'
                                ? 'Trimestrielle'
                                : '360°'}
                          </Badge>
                          <Badge variant="outline" className={getEvaluationStatusClasses(evaluation.status)}>
                            {evaluation.status === 'completed'
                              ? 'Terminée'
                              : evaluation.status === 'in_progress'
                                ? 'En cours'
                                : 'Planifiée'}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {evaluation.status === 'completed' && evaluation.overall_score > 0 && (
                        <>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Star className="h-5 w-5 text-yellow-500" />
                              <span
                                className={`text-2xl font-bold ${getScoreColor(evaluation.overall_score)}`}
                              >
                                {evaluation.overall_score.toFixed(1)}
                              </span>
                              <span className="text-muted-foreground text-sm">/ 5.0</span>
                            </div>
                          </div>

                          {evaluationCategories.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="font-medium">Détail par catégorie</h4>
                              {evaluationCategories.map(category => (
                                <div
                                  key={category.id}
                                  className="bg-muted/50 flex items-center justify-between rounded-lg p-3"
                                >
                                  <div>
                                    <p className="text-sm font-medium">{category.name}</p>
                                    <p className="text-muted-foreground text-xs">
                                      Poids: {category.weight}%
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`font-bold ${getScoreColor(category.score)}`}>
                                      {category.score.toFixed(1)}
                                    </span>
                                    <span className="text-muted-foreground text-xs">/ 5.0</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}

                      {evaluation.status === 'scheduled' && (
                        <div className="text-muted-foreground flex items-center justify-center p-8">
                          <div className="text-center">
                            <Calendar className="mx-auto mb-2 h-8 w-8" />
                            <p>Évaluation planifiée</p>
                          </div>
                        </div>
                      )}

                      {evaluation.status === 'in_progress' && (
                        <div className="text-muted-foreground flex items-center justify-center p-8">
                          <div className="text-center">
                            <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin" />
                            <p>Évaluation en cours...</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {/* OKR Key Results KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KPICard
              title="Key Results complétés"
              value={okrLoading ? '...' : (okrStats?.completed ?? 0)}
              icon={KeyRound}
              color="success"
              progress={okrLoading ? undefined : (okrStats?.completionRate ?? 0)}
              subtitle={okrStats ? `sur ${okrStats.total} résultats clés` : undefined}
              trend={
                okrStats
                  ? {
                      value: okrStats.completionRate,
                      isPositive: okrStats.completionRate >= 50,
                      label: `${okrStats.inProgress} en cours · ${okrStats.notStarted} non démarrés`,
                    }
                  : undefined
              }
            />
            <KPICard
              title="Progression moyenne OKR"
              value={okrLoading ? '...' : (okrStats?.avgProgress ?? 0)}
              icon={TrendingUp}
              color={
                (okrStats?.avgProgress ?? 0) >= 70
                  ? 'success'
                  : (okrStats?.avgProgress ?? 0) >= 40
                    ? 'warning'
                    : 'destructive'
              }
              format="percentage"
              progress={okrLoading ? undefined : (okrStats?.avgProgress ?? 0)}
              trend={
                okrStats
                  ? {
                      value: 0,
                      isPositive: (okrStats.avgProgress ?? 0) >= 50,
                      label:
                        (okrStats.avgProgress ?? 0) >= 70
                          ? 'Objectifs bien avancés'
                          : (okrStats.avgProgress ?? 0) >= 40
                            ? 'Progression à accélérer'
                            : 'Retard critique',
                    }
                  : undefined
              }
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">Objectifs Actifs</p>
                    <p className="text-2xl font-bold">{stats.activeObjectives}</p>
                  </div>
                  <Target className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">Taux de Réalisation</p>
                    <p className="text-2xl font-bold">{stats.completionRate}%</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">Score Moyen</p>
                    <p className="text-2xl font-bold">
                      {stats.averageScore > 0 ? stats.averageScore : '--'}
                    </p>
                  </div>
                  <Star className="h-8 w-8 text-amber-600 dark:text-[hsl(var(--status-review))]" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">
                      Évaluations Planifiées
                    </p>
                    <p className="text-2xl font-bold">{stats.scheduledEvaluations}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-violet-600 dark:text-violet-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Répartition des objectifs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['draft', 'active', 'completed', 'cancelled'].map(status => {
                    const count = objectives.filter(obj => obj.status === status).length;
                    const percentage =
                      objectives.length > 0 ? Math.round((count / objectives.length) * 100) : 0;
                    const colorClass =
                      status === 'completed'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : status === 'active'
                          ? 'text-blue-600 dark:text-blue-400'
                          : status === 'cancelled'
                            ? 'text-[hsl(var(--status-blocked))]'
                            : 'text-amber-700 dark:text-[hsl(var(--status-review))]';
                    return (
                      <div key={status} className="flex items-center justify-between">
                        <span className="capitalize">
                          {status === 'draft'
                            ? 'Brouillon'
                            : status === 'active'
                              ? 'Actif'
                              : status === 'completed'
                                ? 'Terminé'
                                : 'Annulé'}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${colorClass}`}>{count}</span>
                          <span className="text-muted-foreground text-sm">({percentage}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Évaluations par type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['annual', 'quarterly', '360'].map(type => {
                    const count = evaluations.filter(evaluation => evaluation.type === type).length;
                    const percentage =
                      evaluations.length > 0 ? Math.round((count / evaluations.length) * 100) : 0;
                    return (
                      <div key={type} className="flex items-center justify-between">
                        <span>
                          {type === 'annual'
                            ? 'Annuelle'
                            : type === 'quarterly'
                              ? 'Trimestrielle'
                              : '360°'}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{count}</span>
                          <span className="text-muted-foreground text-sm">({percentage}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Distribution des scores d'évaluation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {evaluations.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span>Score moyen</span>
                      <span className="text-2xl font-bold">
                        {getPerformanceStats().averageScore}/5
                      </span>
                    </div>
                    <div className="space-y-2">
                      {[5, 4, 3, 2, 1].map(score => {
                        const count = evaluations.filter(
                          evaluation => Math.round(evaluation.overall_score) === score
                        ).length;
                        const percentage =
                          evaluations.length > 0
                            ? Math.round((count / evaluations.length) * 100)
                            : 0;
                        return (
                          <div key={score} className="flex items-center gap-4">
                            <span className="w-12">{score} ⭐</span>
                            <div className="bg-muted h-2 flex-1 rounded-full">
                              <div
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="w-12 text-sm font-medium">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="text-muted-foreground text-center">
                    <TrendingUp className="mx-auto mb-4 h-12 w-12" />
                    <p>Aucune évaluation disponible</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
