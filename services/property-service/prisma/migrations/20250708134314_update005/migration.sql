/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `properties` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `property_categories` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `properties` ADD COLUMN `slug` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `property_categories` ADD COLUMN `slug` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `properties_slug_key` ON `properties`(`slug`);

-- CreateIndex
CREATE UNIQUE INDEX `property_categories_slug_key` ON `property_categories`(`slug`);
