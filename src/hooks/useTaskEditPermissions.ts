import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { useUserRoles } from '@/hooks/useUserRoles';
import { type Task } from '@/hooks/optimized';

/**
 * 🔒 MATRICE DE PERMISSIONS - ÉDITION INLINE DES TÂCHES
 *
 * Basée sur les best practices de Monday.com, Asana, ClickUp :
 *
 * ┌─────────────────────┬──────────┬──────────┬───────────┬──────────┬──────────┐
 * │ Rôle                │ Créer    │ Modifier │ Supprimer │ Assigner │ Voir     │
 * ├─────────────────────┼──────────┼──────────┼───────────┼──────────┼──────────┤
 * │ Super Admin         │ ✅ Tout  │ ✅ Tout  │ ✅ Tout   │ ✅ Tout  │ ✅ Tout  │
 * │ Tenant Owner        │ ✅ Tout  │ ✅ Tout  │ ✅ Tout   │ ✅ Tout  │ ✅ Tout  │
 * │ Admin               │ ✅ Tout  │ ✅ Tout  │ ✅ Tout   │ ✅ Tout  │ ✅ Tout  │
 * │ Project Manager     │ ✅ Projet│ ✅ Projet│ ✅ Projet │ ✅ Projet│ ✅ Projet│
 * │ Team Lead           │ ✅ Équipe│ ✅ Équipe│ ❌ Non    │ ✅ Équipe│ ✅ Équipe│
 * │ Employee/Collab     │ ✅ Soi   │ ✅ Soi   │ ❌ Non    │ ❌ Non   │ ✅ Soi   │
 * │ Viewer/Intern       │ ❌ Non   │ ❌ Non   │ ❌ Non    │ ❌ Non   │ ✅ Soi   │
 * └─────────────────────┴──────────┴──────────┴───────────┴──────────┴──────────┘
 *
 * Règles spéciales :
 * - Le créateur peut toujours modifier sa propre tâche
 * - L'assignee peut modifier les champs de statut/progression
 * - Les dates ne peuvent être modifiées que par PM+ ou créateur
 * - La priorité ne peut être changée que par PM+
 */

export interface TaskEditPermissions {
  // Permissions globales
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canAssign: boolean;
  canView: boolean;

  // Permissions par champ (pour édition inline)
  canEditTitle: boolean;
  canEditDates: boolean;
  canEditPriority: boolean;
  canEditStatus: boolean;
  canEditAssignee: boolean;
  canEditEffort: boolean;
  canEditDescription: boolean;

  // Métadonnées
  reason?: string;
  role?: string;
}

interface UseTaskEditPermissionsProps {
  task?: Task | null;
  taskId?: string;
}

export function useTaskEditPermissions({ task, taskId }: UseTaskEditPermissionsProps = {}) {
  const { profile } = useAuth();
  const { currentTenant } = useTenant();
  const { userRoles, isSuperAdmin, isTenantAdmin, isProjectManager, isLoading } = useUserRoles();

  const [permissions, setPermissions] = useState<TaskEditPermissions>({
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canAssign: false,
    canView: false,
    canEditTitle: false,
    canEditDates: false,
    canEditPriority: false,
    canEditStatus: false,
    canEditAssignee: false,
    canEditEffort: false,
    canEditDescription: false,
  });

  // Récupérer le rôle principal de l'utilisateur
  const userRole = useMemo(() => {
    if (!profile) return 'viewer';

    // 🔒 DÉTECTION SUPER ADMIN : tenant_id special ou flag isSuperAdmin
    const superAdminTenantId = '00000000-0000-0000-0000-000000000000';
    if (profile.tenantId === superAdminTenantId || profile.isSuperAdmin || isSuperAdmin) {
      return 'super_admin';
    }

    if (isLoading || !userRoles || userRoles.length === 0) return 'viewer';

    // Prioriser les rôles par ordre d'importance
    if (isTenantAdmin) return 'tenant_admin';
    if (isProjectManager) return 'project_manager';

    // Sinon prendre le premier rôle
    const primaryRole = userRoles[0]?.roles?.name || 'viewer';
    return primaryRole;
  }, [profile, userRoles, isSuperAdmin, isTenantAdmin, isProjectManager, isLoading]);

  useEffect(() => {
    if (!profile) {
      setPermissions({
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canAssign: false,
        canView: false,
        canEditTitle: false,
        canEditDates: false,
        canEditPriority: false,
        canEditStatus: false,
        canEditAssignee: false,
        canEditEffort: false,
        canEditDescription: false,
        reason: 'Non authentifié',
      });
      return;
    }

    const isCreator = task?.created_by === profile.userId;
    const isAssignee =
      task?.assigned_to === profile.userId ||
      task?.assignee_id === profile.userId ||
      (typeof task?.assignee === 'object' && (task?.assignee as any)?.id === profile.userId);

    // 🔓 Super Admin - Accès total
    if (userRole === 'super_admin') {
      setPermissions({
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canAssign: true,
        canView: true,
        canEditTitle: true,
        canEditDates: true,
        canEditPriority: true,
        canEditStatus: true,
        canEditAssignee: true,
        canEditEffort: true,
        canEditDescription: true,
        role: 'super_admin',
      });
      return;
    }

    // 🔓 Tenant Owner / Admin - Accès total au tenant
    if (['tenant_owner', 'admin', 'tenant_admin'].includes(userRole)) {
      setPermissions({
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canAssign: true,
        canView: true,
        canEditTitle: true,
        canEditDates: true,
        canEditPriority: true,
        canEditStatus: true,
        canEditAssignee: true,
        canEditEffort: true,
        canEditDescription: true,
        role: userRole,
      });
      return;
    }

    // 📁 Project Manager - Accès sur ses projets
    // Fallback conservateur : créateur de la tâche ou assigné (project_members non encore implémenté)
    if (userRole === 'project_manager') {
      const canManage = isCreator || isAssignee;

      setPermissions({
        canCreate: true,
        canEdit: canManage,
        canDelete: canManage,
        canAssign: canManage,
        canView: true,
        canEditTitle: canManage,
        canEditDates: canManage,
        canEditPriority: canManage,
        canEditStatus: canManage,
        canEditAssignee: canManage,
        canEditEffort: canManage,
        canEditDescription: canManage,
        role: 'project_manager',
        reason: !canManage ? 'Pas créateur ni assigné à cette tâche' : undefined,
      });
      return;
    }

    // 👥 Team Lead - Créateur ou assigné à la tâche
    if (userRole === 'team_lead') {
      const isTeamTask = isCreator || isAssignee;

      setPermissions({
        canCreate: true,
        canEdit: isTeamTask,
        canDelete: false, // Team Lead ne peut pas supprimer
        canAssign: isTeamTask,
        canView: true,
        canEditTitle: isTeamTask,
        canEditDates: isTeamTask,
        canEditPriority: false, // Seul PM+ peut changer priorité
        canEditStatus: isTeamTask,
        canEditAssignee: isTeamTask,
        canEditEffort: isTeamTask,
        canEditDescription: isTeamTask,
        role: 'team_lead',
        reason: !isTeamTask ? 'Pas créateur ni assigné à cette tâche' : undefined,
      });
      return;
    }

    // 👤 Employee / Collaborator - Accès limité
    if (['employee', 'collaborator'].includes(userRole)) {
      setPermissions({
        canCreate: true,
        canEdit: isCreator || isAssignee,
        canDelete: false,
        canAssign: false,
        canView: isCreator || isAssignee,
        canEditTitle: isCreator,
        canEditDates: false, // Ne peut pas changer les dates
        canEditPriority: false, // Ne peut pas changer la priorité
        canEditStatus: isAssignee, // L'assignee peut changer le statut
        canEditAssignee: false,
        canEditEffort: isCreator,
        canEditDescription: isCreator || isAssignee,
        role: userRole,
        reason: !isCreator && !isAssignee ? 'Tâche non assignée à vous' : undefined,
      });
      return;
    }

    // 👁️ Viewer / Intern - Lecture seule
    setPermissions({
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canAssign: false,
      canView: isCreator || isAssignee,
      canEditTitle: false,
      canEditDates: false,
      canEditPriority: false,
      canEditStatus: false,
      canEditAssignee: false,
      canEditEffort: false,
      canEditDescription: false,
      role: userRole,
      reason: 'Accès en lecture seule',
    });
  }, [profile, userRole, task, taskId, isLoading]);

  return permissions;
}

/**
 * Hook simplifié pour vérifier rapidement si un champ est éditable
 */
export function useCanEditTaskField(task: Task | null, field: keyof TaskEditPermissions): boolean {
  const permissions = useTaskEditPermissions({ task });
  return (permissions[field] as boolean) || false;
}
