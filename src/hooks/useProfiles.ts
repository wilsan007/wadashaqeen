import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { applyRoleFilters } from '@/lib/roleBasedFiltering';

export interface Profile {
  id: string;
  full_name: string;
  avatar_url?: string;
}

export const useProfiles = () => {
  // 🔒 Contexte utilisateur pour le filtrage
  const { userContext } = useAuth();

  const { data: profiles = [], isLoading: loading, error: queryError, refetch } = useQuery<Profile[]>({
    queryKey: ['profiles', userContext?.userId, userContext?.role, userContext?.tenantId],
    queryFn: async () => {
      if (!userContext) return [];

      let query = supabase.from('profiles').select('id, full_name, avatar_url').order('full_name');

      // 🔒 Appliquer le filtrage par rôle (profiles = employees)
      query = applyRoleFilters(query, userContext, 'employees');

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: !!userContext,
  });

  const error = queryError ? (queryError as Error).message : null;

  return {
    profiles,
    loading,
    error,
    refetch,
  };
};
