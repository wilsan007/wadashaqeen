/**
 * AccessContext — Single source of truth for all RBAC state.
 *
 * Replaces both AuthProvider (RolesProvider pattern) and the duplicated
 * useUserRoles / useRoleBasedAccess call chain that previously existed in App.tsx.
 *
 * Architecture:
 *   AccessProvider (wraps the app)
 *     → fetches auth session, user roles, and project memberships once
 *     → computes UserAccess from the RBAC permission matrix
 *     → exposes stable helper functions through AccessContext
 *
 * Consumers call useAccess() or the specialised helpers exported from
 * src/hooks/useAccess.ts. They never call Supabase directly for auth/role data.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  AppFeature,
  Permission,
  RoleName,
  UserAccess,
} from '@/lib/rbac/types';
import {
  computePermissions,
  FEATURE_PERMISSIONS,
  hasPermission as checkPermission,
} from '@/lib/rbac/permissions';
import { getHighestRole, hasMinimumRole } from '@/lib/rbac/hierarchy';

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

export interface AccessContextValue {
  /** The resolved access object — null while loading or unauthenticated. */
  access: UserAccess | null;
  /** True while the initial fetch is in progress. */
  isLoading: boolean;
  /** Stable reference: checks a specific permission against computed access. */
  hasPermission: (permission: Permission) => boolean;
  /** Stable reference: checks if the user holds a specific role. */
  hasRole: (role: RoleName) => boolean;
  /** Stable reference: checks if the user holds at least minimumRole in the hierarchy. */
  hasMinimumRole: (role: RoleName) => boolean;
  /** Stable reference: checks access to an AppFeature using FEATURE_PERMISSIONS. */
  canAccess: (feature: AppFeature) => boolean;
  /** Forces a full re-fetch of roles and project memberships. */
  refresh: () => Promise<void>;
}

const AccessContext = createContext<AccessContextValue | null>(null);
AccessContext.displayName = 'AccessContext';

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface AccessProviderProps {
  children: React.ReactNode;
}

export const AccessProvider: React.FC<AccessProviderProps> = ({ children }) => {
  const [access, setAccess] = useState<UserAccess | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Guard against concurrent fetches triggered by rapid auth state changes.
  const fetchInProgressRef = useRef(false);

  // ------------------------------------------------------------------
  // Core fetch
  // ------------------------------------------------------------------

  const fetchAccess = useCallback(async () => {
    if (fetchInProgressRef.current) return;
    fetchInProgressRef.current = true;

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setAccess(null);
        return;
      }

      // 1. Fetch active roles for this user.
      const { data: userRolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select(
          `
          role_id,
          tenant_id,
          is_active,
          roles!inner(name)
        `
        )
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (rolesError) {
        if (rolesError.code === '42501') {
          // RLS denied — user has no roles yet (e.g. during invite flow).
          setAccess(null);
          return;
        }
        console.error('[AccessContext] Failed to fetch roles:', rolesError.message);
        setAccess(null);
        return;
      }

      const roles: RoleName[] = (userRolesData ?? [])
        .map((ur: any) => ur.roles?.name as RoleName)
        .filter((r: RoleName | undefined) => !!r);

      // 2. Derive tenant_id from the first active role entry.
      //    super_admin may have no tenant_id — that is correct.
      const tenantId: string | null =
        (userRolesData ?? []).find((ur: any) => ur.tenant_id)?.tenant_id ?? null;

      // 3. Fetch project memberships.
      const { data: projectMemberships } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', user.id)
        .eq('status', 'active');

      const projectIds: string[] = (projectMemberships ?? []).map(
        (pm: any) => pm.project_id as string
      );

      // 4. Compute derived values from the RBAC matrix.
      const permissions = computePermissions(roles);
      const highestRole = getHighestRole(roles);

      const newAccess: UserAccess = {
        userId: user.id,
        tenantId,
        roles,
        permissions,
        projectIds,
        highestRole,
        isSuperAdmin: roles.includes('super_admin'),
        isTenantAdmin: roles.includes('tenant_admin'),
      };

      setAccess(newAccess);
    } catch (err) {
      console.error('[AccessContext] Unexpected error:', err);
      setAccess(null);
    } finally {
      setIsLoading(false);
      fetchInProgressRef.current = false;
    }
  }, []);

  // ------------------------------------------------------------------
  // Auth state subscription
  // ------------------------------------------------------------------

  useEffect(() => {
    // Initial load.
    fetchAccess();

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      // TOKEN_REFRESHED est exclu : il se déclenche toutes les heures et ne
      // nécessite pas de re-fetcher les rôles (ils n'ont pas changé).
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        setIsLoading(true);
        fetchAccess();
      } else if (event === 'SIGNED_OUT') {
        setAccess(null);
        setIsLoading(false);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [fetchAccess]);

  // ------------------------------------------------------------------
  // Stable helper functions (referentially stable — safe in dependency arrays)
  // ------------------------------------------------------------------

  const hasPermissionFn = useCallback(
    (permission: Permission): boolean => {
      if (!access) return false;
      return checkPermission(access.permissions, permission);
    },
    [access]
  );

  const hasRoleFn = useCallback(
    (role: RoleName): boolean => {
      if (!access) return false;
      return access.roles.includes(role);
    },
    [access]
  );

  const hasMinimumRoleFn = useCallback(
    (role: RoleName): boolean => {
      if (!access) return false;
      return hasMinimumRole(access.roles, role);
    },
    [access]
  );

  const canAccessFn = useCallback(
    (feature: AppFeature): boolean => {
      if (!access) return false;
      const requiredPermission = FEATURE_PERMISSIONS[feature];
      return checkPermission(access.permissions, requiredPermission);
    },
    [access]
  );

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await fetchAccess();
  }, [fetchAccess]);

  // ------------------------------------------------------------------
  // Memoized context value — only re-creates when access or isLoading changes.
  // ------------------------------------------------------------------

  const value = useMemo<AccessContextValue>(
    () => ({
      access,
      isLoading,
      hasPermission: hasPermissionFn,
      hasRole: hasRoleFn,
      hasMinimumRole: hasMinimumRoleFn,
      canAccess: canAccessFn,
      refresh,
    }),
    [
      access,
      isLoading,
      hasPermissionFn,
      hasRoleFn,
      hasMinimumRoleFn,
      canAccessFn,
      refresh,
    ]
  );

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
};

// ---------------------------------------------------------------------------
// Raw context consumer — prefer the specialised hooks in useAccess.ts
// ---------------------------------------------------------------------------

export function useAccessContext(): AccessContextValue {
  const ctx = useContext(AccessContext);
  if (!ctx) {
    throw new Error(
      'useAccessContext must be used inside <AccessProvider>. ' +
        'Ensure AccessProvider wraps your authenticated application tree.'
    );
  }
  return ctx;
}
