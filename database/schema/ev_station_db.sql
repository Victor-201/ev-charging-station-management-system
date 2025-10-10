-- stations table
CREATE TABLE stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255),
    address VARCHAR(500),
    city VARCHAR(100),
    region VARCHAR(100),
    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),
    status VARCHAR(50)
);

-- station_staff table
CREATE TABLE station_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID, 
    station_id UUID REFERENCES stations(id) ON DELETE CASCADE,
    role VARCHAR(50)
);

-- charging_points table
CREATE TABLE charging_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id UUID REFERENCES stations(id) ON DELETE CASCADE,
    external_id VARCHAR(100),
    connector_type VARCHAR(50),
    status VARCHAR(50),
    price_per_kwh NUMERIC(10,2),
    price_per_minute NUMERIC(10,2)
);

-- station_incidents table
CREATE TABLE station_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id UUID REFERENCES stations(id),
    point_id UUID REFERENCES charging_points(id),
    reported_by UUID,
    description TEXT,
    status VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- station_usage_reports table
CREATE TABLE station_usage_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id UUID REFERENCES stations(id),
    report_date DATE,
    total_sessions INT,
    total_kwh NUMERIC(12,2),
    total_revenue NUMERIC(12,2)
);

-- ai_demand_forecasts table
CREATE TABLE ai_demand_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id UUID REFERENCES stations(id),
    forecast_date DATE,
    predicted_sessions INT,
    predicted_kwh NUMERIC(12,2)
);
