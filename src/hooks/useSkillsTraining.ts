import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { applyRoleFilters } from '@/lib/roleBasedFiltering';
import { useToast } from '@/hooks/use-toast';

export interface Skill {
  id: string;
  name: string;
  category: string;
  description?: string;
  tenant_id?: string;
  created_at: string;
  updated_at: string;
}

export interface SkillAssessment {
  id: string;
  skill_id: string;
  employee_id: string;
  employee_name: string;
  position: string;
  department: string;
  current_level: number;
  target_level: number;
  last_assessed: string;
  assessor: string;
  tenant_id?: string;
  created_at: string;
  updated_at: string;
}

export function useSkillsTraining() {
  // 🔒 Contexte utilisateur pour le filtrage
  const { userContext } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: skills = [], isLoading: skillsLoading, error: skillsError } = useQuery<Skill[]>({
    queryKey: ['skills-training', 'skills', userContext?.userId, userContext?.tenantId],
    queryFn: async () => {
      if (!userContext) return [];

      // NOTE: La table skills contient des compétences globales (tenant_id IS NULL) et spécifiques
      let skillsQuery = supabase
        .from('skills')
        .select('*')
        .order('created_at', { ascending: false });

      if (userContext.tenantId) {
        skillsQuery = skillsQuery.or(`tenant_id.is.null,tenant_id.eq.${userContext.tenantId}`);
      } else {
        skillsQuery = skillsQuery.is('tenant_id', null);
      }

      const { data, error } = await skillsQuery;
      if (error) throw error;
      return (data as any) || [];
    },
    enabled: !!userContext?.userId,
  });

  const { data: skillAssessments = [], isLoading: assessmentsLoading, error: assessmentsError } = useQuery<SkillAssessment[]>({
    queryKey: ['skills-training', 'assessments', userContext?.userId, userContext?.tenantId],
    queryFn: async () => {
      if (!userContext) return [];

      let assessmentsQuery = supabase
        .from('skill_assessments')
        .select('*')
        .order('last_assessed', { ascending: false });
      assessmentsQuery = applyRoleFilters(assessmentsQuery, userContext, 'skill_assessments');

      const { data, error } = await assessmentsQuery;
      if (error) throw error;
      return (data as any) || [];
    },
    enabled: !!userContext?.userId,
    meta: {
      onError: (err: any) => {
        console.error('Error fetching skills data:', err);
        // Don't show toast for missing tables
        if (!err.message?.includes('relation') && !err.message?.includes('does not exist')) {
          toast({
            title: 'Erreur',
            description: 'Impossible de charger les données de compétences',
            variant: 'destructive',
          });
        }
      },
    },
  });

  const loading = skillsLoading || assessmentsLoading;
  const error = skillsError
    ? (skillsError as Error).message
    : assessmentsError
    ? (assessmentsError as Error).message
    : null;

  const createSkillMutation = useMutation({
    mutationFn: async (skillData: Omit<Skill, 'id' | 'created_at'>) => {
      const { error } = await supabase.from('skills').insert(skillData);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Succès',
        description: 'Compétence créée avec succès',
      });
      queryClient.invalidateQueries({ queryKey: ['skills-training'] });
    },
    onError: (err: any) => {
      console.error('Error creating skill:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la compétence',
        variant: 'destructive',
      });
    },
  });

  const createSkillAssessmentMutation = useMutation({
    mutationFn: async (assessmentData: Omit<SkillAssessment, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('skill_assessments').insert(assessmentData);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Succès',
        description: 'Évaluation de compétence créée avec succès',
      });
      queryClient.invalidateQueries({ queryKey: ['skills-training'] });
    },
    onError: (err: any) => {
      console.error('Error creating skill assessment:', err);
      toast({
        title: 'Erreur',
        description: "Impossible de créer l'évaluation",
        variant: 'destructive',
      });
    },
  });

  const createSkill = async (skillData: Omit<Skill, 'id' | 'created_at'>) => {
    return createSkillMutation.mutateAsync(skillData);
  };

  const createSkillAssessment = async (
    assessmentData: Omit<SkillAssessment, 'id' | 'created_at' | 'updated_at'>
  ) => {
    return createSkillAssessmentMutation.mutateAsync(assessmentData);
  };

  const getSkillAssessmentsByEmployee = (employeeName: string) => {
    return skillAssessments.filter(assessment => assessment.employee_name === employeeName);
  };

  const getSkillsMatrix = () => {
    const employeeGroups = skillAssessments.reduce((groups, assessment) => {
      if (!groups[assessment.employee_name]) {
        groups[assessment.employee_name] = {
          employeeName: assessment.employee_name,
          position: assessment.position,
          department: assessment.department,
          skills: [],
          overallScore: 0,
        };
      }

      const skill = skills.find(s => s.id === assessment.skill_id);
      groups[assessment.employee_name].skills.push({
        id: assessment.skill_id,
        name: skill?.name || 'Compétence inconnue',
        category: skill?.category || 'Non définie',
        currentLevel: assessment.current_level,
        targetLevel: assessment.target_level,
        lastAssessed: assessment.last_assessed,
        assessor: assessment.assessor,
      });

      return groups;
    }, {} as any);

    // Calculate overall scores
    Object.values(employeeGroups).forEach((group: any) => {
      if (group.skills.length > 0) {
        group.overallScore =
          group.skills.reduce((sum: number, skill: any) => sum + skill.currentLevel, 0) /
          group.skills.length;
      }
    });

    return Object.values(employeeGroups);
  };

  const getSkillsStats = () => {
    const totalSkills = skills.length;
    const totalAssessments = skillAssessments.length;
    const averageLevel =
      skillAssessments.length > 0
        ? skillAssessments.reduce((sum, assessment) => sum + assessment.current_level, 0) /
          skillAssessments.length
        : 0;

    return {
      totalSkills,
      totalAssessments,
      averageLevel: Math.round(averageLevel * 10) / 10,
    };
  };

  return {
    skills,
    skillAssessments,
    loading,
    error,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['skills-training'] }),
    createSkill,
    createSkillAssessment,
    getSkillAssessmentsByEmployee,
    getSkillsMatrix,
    getSkillsStats,
  };
}
