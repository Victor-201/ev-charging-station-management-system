-- user_db

CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL, -- references users.id in auth_db logically
    full_name VARCHAR(255),
    date_of_birth DATE,
    gender VARCHAR(20),
    avatar_url VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_up_userid ON user_profiles(user_id);

CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    plate_number VARCHAR(50),
    brand VARCHAR(100),
    model VARCHAR(100),
    year INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vehicles_userid ON vehicles(user_id);
CREATE UNIQUE INDEX uq_vehicle_plate ON vehicles(plate_number);

CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL,
    balance NUMERIC(12,2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'VND',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wallets_userid ON wallets(user_id);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title VARCHAR(255),
    body TEXT,
    channel VARCHAR(50), -- push, email, sms, in-app
    status VARCHAR(50) DEFAULT 'pending', -- pending, sent, read
    created_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ
);

CREATE INDEX idx_notifications_userid ON notifications(user_id);

-- optional: audit / event outbox for user updates
CREATE TABLE outbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_type VARCHAR(100),
    aggregate_id UUID,
    event_type VARCHAR(100),
    payload JSONB,
    published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
