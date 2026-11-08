<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use PDO;

/**
 * Contrôleur du parc de véhicules proposés à la vente et/ou à la location.
 */
final class VehicleController
{
    /**
     * Liste paginée des véhicules actifs avec filtres, image principale et internationalisation.
     */
    public function index(Request $request): Response
    {
        $pdo = Database::getConnection();
        $lang = $request->getLang();

        $page = max(1, (int) $request->getQuery('page', 1));
        $perPage = min(48, max(1, (int) $request->getQuery('per_page', 12)));
        $offset = ($page - 1) * $perPage;

        $typeParam = $request->getQuery('type');
        $modeParam = $request->getQuery('mode');
        $statusParam = $request->getQuery('status');
        $brandParam = $request->getQuery('brand');

        $whereConditions = ['v.is_active = 1', 'c.is_active = 1'];
        $params = [];

        // Filtre par catégorie de véhicule (slug ou alias)
        if (is_string($typeParam) && trim($typeParam) !== '') {
            $whereConditions[] = '(c.slug = :type_slug OR LOWER(c.name_fr) LIKE :type_term OR LOWER(c.name_en) LIKE :type_term)';
            $params[':type_slug'] = strtolower(trim($typeParam));
            $params[':type_term'] = '%' . strtolower(trim($typeParam)) . '%';
        }

        // Filtre par mode (sale, rental, both)
        if (is_string($modeParam) && in_array(strtolower(trim($modeParam)), ['sale', 'rental', 'both'], true)) {
            $mode = strtolower(trim($modeParam));
            if ($mode === 'sale') {
                $whereConditions[] = "v.mode IN ('sale', 'both')";
            } elseif ($mode === 'rental') {
                $whereConditions[] = "v.mode IN ('rental', 'both')";
            } else {
                $whereConditions[] = "v.mode = 'both'";
            }
        }

        // Filtre par statut (available, reserved, sold, unavailable)
        if (is_string($statusParam) && in_array(strtolower(trim($statusParam)), ['available', 'reserved', 'sold', 'unavailable'], true)) {
            $whereConditions[] = 'v.status = :status';
            $params[':status'] = strtolower(trim($statusParam));
        }

        // Filtre par marque
        if (is_string($brandParam) && trim($brandParam) !== '') {
            $whereConditions[] = 'LOWER(v.brand) LIKE :brand';
            $params[':brand'] = '%' . strtolower(trim($brandParam)) . '%';
        }

        $whereSql = implode(' AND ', $whereConditions);

        // Comptage total
        $countSql = "SELECT COUNT(*) FROM vehicles v 
                     INNER JOIN categories c ON v.category_id = c.id 
                     WHERE {$whereSql}";
        $countStmt = $pdo->prepare($countSql);
        foreach ($params as $paramKey => $paramVal) {
            $countStmt->bindValue($paramKey, $paramVal, PDO::PARAM_STR);
        }
        $countStmt->execute();
        $total = (int) $countStmt->fetchColumn();

        // Récupération paginée avec sous-requête pour la photo principale
        $sql = "SELECT v.id, v.slug, v.brand, v.model, v.year, v.mode, 
                       v.price_sale, v.price_rental_day, v.status, 
                       v.description_fr, v.description_en, v.created_at,
                       c.id AS category_id, c.slug AS category_slug, 
                       c.name_fr AS category_name_fr, c.name_en AS category_name_en,
                       (SELECT vi.path FROM vehicle_images vi 
                        WHERE vi.vehicle_id = v.id 
                        ORDER BY vi.sort_order ASC, vi.id ASC 
                        LIMIT 1) AS main_image
                FROM vehicles v
                INNER JOIN categories c ON v.category_id = c.id
                WHERE {$whereSql}
                ORDER BY c.sort_order ASC, v.created_at DESC, v.id ASC
                LIMIT :limit OFFSET :offset";

        $stmt = $pdo->prepare($sql);
        foreach ($params as $paramKey => $paramVal) {
            $stmt->bindValue($paramKey, $paramVal, PDO::PARAM_STR);
        }
        $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $rows = $stmt->fetchAll();
        $items = array_map(fn (array $row) => $this->formatVehicleSummary($row, $lang), $rows);

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
     * Fiche détaillée d'un véhicule incluant sa galerie d'images et ses spécifications JSON.
     *
     * @param array<string, string> $params
     */
    public function show(Request $request, array $params): Response
    {
        $pdo = Database::getConnection();
        $lang = $request->getLang();
        $slug = $params['slug'] ?? '';

        $sql = "SELECT v.id, v.slug, v.brand, v.model, v.year, v.mode, 
                       v.price_sale, v.price_rental_day, v.status, v.specs,
                       v.description_fr, v.description_en, v.created_at,
                       c.id AS category_id, c.slug AS category_slug, 
                       c.name_fr AS category_name_fr, c.name_en AS category_name_en
                FROM vehicles v
                INNER JOIN categories c ON v.category_id = c.id
                WHERE v.slug = :slug AND v.is_active = 1 AND c.is_active = 1
                LIMIT 1";

        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(':slug', $slug, PDO::PARAM_STR);
        $stmt->execute();

        $row = $stmt->fetch();
        if ($row === false) {
            return Response::error('VEHICLE_NOT_FOUND', "Le véhicule demandé est introuvable ou indisponible.", 404);
        }

        $vehicleId = (int) $row['id'];

        // Récupération de la galerie de photos
        $imgStmt = $pdo->prepare("SELECT id, path, alt_fr, alt_en, sort_order 
                                  FROM vehicle_images 
                                  WHERE vehicle_id = :vehicle_id 
                                  ORDER BY sort_order ASC, id ASC");
        $imgStmt->bindValue(':vehicle_id', $vehicleId, PDO::PARAM_INT);
        $imgStmt->execute();
        $imageRows = $imgStmt->fetchAll();

        $images = [];
        foreach ($imageRows as $img) {
            $alt = ($lang === 'en' && !empty($img['alt_en']))
                ? (string) $img['alt_en']
                : (string) ($img['alt_fr'] ?? '');

            $images[] = [
                'id' => (int) $img['id'],
                'path' => (string) $img['path'],
                'alt' => $alt !== '' ? $alt : null,
                'sort_order' => (int) $img['sort_order'],
            ];
        }

        $isEn = ($lang === 'en');
        $description = ($isEn && !empty($row['description_en']))
            ? (string) $row['description_en']
            : (string) ($row['description_fr'] ?? '');

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

        return Response::success([
            'id' => $vehicleId,
            'slug' => (string) $row['slug'],
            'brand' => (string) $row['brand'],
            'model' => (string) $row['model'],
            'year' => (int) $row['year'],
            'mode' => (string) $row['mode'],
            'status' => (string) $row['status'],
            'price_sale' => $row['price_sale'] !== null ? (int) $row['price_sale'] : null,
            'price_rental_day' => $row['price_rental_day'] !== null ? (int) $row['price_rental_day'] : null,
            'specs' => $specs,
            'description' => $description !== '' ? $description : null,
            'category' => [
                'id' => (int) $row['category_id'],
                'slug' => (string) $row['category_slug'],
                'name' => $categoryName,
            ],
            'images' => $images,
        ]);
    }

    /**
     * Formate un véhicule pour la vue liste (avec image principale).
     *
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function formatVehicleSummary(array $row, string $lang): array
    {
        $isEn = ($lang === 'en');

        $description = ($isEn && !empty($row['description_en']))
            ? (string) $row['description_en']
            : (string) ($row['description_fr'] ?? '');

        $categoryName = ($isEn && !empty($row['category_name_en']))
            ? (string) $row['category_name_en']
            : (string) $row['category_name_fr'];

        return [
            'id' => (int) $row['id'],
            'slug' => (string) $row['slug'],
            'brand' => (string) $row['brand'],
            'model' => (string) $row['model'],
            'year' => (int) $row['year'],
            'mode' => (string) $row['mode'],
            'status' => (string) $row['status'],
            'price_sale' => $row['price_sale'] !== null ? (int) $row['price_sale'] : null,
            'price_rental_day' => $row['price_rental_day'] !== null ? (int) $row['price_rental_day'] : null,
            'description' => $description !== '' ? $description : null,
            'main_image' => $row['main_image'] !== null ? (string) $row['main_image'] : null,
            'category' => [
                'id' => (int) $row['category_id'],
                'slug' => (string) $row['category_slug'],
                'name' => $categoryName,
            ],
        ];
    }
}

