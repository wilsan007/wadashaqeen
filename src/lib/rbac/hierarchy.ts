/**
 * RBAC — Role hierarchy
 *
 * Higher number = higher privilege.
 * All access checks that work on a "minimum role" basis must go through
 * hasMinimumRole() rather than comparing role names directly.
 */

import { RoleName } from './types';

export const ROLE_HIERARCHY: Record<RoleName, number> = {
  super_admin: 100,
  tenant_admin: 80,
  hr_manager: 60,
  project_manager: 50,
  team_lead: 40,
  employee: 30,
  contractor: 25,
  intern: 15,
  viewer: 10,
};

/**
 * Returns true if the user holds at least one role whose hierarchy level
 * is greater than or equal to the specified minimum role.
 */
export function hasMinimumRole(userRoles: RoleName[], minimumRole: RoleName): boolean {
  const threshold = ROLE_HIERARCHY[minimumRole];
  return userRoles.some(r => ROLE_HIERARCHY[r] >= threshold);
}

/**
 * Returns the single highest role in a list, or null when the list is empty.
 */
export function getHighestRole(roles: RoleName[]): RoleName | null {
  return roles.reduce<RoleName | null>((highest, role) => {
    if (!highest) return role;
    return ROLE_HIERARCHY[role] > ROLE_HIERARCHY[highest] ? role : highest;
  }, null);
}

/**
 * Returns true if roleA outranks roleB.
 */
export function isHigherRole(roleA: RoleName, roleB: RoleName): boolean {
  return ROLE_HIERARCHY[roleA] > ROLE_HIERARCHY[roleB];
}
