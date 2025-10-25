-- Seed bảng stations
INSERT INTO stations (id, name, address, city, region, latitude, longitude, status, updated_at)
VALUES
('11111111-1111-1111-1111-111111111111', 'Trạm Sạc Tây Ninh', '123 Đường 30/4', 'Tây Ninh', 'Miền Nam', 11.1234567, 106.1234567, 'active', NOW()),
('22222222-2222-2222-2222-222222222222', 'Trạm Sạc Gò Dầu', '456 Quốc lộ 22B', 'Tây Ninh', 'Miền Nam', 11.1000000, 106.2000000, 'active', NOW());

-- Seed bảng charging_points
INSERT INTO charging_points (id, station_id, external_id, connector_type, max_power_kw, status, price_per_kwh, price_per_minute, updated_at)
VALUES
('cp-001', '11111111-1111-1111-1111-111111111111', 'EXT-001', 'CCS', 50.00, 'available', 3.50, 0.50, NOW()),
('cp-002', '11111111-1111-1111-1111-111111111111', 'EXT-002', 'Type2', 22.00, 'available', 2.00, 0.30, NOW()),
('cp-003', '22222222-2222-2222-2222-222222222222', 'EXT-003', 'CHAdeMO', 100.00, 'available', 4.00, 0.60, NOW());

-- Seed bảng station_staff
INSERT INTO station_staff (id, staff_user_id, station_id, role)
VALUES
('staff-001', 'user-001', '11111111-1111-1111-1111-111111111111', 'manager'),
('staff-002', 'user-002', '22222222-2222-2222-2222-222222222222', 'technician');

-- Seed bảng station_incidents
INSERT INTO station_incidents (id, station_id, point_id, reported_by, description, severity, status)
VALUES
('incident-001', '11111111-1111-1111-1111-111111111111', 'cp-001', 'user-003', 'Không thể khởi động sạc', 'high', 'open'),
('incident-002', '22222222-2222-2222-2222-222222222222', NULL, 'user-004', 'Mất điện toàn trạm', 'critical', 'open');

-- Seed bảng station_usage_reports
INSERT INTO station_usage_reports (id, station_id, report_date, total_sessions, total_kwh, total_revenue)
VALUES
('report-001', '11111111-1111-1111-1111-111111111111', '2025-10-22 00:00:00', 15, 120.50, 420.00),
('report-002', '22222222-2222-2222-2222-222222222222', '2025-10-22 00:00:00', 8, 75.00, 260.00);
