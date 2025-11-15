/**
 * User Role Constants
 */
const UserRole = {
  ADMIN: 'admin',
  STAFF: 'staff',
  USER: 'user',
};

/**
 * Legacy role mapping
 */
const LEGACY_ROLE_MAPPING = {
  driver: UserRole.USER,
  customer: UserRole.USER,
  station_owner: UserRole.STAFF,
  user: UserRole.USER,
  staff: UserRole.STAFF,
  admin: UserRole.ADMIN,
};

/**
 * Normalize role
 */
function normalizeRole(role) {
  if (!role) throw new Error('Role is required');

  const r = role.toLowerCase();
  const normalized = LEGACY_ROLE_MAPPING[r];

  if (!normalized) {
    throw new Error(`Invalid role: ${role}`);
  }

  return normalized;
}

/**
 * Validate role
 */
function isValidRole(role) {
  return Object.values(UserRole).includes(role);
}

/**
 * Get all roles
 */
function getAllRoles() {
  return Object.values(UserRole);
}

/**
 * Role hierarchy
 */
const ROLE_HIERARCHY = {
  [UserRole.ADMIN]: 100,
  [UserRole.STAFF]: 50,
  [UserRole.USER]: 10,
};

/**
 * Check role level
 */
function hasRoleLevel(userRole, requiredRole) {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

module.exports = {
  UserRole,
  LEGACY_ROLE_MAPPING,
  normalizeRole,
  isValidRole,
  getAllRoles,
  ROLE_HIERARCHY,
  hasRoleLevel,
};
