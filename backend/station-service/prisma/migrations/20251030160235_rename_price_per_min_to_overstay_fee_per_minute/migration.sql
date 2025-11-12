/*
  Warnings:

  - You are about to drop the column `price_per_minute` on the `charging_points` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `charging_points` DROP COLUMN `price_per_minute`,
    ADD COLUMN `overstay_fee_per_minute` DECIMAL(10, 2) NULL;
