-- MySQL dump 10.13  Distrib 8.0.40, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: station_service
-- ------------------------------------------------------
-- Server version	9.1.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `_prisma_migrations`
--

DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` text COLLATE utf8mb4_unicode_ci,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_prisma_migrations`
--

LOCK TABLES `_prisma_migrations` WRITE;
/*!40000 ALTER TABLE `_prisma_migrations` DISABLE KEYS */;
INSERT INTO `_prisma_migrations` VALUES ('1d4c1515-149d-4b6a-9802-0fe6e3532cdd','db41c88bb9e9d4871416467ff173ef8ff5fc3ab7d448081eb38e2c641e518587','2025-10-30 12:50:05.881','20251024155806_add_station_maintenance_table',NULL,NULL,'2025-10-30 12:50:05.830',1),('37f403b7-9a0e-417e-b183-325a8660cc44','5d76ce39662b41efd878bc7ac78e973864d7a109359b74abbc7b749a6b15cf0c','2025-10-30 12:50:08.234','20251030125008_refact_enum_values',NULL,NULL,'2025-10-30 12:50:08.139',1),('452e896b-c08c-42d8-8de9-de1c6f46f596','88fa1bc2080c2ea25031f2bb7edae582f1590e45cc341befb0e401be602ba906','2025-10-30 12:50:05.806','20251022092508_init_database',NULL,NULL,'2025-10-30 12:50:05.524',1),('7ea44d75-2936-4d7d-baca-7999915d56d0','c7ad1a1e3efb9484f30004b69c421d72e64550607675a5b5df966df592baedc4','2025-10-30 12:50:05.828','20251023160449_add_unique_constraint_to_stations',NULL,NULL,'2025-10-30 12:50:05.808',1),('a3b2a032-b56d-4261-9eb4-ad9633e97d0a','39e000f170cbb37b152326cddf4c8a46f8caaba1fad549e3c57f884aceb2f4e6','2025-10-30 12:50:06.145','20251030121925_add_enum_in_db',NULL,NULL,'2025-10-30 12:50:05.882',1);
/*!40000 ALTER TABLE `_prisma_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `charging_points`
--

DROP TABLE IF EXISTS `charging_points`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `charging_points` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `station_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `external_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `connector_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `max_power_kw` decimal(8,2) DEFAULT NULL,
  `status` enum('available','in_use','offline','faulted','reserved') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'available',
  `price_per_kwh` decimal(10,2) DEFAULT NULL,
  `overstay_fee_per_minute` decimal(10,2) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `charging_points_external_id_key` (`external_id`),
  KEY `idx_cp_stationid` (`station_id`),
  CONSTRAINT `charging_points_station_id_fkey` FOREIGN KEY (`station_id`) REFERENCES `stations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `charging_points`
--

LOCK TABLES `charging_points` WRITE;
/*!40000 ALTER TABLE `charging_points` DISABLE KEYS */;
/*!40000 ALTER TABLE `charging_points` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `outbox_events`
--

DROP TABLE IF EXISTS `outbox_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `outbox_events` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `aggregate_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `aggregate_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `event_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payload` json DEFAULT NULL,
  `published` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `outbox_events`
--

LOCK TABLES `outbox_events` WRITE;
/*!40000 ALTER TABLE `outbox_events` DISABLE KEYS */;
/*!40000 ALTER TABLE `outbox_events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `station_incidents`
--

DROP TABLE IF EXISTS `station_incidents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `station_incidents` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `station_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `point_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reported_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `severity` enum('low','medium','high','critical') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'medium',
  `status` enum('pending_confirmation','in_progress','resolved','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending_confirmation',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `resolved_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_incidents_station` (`station_id`),
  KEY `station_incidents_point_id_fkey` (`point_id`),
  CONSTRAINT `station_incidents_point_id_fkey` FOREIGN KEY (`point_id`) REFERENCES `charging_points` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `station_incidents_station_id_fkey` FOREIGN KEY (`station_id`) REFERENCES `stations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `station_incidents`
--

LOCK TABLES `station_incidents` WRITE;
/*!40000 ALTER TABLE `station_incidents` DISABLE KEYS */;
/*!40000 ALTER TABLE `station_incidents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `station_maintenance`
--

DROP TABLE IF EXISTS `station_maintenance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `station_maintenance` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `station_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_time` datetime(3) NOT NULL,
  `end_time` datetime(3) NOT NULL,
  `reason` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `scheduled_by` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `station_maintenance_station_id_fkey` (`station_id`),
  CONSTRAINT `station_maintenance_station_id_fkey` FOREIGN KEY (`station_id`) REFERENCES `stations` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `station_maintenance`
--

LOCK TABLES `station_maintenance` WRITE;
/*!40000 ALTER TABLE `station_maintenance` DISABLE KEYS */;
/*!40000 ALTER TABLE `station_maintenance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `station_staff`
--

DROP TABLE IF EXISTS `station_staff`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `station_staff` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `staff_user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `station_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('manager','technician','operator','security') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `assigned_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_station_staff` (`station_id`),
  CONSTRAINT `station_staff_station_id_fkey` FOREIGN KEY (`station_id`) REFERENCES `stations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `station_staff`
--

LOCK TABLES `station_staff` WRITE;
/*!40000 ALTER TABLE `station_staff` DISABLE KEYS */;
/*!40000 ALTER TABLE `station_staff` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `station_usage_reports`
--

DROP TABLE IF EXISTS `station_usage_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `station_usage_reports` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `station_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `report_date` datetime(3) NOT NULL,
  `total_sessions` int NOT NULL DEFAULT '0',
  `total_kwh` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total_revenue` decimal(12,2) NOT NULL DEFAULT '0.00',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `station_usage_reports_station_id_report_date_key` (`station_id`,`report_date`),
  CONSTRAINT `station_usage_reports_station_id_fkey` FOREIGN KEY (`station_id`) REFERENCES `stations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `station_usage_reports`
--

LOCK TABLES `station_usage_reports` WRITE;
/*!40000 ALTER TABLE `station_usage_reports` DISABLE KEYS */;
/*!40000 ALTER TABLE `station_usage_reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stations`
--

DROP TABLE IF EXISTS `stations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stations` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `region` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `status` enum('active','closed','maintenance','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `stations_address_latitude_longitude_key` (`address`,`latitude`,`longitude`),
  KEY `idx_stations_city` (`city`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stations`
--

LOCK TABLES `stations` WRITE;
/*!40000 ALTER TABLE `stations` DISABLE KEYS */;
/*!40000 ALTER TABLE `stations` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-30 19:50:57


-- Insert seeds for stations below

INSERT INTO stations (id, name, address, city, region, latitude, longitude, status, updated_at)
VALUES
('11111111-1111-1111-1111-111111111111', 'Trạm Sạc Tây Ninh', '123 Đường 30/4', 'Tây Ninh', 'Miền Nam', 11.1234567, 106.1234567, 'active', NOW()),
('22222222-2222-2222-2222-222222222222', 'Trạm Sạc Gò Dầu', '456 Quốc lộ 22B', 'Tây Ninh', 'Miền Nam', 11.1000000, 106.2000000, 'active', NOW());

-- Seed bảng charging_points
INSERT INTO charging_points (id, station_id, external_id, connector_type, max_power_kw, status, price_per_kwh, overstay_fee_per_minute, updated_at)
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