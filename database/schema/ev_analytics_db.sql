CREATE DATABASE IF NOT EXISTS ev_analytics_db;
USE ev_analytics_db;

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