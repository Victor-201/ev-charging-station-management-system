-- STATION SERVICE
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE station_status AS ENUM ('online', 'offline', 'maintenance');
CREATE TYPE connector_type AS ENUM ('CCS', 'CHAdeMO', 'AC');

CREATE TABLE stations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    power VARCHAR(50),
    status station_status DEFAULT 'online',
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    created_by UUID,
    updated_by UUID,
    deleted BOOLEAN DEFAULT false
);

CREATE TABLE connectors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id UUID NOT NULL REFERENCES stations(id),
    type connector_type NOT NULL,
    power VARCHAR(50),
    status VARCHAR(50) DEFAULT 'available',
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    created_by UUID,
    updated_by UUID,
    deleted BOOLEAN DEFAULT false
);
