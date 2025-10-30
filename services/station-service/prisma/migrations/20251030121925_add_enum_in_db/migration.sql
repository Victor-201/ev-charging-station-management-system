/*
  Warnings:

  - You are about to alter the column `status` on the `charging_points` table. The data in that column could be lost. The data in that column will be cast from `VarChar(50)` to `Enum(EnumId(1))`.
  - You are about to alter the column `status` on the `station_incidents` table. The data in that column could be lost. The data in that column will be cast from `VarChar(50)` to `Enum(EnumId(3))`.
  - You are about to alter the column `role` on the `station_staff` table. The data in that column could be lost. The data in that column will be cast from `VarChar(50)` to `Enum(EnumId(2))`.
  - You are about to alter the column `status` on the `stations` table. The data in that column could be lost. The data in that column will be cast from `VarChar(50)` to `Enum(EnumId(0))`.

*/
-- AlterTable
ALTER TABLE `charging_points` MODIFY `status` ENUM('available', 'in_use', 'offline') NOT NULL DEFAULT 'available';

-- AlterTable
ALTER TABLE `station_incidents` MODIFY `status` ENUM('open', 'investigating', 'resolved', 'closed') NOT NULL DEFAULT 'open';

-- AlterTable
ALTER TABLE `station_staff` MODIFY `role` ENUM('operator', 'manager', 'maintainer') NULL;

-- AlterTable
ALTER TABLE `stations` MODIFY `status` ENUM('active', 'closed', 'maintenance') NOT NULL DEFAULT 'active';
