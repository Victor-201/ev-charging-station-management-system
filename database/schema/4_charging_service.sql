-- CHARGING SERVICE
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE session_status AS ENUM ('pending', 'charging', 'stopped', 'completed');

CREATE TABLE charging_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    station_id UUID NOT NULL REFERENCES stations(id),
    connector_id UUID NOT NULL REFERENCES connectors(id),
    reservation_id UUID,
    soc_start INT,
    soc_end INT,
    cost NUMERIC(12,2),
    status session_status DEFAULT 'pending',
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    created_by UUID,
    updated_by UUID,
    deleted BOOLEAN DEFAULT false
);
