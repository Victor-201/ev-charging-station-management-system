-- CreateTable
CREATE TABLE `stations` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `address` VARCHAR(500) NULL,
    `city` VARCHAR(100) NULL,
    `region` VARCHAR(100) NULL,
    `latitude` DECIMAL(10, 7) NULL,
    `longitude` DECIMAL(10, 7) NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'active',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_stations_city`(`city`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `charging_points` (
    `id` CHAR(36) NOT NULL,
    `station_id` CHAR(36) NOT NULL,
    `external_id` VARCHAR(100) NULL,
    `connector_type` VARCHAR(50) NULL,
    `max_power_kw` DECIMAL(8, 2) NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'available',
    `price_per_kwh` DECIMAL(10, 2) NULL,
    `price_per_minute` DECIMAL(10, 2) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `charging_points_external_id_key`(`external_id`),
    INDEX `idx_cp_stationid`(`station_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `station_staff` (
    `id` CHAR(36) NOT NULL,
    `staff_user_id` CHAR(36) NOT NULL,
    `station_id` CHAR(36) NOT NULL,
    `role` VARCHAR(50) NULL,
    `assigned_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_station_staff`(`station_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `station_incidents` (
    `id` CHAR(36) NOT NULL,
    `station_id` CHAR(36) NOT NULL,
    `point_id` CHAR(36) NULL,
    `reported_by` CHAR(36) NULL,
    `description` VARCHAR(191) NULL,
    `severity` VARCHAR(20) NOT NULL DEFAULT 'medium',
    `status` VARCHAR(50) NOT NULL DEFAULT 'open',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `resolved_at` DATETIME(3) NULL,

    INDEX `idx_incidents_station`(`station_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `station_usage_reports` (
    `id` CHAR(36) NOT NULL,
    `station_id` CHAR(36) NOT NULL,
    `report_date` DATETIME(3) NOT NULL,
    `total_sessions` INTEGER NOT NULL DEFAULT 0,
    `total_kwh` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `total_revenue` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `station_usage_reports_station_id_report_date_key`(`station_id`, `report_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `outbox_events` (
    `id` CHAR(36) NOT NULL,
    `aggregate_type` VARCHAR(100) NULL,
    `aggregate_id` CHAR(36) NULL,
    `event_type` VARCHAR(100) NULL,
    `payload` JSON NULL,
    `published` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `charging_points` ADD CONSTRAINT `charging_points_station_id_fkey` FOREIGN KEY (`station_id`) REFERENCES `stations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `station_staff` ADD CONSTRAINT `station_staff_station_id_fkey` FOREIGN KEY (`station_id`) REFERENCES `stations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `station_incidents` ADD CONSTRAINT `station_incidents_station_id_fkey` FOREIGN KEY (`station_id`) REFERENCES `stations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `station_incidents` ADD CONSTRAINT `station_incidents_point_id_fkey` FOREIGN KEY (`point_id`) REFERENCES `charging_points`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `station_usage_reports` ADD CONSTRAINT `station_usage_reports_station_id_fkey` FOREIGN KEY (`station_id`) REFERENCES `stations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
