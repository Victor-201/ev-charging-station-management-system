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

