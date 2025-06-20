-- CreateTable
CREATE TABLE `agent_reviews` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `agent_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `rating` INTEGER NOT NULL,
    `comment` VARCHAR(191) NULL,
    `images` JSON NULL,
    `parent_id` INTEGER NULL,
    `type` ENUM('comment', 'repcomment') NOT NULL DEFAULT 'comment',
    `status` ENUM('showing', 'deleted', 'rejected', 'pending') NOT NULL DEFAULT 'pending',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `agent_reviews` ADD CONSTRAINT `agent_reviews_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `agent_reviews`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
