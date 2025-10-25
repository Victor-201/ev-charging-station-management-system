/*
  Warnings:

  - A unique constraint covering the columns `[address,latitude,longitude]` on the table `stations` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `stations_address_latitude_longitude_key` ON `stations`(`address`, `latitude`, `longitude`);
