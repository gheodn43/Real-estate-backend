-- AlterTable
ALTER TABLE `property_category_detail` ADD COLUMN `unit` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `commissions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `property_id` INTEGER NOT NULL,
    `status` ENUM('processing', 'completed', 'failed') NOT NULL DEFAULT 'processing',
    `type` ENUM('buying', 'rental') NOT NULL DEFAULT 'buying',
    `commission` DECIMAL(15, 2) NOT NULL,
    `latest_price` DECIMAL(15, 2) NULL,
    `contract_url` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
