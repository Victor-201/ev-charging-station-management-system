-- Add columns for email verification with 6-digit code
-- Please apply these changes to your 'ev_auth_db' database.

ALTER TABLE users ADD COLUMN verification_code VARCHAR(6);
ALTER TABLE users ADD COLUMN verification_code_expires_at TIMESTAMPTZ;

-- Optional: Add an index for faster lookups on verification codes
CREATE INDEX idx_users_verification_code ON users(verification_code);

