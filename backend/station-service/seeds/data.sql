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
INSERT INTO stations (id, name, address, city, region, latitude, longitude, status, updated_at)
VALUES
('11111111-1111-1111-1111-111111111111', 'Trạm Sạc Tây Ninh', '123 Đường 30/4', 'Tây Ninh', 'Miền Nam', 11.1234567, 106.1234567, 'active', NOW()),
('22222222-2222-2222-2222-222222222222', 'Trạm Sạc Gò Dầu', '456 Quốc lộ 22B', 'Tây Ninh', 'Miền Nam', 11.1000000, 106.2000000, 'active', NOW());

INSERT INTO charging_points (id, name, station_id, external_id, connector_type, max_power_kw, status, price_per_kwh, price_per_minute, updated_at)
VALUES
('cp-001','HCM001', '11111111-1111-1111-1111-111111111111', 'EXT-001', 'CCS', 50.00, 'available', 3.50, 0.50, NOW()),
('cp-002', 'HCM002', '11111111-1111-1111-1111-111111111111', 'EXT-002', 'Type2', 22.00, 'available', 2.00, 0.30, NOW()),
('cp-003', 'HCM003', '22222222-2222-2222-2222-222222222222', 'EXT-003', 'CHAdeMO', 100.00, 'available', 4.00, 0.60, NOW());

INSERT INTO station_staff (id, staff_user_id, station_id, role)
VALUES
('staff-001', 'user-001', '11111111-1111-1111-1111-111111111111', 'manager'),
('staff-002', 'user-002', '22222222-2222-2222-2222-222222222222', 'technician');

INSERT INTO station_incidents (id, station_id, point_id, reported_by, description, severity, status)
VALUES
('incident-001', '11111111-1111-1111-1111-111111111111', 'cp-001', 'user-003', 'Không thể khởi động sạc', 'high', 'in_progress'),
('incident-002', '22222222-2222-2222-2222-222222222222', NULL, 'user-004', 'Mất điện toàn trạm', 'critical', 'resolved');

INSERT INTO station_usage_reports (id, station_id, report_date, total_sessions, total_kwh, total_revenue)
VALUES
('report-001', '11111111-1111-1111-1111-111111111111', '2025-10-22 00:00:00', 15, 120.50, 420.00),
('report-002', '22222222-2222-2222-2222-222222222222', '2025-10-22 00:00:00', 8, 75.00, 260.00);
