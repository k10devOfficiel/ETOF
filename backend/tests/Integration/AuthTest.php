<?php

declare(strict_types=1);

namespace Tests\Integration;

use App\Controllers\AdminAuthController;
use App\Core\Database;
use App\Core\Request;
use App\Middlewares\AdminAuthMiddleware;
use App\Middlewares\CsrfMiddleware;
use App\Services\RateLimiter;
use App\Services\SessionService;
use PHPUnit\Framework\TestCase;

final class AuthTest extends TestCase
{
    private AdminAuthController $controller;
    private string $testEmail = 'admin@etofsarl.com';
    private string $testPassword = 'Password12345!';

    protected function setUp(): void
    {
        parent::setUp();
        $this->controller = new AdminAuthController();
        SessionService::destroy();

        // Réinitialisation des limitations de débit pour l'adresse IP de test
        $pdo = Database::getConnection();
        $ipHash = RateLimiter::hashIp('127.0.0.1');
        $stmt = $pdo->prepare("DELETE FROM rate_limits WHERE ip_hash = :hash");
        $stmt->execute([':hash' => $ipHash]);
    }

    protected function tearDown(): void
    {
        SessionService::destroy();
        parent::tearDown();
    }

    public function testGetCsrfToken(): void
    {
        $request = new Request(method: 'GET', path: '/api/admin/csrf');
        $response = $this->controller->csrf($request);

        $this->assertSame(200, $response->getStatusCode());
        $data = $response->getData();
        $this->assertTrue($data['success']);
        $this->assertNotEmpty($data['data']['csrf_token']);
        $this->assertSame(64, strlen($data['data']['csrf_token']));
    }

    public function testLoginSuccessWithValidCredentials(): void
    {
        $request = new Request(
            method: 'POST',
            path: '/api/admin/login',
            body: [
                'email' => $this->testEmail,
                'password' => $this->testPassword,
            ],
            server: ['REMOTE_ADDR' => '127.0.0.1']
        );

        $response = $this->controller->login($request);

        $this->assertSame(200, $response->getStatusCode());
        $data = $response->getData();
        $this->assertTrue($data['success']);
        $this->assertSame($this->testEmail, $data['data']['admin']['email']);
        $this->assertNotEmpty($data['data']['csrf_token']);
        $this->assertArrayNotHasKey('password_hash', $data['data']['admin']);

        // Vérifier que la session contient bien les informations administrateur
        $this->assertSame($this->testEmail, $_SESSION['admin_email'] ?? null);
        $this->assertNotEmpty($_SESSION['admin_id'] ?? null);
    }

    public function testLoginFailsWithInvalidPassword(): void
    {
        $request = new Request(
            method: 'POST',
            path: '/api/admin/login',
            body: [
                'email' => $this->testEmail,
                'password' => 'WrongPassword999!',
            ],
            server: ['REMOTE_ADDR' => '127.0.0.1']
        );

        $response = $this->controller->login($request);

        $this->assertSame(401, $response->getStatusCode());
        $data = $response->getData();
        $this->assertFalse($data['success']);
        $this->assertSame('INVALID_CREDENTIALS', $data['error']['code']);
        $this->assertEmpty($_SESSION['admin_id'] ?? null);
    }

    public function testLoginFailsWithUnknownEmailWithoutRevealingExistence(): void
    {
        $request = new Request(
            method: 'POST',
            path: '/api/admin/login',
            body: [
                'email' => 'inconnu@etofsarl.com',
                'password' => 'AnyPassword123!',
            ],
            server: ['REMOTE_ADDR' => '127.0.0.1']
        );

        $response = $this->controller->login($request);

        $this->assertSame(401, $response->getStatusCode());
        $data = $response->getData();
        $this->assertSame('INVALID_CREDENTIALS', $data['error']['code']);
        $this->assertSame('Identifiants de connexion invalides.', $data['error']['message']);
    }

    public function testBruteForceRateLimitingLocksAfterFiveAttempts(): void
    {
        for ($i = 1; $i <= 5; $i++) {
            $req = new Request(
                method: 'POST',
                path: '/api/admin/login',
                body: [
                    'email' => $this->testEmail,
                    'password' => "wrong_{$i}",
                ],
                server: ['REMOTE_ADDR' => '127.0.0.1']
            );
            $res = $this->controller->login($req);
            $this->assertSame(401, $res->getStatusCode(), "Tentative {$i} doit être rejetée avec 401.");
        }

        // La 6ème tentative doit être bloquée par le RateLimiter avec HTTP 429
        $blockedReq = new Request(
            method: 'POST',
            path: '/api/admin/login',
            body: [
                'email' => $this->testEmail,
                'password' => $this->testPassword, // Même avec les bons identifiants
            ],
            server: ['REMOTE_ADDR' => '127.0.0.1']
        );

        $blockedRes = $this->controller->login($blockedReq);
        $this->assertSame(429, $blockedRes->getStatusCode());
        $this->assertSame('TOO_MANY_REQUESTS', $blockedRes->getData()['error']['code']);
    }

    public function testAdminAuthMiddlewareBlocksUnauthenticated(): void
    {
        SessionService::destroy();

        $middleware = new AdminAuthMiddleware();
        $request = new Request(method: 'GET', path: '/api/admin/me');
        $response = $middleware->handle($request);

        $this->assertNotNull($response);
        $this->assertSame(401, $response->getStatusCode());
        $this->assertSame('UNAUTHORIZED', $response->getData()['error']['code']);
    }

    public function testCsrfMiddlewareValidation(): void
    {
        SessionService::start();
        $token = SessionService::getCsrfToken();

        $middleware = new CsrfMiddleware();

        // Requête GET : ignorée par le middleware CSRF
        $getReq = new Request(method: 'GET', path: '/api/admin/products');
        $this->assertNull($middleware->handle($getReq));

        // Requête POST avec jeton manquant : 403
        $postNoToken = new Request(method: 'POST', path: '/api/admin/products');
        $resNoToken = $middleware->handle($postNoToken);
        $this->assertNotNull($resNoToken);
        $this->assertSame(403, $resNoToken->getStatusCode());

        // Requête POST avec jeton valide dans l'en-tête
        $postWithToken = new Request(
            method: 'POST',
            path: '/api/admin/products',
            headers: ['x-csrf-token' => $token]
        );
        $this->assertNull($middleware->handle($postWithToken));
    }

    public function testLogoutDestroysSession(): void
    {
        $_SESSION['admin_id'] = 1;
        $_SESSION['admin_email'] = $this->testEmail;

        $request = new Request(method: 'POST', path: '/api/admin/logout');
        $response = $this->controller->logout($request);

        $this->assertSame(200, $response->getStatusCode());
        $this->assertEmpty($_SESSION);
    }
}

