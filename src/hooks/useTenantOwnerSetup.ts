import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TenantOwnerSetupData {
  isPendingTenantOwner: boolean;
  hasCompletedSetup: boolean;
  userEmail: string | null;
}

export const useTenantOwnerSetup = () => {
  const {
    data,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery<TenantOwnerSetupData>({
    queryKey: ['tenant-owner-setup'],
    queryFn: async () => {
      // Récupérer l'utilisateur connecté
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return {
          isPendingTenantOwner: false,
          hasCompletedSetup: false,
          userEmail: null,
        };
      }

      // Vérifier si l'utilisateur a déjà un profil (setup terminé)
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id, tenant_id, role')
        .eq('user_id', user.id)
        .maybeSingle(); // ✅ pas de 406 si pas encore de profil

      if (profile && profile.tenant_id) {
        // L'utilisateur a déjà un tenant, setup terminé
        return {
          isPendingTenantOwner: false,
          hasCompletedSetup: true,
          userEmail: user.email ?? null,
        };
      }

      // Vérifier s'il y a une invitation tenant_owner en attente pour cet email
      const { data: isPending, error: pendingError } = await supabase.rpc(
        'is_pending_tenant_owner',
        { user_email: user.email }
      );

      if (pendingError) {
        console.error('Erreur vérification invitation:', pendingError);
        throw new Error("Erreur lors de la vérification de l'invitation");
      }

      return {
        isPendingTenantOwner: isPending || false,
        hasCompletedSetup: false,
        userEmail: user.email ?? null,
      };
    },
  });

  const error = queryError ? (queryError as Error).message : null;

  return {
    isLoading,
    isPendingTenantOwner: data?.isPendingTenantOwner ?? false,
    hasCompletedSetup: data?.hasCompletedSetup ?? false,
    userEmail: data?.userEmail ?? null,
    error,
    refreshStatus: refetch,
  };
};
