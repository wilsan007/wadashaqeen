/**
 * Hook usePerformance - Gestion des performances et évaluations
 * Pattern Enterprise pour le module RH
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/hooks/useTenant';
import { useRolesCompat as useUserRoles } from '@/contexts/RolesContext';
import { useAuth } from '@/contexts/AuthContext';
import { applyRoleFilters } from '@/lib/roleBasedFiltering';

export interface Objective {
  id: string;
  employee_id: string;
  employee_name?: string; // Added
  department?: string; // Added
  title: string;
  description?: string;
  due_date: string; // Renamed from target_date
  type?: 'individual' | 'team' | 'okr'; // Added
  status: string;
  progress: number;
  created_at?: string;
  updated_at?: string;
}

export interface Evaluation {
  id: string;
  employee_id: string;
  employee_name?: string; // Added
  evaluator_id: string;
  evaluator_name?: string; // Added
  period: string; // Added (was period_start/end, component expects single string or mapped)
  type?: 'annual' | 'quarterly' | '360'; // Added
  overall_score: number; // Renamed from overall_rating
  strengths?: string;
  areas_for_improvement?: string;
  comments?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export const usePerformance = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { tenantId } = useTenant();
  const { userRoles } = useUserRoles();

  // 🔒 Contexte utilisateur pour le filtrage
  const { userContext } = useAuth();

  // SOLUTION TEMPORAIRE : Récupérer le tenant_id depuis user_roles si useTenant échoue
  const tenantIdFromRoles = userRoles[0]?.tenant_id;
  const effectiveTenantId = tenantId || tenantIdFromRoles;

  const isEnabled = !!userContext?.userId;

  // Query: objectives + templates + evaluations (bundled for shared filtering context)
  const {
    data: performanceData,
    isLoading: loading,
    error: rawError,
    refetch,
  } = useQuery({
    queryKey: ['performance', userContext?.userId, userContext?.tenantId],
    queryFn: async () => {
      // Fetch objectives avec filtrage
      let objectivesQuery = supabase
        .from('objectives')
        .select('*')
        .order('created_at', { ascending: false });
      objectivesQuery = applyRoleFilters(objectivesQuery, userContext!, 'performance_goals');

      // Fetch templates (Global + Tenant)
      let templatesQuery = supabase
        .from('objective_templates' as any)
        .select('*')
        .order('category', { ascending: true });

      if (userContext!.tenantId) {
        templatesQuery = templatesQuery.or(
          `tenant_id.is.null,tenant_id.eq.${userContext!.tenantId}`
        );
      } else {
        templatesQuery = templatesQuery.is('tenant_id', null);
      }

      const { data: objectivesData, error: objectivesError } = await objectivesQuery;
      if (objectivesError) throw objectivesError;

      const { data: templatesData, error: templatesError } = await templatesQuery;
      if (templatesError) {
        console.warn('Templates fetch error (might not exist yet):', templatesError);
      }

      // Fetch evaluations avec filtrage
      let evaluationsQuery = supabase
        .from('evaluations')
        .select('*')
        .order('created_at', { ascending: false });
      evaluationsQuery = applyRoleFilters(evaluationsQuery, userContext!, 'performance_reviews');
      const { data: evaluationsData, error: evaluationsError } = await evaluationsQuery;
      if (evaluationsError) throw evaluationsError;

      // Fetch key_results pour tous les objectifs du tenant
      const objectiveIds = (objectivesData ?? []).map((o: any) => o.id);
      let keyResultsData: any[] = [];
      if (objectiveIds.length > 0) {
        const { data: krData, error: krError } = await supabase
          .from('key_results')
          .select('*')
          .in('objective_id', objectiveIds);
        if (!krError) keyResultsData = krData ?? [];
      }

      // Fetch evaluation_categories pour toutes les évaluations du tenant
      const evaluationIds = (evaluationsData ?? []).map((e: any) => e.id);
      let evalCategoriesData: any[] = [];
      if (evaluationIds.length > 0) {
        const { data: ecData, error: ecError } = await supabase
          .from('evaluation_categories')
          .select('*')
          .in('evaluation_id', evaluationIds);
        if (!ecError) evalCategoriesData = ecData ?? [];
      }

      // Map objectives data
      const mappedObjectives: Objective[] = (objectivesData || []).map((obj: any) => ({
        ...obj,
        due_date: obj.due_date || obj.target_date,
        employee_name: obj.employee_name || 'Employé',
        department: obj.department || 'Département',
        type: obj.type || 'individual',
      }));

      // Map evaluations data
      const mappedEvaluations: Evaluation[] = (evaluationsData || []).map((ev: any) => ({
        ...ev,
        overall_score: ev.overall_rating || 0,
        period: ev.period || `${ev.period_start} - ${ev.period_end}`,
        employee_name: ev.employee_name || 'Employé',
        evaluator_name: ev.evaluator_name || 'Évaluateur',
        type: ev.type || 'annual',
      }));

      return {
        objectives: mappedObjectives,
        objectiveTemplates: (templatesData as any[]) || [],
        evaluations: mappedEvaluations,
        keyResults: keyResultsData,
        evaluationCategories: evalCategoriesData,
      };
    },
    enabled: isEnabled,
  });

  const objectives: Objective[] = performanceData?.objectives ?? [];
  const objectiveTemplates: any[] = performanceData?.objectiveTemplates ?? [];
  const evaluations: Evaluation[] = performanceData?.evaluations ?? [];
  const allKeyResults: any[] = performanceData?.keyResults ?? [];
  const allEvaluationCategories: any[] = performanceData?.evaluationCategories ?? [];

  const error: string | null = rawError
    ? rawError instanceof Error
      ? rawError.message
      : String(rawError)
    : null;

  const invalidatePerformance = () => {
    queryClient.invalidateQueries({
      queryKey: ['performance', userContext?.userId, userContext?.tenantId],
    });
  };

  // Mutation: createObjective
  const createObjectiveMutation = useMutation({
    mutationFn: async (data: Omit<Objective, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('objectives').insert([data as any]);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Objectif créé', description: "L'objectif a été créé avec succès" });
      invalidatePerformance();
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: "Impossible de créer l'objectif",
        variant: 'destructive',
      });
    },
  });

  const createObjective = async (data: Omit<Objective, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await createObjectiveMutation.mutateAsync(data);
    } catch (err: any) {
      console.error('Error creating objective:', err);
      throw err;
    }
  };

  // Mutation: createEvaluation
  const createEvaluationMutation = useMutation({
    mutationFn: async (data: Omit<Evaluation, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('evaluations').insert([data as any]);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Évaluation créée', description: "L'évaluation a été créée avec succès" });
      invalidatePerformance();
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: "Impossible de créer l'évaluation",
        variant: 'destructive',
      });
    },
  });

  const createEvaluation = async (data: Omit<Evaluation, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await createEvaluationMutation.mutateAsync(data);
    } catch (err: any) {
      console.error('Error creating evaluation:', err);
      throw err;
    }
  };

  // Mutation: updateObjective
  const updateObjectiveMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Objective> }) => {
      const { error } = await supabase
        .from('objectives')
        .update(data as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Objectif mis à jour',
        description: "L'objectif a été mis à jour avec succès",
      });
      invalidatePerformance();
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: "Impossible de mettre à jour l'objectif",
        variant: 'destructive',
      });
    },
  });

  const updateObjective = async (id: string, data: Partial<Objective>) => {
    try {
      await updateObjectiveMutation.mutateAsync({ id, data });
    } catch (err: any) {
      console.error('Error updating objective:', err);
      throw err;
    }
  };

  // Mutation: createObjectiveTemplate
  const createObjectiveTemplateMutation = useMutation({
    mutationFn: async (data: { title: string; category: string; description?: string }) => {
      if (!effectiveTenantId) throw new Error('Tenant ID not found');
      const { error } = await supabase
        .from('objective_templates' as any)
        .insert([{ ...data, tenant_id: effectiveTenantId }]);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Modèle créé',
        description: "Le modèle d'objectif a été créé avec succès",
      });
      invalidatePerformance();
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de créer le modèle', variant: 'destructive' });
    },
  });

  const createObjectiveTemplate = async (data: {
    title: string;
    category: string;
    description?: string;
  }) => {
    try {
      await createObjectiveTemplateMutation.mutateAsync(data);
    } catch (err: any) {
      console.error('Error creating objective template:', err);
      throw err;
    }
  };

  // Mutation: deleteObjective
  const deleteObjectiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('objectives').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Objectif supprimé', description: "L'objectif a été supprimé avec succès" });
      invalidatePerformance();
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: "Impossible de supprimer l'objectif",
        variant: 'destructive',
      });
    },
  });

  const deleteObjective = async (id: string) => {
    try {
      await deleteObjectiveMutation.mutateAsync(id);
    } catch (err: any) {
      console.error('Error deleting objective:', err);
      throw err;
    }
  };

  const getKeyResultsByObjective = (objectiveId: string) => {
    return allKeyResults.filter(kr => kr.objective_id === objectiveId);
  };

  const getCategoriesByEvaluation = (evaluationId: string) => {
    return allEvaluationCategories.filter(cat => cat.evaluation_id === evaluationId);
  };

  const getPerformanceStats = () => {
    const totalObjectives = objectives.length;
    const completedObjectives = objectives.filter(o => o.status === 'completed').length;
    const activeObjectives = objectives.filter(o => o.status === 'active').length;
    const completionRate =
      totalObjectives > 0 ? Math.round((completedObjectives / totalObjectives) * 100) : 0;

    const totalEvaluations = evaluations.length;
    const scheduledEvaluations = evaluations.filter(e => e.status === 'scheduled').length;
    const completedEvaluations = evaluations.filter(e => e.status === 'completed');
    const averageScore =
      completedEvaluations.length > 0
        ? Number(
            (
              completedEvaluations.reduce((acc, curr) => acc + curr.overall_score, 0) /
              completedEvaluations.length
            ).toFixed(1)
          )
        : 0;

    return {
      totalObjectives,
      completedObjectives,
      activeObjectives,
      completionRate,
      totalEvaluations,
      scheduledEvaluations,
      averageScore,
    };
  };

  return {
    objectives,
    objectiveTemplates,
    evaluations,
    keyResults: allKeyResults,
    evaluationCategories: allEvaluationCategories,
    loading,
    error,
    refresh: refetch,
    createObjective,
    createObjectiveTemplate,
    createEvaluation,
    updateObjective,
    deleteObjective,
    getKeyResultsByObjective,
    getCategoriesByEvaluation,
    getPerformanceStats,
  };
};
