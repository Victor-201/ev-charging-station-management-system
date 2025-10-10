-- TELEMETRY SERVICE
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE telemetry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES charging_sessions(id),
    timestamp TIMESTAMP DEFAULT now(),
    soc INT,
    voltage NUMERIC(8,2),
    current NUMERIC(8,2),
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    created_by UUID,
    updated_by UUID,
    deleted BOOLEAN DEFAULT false
);
