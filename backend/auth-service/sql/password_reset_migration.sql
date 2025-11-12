-- Add columns for password reset functionality
-- Please apply these changes to your 'ev_auth_db' database.

ALTER TABLE users ADD COLUMN password_reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN password_reset_token_expires_at TIMESTAMPTZ;

-- Optional: Add an index for faster lookups on reset tokens
CREATE INDEX idx_users_password_reset_token ON users(password_reset_token);

