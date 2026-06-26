/**
 * RBAC — Permission matrix (single source of truth)
 *
 * ROLE_PERMISSIONS defines exactly what each role can do.
 * computePermissions() derives the flat union for a user who holds multiple roles.
 * hasPermission() is the canonical boolean check — NEVER use || true.
 *
 * Design note: permissions are additive (union across roles). There is no deny
 * override — that complexity is not needed for this application and RLS handles
 * true data-layer enforcement.
 */

import { PERMISSIONS, Permission, RoleName } from './types';
import { AppFeature } from './types';

// ---------------------------------------------------------------------------
// Permission matrix
// ---------------------------------------------------------------------------

export const ROLE_PERMISSIONS: Record<RoleName, readonly Permission[]> = {
  super_admin: PERMISSIONS, // wildcard — all permissions

  tenant_admin: [
    'tenant:manage',
    'users:manage',
    'roles:assign',
    'hr:read',
    'hr:write',
    'hr:manage',
    'employees:read',
    'employees:write',
    'leave_requests:read',
    'leave_requests:write',
    'leave_requests:approve',
    'payroll:read',
    'payroll:write',
    'expense_reports:read',
    'expense_reports:write',
    'expense_reports:approve',
    'timesheets:read',
    'timesheets:write',
    'timesheets:approve',
    'trainings:read',
    'trainings:write',
    'projects:read',
    'projects:write',
    'projects:manage',
    'tasks:read',
    'tasks:write',
    'tasks:manage',
    'tasks:assign',
    'analytics:read',
    'settings:read',
    'settings:write',
    'notifications:read',
    'own:read',
    'own:write',
  ],

  hr_manager: [
    'hr:read',
    'hr:write',
    'hr:manage',
    'employees:read',
    'employees:write',
    'leave_requests:read',
    'leave_requests:write',
    'leave_requests:approve',
    'payroll:read',
    'payroll:write',
    'expense_reports:read',
    'expense_reports:write',
    'expense_reports:approve',
    'timesheets:read',
    'timesheets:write',
    'timesheets:approve',
    'trainings:read',
    'trainings:write',
    'projects:read',
    'tasks:read',
    'analytics:read',
    'settings:read',
    'notifications:read',
    'own:read',
    'own:write',
  ],

  project_manager: [
    'projects:read',
    'projects:write',
    'projects:manage',
    'tasks:read',
    'tasks:write',
    'tasks:manage',
    'tasks:assign',
    'employees:read',
    'expense_reports:read',
    'expense_reports:write',
    'timesheets:read',
    'trainings:read',
    'analytics:read',
    'settings:read',
    'notifications:read',
    'own:read',
    'own:write',
  ],

  team_lead: [
    'projects:read',
    'tasks:read',
    'tasks:write',
    'tasks:assign',
    'employees:read',
    'expense_reports:read',
    'expense_reports:write',
    'timesheets:read',
    'trainings:read',
    'settings:read',
    'notifications:read',
    'own:read',
    'own:write',
  ],

  employee: [
    'projects:read',
    'tasks:read',
    'tasks:write',
    'leave_requests:read',
    'leave_requests:write',
    'expense_reports:read',
    'expense_reports:write',
    'timesheets:read',
    'timesheets:write',
    'trainings:read',
    'settings:read',
    'notifications:read',
    'own:read',
    'own:write',
  ],

  contractor: [
    'projects:read',
    'tasks:read',
    'tasks:write',
    'leave_requests:read',
    'leave_requests:write',
    'expense_reports:read',
    'expense_reports:write',
    'timesheets:read',
    'timesheets:write',
    'settings:read',
    'notifications:read',
    'own:read',
    'own:write',
  ],

  intern: [
    'projects:read',
    'tasks:read',
    'leave_requests:read',
    'trainings:read',
    'settings:read',
    'notifications:read',
    'own:read',
  ],

  viewer: [
    'projects:read',
    'tasks:read',
    'notifications:read',
    'own:read',
  ],
};

// ---------------------------------------------------------------------------
// Feature → permission/role mapping
// ---------------------------------------------------------------------------

/**
 * Maps each AppFeature to the Permission required to access it.
 * Used by AccessContext.canAccess() and ProtectedRoute / PermissionGate.
 */
export const FEATURE_PERMISSIONS: Record<AppFeature, Permission> = {
  dashboard: 'own:read',
  hr_page: 'hr:read',
  hr_employees: 'employees:read',
  hr_leave: 'leave_requests:read',
  hr_payroll: 'payroll:read',
  hr_expenses: 'expense_reports:read',
  hr_timesheets: 'timesheets:read',
  hr_trainings: 'trainings:read',
  hr_approvals: 'leave_requests:approve',
  projects: 'projects:read',
  tasks: 'tasks:read',
  calendar: 'tasks:read',
  operations: 'projects:read',
  analytics: 'analytics:read',
  settings: 'settings:read',
  inbox: 'notifications:read',
  super_admin: 'system:*',
};

// ---------------------------------------------------------------------------
// Runtime helpers
// ---------------------------------------------------------------------------

/**
 * Derives the flat union of permissions for a user who holds multiple roles.
 * super_admin short-circuits to all permissions.
 */
export function computePermissions(roles: RoleName[]): Permission[] {
  if (roles.includes('super_admin')) {
    return [...PERMISSIONS] as Permission[];
  }

  const set = new Set<Permission>();
  for (const role of roles) {
    for (const perm of ROLE_PERMISSIONS[role] ?? []) {
      set.add(perm);
    }
  }
  return [...set];
}

/**
 * Checks whether a pre-computed permissions array grants a specific permission.
 * system:* (super_admin wildcard) grants everything.
 */
export function hasPermission(permissions: Permission[], permission: Permission): boolean {
  if (permissions.includes('system:*')) return true;
  return permissions.includes(permission);
}
