-- Migration: Consolidate roles from 5 to 3
-- Date: 2025-11-11
-- Description: Migrate from legacy roles (driver, customer, station_owner, staff, admin) to new 3-role system (user, staff, admin)

-- ============================================
-- 1. UPDATE USER ROLES
-- ============================================

-- Migrate 'driver' and 'customer' to 'user'
UPDATE users 
SET role = 'user' 
WHERE role IN ('driver', 'customer');

-- Migrate 'station_owner' to 'staff'
UPDATE users 
SET role = 'staff' 
WHERE role = 'station_owner';

-- Verify migration
SELECT role, COUNT(*) as count 
FROM users 
GROUP BY role 
ORDER BY role;

-- ============================================
-- 2. ADD CHECK CONSTRAINT (if not exists)
-- ============================================

-- Drop old constraint if exists
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new constraint for 3 roles only
ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'staff', 'user'));

-- ============================================
-- 3. CLEANUP LEGACY ROLES FROM RBAC TABLES
-- ============================================

-- Note: We keep legacy role records for audit purposes
-- but mark them as deprecated in description

UPDATE roles 
SET description = '[DEPRECATED] ' || description,
    is_system = false
WHERE name IN ('driver', 'customer', 'station_owner');

-- ============================================
-- 4. VERIFICATION
-- ============================================

-- Show current role distribution
SELECT 
    'User Roles' as table_name,
    role,
    COUNT(*) as count
FROM users
GROUP BY role
UNION ALL
SELECT 
    'RBAC Roles' as table_name,
    name as role,
    CASE WHEN is_system THEN 1 ELSE 0 END as count
FROM roles
ORDER BY table_name, role;

-- Show any users with invalid roles (should be empty)
SELECT id, email, role 
FROM users 
WHERE role NOT IN ('admin', 'staff', 'user');

