-- CreateTable
CREATE TABLE `station_maintenance` (
    `id` VARCHAR(191) NOT NULL,
    `station_id` VARCHAR(191) NOT NULL,
    `start_time` DATETIME(3) NOT NULL,
    `end_time` DATETIME(3) NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `scheduled_by` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `station_maintenance` ADD CONSTRAINT `station_maintenance_station_id_fkey` FOREIGN KEY (`station_id`) REFERENCES `stations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
