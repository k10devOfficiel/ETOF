<?php

declare(strict_types=1);

// Prise en charge des fichiers statiques avec le serveur interne PHP (CLI server)
if (php_sapi_name() === 'cli-server') {
    $uriPath = (string) parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);

    // Bloquer strictement toute tentative de path traversal ou d'accès aux fichiers sensibles
    if (
        str_contains($uriPath, '..') ||
        str_contains($uriPath, '.env') ||
        str_contains($uriPath, 'database') ||
        str_contains($uriPath, 'storage') ||
        str_contains($uriPath, 'vendor') ||
        str_contains($uriPath, '.git')
    ) {
        http_response_code(403);
        header('Content-Type: application/json; charset=UTF-8');
        header('X-Content-Type-Options: nosniff');
        echo json_encode([
            'success' => false,
            'data' => null,
            'error' => [
                'code' => 'FORBIDDEN',
                'message' => 'Accès refusé au fichier demandé.',
            ],
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    $targetFile = __DIR__ . $uriPath;
    $realTarget = realpath($targetFile);
    $publicDir = realpath(__DIR__);

    // Ne servir en statique que les fichiers existants strictement situés dans backend/public (hors PHP et dotfiles)
    if ($realTarget !== false && $publicDir !== false && str_starts_with($realTarget, $publicDir)) {
        $basename = basename($realTarget);
        if ($basename[0] !== '.' && !str_ends_with(strtolower($realTarget), '.php') && !is_dir($realTarget)) {
            return false;
        }
    }
}

require_once __DIR__ . '/../vendor/autoload.php';

use App\Controllers\AdminAuthController;
use App\Controllers\AdminProductController;
use App\Controllers\AdminProfileController;
use App\Controllers\AdminRequestController;
use App\Controllers\AdminSettingsController;
use App\Controllers\AdminVehicleController;
use App\Controllers\CategoryController;
use App\Controllers\ProductController;
use App\Controllers\RequestController;
use App\Controllers\SettingsController;
use App\Controllers\UserAuthController;
use App\Controllers\VehicleController;
use App\Core\Config;
use App\Core\Database;
use App\Core\ErrorHandler;
use App\Core\Request;
use App\Core\Response;
use App\Core\Router;
use App\Middlewares\AdminAuthMiddleware;
use App\Middlewares\CsrfMiddleware;
use App\Middlewares\UserAuthMiddleware;
use App\Services\RateLimiter;
use App\Services\UploadService;

// Initialisation du gestionnaire d'erreurs (logs dans storage/logs/)
ErrorHandler::register(__DIR__ . '/../storage/logs');

// Chargement des variables d'environnement
Config::load(__DIR__ . '/..');

// Initialisation de la requête HTTP entrante
$request = Request::fromGlobals();

// Blocage strict de tout accès aux fichiers ou répertoires sensibles (.env, database, storage, vendor, .git)
$requestPath = $request->getPath();
if (
    str_starts_with($requestPath, '/.env') ||
    str_starts_with($requestPath, '/database') ||
    str_starts_with($requestPath, '/storage') ||
    str_starts_with($requestPath, '/vendor') ||
    str_starts_with($requestPath, '/.git') ||
    str_contains($requestPath, '..')
) {
    Response::error('FORBIDDEN', 'Accès interdit.', 403)->send();
    exit;
}

// Contrôle de la taille maximale du corps JSON (200 Ko)
if ($request->isPayloadTooLarge()) {
    Response::error(
        'PAYLOAD_TOO_LARGE',
        'Le corps de la requête dépasse la taille maximale autorisée de 200 Ko.',
        413
    )->send();
    exit;
}

// Gestion des en-têtes CORS (restreint strictement à FRONTEND_URL configuré)
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$frontendUrl = (string) Config::get('FRONTEND_URL', '');

if ($frontendUrl !== '' && ($origin === $frontendUrl || $origin === rtrim($frontendUrl, '/'))) {
    header("Access-Control-Allow-Origin: {$origin}");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept-Language, X-CSRF-Token');
}

// Réponse immédiate pour les requêtes de pré-vol HTTP OPTIONS
if ($request->getMethod() === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Initialisation du routeur
$router = new Router();

// Route GET /api/health : renvoie le statut de l'API et teste la connexion à la base
$router->get('/api/health', function (Request $request): Response {
    $dbConnected = false;
    $dbError = null;

    try {
        $pdo = Database::getConnection();
        $stmt = $pdo->query('SELECT 1');
        if ($stmt !== false) {
            $dbConnected = true;
        }
    } catch (\Throwable $e) {
        $dbError = $e->getMessage();
        ErrorHandler::logThrowable($e);
    }

    if (!$dbConnected) {
        return Response::error(
            'DATABASE_UNAVAILABLE',
            'La connexion à la base de données a échoué.',
            503,
            Config::isDev() && $dbError !== null ? ['details' => $dbError] : null
        );
    }

    return Response::success([
        'status' => 'healthy',
        'service' => 'ETOF Backend API',
        'environment' => (string) Config::get('APP_ENV', 'production'),
        'database' => [
            'connected' => true,
        ],
        'language' => $request->getLang(),
        'timestamp' => date('c'),
    ]);
});

// Routes publiques de consultation en lecture seule
$router->get('/api/settings', [SettingsController::class, 'index']);
$router->get('/api/categories', [CategoryController::class, 'index']);
$router->get('/api/products', [ProductController::class, 'index']);
$router->get('/api/products/{slug}', [ProductController::class, 'show']);
$router->get('/api/vehicles', [VehicleController::class, 'index']);
$router->get('/api/vehicles/{slug}', [VehicleController::class, 'show']);

// Routes d'authentification utilisateur client
$router->post('/api/auth/register', [UserAuthController::class, 'register']);
$router->post('/api/auth/login', [UserAuthController::class, 'login']);
$router->post('/api/auth/logout', [UserAuthController::class, 'logout']);
$router->get('/api/auth/me', [UserAuthController::class, 'me']);
$router->put('/api/auth/profile', [UserAuthController::class, 'updateProfile'], [UserAuthMiddleware::class]);
$router->get('/api/auth/requests', [UserAuthController::class, 'requests'], [UserAuthMiddleware::class]);

// Route de soumission des demandes clients (protégée : HTTP 401 si aucune session client active)
$router->post('/api/requests', [RequestController::class, 'store'], [UserAuthMiddleware::class]);
$router->post('/api/requests/cancel', [RequestController::class, 'cancel'], [UserAuthMiddleware::class]);

// Routes d'authentification administrateur et sécurité de session
$router->get('/api/admin/csrf', [AdminAuthController::class, 'csrf']);
$router->post('/api/admin/login', [AdminAuthController::class, 'login'], [CsrfMiddleware::class]);
$router->post('/api/admin/logout', [AdminAuthController::class, 'logout'], [AdminAuthMiddleware::class, CsrfMiddleware::class]);
$router->get('/api/admin/me', [AdminAuthController::class, 'me'], [AdminAuthMiddleware::class]);

// Routes CRUD d'administration - Produits
$router->get('/api/admin/products', [AdminProductController::class, 'index'], [AdminAuthMiddleware::class]);
$router->post('/api/admin/products', [AdminProductController::class, 'store'], [AdminAuthMiddleware::class, CsrfMiddleware::class]);
$router->put('/api/admin/products/{id}', [AdminProductController::class, 'update'], [AdminAuthMiddleware::class, CsrfMiddleware::class]);
$router->delete('/api/admin/products/{id}', [AdminProductController::class, 'destroy'], [AdminAuthMiddleware::class, CsrfMiddleware::class]);
$router->post('/api/admin/upload', [AdminProductController::class, 'uploadImage'], [AdminAuthMiddleware::class, CsrfMiddleware::class]);

// Routes CRUD d'administration - Véhicules
$router->get('/api/admin/vehicles', [AdminVehicleController::class, 'index'], [AdminAuthMiddleware::class]);
$router->post('/api/admin/vehicles', [AdminVehicleController::class, 'store'], [AdminAuthMiddleware::class, CsrfMiddleware::class]);
$router->put('/api/admin/vehicles/{id}', [AdminVehicleController::class, 'update'], [AdminAuthMiddleware::class, CsrfMiddleware::class]);
$router->delete('/api/admin/vehicles/{id}', [AdminVehicleController::class, 'destroy'], [AdminAuthMiddleware::class, CsrfMiddleware::class]);
$router->post('/api/admin/vehicles/{id}/images', [AdminVehicleController::class, 'addImage'], [AdminAuthMiddleware::class, CsrfMiddleware::class]);
$router->delete('/api/admin/vehicles/{id}/images/{image_id}', [AdminVehicleController::class, 'deleteImage'], [AdminAuthMiddleware::class, CsrfMiddleware::class]);

// Gestion des images de la galerie des produits
$router->post('/api/admin/products/{id}/images', [AdminProductController::class, 'addImage'], [AdminAuthMiddleware::class, CsrfMiddleware::class]);
$router->delete('/api/admin/products/{id}/images/{image_id}', [AdminProductController::class, 'deleteImage'], [AdminAuthMiddleware::class, CsrfMiddleware::class]);

// Routes d'administration - Demandes clients (statistiques, export CSV et gestion de statut)
$router->get('/api/admin/stats', [AdminRequestController::class, 'stats'], [AdminAuthMiddleware::class]);
$router->get('/api/admin/requests/export', [AdminRequestController::class, 'export'], [AdminAuthMiddleware::class]);
$router->get('/api/admin/requests', [AdminRequestController::class, 'index'], [AdminAuthMiddleware::class]);
$router->get('/api/admin/requests/{id}', [AdminRequestController::class, 'show'], [AdminAuthMiddleware::class]);
$router->patch('/api/admin/requests/{id}', [AdminRequestController::class, 'update'], [AdminAuthMiddleware::class, CsrfMiddleware::class]);

// Routes d'administration - Réglages institutionnels
$router->get('/api/admin/settings', [AdminSettingsController::class, 'index'], [AdminAuthMiddleware::class]);
$router->put('/api/admin/settings', [AdminSettingsController::class, 'update'], [AdminAuthMiddleware::class, CsrfMiddleware::class]);

// Routes d'administration - Profil administrateur et sécurité
$router->put('/api/admin/profile/password', [AdminProfileController::class, 'updatePassword'], [AdminAuthMiddleware::class, CsrfMiddleware::class]);

// Routes de test techniques (disponibles en environnement de développement)
if (Config::isDev()) {
    $router->post('/api/test/rate-limit', function (Request $request): Response {
        $ip = $request->getClientIp();
        $action = 'test_action';

        if (!RateLimiter::check($ip, $action, 5, 10)) {
            return RateLimiter::createTooManyRequestsResponse(600);
        }

        RateLimiter::hit($ip, $action);

        return Response::success([
            'message' => 'Tentative enregistrée avec succès.',
            'ip_hashed' => RateLimiter::hashIp($ip),
        ]);
    });

    $router->post('/api/test/upload', function (Request $request): Response {
        if (empty($_FILES['image'])) {
            return Response::error('MISSING_FILE', "Le champ de fichier 'image' est obligatoire.", 400);
        }

        try {
            $uploadResult = UploadService::processUpload($_FILES['image'], __DIR__ . '/uploads');
            return Response::success($uploadResult, 201);
        } catch (\Throwable $e) {
            return Response::error('UPLOAD_FAILED', $e->getMessage(), 422);
        }
    });
}

// Traitement et émission de la réponse
$response = $router->dispatch($request);
$response->send();
