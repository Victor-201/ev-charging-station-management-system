-- auth_db

-- users: primary user identity
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- driver, staff, admin
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- third-party auth providers (oauth)
CREATE TABLE user_auth_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    provider VARCHAR(50) NOT NULL,
    provider_uid VARCHAR(255),
    access_token TEXT,  -- Changed from VARCHAR(500) to TEXT for long JWT tokens
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, provider)  -- Add unique constraint for ON CONFLICT
);

CREATE INDEX idx_uap_userid ON user_auth_providers(user_id);

-- sessions / tokens (short-living or refresh token)
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    refresh_token_hash VARCHAR(255),
    device_info TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_userid ON sessions(user_id);

-- optional: outbox for reliable event publishing
CREATE TABLE outbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_type VARCHAR(100),
    aggregate_id UUID,
    event_type VARCHAR(100),
    payload JSONB,
    published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RBAC: Roles table
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL, -- customer, admin, station_owner, staff, driver
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE, -- system roles cannot be deleted
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_roles_name ON roles(name);

COMMENT ON TABLE roles IS 'Role definitions for Role-Based Access Control (RBAC)';
COMMENT ON COLUMN roles.is_system IS 'System roles cannot be modified or deleted';

-- RBAC: Permissions table
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'user:read', 'station:create', 'payment:refund'
    resource VARCHAR(50) NOT NULL, -- user, station, booking, payment, charging, etc.
    action VARCHAR(50) NOT NULL, -- create, read, update, delete, manage, etc.
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_permissions_name ON permissions(name);
CREATE INDEX idx_permissions_resource ON permissions(resource);

COMMENT ON TABLE permissions IS 'Permission definitions for fine-grained access control';
COMMENT ON COLUMN permissions.name IS 'Unique permission identifier (format: resource:action)';

-- RBAC: Role-Permission mapping
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);

COMMENT ON TABLE role_permissions IS 'Many-to-many relationship between roles and permissions';

-- RBAC: User-Role mapping (supports multiple roles per user)
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID REFERENCES users(id), -- admin who assigned this role
    expires_at TIMESTAMPTZ, -- optional: for temporary role assignments
    UNIQUE(user_id, role_id)
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);
CREATE INDEX idx_user_roles_expires_at ON user_roles(expires_at);

COMMENT ON TABLE user_roles IS 'Assigns roles to users, supports multiple roles and temporary assignments';
COMMENT ON COLUMN user_roles.expires_at IS 'Optional expiration time for temporary role assignments';
