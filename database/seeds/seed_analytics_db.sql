-- ===========================================
-- SEED DATA FOR ANALYTICS + MONITORING (200 rows)
-- DB: ev_analytics_db
-- ===========================================

USE ev_analytics_db;

-- ===========================================
-- 1) monitoring_services (10 records)
-- ===========================================
TRUNCATE TABLE monitoring_services;
INSERT INTO monitoring_services (service_name, status) VALUES
('auth', 'ok'),
('monitoring', 'ok'),
('payment', 'ok'),
('station', 'degraded'),
('reservation', 'ok'),
('user', 'ok'),
('telemetry', 'ok'),
('analytics', 'ok'),
('gateway', 'ok'),
('notification', 'ok');

-- ===========================================
-- 2) monitoring_metrics (80 records)
--     - 4 metrics × 20 buckets = 80 rows
-- ===========================================
TRUNCATE TABLE monitoring_metrics;

-- requests_per_sec (every 5m)
INSERT INTO monitoring_metrics (metric, bucket, bucket_interval, avg_value) VALUES
('requests_per_sec','2025-10-01 09:00:00','5m',11.2),
('requests_per_sec','2025-10-01 09:05:00','5m',12.4),
('requests_per_sec','2025-10-01 09:10:00','5m',13.1),
('requests_per_sec','2025-10-01 09:15:00','5m',14.3),
('requests_per_sec','2025-10-01 09:20:00','5m',15.5),
('requests_per_sec','2025-10-01 09:25:00','5m',14.9),
('requests_per_sec','2025-10-01 09:30:00','5m',16.4),
('requests_per_sec','2025-10-01 09:35:00','5m',17.1),
('requests_per_sec','2025-10-01 09:40:00','5m',18.0),
('requests_per_sec','2025-10-01 09:45:00','5m',18.9),
('requests_per_sec','2025-10-01 09:50:00','5m',19.3),
('requests_per_sec','2025-10-01 09:55:00','5m',20.0),
('requests_per_sec','2025-10-01 10:00:00','5m',21.2),
('requests_per_sec','2025-10-01 10:05:00','5m',22.4),
('requests_per_sec','2025-10-01 10:10:00','5m',21.1),
('requests_per_sec','2025-10-01 10:15:00','5m',20.5),
('requests_per_sec','2025-10-01 10:20:00','5m',19.9),
('requests_per_sec','2025-10-01 10:25:00','5m',18.7),
('requests_per_sec','2025-10-01 10:30:00','5m',17.8),
('requests_per_sec','2025-10-01 10:35:00','5m',16.9);

-- cpu_usage_percent (1m interval)
INSERT INTO monitoring_metrics (metric, bucket, bucket_interval, avg_value) VALUES
('cpu_usage_percent','2025-10-01 09:00:00','1m',41.2),
('cpu_usage_percent','2025-10-01 09:01:00','1m',42.5),
('cpu_usage_percent','2025-10-01 09:02:00','1m',43.8),
('cpu_usage_percent','2025-10-01 09:03:00','1m',45.1),
('cpu_usage_percent','2025-10-01 09:04:00','1m',48.3),
('cpu_usage_percent','2025-10-01 09:05:00','1m',50.0),
('cpu_usage_percent','2025-10-01 09:06:00','1m',52.1),
('cpu_usage_percent','2025-10-01 09:07:00','1m',55.2),
('cpu_usage_percent','2025-10-01 09:08:00','1m',57.5),
('cpu_usage_percent','2025-10-01 09:09:00','1m',58.8),
('cpu_usage_percent','2025-10-01 09:10:00','1m',59.4),
('cpu_usage_percent','2025-10-01 09:11:00','1m',60.1),
('cpu_usage_percent','2025-10-01 09:12:00','1m',62.3),
('cpu_usage_percent','2025-10-01 09:13:00','1m',63.2),
('cpu_usage_percent','2025-10-01 09:14:00','1m',64.0),
('cpu_usage_percent','2025-10-01 09:15:00','1m',62.5),
('cpu_usage_percent','2025-10-01 09:16:00','1m',61.3),
('cpu_usage_percent','2025-10-01 09:17:00','1m',60.8),
('cpu_usage_percent','2025-10-01 09:18:00','1m',59.5),
('cpu_usage_percent','2025-10-01 09:19:00','1m',58.0);

-- memory_usage_mb
INSERT INTO monitoring_metrics (metric, bucket, bucket_interval, avg_value) VALUES
('memory_usage_mb','2025-10-01 09:00:00','1m',780),
('memory_usage_mb','2025-10-01 09:01:00','1m',790),
('memory_usage_mb','2025-10-01 09:02:00','1m',795),
('memory_usage_mb','2025-10-01 09:03:00','1m',802),
('memory_usage_mb','2025-10-01 09:04:00','1m',810),
('memory_usage_mb','2025-10-01 09:05:00','1m',815),
('memory_usage_mb','2025-10-01 09:06:00','1m',820),
('memory_usage_mb','2025-10-01 09:07:00','1m',825),
('memory_usage_mb','2025-10-01 09:08:00','1m',830),
('memory_usage_mb','2025-10-01 09:09:00','1m',835),
('memory_usage_mb','2025-10-01 09:10:00','1m',838),
('memory_usage_mb','2025-10-01 09:11:00','1m',842),
('memory_usage_mb','2025-10-01 09:12:00','1m',845),
('memory_usage_mb','2025-10-01 09:13:00','1m',850),
('memory_usage_mb','2025-10-01 09:14:00','1m',854),
('memory_usage_mb','2025-10-01 09:15:00','1m',858),
('memory_usage_mb','2025-10-01 09:16:00','1m',860),
('memory_usage_mb','2025-10-01 09:17:00','1m',862),
('memory_usage_mb','2025-10-01 09:18:00','1m',863),
('memory_usage_mb','2025-10-01 09:19:00','1m',864);

-- latency_ms
INSERT INTO monitoring_metrics (metric, bucket, bucket_interval, avg_value) VALUES
('latency_ms','2025-10-01 09:00:00','1m',130),
('latency_ms','2025-10-01 09:01:00','1m',128),
('latency_ms','2025-10-01 09:02:00','1m',132),
('latency_ms','2025-10-01 09:03:00','1m',129),
('latency_ms','2025-10-01 09:04:00','1m',135),
('latency_ms','2025-10-01 09:05:00','1m',140),
('latency_ms','2025-10-01 09:06:00','1m',138),
('latency_ms','2025-10-01 09:07:00','1m',142),
('latency_ms','2025-10-01 09:08:00','1m',148),
('latency_ms','2025-10-01 09:09:00','1m',150),
('latency_ms','2025-10-01 09:10:00','1m',152),
('latency_ms','2025-10-01 09:11:00','1m',149),
('latency_ms','2025-10-01 09:12:00','1m',155),
('latency_ms','2025-10-01 09:13:00','1m',158),
('latency_ms','2025-10-01 09:14:00','1m',160),
('latency_ms','2025-10-01 09:15:00','1m',162),
('latency_ms','2025-10-01 09:16:00','1m',161),
('latency_ms','2025-10-01 09:17:00','1m',158),
('latency_ms','2025-10-01 09:18:00','1m',156),
('latency_ms','2025-10-01 09:19:00','1m',154);

-- ===========================================
-- 3) monitoring_logs (40 records)
-- ===========================================
TRUNCATE TABLE monitoring_logs;
INSERT INTO monitoring_logs (service_name, level, message, created_at) VALUES
('station','error','Station ST001 lost connectivity','2025-10-01 09:58:12'),
('payment','warn','Payment latency above threshold','2025-10-01 09:59:01'),
('monitoring','info','Metrics collected for all services','2025-10-01 10:00:05'),
('auth','debug','Token validation for user U001','2025-10-01 10:00:20'),
('station','error','Charger CHG-02 unresponsive','2025-10-01 10:01:03'),
('station','warn','Voltage fluctuation detected','2025-10-01 10:01:45'),
('telemetry','info','Telemetry batch processed','2025-10-01 10:02:20'),
('gateway','error','Route timeout on /api/v1/session','2025-10-01 10:03:14'),
('analytics','info','Daily analytics generated','2025-10-01 10:03:50'),
('reservation','warn','Reservation queue slow','2025-10-01 10:04:31'),
('payment','error','Stripe gateway timeout','2025-10-01 10:05:12'),
('auth','info','New token issued','2025-10-01 10:06:00'),
('station','debug','Charger status OK','2025-10-01 10:06:30'),
('monitoring','error','Metrics exporter crash','2025-10-01 10:07:11'),
('user','info','New user registered','2025-10-01 10:08:00'),
('station','warn','Station ST002 power dip','2025-10-01 10:08:22'),
('notification','info','Alert sent to ops','2025-10-01 10:09:15'),
('station','error','Breaker trip detected','2025-10-01 10:10:45'),
('payment','info','Charge session settled','2025-10-01 10:11:32'),
('gateway','warn','500 spike detected','2025-10-01 10:12:14'),
('analytics','debug','Report cache refreshed','2025-10-01 10:12:50'),
('user','error','User login failed','2025-10-01 10:13:20'),
('auth','debug','Password hash verified','2025-10-01 10:13:58'),
('telemetry','warn','Slow ingestion','2025-10-01 10:14:35'),
('monitoring','info','Exporter restarted','2025-10-01 10:15:14'),
('station','error','ST003 overheat event','2025-10-01 10:16:01'),
('payment','info','Refund processed','2025-10-01 10:16:40'),
('gateway','debug','Route reload successful','2025-10-01 10:17:33'),
('analytics','warn','Missing data packet','2025-10-01 10:18:00'),
('station','info','Station ST005 stable','2025-10-01 10:18:45'),
('reservation','error','Booking conflict','2025-10-01 10:19:20'),
('auth','warn','Brute-force attempt detected','2025-10-01 10:20:01'),
('telemetry','debug','Packet drop retry','2025-10-01 10:20:40'),
('monitoring','info','Logs rotation completed','2025-10-01 10:21:01'),
('station','error','Ground fault interrupt','2025-10-01 10:21:44'),
('analytics','info','Hourly KPI computed','2025-10-01 10:22:12'),
('gateway','warn','API throttle active','2025-10-01 10:22:50'),
('payment','error','Bank endpoint slow','2025-10-01 10:23:25'),
('user','info','Profile updated','2025-10-01 10:24:00'),
('station','debug','Cooling fan speed adjusted','2025-10-01 10:24:33');

-- ===========================================
-- 4) monitoring_alerts (20 records)
-- ===========================================
TRUNCATE TABLE monitoring_alerts;
INSERT INTO monitoring_alerts (alert_id, type, status, description, triggered_at, acknowledged_at, acknowledged_by) VALUES
('ALRT-001','station_offline','firing','Station ST001 offline','2025-10-01 09:58:12',NULL,NULL),
('ALRT-002','high_cpu','acknowledged','CPU > 80%','2025-10-01 09:55:00','2025-10-01 10:05:00','ops_admin'),
('ALRT-003','high_memory','firing','Memory > 90%','2025-10-01 10:02:00',NULL,NULL),
('ALRT-004','payment_timeout','firing','Payment gateway timeout','2025-10-01 10:05:30',NULL,NULL),
('ALRT-005','station_overheat','acknowledged','Charger overheating','2025-10-01 10:06:10','2025-10-01 10:10:00','ops1'),
('ALRT-006','gateway_5xx','firing','High 5xx rate','2025-10-01 10:07:22',NULL,NULL),
('ALRT-007','low_voltage','firing','Voltage < threshold','2025-10-01 10:08:15',NULL,NULL),
('ALRT-008','telemetry_drop','acknowledged','Telemetry dropping packets','2025-10-01 10:09:40','2025-10-01 10:14:00','ops_admin'),
('ALRT-009','reservation_failure','firing','High booking failure','2025-10-01 10:10:55',NULL,NULL),
('ALRT-010','user_login_fail','firing','Multiple user login failures','2025-10-01 10:11:12',NULL,NULL),
('ALRT-011','station_ground_fault','acknowledged','Ground fault detected','2025-10-01 10:12:00','2025-10-01 10:16:00','ops2'),
('ALRT-012','alert_delivery_failed','firing','Notification delivery failed','2025-10-01 10:12:45',NULL,NULL),
('ALRT-013','breaker_trip','firing','Breaker trip event','2025-10-01 10:13:25',NULL,NULL),
('ALRT-014','fraud_attempt','acknowledged','Suspicious payment pattern','2025-10-01 10:13:58','2025-10-01 10:17:20','security_bot'),
('ALRT-015','station_power_dip','firing','Power dip detected','2025-10-01 10:14:33',NULL,NULL),
('ALRT-016','bank_timeout','firing','Bank endpoint slow','2025-10-01 10:15:40',NULL,NULL),
('ALRT-017','cooling_failure','firing','Cooling system not responding','2025-10-01 10:16:22',NULL,NULL),
('ALRT-018','overcurrent','acknowledged','Overcurrent detected','2025-10-01 10:17:01','2025-10-01 10:19:30','ops_admin'),
('ALRT-019','malformed_packet','firing','Malformed telemetry packet','2025-10-01 10:17:44',NULL,NULL),
('ALRT-020','filesystem_full','firing','Disk usage > 95%','2025-10-01 10:18:55',NULL,NULL);

-- ===========================================
-- 5) user_monthly_reports (25 records)
-- ===========================================
TRUNCATE TABLE user_monthly_reports;

INSERT INTO user_monthly_reports (user_id, billing_month, total_cost, total_sessions) VALUES
('U001', '2025-07', 900000, 10),
('U001', '2025-08', 950000, 11),
('U001', '2025-09', 1100000, 13),
('U001', '2025-10', 1250000, 14),

('U002', '2025-07', 450000, 6),
('U002', '2025-08', 470000, 7),
('U002', '2025-09', 500000, 8),
('U002', '2025-10', 520000, 9),

('U003', '2025-07', 700000, 8),
('U003', '2025-08', 720000, 9),
('U003', '2025-09', 780000, 10),
('U003', '2025-10', 820000, 11),

('U004', '2025-07', 650000, 7),
('U004', '2025-08', 680000, 8),
('U004', '2025-09', 720000, 9),
('U004', '2025-10', 760000, 10),

('U005', '2025-07', 500000, 6),
('U005', '2025-08', 530000, 7),
('U005', '2025-09', 560000, 8),
('U005', '2025-10', 590000, 9),

('U006', '2025-07', 820000, 9),
('U006', '2025-08', 850000, 10),
('U006', '2025-09', 900000, 11),
('U006', '2025-10', 950000, 12),

('U007', '2025-07', 400000, 5),
('U007', '2025-08', 420000, 6),
('U007', '2025-09', 450000, 7),
('U007', '2025-10', 480000, 8),

('U008', '2025-07', 720000, 8),
('U008', '2025-08', 760000, 9),
('U008', '2025-09', 800000, 10),
('U008', '2025-10', 840000, 11),

('U009', '2025-07', 880000, 9),
('U009', '2025-08', 910000, 10),
('U009', '2025-09', 960000, 11),
('U009', '2025-10', 1010000, 12),

('U010', '2025-07', 560000, 6),
('U010', '2025-08', 590000, 7),
('U010', '2025-09', 630000, 8),
('U010', '2025-10', 670000, 9);



-- ===========================================
-- 6) station_daily_reports (25 records)
-- ===========================================
TRUNCATE TABLE station_daily_reports;

INSERT INTO station_daily_reports (station_id, report_date, total_kwh, sessions, revenue) VALUES
-- =========================
-- ST001 (13 records)
-- =========================
('ST001', '2025-07-01', 1200, 40, 850000),
('ST001', '2025-07-15', 1250, 42, 880000),
('ST001', '2025-07-25', 1280, 43, 900000),

('ST001', '2025-08-01', 1300, 43, 900000),
('ST001', '2025-08-15', 1320, 44, 920000),
('ST001', '2025-08-25', 1350, 45, 950000),

('ST001', '2025-09-01', 1400, 45, 1100000),
('ST001', '2025-09-15', 1420, 46, 1150000),
('ST001', '2025-09-20', 1450, 47, 1200000),

('ST001', '2025-10-01', 1500, 47, 1250000),
('ST001', '2025-10-05', 1520, 48, 1300000),
('ST001', '2025-10-15', 1550, 50, 1350000),
('ST001', '2025-10-25', 1580, 51, 1380000),

-- =========================
-- ST002 (7 records)
-- =========================
('ST002', '2025-07-10', 900, 28, 550000),
('ST002', '2025-07-25', 950, 29, 580000),

('ST002', '2025-08-05', 980, 30, 600000),

('ST002', '2025-09-01', 1000, 30, 600000),
('ST002', '2025-09-20', 1030, 33, 650000),

('ST002', '2025-10-01', 1020, 32, 650000),
('ST002', '2025-10-20', 1070, 35, 690000),

-- =========================
-- ST003 (7 records)
-- =========================
('ST003', '2025-07-12', 980, 30, 600000),

('ST003', '2025-08-18', 1050, 32, 650000),

('ST003', '2025-09-10', 1100, 34, 700000),
('ST003', '2025-09-22', 1180, 37, 720000),

('ST003', '2025-10-10', 1150, 36, 750000),
('ST003', '2025-10-20', 1200, 38, 760000),
('ST003', '2025-10-25', 1230, 40, 780000),

-- =========================
-- ST004 (4 records)
-- =========================
('ST004', '2025-07-05', 800, 25, 500000),
('ST004', '2025-08-15', 850, 27, 540000),
('ST004', '2025-09-10', 900, 28, 580000),
('ST004', '2025-10-10', 950, 30, 620000),

-- =========================
-- ST005 (4 records)
-- =========================
('ST005', '2025-07-08', 780, 24, 480000),
('ST005', '2025-08-12', 820, 26, 510000),
('ST005', '2025-09-18', 860, 28, 550000),
('ST005', '2025-10-18', 920, 30, 600000),

-- =========================
-- ST006 (4 records)
-- =========================
('ST006', '2025-07-02', 1000, 32, 650000),
('ST006', '2025-08-08', 1050, 34, 700000),
('ST006', '2025-09-14', 1120, 36, 740000),
('ST006', '2025-10-14', 1180, 38, 780000),

-- =========================
-- ST007 (4 records)
-- =========================
('ST007', '2025-07-09', 720, 22, 460000),
('ST007', '2025-08-19', 760, 24, 490000),
('ST007', '2025-09-23', 810, 26, 530000),
('ST007', '2025-10-23', 860, 28, 570000),

-- =========================
-- ST008 (4 records)
-- =========================
('ST008', '2025-07-11', 950, 30, 620000),
('ST008', '2025-08-16', 1000, 32, 660000),
('ST008', '2025-09-21', 1050, 34, 700000),
('ST008', '2025-10-21', 1100, 36, 740000),

-- =========================
-- ST009 (4 records)
-- =========================
('ST009', '2025-07-14', 880, 28, 580000),
('ST009', '2025-08-20', 920, 30, 620000),
('ST009', '2025-09-25', 960, 32, 660000),
('ST009', '2025-10-25', 1000, 34, 700000),

-- =========================
-- ST010 (4 records)
-- =========================
('ST010', '2025-07-18', 1020, 33, 680000),
('ST010', '2025-08-22', 1080, 35, 720000),
('ST010', '2025-09-28', 1130, 37, 760000),
('ST010', '2025-10-28', 1180, 39, 800000);
