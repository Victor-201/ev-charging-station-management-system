-- reservations table
CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_code VARCHAR(50),
    user_id UUID,
    station_id UUID,
    point_id UUID,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    status VARCHAR(50)
);

-- charging_sessions table
CREATE TABLE charging_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    vehicle_id UUID,
    station_id UUID,
    point_id UUID,
    start_ts TIMESTAMPTZ,
    end_ts TIMESTAMPTZ,
    kwh_consumed NUMERIC(10,2),
    price_total NUMERIC(12,2),
    status VARCHAR(50)
);

-- charging_telemetry table
CREATE TABLE charging_telemetry (
    time TIMESTAMPTZ,
    session_id UUID REFERENCES charging_sessions(id),
    point_id UUID,
    power_kw NUMERIC(10,2),
    soc INT
);

-- staff_actions table
CREATE TABLE staff_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID,
    action_type VARCHAR(50),
    target_id UUID,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);
