<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use App\Core\SlugHelper;
use App\Core\Validator;
use App\Services\UploadService;
use PDO;

/**
 * Contrôleur d'administration pour la gestion complète du parc de véhicules (CRUD, galerie photos, soft/hard delete).
 */
final class AdminVehicleController
{
    /**
     * Liste paginée des véhicules pour l'administration (GET /api/admin/vehicles).
     */
    public function index(Request $request): Response
    {
        $pdo = Database::getConnection();

        $page = max(1, (int) $request->getQuery('page', 1));
        $perPage = min(48, max(1, (int) $request->getQuery('per_page', 12)));
        $offset = ($page - 1) * $perPage;

        $categoryParam = $request->getQuery('category_id');
        $modeParam = $request->getQuery('mode');
        $statusParam = $request->getQuery('status');
        $searchParam = $request->getQuery('q');
        $activeParam = $request->getQuery('is_active');
        $sortBy = strtolower((string) $request->getQuery('sort_by', 'created_at'));
        $order = strtolower((string) $request->getQuery('order', 'desc')) === 'asc' ? 'ASC' : 'DESC';

        $allowedSorts = [
            'created_at' => 'v.created_at',
            'brand' => 'v.brand',
            'model' => 'v.model',
            'year' => 'v.year',
            'id' => 'v.id',
        ];
        $sortColumn = $allowedSorts[$sortBy] ?? 'v.created_at';

        $whereConditions = ['1=1'];
        $params = [];

        if ($categoryParam !== null && $categoryParam !== '') {
            $whereConditions[] = 'v.category_id = :cat_id';
            $params[':cat_id'] = (int) $categoryParam;
        }

        if (is_string($modeParam) && in_array(strtolower(trim($modeParam)), ['sale', 'rental', 'both'], true)) {
            $whereConditions[] = 'v.mode = :mode';
            $params[':mode'] = strtolower(trim($modeParam));
        }

        if (is_string($statusParam) && in_array(strtolower(trim($statusParam)), ['available', 'reserved', 'sold', 'unavailable'], true)) {
            $whereConditions[] = 'v.status = :status';
            $params[':status'] = strtolower(trim($statusParam));
        }

        if (is_string($searchParam) && trim($searchParam) !== '') {
            $searchTerm = '%' . trim($searchParam) . '%';
            $whereConditions[] = '(v.brand LIKE :q OR v.model LIKE :q OR v.slug LIKE :q)';
            $params[':q'] = $searchTerm;
        }

        if ($activeParam !== null && $activeParam !== '') {
            $whereConditions[] = 'v.is_active = :active';
            $params[':active'] = (int) $activeParam > 0 ? 1 : 0;
        }

        $whereSql = implode(' AND ', $whereConditions);

        $countSql = "SELECT COUNT(*) FROM vehicles v WHERE {$whereSql}";
        $countStmt = $pdo->prepare($countSql);
        foreach ($params as $k => $v) {
            $countStmt->bindValue($k, $v, is_int($v) ? PDO::PARAM_INT : PDO::PARAM_STR);
        }
        $countStmt->execute();
        $total = (int) $countStmt->fetchColumn();

        $sql = "SELECT v.*, c.name_fr AS category_name_fr, c.name_en AS category_name_en,
                       (SELECT vi.path FROM vehicle_images vi 
                        WHERE vi.vehicle_id = v.id 
                        ORDER BY vi.sort_order ASC, vi.id ASC 
                        LIMIT 1) AS main_image,
                       (SELECT COUNT(*) FROM vehicle_images vi WHERE vi.vehicle_id = v.id) AS images_count
                FROM vehicles v
                INNER JOIN categories c ON v.category_id = c.id
                WHERE {$whereSql}
                ORDER BY {$sortColumn} {$order}, v.id ASC
                LIMIT :limit OFFSET :offset";

        $stmt = $pdo->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v, is_int($v) ? PDO::PARAM_INT : PDO::PARAM_STR);
        }
        $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $rows = $stmt->fetchAll();
        $items = array_map([$this, 'formatAdminVehicle'], $rows);

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
     * Création d'un nouveau véhicule avec validation stricte (POST /api/admin/vehicles).
     */
    public function store(Request $request): Response
    {
        $pdo = Database::getConnection();
        $body = $request->getBody();

        $validator = new Validator();
        $rules = [
            'category_id' => 'required|integer',
            'brand' => 'required|min:2|max:80',
            'model' => 'required|min:1|max:80',
            'year' => 'required|integer',
            'mode' => 'required|in:sale,rental,both',
            'status' => 'required|in:available,reserved,sold,unavailable',
        ];

        if (!$validator->validate($body, $rules)) {
            return Response::error('VALIDATION_FAILED', 'Données de véhicule invalides.', 422, $validator->getErrors());
        }

        $categoryId = (int) $body['category_id'];
        $catStmt = $pdo->prepare("SELECT id, activity FROM categories WHERE id = :id LIMIT 1");
        $catStmt->bindValue(':id', $categoryId, PDO::PARAM_INT);
        $catStmt->execute();
        $cat = $catStmt->fetch();

        if ($cat === false || $cat['activity'] !== 'vehicle') {
            return Response::error('VALIDATION_FAILED', 'La catégorie doit être une catégorie valide de véhicules.', 422, [
                'category_id' => ["La catégorie sélectionnée n'est pas dédiée aux véhicules."],
            ]);
        }

        // Validation de l'année
        $year = (int) $body['year'];
        $currentYear = (int) date('Y');
        if ($year < 1900 || $year > ($currentYear + 1)) {
            return Response::error('VALIDATION_FAILED', "L'année doit être comprise entre 1900 et " . ($currentYear + 1) . ".", 422, [
                'year' => ["L'année doit être comprise entre 1900 et " . ($currentYear + 1) . "."],
            ]);
        }

        // Validation des prix
        $priceSale = null;
        if (isset($body['price_sale']) && $body['price_sale'] !== '' && $body['price_sale'] !== null) {
            if (!is_numeric($body['price_sale']) || (int) $body['price_sale'] < 0) {
                return Response::error('VALIDATION_FAILED', 'Le prix de vente doit être un entier positif ou null.', 422, [
                    'price_sale' => ["Le prix de vente doit être un nombre positif ou null."],
                ]);
            }
            $priceSale = (int) $body['price_sale'];
        }

        $priceRental = null;
        if (isset($body['price_rental_day']) && $body['price_rental_day'] !== '' && $body['price_rental_day'] !== null) {
            if (!is_numeric($body['price_rental_day']) || (int) $body['price_rental_day'] < 0) {
                return Response::error('VALIDATION_FAILED', 'Le prix de location journalier doit être un entier positif ou null.', 422, [
                    'price_rental_day' => ["Le prix de location doit être un nombre positif ou null."],
                ]);
            }
            $priceRental = (int) $body['price_rental_day'];
        }

        // Validation stricte des spécifications en objet JSON
        $specsJson = null;
        if (isset($body['specs']) && !empty($body['specs'])) {
            $rawSpecs = $body['specs'];
            if (is_string($rawSpecs)) {
                $decoded = json_decode($rawSpecs, true);
                if (json_last_error() !== JSON_ERROR_NONE || !is_array($decoded)) {
                    return Response::error('VALIDATION_FAILED', 'Le champ specs doit être un objet JSON valide.', 422, [
                        'specs' => ["Le format JSON des spécifications est invalide."],
                    ]);
                }
                $specsJson = json_encode($decoded, JSON_UNESCAPED_UNICODE);
            } elseif (is_array($rawSpecs)) {
                $specsJson = json_encode($rawSpecs, JSON_UNESCAPED_UNICODE);
            } else {
                return Response::error('VALIDATION_FAILED', 'Le champ specs doit être un objet JSON valide.', 422, [
                    'specs' => ["Le format des spécifications techniques doit être un objet JSON."],
                ]);
            }
        }

        // Génération automatique du slug à partir de la marque et du modèle si absent
        $rawSlug = !empty($body['slug']) ? (string) $body['slug'] : ($body['brand'] . ' ' . $body['model']);
        $slug = SlugHelper::makeUnique($pdo, 'vehicles', SlugHelper::slugify($rawSlug));

        $sql = "INSERT INTO vehicles (
            category_id, slug, brand, model, year, mode,
            price_sale, price_rental_day, status, specs,
            description_fr, description_en, is_active,
            created_at, updated_at
        ) VALUES (
            :category_id, :slug, :brand, :model, :year, :mode,
            :price_sale, :price_rental_day, :status, :specs,
            :description_fr, :description_en, :is_active,
            NOW(), NOW()
        )";

        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(':category_id', $categoryId, PDO::PARAM_INT);
        $stmt->bindValue(':slug', $slug, PDO::PARAM_STR);
        $stmt->bindValue(':brand', trim((string) $body['brand']), PDO::PARAM_STR);
        $stmt->bindValue(':model', trim((string) $body['model']), PDO::PARAM_STR);
        $stmt->bindValue(':year', $year, PDO::PARAM_INT);
        $stmt->bindValue(':mode', strtolower(trim((string) $body['mode'])), PDO::PARAM_STR);
        $stmt->bindValue(':price_sale', $priceSale, $priceSale !== null ? PDO::PARAM_INT : PDO::PARAM_NULL);
        $stmt->bindValue(':price_rental_day', $priceRental, $priceRental !== null ? PDO::PARAM_INT : PDO::PARAM_NULL);
        $stmt->bindValue(':status', strtolower(trim((string) $body['status'])), PDO::PARAM_STR);
        $stmt->bindValue(':specs', $specsJson, PDO::PARAM_STR);
        $stmt->bindValue(':description_fr', !empty($body['description_fr']) ? trim((string) $body['description_fr']) : null, PDO::PARAM_STR);
        $stmt->bindValue(':description_en', !empty($body['description_en']) ? trim((string) $body['description_en']) : null, PDO::PARAM_STR);
        $stmt->bindValue(':is_active', isset($body['is_active']) ? ((bool) $body['is_active'] ? 1 : 0) : 1, PDO::PARAM_INT);
        $stmt->execute();

        $vehicleId = (int) $pdo->lastInsertId();

        return Response::success([
            'id' => $vehicleId,
            'slug' => $slug,
            'message' => 'Véhicule créé avec succès.',
        ], 201);
    }

    /**
     * Mise à jour d'un véhicule existant (PUT /api/admin/vehicles/{id}).
     *
     * @param array<string, string> $params
     */
    public function update(Request $request, array $params): Response
    {
        $pdo = Database::getConnection();
        $id = (int) ($params['id'] ?? 0);
        $body = $request->getBody();

        $stmt = $pdo->prepare("SELECT * FROM vehicles WHERE id = :id LIMIT 1");
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        $vehicle = $stmt->fetch();

        if ($vehicle === false) {
            return Response::error('NOT_FOUND', 'Véhicule introuvable.', 404);
        }

        $validator = new Validator();
        $rules = [
            'category_id' => 'required|integer',
            'brand' => 'required|min:2|max:80',
            'model' => 'required|min:1|max:80',
            'year' => 'required|integer',
            'mode' => 'required|in:sale,rental,both',
            'status' => 'required|in:available,reserved,sold,unavailable',
        ];

        if (!$validator->validate($body, $rules)) {
            return Response::error('VALIDATION_FAILED', 'Données de véhicule invalides.', 422, $validator->getErrors());
        }

        $categoryId = (int) $body['category_id'];
        $catStmt = $pdo->prepare("SELECT id, activity FROM categories WHERE id = :id LIMIT 1");
        $catStmt->bindValue(':id', $categoryId, PDO::PARAM_INT);
        $catStmt->execute();
        $cat = $catStmt->fetch();

        if ($cat === false || $cat['activity'] !== 'vehicle') {
            return Response::error('VALIDATION_FAILED', 'La catégorie doit être une catégorie de véhicules.', 422, [
                'category_id' => ["La catégorie sélectionnée n'est pas dédiée aux véhicules."],
            ]);
        }

        $year = (int) $body['year'];
        $priceSale = null;
        if (isset($body['price_sale']) && $body['price_sale'] !== '' && $body['price_sale'] !== null) {
            $priceSale = max(0, (int) $body['price_sale']);
        }

        $priceRental = null;
        if (isset($body['price_rental_day']) && $body['price_rental_day'] !== '' && $body['price_rental_day'] !== null) {
            $priceRental = max(0, (int) $body['price_rental_day']);
        }

        $specsJson = $vehicle['specs'];
        if (isset($body['specs'])) {
            $rawSpecs = $body['specs'];
            if (is_string($rawSpecs)) {
                $decoded = json_decode($rawSpecs, true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    $specsJson = json_encode($decoded, JSON_UNESCAPED_UNICODE);
                }
            } elseif (is_array($rawSpecs)) {
                $specsJson = json_encode($rawSpecs, JSON_UNESCAPED_UNICODE);
            }
        }

        $rawSlug = !empty($body['slug']) ? (string) $body['slug'] : ($body['brand'] . ' ' . $body['model']);
        $slug = SlugHelper::makeUnique($pdo, 'vehicles', SlugHelper::slugify($rawSlug), $id);

        $sql = "UPDATE vehicles SET
            category_id = :category_id,
            slug = :slug,
            brand = :brand,
            model = :model,
            year = :year,
            mode = :mode,
            price_sale = :price_sale,
            price_rental_day = :price_rental_day,
            status = :status,
            specs = :specs,
            description_fr = :description_fr,
            description_en = :description_en,
            is_active = :is_active,
            updated_at = NOW()
        WHERE id = :id";

        $updateStmt = $pdo->prepare($sql);
        $updateStmt->bindValue(':category_id', $categoryId, PDO::PARAM_INT);
        $updateStmt->bindValue(':slug', $slug, PDO::PARAM_STR);
        $updateStmt->bindValue(':brand', trim((string) $body['brand']), PDO::PARAM_STR);
        $updateStmt->bindValue(':model', trim((string) $body['model']), PDO::PARAM_STR);
        $updateStmt->bindValue(':year', $year, PDO::PARAM_INT);
        $updateStmt->bindValue(':mode', strtolower(trim((string) $body['mode'])), PDO::PARAM_STR);
        $updateStmt->bindValue(':price_sale', $priceSale, $priceSale !== null ? PDO::PARAM_INT : PDO::PARAM_NULL);
        $updateStmt->bindValue(':price_rental_day', $priceRental, $priceRental !== null ? PDO::PARAM_INT : PDO::PARAM_NULL);
        $updateStmt->bindValue(':status', strtolower(trim((string) $body['status'])), PDO::PARAM_STR);
        $updateStmt->bindValue(':specs', $specsJson, PDO::PARAM_STR);
        $updateStmt->bindValue(':description_fr', !empty($body['description_fr']) ? trim((string) $body['description_fr']) : null, PDO::PARAM_STR);
        $updateStmt->bindValue(':description_en', !empty($body['description_en']) ? trim((string) $body['description_en']) : null, PDO::PARAM_STR);
        $updateStmt->bindValue(':is_active', isset($body['is_active']) ? ((bool) $body['is_active'] ? 1 : 0) : 1, PDO::PARAM_INT);
        $updateStmt->bindValue(':id', $id, PDO::PARAM_INT);
        $updateStmt->execute();

        return Response::success([
            'id' => $id,
            'slug' => $slug,
            'message' => 'Véhicule mis à jour avec succès.',
        ]);
    }

    /**
     * Suppression d'un véhicule (désactivation par défaut ou suppression complète avec images sur confirmation).
     *
     * @param array<string, string> $params
     */
    public function destroy(Request $request, array $params): Response
    {
        $pdo = Database::getConnection();
        $id = (int) ($params['id'] ?? 0);

        $stmt = $pdo->prepare("SELECT id, brand, model FROM vehicles WHERE id = :id LIMIT 1");
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        $vehicle = $stmt->fetch();

        if ($vehicle === false) {
            return Response::error('NOT_FOUND', 'Véhicule introuvable.', 404);
        }

        $force = $request->getQuery('force') === '1'
            || $request->getQuery('confirm') === 'true'
            || $request->getQuery('confirm') === '1'
            || ($request->getBody()['confirm'] ?? false) === true;

        if ($force) {
            // Récupérer toutes les images du véhicule pour purger les fichiers physiques
            $imgStmt = $pdo->prepare("SELECT path FROM vehicle_images WHERE vehicle_id = :id");
            $imgStmt->bindValue(':id', $id, PDO::PARAM_INT);
            $imgStmt->execute();
            $images = $imgStmt->fetchAll();

            foreach ($images as $img) {
                $this->deleteFileIfOrphan((string) $img['path']);
            }

            // Suppression du véhicule (cascade en BDD sur vehicle_images)
            $delStmt = $pdo->prepare("DELETE FROM vehicles WHERE id = :id");
            $delStmt->bindValue(':id', $id, PDO::PARAM_INT);
            $delStmt->execute();

            return Response::success([
                'message' => "Le véhicule '{$vehicle['brand']} {$vehicle['model']}' et ses photos ont été définitivement supprimés.",
                'hard_deleted' => true,
            ]);
        }

        // Soft delete (désactivation)
        $softStmt = $pdo->prepare("UPDATE vehicles SET is_active = 0, updated_at = NOW() WHERE id = :id");
        $softStmt->bindValue(':id', $id, PDO::PARAM_INT);
        $softStmt->execute();

        return Response::success([
            'message' => "Le véhicule '{$vehicle['brand']} {$vehicle['model']}' a été désactivé avec succès. Pour le supprimer définitivement, spécifiez confirm=true.",
            'is_active' => false,
            'hard_deleted' => false,
        ]);
    }

    /**
     * Ajoute une photo à la galerie d'un véhicule (POST /api/admin/vehicles/{id}/images).
     *
     * @param array<string, string> $params
     */
    public function addImage(Request $request, array $params): Response
    {
        $pdo = Database::getConnection();
        $vehicleId = (int) ($params['id'] ?? 0);

        $checkStmt = $pdo->prepare("SELECT id FROM vehicles WHERE id = :id LIMIT 1");
        $checkStmt->bindValue(':id', $vehicleId, PDO::PARAM_INT);
        $checkStmt->execute();
        if ($checkStmt->fetchColumn() === false) {
            return Response::error('NOT_FOUND', "Le véhicule spécifié n'existe pas.", 404);
        }

        if (empty($_FILES['image'])) {
            return Response::error('MISSING_FILE', "Aucun fichier image transmis (champ 'image').", 400);
        }

        try {
            $uploadDir = __DIR__ . '/../../public/uploads/vehicles';
            $uploadResult = UploadService::processUpload($_FILES['image'], $uploadDir);
            $relativePath = '/uploads/vehicles/' . $uploadResult['filename'];

            $altFr = !empty($_POST['alt_fr']) ? trim((string) $_POST['alt_fr']) : null;
            $altEn = !empty($_POST['alt_en']) ? trim((string) $_POST['alt_en']) : null;
            $sortOrder = isset($_POST['sort_order']) ? (int) $_POST['sort_order'] : 0;

            $insertStmt = $pdo->prepare("INSERT INTO vehicle_images (vehicle_id, path, alt_fr, alt_en, sort_order) 
                                        VALUES (:vehicle_id, :path, :alt_fr, :alt_en, :sort_order)");
            $insertStmt->execute([
                ':vehicle_id' => $vehicleId,
                ':path' => $relativePath,
                ':alt_fr' => $altFr,
                ':alt_en' => $altEn,
                ':sort_order' => $sortOrder,
            ]);

            $imageId = (int) $pdo->lastInsertId();

            return Response::success([
                'id' => $imageId,
                'vehicle_id' => $vehicleId,
                'path' => $relativePath,
                'alt_fr' => $altFr,
                'alt_en' => $altEn,
                'sort_order' => $sortOrder,
                'message' => 'Image ajoutée avec succès au véhicule.',
            ], 201);
        } catch (\Throwable $e) {
            return Response::error('UPLOAD_FAILED', $e->getMessage(), 422);
        }
    }

    /**
     * Supprime une photo de la galerie d'un véhicule et purge le fichier (DELETE /api/admin/vehicles/{id}/images/{image_id}).
     *
     * @param array<string, string> $params
     */
    public function deleteImage(Request $request, array $params): Response
    {
        $pdo = Database::getConnection();
        $vehicleId = (int) ($params['id'] ?? 0);
        $imageId = (int) ($params['image_id'] ?? 0);

        $stmt = $pdo->prepare("SELECT id, path FROM vehicle_images WHERE id = :id AND vehicle_id = :vehicle_id LIMIT 1");
        $stmt->bindValue(':id', $imageId, PDO::PARAM_INT);
        $stmt->bindValue(':vehicle_id', $vehicleId, PDO::PARAM_INT);
        $stmt->execute();
        $image = $stmt->fetch();

        if ($image === false) {
            return Response::error('NOT_FOUND', "Image introuvable pour ce véhicule.", 404);
        }

        $delStmt = $pdo->prepare("DELETE FROM vehicle_images WHERE id = :id");
        $delStmt->bindValue(':id', $imageId, PDO::PARAM_INT);
        $delStmt->execute();

        $this->deleteFileIfOrphan((string) $image['path']);

        return Response::success([
            'message' => 'Image supprimée avec succès.',
        ]);
    }

    /**
     * Supprime un fichier physique orphelin du disque s'il n'est plus référencé.
     */
    private function deleteFileIfOrphan(string $relativePath): void
    {
        $cleanPath = ltrim($relativePath, '/');
        if (!str_starts_with($cleanPath, 'uploads/') || str_starts_with($cleanPath, 'uploads/demo/')) {
            return;
        }

        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM vehicle_images WHERE path = :path OR path = :rel_path");
        $stmt->execute([':path' => '/' . $cleanPath, ':rel_path' => $cleanPath]);
        if ((int) $stmt->fetchColumn() > 0) {
            return;
        }

        $fullPath = __DIR__ . '/../../public/' . $cleanPath;
        if (file_exists($fullPath) && is_file($fullPath)) {
            @unlink($fullPath);
        }
    }

    /**
     * Formate un véhicule pour la réponse administrateur.
     *
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function formatAdminVehicle(array $row): array
    {
        $specs = [];
        if (!empty($row['specs'])) {
            $decoded = json_decode((string) $row['specs'], true);
            if (is_array($decoded)) {
                $specs = $decoded;
            }
        }

        return [
            'id' => (int) $row['id'],
            'category_id' => (int) $row['category_id'],
            'slug' => (string) $row['slug'],
            'brand' => (string) $row['brand'],
            'model' => (string) $row['model'],
            'year' => (int) $row['year'],
            'mode' => (string) $row['mode'],
            'status' => (string) $row['status'],
            'price_sale' => $row['price_sale'] !== null ? (int) $row['price_sale'] : null,
            'price_rental_day' => $row['price_rental_day'] !== null ? (int) $row['price_rental_day'] : null,
            'specs' => $specs,
            'description_fr' => $row['description_fr'] !== null ? (string) $row['description_fr'] : null,
            'description_en' => $row['description_en'] !== null ? (string) $row['description_en'] : null,
            'is_active' => (bool) $row['is_active'],
            'main_image' => $row['main_image'] !== null ? (string) $row['main_image'] : null,
            'images_count' => (int) ($row['images_count'] ?? 0),
            'created_at' => (string) $row['created_at'],
            'updated_at' => (string) $row['updated_at'],
            'category' => [
                'id' => (int) $row['category_id'],
                'name_fr' => (string) $row['category_name_fr'],
                'name_en' => (string) $row['category_name_en'],
            ],
        ];
    }
}

