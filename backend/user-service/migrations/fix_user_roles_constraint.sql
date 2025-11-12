-- Migration: Fix user roles constraint to match new role system
-- Date: 2025-11-11
-- Description: Update role constraint from (customer, admin, station_owner) to (user, staff, admin)

BEGIN;

-- Step 1: Drop the old constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Step 2: Update existing roles to new system
UPDATE users SET role = 'user' WHERE role IN ('customer', 'driver');
UPDATE users SET role = 'staff' WHERE role IN ('station_owner', 'staff');
UPDATE users SET role = 'admin' WHERE role = 'admin';

-- Step 3: Add new constraint with correct roles
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('user', 'staff', 'admin'));

-- Step 4: Update default value
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user';

COMMIT;

-- Verify the changes
SELECT DISTINCT role, COUNT(*) as count 
FROM users 
GROUP BY role 
ORDER BY role;

