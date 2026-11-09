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
 * Contrôleur d'administration pour la gestion complète du catalogue produits (CRUD, upload, désactivation/suppression).
 */
final class AdminProductController
{
    /**
     * Liste paginée des produits avec recherche, tri et éléments inactifs (GET /api/admin/products).
     */
    public function index(Request $request): Response
    {
        $pdo = Database::getConnection();

        $page = max(1, (int) $request->getQuery('page', 1));
        $perPage = min(48, max(1, (int) $request->getQuery('per_page', 12)));
        $offset = ($page - 1) * $perPage;

        $categoryParam = $request->getQuery('category_id');
        $searchParam = $request->getQuery('q');
        $activeParam = $request->getQuery('is_active');
        $sortBy = strtolower((string) $request->getQuery('sort_by', 'sort_order'));
        $order = strtolower((string) $request->getQuery('order', 'asc')) === 'desc' ? 'DESC' : 'ASC';

        $allowedSorts = [
            'sort_order' => 'p.sort_order',
            'name' => 'p.name_fr',
            'price' => 'p.price',
            'created_at' => 'p.created_at',
            'id' => 'p.id',
        ];
        $sortColumn = $allowedSorts[$sortBy] ?? 'p.sort_order';

        $whereConditions = ['1=1'];
        $params = [];

        if ($categoryParam !== null && $categoryParam !== '') {
            $whereConditions[] = 'p.category_id = :cat_id';
            $params[':cat_id'] = (int) $categoryParam;
        }

        if (is_string($searchParam) && trim($searchParam) !== '') {
            $searchTerm = '%' . trim($searchParam) . '%';
            $whereConditions[] = '(p.name_fr LIKE :q OR p.name_en LIKE :q OR p.reference LIKE :q OR p.slug LIKE :q)';
            $params[':q'] = $searchTerm;
        }

        if ($activeParam !== null && $activeParam !== '') {
            $whereConditions[] = 'p.is_active = :active';
            $params[':active'] = (int) $activeParam > 0 ? 1 : 0;
        }

        $whereSql = implode(' AND ', $whereConditions);

        // Comptage total
        $countSql = "SELECT COUNT(*) FROM products p WHERE {$whereSql}";
        $countStmt = $pdo->prepare($countSql);
        foreach ($params as $k => $v) {
            $countStmt->bindValue($k, $v, is_int($v) ? PDO::PARAM_INT : PDO::PARAM_STR);
        }
        $countStmt->execute();
        $total = (int) $countStmt->fetchColumn();

        // Récupération complète des données avec catégorie rattachée
        $sql = "SELECT p.*, c.name_fr AS category_name_fr, c.name_en AS category_name_en, c.activity AS category_activity
                FROM products p
                INNER JOIN categories c ON p.category_id = c.id
                WHERE {$whereSql}
                ORDER BY {$sortColumn} {$order}, p.id ASC
                LIMIT :limit OFFSET :offset";

        $stmt = $pdo->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v, is_int($v) ? PDO::PARAM_INT : PDO::PARAM_STR);
        }
        $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $rows = $stmt->fetchAll();
        $items = array_map([$this, 'formatAdminProduct'], $rows);

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
     * Création d'un nouveau produit avec validation stricte (POST /api/admin/products).
     */
    public function store(Request $request): Response
    {
        $pdo = Database::getConnection();
        $body = $request->getBody();

        $validator = new Validator();
        $rules = [
            'category_id' => 'required|integer',
            'name_fr' => 'required|min:2|max:150',
            'min_quantity' => 'integer|min:1',
        ];

        if (!$validator->validate($body, $rules)) {
            return Response::error('VALIDATION_FAILED', 'Données de produit invalides.', 422, $validator->getErrors());
        }

        $categoryId = (int) $body['category_id'];
        $catStmt = $pdo->prepare("SELECT id FROM categories WHERE id = :id LIMIT 1");
        $catStmt->bindValue(':id', $categoryId, PDO::PARAM_INT);
        $catStmt->execute();
        if ($catStmt->fetchColumn() === false) {
            return Response::error('VALIDATION_FAILED', 'La catégorie spécifiée est introuvable.', 422, [
                'category_id' => ["La catégorie #{$categoryId} n'existe pas."],
            ]);
        }

        // Validation du prix (entier non signé ou null)
        $price = null;
        if (isset($body['price']) && $body['price'] !== '' && $body['price'] !== null) {
            if (!is_numeric($body['price']) || (int) $body['price'] < 0) {
                return Response::error('VALIDATION_FAILED', 'Le prix doit être un entier positif ou null.', 422, [
                    'price' => ["Le prix doit être un nombre entier positif ou null (sur demande)."],
                ]);
            }
            $price = (int) $body['price'];
        }

        // Génération automatique du slug à partir du nom FR si absent
        $rawSlug = !empty($body['slug']) ? (string) $body['slug'] : (string) $body['name_fr'];
        $slug = SlugHelper::makeUnique($pdo, 'products', SlugHelper::slugify($rawSlug));

        $sql = "INSERT INTO products (
            category_id, slug, reference, name_fr, name_en,
            description_fr, description_en, unit_fr, unit_en,
            price, specs, min_quantity, is_orderable, is_available,
            image, is_active, sort_order, created_at, updated_at
        ) VALUES (
            :category_id, :slug, :reference, :name_fr, :name_en,
            :description_fr, :description_en, :unit_fr, :unit_en,
            :price, :specs, :min_quantity, :is_orderable, :is_available,
            :image, :is_active, :sort_order, NOW(), NOW()
        )";

        $specsJson = null;
        if (isset($body['specs'])) {
            $specsJson = is_array($body['specs']) ? json_encode($body['specs'], JSON_UNESCAPED_UNICODE) : (string) $body['specs'];
        }

        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(':category_id', $categoryId, PDO::PARAM_INT);
        $stmt->bindValue(':slug', $slug, PDO::PARAM_STR);
        $stmt->bindValue(':reference', !empty($body['reference']) ? trim((string) $body['reference']) : null, PDO::PARAM_STR);
        $stmt->bindValue(':name_fr', trim((string) $body['name_fr']), PDO::PARAM_STR);
        $stmt->bindValue(':name_en', !empty($body['name_en']) ? trim((string) $body['name_en']) : trim((string) $body['name_fr']), PDO::PARAM_STR);
        $stmt->bindValue(':description_fr', !empty($body['description_fr']) ? trim((string) $body['description_fr']) : null, PDO::PARAM_STR);
        $stmt->bindValue(':description_en', !empty($body['description_en']) ? trim((string) $body['description_en']) : null, PDO::PARAM_STR);
        $stmt->bindValue(':unit_fr', !empty($body['unit_fr']) ? trim((string) $body['unit_fr']) : null, PDO::PARAM_STR);
        $stmt->bindValue(':unit_en', !empty($body['unit_en']) ? trim((string) $body['unit_en']) : null, PDO::PARAM_STR);
        $stmt->bindValue(':price', $price, $price !== null ? PDO::PARAM_INT : PDO::PARAM_NULL);
        $stmt->bindValue(':specs', $specsJson, $specsJson !== null ? PDO::PARAM_STR : PDO::PARAM_NULL);
        $stmt->bindValue(':min_quantity', max(1, (int) ($body['min_quantity'] ?? 1)), PDO::PARAM_INT);
        $stmt->bindValue(':is_orderable', isset($body['is_orderable']) ? ((bool) $body['is_orderable'] ? 1 : 0) : 1, PDO::PARAM_INT);
        $stmt->bindValue(':is_available', isset($body['is_available']) ? ((bool) $body['is_available'] ? 1 : 0) : 1, PDO::PARAM_INT);
        $stmt->bindValue(':image', !empty($body['image']) ? trim((string) $body['image']) : null, PDO::PARAM_STR);
        $stmt->bindValue(':is_active', isset($body['is_active']) ? ((bool) $body['is_active'] ? 1 : 0) : 1, PDO::PARAM_INT);
        $stmt->bindValue(':sort_order', (int) ($body['sort_order'] ?? 0), PDO::PARAM_INT);
        $stmt->execute();

        $productId = (int) $pdo->lastInsertId();

        return Response::success([
            'id' => $productId,
            'slug' => $slug,
            'message' => 'Produit créé avec succès.',
        ], 201);
    }

    /**
     * Mise à jour d'un produit existant (PUT /api/admin/products/{id}).
     *
     * @param array<string, string> $params
     */
    public function update(Request $request, array $params): Response
    {
        $pdo = Database::getConnection();
        $id = (int) ($params['id'] ?? 0);
        $body = $request->getBody();

        $stmt = $pdo->prepare("SELECT * FROM products WHERE id = :id LIMIT 1");
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        $product = $stmt->fetch();

        if ($product === false) {
            return Response::error('NOT_FOUND', 'Produit introuvable.', 404);
        }

        $validator = new Validator();
        $rules = [
            'category_id' => 'required|integer',
            'name_fr' => 'required|min:2|max:150',
            'min_quantity' => 'integer|min:1',
        ];

        if (!$validator->validate($body, $rules)) {
            return Response::error('VALIDATION_FAILED', 'Données de produit invalides.', 422, $validator->getErrors());
        }

        $categoryId = (int) $body['category_id'];
        $catStmt = $pdo->prepare("SELECT id FROM categories WHERE id = :id LIMIT 1");
        $catStmt->bindValue(':id', $categoryId, PDO::PARAM_INT);
        $catStmt->execute();
        if ($catStmt->fetchColumn() === false) {
            return Response::error('VALIDATION_FAILED', 'La catégorie spécifiée est introuvable.', 422, [
                'category_id' => ["La catégorie #{$categoryId} n'existe pas."],
            ]);
        }

        $price = null;
        if (isset($body['price']) && $body['price'] !== '' && $body['price'] !== null) {
            if (!is_numeric($body['price']) || (int) $body['price'] < 0) {
                return Response::error('VALIDATION_FAILED', 'Le prix doit être un entier positif ou null.', 422, [
                    'price' => ["Le prix doit être un nombre entier positif ou null (sur demande)."],
                ]);
            }
            $price = (int) $body['price'];
        }

        $rawSlug = !empty($body['slug']) ? (string) $body['slug'] : (string) $body['name_fr'];
        $slug = SlugHelper::makeUnique($pdo, 'products', SlugHelper::slugify($rawSlug), $id);

        $newImage = !empty($body['image']) ? trim((string) $body['image']) : null;
        $oldImage = $product['image'];

        // Si l'image a été remplacée, purger l'ancien fichier orphelin
        if ($newImage !== $oldImage && !empty($oldImage)) {
            $this->deleteFileIfOrphan($oldImage);
        }

        $sql = "UPDATE products SET
            category_id = :category_id,
            slug = :slug,
            reference = :reference,
            name_fr = :name_fr,
            name_en = :name_en,
            description_fr = :description_fr,
            description_en = :description_en,
            unit_fr = :unit_fr,
            unit_en = :unit_en,
            price = :price,
            specs = :specs,
            min_quantity = :min_quantity,
            is_orderable = :is_orderable,
            is_available = :is_available,
            image = :image,
            is_active = :is_active,
            sort_order = :sort_order,
            updated_at = NOW()
        WHERE id = :id";

        $specsJson = null;
        if (isset($body['specs'])) {
            $specsJson = is_array($body['specs']) ? json_encode($body['specs'], JSON_UNESCAPED_UNICODE) : (string) $body['specs'];
        }

        $updateStmt = $pdo->prepare($sql);
        $updateStmt->bindValue(':category_id', $categoryId, PDO::PARAM_INT);
        $updateStmt->bindValue(':slug', $slug, PDO::PARAM_STR);
        $updateStmt->bindValue(':reference', !empty($body['reference']) ? trim((string) $body['reference']) : null, PDO::PARAM_STR);
        $updateStmt->bindValue(':name_fr', trim((string) $body['name_fr']), PDO::PARAM_STR);
        $updateStmt->bindValue(':name_en', !empty($body['name_en']) ? trim((string) $body['name_en']) : trim((string) $body['name_fr']), PDO::PARAM_STR);
        $updateStmt->bindValue(':description_fr', !empty($body['description_fr']) ? trim((string) $body['description_fr']) : null, PDO::PARAM_STR);
        $updateStmt->bindValue(':description_en', !empty($body['description_en']) ? trim((string) $body['description_en']) : null, PDO::PARAM_STR);
        $updateStmt->bindValue(':unit_fr', !empty($body['unit_fr']) ? trim((string) $body['unit_fr']) : null, PDO::PARAM_STR);
        $updateStmt->bindValue(':unit_en', !empty($body['unit_en']) ? trim((string) $body['unit_en']) : null, PDO::PARAM_STR);
        $updateStmt->bindValue(':price', $price, $price !== null ? PDO::PARAM_INT : PDO::PARAM_NULL);
        $updateStmt->bindValue(':specs', $specsJson, $specsJson !== null ? PDO::PARAM_STR : PDO::PARAM_NULL);
        $updateStmt->bindValue(':min_quantity', max(1, (int) ($body['min_quantity'] ?? 1)), PDO::PARAM_INT);
        $updateStmt->bindValue(':is_orderable', isset($body['is_orderable']) ? ((bool) $body['is_orderable'] ? 1 : 0) : 1, PDO::PARAM_INT);
        $updateStmt->bindValue(':is_available', isset($body['is_available']) ? ((bool) $body['is_available'] ? 1 : 0) : 1, PDO::PARAM_INT);
        $updateStmt->bindValue(':image', $newImage, PDO::PARAM_STR);
        $updateStmt->bindValue(':is_active', isset($body['is_active']) ? ((bool) $body['is_active'] ? 1 : 0) : 1, PDO::PARAM_INT);
        $updateStmt->bindValue(':sort_order', (int) ($body['sort_order'] ?? 0), PDO::PARAM_INT);
        $updateStmt->bindValue(':id', $id, PDO::PARAM_INT);
        $updateStmt->execute();

        return Response::success([
            'id' => $id,
            'slug' => $slug,
            'message' => 'Produit mis à jour avec succès.',
        ]);
    }

    /**
     * Suppression d'un produit (désactivation par défaut ou suppression définitive sur confirmation).
     *
     * @param array<string, string> $params
     */
    public function destroy(Request $request, array $params): Response
    {
        $pdo = Database::getConnection();
        $id = (int) ($params['id'] ?? 0);

        $stmt = $pdo->prepare("SELECT id, name_fr, image, is_active FROM products WHERE id = :id LIMIT 1");
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        $product = $stmt->fetch();

        if ($product === false) {
            return Response::error('NOT_FOUND', 'Produit introuvable.', 404);
        }

        $force = $request->getQuery('force') === '1'
            || $request->getQuery('confirm') === 'true'
            || $request->getQuery('confirm') === '1'
            || ($request->getBody()['confirm'] ?? false) === true;

        if ($force) {
            // Suppression définitive et purge du fichier orphelin
            $delStmt = $pdo->prepare("DELETE FROM products WHERE id = :id");
            $delStmt->bindValue(':id', $id, PDO::PARAM_INT);
            $delStmt->execute();

            if (!empty($product['image'])) {
                $this->deleteFileIfOrphan($product['image']);
            }

            return Response::success([
                'message' => "Le produit '{$product['name_fr']}' a été définitivement supprimé de la base de données.",
                'hard_deleted' => true,
            ]);
        }

        // Désactivation (Soft delete)
        $softStmt = $pdo->prepare("UPDATE products SET is_active = 0, updated_at = NOW() WHERE id = :id");
        $softStmt->bindValue(':id', $id, PDO::PARAM_INT);
        $softStmt->execute();

        return Response::success([
            'message' => "Le produit '{$product['name_fr']}' a été désactivé avec succès. Pour le supprimer définitivement, spécifiez le paramètre confirm=true.",
            'is_active' => false,
            'hard_deleted' => false,
        ]);
    }

    /**
     * Téléversement sécurisé d'une photo de produit (POST /api/admin/upload).
     */
    public function uploadImage(Request $request): Response
    {
        if (empty($_FILES['image'])) {
            return Response::error('MISSING_FILE', "Aucun fichier image transmis (champ 'image').", 400);
        }

        try {
            $uploadDir = __DIR__ . '/../../public/uploads/products';
            $result = UploadService::processUpload($_FILES['image'], $uploadDir);
            $result['url'] = '/uploads/products/' . $result['filename'];

            return Response::success($result, 201);
        } catch (\Throwable $e) {
            return Response::error('UPLOAD_FAILED', $e->getMessage(), 422);
        }
    }

    /**
     * Ajoute une photo à la galerie multi-angles d'un produit (POST /api/admin/products/{id}/images).
     *
     * @param array<string, string> $params
     */
    public function addImage(Request $request, array $params): Response
    {
        $pdo = Database::getConnection();
        $productId = (int) ($params['id'] ?? 0);

        $checkStmt = $pdo->prepare("SELECT id FROM products WHERE id = :id LIMIT 1");
        $checkStmt->bindValue(':id', $productId, PDO::PARAM_INT);
        $checkStmt->execute();
        if ($checkStmt->fetchColumn() === false) {
            return Response::error('NOT_FOUND', "Le produit spécifié n'existe pas.", 404);
        }

        if (empty($_FILES['image'])) {
            return Response::error('MISSING_FILE', "Aucun fichier image transmis (champ 'image').", 400);
        }

        try {
            $uploadDir = __DIR__ . '/../../public/uploads/products';
            $uploadResult = UploadService::processUpload($_FILES['image'], $uploadDir);
            $relativePath = '/uploads/products/' . $uploadResult['filename'];

            $altFr = !empty($_POST['alt_fr']) ? trim((string) $_POST['alt_fr']) : null;
            $altEn = !empty($_POST['alt_en']) ? trim((string) $_POST['alt_en']) : null;
            $sortOrder = isset($_POST['sort_order']) ? (int) $_POST['sort_order'] : 0;

            $insertStmt = $pdo->prepare("INSERT INTO product_images (product_id, path, alt_fr, alt_en, sort_order) 
                                        VALUES (:product_id, :path, :alt_fr, :alt_en, :sort_order)");
            $insertStmt->execute([
                ':product_id' => $productId,
                ':path' => $relativePath,
                ':alt_fr' => $altFr,
                ':alt_en' => $altEn,
                ':sort_order' => $sortOrder,
            ]);

            $imageId = (int) $pdo->lastInsertId();

            return Response::success([
                'id' => $imageId,
                'product_id' => $productId,
                'path' => $relativePath,
                'alt_fr' => $altFr,
                'alt_en' => $altEn,
                'sort_order' => $sortOrder,
                'message' => 'Image ajoutée avec succès au produit.',
            ], 201);
        } catch (\Throwable $e) {
            return Response::error('UPLOAD_FAILED', $e->getMessage(), 422);
        }
    }

    /**
     * Supprime une photo de la galerie d'un produit (DELETE /api/admin/products/{id}/images/{image_id}).
     *
     * @param array<string, string> $params
     */
    public function deleteImage(Request $request, array $params): Response
    {
        $pdo = Database::getConnection();
        $productId = (int) ($params['id'] ?? 0);
        $imageId = (int) ($params['image_id'] ?? 0);

        $stmt = $pdo->prepare("SELECT id, path FROM product_images WHERE id = :id AND product_id = :product_id LIMIT 1");
        $stmt->bindValue(':id', $imageId, PDO::PARAM_INT);
        $stmt->bindValue(':product_id', $productId, PDO::PARAM_INT);
        $stmt->execute();
        $image = $stmt->fetch();

        if ($image === false) {
            return Response::error('NOT_FOUND', "Image introuvable pour ce produit.", 404);
        }

        $delStmt = $pdo->prepare("DELETE FROM product_images WHERE id = :id");
        $delStmt->bindValue(':id', $imageId, PDO::PARAM_INT);
        $delStmt->execute();

        $this->deleteFileIfOrphan((string) $image['path']);

        return Response::success([
            'message' => 'Image supprimée avec succès.',
        ]);
    }

    /**
     * Supprime un fichier physique du disque si aucun autre enregistrement ne l'utilise.
     */
    private function deleteFileIfOrphan(string $relativePath): void
    {
        $cleanPath = ltrim($relativePath, '/');
        // Protection pour ne toucher qu'au dossier public/uploads et ne jamais supprimer les fichiers de démonstration
        if (!str_starts_with($cleanPath, 'uploads/') || str_starts_with($cleanPath, 'uploads/demo/')) {
            return;
        }

        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM products WHERE image = :path OR image = :rel_path");
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
     * Formate la structure d'un produit pour l'interface administrateur.
     *
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function formatAdminProduct(array $row): array
    {
        $pdo = Database::getConnection();
        $imgStmt = $pdo->prepare("SELECT id, path, alt_fr, alt_en, sort_order FROM product_images WHERE product_id = :pid ORDER BY sort_order ASC, id ASC");
        $imgStmt->execute([':pid' => (int) $row['id']]);
        $images = $imgStmt->fetchAll(PDO::FETCH_ASSOC);

        return [
            'id' => (int) $row['id'],
            'category_id' => (int) $row['category_id'],
            'slug' => (string) $row['slug'],
            'reference' => $row['reference'] !== null ? (string) $row['reference'] : null,
            'name_fr' => (string) $row['name_fr'],
            'name_en' => (string) $row['name_en'],
            'description_fr' => $row['description_fr'] !== null ? (string) $row['description_fr'] : null,
            'description_en' => $row['description_en'] !== null ? (string) $row['description_en'] : null,
            'unit_fr' => $row['unit_fr'] !== null ? (string) $row['unit_fr'] : null,
            'unit_en' => $row['unit_en'] !== null ? (string) $row['unit_en'] : null,
            'price' => $row['price'] !== null ? (int) $row['price'] : null,
            'specs' => !empty($row['specs']) ? (is_array($row['specs']) ? $row['specs'] : json_decode((string) $row['specs'], true) ?? []) : [],
            'min_quantity' => (int) $row['min_quantity'],
            'is_orderable' => (bool) $row['is_orderable'],
            'is_available' => (bool) $row['is_available'],
            'image' => $row['image'] !== null ? (string) $row['image'] : null,
            'images' => $images,
            'is_active' => (bool) $row['is_active'],
            'sort_order' => (int) $row['sort_order'],
            'created_at' => (string) $row['created_at'],
            'updated_at' => (string) $row['updated_at'],
            'category' => [
                'id' => (int) $row['category_id'],
                'activity' => (string) $row['category_activity'],
                'name_fr' => (string) $row['category_name_fr'],
                'name_en' => (string) $row['category_name_en'],
            ],
        ];
    }
}

