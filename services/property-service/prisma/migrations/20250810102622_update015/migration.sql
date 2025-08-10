-- AlterTable
ALTER TABLE `sale_bonus` ADD COLUMN `sent_mail` BOOLEAN NULL DEFAULT true,
    MODIFY `bonus` DECIMAL(15, 2) NULL DEFAULT 0,
    MODIFY `penalty` DECIMAL(15, 2) NULL DEFAULT 0;
