import { useState, useEffect, useRef, useMemo } from 'react';
import { useUserRoles } from './useUserRoles';
import { RoleNames, PermissionNames } from '@/lib/permissionsSystem';

/**
 * Hook pour gérer l'accès basé sur les rôles
 * Détermine automatiquement les permissions de l'utilisateur connecté
 */
export const useRoleBasedAccess = () => {
  // Protection anti-boucle renforcée avec cache stable
  const calculatedRef = useRef(false);
  const lastUserRolesRef = useRef<any[]>([]);
  const lastAccessRightsRef = useRef<any>(null);
  const stableUserRolesRef = useRef<any>(null);

  const {
    userRoles,
    userPermissions,
    isLoading,
    hasRole,
    hasPermission,
    isSuperAdmin,
    isTenantAdmin,
    isHRManager,
    isProjectManager,
  } = useUserRoles();

  // État initial memoizé pour éviter les re-créations
  const initialAccessRights = useMemo(
    () => ({
      // Pages principales
      canAccessDashboard: false,
      canAccessHR: false,
      canAccessProjects: false,
      canAccessTasks: false,
      canAccessSuperAdmin: false,

      // Fonctionnalités HR
      canManageEmployees: false,
      canViewReports: false,
      canManageAbsences: false,
      canViewPayroll: false,

      // Fonctionnalités Projets
      canCreateProjects: false,
      canManageProjects: false,
      canViewProjectReports: false,
      canManageProjectBudgets: false,

      // Fonctionnalités Tâches
      canCreateTasks: false,
      canAssignTasks: false,
      canManageAllTasks: false,
      canViewTaskReports: false,

      // Administration
      canManageUsers: false,
      canManageRoles: false,
      canManageTenants: false,
      canViewSystemLogs: false,

      // Notifications et alertes
      canReceiveAlerts: false,
      canManageAlerts: false,

      // Niveau d'accès général
      accessLevel: 'none' as 'none' | 'basic' | 'advanced' | 'admin' | 'super_admin',
    }),
    []
  ); // Pas de dépendances = valeur constante

  const [accessRights, setAccessRights] = useState(initialAccessRights);

  useEffect(() => {
    if (isLoading) return;

    // Protection anti-boucle STRICTE : hash stable des rôles
    const userRolesHash = userRoles
      .map(r => `${r.roles.name}-${r.tenant_id}`)
      .sort()
      .join('|');
    const lastHash =
      lastUserRolesRef.current
        ?.map(r => `${r.roles.name}-${r.tenant_id}`)
        .sort()
        .join('|') || '';

    // Si déjà calculé avec les mêmes données, ARRÊT COMPLET
    if (calculatedRef.current && userRolesHash === lastHash && lastAccessRightsRef.current) {
      // Pas de logs répétitifs - seulement si changement détecté
      return;
    }

    // Éviter les calculs redondants
    if (userRolesHash === lastHash && calculatedRef.current) {
      return;
    }

    // Marquer comme calculé AVANT le calcul pour éviter les races
    calculatedRef.current = true;
    lastUserRolesRef.current = [...userRoles];

    // // console.log('🔄 Calculating access rights for user roles:', userRoles.length);

    // Déterminer les droits d'accès basés sur les rôles
    const newAccessRights = {
      // Pages principales
      canAccessDashboard: userRoles.length > 0,
      canAccessHR: isHRManager() || isTenantAdmin() || isSuperAdmin(),
      canAccessProjects: userRoles.length > 0,
      canAccessTasks: userRoles.length > 0,
      canAccessSuperAdmin: isSuperAdmin(),

      // Fonctionnalités HR
      canManageEmployees:
        hasPermission(PermissionNames.MANAGE_USERS) ||
        isHRManager() ||
        isTenantAdmin() ||
        isSuperAdmin(),
      canViewReports:
        hasPermission(PermissionNames.VIEW_REPORTS) ||
        isHRManager() ||
        isTenantAdmin() ||
        isSuperAdmin(),
      canManageAbsences: isHRManager() || isTenantAdmin() || isSuperAdmin(),
      canViewPayroll: isHRManager() || isTenantAdmin() || isSuperAdmin(),

      // Fonctionnalités Projets
      canCreateProjects:
        hasPermission(PermissionNames.MANAGE_PROJECTS) ||
        isProjectManager() ||
        isTenantAdmin() ||
        isSuperAdmin(),
      canManageProjects:
        hasPermission(PermissionNames.MANAGE_PROJECTS) ||
        isProjectManager() ||
        isTenantAdmin() ||
        isSuperAdmin(),
      canViewProjectReports:
        hasPermission(PermissionNames.VIEW_REPORTS) ||
        isProjectManager() ||
        isTenantAdmin() ||
        isSuperAdmin(),
      canManageProjectBudgets: isTenantAdmin() || isSuperAdmin(),

      // Fonctionnalités Tâches
      canCreateTasks: hasPermission(PermissionNames.MANAGE_TASKS) ||
        isProjectManager() || isTenantAdmin() || isSuperAdmin() ||
        (userRoles.length > 0 && !userRoles.every(r => ['intern', 'viewer'].includes(r.roles.name))),
      canAssignTasks:
        hasPermission(PermissionNames.MANAGE_TASKS) ||
        isProjectManager() ||
        isTenantAdmin() ||
        isSuperAdmin(),
      canManageAllTasks:
        hasPermission(PermissionNames.MANAGE_TASKS) ||
        isProjectManager() ||
        isTenantAdmin() ||
        isSuperAdmin(),
      canViewTaskReports:
        hasPermission(PermissionNames.VIEW_REPORTS) ||
        isProjectManager() ||
        isTenantAdmin() ||
        isSuperAdmin(),

      // Administration
      canManageUsers:
        hasPermission(PermissionNames.MANAGE_USERS) || isTenantAdmin() || isSuperAdmin(),
      canManageRoles: isSuperAdmin(), // Seuls les super admins peuvent gérer les rôles
      canManageTenants: hasPermission(PermissionNames.CREATE_TENANT) || isSuperAdmin(),
      canViewSystemLogs: isSuperAdmin(),

      // Notifications et alertes
      canReceiveAlerts: true, // Tous les utilisateurs connectés
      canManageAlerts: isProjectManager() || isTenantAdmin() || isSuperAdmin(),

      // Niveau d'accès général
      accessLevel: isSuperAdmin()
        ? ('super_admin' as const)
        : isTenantAdmin()
          ? ('admin' as const)
          : isHRManager() || isProjectManager()
            ? ('advanced' as const)
            : userRoles.length > 0
              ? ('basic' as const)
              : ('none' as const),
    };

    // Mettre en cache les nouveaux droits d'accès
    lastAccessRightsRef.current = newAccessRights;
    setAccessRights(newAccessRights);
  }, [
    userRoles,
    userPermissions,
    isLoading,
    hasRole,
    hasPermission,
    isSuperAdmin,
    isTenantAdmin,
    isHRManager,
    isProjectManager,
  ]);

  // Fonctions utilitaires pour vérifier l'accès
  const canAccess = (feature: keyof typeof accessRights): boolean => {
    return accessRights[feature] as boolean;
  };

  const getAccessLevel = () => accessRights.accessLevel;

  const getUserRoleNames = () => userRoles.map(role => role.roles.name);

  const getUserPermissionNames = () => userPermissions.map(perm => perm.permission_name);

  // Fonction pour obtenir les restrictions d'accès
  const getAccessRestrictions = () => {
    const restrictions = [];

    if (!accessRights.canAccessHR) {
      restrictions.push('Accès RH restreint');
    }
    if (!accessRights.canManageUsers) {
      restrictions.push('Gestion des utilisateurs non autorisée');
    }
    if (!accessRights.canManageProjects) {
      restrictions.push('Gestion des projets limitée');
    }
    if (!accessRights.canManageAllTasks) {
      restrictions.push('Gestion des tâches limitée');
    }

    return restrictions;
  };

  // Fonction pour obtenir les fonctionnalités disponibles
  const getAvailableFeatures = () => {
    const features = [];

    if (accessRights.canAccessDashboard) features.push('Tableau de bord');
    if (accessRights.canAccessHR) features.push('Ressources Humaines');
    if (accessRights.canAccessProjects) features.push('Gestion de Projets');
    if (accessRights.canAccessTasks) features.push('Gestion des Tâches');
    if (accessRights.canAccessSuperAdmin) features.push('Administration Système');

    return features;
  };

  // Memoizer les valeurs booléennes pour éviter les re-renders
  const memoizedValues = useMemo(
    () => ({
      isSuperAdmin: isSuperAdmin(),
      isTenantAdmin: isTenantAdmin(),
      isHRManager: isHRManager(),
      isProjectManager: isProjectManager(),
    }),
    [isSuperAdmin, isTenantAdmin, isHRManager, isProjectManager]
  );

  return {
    // États
    accessRights,
    isLoading,
    userRoles,
    userPermissions,

    // Fonctions de vérification
    canAccess,
    hasRole,
    hasPermission,

    // Informations sur les rôles (memoizées)
    ...memoizedValues,

    // Utilitaires
    getAccessLevel,
    getUserRoleNames,
    getUserPermissionNames,
    getAccessRestrictions,
    getAvailableFeatures,
  };
};
