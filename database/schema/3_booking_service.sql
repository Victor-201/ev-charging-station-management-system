-- BOOKING SERVICE
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE connector_type AS ENUM ('CCS', 'CHAdeMO', 'AC');

CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    station_id UUID NOT NULL REFERENCES stations(id),
    connector_type connector_type NOT NULL,
    start_time TIMESTAMP,
    status VARCHAR(50) DEFAULT 'confirmed',
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    created_by UUID,
    updated_by UUID,
    deleted BOOLEAN DEFAULT false
);
