-- ==============================================================================
-- Migration : Ajout de la table users et liaison avec requests
-- Projet : Site Internet ETOF SARL
-- ==============================================================================

USE `etof_site`;

CREATE TABLE IF NOT EXISTS `users` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `civility` ENUM('mr', 'mrs', 'none') NOT NULL DEFAULT 'none' COMMENT 'Civilité : mr = Monsieur, mrs = Madame, none = Sans civilité',
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `preferred_name` ENUM('first_name', 'last_name') NOT NULL DEFAULT 'first_name' COMMENT 'Nom d affichage préféré',
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(50) NULL,
    `company` VARCHAR(150) NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `email_verified_at` DATETIME NULL,
    `last_login_at` DATETIME NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uniq_users_email` (`email`),
    KEY `idx_users_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Comptes utilisateurs clients du site ETOF SARL';

-- Ajout de la colonne user_id dans la table requests si elle n'existe pas encore
SET @colExists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'etof_site' 
      AND TABLE_NAME = 'requests' 
      AND COLUMN_NAME = 'user_id'
);

SET @sqlStmt = IF(@colExists = 0, 
    'ALTER TABLE `requests` ADD COLUMN `user_id` INT UNSIGNED NULL AFTER `id`, ADD CONSTRAINT `fk_requests_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;', 
    'SELECT 1;'
);

PREPARE stmt FROM @sqlStmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

