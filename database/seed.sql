-- ==============================================================================
-- Jeu de données de démonstration : database/seed.sql
-- Projet : Site Internet ETOF SARL
-- Remarques :
-- - Données de démonstration clairement marquées [DEMO] dans les noms.
-- - Aucun prix inventé : tous les prix sont laissés à NULL (sur demande).
-- - Les chemins d'images pointent vers /uploads/demo/.
-- - Aucun administrateur inséré (réservé au script dédié P2.5).
-- ==============================================================================

USE `etof_site`;

SET foreign_key_checks = 0;

TRUNCATE TABLE `settings`;
TRUNCATE TABLE `vehicle_images`;
TRUNCATE TABLE `vehicles`;
TRUNCATE TABLE `products`;
TRUNCATE TABLE `categories`;

-- ------------------------------------------------------------------------------
-- 1. Catégories
-- Ferme : Volailles, Œufs
-- Véhicules : Berlines, SUV et 4x4, Utilitaires et camions
-- Fournitures de bureau : Papeterie, Consommables, Mobilier
-- ------------------------------------------------------------------------------
INSERT INTO `categories` (`id`, `activity`, `slug`, `name_fr`, `name_en`, `sort_order`, `is_active`) VALUES
(1, 'farm', 'volailles', 'Volailles [DEMO]', 'Poultry [DEMO]', 1, 1),
(2, 'farm', 'oeufs', 'Œufs [DEMO]', 'Eggs [DEMO]', 2, 1),
(3, 'vehicle', 'berlines', 'Berlines [DEMO]', 'Sedans [DEMO]', 1, 1),
(4, 'vehicle', 'suv-et-4x4', 'SUV et 4x4 [DEMO]', 'SUV & 4x4 [DEMO]', 2, 1),
(5, 'vehicle', 'utilitaires-et-camions', 'Utilitaires et camions [DEMO]', 'Vans & Trucks [DEMO]', 3, 1),
(6, 'office', 'papeterie', 'Papeterie [DEMO]', 'Stationery [DEMO]', 1, 1),
(7, 'office', 'consommables', 'Consommables [DEMO]', 'Consumables [DEMO]', 2, 1),
(8, 'office', 'mobilier', 'Mobilier [DEMO]', 'Furniture [DEMO]', 3, 1);

-- ------------------------------------------------------------------------------
-- 2. Produits de ferme (6 produits)
-- Poulet, Pintade, Dinde, Caille, Œufs de caille, Œufs de poule
-- Prix à NULL (sur demande)
-- Images pointant vers /uploads/demo/
-- ------------------------------------------------------------------------------
INSERT INTO `products` (
    `id`, `category_id`, `slug`, `reference`, `name_fr`, `name_en`,
    `description_fr`, `description_en`, `unit_fr`, `unit_en`,
    `price`, `min_quantity`, `is_orderable`, `is_available`,
    `image`, `is_active`, `sort_order`
) VALUES
(
    1, 1, 'poulet-de-chair-fermier', 'FARM-CKN-001',
    '[DEMO] Poulet de chair fermier', '[DEMO] Free-range broiler chicken',
    'Poulet fermier élevé selon des méthodes saines avec suivi nutritionnel et vétérinaire rigoureux.',
    'Free-range farm chicken raised naturally with strict nutritional and veterinary monitoring.',
    'pièce', 'piece',
    NULL, 10, 1, 1,
    '/uploads/demo/farm-poulet.jpg', 1, 1
),
(
    2, 1, 'pintade-locale-fermiere', 'FARM-GFL-002',
    '[DEMO] Pintade locale fermière', '[DEMO] Local farm guinea fowl',
    'Pintade fermière locale réputée pour sa chair ferme et sa saveur authentique.',
    'Local farm guinea fowl renowned for firm, authentic meat and outdoor rearing.',
    'pièce', 'piece',
    NULL, 5, 1, 1,
    '/uploads/demo/farm-pintade.jpg', 1, 2
),
(
    3, 1, 'dinde-fermiere-entiere', 'FARM-TRK-003',
    '[DEMO] Dinde fermière entière', '[DEMO] Whole farm turkey',
    'Dinde d élevage fermier conditionnée entière, idéale pour événements et réceptions.',
    'Farm-raised whole turkey carefully conditioned, ideal for celebrations and catering.',
    'pièce', 'piece',
    NULL, 2, 1, 1,
    '/uploads/demo/farm-dinde.jpg', 1, 3
),
(
    4, 1, 'caille-d-elevage', 'FARM-QIL-004',
    '[DEMO] Caille d élevage', '[DEMO] Farm-raised quail',
    'Cailles de table prêtes pour cuisson, reconnues pour la tendreté et la finesse de leur chair.',
    'Table quails prepared for cooking, appreciated for tender and exquisite meat.',
    'paquet de 6', 'pack of 6',
    NULL, 5, 1, 1,
    '/uploads/demo/farm-caille.jpg', 1, 4
),
(
    5, 2, 'oeufs-frais-de-caille', 'FARM-QEG-005',
    '[DEMO] Œufs frais de caille', '[DEMO] Fresh quail eggs',
    'Plateau d œufs de caille frais, riches en nutriments essentiels et récoltés chaque jour.',
    'Fresh quail eggs tray, nutrient-dense and collected daily from top quality aviaries.',
    'plaquette de 30', 'tray of 30',
    NULL, 5, 1, 1,
    '/uploads/demo/farm-oeufs-caille.jpg', 1, 5
),
(
    6, 2, 'oeufs-frais-de-poule', 'FARM-CEG-006',
    '[DEMO] Œufs frais de poule', '[DEMO] Fresh chicken eggs',
    'Alvéole d œufs frais de poule soigneusement triés, calibrés et conditionnés.',
    'Fresh chicken eggs carefully graded, sorted and packed in protective standard trays.',
    'alvéole de 30', 'tray of 30',
    NULL, 10, 1, 1,
    '/uploads/demo/farm-oeufs-poule.jpg', 1, 6
);

-- ------------------------------------------------------------------------------
-- 3. Fournitures de bureau (6 produits)
-- Papeterie, Consommables, Mobilier
-- Prix à NULL (sur demande)
-- Images pointant vers /uploads/demo/
-- ------------------------------------------------------------------------------
INSERT INTO `products` (
    `id`, `category_id`, `slug`, `reference`, `name_fr`, `name_en`,
    `description_fr`, `description_en`, `unit_fr`, `unit_en`,
    `price`, `min_quantity`, `is_orderable`, `is_available`,
    `image`, `is_active`, `sort_order`
) VALUES
(
    7, 6, 'rames-papier-a4-80g', 'OFF-PAP-001',
    '[DEMO] Rames de papier A4 80g (Carton de 5)', '[DEMO] A4 Copy Paper 80gsm (Box of 5)',
    'Papier reprographique blanc de premier choix pour impressions bureautiques intensives.',
    'Premium multi-purpose white paper 80gsm suitable for heavy daily office printing.',
    'carton', 'box',
    NULL, 2, 1, 1,
    '/uploads/demo/office-papier.jpg', 1, 7
),
(
    8, 6, 'stylos-a-bille-bleus-boite-de-50', 'OFF-PEN-002',
    '[DEMO] Boîte de 50 stylos à bille (Bleu)', '[DEMO] Box of 50 Ballpoint Pens (Blue)',
    'Stylos à bille ergonomiques à pointe moyenne garantissant un tracé régulier.',
    'Ergonomic medium point ballpoint pens providing smooth, reliable writing performance.',
    'boîte', 'box',
    NULL, 5, 1, 1,
    '/uploads/demo/office-stylos.jpg', 1, 8
),
(
    9, 7, 'toner-laser-noir-haute-capacite', 'OFF-TNR-003',
    '[DEMO] Cartouche toner laser noir haute capacité', '[DEMO] High-yield black laser toner cartridge',
    'Cartouche de toner noir professionnelle pour imprimante laser d entreprise.',
    'High-yield professional black toner cartridge delivering crisp text documents.',
    'unité', 'unit',
    NULL, 1, 1, 1,
    '/uploads/demo/office-toner.jpg', 1, 9
),
(
    10, 7, 'classeurs-a-levier-dos-80mm', 'OFF-ARC-004',
    '[DEMO] Lot de 10 classeurs à levier dos 80mm', '[DEMO] Pack of 10 Lever Arch Files 80mm',
    'Classeurs renforcés dos 80mm adaptés à l archivage durable des dossiers d entreprise.',
    'Heavy-duty lever arch filing binders with 80mm spine for professional archiving.',
    'lot de 10', 'pack of 10',
    NULL, 2, 1, 1,
    '/uploads/demo/office-classeurs.jpg', 1, 10
),
(
    11, 8, 'fauteuil-de-bureau-ergonomique', 'OFF-CHR-005',
    '[DEMO] Fauteuil de bureau ergonomique réglable', '[DEMO] Ergonomic adjustable executive chair',
    'Fauteuil de bureau avec soutien lombaire dynamique, assise respirante et accoudoirs ajustables.',
    'Ergonomic office chair with dynamic lumbar support, breathable mesh and multi-axis armrests.',
    'unité', 'unit',
    NULL, 1, 1, 1,
    '/uploads/demo/office-fauteuil.jpg', 1, 11
),
(
    12, 8, 'bureau-professionnel-moderne', 'OFF-DSK-006',
    '[DEMO] Bureau professionnel avec caisson 3 tiroirs', '[DEMO] Professional executive desk with 3-drawer pedestal',
    'Poste de travail avec plateau robuste, passe-câbles intégrés et caisson métallique sécurisé.',
    'Solid workstation desk with cable management port and lockable metal drawer unit.',
    'unité', 'unit',
    NULL, 1, 1, 1,
    '/uploads/demo/office-bureau.jpg', 1, 12
);

-- ------------------------------------------------------------------------------
-- 4. Véhicules de démonstration (5 véhicules)
-- 2 en location, 2 en vente, 1 réservé
-- Specs JSON : carburant, boîte, places, kilométrage
-- Prix à NULL (sur demande)
-- ------------------------------------------------------------------------------
INSERT INTO `vehicles` (
    `id`, `category_id`, `slug`, `brand`, `model`, `year`,
    `mode`, `price_sale`, `price_rental_day`, `status`,
    `specs`, `description_fr`, `description_en`, `is_active`
) VALUES
(
    1, 4, 'toyota-land-cruiser-prado-txl', 'Toyota', 'Land Cruiser Prado TXL [DEMO]', 2024,
    'rental', NULL, NULL, 'available',
    JSON_OBJECT(
        'carburant', 'Diesel',
        'boîte', 'Automatique 6 vitesses',
        'places', 7,
        'kilométrage', '18 000 km'
    ),
    '[DEMO] SUV tout-terrain haut de gamme, idéal pour vos missions professionnelles à Abidjan et en province, disponible en location.',
    '[DEMO] Premium all-terrain SUV available for business rental with spacious and comfortable passenger cabin.',
    1
),
(
    2, 3, 'hyundai-elantra-executive', 'Hyundai', 'Elantra Executive [DEMO]', 2023,
    'rental', NULL, NULL, 'available',
    JSON_OBJECT(
        'carburant', 'Essence',
        'boîte', 'Automatique IVT',
        'places', 5,
        'kilométrage', '24 500 km'
    ),
    '[DEMO] Berline élégante et économe en carburant, recommandée pour déplacements urbains et navettes VIP.',
    '[DEMO] Modern and efficient sedan perfectly suited for city business trips and executive transfers.',
    1
),
(
    3, 4, 'mitsubishi-pajero-sport-gls', 'Mitsubishi', 'Pajero Sport GLS [DEMO]', 2022,
    'sale', NULL, NULL, 'available',
    JSON_OBJECT(
        'carburant', 'Diesel',
        'boîte', 'Automatique 8 vitesses',
        'places', 7,
        'kilométrage', '38 000 km'
    ),
    '[DEMO] 4x4 robuste et fiable en parfait état de fonctionnement, entretien à jour, disponible à la vente.',
    '[DEMO] Reliable 4WD SUV in excellent condition with full service history, available for purchase.',
    1
),
(
    4, 5, 'isuzu-d-max-double-cabine', 'Isuzu', 'D-Max Double Cabine 4x4 [DEMO]', 2023,
    'sale', NULL, NULL, 'available',
    JSON_OBJECT(
        'carburant', 'Diesel',
        'boîte', 'Manuelle 6 vitesses',
        'places', 5,
        'kilométrage', '31 000 km'
    ),
    '[DEMO] Pick-up polyvalent conçu pour le transport agricole, les chantiers et les charges lourdes en vente directe.',
    '[DEMO] Robust pickup engineered for heavy loads, site operations and farm transport, ready for sale.',
    1
),
(
    5, 3, 'mercedes-benz-classe-c-200', 'Mercedes-Benz', 'Classe C 200 Avantgarde [DEMO]', 2023,
    'both', NULL, NULL, 'reserved',
    JSON_OBJECT(
        'carburant', 'Essence hybride léger',
        'boîte', 'Automatique 9G-TRONIC',
        'places', 5,
        'kilométrage', '14 200 km'
    ),
    '[DEMO] Berline de prestige réservée pour protocole officiel et direction générale.',
    '[DEMO] Luxury executive sedan currently reserved for VIP official assignments.',
    1
);

-- ------------------------------------------------------------------------------
-- 5. Images des véhicules (vehicle_images)
-- Chemins pointant vers /uploads/demo/
-- ------------------------------------------------------------------------------
INSERT INTO `vehicle_images` (`id`, `vehicle_id`, `path`, `alt_fr`, `alt_en`, `sort_order`) VALUES
(1, 1, '/uploads/demo/prado-avant.jpg', '[DEMO] Toyota Land Cruiser Prado - Vue avant', '[DEMO] Toyota Land Cruiser Prado - Front view', 1),
(2, 1, '/uploads/demo/prado-lateral.jpg', '[DEMO] Toyota Land Cruiser Prado - Profil', '[DEMO] Toyota Land Cruiser Prado - Side profile', 2),
(3, 2, '/uploads/demo/elantra-avant.jpg', '[DEMO] Hyundai Elantra - Vue avant', '[DEMO] Hyundai Elantra - Front view', 1),
(4, 2, '/uploads/demo/elantra-interieur.jpg', '[DEMO] Hyundai Elantra - Intérieur', '[DEMO] Hyundai Elantra - Interior', 2),
(5, 3, '/uploads/demo/pajero-avant.jpg', '[DEMO] Mitsubishi Pajero Sport - Vue extérieure', '[DEMO] Mitsubishi Pajero Sport - Exterior view', 1),
(6, 4, '/uploads/demo/dmax-vue.jpg', '[DEMO] Isuzu D-Max Double Cabine - Extérieur', '[DEMO] Isuzu D-Max Double Cab - Exterior', 1),
(7, 5, '/uploads/demo/mercedes-c200.jpg', '[DEMO] Mercedes-Benz Classe C 200 - Vue d ensemble', '[DEMO] Mercedes-Benz C 200 - General view', 1);

-- ------------------------------------------------------------------------------
-- 6. Réglages généraux (settings)
-- Coordonnées et réseaux sociaux : adresse renseignée, le reste vide
-- ------------------------------------------------------------------------------
INSERT INTO `settings` (`setting_key`, `setting_value`) VALUES
('phone', ''),
('whatsapp', ''),
('email', ''),
('address', 'Abidjan, Cocody, Angré Oscars'),
('facebook', ''),
('instagram', ''),
('linkedin', '');

SET foreign_key_checks = 1;
