-- CreateTable
CREATE TABLE `feedbacks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `last_name` VARCHAR(191) NULL,
    `first_name` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `number_phone` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `response` VARCHAR(191) NULL,
    `response_by` VARCHAR(191) NULL,
    `status` ENUM('not_responded', 'responded', 'hidden') NOT NULL DEFAULT 'not_responded',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
