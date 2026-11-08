<?php

declare(strict_types=1);

namespace Tests\Integration;

use App\Controllers\AdminProfileController;
use App\Controllers\AdminSettingsController;
use App\Controllers\SettingsController;
use App\Core\Database;
use App\Core\Request;
use App\Middlewares\AdminAuthMiddleware;
use App\Services\SessionService;
use PHPUnit\Framework\TestCase;

final class SettingsAndProfileTest extends TestCase
{
    private AdminSettingsController $settingsController;
    private AdminProfileController $profileController;
    private SettingsController $publicController;

    protected function setUp(): void
    {
        parent::setUp();
        $this->settingsController = new AdminSettingsController();
        $this->profileController = new AdminProfileController();
        $this->publicController = new SettingsController();

        SessionService::destroy();
    }

    protected function tearDown(): void
    {
        SessionService::destroy();

        // Réinitialiser le mot de passe initial de l'admin pour ne pas altérer les autres tests
        $pdo = Database::getConnection();
        $hash = password_hash('Password12345!', PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("UPDATE admins SET password_hash = :h WHERE id = 1");
        $stmt->execute(['h' => $hash]);

        parent::tearDown();
    }

    public function testRejectUnauthenticatedAccessToSettings(): void
    {
        $middleware = new AdminAuthMiddleware();
        $request = new Request('GET', '/api/admin/settings');
        $response = $middleware->handle($request);

        $this->assertNotNull($response);
        $this->assertSame(401, $response->getStatusCode());
    }

    public function testRejectXssInSettings(): void
    {
        $this->loginAdmin();

        $request = new Request('PUT', '/api/admin/settings', [], [
            'phone' => '+225 01 02 03 04',
            'address' => 'Cocody <script>alert("hack")</script>',
        ]);

        $response = $this->settingsController->update($request);
        $this->assertSame(422, $response->getStatusCode());
    }

    public function testUpdateSettingsAndReflectOnPublicApi(): void
    {
        $this->loginAdmin();

        $newSettings = [
            'phone' => '+225 27 22 10 20 30',
            'whatsapp' => '+2250708091011',
            'email' => 'contact@etofsarl.com',
            'address' => 'Abidjan, Cocody, Angré Oscars, Côte d’Ivoire',
            'facebook' => 'https://facebook.com/etofsarl',
            'instagram' => 'https://instagram.com/etofsarl',
            'linkedin' => 'https://linkedin.com/company/etof-sarl',
            'opening_hours' => 'Lun - Ven : 08h00 - 18h00',
        ];

        $request = new Request('PUT', '/api/admin/settings', [], $newSettings);
        $response = $this->settingsController->update($request);
        $this->assertSame(200, $response->getStatusCode());

        // Vérification que le site public retourne ces données
        $publicRequest = new Request('GET', '/api/settings');
        $publicResponse = $this->publicController->index($publicRequest);
        $publicEnvelope = $publicResponse->getData();
        $publicData = $publicEnvelope['data'] ?? [];

        $this->assertSame('+2250708091011', $publicData['whatsapp']);
        $this->assertSame('+225 27 22 10 20 30', $publicData['phone']);
        $this->assertSame('contact@etofsarl.com', $publicData['email']);
    }

    public function testUpdatePasswordValidationRules(): void
    {
        $this->loginAdmin();

        // 1. Trop court (< 12 caractères)
        $shortReq = new Request('PUT', '/api/admin/profile/password', [], [
            'current_password' => 'Password12345!',
            'new_password' => 'Court123!',
            'new_password_confirmation' => 'Court123!',
        ]);
        $shortRes = $this->profileController->updatePassword($shortReq);
        $this->assertSame(422, $shortRes->getStatusCode());

        // 2. Ancien mot de passe erroné
        $wrongReq = new Request('PUT', '/api/admin/profile/password', [], [
            'current_password' => 'MauvaisMotDePasse!',
            'new_password' => 'NouveauMotDePasse2026!Long',
            'new_password_confirmation' => 'NouveauMotDePasse2026!Long',
        ]);
        $wrongRes = $this->profileController->updatePassword($wrongReq);
        $this->assertSame(422, $wrongRes->getStatusCode());

        // 3. Confirmation non identique
        $mismatchReq = new Request('PUT', '/api/admin/profile/password', [], [
            'current_password' => 'Password12345!',
            'new_password' => 'NouveauMotDePasse2026!Long',
            'new_password_confirmation' => 'DifferentPassword2026!',
        ]);
        $mismatchRes = $this->profileController->updatePassword($mismatchReq);
        $this->assertSame(422, $mismatchRes->getStatusCode());

        // 4. Succès avec 12+ caractères et bon mot de passe
        $validReq = new Request('PUT', '/api/admin/profile/password', [], [
            'current_password' => 'Password12345!',
            'new_password' => 'NouveauMotDePasse2026!Long',
            'new_password_confirmation' => 'NouveauMotDePasse2026!Long',
        ]);
        $validRes = $this->profileController->updatePassword($validReq);
        $this->assertSame(200, $validRes->getStatusCode());
    }

    private function loginAdmin(): void
    {
        SessionService::start();
        $_SESSION['admin_id'] = 1;
        $_SESSION['admin_email'] = 'admin@etofsarl.com';
        $_SESSION['admin_name'] = 'Administrateur ETOF';
        $_SESSION['last_activity'] = time();
    }
}

