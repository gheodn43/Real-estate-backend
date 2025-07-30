-- CreateTable
CREATE TABLE `agent_commission_fee` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `commission_id` INTEGER NOT NULL,
    `agent_id` INTEGER NOT NULL,
    `commission_value` DECIMAL(15, 2) NOT NULL,
    `reject_reason` VARCHAR(191) NULL,
    `status` ENUM('processing', 'confirmed', 'rejected') NOT NULL DEFAULT 'processing',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `agent_commission_fee` ADD CONSTRAINT `agent_commission_fee_commission_id_fkey` FOREIGN KEY (`commission_id`) REFERENCES `commissions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
