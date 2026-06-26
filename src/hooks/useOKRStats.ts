import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CACHE_TTL } from '@/lib/queryConfig';
import { useAuth } from '@/contexts/AuthContext';

export const useOKRStats = () => {
  const { userContext } = useAuth();

  return useQuery({
    queryKey: ['okr-stats', userContext?.tenantId],
    queryFn: async () => {
      let query = supabase.from('key_results').select('progress, objective_id');
      if (userContext?.tenantId) {
        query = (query as any).eq('tenant_id', userContext.tenantId);
      }
      const { data, error } = await query;
      if (error) throw error;

      const rows = data ?? [];
      const total = rows.length;
      const completed = rows.filter(kr => (kr.progress ?? 0) >= 100).length;
      const inProgress = rows.filter(
        kr => (kr.progress ?? 0) > 0 && (kr.progress ?? 0) < 100
      ).length;
      const avgProgress =
        total > 0
          ? Math.round(rows.reduce((s, kr) => s + (kr.progress ?? 0), 0) / total)
          : 0;

      return {
        total,
        completed,
        inProgress,
        notStarted: total - completed - inProgress,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        avgProgress,
      };
    },
    enabled: !!userContext?.userId,
    ...CACHE_TTL.semiStatic,
  });
};
