import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  status: string;
  subscription_plan?: string;
  max_users?: number;
  max_projects?: number;
}

interface TenantMember {
  id: string;
  tenant_id: string;
  user_id: string;
  role: string;
  status: string;
  permissions: any;
  tenant?: Tenant;
}

interface TenantContextType {
  currentTenant: Tenant | null;
  userMembership: TenantMember | null;
  tenantId: string | null;
  loading: boolean;
  refreshTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

let tenantCache: {
  currentTenant: Tenant | null;
  userMembership: TenantMember | null;
  tenantId: string | null;
  loading: boolean;
} | null = null;

export const TenantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [userMembership, setUserMembership] = useState<TenantMember | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔒 SÉCURITÉ: Vider le cache à CHAQUE changement d'auth
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      // Auth event tracking

      // 🚨 CRITIQUE: Vider le cache pour TOUT événement
      tenantCache = null;

      if (event === 'SIGNED_OUT') {
        // Nettoyage immédiat des états
        setCurrentTenant(null);
        setUserMembership(null);
        setLoading(false);
      }

      if (event === 'SIGNED_IN' && session) {
        // Nouvelle session: forcer le refetch
        setLoading(true);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Si on a déjà les données en cache, les utiliser
    if (tenantCache && !tenantCache.loading) {
      setCurrentTenant(tenantCache.currentTenant);
      setUserMembership(tenantCache.userMembership);
      setLoading(false);
      return;
    }

    let isMounted = true; // Éviter les updates si le composant est démonté

    const fetchUserTenant = async () => {
      try {
        // console.log('🏢 TenantProvider: Fetching tenant data...');
        setLoading(true);

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // Vérifier le profil directement
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profileError) {
          // Si pas de profil trouvé, c'est peut-être un nouveau tenant owner
          if (profileError.code === 'PGRST116') {
            setLoading(false);
            return;
          }
          console.error('Error fetching profile:', profileError);
          setLoading(false);
          return;
        }

        if (profile && profile.tenant_id) {
          // Récupérer les vraies données du tenant
          let { data: tenantData, error: tenantError } = await supabase
            .from('tenants')
            .select('*')
            .eq('id', profile.tenant_id)
            .single();

          if (tenantError || !tenantData) {
            console.error('Error fetching tenant:', tenantError);
            // Fallback sur données par défaut
            tenantData = {
              id: profile.tenant_id,
              name: 'Mon Entreprise',
              slug: 'default',
              status: 'active',
            } as any;
          }

          const membership = {
            id: profile.id,
            tenant_id: profile.tenant_id,
            user_id: profile.user_id,
            role: profile.role || 'admin',
            status: 'active',
            permissions: { admin: true, manage_all: true },
            tenant: tenantData as Tenant,
          };

          // Mettre en cache
          tenantCache = {
            currentTenant: tenantData as Tenant,
            userMembership: membership,
            tenantId: profile.tenant_id,
            loading: false,
          };

          if (isMounted) {
            setCurrentTenant(tenantData as Tenant);
            setUserMembership(membership);
            // Tenant loaded
          }
        }
      } catch (error) {
        console.error('Error in TenantProvider:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUserTenant();

    return () => {
      isMounted = false; // Cleanup
    };
  }, []);

  const tenantId = currentTenant?.id || null;

  // Fonction pour rafraîchir les données du tenant
  const refreshTenant = async () => {
    // Refresh tenant demandé
    // Vider le cache
    tenantCache = null;
    // Recharger
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profile && profile.tenant_id) {
        let { data: tenantData } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', profile.tenant_id)
          .single();

        if (tenantData) {
          setCurrentTenant(tenantData as Tenant);
        }
      }
    } catch (error) {
      console.error('Erreur refresh tenant:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TenantContext.Provider
      value={{ currentTenant, userMembership, tenantId, loading, refreshTenant }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
