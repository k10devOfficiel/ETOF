<?php

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use App\Controllers\AdminAuthController;
use App\Controllers\AdminProductController;
use App\Controllers\AdminRequestController;
use App\Controllers\AdminVehicleController;
use App\Controllers\CategoryController;
use App\Controllers\ProductController;
use App\Controllers\RequestController;
use App\Controllers\SettingsController;
use App\Controllers\VehicleController;
use App\Core\Config;
use App\Core\Database;
use App\Core\ErrorHandler;
use App\Core\Request;
use App\Core\Response;
use App\Core\Router;
use App\Middlewares\AdminAuthMiddleware;
use App\Middlewares\CsrfMiddleware;
use App\Services\RateLimiter;
use App\Services\UploadService;

// Initialisation du gestionnaire d'erreurs (logs dans storage/logs/)
ErrorHandler::register(__DIR__ . '/../storage/logs');

// Chargement des variables d'environnement
Config::load(__DIR__ . '/..');

// Initialisation de la requête HTTP entrante
$request = Request::fromGlobals();

// Contrôle de la taille maximale du corps JSON (200 Ko)
if ($request->isPayloadTooLarge()) {
    Response::error(
        'PAYLOAD_TOO_LARGE',
        'Le corps de la requête dépasse la taille maximale autorisée de 200 Ko.',
        413
    )->send();
    exit;
}

// Gestion des en-têtes CORS (actif uniquement si APP_ENV vaut dev, restreint à FRONTEND_URL)
if (Config::isDev()) {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $frontendUrl = (string) Config::get('FRONTEND_URL', 'http://localhost:5173');

    if ($origin === $frontendUrl || $origin === rtrim($frontendUrl, '/')) {
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

// Route de soumission des demandes clients (devis, commandes, réservations, contacts)
$router->post('/api/requests', [RequestController::class, 'store']);

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

// Routes d'administration - Demandes clients (statistiques, export CSV et gestion de statut)
$router->get('/api/admin/stats', [AdminRequestController::class, 'stats'], [AdminAuthMiddleware::class]);
$router->get('/api/admin/requests/export', [AdminRequestController::class, 'export'], [AdminAuthMiddleware::class]);
$router->get('/api/admin/requests', [AdminRequestController::class, 'index'], [AdminAuthMiddleware::class]);
$router->get('/api/admin/requests/{id}', [AdminRequestController::class, 'show'], [AdminAuthMiddleware::class]);
$router->patch('/api/admin/requests/{id}', [AdminRequestController::class, 'update'], [AdminAuthMiddleware::class, CsrfMiddleware::class]);

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
