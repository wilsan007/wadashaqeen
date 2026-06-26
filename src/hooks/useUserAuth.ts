/**
 * 🎯 Hook d'Authentification à 3 Niveaux - Cascade Optimisée
 *
 * Niveau 1 (profiles) : Identification rapide - Toujours chargé
 * Niveau 2 (user_roles) : Vérification active - Si besoin sécurité
 * Niveau 3 (permissions) : Granulaire - Actions critiques uniquement
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RoleName, UserContext } from '@/lib/roleBasedFiltering';

// === NIVEAU 1 : Profil Basique ===
export interface UserProfile {
  userId: string;
  email: string;
  fullName: string;
  role: RoleName;
  tenantId: string | null;
  isSuperAdmin: boolean;
  jobTitle?: string;
  employeeId?: string;
}

// === NIVEAU 2 : Rôle Actif ===
export interface ActiveUserRole {
  id: string;
  roleId: string;
  roleName: RoleName;
  tenantId: string;
  isActive: boolean;
  expiresAt: string | null;
}

// === NIVEAU 3 : Permissions ===
export interface UserPermission {
  permissionName: string;
  permissionCode: string;
  resource: string;
  action: string;
}

export interface UseUserAuthOptions {
  level?: 1 | 2 | 3; // Niveau de profondeur
  includeProjectIds?: boolean; // Charger les project_ids
}

export interface UseUserAuthResult {
  // Niveau 1 (toujours disponible)
  profile: UserProfile | null;

  // Niveau 2 (si demandé)
  activeRole: ActiveUserRole | null;

  // Niveau 3 (si demandé)
  permissions: UserPermission[];

  // Contexte unifié pour le filtrage
  userContext: UserContext | null;

  // États
  loading: boolean;
  error: string | null;

  // Actions
  refresh: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

/**
 * Hook principal d'authentification à 3 niveaux
 */
export function useUserAuth(options: UseUserAuthOptions = {}): UseUserAuthResult {
  const { level = 1, includeProjectIds = false } = options;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeRole, setActiveRole] = useState<ActiveUserRole | null>(null);
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [projectIds, setProjectIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAuth = useCallback(
    async (forceRefresh = false) => {
      try {
        setLoading(true);
        setError(null);

        if (forceRefresh) {
          // Force refresh user profile
        }

        // Récupérer l'utilisateur authentifié
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          setProfile(null);
          setLoading(false);
          return;
        }

        // === NIVEAU 1 : PROFIL (profiles table) ===
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, tenant_id')
          .eq('user_id', user.id)
          .maybeSingle(); // ✅ Utiliser maybeSingle au lieu de single

        // Ignorer les erreurs 406 (RLS) et 404 silencieusement
        if (profileError && !['406', 'PGRST116'].includes(profileError.code || '')) {
          console.error('Erreur récupération profil:', profileError);
        }

        // Récupérer depuis employees (fallback) - Ignorer les erreurs silencieusement
        const { data: employeeData } = await supabase
          .from('employees')
          .select('id, full_name, job_title, tenant_id') // ✅ Retirer 'role' qui n'existe pas
          .eq('user_id', user.id)
          .maybeSingle();

        // Vérifier si l'utilisateur est super_admin via user_roles
        const { data: superAdminCheck } = await supabase
          .from('user_roles')
          .select('roles!inner(name)')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .eq('roles.name', 'super_admin')
          .maybeSingle();

        const isSuperAdmin = !!superAdminCheck;

        if (!profileData && !employeeData) {
          setProfile(null);
          setLoading(false);
          return;
        }

        const userProfile: UserProfile = {
          userId: user.id,
          email: user.email || '',
          fullName:
            profileData?.full_name || employeeData?.full_name || user.email || 'Utilisateur',
          role: 'employee', // ✅ Défaut employee, sera mis à jour par user_roles
          tenantId: profileData?.tenant_id || employeeData?.tenant_id || null,
          isSuperAdmin: isSuperAdmin,
          jobTitle: employeeData?.job_title,
          employeeId: employeeData?.id,
        };

        // 🔓 CAS SUPER ADMIN : Rôle spécial
        if (userProfile.isSuperAdmin) {
          userProfile.role = 'super_admin';
          // Note: Super Admin détecté (log retiré pour éviter pollution console)
        }

        setProfile(userProfile);

        // Si Niveau 1 uniquement, on s'arrête ici
        if (level === 1) {
          setLoading(false);
          return;
        }

        // === NIVEAU 2 : RÔLE ACTIF (user_roles table) ===
        if (level >= 2 && !userProfile.isSuperAdmin) {
          const { data: userRoleData, error: roleError } = await supabase
            .from('user_roles')
            .select('id, role_id, tenant_id, is_active, expires_at')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (userRoleData) {
            // Récupérer le nom du rôle
            const { data: roleData } = await supabase
              .from('roles')
              .select('name')
              .eq('id', userRoleData.role_id)
              .single();

            setActiveRole({
              id: userRoleData.id,
              roleId: userRoleData.role_id,
              roleName: (roleData?.name as RoleName) || userProfile.role,
              tenantId: userRoleData.tenant_id,
              isActive: userRoleData.is_active,
              expiresAt: userRoleData.expires_at,
            });

            // Mettre à jour le profil avec le rôle vérifié
            setProfile(prev =>
              prev ? { ...prev, role: (roleData?.name as RoleName) || prev.role } : null
            );
          }
        }

        // Si Niveau 2 uniquement, on s'arrête ici
        if (level === 2) {
          setLoading(false);
          return;
        }

        // === NIVEAU 3 : PERMISSIONS (role_permissions + permissions) ===
        if (level === 3 && activeRole && !userProfile.isSuperAdmin) {
          const { data: permData } = await supabase
            .from('role_permissions')
            .select(
              `
            permissions!inner(
              name,
              code,
              resource,
              action
            )
          `
            )
            .eq('role_id', activeRole.roleId);

          if (permData) {
            const perms = permData.map((rp: any) => ({
              permissionName: rp.permissions.name,
              permissionCode: rp.permissions.code,
              resource: rp.permissions.resource,
              action: rp.permissions.action,
            }));
            setPermissions(perms);
          }
        }

        // Charger les project_ids si demandé
        if (includeProjectIds && user.id) {
          // TODO: Implémenter quand la table project_members sera créée
          // const { data: projectMembers } = await supabase
          //   .from('project_members')
          //   .select('project_id')
          //   .eq('user_id', user.id)
          //   .eq('status', 'active');
          // if (projectMembers) {
          //   setProjectIds(projectMembers.map(pm => pm.project_id));
          // }
          setProjectIds([]);
        }

        setLoading(false);
      } catch (err: any) {
        console.error('Erreur useUserAuth:', err);
        setError(err.message);
        setLoading(false);
      }
    },
    [level, includeProjectIds]
  );

  useEffect(() => {
    fetchAuth();

    // 🔒 SÉCURITÉ: Listener pour gérer les changements d'auth
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      // Auth event tracking

      if (event === 'SIGNED_IN') {
        // Nouvelle connexion, refetch profil SEULEMENT si pas déjà chargé
        if (!profile || !userContext) {
          fetchAuth(true); // Force refresh
        }
      } else if (event === 'TOKEN_REFRESHED') {
        // Token rafraîchi, on peut ignorer si la session est valide
        // fetchAuth(true); // Désactivé pour éviter boucle
      } else if (event === 'SIGNED_OUT') {
        // Déconnexion, nettoyage des états
        // 🚨 NETTOYAGE IMMÉDIAT de tous les états
        setProfile(null);
        setActiveRole(null);
        setPermissions([]);
        setProjectIds([]);
        setLoading(false);
        setError(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchAuth]);

  // Créer le contexte unifié pour le filtrage
  const userContext: UserContext | null = useMemo(
    () =>
      profile
        ? {
            userId: profile.userId,
            role: profile.role,
            tenantId: profile.tenantId,
            projectIds: includeProjectIds ? projectIds : undefined,
          }
        : null,
    [profile, includeProjectIds, projectIds]
  );

  // Helper pour vérifier une permission
  const hasPermission = useCallback(
    (permission: string): boolean => {
      // Super Admin a toutes les permissions
      if (profile?.isSuperAdmin) return true;

      // Niveau 3 chargé : vérifier dans les permissions
      if (level === 3) {
        return permissions.some(
          p => p.permissionName === permission || p.permissionCode === permission
        );
      }

      // Fallback : vérifier selon le rôle
      const rolePermissions: Record<RoleName, string[]> = {
        super_admin: ['*'],
        tenant_admin: ['admin_all', 'projects_manage', 'tasks_manage', 'users_manage'],
        hr_manager: ['hr_manage', 'employees_manage', 'leave_manage'],
        project_manager: ['projects_create', 'projects_manage_own', 'tasks_manage'],
        team_lead: ['tasks_manage', 'projects_view'],
        employee: ['tasks_view_own', 'tasks_complete'],
        contractor: ['tasks_view_own', 'tasks_complete'],
        intern: ['tasks_view_own'],
        viewer: ['view_only'],
      };

      const rolePerms = rolePermissions[profile?.role || 'employee'] || [];
      return rolePerms.includes('*') || rolePerms.includes(permission);
    },
    [profile, permissions, level]
  );

  return {
    profile,
    activeRole,
    permissions,
    userContext,
    loading,
    error,
    refresh: fetchAuth,
    hasPermission,
  };
}

/**
 * Hook simplifié pour Niveau 1 uniquement (le plus rapide)
 */
export function useUserProfile() {
  return useUserAuth({ level: 1 });
}

/**
 * Hook avec vérification du rôle actif (Niveau 2)
 */
export function useUserWithRole() {
  return useUserAuth({ level: 2 });
}

/**
 * Hook avec permissions complètes (Niveau 3)
 */
export function useUserWithPermissions() {
  return useUserAuth({ level: 3 });
}

/**
 * Hook avec context complet pour filtrage (inclut projectIds)
 *
 * ⚠️ DEPRECATED: Utiliser useAuth() depuis @/contexts/AuthContext à la place
 * Ce hook est conservé pour compatibilité mais appelle toujours useUserAuth
 * ce qui cause des rendus multiples.
 *
 * Migration recommandée:
 * ```
 * // Ancien
 * const { userContext } = useUserFilterContext();
 *
 * // Nouveau
 * const { userContext } = useAuth();
 * ```
 */
export function useUserFilterContext() {
  // ⚠️ Attention: Chaque appel crée une nouvelle instance
  // Utiliser AuthProvider + useAuth() pour éviter les rendus multiples
  return useUserAuth({ level: 1, includeProjectIds: true });
}
