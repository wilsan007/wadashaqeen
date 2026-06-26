/**
 * RBAC — Supabase query filters
 *
 * Security contract:
 * - NO raw SQL subqueries in .or() or .filter() calls (injection risk).
 * - Use only PostgREST-safe methods: .eq(), .in(), .or() with column.eq / column.in literals only.
 * - When a manager scope needs team members, pre-fetch the employee ID list at the hook layer
 *   and pass it in via UserAccess.managedEmployeeIds (see notes below).
 *
 * These filters provide UX-level data scoping. True authorization is enforced by
 * Supabase Row Level Security policies.
 */

import { UserAccess, ResourceType, RoleName } from './types';

/** A UUID that can never match a real row — used to produce empty result sets. */
const EMPTY_UUID = '00000000-0000-0000-0000-000000000000';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function isAdminRole(role: RoleName | null): boolean {
  return role === 'super_admin' || role === 'tenant_admin';
}

function isHRRole(role: RoleName | null): boolean {
  return role === 'hr_manager' || isAdminRole(role);
}

function isManagerRole(role: RoleName | null): boolean {
  return role === 'project_manager' || role === 'team_lead' || isHRRole(role);
}

// ---------------------------------------------------------------------------
// Per-resource filter builders
// ---------------------------------------------------------------------------

function filterTasks(query: any, ctx: UserAccess): any {
  const { userId, projectIds, highestRole: role } = ctx;

  if (isAdminRole(role) || role === 'hr_manager') return query;

  if (role === 'project_manager') {
    if (projectIds.length > 0) {
      // Safe PostgREST .or() using only column references — no SQL subqueries.
      return query.or(`assignee_id.eq.${userId},project_id.in.(${projectIds.join(',')})`);
    }
    return query.eq('assignee_id', userId);
  }

  if (role === 'team_lead') {
    if (projectIds.length > 0) {
      return query.in('project_id', projectIds);
    }
    return query.eq('assignee_id', userId);
  }

  // employee, contractor, intern, viewer
  return query.eq('assignee_id', userId);
}

function filterProjects(query: any, ctx: UserAccess): any {
  const { projectIds, highestRole: role } = ctx;

  if (isAdminRole(role) || role === 'hr_manager' || role === 'project_manager') return query;

  if (projectIds.length > 0) {
    return query.in('id', projectIds);
  }
  return query.eq('id', EMPTY_UUID);
}

function filterEmployees(query: any, ctx: UserAccess): any {
  const { highestRole: role } = ctx;

  // HR, admins, and managers need to see all tenant employees (for filters/assignment UIs).
  if (isHRRole(role) || isManagerRole(role)) return query;

  // Employee sees all (for selection dropdowns, but real data protection is in RLS).
  return query;
}

function filterLeaveRequests(query: any, ctx: UserAccess): any {
  const { userId, highestRole: role } = ctx;

  if (isHRRole(role)) return query;
  // All other roles only see their own leave requests.
  return query.eq('employee_id', userId);
}

function filterExpenseReports(query: any, ctx: UserAccess, managedEmployeeIds: string[]): any {
  const { userId, highestRole: role } = ctx;

  if (isHRRole(role)) return query;

  if (isManagerRole(role) && managedEmployeeIds.length > 0) {
    // Safe: uses .in() with a pre-fetched ID array, not a SQL subquery.
    return query.or(`employee_id.eq.${userId},employee_id.in.(${managedEmployeeIds.join(',')})`);
  }

  return query.eq('employee_id', userId);
}

function filterTimesheets(query: any, ctx: UserAccess, managedEmployeeIds: string[]): any {
  const { userId, highestRole: role } = ctx;

  if (isHRRole(role)) return query;

  if (isManagerRole(role) && managedEmployeeIds.length > 0) {
    return query.or(`employee_id.eq.${userId},employee_id.in.(${managedEmployeeIds.join(',')})`);
  }

  return query.eq('employee_id', userId);
}

function filterTrainingEnrollments(
  query: any,
  ctx: UserAccess,
  managedEmployeeIds: string[]
): any {
  const { userId, highestRole: role } = ctx;

  if (isHRRole(role)) return query;

  if (isManagerRole(role) && managedEmployeeIds.length > 0) {
    return query.or(`employee_id.eq.${userId},employee_id.in.(${managedEmployeeIds.join(',')})`);
  }

  return query.eq('employee_id', userId);
}

function filterDevelopmentPlans(query: any, ctx: UserAccess): any {
  const { userId, highestRole: role } = ctx;

  if (isHRRole(role)) return query;

  if (isManagerRole(role)) {
    return query.or(`employee_id.eq.${userId},created_by.eq.${userId}`);
  }

  return query.eq('employee_id', userId);
}

function filterPayrollRuns(query: any, ctx: UserAccess): any {
  const { highestRole: role } = ctx;
  if (isHRRole(role)) return query;
  // No other role has access to payroll runs.
  return query.eq('id', EMPTY_UUID);
}

function filterPayrollItems(query: any, ctx: UserAccess): any {
  const { userId, highestRole: role } = ctx;
  if (isHRRole(role)) return query;
  return query.eq('employee_id', userId);
}

function filterPerformanceReviews(query: any, ctx: UserAccess, managedEmployeeIds: string[]): any {
  const { userId, highestRole: role } = ctx;

  if (isHRRole(role)) return query;

  if (isManagerRole(role) && managedEmployeeIds.length > 0) {
    return query.or(
      `employee_id.eq.${userId},reviewer_id.eq.${userId},employee_id.in.(${managedEmployeeIds.join(',')})`
    );
  }

  return query.eq('employee_id', userId);
}

function filterPerformanceGoals(query: any, ctx: UserAccess, managedEmployeeIds: string[]): any {
  const { userId, highestRole: role } = ctx;

  if (isHRRole(role)) return query;

  if (isManagerRole(role) && managedEmployeeIds.length > 0) {
    return query.or(`employee_id.eq.${userId},employee_id.in.(${managedEmployeeIds.join(',')})`);
  }

  return query.eq('employee_id', userId);
}

function filterSkillAssessments(query: any, ctx: UserAccess, managedEmployeeIds: string[]): any {
  const { userId, highestRole: role } = ctx;

  if (isHRRole(role)) return query;

  if (isManagerRole(role) && managedEmployeeIds.length > 0) {
    return query.or(`employee_id.eq.${userId},employee_id.in.(${managedEmployeeIds.join(',')})`);
  }

  return query.eq('employee_id', userId);
}

function filterOnboardingOffboarding(
  query: any,
  ctx: UserAccess,
  managedEmployeeIds: string[]
): any {
  const { userId, highestRole: role } = ctx;

  if (isHRRole(role)) return query;

  if (isManagerRole(role) && managedEmployeeIds.length > 0) {
    return query.or(`employee_id.eq.${userId},employee_id.in.(${managedEmployeeIds.join(',')})`);
  }

  return query.eq('employee_id', userId);
}

function filterOperationalInstances(query: any, ctx: UserAccess): any {
  const { userId, highestRole: role } = ctx;
  if (isManagerRole(role)) return query;
  return query.eq('assigned_to_id', userId);
}

function filterAlertInstances(query: any, ctx: UserAccess, managedEmployeeIds: string[]): any {
  const { userId, highestRole: role } = ctx;

  if (isHRRole(role)) return query;

  if (isManagerRole(role) && managedEmployeeIds.length > 0) {
    return query.or(
      `resolved_by.eq.${userId},entity_id.in.(${managedEmployeeIds.join(',')})`
    );
  }

  return query.eq('entity_id', userId);
}

function filterExpenseItems(query: any, ctx: UserAccess, managedEmployeeIds: string[]): any {
  const { userId, highestRole: role } = ctx;

  if (isHRRole(role)) return query;

  if (isManagerRole(role) && managedEmployeeIds.length > 0) {
    return query.or(`employee_id.eq.${userId},employee_id.in.(${managedEmployeeIds.join(',')})`);
  }

  return query.eq('employee_id', userId);
}

function filterHealthSafetyIncidents(
  query: any,
  ctx: UserAccess,
  managedEmployeeIds: string[]
): any {
  const { userId, highestRole: role } = ctx;

  if (isHRRole(role)) return query;

  if (isManagerRole(role) && managedEmployeeIds.length > 0) {
    return query.or(
      `reported_by.eq.${userId},employee_id.in.(${managedEmployeeIds.join(',')})`
    );
  }

  return query.eq('reported_by', userId);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Options bag for applyRoleFilters(). managedEmployeeIds must be pre-fetched
 * (via a separate query for `employees where manager_id = userId`) before
 * calling this function. Never compute them with SQL subqueries inside .or().
 */
export interface FilterContext {
  access: UserAccess;
  /** Pre-fetched IDs of employees managed by the current user. */
  managedEmployeeIds?: string[];
}

/**
 * Applies the appropriate PostgREST filters to a Supabase query builder
 * based on the user's access rights and the target resource.
 *
 * Usage:
 *   const query = supabase.from('tasks').select('*');
 *   return applyRoleFilters(query, { access }, 'tasks');
 */
export function applyRoleFilters(
  query: any,
  { access, managedEmployeeIds = [] }: FilterContext,
  resource: ResourceType
): any {
  // super_admin sees everything cross-tenant.
  if (access.isSuperAdmin) return query;

  // Block access if no tenant context.
  if (!access.tenantId) {
    return query.eq('id', EMPTY_UUID);
  }

  // All non-super_admin queries are scoped to the user's tenant first.
  // (Resources without a tenant_id column handle it themselves below.)
  const scopedQuery = query.eq('tenant_id', access.tenantId);

  switch (resource) {
    case 'tasks':
      return filterTasks(scopedQuery, access);

    case 'projects':
      return filterProjects(scopedQuery, access);

    case 'employees':
      return filterEmployees(scopedQuery, access);

    case 'leave_requests':
      return filterLeaveRequests(scopedQuery, access);

    case 'expense_reports':
      return filterExpenseReports(scopedQuery, access, managedEmployeeIds);

    case 'expense_items':
      return filterExpenseItems(scopedQuery, access, managedEmployeeIds);

    case 'timesheets':
      return filterTimesheets(scopedQuery, access, managedEmployeeIds);

    case 'training_enrollments':
      return filterTrainingEnrollments(scopedQuery, access, managedEmployeeIds);

    case 'development_plans':
      return filterDevelopmentPlans(scopedQuery, access);

    case 'payroll_runs':
      return filterPayrollRuns(scopedQuery, access);

    case 'payroll_items':
      return filterPayrollItems(scopedQuery, access);

    case 'performance_reviews':
      return filterPerformanceReviews(scopedQuery, access, managedEmployeeIds);

    case 'performance_goals':
      return filterPerformanceGoals(scopedQuery, access, managedEmployeeIds);

    case 'skill_assessments':
      return filterSkillAssessments(scopedQuery, access, managedEmployeeIds);

    case 'onboarding_processes':
    case 'offboarding_processes':
      return filterOnboardingOffboarding(scopedQuery, access, managedEmployeeIds);

    case 'operational_instances':
    case 'operational_actions':
      return filterOperationalInstances(scopedQuery, access);

    case 'alert_instances':
      return filterAlertInstances(scopedQuery, access, managedEmployeeIds);

    case 'health_safety_incidents':
      return filterHealthSafetyIncidents(scopedQuery, access, managedEmployeeIds);

    case 'absence_justifications':
    case 'administrative_requests':
    case 'remote_work_requests': {
      const { userId, highestRole: role } = access;
      if (isHRRole(role)) return scopedQuery;
      return scopedQuery.eq('employee_id', userId);
    }

    case 'attendances':
    case 'employee_skills':
    case 'skill_certifications': {
      const { userId, highestRole: role } = access;
      if (isHRRole(role)) return scopedQuery;
      return scopedQuery.eq('employee_id', userId);
    }

    case 'operational_activities': {
      const { userId, highestRole: role } = access;
      if (isManagerRole(role)) return scopedQuery;
      return scopedQuery.eq('owner_id', userId);
    }

    case 'notifications': {
      // Each user only sees their own notifications (no tenant scope on user_id).
      return query.eq('user_id', access.userId);
    }

    // Reference data — visible to all tenant members, already scoped by tenant_id.
    case 'skills':
    case 'trainings':
    case 'absence_types':
    case 'work_locations':
    case 'expense_categories':
    case 'operational_schedules':
    case 'operational_action_templates':
    case 'alert_types':
    case 'alert_solutions':
    case 'alert_instance_recommendations':
    case 'onboarding_tasks':
    case 'offboarding_tasks':
    case 'payroll':
      return scopedQuery;

    default:
      return scopedQuery;
  }
}
