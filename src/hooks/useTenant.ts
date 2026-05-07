/**
 * Hook pour gérer le tenant de l'utilisateur connecté
 * VERSION SIMPLIFIÉE - Utilise useUserRoles en interne et fetch le vrai nom du tenant
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRoles } from './useUserRoles';

interface Tenant {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  logo_url?: string;
  status?: string;
  subscription_plan?: string;
  max_users?: number;
  max_projects?: number;
}

interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  tenant_id: string;
  is_active: boolean;
  roles: {
    name: string;
    display_name: string;
    hierarchy_level: number;
  };
}

interface TenantMember {
  id: string;
  tenant_id: string;
  user_id: string;
  role: string;
  status: string;
  permissions: any;
}

export const useTenant = () => {
  const { userRoles, isLoading } = useUserRoles();
  const [tenantData, setTenantData] = useState<Tenant | null>(null);

  // Récupérer le tenant_id depuis le premier rôle actif
  const tenantId = userRoles[0]?.tenant_id ?? null;

  // Fetch le vrai nom du tenant depuis la base
  useEffect(() => {
    if (!tenantId) {
      setTenantData(null);
      return;
    }
    supabase
      .from('tenants')
      .select('id, name, slug, description, logo_url, status, subscription_plan, max_users, max_projects')
      .eq('id', tenantId)
      .single()
      .then(({ data, error }) => {
        if (data && !error) {
          setTenantData(data as Tenant);
        } else {
          // Fallback avec l'ID connu si le tenant est introuvable
          setTenantData({ id: tenantId, name: 'Mon Organisation', status: 'active' });
        }
      });
  }, [tenantId]);

  const currentTenant: Tenant | null = tenantData;

  // Créer un userMembership minimal
  const userMembership: TenantMember | null =
    tenantId && userRoles[0]
      ? {
          id: userRoles[0].id,
          tenant_id: tenantId,
          user_id: userRoles[0].user_id,
          role: userRoles[0].roles.name,
          status: 'active',
          permissions: {},
        }
      : null;

  // Fonctions utilitaires
  const hasPermission = (_permission: string): boolean => {
    return true;
  };

  const canManage = (_resource: string): boolean => {
    return userRoles.some(r => ['tenant_admin', 'super_admin'].includes(r.roles.name));
  };

  const hasRole = (roleName: string): boolean => {
    return userRoles.some(role => role.roles.name === roleName && role.is_active);
  };

  const getActiveRoles = (): string[] => {
    return userRoles.filter(role => role.is_active).map(role => role.roles.name);
  };

  const fetchUserTenant = async () => {
    return Promise.resolve();
  };

  const switchTenant = async (_newTenantId: string) => {
    return Promise.resolve();
  };

  return {
    currentTenant,
    userMembership,
    userRoles,
    loading: isLoading || (!!tenantId && !tenantData),
    tenantId,
    fetchUserTenant,
    switchTenant,
    hasPermission,
    canManage,
    hasRole,
    getActiveRoles,
    isAdmin: userRoles.some(r => ['tenant_admin', 'super_admin', 'owner'].includes(r.roles.name)),
  };
};
