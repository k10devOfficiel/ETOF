-- ==============================================================================
-- Schéma de base de données : etof_site
-- Système : MySQL 8.0+
-- Moteur : InnoDB
-- Encodage : utf8mb4 / utf8mb4_unicode_ci
-- Projet : Site Internet ETOF SARL
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `etof_site`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE `etof_site`;

SET foreign_key_checks = 0;

-- ------------------------------------------------------------------------------
-- 1. Table : admins
-- Comptes d'administration pour la gestion du back-office
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `admins`;
CREATE TABLE `admins` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `email` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `last_login_at` DATETIME NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uniq_admins_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Administrateurs habilités à gérer la plateforme';

-- ------------------------------------------------------------------------------
-- 2. Table : categories
-- Catégories transverses par domaine d'activité (ferme, véhicules, fournitures)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `activity` ENUM('farm', 'vehicle', 'office') NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `name_fr` VARCHAR(100) NOT NULL,
    `name_en` VARCHAR(100) NOT NULL,
    `sort_order` INT NOT NULL DEFAULT 0,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    UNIQUE KEY `uniq_categories_slug` (`slug`),
    KEY `idx_categories_activity` (`activity`),
    KEY `idx_categories_is_active` (`is_active`),
    KEY `idx_categories_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Catégories de produits et véhicules par pôle d activité';

-- ------------------------------------------------------------------------------
-- 3. Table : products
-- Catalogue des produits pour l'élevage/agriculture et les fournitures de bureau
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `category_id` INT UNSIGNED NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `reference` VARCHAR(50) NULL,
    `name_fr` VARCHAR(150) NOT NULL,
    `name_en` VARCHAR(150) NOT NULL,
    `description_fr` TEXT NULL,
    `description_en` TEXT NULL,
    `unit_fr` VARCHAR(50) NULL,
    `unit_en` VARCHAR(50) NULL,
    `price` INT UNSIGNED NULL COMMENT 'Prix unitaire en FCFA (NULL = sur demande)',
    `min_quantity` INT UNSIGNED NOT NULL DEFAULT 1,
    `is_orderable` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Indique si la commande directe est possible',
    `is_available` TINYINT(1) NOT NULL DEFAULT 1,
    `image` VARCHAR(255) NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `sort_order` INT NOT NULL DEFAULT 0,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uniq_products_slug` (`slug`),
    KEY `idx_products_category_id` (`category_id`),
    KEY `idx_products_reference` (`reference`),
    KEY `idx_products_is_active` (`is_active`),
    KEY `idx_products_is_available` (`is_available`),
    KEY `idx_products_sort_order` (`sort_order`),
    KEY `idx_products_created_at` (`created_at`),
    CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`)
        REFERENCES `categories` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Catalogue de produits (ferme, élevage, fournitures de bureau)';

-- ------------------------------------------------------------------------------
-- 4. Table : vehicles
-- Parc automobile proposé à la vente et/ou à la location
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `vehicles`;
CREATE TABLE `vehicles` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `category_id` INT UNSIGNED NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `brand` VARCHAR(80) NOT NULL,
    `model` VARCHAR(80) NOT NULL,
    `year` SMALLINT UNSIGNED NOT NULL,
    `mode` ENUM('sale', 'rental', 'both') NOT NULL,
    `price_sale` INT UNSIGNED NULL COMMENT 'Prix de vente en FCFA (NULL = sur demande)',
    `price_rental_day` INT UNSIGNED NULL COMMENT 'Prix de location par jour en FCFA (NULL = sur demande)',
    `status` ENUM('available', 'reserved', 'sold', 'unavailable') NOT NULL DEFAULT 'available',
    `specs` JSON NULL COMMENT 'Fiche technique et équipements du véhicule',
    `description_fr` TEXT NULL,
    `description_en` TEXT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uniq_vehicles_slug` (`slug`),
    KEY `idx_vehicles_category_id` (`category_id`),
    KEY `idx_vehicles_mode` (`mode`),
    KEY `idx_vehicles_status` (`status`),
    KEY `idx_vehicles_brand` (`brand`),
    KEY `idx_vehicles_year` (`year`),
    KEY `idx_vehicles_is_active` (`is_active`),
    KEY `idx_vehicles_created_at` (`created_at`),
    CONSTRAINT `fk_vehicles_category` FOREIGN KEY (`category_id`)
        REFERENCES `categories` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Catalogue des véhicules disponibles en vente ou location';

-- ------------------------------------------------------------------------------
-- 5. Table : vehicle_images
-- Galerie de photos associées à chaque véhicule
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `vehicle_images`;
CREATE TABLE `vehicle_images` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `vehicle_id` INT UNSIGNED NOT NULL,
    `path` VARCHAR(255) NOT NULL,
    `alt_fr` VARCHAR(150) NULL,
    `alt_en` VARCHAR(150) NULL,
    `sort_order` INT NOT NULL DEFAULT 0,
    KEY `idx_vehicle_images_vehicle_id` (`vehicle_id`),
    KEY `idx_vehicle_images_sort_order` (`sort_order`),
    CONSTRAINT `fk_vehicle_images_vehicle` FOREIGN KEY (`vehicle_id`)
        REFERENCES `vehicles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Galerie photographique des véhicules avec suppression en cascade';

-- ------------------------------------------------------------------------------
-- 6. Table : requests
-- Enregistrement des devis, commandes, réservations, achats et prises de contact
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `requests`;
CREATE TABLE `requests` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `reference` VARCHAR(50) NOT NULL COMMENT 'Format standard : ETOF-AAAA-00001',
    `type` ENUM('quote', 'order', 'reservation', 'purchase', 'contact') NOT NULL,
    `activity` ENUM('farm', 'vehicle', 'office', 'fuel', 'general') NOT NULL,
    `status` ENUM('new', 'in_progress', 'confirmed', 'rejected', 'closed') NOT NULL DEFAULT 'new',
    `lang` CHAR(2) NOT NULL DEFAULT 'fr',
    `full_name` VARCHAR(150) NOT NULL,
    `company` VARCHAR(150) NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(50) NOT NULL,
    `message` TEXT NULL,
    `details` JSON NULL COMMENT 'Spécifications complémentaires (volume hydrocarbures, lieu de livraison, etc.)',
    `vehicle_id` INT UNSIGNED NULL,
    `start_date` DATE NULL,
    `end_date` DATE NULL,
    `consent` TINYINT(1) NOT NULL DEFAULT 0,
    `ip_hash` CHAR(64) NOT NULL,
    `internal_note` TEXT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uniq_requests_reference` (`reference`),
    KEY `idx_requests_type` (`type`),
    KEY `idx_requests_activity` (`activity`),
    KEY `idx_requests_status` (`status`),
    KEY `idx_requests_email` (`email`),
    KEY `idx_requests_created_at` (`created_at`),
    KEY `idx_requests_vehicle_id` (`vehicle_id`),
    KEY `idx_requests_dates` (`start_date`, `end_date`),
    CONSTRAINT `fk_requests_vehicle` FOREIGN KEY (`vehicle_id`)
        REFERENCES `vehicles` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Demandes clients unifiées : devis, commandes, réservations et contacts';

-- ------------------------------------------------------------------------------
-- 7. Table : request_items
-- Articles commandés ou demandés en devis rattachés à une requête
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `request_items`;
CREATE TABLE `request_items` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `request_id` INT UNSIGNED NOT NULL,
    `product_id` INT UNSIGNED NULL,
    `label_snapshot` VARCHAR(255) NOT NULL,
    `quantity` INT UNSIGNED NOT NULL DEFAULT 1,
    `unit_price_snapshot` INT UNSIGNED NULL COMMENT 'Prix unitaire archivé au moment de la demande en FCFA',
    KEY `idx_request_items_request_id` (`request_id`),
    KEY `idx_request_items_product_id` (`product_id`),
    CONSTRAINT `fk_request_items_request` FOREIGN KEY (`request_id`)
        REFERENCES `requests` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_request_items_product` FOREIGN KEY (`product_id`)
        REFERENCES `products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Détail des articles associés à une demande client avec suppression en cascade';

-- ------------------------------------------------------------------------------
-- 8. Table : settings
-- Paramètres globaux et données d établissement clé-valeur
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `settings`;
CREATE TABLE `settings` (
    `setting_key` VARCHAR(100) NOT NULL PRIMARY KEY,
    `setting_value` TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Configurations dynamiques et paramètres applicatifs';

-- ------------------------------------------------------------------------------
-- 9. Table : rate_limits
-- Journalisation des actions par empreinte IP pour la limitation de débit anti-abus
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `rate_limits`;
CREATE TABLE `rate_limits` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `ip_hash` CHAR(64) NOT NULL,
    `action` VARCHAR(50) NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY `idx_rate_limits_ip_action_created` (`ip_hash`, `action`, `created_at`),
    KEY `idx_rate_limits_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Protection contre les abus et limitation du débit de soumission de formulaires';

SET foreign_key_checks = 1;

