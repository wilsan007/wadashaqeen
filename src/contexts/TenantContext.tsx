import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
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

  // Ref stable pour éviter les closures périmées depuis onAuthStateChange
  const isMountedRef = useRef(true);

  const fetchUserTenant = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (isMountedRef.current) setLoading(false);
        return;
      }

      // ✅ maybeSingle() — renvoie null si aucun profil, sans lever HTTP 406
      // ✅ user_id — colonne correcte pour filtrer par l'id Auth de l'utilisateur
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        if (isMountedRef.current) setLoading(false);
        return;
      }

      if (profile && profile.tenant_id) {
        let { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', profile.tenant_id)
          .single();

        if (tenantError || !tenantData) {
          console.error('Error fetching tenant:', tenantError);
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

        tenantCache = {
          currentTenant: tenantData as Tenant,
          userMembership: membership,
          tenantId: profile.tenant_id,
          loading: false,
        };

        if (isMountedRef.current) {
          setCurrentTenant(tenantData as Tenant);
          setUserMembership(membership);
        }
      }
    } catch (error) {
      console.error('Error in TenantProvider:', error);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  };

  // 🔒 Réagit aux changements d'authentification
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      // Vider le cache pour TOUT événement d'auth
      tenantCache = null;

      if (event === 'SIGNED_OUT') {
        setCurrentTenant(null);
        setUserMembership(null);
        setLoading(false);
      }

      // ✅ CORRECTION CRITIQUE : déclencher un vrai re-fetch au lieu de juste
      // mettre loading=true sans jamais appeler fetchUserTenant
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
        fetchUserTenant();
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Chargement initial (si une session est déjà active au montage du composant)
  useEffect(() => {
    isMountedRef.current = true;

    if (tenantCache && !tenantCache.loading) {
      setCurrentTenant(tenantCache.currentTenant);
      setUserMembership(tenantCache.userMembership);
      setLoading(false);
      return;
    }

    fetchUserTenant();

    return () => {
      isMountedRef.current = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const tenantId = currentTenant?.id || null;

  // ✅ maybeSingle() dans refreshTenant pour la même raison
  const refreshTenant = async () => {
    tenantCache = null;
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
        .maybeSingle();

      if (profile && profile.tenant_id) {
        const { data: tenantData } = await supabase
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
