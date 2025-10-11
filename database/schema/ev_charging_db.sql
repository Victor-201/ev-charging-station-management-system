-- charging_db

CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_code VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID NOT NULL,        -- references auth_db.users.id logically
    station_id UUID NOT NULL,     -- references station_db.stations logically
    point_id UUID NOT NULL,       -- references station_db.charging_points logically
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'reserved', -- reserved, cancelled, expired, active, completed
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reservations_userid ON reservations(user_id);
CREATE INDEX idx_reservations_station ON reservations(station_id);

CREATE TABLE charging_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_code VARCHAR(100) UNIQUE,
    user_id UUID NOT NULL,        -- logical reference
    vehicle_id UUID,              -- logical reference to user_db.vehicles
    station_id UUID NOT NULL,
    point_id UUID NOT NULL,
    start_ts TIMESTAMPTZ,
    end_ts TIMESTAMPTZ,
    kwh_consumed NUMERIC(10,3) DEFAULT 0,
    price_total NUMERIC(12,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'idle', -- idle, charging, finished, error
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON charging_sessions(user_id);
CREATE INDEX idx_sessions_point ON charging_sessions(point_id);

-- telemetry time-series for a session (no PK on time to allow high-frequency inserts; but we add id for convenience)
CREATE TABLE charging_telemetry (
    id BIGSERIAL PRIMARY KEY,
    time TIMESTAMPTZ NOT NULL,
    session_id UUID NOT NULL, -- references charging_sessions.id in same DB
    point_id UUID NOT NULL,
    power_kw NUMERIC(10,3),
    voltage NUMERIC(10,2),
    current_amp NUMERIC(10,2),
    soc INT, -- state of charge %
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_telemetry_session_time ON charging_telemetry(session_id, time DESC);
CREATE INDEX idx_telemetry_point_time ON charging_telemetry(point_id, time DESC);

-- staff actions related to sessions/points
CREATE TABLE staff_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_user_id UUID NOT NULL, -- logical reference to auth_db.users
    action_type VARCHAR(100), -- start_session, stop_session, override_price, etc.
    target_type VARCHAR(50), -- session, point, station
    target_id UUID,
    notes TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_staff_actions_staff ON staff_actions(staff_user_id);

-- optional: event outbox to notify payment/analytics/station
CREATE TABLE outbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_type VARCHAR(100),
    aggregate_id UUID,
    event_type VARCHAR(100),
    payload JSONB,
    published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
