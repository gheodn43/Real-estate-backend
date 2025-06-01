/*
  Warnings:

  - You are about to drop the `property_request_location` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `property_request_location` DROP FOREIGN KEY `property_request_location_property_id_fkey`;

-- AlterTable
ALTER TABLE `properties` MODIFY `sender_id` INTEGER NULL,
    MODIFY `requestpost_status` ENUM('draft', 'pending_approval', 'rejected', 'published', 'sold', 'expired', 'hidden') NULL;

-- AlterTable
ALTER TABLE `property_category_detail` ADD COLUMN `icon` VARCHAR(191) NULL,
    ADD COLUMN `is_showing` BOOLEAN NULL;

-- DropTable
DROP TABLE `property_request_location`;

-- CreateTable
CREATE TABLE `property_location` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `property_id` INTEGER NOT NULL,
    `addr_city` VARCHAR(191) NOT NULL,
    `addr_district` VARCHAR(191) NOT NULL,
    `addr_street` VARCHAR(191) NOT NULL,
    `addr_details` VARCHAR(191) NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `property_location_property_id_key`(`property_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `property_agent_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `property_id` INTEGER NOT NULL,
    `agent_id` INTEGER NOT NULL,
    `assigned_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `unassigned_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `property_location` ADD CONSTRAINT `property_location_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `property_agent_history` ADD CONSTRAINT `property_agent_history_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
