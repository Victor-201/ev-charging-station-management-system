-- Seed RBAC: Roles, Permissions, and Role-Permission mappings
-- Database: ev_auth_db

-- ============================================
-- 1. INSERT ROLES
-- ============================================
INSERT INTO roles (id, name, description, is_system) VALUES
    ('00000000-0000-0000-0000-000000000001', 'admin', 'System Administrator - Full access to all resources', true),
    ('00000000-0000-0000-0000-000000000002', 'station_owner', 'Charging Station Owner - Manage owned stations', true),
    ('00000000-0000-0000-0000-000000000003', 'staff', 'Station Staff - Operate charging stations', true),
    ('00000000-0000-0000-0000-000000000004', 'driver', 'EV Driver - Use charging services', true),
    ('00000000-0000-0000-0000-000000000005', 'customer', 'Customer - Basic charging services', true)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 2. INSERT PERMISSIONS
-- ============================================

-- User Management Permissions
INSERT INTO permissions (name, resource, action, description) VALUES
    ('user:read', 'user', 'read', 'View user information'),
    ('user:create', 'user', 'create', 'Create new users'),
    ('user:update', 'user', 'update', 'Update user information'),
    ('user:delete', 'user', 'delete', 'Delete users'),
    ('user:manage', 'user', 'manage', 'Full user management access')
ON CONFLICT (name) DO NOTHING;

-- Station Management Permissions
INSERT INTO permissions (name, resource, action, description) VALUES
    ('station:read', 'station', 'read', 'View station information'),
    ('station:create', 'station', 'create', 'Create new charging stations'),
    ('station:update', 'station', 'update', 'Update station information'),
    ('station:delete', 'station', 'delete', 'Delete charging stations'),
    ('station:manage', 'station', 'manage', 'Full station management access'),
    ('station:operate', 'station', 'operate', 'Operate charging stations')
ON CONFLICT (name) DO NOTHING;

-- Charging Session Permissions
INSERT INTO permissions (name, resource, action, description) VALUES
    ('charging:read', 'charging', 'read', 'View charging sessions'),
    ('charging:create', 'charging', 'create', 'Start charging sessions'),
    ('charging:update', 'charging', 'update', 'Update charging sessions'),
    ('charging:stop', 'charging', 'stop', 'Stop charging sessions'),
    ('charging:manage', 'charging', 'manage', 'Full charging session management')
ON CONFLICT (name) DO NOTHING;

-- Booking Permissions
INSERT INTO permissions (name, resource, action, description) VALUES
    ('booking:read', 'booking', 'read', 'View booking information'),
    ('booking:create', 'booking', 'create', 'Create new bookings'),
    ('booking:update', 'booking', 'update', 'Update bookings'),
    ('booking:cancel', 'booking', 'cancel', 'Cancel bookings'),
    ('booking:manage', 'booking', 'manage', 'Full booking management')
ON CONFLICT (name) DO NOTHING;

-- Payment Permissions
INSERT INTO permissions (name, resource, action, description) VALUES
    ('payment:read', 'payment', 'read', 'View payment information'),
    ('payment:create', 'payment', 'create', 'Process payments'),
    ('payment:refund', 'payment', 'refund', 'Refund payments'),
    ('payment:manage', 'payment', 'manage', 'Full payment management')
ON CONFLICT (name) DO NOTHING;

-- Analytics Permissions
INSERT INTO permissions (name, resource, action, description) VALUES
    ('analytics:read', 'analytics', 'read', 'View analytics and reports'),
    ('analytics:manage', 'analytics', 'manage', 'Full analytics management')
ON CONFLICT (name) DO NOTHING;

-- System Permissions
INSERT INTO permissions (name, resource, action, description) VALUES
    ('system:read', 'system', 'read', 'View system settings'),
    ('system:manage', 'system', 'manage', 'Manage system settings')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 3. ASSIGN PERMISSIONS TO ROLES
-- ============================================

-- ADMIN: Full access to everything
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'admin'),
    id
FROM permissions
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- STATION_OWNER: Manage owned stations and view analytics
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'station_owner'),
    id
FROM permissions
WHERE name IN (
    'station:read', 'station:create', 'station:update', 'station:manage',
    'charging:read', 'charging:manage',
    'booking:read', 'booking:manage',
    'payment:read',
    'analytics:read',
    'user:read'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- STAFF: Operate stations
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'staff'),
    id
FROM permissions
WHERE name IN (
    'station:read', 'station:operate',
    'charging:read', 'charging:create', 'charging:update', 'charging:stop',
    'booking:read', 'booking:update',
    'user:read'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- DRIVER: Use charging services
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'driver'),
    id
FROM permissions
WHERE name IN (
    'station:read',
    'charging:read', 'charging:create', 'charging:stop',
    'booking:read', 'booking:create', 'booking:cancel',
    'payment:read', 'payment:create',
    'user:read', 'user:update'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- CUSTOMER: Basic charging services
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'customer'),
    id
FROM permissions
WHERE name IN (
    'station:read',
    'charging:read', 'charging:create',
    'booking:read', 'booking:create',
    'payment:read', 'payment:create',
    'user:read', 'user:update'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================
-- 4. ASSIGN DEFAULT ROLES TO EXISTING USERS
-- ============================================

-- Assign roles based on existing user.role field
INSERT INTO user_roles (user_id, role_id)
SELECT 
    u.id,
    r.id
FROM users u
JOIN roles r ON r.name = u.role
WHERE NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = u.id AND ur.role_id = r.id
);

-- Output summary
SELECT 
    'RBAC Seed Completed' as status,
    (SELECT COUNT(*) FROM roles) as total_roles,
    (SELECT COUNT(*) FROM permissions) as total_permissions,
    (SELECT COUNT(*) FROM role_permissions) as total_role_permissions,
    (SELECT COUNT(*) FROM user_roles) as total_user_roles;
