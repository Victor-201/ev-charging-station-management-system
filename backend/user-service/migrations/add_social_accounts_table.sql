CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Social Accounts Table
CREATE TABLE user_social_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    username VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, provider_user_id)
);

COMMENT ON TABLE user_social_accounts IS 'Stores linked social media accounts for users (e.g., Google, Facebook).';
