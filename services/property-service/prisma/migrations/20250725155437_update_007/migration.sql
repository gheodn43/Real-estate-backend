-- AlterTable
ALTER TABLE `properties` MODIFY `request_status` ENUM('pending', 'negotiating', 'published', 'rejected', 'completed', 'hidden') NULL;
