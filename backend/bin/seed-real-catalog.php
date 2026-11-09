<?php

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use App\Core\Config;
use App\Core\Database;

Config::load(__DIR__ . '/..');
$pdo = Database::getConnection();

$uploadDir = __DIR__ . '/../public/uploads/catalog';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0775, true);
}

/**
 * Télécharge une image réelle si elle n'existe pas déjà.
 */
function downloadImage(string $url, string $destPath): bool
{
    if (file_exists($destPath) && filesize($destPath) > 5000) {
        return true;
    }

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ETOFCatalog/1.0');
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    $data = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200 && is_string($data) && strlen($data) > 2000) {
        file_put_contents($destPath, $data);
        return true;
    }

    return false;
}

// -------------------------------------------------------------
// 1. DÉFINITION DES 10 VÉHICULES RÉELS
// -------------------------------------------------------------
$vehicles = [
    [
        'category_slug' => 'suv-et-4x4',
        'slug' => 'toyota-land-cruiser-prado-txl-2024',
        'brand' => 'Toyota',
        'model' => 'Land Cruiser Prado TXL',
        'year' => 2024,
        'mode' => 'both',
        'price_sale' => 45000000,
        'price_rental_day' => 85000,
        'status' => 'available',
        'image_url' => 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=900&q=80',
        'file' => 'vehicle-toyota-prado-2024.jpg',
        'specs' => [
            'transmission' => 'Automatique 6 rapports',
            'fuel' => 'Diesel',
            'seats' => 7,
            'doors' => 5,
            'engine' => '2.8L D-4D Turbo',
            'air_conditioning' => true,
            'gps' => true,
            'bluetooth' => true,
            'camera' => true,
        ],
        'desc_fr' => 'Le tout nouveau Toyota Land Cruiser Prado TXL 2024 allie robustesse tout-terrain et confort grand luxe pour vos missions et déplacements officiels à Abidjan et en intérieur de pays.',
        'desc_en' => 'The all-new 2024 Toyota Land Cruiser Prado TXL combines off-road ruggedness with premium executive comfort for all your travels in Abidjan and across Ivory Coast.',
    ],
    [
        'category_slug' => 'suv-et-4x4',
        'slug' => 'mitsubishi-pajero-sport-gls-2023',
        'brand' => 'Mitsubishi',
        'model' => 'Pajero Sport GLS 4x4',
        'year' => 2023,
        'mode' => 'both',
        'price_sale' => 32000000,
        'price_rental_day' => 65000,
        'status' => 'available',
        'image_url' => 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=900&q=80',
        'file' => 'vehicle-mitsubishi-pajero-2023.jpg',
        'specs' => [
            'transmission' => 'Automatique 8 rapports',
            'fuel' => 'Diesel',
            'seats' => 7,
            'doors' => 5,
            'engine' => '2.4L MIVEC Turbo Diesel',
            'air_conditioning' => true,
            'gps' => true,
            'bluetooth' => true,
            'camera' => true,
        ],
        'desc_fr' => 'Grand SUV 7 places puissant et sécurisant, parfait pour les routes ivoiriennes, missions d’entreprises et voyages en famille.',
        'desc_en' => 'Powerful and safe 7-seater SUV, ideally engineered for Ivorian roads, corporate field missions, and family trips.',
    ],
    [
        'category_slug' => 'utilitaires-et-camions',
        'slug' => 'toyota-hilux-double-cabine-4x4-2024',
        'brand' => 'Toyota',
        'model' => 'Hilux Double Cabine 4x4',
        'year' => 2024,
        'mode' => 'both',
        'price_sale' => 28500000,
        'price_rental_day' => 60000,
        'status' => 'available',
        'image_url' => 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&w=900&q=80',
        'file' => 'vehicle-toyota-hilux-2024.jpg',
        'specs' => [
            'transmission' => 'Manuelle 6 vitesses',
            'fuel' => 'Diesel',
            'seats' => 5,
            'doors' => 4,
            'engine' => '2.4L D-4D',
            'air_conditioning' => true,
            'gps' => false,
            'bluetooth' => true,
            'camera' => true,
        ],
        'desc_fr' => 'La référence incontestée des pickups tout-terrain en Côte d’Ivoire. Charge utile exceptionnelle, motricité 4x4 intégrale et climatisation renforcée.',
        'desc_en' => 'The undisputed benchmark for 4x4 pickup trucks in Ivory Coast. Exceptional payload, heavy-duty AWD, and high-capacity tropical air conditioning.',
    ],
    [
        'category_slug' => 'utilitaires-et-camions',
        'slug' => 'isuzu-d-max-v-cross-4x4-2023',
        'brand' => 'Isuzu',
        'model' => 'D-Max V-Cross Double Cabine',
        'year' => 2023,
        'mode' => 'both',
        'price_sale' => 26500000,
        'price_rental_day' => 55000,
        'status' => 'available',
        'image_url' => 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=900&q=80',
        'file' => 'vehicle-isuzu-dmax-2023.jpg',
        'specs' => [
            'transmission' => 'Automatique 6 vitesses',
            'fuel' => 'Diesel',
            'seats' => 5,
            'doors' => 4,
            'engine' => '3.0L Ddi BluePower',
            'air_conditioning' => true,
            'gps' => true,
            'bluetooth' => true,
            'camera' => true,
        ],
        'desc_fr' => 'Pickup ultra endurant et économique, adapté aux chantiers, exploitations agricoles et longs trajets interurbains.',
        'desc_en' => 'Heavy-duty, fuel-efficient pickup truck built for industrial sites, agricultural operations, and long highway journeys.',
    ],
    [
        'category_slug' => 'berlines',
        'slug' => 'hyundai-elantra-prestige-2023',
        'brand' => 'Hyundai',
        'model' => 'Elantra Prestige Edition',
        'year' => 2023,
        'mode' => 'both',
        'price_sale' => 18000000,
        'price_rental_day' => 45000,
        'status' => 'available',
        'image_url' => 'https://images.unsplash.com/photo-1617469767053-d3b523a0b982?auto=format&fit=crop&w=900&q=80',
        'file' => 'vehicle-hyundai-elantra-2023.jpg',
        'specs' => [
            'transmission' => 'Automatique IVT',
            'fuel' => 'Essence',
            'seats' => 5,
            'doors' => 4,
            'engine' => '1.6L MPI Smartstream',
            'air_conditioning' => true,
            'gps' => true,
            'bluetooth' => true,
            'camera' => true,
        ],
        'desc_fr' => 'Berline moderne au design profilé, dotée d’un intérieur cuir grand confort et d’un écran multimédia tactile complet.',
        'desc_en' => 'Modern stylish sedan featuring premium leather seating, touchscreen infotainment, and superior fuel economy.',
    ],
    [
        'category_slug' => 'berlines',
        'slug' => 'mercedes-benz-classe-c-200-2024',
        'brand' => 'Mercedes-Benz',
        'model' => 'Classe C 200 Avantgarde',
        'year' => 2024,
        'mode' => 'both',
        'price_sale' => 42000000,
        'price_rental_day' => 100000,
        'status' => 'available',
        'image_url' => 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=900&q=80',
        'file' => 'vehicle-mercedes-c200-2024.jpg',
        'specs' => [
            'transmission' => 'Automatique 9G-TRONIC',
            'fuel' => 'Essence Mild-Hybrid',
            'seats' => 5,
            'doors' => 4,
            'engine' => '1.5L Turbo 204 ch',
            'air_conditioning' => true,
            'gps' => true,
            'bluetooth' => true,
            'camera' => true,
        ],
        'desc_fr' => 'Le sommet du raffinement exécutif pour délégations diplomatiques, chefs d’entreprise et cérémonies officielles à Abidjan.',
        'desc_en' => 'The ultimate VIP executive luxury sedan for diplomatic delegations, CEOs, and high-profile corporate events.',
    ],
    [
        'category_slug' => 'suv-et-4x4',
        'slug' => 'peugeot-3008-allure-pack-2023',
        'brand' => 'Peugeot',
        'model' => '3008 Allure Pack',
        'year' => 2023,
        'mode' => 'rental',
        'price_sale' => null,
        'price_rental_day' => 50000,
        'status' => 'available',
        'image_url' => 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80',
        'file' => 'vehicle-peugeot-3008-2023.jpg',
        'specs' => [
            'transmission' => 'Automatique EAT8',
            'fuel' => 'Essence',
            'seats' => 5,
            'doors' => 5,
            'engine' => '1.6L PureTech 180 ch',
            'air_conditioning' => true,
            'gps' => true,
            'bluetooth' => true,
            'camera' => true,
        ],
        'desc_fr' => 'SUV compact chic et dynamique avec combiné i-Cockpit, toit panoramique et confort feutré pour vos séjours d’affaires.',
        'desc_en' => 'Chic, dynamic crossover featuring Peugeot i-Cockpit, panoramic sunroof, and silent premium cabin.',
    ],
    [
        'category_slug' => 'suv-et-4x4',
        'slug' => 'toyota-rav4-hybride-awd-2024',
        'brand' => 'Toyota',
        'model' => 'RAV4 Hybride AWD',
        'year' => 2024,
        'mode' => 'both',
        'price_sale' => 29500000,
        'price_rental_day' => 60000,
        'status' => 'available',
        'image_url' => 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=900&q=80',
        'file' => 'vehicle-toyota-rav4-2024.jpg',
        'specs' => [
            'transmission' => 'Automatique e-CVT',
            'fuel' => 'Hybride Essence/Électrique',
            'seats' => 5,
            'doors' => 5,
            'engine' => '2.5L Hybrid Dynamic Force',
            'air_conditioning' => true,
            'gps' => true,
            'bluetooth' => true,
            'camera' => true,
        ],
        'desc_fr' => 'SUV technologique à très basse consommation, 4 roues motrices intelligentes et conduite souple et silencieuse en ville.',
        'desc_en' => 'Ultra-efficient AWD hybrid SUV with seamless smart driving, superior reliability, and quiet cabin.',
    ],
    [
        'category_slug' => 'utilitaires-et-camions',
        'slug' => 'toyota-hiace-minibus-15-places-2023',
        'brand' => 'Toyota',
        'model' => 'HiAce Commuter 15 Places',
        'year' => 2023,
        'mode' => 'both',
        'price_sale' => 31000000,
        'price_rental_day' => 75000,
        'status' => 'available',
        'image_url' => 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=900&q=80',
        'file' => 'vehicle-toyota-hiace-2023.jpg',
        'specs' => [
            'transmission' => 'Manuelle 5 vitesses',
            'fuel' => 'Diesel',
            'seats' => 15,
            'doors' => 4,
            'engine' => '2.8L Turbo Diesel',
            'air_conditioning' => true,
            'gps' => false,
            'bluetooth' => true,
            'camera' => false,
        ],
        'desc_fr' => 'Minibus grand confort climatisé 15 places, solution idéale pour le transport de personnel d’entreprise et délégations.',
        'desc_en' => 'Comfortable 15-passenger air-conditioned shuttle minibus, optimal for staff transport and group delegations.',
    ],
    [
        'category_slug' => 'berlines',
        'slug' => 'bmw-serie-5-530i-executive-2023',
        'brand' => 'BMW',
        'model' => 'Série 5 530i Executive',
        'year' => 2023,
        'mode' => 'both',
        'price_sale' => 48000000,
        'price_rental_day' => 110000,
        'status' => 'available',
        'image_url' => 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=900&q=80',
        'file' => 'vehicle-bmw-serie5-2023.jpg',
        'specs' => [
            'transmission' => 'Automatique Steptronic 8',
            'fuel' => 'Essence',
            'seats' => 5,
            'doors' => 4,
            'engine' => '2.0L TwinPower Turbo 252 ch',
            'air_conditioning' => true,
            'gps' => true,
            'bluetooth' => true,
            'camera' => true,
        ],
        'desc_fr' => 'Berline statutaire de prestige, insonorisation remarquable, sellerie cuir Nappa et technologies de conduite assistée.',
        'desc_en' => 'Prestige executive sedan with Nappa leather, superior acoustic insulation, and advanced driver assistance.',
    ],
];

// -------------------------------------------------------------
// 2. DÉFINITION DES 10 PRODUITS FERME & VOLAILLE
// -------------------------------------------------------------
$farmProducts = [
    [
        'category_slug' => 'volailles',
        'slug' => 'poulet-de-chair-fermier-pret-a-cuire',
        'reference' => 'FRM-VOL-001',
        'name_fr' => 'Poulet de chair fermier prêt à cuire (1.4 - 1.6 kg)',
        'name_en' => 'Ready-to-Cook Farm Broiler Chicken (1.4 - 1.6 kg)',
        'desc_fr' => 'Poulet fermier élevé en plein air, nourri aux céréales saines, abattu selon les normes sanitaires strictes. Chair ferme et savoureuse.',
        'desc_en' => 'Free-range farm chicken fed natural grain diets, processed under strict sanitary standards. Tender and flavorful meat.',
        'unit_fr' => 'pièce',
        'unit_en' => 'piece',
        'price' => 3500,
        'min_qty' => 2,
        'image_url' => 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Broiler_Chicken.jpg',
        'file' => 'product-poulet-fermier.jpg',
    ],
    [
        'category_slug' => 'volailles',
        'slug' => 'pintade-locale-fermiere-entiere',
        'reference' => 'FRM-VOL-002',
        'name_fr' => 'Pintade locale fermière sélectionnée (1.2 - 1.4 kg)',
        'name_en' => 'Whole Local Farm Guinea Fowl (1.2 - 1.4 kg)',
        'desc_fr' => 'Pintade élevée au sol, viande dense et parfumée, idéale pour les mets traditionnels africains et réceptions gastronomiques.',
        'desc_en' => 'Free-range guinea fowl with lean, aromatic meat, perfect for authentic African cuisine and gourmet dining.',
        'unit_fr' => 'pièce',
        'unit_en' => 'piece',
        'price' => 5500,
        'min_qty' => 1,
        'image_url' => 'https://upload.wikimedia.org/wikipedia/commons/0/09/Gallina_de_Guinea_%28Numida_meleagris%29%2C_parque_nacional_Kruger%2C_Sud%C3%A1frica%2C_2018-07-25%2C_DD_42.jpg',
        'file' => 'product-pintade-fermiere.jpg',
    ],
    [
        'category_slug' => 'volailles',
        'slug' => 'dinde-fermiere-entiere-de-fete',
        'reference' => 'FRM-VOL-003',
        'name_fr' => 'Dinde fermière entière de fête (6 - 8 kg)',
        'name_en' => 'Whole Farm Holiday Turkey (6 - 8 kg)',
        'desc_fr' => 'Dinde de premier choix élevée dans nos fermes partenaires, idéale pour les banquets d’entreprise, fêtes de fin d’année et grands événements.',
        'desc_en' => 'Prime farm turkey raised on local grains, optimal for corporate feasts, holiday gatherings, and large events.',
        'unit_fr' => 'pièce',
        'unit_en' => 'piece',
        'price' => 28000,
        'min_qty' => 1,
        'image_url' => 'https://upload.wikimedia.org/wikipedia/commons/b/bc/20260428_tom_wild_turkey_matthaei_botanical_gardens_PD08952.jpg',
        'file' => 'product-dinde-fermiere.jpg',
    ],
    [
        'category_slug' => 'volailles',
        'slug' => 'cailles-elevage-fermiere-lot-de-4',
        'reference' => 'FRM-VOL-004',
        'name_fr' => 'Cailles d’élevage sélectionnées (Lot de 4 pièces)',
        'name_en' => 'Selected Farm Quails (Pack of 4 pieces)',
        'desc_fr' => 'Petites volailles raffinées, viande très tendre et savoureuse, nettoyées et conditionnées sous atmosphère protectrice.',
        'desc_en' => 'Delicate farm quails with tender gourmet meat, cleaned and hygienically packaged.',
        'unit_fr' => 'lot',
        'unit_en' => 'pack',
        'price' => 6000,
        'min_qty' => 1,
        'image_url' => 'https://upload.wikimedia.org/wikipedia/commons/1/11/Coturnix_japonica%2C_MSU_Faculty_of_Biology%2C_1.JPG',
        'file' => 'product-cailles-lot4.jpg',
    ],
    [
        'category_slug' => 'volailles',
        'slug' => 'coq-fermier-race-locale-gros-calibre',
        'reference' => 'FRM-VOL-005',
        'name_fr' => 'Coq fermier de race locale (Gros calibre 2.2 - 2.5 kg)',
        'name_en' => 'Local Breed Farm Rooster (Large 2.2 - 2.5 kg)',
        'desc_fr' => 'Coq fermier traditionnel vigoureux, chair particulièrement savoureuse pour sauces graines, kédjénou et bouillons.',
        'desc_en' => 'Traditional vigorous farm rooster, highly aromatic and full-flavored for stews and slow-cooked dishes.',
        'unit_fr' => 'pièce',
        'unit_en' => 'piece',
        'price' => 6500,
        'min_qty' => 1,
        'image_url' => 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Rooster_on_a_farm_in_Tarn%2C_France%2C_29_September_2012.jpg',
        'file' => 'product-coq-fermier.jpg',
    ],
    [
        'category_slug' => 'volailles',
        'slug' => 'canard-fermier-barbarie-entier',
        'reference' => 'FRM-VOL-006',
        'name_fr' => 'Canard fermier de Barbarie entier (2.5 - 3 kg)',
        'name_en' => 'Whole Farm Muscovy Duck (2.5 - 3 kg)',
        'desc_fr' => 'Canard de barbarie élevé sainement, viande rouge maigre et savoureuse, idéal pour les rôtis et mijotés d’exception.',
        'desc_en' => 'Muscovy duck raised on nutritious feed, lean and succulent meat, perfect for roasting and braising.',
        'unit_fr' => 'pièce',
        'unit_en' => 'piece',
        'price' => 8500,
        'min_qty' => 1,
        'image_url' => 'https://upload.wikimedia.org/wikipedia/commons/3/37/Crested_Pekin_Duck_%28Anas_platyrhynchos_domestica%29_%281%29.jpg',
        'file' => 'product-canard-fermier.jpg',
    ],
    [
        'category_slug' => 'volailles',
        'slug' => 'poussins-un-jour-vaccines-lot-50',
        'reference' => 'FRM-VOL-007',
        'name_fr' => 'Poussins d’un jour vaccinés Cobb 500 (Carton de 50)',
        'name_en' => 'Day-Old Vaccinated Chicks Cobb 500 (Box of 50)',
        'desc_fr' => 'Poussins d’un jour à forte croissance, issus de couvoirs modernes certifiés, vaccinés contre Newcastle et Marek.',
        'desc_en' => 'Fast-growing day-old chicks from certified hatcheries, vaccinated against Newcastle and Marek disease.',
        'unit_fr' => 'carton',
        'unit_en' => 'box',
        'price' => 27500,
        'min_qty' => 1,
        'image_url' => 'https://upload.wikimedia.org/wikipedia/commons/5/59/Broiler_chicks.jpg',
        'file' => 'product-poussins-50.jpg',
    ],
    [
        'category_slug' => 'oeufs',
        'slug' => 'oeufs-frais-de-poule-fermiere-plateau-30',
        'reference' => 'FRM-OEU-001',
        'name_fr' => 'Œufs frais de poule fermière (Plaquette alvéolée de 30)',
        'name_en' => 'Fresh Farm Chicken Eggs (Tray of 30)',
        'desc_fr' => 'Œufs roux extra-frais de calibre gros (63-73g), ramassés quotidiennement, coquille propre et solide, jaune orangé naturel.',
        'desc_en' => 'Extra-fresh brown grade-A large eggs (63-73g), daily collection, strong shells with rich natural yolks.',
        'unit_fr' => 'plaquette',
        'unit_en' => 'tray',
        'price' => 2500,
        'min_qty' => 2,
        'image_url' => 'https://upload.wikimedia.org/wikipedia/commons/1/12/6-Pack-Chicken-Eggs.jpg',
        'file' => 'product-oeufs-poule-30.jpg',
    ],
    [
        'category_slug' => 'oeufs',
        'slug' => 'oeufs-de-caille-dietetiques-boite-24',
        'reference' => 'FRM-OEU-002',
        'name_fr' => 'Œufs de caille diététiques (Boîte alvéolée de 24)',
        'name_en' => 'Dietary Fresh Quail Eggs (Box of 24)',
        'desc_fr' => 'Œufs de caille naturels reconnus pour leur richesse en vitamines, fer, phosphore et bienfaits antiallergiques.',
        'desc_en' => 'Natural fresh quail eggs packed with vitamins, iron, and essential micro-nutrients.',
        'unit_fr' => 'boîte',
        'unit_en' => 'box',
        'price' => 1800,
        'min_qty' => 2,
        'image_url' => 'https://upload.wikimedia.org/wikipedia/commons/3/33/Wachteleier_im_Karton-20231205-RM-151854.jpg',
        'file' => 'product-oeufs-caille-24.jpg',
    ],
    [
        'category_slug' => 'volailles',
        'slug' => 'aliment-complet-volailles-croissance-50kg',
        'reference' => 'FRM-VOL-008',
        'name_fr' => 'Aliment complet volailles finition & croissance (Sac 50 kg)',
        'name_en' => 'Complete Poultry Growth & Finisher Feed (50 kg Bag)',
        'desc_fr' => 'Formule équilibrée riche en protéines végétales, maïs, soja et compléments minéraux pour optimiser la prise de poids des volailles.',
        'desc_en' => 'Balanced formula enriched with vegetable proteins, corn, and minerals to optimize healthy poultry development.',
        'unit_fr' => 'sac',
        'unit_en' => 'bag',
        'price' => 22500,
        'min_qty' => 1,
        'image_url' => 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80',
        'file' => 'product-aliment-volaille.jpg',
    ],
];

// -------------------------------------------------------------
// 3. DÉFINITION DES 10 FOURNITURES DE BUREAU RÉELLES
// -------------------------------------------------------------
$officeProducts = [
    [
        'category_slug' => 'papeterie',
        'slug' => 'papier-a4-extra-blanc-80g-carton-5-rames',
        'reference' => 'BUR-PAP-001',
        'name_fr' => 'Papier A4 Extra Blanc 80g Double A (Carton de 5 ramettes)',
        'name_en' => 'Extra White A4 Paper 80g Double A (Box of 5 Reams)',
        'desc_fr' => 'Papier reprographique premium haute performance, blancheur CIE 167, garanti sans bourrage pour imprimantes laser, jet d’encre et photocopieurs.',
        'desc_en' => 'Premium high-speed copy paper, CIE 167 whiteness, 100% jam-free guarantee for laser and inkjet office copiers.',
        'unit_fr' => 'carton',
        'unit_en' => 'box',
        'price' => 18500,
        'min_qty' => 1,
        'image_url' => 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=800&q=80',
        'file' => 'product-papier-a4.jpg',
    ],
    [
        'category_slug' => 'papeterie',
        'slug' => 'lot-10-classeurs-levier-dos-80mm-pro',
        'reference' => 'BUR-PAP-002',
        'name_fr' => 'Lot de 10 Classeurs à levier dos 80mm A4 Pro',
        'name_en' => 'Pack of 10 Lever Arch Files 80mm Spine A4 Pro',
        'desc_fr' => 'Classeurs grande capacité avec coins métalliques renforcés, étiquette de dos personnalisable et mécanisme de serrage robuste.',
        'desc_en' => 'Heavy-duty 80mm arch lever binders with reinforced metal corners, label holders, and durable clamping mechanisms.',
        'unit_fr' => 'lot',
        'unit_en' => 'pack',
        'price' => 15000,
        'min_qty' => 1,
        'image_url' => 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=800&q=80',
        'file' => 'product-classeurs-lot10.jpg',
    ],
    [
        'category_slug' => 'papeterie',
        'slug' => 'boite-50-stylos-bille-bic-cristal-bleu',
        'reference' => 'BUR-PAP-003',
        'name_fr' => 'Boîte de 50 Stylos à bille Bic Cristal Pointe Moyenne Bleu',
        'name_en' => 'Box of 50 Bic Cristal Medium Point Ballpoint Pens Blue',
        'desc_fr' => 'Le stylo à bille emblématique, écriture ultra fluide, corps transparent hexagonal et autonomie d’écriture supérieure à 3 km.',
        'desc_en' => 'Iconic smooth ballpoint pens with hexagonal clear barrels and ultra-durable writing longevity.',
        'unit_fr' => 'boîte',
        'unit_en' => 'box',
        'price' => 7500,
        'min_qty' => 1,
        'image_url' => 'https://images.unsplash.com/photo-1585336261026-7f4165d388f8?auto=format&fit=crop&w=800&q=80',
        'file' => 'product-stylos-bille.jpg',
    ],
    [
        'category_slug' => 'consommables',
        'slug' => 'cartouche-toner-laser-noir-hp-haute-capacite',
        'reference' => 'BUR-CSM-001',
        'name_fr' => 'Cartouche de Toner Laser Noir HP Haute Capacité (CF226X)',
        'name_en' => 'High-Yield Black Laser Toner Cartridge HP (CF226X)',
        'desc_fr' => 'Toner original pour imprimantes HP LaserJet Pro. Rendement certifié jusqu’à 9 000 pages, noir intense et textes nets.',
        'desc_en' => 'High-yield toner cartridge for HP LaserJet Pro, up to 9,000 pages of crisp black professional printouts.',
        'unit_fr' => 'unité',
        'unit_en' => 'unit',
        'price' => 42000,
        'min_qty' => 1,
        'image_url' => 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=800&q=80',
        'file' => 'product-toner-hp.jpg',
    ],
    [
        'category_slug' => 'mobilier',
        'slug' => 'fauteuil-direction-ergonomique-mesh-pro',
        'reference' => 'BUR-MOB-001',
        'name_fr' => 'Fauteuil de Direction Ergonomique Mesh Pro Réglable',
        'name_en' => 'Ergonomic Executive Mesh Chair Fully Adjustable',
        'desc_fr' => 'Dossier respirant haute élasticité, soutien lombaire dynamique 3D, accoudoirs ajustables et mécanisme synchrone basculant.',
        'desc_en' => 'High-density breathable mesh backrest, dynamic 3D lumbar support, adjustable armrests, and synchro tilt mechanism.',
        'unit_fr' => 'pièce',
        'unit_en' => 'piece',
        'price' => 125000,
        'min_qty' => 1,
        'image_url' => 'https://images.unsplash.com/photo-1580481077195-c3288b5ea624?auto=format&fit=crop&w=800&q=80',
        'file' => 'product-fauteuil-ergonomique.jpg',
    ],
    [
        'category_slug' => 'mobilier',
        'slug' => 'bureau-direction-executif-chene-caisson',
        'reference' => 'BUR-MOB-002',
        'name_fr' => 'Bureau de Direction Exécutif Finition Chêne avec Caisson',
        'name_en' => 'Executive Oak Finish Office Desk with Integrated Pedestal',
        'desc_fr' => 'Bureau statutaire 180x90cm avec passe-câbles intégré, voile de fond en métal ajouré et caisson de rangement 3 tiroirs sécurisé.',
        'desc_en' => 'Statutory 180x90cm managerial desk with cable management port, modesty panel, and 3-drawer lockable filing pedestal.',
        'unit_fr' => 'pièce',
        'unit_en' => 'piece',
        'price' => 350000,
        'min_qty' => 1,
        'image_url' => 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80',
        'file' => 'product-bureau-direction.jpg',
    ],
    [
        'category_slug' => 'consommables',
        'slug' => 'destructeur-documents-coupe-croisee-securise',
        'reference' => 'BUR-CSM-002',
        'name_fr' => 'Destructeur de documents coupe croisée Fellowes P-4 (12 feuilles)',
        'name_en' => 'Cross-Cut Heavy-Duty Document Shredder Fellowes (12 Sheets)',
        'desc_fr' => 'Protection RGPD de niveau P-4, détruit simultanément agrafes, cartes bancaires et trombones. Bac extractible 23 litres.',
        'desc_en' => 'Security level P-4 cross-cut shredder, destroys staples, credit cards, and paperclips with 23L waste bin.',
        'unit_fr' => 'pièce',
        'unit_en' => 'piece',
        'price' => 85000,
        'min_qty' => 1,
        'image_url' => 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80',
        'file' => 'product-destructeur-papier.jpg',
    ],
    [
        'category_slug' => 'mobilier',
        'slug' => 'table-reunion-ovale-8-10-personnes',
        'reference' => 'BUR-MOB-003',
        'name_fr' => 'Table de Réunion Ovale 8-10 personnes 240x120cm',
        'name_en' => 'Oval Conference Table 8-10 Persons 240x120cm',
        'desc_fr' => 'Plateau mélaminé haute densité anti-rayures, piètement métallique robuste avec goulottes d’électrification intégrées.',
        'desc_en' => 'High-density scratch-resistant top, heavy-duty metallic legs, and integrated cable conduit channels.',
        'unit_fr' => 'pièce',
        'unit_en' => 'piece',
        'price' => 275000,
        'min_qty' => 1,
        'image_url' => 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
        'file' => 'product-table-reunion.jpg',
    ],
    [
        'category_slug' => 'papeterie',
        'slug' => 'agrafeuse-metal-grande-capacite-100-feuilles',
        'reference' => 'BUR-PAP-004',
        'name_fr' => 'Agrafeuse métal grande capacité 100 feuilles + 5000 agrafes',
        'name_en' => 'Heavy Duty 100-Sheet Metal Stapler + 5000 Staples',
        'desc_fr' => 'Structure en acier robuste, système anti-bourrage, levier d’effort démultiplié pour documents épais et dossiers comptables.',
        'desc_en' => 'Durable steel chassis, jam-free mechanism, and effortless high-leverage binding for thick financial reports.',
        'unit_fr' => 'kit',
        'unit_en' => 'kit',
        'price' => 14500,
        'min_qty' => 1,
        'image_url' => 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
        'file' => 'product-agrafeuse-pro.jpg',
    ],
    [
        'category_slug' => 'papeterie',
        'slug' => 'tableau-blanc-magnetique-120x90cm-kit-marqueurs',
        'reference' => 'BUR-PAP-005',
        'name_fr' => 'Tableau blanc magnétique 120x90cm avec auget et kit feutres',
        'name_en' => 'Magnetic Whiteboard 120x90cm with Marker Tray & Accessories',
        'desc_fr' => 'Surface laquée effaçable à sec, cadre aluminium anodisé avec coins de protection, auget porte-accessoires et aimants fournis.',
        'desc_en' => 'Dry-erase lacquered magnetic surface, anodized aluminum frame, mounting kit, markers, and magnets included.',
        'unit_fr' => 'kit',
        'unit_en' => 'kit',
        'price' => 38000,
        'min_qty' => 1,
        'image_url' => 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
        'file' => 'product-tableau-blanc.jpg',
    ],
];

echo "========================================================\n";
echo "    ETOF SARL - Peuplement du Catalogue Réel (10x3)    \n";
echo "========================================================\n\n";

// Cache des catégories
$catMap = [];
$cats = $pdo->query("SELECT id, slug FROM categories")->fetchAll(PDO::FETCH_ASSOC);
foreach ($cats as $c) {
    $catMap[$c['slug']] = (int) $c['id'];
}

// -------------------------------------------------------------
// TRAITEMENT VÉHICULES
// -------------------------------------------------------------
echo "[1/3] Enregistrement des 10 véhicules avec vraies photos...\n";

// Nettoyage préalable pour garder exactement les 10 véhicules demandés
$pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
$pdo->exec("TRUNCATE TABLE vehicle_images");
$pdo->exec("TRUNCATE TABLE vehicles");
$pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

$vehStmt = $pdo->prepare("
    INSERT INTO vehicles (
        category_id, slug, brand, model, year, mode, price_sale, price_rental_day,
        status, specs, description_fr, description_en, is_active, created_at, updated_at
    ) VALUES (
        :category_id, :slug, :brand, :model, :year, :mode, :price_sale, :price_rental_day,
        :status, :specs, :description_fr, :description_en, 1, NOW(), NOW()
    )
");

$imgStmt = $pdo->prepare("
    INSERT INTO vehicle_images (vehicle_id, path, alt_fr, alt_en, sort_order)
    VALUES (:vehicle_id, :path, :alt_fr, :alt_en, 1)
");

$vCount = 0;
foreach ($vehicles as $v) {
    $catId = $catMap[$v['category_slug']] ?? 4;
    $filePath = $uploadDir . '/' . $v['file'];
    $webPath = '/uploads/catalog/' . $v['file'];

    echo "  - Téléchargement photo : {$v['brand']} {$v['model']}... ";
    $ok = downloadImage($v['image_url'], $filePath);
    echo $ok ? "OK\n" : "FAIL (URL)\n";

    $vehStmt->execute([
        'category_id' => $catId,
        'slug' => $v['slug'],
        'brand' => $v['brand'],
        'model' => $v['model'],
        'year' => $v['year'],
        'mode' => $v['mode'],
        'price_sale' => $v['price_sale'],
        'price_rental_day' => $v['price_rental_day'],
        'status' => $v['status'],
        'specs' => json_encode($v['specs'], JSON_UNESCAPED_UNICODE),
        'description_fr' => $v['desc_fr'],
        'description_en' => $v['desc_en'],
    ]);

    $vehicleId = (int) $pdo->lastInsertId();

    $imgStmt->execute([
        'vehicle_id' => $vehicleId,
        'path' => $webPath,
        'alt_fr' => "{$v['brand']} {$v['model']} - ETOF SARL",
        'alt_en' => "{$v['brand']} {$v['model']} - ETOF SARL",
    ]);

    $vCount++;
}
echo "-> $vCount véhicules enregistrés avec succès.\n\n";

// -------------------------------------------------------------
// TRAITEMENT PRODUITS (FERME & BUREAU)
// -------------------------------------------------------------
echo "[2/3] Enregistrement des 10 produits Ferme & Volaille et 10 Bureau...\n";

// Vider les anciens produits pour avoir exactement nos 20 produits (10 ferme + 10 bureau)
$pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
$pdo->exec("TRUNCATE TABLE products");
$pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

$prodStmt = $pdo->prepare("
    INSERT INTO products (
        category_id, slug, reference, name_fr, name_en, description_fr, description_en,
        unit_fr, unit_en, price, min_quantity, is_orderable, is_available, image, is_active,
        sort_order, created_at, updated_at
    ) VALUES (
        :category_id, :slug, :reference, :name_fr, :name_en, :description_fr, :description_en,
        :unit_fr, :unit_en, :price, :min_quantity, 1, 1, :image, 1,
        :sort_order, NOW(), NOW()
    )
");

// Insertion Ferme
$pFarmCount = 0;
foreach ($farmProducts as $idx => $p) {
    $catId = $catMap[$p['category_slug']] ?? 1;
    $filePath = $uploadDir . '/' . $p['file'];
    $webPath = '/uploads/catalog/' . $p['file'];

    echo "  - Téléchargement [Ferme] : {$p['name_fr']}... ";
    $ok = downloadImage($p['image_url'], $filePath);
    echo $ok ? "OK\n" : "FAIL (URL)\n";

    $prodStmt->execute([
        'category_id' => $catId,
        'slug' => $p['slug'],
        'reference' => $p['reference'],
        'name_fr' => $p['name_fr'],
        'name_en' => $p['name_en'],
        'description_fr' => $p['desc_fr'],
        'description_en' => $p['desc_en'],
        'unit_fr' => $p['unit_fr'],
        'unit_en' => $p['unit_en'],
        'price' => $p['price'],
        'min_quantity' => $p['min_qty'],
        'image' => $webPath,
        'sort_order' => $idx + 1,
    ]);
    $pFarmCount++;
}

// Insertion Bureau
$pOfficeCount = 0;
foreach ($officeProducts as $idx => $p) {
    $catId = $catMap[$p['category_slug']] ?? 6;
    $filePath = $uploadDir . '/' . $p['file'];
    $webPath = '/uploads/catalog/' . $p['file'];

    echo "  - Téléchargement [Bureau] : {$p['name_fr']}... ";
    $ok = downloadImage($p['image_url'], $filePath);
    echo $ok ? "OK\n" : "FAIL (URL)\n";

    $prodStmt->execute([
        'category_id' => $catId,
        'slug' => $p['slug'],
        'reference' => $p['reference'],
        'name_fr' => $p['name_fr'],
        'name_en' => $p['name_en'],
        'description_fr' => $p['desc_fr'],
        'description_en' => $p['desc_en'],
        'unit_fr' => $p['unit_fr'],
        'unit_en' => $p['unit_en'],
        'price' => $p['price'],
        'min_quantity' => $p['min_qty'],
        'image' => $webPath,
        'sort_order' => $idx + 1,
    ]);
    $pOfficeCount++;
}

echo "-> $pFarmCount produits Ferme & Volaille enregistrés.\n";
echo "-> $pOfficeCount produits Fournitures de Bureau enregistrés.\n\n";

echo "========================================================\n";
echo "              TOTALEMENT TERMINÉ AVEC SUCCÈS            \n";
echo "========================================================\n";

