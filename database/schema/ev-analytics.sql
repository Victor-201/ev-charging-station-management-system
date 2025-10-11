-- analytics_db

-- store forecast results produced by AI jobs
CREATE TABLE ai_demand_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id UUID, -- logical reference to station_db.stations
    forecast_date DATE NOT NULL,
    predicted_sessions INT,
    predicted_kwh NUMERIC(12,2),
    model_version VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_forecast_station_date ON ai_demand_forecasts(station_id, forecast_date);

-- aggregated daily metrics (can be populated by ETL)
CREATE TABLE daily_station_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id UUID NOT NULL,
    metric_date DATE NOT NULL,
    total_sessions INT DEFAULT 0,
    total_kwh NUMERIC(12,2) DEFAULT 0,
    total_revenue NUMERIC(12,2) DEFAULT 0,
    peak_hour INT, -- 0..23
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX uq_daily_station_metric ON daily_station_metrics(station_id, metric_date);

-- user-level monthly reports (example)
CREATE TABLE user_monthly_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    year INT NOT NULL,
    month INT NOT NULL,
    total_kwh NUMERIC(12,2) DEFAULT 0,
    total_spent NUMERIC(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX uq_user_monthly ON user_monthly_reports(user_id, year, month);

-- model training jobs / metadata
CREATE TABLE model_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type VARCHAR(100), -- training, eval
    dataset_ref TEXT,
    hyperparams JSONB,
    status VARCHAR(50) DEFAULT 'queued',
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    result_metrics JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
