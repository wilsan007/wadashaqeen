/**
 * useAccess — Primary hook for all RBAC checks in components.
 *
 * Rule: import from this file rather than from AccessContext directly.
 * The specialised sub-hooks prevent unnecessary re-renders by returning
 * scalar values instead of the full context object.
 *
 * Do NOT call useUserRoles(), useRoleBasedAccess(), or usePermissions()
 * in new code — use these hooks instead.
 */

import { useAccessContext } from '@/contexts/AccessContext';
import type { AppFeature, Permission, RoleName, UserAccess } from '@/lib/rbac/types';

// ---------------------------------------------------------------------------
// Primary hook — gives full context access
// ---------------------------------------------------------------------------

/**
 * Returns the full AccessContext value.
 * Prefer the specialised hooks below when you only need a single boolean.
 */
export function useAccess() {
  return useAccessContext();
}

// ---------------------------------------------------------------------------
// Specialised hooks
// ---------------------------------------------------------------------------

/**
 * Returns the resolved UserAccess object, or null while loading / unauthenticated.
 */
export function useUserAccess(): UserAccess | null {
  return useAccessContext().access;
}

/**
 * Returns true once the initial access fetch completes.
 */
export function useAccessLoading(): boolean {
  return useAccessContext().isLoading;
}

/**
 * Returns true if the user holds the specified permission.
 * Deny-by-default: returns false while loading.
 */
export function useHasPermission(permission: Permission): boolean {
  return useAccessContext().hasPermission(permission);
}

/**
 * Returns true if the user holds the exact specified role.
 * For hierarchy checks (e.g. "at least manager"), prefer useHasMinimumRole().
 */
export function useHasRole(role: RoleName): boolean {
  return useAccessContext().hasRole(role);
}

/**
 * Returns true if the user holds a role equal to or higher than minimumRole
 * in the hierarchy (super_admin > tenant_admin > hr_manager > …).
 */
export function useHasMinimumRole(minimumRole: RoleName): boolean {
  return useAccessContext().hasMinimumRole(minimumRole);
}

/**
 * Returns true if the user can access the specified AppFeature.
 * This is the recommended guard for route components and sidebar nav links.
 */
export function useCanAccessFeature(feature: AppFeature): boolean {
  return useAccessContext().canAccess(feature);
}

/**
 * Convenience: returns true when the user is a super_admin.
 */
export function useIsSuperAdmin(): boolean {
  return useAccessContext().access?.isSuperAdmin ?? false;
}

/**
 * Convenience: returns true when the user is a tenant_admin.
 */
export function useIsTenantAdmin(): boolean {
  return useAccessContext().access?.isTenantAdmin ?? false;
}

/**
 * Returns the current user's tenant ID, or null.
 */
export function useTenantId(): string | null {
  return useAccessContext().access?.tenantId ?? null;
}

/**
 * Returns the current user's ID, or null.
 */
export function useCurrentUserId(): string | null {
  return useAccessContext().access?.userId ?? null;
}

/**
 * Returns the roles array for the current user.
 */
export function useUserRoleNames(): RoleName[] {
  return useAccessContext().access?.roles ?? [];
}
