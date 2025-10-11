-- station_db

CREATE TABLE stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address VARCHAR(500),
    city VARCHAR(100),
    region VARCHAR(100),
    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),
    status VARCHAR(50) DEFAULT 'active', -- active, maintenance, closed
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stations_city ON stations(city);

CREATE TABLE charging_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id UUID NOT NULL,
    external_id VARCHAR(100), -- id from hardware / edge controller
    connector_type VARCHAR(50), -- CCS, CHAdeMO, AC...
    max_power_kw NUMERIC(8,2),
    status VARCHAR(50) DEFAULT 'available', -- available, in_use, offline
    price_per_kwh NUMERIC(10,2),
    price_per_minute NUMERIC(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cp_stationid ON charging_points(station_id);
CREATE UNIQUE INDEX uq_cp_external_id ON charging_points(external_id);

-- staff assignment to stations
CREATE TABLE station_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_user_id UUID NOT NULL, -- references auth_db.users.id logically
    station_id UUID NOT NULL,
    role VARCHAR(50), -- operator, manager, maintainer
    assigned_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_station_staff ON station_staff(station_id);

-- incidents / issues reported for station or point
CREATE TABLE station_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id UUID NOT NULL,
    point_id UUID,
    reported_by UUID, -- user id or staff id
    description TEXT,
    severity VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'open', -- open, investigating, resolved, closed
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_incidents_station ON station_incidents(station_id);

-- daily / periodic usage reports (can be filled by jobs)
CREATE TABLE station_usage_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id UUID NOT NULL,
    report_date DATE NOT NULL,
    total_sessions INT DEFAULT 0,
    total_kwh NUMERIC(12,2) DEFAULT 0,
    total_revenue NUMERIC(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX uq_station_report_date ON station_usage_reports(station_id, report_date);

-- optional: outbox for events to analytics/charging/payment
CREATE TABLE outbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_type VARCHAR(100),
    aggregate_id UUID,
    event_type VARCHAR(100),
    payload JSONB,
    published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
