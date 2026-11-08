<?php

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use App\Core\Config;
use App\Core\Database;
use App\Core\ErrorHandler;

// Initialisation du gestionnaire d'erreurs (journalisation dans storage/logs/)
ErrorHandler::register(__DIR__ . '/../storage/logs');

// Chargement des variables d'environnement
Config::load(__DIR__ . '/..');

$siteUrl = rtrim((string) Config::get('FRONTEND_URL', 'https://www.etofsarl.com'), '/');
$today = date('Y-m-d');

// En-têtes HTTP de réponse XML
if (!headers_sent()) {
    header('Content-Type: application/xml; charset=utf-8');
    header('X-Robots-Tag: noindex, follow'); // Le sitemap lui-même n'est pas une page indexable
}

// Routes statiques
$staticRoutes = [
    ['path' => '', 'priority' => '1.0', 'changefreq' => 'daily'],
    ['path' => '/a-propos', 'priority' => '0.8', 'changefreq' => 'monthly'],
    ['path' => '/activites/ferme', 'priority' => '0.9', 'changefreq' => 'weekly'],
    ['path' => '/activites/vehicules', 'priority' => '0.9', 'changefreq' => 'weekly'],
    ['path' => '/activites/fournitures', 'priority' => '0.9', 'changefreq' => 'weekly'],
    ['path' => '/activites/hydrocarbures', 'priority' => '0.9', 'changefreq' => 'weekly'],
    ['path' => '/catalogue', 'priority' => '0.9', 'changefreq' => 'daily'],
    ['path' => '/vehicules', 'priority' => '0.9', 'changefreq' => 'daily'],
    ['path' => '/devis', 'priority' => '0.8', 'changefreq' => 'monthly'],
    ['path' => '/commande', 'priority' => '0.7', 'changefreq' => 'monthly'],
    ['path' => '/contact', 'priority' => '0.8', 'changefreq' => 'monthly'],
    ['path' => '/mentions-legales', 'priority' => '0.3', 'changefreq' => 'yearly'],
    ['path' => '/politique-de-confidentialite', 'priority' => '0.3', 'changefreq' => 'yearly'],
    ['path' => '/conditions-generales', 'priority' => '0.3', 'changefreq' => 'yearly'],
];

$dynamicProducts = [];
$dynamicVehicles = [];

try {
    $pdo = Database::getConnection();

    // 1. Extraction des fiches produits actives
    $prodStmt = $pdo->prepare(
        'SELECT slug, updated_at, created_at FROM products WHERE is_active = 1 ORDER BY id DESC'
    );
    $prodStmt->execute();
    $products = $prodStmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($products as $prod) {
        $lastmod = !empty($prod['updated_at'])
            ? substr((string) $prod['updated_at'], 0, 10)
            : (!empty($prod['created_at']) ? substr((string) $prod['created_at'], 0, 10) : $today);

        $dynamicProducts[] = [
            'path' => '/catalogue/' . urlencode((string) $prod['slug']),
            'lastmod' => $lastmod,
            'priority' => '0.7',
            'changefreq' => 'weekly',
        ];
    }

    // 2. Extraction des fiches véhicules actives
    $vehStmt = $pdo->prepare(
        'SELECT slug, updated_at, created_at FROM vehicles WHERE is_active = 1 ORDER BY id DESC'
    );
    $vehStmt->execute();
    $vehicles = $vehStmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($vehicles as $veh) {
        $lastmod = !empty($veh['updated_at'])
            ? substr((string) $veh['updated_at'], 0, 10)
            : (!empty($veh['created_at']) ? substr((string) $veh['created_at'], 0, 10) : $today);

        $dynamicVehicles[] = [
            'path' => '/vehicules/' . urlencode((string) $veh['slug']),
            'lastmod' => $lastmod,
            'priority' => '0.7',
            'changefreq' => 'weekly',
        ];
    }
} catch (\Throwable $e) {
    // En cas d'erreur de base de données, l'erreur est consignée et le sitemap se replie sur les pages statiques
    error_log('[SEO Sitemap Error] ' . $e->getMessage());
}

// Construction du document XML
echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"' . "\n";
echo '        xmlns:xhtml="http://www.w3.org/1999/xhtml">' . "\n";

// Rendu des routes statiques
foreach ($staticRoutes as $route) {
    $loc = htmlspecialchars($siteUrl . $route['path'], ENT_XML1, 'UTF-8');
    echo "  <url>\n";
    echo "    <loc>{$loc}</loc>\n";
    echo "    <xhtml:link rel=\"alternate\" hreflang=\"fr\" href=\"{$loc}\" />\n";
    echo "    <xhtml:link rel=\"alternate\" hreflang=\"en\" href=\"{$loc}\" />\n";
    echo "    <xhtml:link rel=\"alternate\" hreflang=\"x-default\" href=\"{$loc}\" />\n";
    echo "    <lastmod>{$today}</lastmod>\n";
    echo "    <changefreq>{$route['changefreq']}</changefreq>\n";
    echo "    <priority>{$route['priority']}</priority>\n";
    echo "  </url>\n";
}

// Rendu des fiches produits dynamiques
foreach ($dynamicProducts as $prod) {
    $loc = htmlspecialchars($siteUrl . $prod['path'], ENT_XML1, 'UTF-8');
    echo "  <url>\n";
    echo "    <loc>{$loc}</loc>\n";
    echo "    <xhtml:link rel=\"alternate\" hreflang=\"fr\" href=\"{$loc}\" />\n";
    echo "    <xhtml:link rel=\"alternate\" hreflang=\"en\" href=\"{$loc}\" />\n";
    echo "    <xhtml:link rel=\"alternate\" hreflang=\"x-default\" href=\"{$loc}\" />\n";
    echo "    <lastmod>{$prod['lastmod']}</lastmod>\n";
    echo "    <changefreq>{$prod['changefreq']}</changefreq>\n";
    echo "    <priority>{$prod['priority']}</priority>\n";
    echo "  </url>\n";
}

// Rendu des fiches véhicules dynamiques
foreach ($dynamicVehicles as $veh) {
    $loc = htmlspecialchars($siteUrl . $veh['path'], ENT_XML1, 'UTF-8');
    echo "  <url>\n";
    echo "    <loc>{$loc}</loc>\n";
    echo "    <xhtml:link rel=\"alternate\" hreflang=\"fr\" href=\"{$loc}\" />\n";
    echo "    <xhtml:link rel=\"alternate\" hreflang=\"en\" href=\"{$loc}\" />\n";
    echo "    <xhtml:link rel=\"alternate\" hreflang=\"x-default\" href=\"{$loc}\" />\n";
    echo "    <lastmod>{$veh['lastmod']}</lastmod>\n";
    echo "    <changefreq>{$veh['changefreq']}</changefreq>\n";
    echo "    <priority>{$veh['priority']}</priority>\n";
    echo "  </url>\n";
}

echo "</urlset>\n";
