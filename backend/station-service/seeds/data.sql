-- Tables creation
DROP TABLE IF EXISTS `_prisma_migrations`;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) NOT NULL,
  `checksum` varchar(64) NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) NOT NULL,
  `logs` text,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `stations`;
CREATE TABLE `stations` (
  `id` char(36) NOT NULL,
  `name` varchar(191) NOT NULL,
  `address` varchar(500) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `region` varchar(100) DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `status` enum('active','closed','maintenance','inactive') NOT NULL DEFAULT 'active',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `stations_address_latitude_longitude_key` (`address`,`latitude`,`longitude`),
  KEY `idx_stations_city` (`city`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `charging_points`;
CREATE TABLE `charging_points` (
  `id` char(36) NOT NULL,
  `name` char(50) NOT NULL,
  `station_id` char(36) NOT NULL,
  `external_id` varchar(100) DEFAULT NULL,
  `connector_type` varchar(50) DEFAULT NULL,
  `max_power_kw` decimal(8,2) DEFAULT NULL,
  `status` enum('available','in_use','offline','faulted','reserved') NOT NULL DEFAULT 'available',
  `price_per_kwh` decimal(10,2) DEFAULT NULL,
  `price_per_minute` decimal(10,2) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `charging_points_external_id_key` (`external_id`),
  KEY `idx_cp_stationid` (`station_id`),
  CONSTRAINT `charging_points_station_id_fkey` FOREIGN KEY (`station_id`) REFERENCES `stations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `station_staff`;
CREATE TABLE `station_staff` (
  `id` char(36) NOT NULL,
  `staff_user_id` char(36) NOT NULL,
  `station_id` char(36) NOT NULL,
  `role` enum('manager','technician','operator','security') DEFAULT NULL,
  `assigned_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_station_staff` (`station_id`),
  CONSTRAINT `station_staff_station_id_fkey` FOREIGN KEY (`station_id`) REFERENCES `stations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `station_incidents`;
CREATE TABLE `station_incidents` (
  `id` char(36) NOT NULL,
  `station_id` char(36) NOT NULL,
  `point_id` char(36) DEFAULT NULL,
  `reported_by` char(36) DEFAULT NULL,
  `description` varchar(191) DEFAULT NULL,
  `severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
  `status` enum('pending_confirmation','in_progress','resolved','rejected') NOT NULL DEFAULT 'pending_confirmation',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `resolved_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_incidents_station` (`station_id`),
  KEY `station_incidents_point_id_fkey` (`point_id`),
  CONSTRAINT `station_incidents_point_id_fkey` FOREIGN KEY (`point_id`) REFERENCES `charging_points` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `station_incidents_station_id_fkey` FOREIGN KEY (`station_id`) REFERENCES `stations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `station_usage_reports`;
CREATE TABLE `station_usage_reports` (
  `id` char(36) NOT NULL,
  `station_id` char(36) NOT NULL,
  `report_date` datetime(3) NOT NULL,
  `total_sessions` int NOT NULL DEFAULT '0',
  `total_kwh` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total_revenue` decimal(12,2) NOT NULL DEFAULT '0.00',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `station_usage_reports_station_id_report_date_key` (`station_id`,`report_date`),
  CONSTRAINT `station_usage_reports_station_id_fkey` FOREIGN KEY (`station_id`) REFERENCES `stations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `station_maintenance`;
CREATE TABLE `station_maintenance` (
  `id` varchar(191) NOT NULL,
  `station_id` varchar(191) NOT NULL,
  `start_time` datetime(3) NOT NULL,
  `end_time` datetime(3) NOT NULL,
  `reason` varchar(191) NOT NULL,
  `scheduled_by` varchar(191) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `station_maintenance_station_id_fkey` (`station_id`),
  CONSTRAINT `station_maintenance_station_id_fkey` FOREIGN KEY (`station_id`) REFERENCES `stations` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `outbox_events`;
CREATE TABLE `outbox_events` (
  `id` char(36) NOT NULL,
  `aggregate_type` varchar(100) DEFAULT NULL,
  `aggregate_id` char(36) DEFAULT NULL,
  `event_type` varchar(100) DEFAULT NULL,
  `payload` json DEFAULT NULL,
  `published` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Inserts

-- Stations
INSERT INTO stations (id, name, address, city, region, latitude, longitude, status, updated_at)
VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Trạm Sạc Tây Ninh', '123 Đường 30/4', 'Tây Ninh', 'Miền Nam', 11.1234567, 106.1234567, 'active', NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'Trạm Sạc Gò Dầu', '456 Quốc lộ 22B', 'Tây Ninh', 'Miền Nam', 11.1000000, 106.2000000, 'active', NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'Trạm Sạc Châu Thành', '789 Tỉnh lộ 784', 'Tây Ninh', 'Miền Nam', 11.2500000, 106.3500000, 'active', NOW()),
('550e8400-e29b-41d4-a716-446655440004', 'Trạm Sạc Dương Minh Châu', '321 Quốc lộ 22', 'Tây Ninh', 'Miền Nam', 11.3000000, 106.4000000, 'maintenance', NOW()),
('550e8400-e29b-41d4-a716-446655440005', 'Trạm Sạc Trảng Bàng', '555 Đường Hùng Vương', 'Tây Ninh', 'Miền Nam', 11.0500000, 106.5000000, 'active', NOW());

-- Charging Points
INSERT INTO charging_points (id, name, station_id, external_id, connector_type, max_power_kw, status, price_per_kwh, price_per_minute, updated_at)
VALUES
-- Station 1: Trạm Sạc Tây Ninh
('6ba7b810-9dad-11d1-80b4-00c04fd430c1', 'TN-CP-001', '550e8400-e29b-41d4-a716-446655440001', 'EXT-001', 'CCS', 50.00, 'available', 3.50, 0.50, NOW()),
('6ba7b810-9dad-11d1-80b4-00c04fd430c2', 'TN-CP-002', '550e8400-e29b-41d4-a716-446655440001', 'EXT-002', 'Type2', 22.00, 'available', 2.00, 0.30, NOW()),
('6ba7b810-9dad-11d1-80b4-00c04fd430c3', 'TN-CP-003', '550e8400-e29b-41d4-a716-446655440001', 'EXT-003', 'CHAdeMO', 50.00, 'in_use', 3.50, 0.50, NOW()),

-- Station 2: Trạm Sạc Gò Dầu
('6ba7b810-9dad-11d1-80b4-00c04fd430c4', 'GD-CP-001', '550e8400-e29b-41d4-a716-446655440002', 'EXT-004', 'CCS', 100.00, 'available', 4.00, 0.60, NOW()),
('6ba7b810-9dad-11d1-80b4-00c04fd430c5', 'GD-CP-002', '550e8400-e29b-41d4-a716-446655440002', 'EXT-005', 'Type2', 22.00, 'available', 2.20, 0.35, NOW()),

-- Station 3: Trạm Sạc Châu Thành
('6ba7b810-9dad-11d1-80b4-00c04fd430c6', 'CT-CP-001', '550e8400-e29b-41d4-a716-446655440003', 'EXT-006', 'CCS', 60.00, 'available', 3.80, 0.55, NOW()),
('6ba7b810-9dad-11d1-80b4-00c04fd430c7', 'CT-CP-002', '550e8400-e29b-41d4-a716-446655440003', 'EXT-007', 'Type2', 22.00, 'available', 2.20, 0.35, NOW()),
('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'CT-CP-003', '550e8400-e29b-41d4-a716-446655440003', 'EXT-008', 'CHAdeMO', 50.00, 'available', 3.50, 0.50, NOW()),

-- Station 4: Trạm Sạc Dương Minh Châu (maintenance)
('6ba7b810-9dad-11d1-80b4-00c04fd430c9', 'DMC-CP-001', '550e8400-e29b-41d4-a716-446655440004', 'EXT-009', 'CCS', 120.00, 'offline', 4.50, 0.70, NOW()),
('6ba7b810-9dad-11d1-80b4-00c04fd430ca', 'DMC-CP-002', '550e8400-e29b-41d4-a716-446655440004', 'EXT-010', 'Type2', 11.00, 'offline', 1.80, 0.25, NOW()),

-- Station 5: Trạm Sạc Trảng Bàng
('6ba7b810-9dad-11d1-80b4-00c04fd430cb', 'TB-CP-001', '550e8400-e29b-41d4-a716-446655440005', 'EXT-011', 'CCS', 150.00, 'available', 5.00, 0.80, NOW()),
('6ba7b810-9dad-11d1-80b4-00c04fd430cc', 'TB-CP-002', '550e8400-e29b-41d4-a716-446655440005', 'EXT-012', 'CHAdeMO', 100.00, 'available', 4.20, 0.65, NOW()),
('6ba7b810-9dad-11d1-80b4-00c04fd430cd', 'TB-CP-003', '550e8400-e29b-41d4-a716-446655440005', 'EXT-013', 'Type2', 22.00, 'reserved', 2.50, 0.40, NOW());

-- Station Staff
INSERT INTO station_staff (id, staff_user_id, station_id, role)
VALUES
-- Station 1: Trạm Sạc Tây Ninh
('7c9e6679-7425-40de-944b-e07fc1f90ae1', '8f7e5b32-1a9c-4d6e-9f2a-3b4c5d6e7f81', '550e8400-e29b-41d4-a716-446655440001', 'manager'),
('7c9e6679-7425-40de-944b-e07fc1f90ae2', '8f7e5b32-1a9c-4d6e-9f2a-3b4c5d6e7f82', '550e8400-e29b-41d4-a716-446655440001', 'technician'),

-- Station 2: Trạm Sạc Gò Dầu
('7c9e6679-7425-40de-944b-e07fc1f90ae3', '8f7e5b32-1a9c-4d6e-9f2a-3b4c5d6e7f83', '550e8400-e29b-41d4-a716-446655440002', 'manager'),
('7c9e6679-7425-40de-944b-e07fc1f90ae4', '8f7e5b32-1a9c-4d6e-9f2a-3b4c5d6e7f84', '550e8400-e29b-41d4-a716-446655440002', 'technician'),

-- Station 3: Trạm Sạc Châu Thành
('7c9e6679-7425-40de-944b-e07fc1f90ae5', '8f7e5b32-1a9c-4d6e-9f2a-3b4c5d6e7f85', '550e8400-e29b-41d4-a716-446655440003', 'manager'),
('7c9e6679-7425-40de-944b-e07fc1f90ae6', '8f7e5b32-1a9c-4d6e-9f2a-3b4c5d6e7f86', '550e8400-e29b-41d4-a716-446655440003', 'technician'),

-- Station 4: Trạm Sạc Dương Minh Châu
('7c9e6679-7425-40de-944b-e07fc1f90ae7', '8f7e5b32-1a9c-4d6e-9f2a-3b4c5d6e7f87', '550e8400-e29b-41d4-a716-446655440004', 'manager'),
('7c9e6679-7425-40de-944b-e07fc1f90ae8', '8f7e5b32-1a9c-4d6e-9f2a-3b4c5d6e7f88', '550e8400-e29b-41d4-a716-446655440004', 'operator'),

-- Station 5: Trạm Sạc Trảng Bàng
('7c9e6679-7425-40de-944b-e07fc1f90ae9', '8f7e5b32-1a9c-4d6e-9f2a-3b4c5d6e7f89', '550e8400-e29b-41d4-a716-446655440005', 'manager'),
('7c9e6679-7425-40de-944b-e07fc1f90aea', '8f7e5b32-1a9c-4d6e-9f2a-3b4c5d6e7f8a', '550e8400-e29b-41d4-a716-446655440005', 'technician'),
('7c9e6679-7425-40de-944b-e07fc1f90aeb', '8f7e5b32-1a9c-4d6e-9f2a-3b4c5d6e7f8b', '550e8400-e29b-41d4-a716-446655440005', 'security');

-- Station Incidents
INSERT INTO station_incidents (id, station_id, point_id, reported_by, description, severity, status)
VALUES
('9f8e7d6c-5b4a-3c2b-1a09-8f7e6d5c4b3a', '550e8400-e29b-41d4-a716-446655440001', '6ba7b810-9dad-11d1-80b4-00c04fd430c1', '8f7e5b32-1a9c-4d6e-9f2a-3b4c5d6e7f91', 'Không thể khởi động sạc', 'high', 'in_progress'),
('9f8e7d6c-5b4a-3c2b-1a09-8f7e6d5c4b3b', '550e8400-e29b-41d4-a716-446655440002', NULL, '8f7e5b32-1a9c-4d6e-9f2a-3b4c5d6e7f92', 'Mất điện toàn trạm', 'critical', 'resolved'),
('9f8e7d6c-5b4a-3c2b-1a09-8f7e6d5c4b3c', '550e8400-e29b-41d4-a716-446655440001', '6ba7b810-9dad-11d1-80b4-00c04fd430c2', '8f7e5b32-1a9c-4d6e-9f2a-3b4c5d6e7f93', 'Cáp sạc bị hỏng', 'medium', 'pending_confirmation'),
('9f8e7d6c-5b4a-3c2b-1a09-8f7e6d5c4b3d', '550e8400-e29b-41d4-a716-446655440003', '6ba7b810-9dad-11d1-80b4-00c04fd430c6', '8f7e5b32-1a9c-4d6e-9f2a-3b4c5d6e7f94', 'Màn hình không hoạt động', 'low', 'in_progress'),
('9f8e7d6c-5b4a-3c2b-1a09-8f7e6d5c4b3e', '550e8400-e29b-41d4-a716-446655440005', '6ba7b810-9dad-11d1-80b4-00c04fd430cb', '8f7e5b32-1a9c-4d6e-9f2a-3b4c5d6e7f95', 'Lỗi thanh toán', 'high', 'resolved');

-- Station Usage Reports
INSERT INTO station_usage_reports (id, station_id, report_date, total_sessions, total_kwh, total_revenue)
VALUES
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', '550e8400-e29b-41d4-a716-446655440001', '2025-11-01 00:00:00', 15, 120.50, 420.00),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5e', '550e8400-e29b-41d4-a716-446655440002', '2025-11-01 00:00:00', 8, 75.00, 260.00),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5f', '550e8400-e29b-41d4-a716-446655440003', '2025-11-01 00:00:00', 12, 95.30, 332.00),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c60', '550e8400-e29b-41d4-a716-446655440001', '2025-11-02 00:00:00', 18, 145.20, 508.00),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c61', '550e8400-e29b-41d4-a716-446655440002', '2025-11-02 00:00:00', 10, 88.50, 309.00),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c62', '550e8400-e29b-41d4-a716-446655440005', '2025-11-01 00:00:00', 22, 198.70, 695.00),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c63', '550e8400-e29b-41d4-a716-446655440005', '2025-11-02 00:00:00', 25, 225.40, 788.00);

-- Station Maintenance
INSERT INTO station_maintenance (id, station_id, start_time, end_time, reason, scheduled_by)
VALUES
('b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', '550e8400-e29b-41d4-a716-446655440001', '2025-11-10 08:00:00', '2025-11-10 12:00:00', 'Bảo trì định kỳ hệ thống sạc', '8f7e5b32-1a9c-4d6e-9f2a-3b4c5d6e7f81'),
('b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6f', '550e8400-e29b-41d4-a716-446655440001', '2025-11-15 14:00:00', '2025-11-15 16:00:00', 'Kiểm tra và thay thế cáp sạc', '8f7e5b32-1a9c-4d6e-9f2a-3b4c5d6e7f81'),
('b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d70', '550e8400-e29b-41d4-a716-446655440002', '2025-11-12 09:00:00', '2025-11-12 11:30:00', 'Vệ sinh và kiểm tra hệ thống làm mát', '8f7e5b32-1a9c-4d6e-9f2a-3b4c5d6e7f83'),
('b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d71', '550e8400-e29b-41d4-a716-446655440003', '2025-11-18 08:00:00', '2025-11-18 12:00:00', 'Kiểm tra charging points CCS', '8f7e5b32-1a9c-4d6e-9f2a-3b4c5d6e7f85'),
('b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d72', '550e8400-e29b-41d4-a716-446655440004', '2025-11-10 07:00:00', '2025-11-10 17:00:00', 'Bảo trì toàn bộ trạm', '8f7e5b32-1a9c-4d6e-9f2a-3b4c5d6e7f87'),
('b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d73', '550e8400-e29b-41d4-a716-446655440005', '2025-11-25 06:00:00', '2025-11-25 08:00:00', 'Bảo trì hệ thống backup điện', '8f7e5b32-1a9c-4d6e-9f2a-3b4c5d6e7f89');

-- Outbox Events
INSERT INTO outbox_events (id, aggregate_type, aggregate_id, event_type, payload, published)
VALUES
('c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f', 'Station', '550e8400-e29b-41d4-a716-446655440001', 'StationCreated', '{"stationId": "550e8400-e29b-41d4-a716-446655440001", "name": "Trạm Sạc Tây Ninh", "city": "Tây Ninh", "status": "active", "timestamp": "2025-11-01T08:00:00.000Z"}', 1),
('c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e80', 'Station', '550e8400-e29b-41d4-a716-446655440002', 'StationCreated', '{"stationId": "550e8400-e29b-41d4-a716-446655440002", "name": "Trạm Sạc Gò Dầu", "city": "Tây Ninh", "status": "active", "timestamp": "2025-11-01T09:00:00.000Z"}', 1),
('c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e81', 'ChargingPoint', '6ba7b810-9dad-11d1-80b4-00c04fd430c1', 'ChargingPointAdded', '{"chargingPointId": "6ba7b810-9dad-11d1-80b4-00c04fd430c1", "stationId": "550e8400-e29b-41d4-a716-446655440001", "connectorType": "CCS", "maxPowerKw": 50.00, "status": "available", "timestamp": "2025-11-01T08:30:00.000Z"}', 1),
('c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e82', 'Station', '550e8400-e29b-41d4-a716-446655440004', 'StationStatusChanged', '{"stationId": "550e8400-e29b-41d4-a716-446655440004", "oldStatus": "active", "newStatus": "maintenance", "reason": "Scheduled maintenance", "timestamp": "2025-11-10T07:00:00.000Z"}', 1),
('c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e83', 'ChargingPoint', '6ba7b810-9dad-11d1-80b4-00c04fd430c3', 'ChargingPointStatusChanged', '{"chargingPointId": "6ba7b810-9dad-11d1-80b4-00c04fd430c3", "stationId": "550e8400-e29b-41d4-a716-446655440001", "oldStatus": "available", "newStatus": "in_use", "timestamp": "2025-11-12T14:30:00.000Z"}', 1),
('c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e84', 'ChargingPoint', '6ba7b810-9dad-11d1-80b4-00c04fd430cb', 'ChargingPointPriceUpdated', '{"chargingPointId": "6ba7b810-9dad-11d1-80b4-00c04fd430cb", "stationId": "550e8400-e29b-41d4-a716-446655440005", "oldPricePerKwh": 5.00, "newPricePerKwh": 4.80, "timestamp": "2025-11-14T10:00:00.000Z"}', 0),
('c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e85', 'Maintenance', 'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', 'MaintenanceScheduled', '{"maintenanceId": "b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e", "stationId": "550e8400-e29b-41d4-a716-446655440001", "startTime": "2025-11-10T08:00:00.000Z", "endTime": "2025-11-10T12:00:00.000Z", "reason": "Bảo trì định kỳ hệ thống sạc"}', 1);
