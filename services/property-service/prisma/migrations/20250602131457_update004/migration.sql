/*
  Warnings:

  - You are about to drop the column `assigned_at` on the `property_agent_history` table. All the data in the column will be lost.
  - You are about to drop the column `unassigned_at` on the `property_agent_history` table. All the data in the column will be lost.
  - Added the required column `type` to the `property_agent_history` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `property_agent_history` DROP COLUMN `assigned_at`,
    DROP COLUMN `unassigned_at`,
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `type` ENUM('request', 'assigned', 'leaved') NOT NULL;
