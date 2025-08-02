/*
  Warnings:

  - You are about to drop the column `payment_at` on the `sale_bonus` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `sale_bonus` DROP COLUMN `payment_at`,
    ADD COLUMN `bonus_of_month` VARCHAR(191) NULL;
