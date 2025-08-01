-- CreateTable
CREATE TABLE `sale_bonus` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `agent_id` INTEGER NOT NULL,
    `buying_quantity` INTEGER NOT NULL,
    `rental_quantity` INTEGER NOT NULL,
    `total_buying_commission` DECIMAL(15, 2) NOT NULL,
    `total_rental_commission` DECIMAL(15, 2) NOT NULL,
    `bonus` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `penalty` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `review` VARCHAR(191) NULL,
    `review_by` INTEGER NULL,
    `payment_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customer_needs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `number_phone` VARCHAR(191) NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `agent_id` INTEGER NULL,
    `needs_type` ENUM('buying', 'rental') NULL,
    `filter` JSON NULL,
    `suggestion_latest` JSON NULL,
    `the_close` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `customer_needs_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
