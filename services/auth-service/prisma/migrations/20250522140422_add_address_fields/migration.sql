-- AlterTable
ALTER TABLE `users` ADD COLUMN `addr_city` VARCHAR(191) NULL,
    ADD COLUMN `addr_detail` VARCHAR(191) NULL,
    ADD COLUMN `addr_district` VARCHAR(191) NULL,
    ADD COLUMN `addr_street` VARCHAR(191) NULL;
