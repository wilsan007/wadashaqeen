/**
 * RBAC — Types canoniques (source de vérité unique)
 *
 * Toutes les autres références à RoleName, Permission, etc.
 * doivent importer depuis ce fichier ou depuis @/lib/rbac.
 */

// ---------------------------------------------------------------------------
// Rôles
// ---------------------------------------------------------------------------

export const ROLES = [
  'super_admin',
  'tenant_admin',
  'hr_manager',
  'project_manager',
  'team_lead',
  'employee',
  'contractor',
  'intern',
  'viewer',
] as const;

export type RoleName = (typeof ROLES)[number];

// ---------------------------------------------------------------------------
// Permissions
// ---------------------------------------------------------------------------

export const PERMISSIONS = [
  // Super Admin
  'system:*',

  // Tenant Admin
  'tenant:manage',
  'users:manage',
  'roles:assign',

  // HR
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

  // Projects & Tasks
  'projects:read',
  'projects:write',
  'projects:manage',
  'tasks:read',
  'tasks:write',
  'tasks:manage',
  'tasks:assign',

  // Analytics & Settings
  'analytics:read',
  'settings:read',
  'settings:write',
  'notifications:read',

  // Self-service (available to all authenticated roles)
  'own:read',
  'own:write',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

// ---------------------------------------------------------------------------
// Resource types — used for data-layer filtering
// ---------------------------------------------------------------------------

export type ResourceType =
  | 'tasks'
  | 'projects'
  | 'employees'
  | 'leave_requests'
  | 'expense_reports'
  | 'expense_items'
  | 'expense_categories'
  | 'timesheets'
  | 'payroll'
  | 'payroll_runs'
  | 'payroll_items'
  | 'trainings'
  | 'training_enrollments'
  | 'development_plans'
  | 'skills'
  | 'employee_skills'
  | 'skill_certifications'
  | 'skill_assessments'
  | 'absence_justifications'
  | 'administrative_requests'
  | 'remote_work_requests'
  | 'attendances'
  | 'absence_types'
  | 'work_locations'
  | 'performance_reviews'
  | 'performance_goals'
  | 'health_safety_incidents'
  | 'onboarding_processes'
  | 'offboarding_processes'
  | 'onboarding_tasks'
  | 'offboarding_tasks'
  | 'operational_activities'
  | 'operational_schedules'
  | 'operational_action_templates'
  | 'operational_instances'
  | 'operational_actions'
  | 'alert_types'
  | 'alert_solutions'
  | 'alert_instances'
  | 'alert_instance_recommendations'
  | 'notifications';

// ---------------------------------------------------------------------------
// App features — used for route and UI gating
// ---------------------------------------------------------------------------

export type AppFeature =
  | 'dashboard'
  | 'hr_page'
  | 'hr_employees'
  | 'hr_leave'
  | 'hr_payroll'
  | 'hr_expenses'
  | 'hr_timesheets'
  | 'hr_trainings'
  | 'hr_approvals'
  | 'projects'
  | 'tasks'
  | 'calendar'
  | 'operations'
  | 'analytics'
  | 'settings'
  | 'inbox'
  | 'super_admin';

// ---------------------------------------------------------------------------
// Computed access object — the single runtime representation of what a user
// is allowed to do. Populated by AccessContext, consumed by useAccess().
// ---------------------------------------------------------------------------

export interface UserAccess {
  userId: string;
  tenantId: string | null;
  /** All roles held by the user (may be multiple). */
  roles: RoleName[];
  /** Flat union of all permissions derived from those roles. */
  permissions: Permission[];
  /** Project IDs where the user is an active member. */
  projectIds: string[];
  /** The single highest role in the hierarchy (null when no roles). */
  highestRole: RoleName | null;
  /** Convenience flags. */
  isSuperAdmin: boolean;
  isTenantAdmin: boolean;
}
