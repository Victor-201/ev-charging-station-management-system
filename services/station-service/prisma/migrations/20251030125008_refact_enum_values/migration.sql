/*
  Warnings:

  - You are about to alter the column `severity` on the `station_incidents` table. The data in that column could be lost. The data in that column will be cast from `VarChar(20)` to `Enum(EnumId(3))`.
  - You are about to alter the column `status` on the `station_incidents` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(2))` to `Enum(EnumId(4))`.
  - The values [maintainer] on the enum `station_staff_role` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `charging_points` MODIFY `status` ENUM('available', 'in_use', 'offline', 'faulted', 'reserved') NOT NULL DEFAULT 'available';

-- AlterTable
ALTER TABLE `station_incidents` MODIFY `severity` ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
    MODIFY `status` ENUM('pending_confirmation', 'in_progress', 'resolved', 'rejected') NOT NULL DEFAULT 'pending_confirmation';

-- AlterTable
ALTER TABLE `station_staff` MODIFY `role` ENUM('manager', 'technician', 'operator', 'security') NULL;

-- AlterTable
ALTER TABLE `stations` MODIFY `status` ENUM('active', 'closed', 'maintenance', 'inactive') NOT NULL DEFAULT 'active';
