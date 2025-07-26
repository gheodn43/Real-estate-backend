-- AlterTable
ALTER TABLE `amenities` ADD COLUMN `deleted_at` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `property_categories` ADD COLUMN `deleted_at` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `property_category_detail` ADD COLUMN `deleted_at` DATETIME(3) NULL;

-- AddForeignKey
ALTER TABLE `commissions` ADD CONSTRAINT `commissions_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
