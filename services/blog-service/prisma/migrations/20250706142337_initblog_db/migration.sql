-- CreateTable
CREATE TABLE `blogs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `small_image` VARCHAR(191) NOT NULL,
    `short_link` VARCHAR(191) NOT NULL,
    `status` ENUM('published', 'draft', 'pending', 'rejected', 'hidden') NOT NULL,
    `journalist_Id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blog_reviews` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `blog_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `comment` VARCHAR(191) NOT NULL,
    `parent_id` INTEGER NOT NULL,
    `status` ENUM('published', 'hidden') NOT NULL DEFAULT 'published',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blog_react` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `blog_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `blog_reviews` ADD CONSTRAINT `blog_reviews_blog_id_fkey` FOREIGN KEY (`blog_id`) REFERENCES `blogs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blog_react` ADD CONSTRAINT `blog_react_blog_id_fkey` FOREIGN KEY (`blog_id`) REFERENCES `blogs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
