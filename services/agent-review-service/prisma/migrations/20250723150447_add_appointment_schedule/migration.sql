-- CreateTable
CREATE TABLE `appointment_schedule` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `property_id` INTEGER NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `time` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `number_phone` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NULL,
    `response` VARCHAR(191) NULL,
    `type` ENUM('directly', 'video_chat') NOT NULL DEFAULT 'directly',
    `status` ENUM('not_responded', 'responded', 'hidden') NOT NULL DEFAULT 'not_responded',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
