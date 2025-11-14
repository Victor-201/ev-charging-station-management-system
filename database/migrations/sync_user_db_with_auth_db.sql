-- Migration: Sync ev_user_db with ev_auth_db schema
-- Date: 2025-11-14
-- Purpose: Fix schema inconsistencies between auth and user databases

-- ==================== USERS TABLE ====================

-- Add missing columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';

-- Rename phone_number to phone for consistency with auth_db
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'phone_number'
    ) THEN
        ALTER TABLE users RENAME COLUMN phone_number TO phone;
    END IF;
END $$;

-- Update role constraint to match auth_db
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('admin', 'staff', 'user'));

-- Migrate existing role data
-- customer -> user
-- station_owner -> staff
-- admin -> admin (no change)
UPDATE users SET role = 'user' WHERE role = 'customer';
UPDATE users SET role = 'staff' WHERE role = 'station_owner';

-- Remove is_active column (replaced by status)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'is_active'
    ) THEN
        -- Migrate is_active to status
        UPDATE users SET status = CASE 
            WHEN is_active = true THEN 'active'
            ELSE 'inactive'
        END;
        
        -- Drop is_active column
        ALTER TABLE users DROP COLUMN is_active;
    END IF;
END $$;

-- Create new indexes
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Drop old index
DROP INDEX IF EXISTS idx_users_is_active;

-- ==================== USER_PROFILES TABLE ====================

-- Remove duplicate columns (name, phone are in users table)
ALTER TABLE user_profiles DROP COLUMN IF EXISTS name;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS phone;

-- ==================== VERIFICATION ====================

-- Verify changes
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Check users table has all required columns
    SELECT COUNT(*) INTO v_count
    FROM information_schema.columns
    WHERE table_name = 'users'
    AND column_name IN ('id', 'email', 'full_name', 'phone', 'date_of_birth', 
                        'role', 'status', 'email_verified', 'created_at', 'updated_at');
    
    IF v_count < 10 THEN
        RAISE EXCEPTION 'Migration failed: users table missing required columns';
    END IF;
    
    -- Check user_profiles table doesn't have duplicate columns
    SELECT COUNT(*) INTO v_count
    FROM information_schema.columns
    WHERE table_name = 'user_profiles'
    AND column_name IN ('name', 'phone');
    
    IF v_count > 0 THEN
        RAISE EXCEPTION 'Migration failed: user_profiles still has duplicate columns';
    END IF;
    
    RAISE NOTICE 'Migration completed successfully!';
END $$;

-- ==================== SUMMARY ====================

-- Display migration summary
SELECT 
    'users' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

SELECT 
    'user_profiles' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

