import { useSelector } from 'react-redux';
import { UserRole, hasRoleLevel } from '../config/roles';

/**
 * Custom hook for checking user permissions.
 * Provides a simple way to check if the current user has a required role level.
 */
export default function usePermissions() {
  const userRole = useSelector((state) => state.auth.user?.role);

  /**
   * Checks if the current user's role meets or exceeds the required role level.
   * @param {string} requiredRole - The minimum role required (e.g., UserRole.STAFF).
   * @returns {boolean} - True if the user has sufficient permissions.
   */
  const hasPermission = (requiredRole) => {
    return hasRoleLevel(userRole, requiredRole);
  };

  return {
    userRole,
    isAdmin: userRole === UserRole.ADMIN,
    isStaff: hasRoleLevel(userRole, UserRole.STAFF),
    isUser: hasRoleLevel(userRole, UserRole.USER),
    hasPermission,
  };
}

