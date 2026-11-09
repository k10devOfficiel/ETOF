<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use PDO;

/**
 * Contrôleur du catalogue produits (ferme, élevage et fournitures de bureau).
 */
final class ProductController
{
    /**
     * Dictionnaire d'alias pour la correspondance bilingue des slugs de catégories.
     *
     * @var array<string, string>
     */
    private const CATEGORY_ALIASES = [
        'eggs' => 'oeufs',
        'egg' => 'oeufs',
        'poultry' => 'volailles',
        'stationery' => 'papeterie',
        'consumables' => 'consommables',
        'furniture' => 'mobilier',
        'sedans' => 'berlines',
        'suv' => 'suv-et-4x4',
        'vans' => 'utilitaires-et-camions',
        'trucks' => 'utilitaires-et-camions',
    ];

    /**
     * Liste paginée des produits actifs avec filtres et internationalisation.
     */
    public function index(Request $request): Response
    {
        $pdo = Database::getConnection();
        $lang = $request->getLang();

        $page = max(1, (int) $request->getQuery('page', 1));
        $perPage = min(48, max(1, (int) $request->getQuery('per_page', 12)));
        $offset = ($page - 1) * $perPage;

        $categoryParam = $request->getQuery('category');
        $activityParam = $request->getQuery('activity');
        $searchParam = $request->getQuery('q');
        $availableParam = $request->getQuery('available');

        $whereConditions = ['p.is_active = 1', 'c.is_active = 1'];
        $params = [];

        // Filtre par activité (ferme, fournitures)
        if (is_string($activityParam) && in_array($activityParam, ['farm', 'office', 'vehicle'], true)) {
            $whereConditions[] = 'c.activity = :activity';
            $params[':activity'] = $activityParam;
        }

        // Filtre par catégorie (slug ou alias bilingue)
        if (is_string($categoryParam) && trim($categoryParam) !== '') {
            $catSlug = strtolower(trim($categoryParam));
            $mappedSlug = self::CATEGORY_ALIASES[$catSlug] ?? $catSlug;

            $whereConditions[] = '(c.slug = :cat_slug OR c.slug = :cat_mapped)';
            $params[':cat_slug'] = $catSlug;
            $params[':cat_mapped'] = $mappedSlug;
        }

        // Filtre par recherche texte (nom, description, référence)
        if (is_string($searchParam) && trim($searchParam) !== '') {
            $searchTerm = '%' . trim($searchParam) . '%';
            $whereConditions[] = '(p.name_fr LIKE :q1 OR p.name_en LIKE :q2 OR p.description_fr LIKE :q3 OR p.description_en LIKE :q4 OR p.reference LIKE :q5)';
            $params[':q1'] = $searchTerm;
            $params[':q2'] = $searchTerm;
            $params[':q3'] = $searchTerm;
            $params[':q4'] = $searchTerm;
            $params[':q5'] = $searchTerm;
        }

        // Filtre par disponibilité (0 ou 1)
        if ($availableParam !== null && $availableParam !== '') {
            $whereConditions[] = 'p.is_available = :is_available';
            $params[':is_available'] = (int) $availableParam > 0 ? 1 : 0;
        }

        $whereSql = implode(' AND ', $whereConditions);

        // Comptage total
        $countSql = "SELECT COUNT(*) FROM products p 
                     INNER JOIN categories c ON p.category_id = c.id 
                     WHERE {$whereSql}";
        $countStmt = $pdo->prepare($countSql);
        foreach ($params as $paramKey => $paramVal) {
            $countStmt->bindValue($paramKey, $paramVal, is_int($paramVal) ? PDO::PARAM_INT : PDO::PARAM_STR);
        }
        $countStmt->execute();
        $total = (int) $countStmt->fetchColumn();

        // Récupération paginée des produits
        $sql = "SELECT p.id, p.slug, p.reference, p.name_fr, p.name_en, 
                       p.description_fr, p.description_en, p.unit_fr, p.unit_en,
                       p.price, p.specs, p.min_quantity, p.is_orderable, p.is_available, 
                       p.image, p.sort_order, p.created_at,
                       c.id AS category_id, c.slug AS category_slug, 
                       c.name_fr AS category_name_fr, c.name_en AS category_name_en,
                       c.activity AS category_activity
                FROM products p
                INNER JOIN categories c ON p.category_id = c.id
                WHERE {$whereSql}
                ORDER BY p.sort_order ASC, p.created_at DESC, p.id ASC
                LIMIT :limit OFFSET :offset";

        $stmt = $pdo->prepare($sql);
        foreach ($params as $paramKey => $paramVal) {
            $stmt->bindValue($paramKey, $paramVal, is_int($paramVal) ? PDO::PARAM_INT : PDO::PARAM_STR);
        }
        $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $rows = $stmt->fetchAll();
        $productIds = array_map(fn ($r) => (int) $r['id'], $rows);

        // Chargement groupé optimisé des images multi-angles
        $imagesByProduct = [];
        if (!empty($productIds)) {
            $inClause = implode(',', $productIds);
            $imgStmt = $pdo->query("SELECT id, product_id, path, alt_fr, alt_en, sort_order 
                                    FROM product_images 
                                    WHERE product_id IN ({$inClause}) 
                                    ORDER BY sort_order ASC, id ASC");
            if ($imgStmt) {
                while ($img = $imgStmt->fetch(PDO::FETCH_ASSOC)) {
                    $pid = (int) $img['product_id'];
                    $imagesByProduct[$pid][] = [
                        'id' => (int) $img['id'],
                        'path' => (string) $img['path'],
                        'alt' => $lang === 'en' && !empty($img['alt_en']) ? (string) $img['alt_en'] : (string) ($img['alt_fr'] ?? ''),
                        'sort_order' => (int) $img['sort_order'],
                    ];
                }
            }
        }

        $items = array_map(fn (array $row) => $this->formatProduct($row, $lang, $imagesByProduct[(int) $row['id']] ?? []), $rows);

        return Response::success([
            'items' => $items,
            'pagination' => [
                'page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'total_pages' => (int) ceil($total / $perPage),
            ],
        ]);
    }

    /**
     * Fiche détaillée d'un produit par son slug unique avec galerie multi-angles.
     *
     * @param array<string, string> $params
     */
    public function show(Request $request, array $params): Response
    {
        $pdo = Database::getConnection();
        $lang = $request->getLang();
        $slug = $params['slug'] ?? '';

        $sql = "SELECT p.id, p.slug, p.reference, p.name_fr, p.name_en, 
                       p.description_fr, p.description_en, p.unit_fr, p.unit_en,
                       p.price, p.specs, p.min_quantity, p.is_orderable, p.is_available, 
                       p.image, p.sort_order, p.created_at,
                       c.id AS category_id, c.slug AS category_slug, 
                       c.name_fr AS category_name_fr, c.name_en AS category_name_en,
                       c.activity AS category_activity
                FROM products p
                INNER JOIN categories c ON p.category_id = c.id
                WHERE p.slug = :slug AND p.is_active = 1 AND c.is_active = 1
                LIMIT 1";

        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(':slug', $slug, PDO::PARAM_STR);
        $stmt->execute();

        $row = $stmt->fetch();
        if ($row === false) {
            return Response::error('PRODUCT_NOT_FOUND', "Le produit demandé est introuvable ou indisponible.", 404);
        }

        $productId = (int) $row['id'];
        $imgStmt = $pdo->prepare("SELECT id, path, alt_fr, alt_en, sort_order 
                                  FROM product_images 
                                  WHERE product_id = :pid 
                                  ORDER BY sort_order ASC, id ASC");
        $imgStmt->bindValue(':pid', $productId, PDO::PARAM_INT);
        $imgStmt->execute();
        $images = [];
        while ($img = $imgStmt->fetch(PDO::FETCH_ASSOC)) {
            $images[] = [
                'id' => (int) $img['id'],
                'path' => (string) $img['path'],
                'alt' => $lang === 'en' && !empty($img['alt_en']) ? (string) $img['alt_en'] : (string) ($img['alt_fr'] ?? ''),
                'sort_order' => (int) $img['sort_order'],
            ];
        }

        return Response::success($this->formatProduct($row, $lang, $images));
    }

    /**
     * Formate l'enregistrement produit selon la langue courante et sans exposer les colonnes internes.
     *
     * @param array<string, mixed> $row
     * @param array<int, array<string, mixed>> $images
     * @return array<string, mixed>
     */
    private function formatProduct(array $row, string $lang, array $images = []): array
    {
        $isEn = ($lang === 'en');

        $name = ($isEn && !empty($row['name_en'])) ? (string) $row['name_en'] : (string) $row['name_fr'];
        $description = ($isEn && !empty($row['description_en'])) ? (string) $row['description_en'] : (string) ($row['description_fr'] ?? '');
        $unit = ($isEn && !empty($row['unit_en'])) ? (string) $row['unit_en'] : (string) ($row['unit_fr'] ?? '');

        $categoryName = ($isEn && !empty($row['category_name_en']))
            ? (string) $row['category_name_en']
            : (string) $row['category_name_fr'];

        $specs = [];
        if (!empty($row['specs'])) {
            $decoded = json_decode((string) $row['specs'], true);
            if (is_array($decoded)) {
                $specs = $decoded;
            }
        }

        return [
            'id' => (int) $row['id'],
            'slug' => (string) $row['slug'],
            'reference' => $row['reference'] !== null ? (string) $row['reference'] : null,
            'name' => $name,
            'description' => $description !== '' ? $description : null,
            'unit' => $unit !== '' ? $unit : null,
            'price' => $row['price'] !== null ? (int) $row['price'] : null,
            'specs' => $specs,
            'min_quantity' => (int) $row['min_quantity'],
            'is_orderable' => (bool) $row['is_orderable'],
            'is_available' => (bool) $row['is_available'],
            'image' => $row['image'] !== null ? (string) $row['image'] : null,
            'images' => $images,
            'category' => [
                'id' => (int) $row['category_id'],
                'slug' => (string) $row['category_slug'],
                'activity' => (string) $row['category_activity'],
                'name' => $categoryName,
            ],
        ];
    }
}

