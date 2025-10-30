CREATE DATABASE IF NOT EXISTS ev_charging;
USE ev_charging;

CREATE TABLE IF NOT EXISTS monitoring_services (
  service_id INT AUTO_INCREMENT PRIMARY KEY,
  service_name VARCHAR(64) NOT NULL UNIQUE,
  status ENUM('ok','degraded','down') NOT NULL DEFAULT 'ok',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS monitoring_metrics (
  metric_id INT AUTO_INCREMENT PRIMARY KEY,
  metric VARCHAR(64) NOT NULL,
  bucket DATETIME NOT NULL,
  bucket_interval VARCHAR(16) NOT NULL,
  avg_value DECIMAL(12,2) NOT NULL,
  UNIQUE KEY uniq_metric_bucket (metric, bucket, bucket_interval)
);

CREATE TABLE IF NOT EXISTS monitoring_logs (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  service_name VARCHAR(64) NOT NULL,
  level ENUM('debug','info','warn','error') NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS monitoring_alerts (
  alert_id VARCHAR(32) PRIMARY KEY,
  type VARCHAR(64) NOT NULL,
  status ENUM('firing','acknowledged','resolved') NOT NULL,
  description TEXT,
  triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  acknowledged_at TIMESTAMP NULL,
  acknowledged_by VARCHAR(64) NULL
);

CREATE TABLE IF NOT EXISTS user_monthly_reports (
  report_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(32) NOT NULL,
  billing_month CHAR(7) NOT NULL,
  total_cost DECIMAL(12,2) NOT NULL,
  total_sessions INT NOT NULL,
  UNIQUE KEY uniq_user_month (user_id, billing_month)
);

CREATE TABLE IF NOT EXISTS station_daily_reports (
  report_id INT AUTO_INCREMENT PRIMARY KEY,
  station_id VARCHAR(32) NOT NULL,
  report_date DATE NOT NULL,
  total_kwh DECIMAL(12,2) NOT NULL,
  sessions INT NOT NULL,
  revenue DECIMAL(12,2) NOT NULL,
  UNIQUE KEY uniq_station_date (station_id, report_date)
);

CREATE TABLE IF NOT EXISTS forecast_jobs (
  job_id INT AUTO_INCREMENT PRIMARY KEY,
  model_name VARCHAR(64) NOT NULL,
  station_ids JSON NOT NULL,
  range_start DATE NOT NULL,
  range_end DATE NOT NULL,
  status VARCHAR(32) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS station_forecasts (
  forecast_id INT AUTO_INCREMENT PRIMARY KEY,
  station_id VARCHAR(32) NOT NULL,
  forecast_date DATE NOT NULL,
  expected_kwh DECIMAL(12,2) NOT NULL,
  UNIQUE KEY uniq_station_date (station_id, forecast_date)
);

CREATE TABLE IF NOT EXISTS telemetry_exports (
  export_id INT AUTO_INCREMENT PRIMARY KEY,
  station_id VARCHAR(32),
  point_id VARCHAR(32),
  range_start DATETIME,
  range_end DATETIME,
  format VARCHAR(16) DEFAULT 'zip',
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dashboards (
  dashboard_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  description TEXT,
  widgets JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_sessions (
  session_id VARCHAR(20) PRIMARY KEY,
  user_id VARCHAR(20),
  station_id VARCHAR(20),
  session_duration DECIMAL(6,2),
  energy_used DECIMAL(10,2),
  start_time DATETIME,
  end_time DATETIME
);

TRUNCATE TABLE monitoring_services;
INSERT INTO monitoring_services (service_name, status) VALUES
  ('auth', 'ok'),
  ('monitoring', 'ok'),
  ('payment', 'ok');

TRUNCATE TABLE monitoring_metrics;
INSERT INTO monitoring_metrics (metric, bucket, bucket_interval, avg_value) VALUES
  ('requests_per_sec', '2025-10-01 09:55:00', '5m', 16.0),
  ('requests_per_sec', '2025-10-01 10:00:00', '5m', 17.0);

TRUNCATE TABLE monitoring_logs;
INSERT INTO monitoring_logs (service_name, level, message, created_at) VALUES
  ('station', 'error', 'Station offline', '2025-10-01 10:00:00');

TRUNCATE TABLE monitoring_alerts;
INSERT INTO monitoring_alerts (alert_id, type, status, description, triggered_at)
VALUES ('A001', 'station_offline', 'firing', 'Station ST001 lost connectivity', DATE_SUB(NOW(), INTERVAL 30 MINUTE));

TRUNCATE TABLE user_monthly_reports;
INSERT INTO user_monthly_reports (user_id, billing_month, total_cost, total_sessions)
VALUES ('U001', '2025-09', 1200000, 15);

TRUNCATE TABLE station_daily_reports;
INSERT INTO station_daily_reports (station_id, report_date, total_kwh, sessions, revenue) VALUES
  ('ST001', '2025-10-01', 1500.00, 45, 2000000.00),
  ('ST001', '2025-09-15', 1100.00, 38, 1500000.00),
  ('ST002', '2025-09-20', 900.00, 30, 1000000.00),
  ('ST003', '2025-09-25', 1250.00, 42, 500000.00);

TRUNCATE TABLE forecast_jobs;
TRUNCATE TABLE station_forecasts;
INSERT INTO station_forecasts (station_id, forecast_date, expected_kwh) VALUES
  ('ST001', '2025-11-01', 1200.00);

TRUNCATE TABLE dashboards;
INSERT INTO dashboards (name, description, widgets) VALUES
  ('Ops Overview', 'Operational monitoring dashboard', JSON_ARRAY('Throughput', 'Alerts'));

TRUNCATE TABLE user_sessions;
INSERT INTO user_sessions (session_id, user_id, station_id, session_duration, energy_used, start_time, end_time) VALUES
  ('S001', 'U001', 'ST001', 45.5, 32.1, '2025-09-15 08:00:00', '2025-09-15 08:45:00'),
  ('S002', 'U001', 'ST001', 40.0, 30.0, '2025-09-16 09:10:00', '2025-09-16 09:50:00'),
  ('S003', 'U002', 'ST002', 35.0, 25.0, '2025-09-20 14:00:00', '2025-09-20 14:35:00');
