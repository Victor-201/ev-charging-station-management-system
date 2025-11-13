-- Email Verification System Migration
-- This migration adds support for token-based email verification
-- and ensures backward compatibility with existing 6-digit code verification

-- Note: The users table already has email_verified column from the schema
-- This migration ensures it exists and adds any missing components

-- Ensure email_verified column exists (should already exist from schema)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'email_verified'
    ) THEN
        ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
        CREATE INDEX idx_users_email_verified ON users(email_verified);
    END IF;
END $$;

-- Ensure verification_code columns exist (should already exist from schema)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'verification_code'
    ) THEN
        ALTER TABLE users ADD COLUMN verification_code VARCHAR(6);
        CREATE INDEX idx_users_verification_code ON users(verification_code);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'verification_code_expires_at'
    ) THEN
        ALTER TABLE users ADD COLUMN verification_code_expires_at TIMESTAMPTZ;
    END IF;
END $$;

-- Ensure email_verification_tokens table exists (should already exist from schema)
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'email_verification_tokens' AND indexname = 'idx_email_verification_tokens_user_id'
    ) THEN
        CREATE INDEX idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'email_verification_tokens' AND indexname = 'idx_email_verification_tokens_token_hash'
    ) THEN
        CREATE INDEX idx_email_verification_tokens_token_hash ON email_verification_tokens(token_hash);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'email_verification_tokens' AND indexname = 'idx_email_verification_tokens_expires_at'
    ) THEN
        CREATE INDEX idx_email_verification_tokens_expires_at ON email_verification_tokens(expires_at);
    END IF;
END $$;

-- Add comments
COMMENT ON TABLE email_verification_tokens IS 'Email verification tokens for new user registration';
COMMENT ON COLUMN email_verification_tokens.token_hash IS 'SHA256 hash of JWT verification token';
COMMENT ON COLUMN email_verification_tokens.verified_at IS 'Timestamp when token was used for verification';

-- Update existing users: Set email_verified to true for users created via OAuth
-- (OAuth users don't have password_hash set)
UPDATE users 
SET email_verified = true 
WHERE password_hash = '' OR password_hash IS NULL;

-- For testing: You may want to set all existing users as verified
-- Uncomment the line below if you want to verify all existing users
-- UPDATE users SET email_verified = true WHERE email_verified = false;

-- Display migration summary
DO $$ 
DECLARE
    total_users INTEGER;
    verified_users INTEGER;
    unverified_users INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_users FROM users;
    SELECT COUNT(*) INTO verified_users FROM users WHERE email_verified = true;
    SELECT COUNT(*) INTO unverified_users FROM users WHERE email_verified = false;
    
    RAISE NOTICE 'Email Verification Migration Complete';
    RAISE NOTICE 'Total users: %', total_users;
    RAISE NOTICE 'Verified users: %', verified_users;
    RAISE NOTICE 'Unverified users: %', unverified_users;
END $$;

