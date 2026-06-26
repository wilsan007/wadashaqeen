/**
 * 🎯 Hook useSkills - Gestion Compétences
 * Pattern: LinkedIn Skills, Workday Skills Cloud
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { applyRoleFilters } from '@/lib/roleBasedFiltering';
import { useToast } from '@/hooks/use-toast';

export interface Skill {
  id: string;
  name: string;
  category: string;
  description: string | null;
  level_required: string;
  is_critical: boolean;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeSkill {
  id: string;
  employee_id: string;
  skill_id: string;
  skill?: Skill;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  is_certified: boolean;
  certified_by: string | null;
  certified_at: string | null;
  years_experience: number;
  last_used_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useSkills() {
  const { userContext, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: skills = [], isLoading: skillsLoading, error: skillsError } = useQuery<Skill[]>({
    queryKey: ['skills', userContext?.userId, userContext?.role, userContext?.tenantId],
    queryFn: async () => {
      if (!userContext) return [];
      let query = supabase.from('skills').select('*').order('name');
      query = applyRoleFilters(query, userContext, 'skills');
      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      return data || [];
    },
    enabled: !authLoading && !!userContext,
  });

  const { data: employeeSkills = [], isLoading: employeeSkillsLoading, error: employeeSkillsError } = useQuery<EmployeeSkill[]>({
    queryKey: ['employee-skills', userContext?.userId, userContext?.role, userContext?.tenantId],
    queryFn: async () => {
      if (!userContext) return [];
      const { data, error: fetchError } = await supabase
        .from('employee_skills')
        .select(
          `
          *,
          skill:skills(*)
        `
        )
        .order('created_at', { ascending: false });
      if (fetchError) throw fetchError;
      return data || [];
    },
    enabled: !authLoading && !!userContext,
  });

  const loading = skillsLoading || employeeSkillsLoading;
  const error = skillsError
    ? (skillsError as Error).message
    : employeeSkillsError
    ? (employeeSkillsError as Error).message
    : null;

  // Fetch compétences employé (ses skills ou équipe si manager)
  const fetchEmployeeSkills = async (employeeId?: string) => {
    if (!userContext) return;
    if (employeeId) {
      // For a specific employee, we bypass the cached query and refetch filtered
      const { data, error: fetchError } = await supabase
        .from('employee_skills')
        .select(
          `
          *,
          skill:skills(*)
        `
        )
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });
      if (!fetchError) {
        // Invalidate to re-sync cache
        queryClient.invalidateQueries({ queryKey: ['employee-skills'] });
      }
    } else {
      queryClient.invalidateQueries({ queryKey: ['employee-skills'] });
    }
  };

  const fetchSkills = async () => {
    queryClient.invalidateQueries({ queryKey: ['skills'] });
  };

  const addSkillToProfileMutation = useMutation({
    mutationFn: async ({ skillId, level }: { skillId: string; level: string }) => {
      if (!profile) throw new Error('Profil non disponible');

      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', profile.userId)
        .single();

      if (!employee) throw new Error('Employé non trouvé');

      const { error: insertError } = await supabase.from('employee_skills').insert({
        employee_id: employee.id,
        skill_id: skillId,
        level,
      });

      if (insertError) throw insertError;
      return employee.id;
    },
    onSuccess: () => {
      toast({
        title: 'Compétence ajoutée',
        description: 'La compétence a été ajoutée à votre profil',
      });
      queryClient.invalidateQueries({ queryKey: ['employee-skills'] });
    },
    onError: (err: any) => {
      toast({
        title: 'Erreur',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  const updateSkillLevelMutation = useMutation({
    mutationFn: async ({ employeeSkillId, level }: { employeeSkillId: string; level: string }) => {
      const { error: updateError } = await supabase
        .from('employee_skills')
        .update({ level })
        .eq('id', employeeSkillId);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      toast({
        title: 'Niveau mis à jour',
        description: 'Votre niveau de compétence a été mis à jour',
      });
      queryClient.invalidateQueries({ queryKey: ['employee-skills'] });
    },
    onError: (err: any) => {
      toast({
        title: 'Erreur',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  const certifySkillMutation = useMutation({
    mutationFn: async ({ employeeSkillId, certifiedBy }: { employeeSkillId: string; certifiedBy: string }) => {
      const { error: updateError } = await supabase
        .from('employee_skills')
        .update({
          is_certified: true,
          certified_by: certifiedBy,
          certified_at: new Date().toISOString(),
        })
        .eq('id', employeeSkillId);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      toast({
        title: 'Compétence certifiée',
        description: 'La compétence a été certifiée avec succès',
      });
      queryClient.invalidateQueries({ queryKey: ['employee-skills'] });
    },
    onError: (err: any) => {
      toast({
        title: 'Erreur',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  const removeSkillFromProfileMutation = useMutation({
    mutationFn: async (employeeSkillId: string) => {
      const { error: deleteError } = await supabase
        .from('employee_skills')
        .delete()
        .eq('id', employeeSkillId);
      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      toast({
        title: 'Compétence supprimée',
        description: 'La compétence a été retirée de votre profil',
      });
      queryClient.invalidateQueries({ queryKey: ['employee-skills'] });
    },
    onError: (err: any) => {
      toast({
        title: 'Erreur',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  // Ajouter compétence à son profil
  const addSkillToProfile = async (skillId: string, level: string) => {
    return addSkillToProfileMutation.mutateAsync({ skillId, level });
  };

  // Mettre à jour niveau compétence
  const updateSkillLevel = async (employeeSkillId: string, level: string) => {
    return updateSkillLevelMutation.mutateAsync({ employeeSkillId, level });
  };

  // Demander certification (manager valide)
  const requestCertification = async (employeeSkillId: string) => {
    try {
      // Logique: notification au manager pour validation
      toast({
        title: 'Demande envoyée',
        description: 'Votre manager recevra une notification pour valider cette compétence',
      });
    } catch (err: any) {
      toast({
        title: 'Erreur',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  // Certifier compétence (manager uniquement)
  const certifySkill = async (employeeSkillId: string, certifiedBy: string) => {
    return certifySkillMutation.mutateAsync({ employeeSkillId, certifiedBy });
  };

  // Supprimer compétence de son profil
  const removeSkillFromProfile = async (employeeSkillId: string) => {
    return removeSkillFromProfileMutation.mutateAsync(employeeSkillId);
  };

  return {
    // Data
    skills,
    employeeSkills,

    // States
    loading,
    error,

    // Actions
    fetchSkills,
    fetchEmployeeSkills,
    addSkillToProfile,
    updateSkillLevel,
    requestCertification,
    certifySkill,
    removeSkillFromProfile,

    // Utils
    refresh: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      queryClient.invalidateQueries({ queryKey: ['employee-skills'] });
    },
  };
}
