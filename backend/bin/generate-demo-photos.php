<?php

declare(strict_types=1);

/**
 * Script de génération des photos de démonstration pour le catalogue ETOF SARL.
 * Produit des images JPEG haute définition (800x600) avec la charte graphique
 * officielle (Bleu Nuit #0B1329 / #172554 et Doré Prestige #C5A059).
 */

$targets = [
    // Produits - Ferme & Élevage
    [
        'file' => 'farm-poulet.jpg',
        'category' => 'FERME & ÉLEVAGE',
        'title' => 'Poulet de Chair Fermier',
        'subtitle' => 'Élevage naturel contrôlé • Abidjan',
        'theme' => 'farm',
    ],
    [
        'file' => 'farm-pintade.jpg',
        'category' => 'FERME & ÉLEVAGE',
        'title' => 'Pintade Locale Fermière',
        'subtitle' => 'Qualité supérieure & saveur authentique',
        'theme' => 'farm',
    ],
    [
        'file' => 'farm-dinde.jpg',
        'category' => 'FERME & ÉLEVAGE',
        'title' => 'Dinde Fermière Entière',
        'subtitle' => 'Idéale pour réceptions et événements',
        'theme' => 'farm',
    ],
    [
        'file' => 'farm-caille.jpg',
        'category' => 'FERME & ÉLEVAGE',
        'title' => 'Caille d\'Élevage',
        'subtitle' => 'Viande tendre et raffinée • Fraîcheur garantie',
        'theme' => 'farm',
    ],
    [
        'file' => 'farm-oeufs-caille.jpg',
        'category' => 'FERME & ÉLEVAGE',
        'title' => 'Œufs Frais de Caille',
        'subtitle' => 'Riches en nutriments • Calibre sélectionné',
        'theme' => 'farm',
    ],
    [
        'file' => 'farm-oeufs-poule.jpg',
        'category' => 'FERME & ÉLEVAGE',
        'title' => 'Œufs Frais de Poule',
        'subtitle' => 'Plateaux de 30 alvéoles • Production locale',
        'theme' => 'farm',
    ],

    // Produits - Fournitures de Bureau
    [
        'file' => 'office-papier.jpg',
        'category' => 'FOURNITURES DE BUREAU',
        'title' => 'Rames Papier A4 80g',
        'subtitle' => 'Blancheur optimale • Carton de 5 rames',
        'theme' => 'office',
    ],
    [
        'file' => 'office-stylos.jpg',
        'category' => 'FOURNITURES DE BUREAU',
        'title' => 'Stylos à Bille Bleus',
        'subtitle' => 'Boîte de 50 • Écriture fluide et durable',
        'theme' => 'office',
    ],
    [
        'file' => 'office-toner.jpg',
        'category' => 'FOURNITURES DE BUREAU',
        'title' => 'Toner Laser Haute Capacité',
        'subtitle' => 'Rendement élevé • Qualité professionnelle',
        'theme' => 'office',
    ],
    [
        'file' => 'office-classeurs.jpg',
        'category' => 'FOURNITURES DE BUREAU',
        'title' => 'Classeurs à Levier 80mm',
        'subtitle' => 'Archivage sécurisé & dos renforcé',
        'theme' => 'office',
    ],
    [
        'file' => 'office-classeur.jpg',
        'category' => 'FOURNITURES DE BUREAU',
        'title' => 'Classeurs à Levier 80mm',
        'subtitle' => 'Archivage sécurisé & dos renforcé',
        'theme' => 'office',
    ],
    [
        'file' => 'office-fauteuil.jpg',
        'category' => 'FOURNITURES DE BUREAU',
        'title' => 'Fauteuil de Bureau Ergonomique',
        'subtitle' => 'Support lombaire & dossier respirant',
        'theme' => 'office',
    ],
    [
        'file' => 'office-bureau.jpg',
        'category' => 'FOURNITURES DE BUREAU',
        'title' => 'Bureau Professionnel Moderne',
        'subtitle' => 'Mobilier de direction avec rangements',
        'theme' => 'office',
    ],

    // Véhicules - Parc Automobile
    [
        'file' => 'prado-avant.jpg',
        'category' => 'PARC AUTOMOBILE • SUV',
        'title' => 'Toyota Land Cruiser Prado TXL',
        'subtitle' => 'Vue avant • 7 Places • Diesel Automatique',
        'theme' => 'vehicle',
    ],
    [
        'file' => 'prado-lateral.jpg',
        'category' => 'PARC AUTOMOBILE • SUV',
        'title' => 'Toyota Land Cruiser Prado TXL',
        'subtitle' => 'Profil latéral • Finition Prestige 2024',
        'theme' => 'vehicle',
    ],
    [
        'file' => 'vehicle-prado.jpg',
        'category' => 'PARC AUTOMOBILE • SUV',
        'title' => 'Toyota Land Cruiser Prado TXL',
        'subtitle' => '4x4 Tout-Terrain • Disponible en location',
        'theme' => 'vehicle',
    ],
    [
        'file' => 'elantra-avant.jpg',
        'category' => 'PARC AUTOMOBILE • BERLINE',
        'title' => 'Hyundai Elantra Executive',
        'subtitle' => 'Vue avant • Berline VIP • Essence Auto',
        'theme' => 'vehicle',
    ],
    [
        'file' => 'elantra-interieur.jpg',
        'category' => 'PARC AUTOMOBILE • BERLINE',
        'title' => 'Hyundai Elantra Executive',
        'subtitle' => 'Intérieur cuir & écran tactile multimédia',
        'theme' => 'vehicle',
    ],
    [
        'file' => 'vehicle-elantra.jpg',
        'category' => 'PARC AUTOMOBILE • BERLINE',
        'title' => 'Hyundai Elantra Executive',
        'subtitle' => 'Berline directionnelle • Déplacements urbains',
        'theme' => 'vehicle',
    ],
    [
        'file' => 'pajero-avant.jpg',
        'category' => 'PARC AUTOMOBILE • 4X4',
        'title' => 'Mitsubishi Pajero Sport GLS',
        'subtitle' => 'Vue extérieure • Robuste & Confortable',
        'theme' => 'vehicle',
    ],
    [
        'file' => 'vehicle-pajero.jpg',
        'category' => 'PARC AUTOMOBILE • 4X4',
        'title' => 'Mitsubishi Pajero Sport GLS',
        'subtitle' => '4x4 Puissant • Disponible à la vente',
        'theme' => 'vehicle',
    ],
    [
        'file' => 'dmax-vue.jpg',
        'category' => 'PARC AUTOMOBILE • UTILITAIRE',
        'title' => 'Isuzu D-Max Double Cabine',
        'subtitle' => 'Pick-up 4x4 • Capacité de charge élevée',
        'theme' => 'vehicle',
    ],
    [
        'file' => 'vehicle-dmax.jpg',
        'category' => 'PARC AUTOMOBILE • UTILITAIRE',
        'title' => 'Isuzu D-Max Double Cabine',
        'subtitle' => 'Idéal travaux chantiers & transport agricole',
        'theme' => 'vehicle',
    ],
    [
        'file' => 'mercedes-c200.jpg',
        'category' => 'PARC AUTOMOBILE • PRESTIGE',
        'title' => 'Mercedes-Benz Classe C 200',
        'subtitle' => 'Finition Avantgarde • Berline Officielle',
        'theme' => 'vehicle',
    ],
    [
        'file' => 'vehicle-classe-c.jpg',
        'category' => 'PARC AUTOMOBILE • PRESTIGE',
        'title' => 'Mercedes-Benz Classe C 200',
        'subtitle' => 'Prestige & Protocole • Hybride Léger',
        'theme' => 'vehicle',
    ],
    [
        'file' => 'vehicle-3008.jpg',
        'category' => 'PARC AUTOMOBILE • SUV',
        'title' => 'Peugeot 3008 GT Line',
        'subtitle' => 'SUV Dynamique • Location Entreprise',
        'theme' => 'vehicle',
    ],
];

$backendUploadsDir = __DIR__ . '/../public/uploads/demo';
$frontendUploadsDir = __DIR__ . '/../../frontend/public/uploads/demo';

if (!is_dir($backendUploadsDir)) {
    mkdir($backendUploadsDir, 0755, true);
}
if (!is_dir($frontendUploadsDir)) {
    mkdir($frontendUploadsDir, 0755, true);
}

$width = 800;
$height = 600;

foreach ($targets as $item) {
    $img = imagecreatetruecolor($width, $height);

    // Palettes selon le thème
    if ($item['theme'] === 'farm') {
        $bgTop = [16, 44, 30];     // Vert forêt sombre
        $bgBottom = [7, 20, 14];
        $accentR = 74; $accentG = 222; $accentB = 128; // Vert émeraude
    } elseif ($item['theme'] === 'office') {
        $bgTop = [15, 30, 60];     // Bleu nuit d'affaires
        $bgBottom = [10, 18, 36];
        $accentR = 96; $accentG = 165; $accentB = 250; // Bleu clair
    } else {
        $bgTop = [11, 19, 41];     // Bleu nuit / Or ETOF
        $bgBottom = [5, 9, 20];
        $accentR = 197; $accentG = 160; $accentB = 89;  // Doré prestige
    }

    // Dégradé vertical élégant
    for ($y = 0; $y < $height; $y++) {
        $ratio = $y / $height;
        $r = (int) ($bgTop[0] + ($bgBottom[0] - $bgTop[0]) * $ratio);
        $g = (int) ($bgTop[1] + ($bgBottom[1] - $bgTop[1]) * $ratio);
        $b = (int) ($bgTop[2] + ($bgBottom[2] - $bgTop[2]) * $ratio);
        $col = imagecolorallocate($img, $r, $g, $b);
        imageline($img, 0, $y, $width, $y, $col);
    }

    // Couleurs d'éléments
    $gold = imagecolorallocate($img, 197, 160, 89);
    $accent = imagecolorallocate($img, $accentR, $accentG, $accentB);
    $white = imagecolorallocate($img, 255, 255, 255);
    $muted = imagecolorallocate($img, 148, 163, 184);
    $cardBg = imagecolorallocatealpha($img, 255, 255, 255, 120);
    $borderColor = imagecolorallocatealpha($img, 197, 160, 89, 90);

    // Cadre intérieur élégant
    imagesetthickness($img, 2);
    imagerectangle($img, 30, 30, $width - 30, $height - 30, $borderColor);

    // Coins décoratifs
    imagesetthickness($img, 3);
    imageline($img, 25, 25, 65, 25, $gold);
    imageline($img, 25, 25, 25, 65, $gold);

    imageline($img, $width - 25, 25, $width - 65, 25, $gold);
    imageline($img, $width - 25, 25, $width - 25, 65, $gold);

    imageline($img, 25, $height - 25, 65, $height - 25, $gold);
    imageline($img, 25, $height - 25, 25, $height - 65, $gold);

    imageline($img, $width - 25, $height - 25, $width - 65, $height - 25, $gold);
    imageline($img, $width - 25, $height - 25, $width - 25, $height - 65, $gold);

    // Badge de catégorie en haut
    $badgeText = '[DEMO]  ' . $item['category'];
    $badgeLen = strlen($badgeText);
    $badgeX = (int) (($width - ($badgeLen * 9)) / 2);
    imagefilledrectangle($img, $badgeX - 15, 75, $badgeX + ($badgeLen * 9) + 15, 105, $cardBg);
    imagerectangle($img, $badgeX - 15, 75, $badgeX + ($badgeLen * 9) + 15, 105, $accent);
    imagestring($img, 4, $badgeX, 82, $badgeText, $accent);

    // Motif graphique central
    $cx = (int) ($width / 2);
    $cy = (int) ($height / 2) - 10;
    imagesetthickness($img, 2);
    imageellipse($img, $cx, $cy - 20, 160, 160, $borderColor);
    imageellipse($img, $cx, $cy - 20, 140, 140, $borderColor);

    // Symbole thématique au centre
    if ($item['theme'] === 'farm') {
        imagestring($img, 5, $cx - 24, $cy - 28, "ELEVAGE", $accent);
    } elseif ($item['theme'] === 'office') {
        imagestring($img, 5, $cx - 24, $cy - 28, "BUREAU", $accent);
    } else {
        imagestring($img, 5, $cx - 18, $cy - 28, "AUTO", $accent);
    }

    // Titre de l'article (grand et centré)
    $title = $item['title'];
    $titleLen = strlen($title);
    $titleX = (int) (($width - ($titleLen * 9)) / 2);
    imagestring($img, 5, $titleX, $cy + 85, $title, $white);

    // Sous-titre descriptif
    $sub = $item['subtitle'];
    $subLen = strlen($sub);
    $subX = (int) (($width - ($subLen * 7.5)) / 2);
    imagestring($img, 3, $subX, $cy + 115, $sub, $muted);

    // Filigrane inférieur officiel ETOF SARL
    $footerText = "ETOF SARL  *  Une nouvelle vision du monde des affaires";
    $footLen = strlen($footerText);
    $footX = (int) (($width - ($footLen * 7.5)) / 2);
    imagestring($img, 3, $footX, $height - 65, $footerText, $gold);

    // Sauvegarde en JPEG haute qualité
    $backendPath = $backendUploadsDir . '/' . $item['file'];
    $frontendPath = $frontendUploadsDir . '/' . $item['file'];

    imagejpeg($img, $backendPath, 92);
    copy($backendPath, $frontendPath);

    imagedestroy($img);
    echo "  [OK] Généré : {$item['file']}\n";
}

echo "\n[✓] Total : " . count($targets) . " photos de démonstration créées avec succès dans backend et frontend.\n";

