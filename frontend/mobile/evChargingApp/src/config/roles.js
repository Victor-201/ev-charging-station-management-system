/**
 * User Role Constants
 * 
 * Centralized role definitions to ensure consistency across the application.
 * This file should be kept in sync with `backend/auth-service/src/constants/roles.ts`
 */

export const UserRole = {
  ADMIN: 'admin',
  STAFF: 'staff',
  USER: 'user',
};

/**
 * Role hierarchy for permission checking
 * Higher number = more permissions
 */
export const ROLE_HIERARCHY = {
  [UserRole.ADMIN]: 100,
  [UserRole.STAFF]: 50,
  [UserRole.USER]: 10,
};

/**
 * Check if user has sufficient role level
 * @param {string} userRole - The role of the current user.
 * @param {string} requiredRole - The minimum role required for the action.
 * @returns {boolean} - True if the user has the required permission level.
 */
export function hasRoleLevel(userRole, requiredRole) {
  if (!userRole || !requiredRole) {
    return false;
  }
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

