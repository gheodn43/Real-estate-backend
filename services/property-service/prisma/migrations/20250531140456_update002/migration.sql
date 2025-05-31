/*
  Warnings:

  - You are about to alter the column `price` on the `properties` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(15,2)`.
  - You are about to drop the column `category_id` on the `property_detail` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `property_detail` DROP FOREIGN KEY `property_detail_category_id_fkey`;

-- DropIndex
DROP INDEX `property_detail_category_id_fkey` ON `property_detail`;

-- AlterTable
ALTER TABLE `properties` MODIFY `price` DECIMAL(15, 2) NOT NULL;

-- AlterTable
ALTER TABLE `property_detail` DROP COLUMN `category_id`,
    ADD COLUMN `category_detail_id` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `property_detail` ADD CONSTRAINT `property_detail_category_detail_id_fkey` FOREIGN KEY (`category_detail_id`) REFERENCES `property_category_detail`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
