/**
 * User Role Constants
 *
 * Centralized role definitions to ensure consistency across the application
 * and prevent typos when checking user permissions.
 *
 * Only 3 roles: admin, staff, user
 */

export enum UserRole {
  ADMIN = 'admin',
  STAFF = 'staff',
  USER = 'user',
}

/**
 * Legacy role mapping for backward compatibility
 * 'driver', 'customer', 'station_owner' are deprecated and mapped to appropriate roles
 */
export const LEGACY_ROLE_MAPPING: Record<string, UserRole> = {
  driver: UserRole.USER,
  customer: UserRole.USER,
  station_owner: UserRole.STAFF,
  user: UserRole.USER,
  staff: UserRole.STAFF,
  admin: UserRole.ADMIN,
};

/**
 * Get normalized role from legacy role name
 */
export function normalizeRole(role: string): UserRole {
  const normalized = LEGACY_ROLE_MAPPING[role.toLowerCase()];
  if (!normalized) {
    throw new Error(`Invalid role: ${role}`);
  }
  return normalized;
}

/**
 * Check if a role is valid
 */
export function isValidRole(role: string): boolean {
  return Object.values(UserRole).includes(role as UserRole);
}

/**
 * Get all valid roles
 */
export function getAllRoles(): UserRole[] {
  return Object.values(UserRole);
}

/**
 * Role hierarchy for permission checking
 * Higher number = more permissions
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.ADMIN]: 100,
  [UserRole.STAFF]: 50,
  [UserRole.USER]: 10,
};

/**
 * Check if user has sufficient role level
 */
export function hasRoleLevel(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

