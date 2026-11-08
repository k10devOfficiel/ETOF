<?php

declare(strict_types=1);

namespace Tests\Integration;

use App\Controllers\AdminVehicleController;
use App\Controllers\VehicleController;
use App\Core\Database;
use App\Core\Request;
use App\Services\SessionService;
use PHPUnit\Framework\TestCase;

final class VehicleCrudTest extends TestCase
{
    private AdminVehicleController $adminController;
    private VehicleController $publicController;
    private int $categoryId = 3; // Berlines (catégorie véhicules)

    protected function setUp(): void
    {
        parent::setUp();
        $this->adminController = new AdminVehicleController();
        $this->publicController = new VehicleController();

        // Récupérer une catégorie de type vehicle valide
        $pdo = Database::getConnection();
        $stmt = $pdo->query("SELECT id FROM categories WHERE activity = 'vehicle' LIMIT 1");
        $cat = $stmt->fetch();
        if ($cat !== false) {
            $this->categoryId = (int) $cat['id'];
        }
    }

    public function testCreateVehicleWithAutoSlugAndValidSpecs(): void
    {
        $uniqueSuffix = bin2hex(random_bytes(3));
        $brand = "MarqueTest-{$uniqueSuffix}";
        $model = "Modele-{$uniqueSuffix}";

        $payload = [
            'category_id' => $this->categoryId,
            'brand' => $brand,
            'model' => $model,
            'year' => 2024,
            'mode' => 'both',
            'status' => 'available',
            'price_sale' => 15000000,
            'price_rental_day' => 45000,
            'specs' => [
                'fuel' => 'Diesel',
                'transmission' => 'Automatique',
                'seats' => 5,
                'mileage' => '12 500 km',
            ],
            'description_fr' => 'Véhicule de test automatisé.',
            'description_en' => 'Automated test vehicle.',
            'is_active' => true,
        ];

        $request = new Request(method: 'POST', path: '/api/admin/vehicles', body: $payload);
        $response = $this->adminController->store($request);

        $this->assertSame(201, $response->getStatusCode());
        $data = $response->getData();
        $this->assertTrue($data['success']);
        $this->assertNotEmpty($data['data']['id']);
        $this->assertNotEmpty($data['data']['slug']);

        $vehicleId = (int) $data['data']['id'];
        $vehicleSlug = (string) $data['data']['slug'];

        // Vérifier la présence en base de données
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT * FROM vehicles WHERE id = :id");
        $stmt->execute([':id' => $vehicleId]);
        $row = $stmt->fetch();

        $this->assertNotFalse($row);
        $this->assertSame($brand, $row['brand']);
        $this->assertSame(15000000, (int) $row['price_sale']);
        $this->assertSame(45000, (int) $row['price_rental_day']);

        $specs = json_decode((string) $row['specs'], true);
        $this->assertIsArray($specs);
        $this->assertSame('Diesel', $specs['fuel']);

        // Vérifier l'accès public via la route de détail
        $publicReq = new Request(method: 'GET', path: "/api/vehicles/{$vehicleSlug}");
        $publicRes = $this->publicController->show($publicReq, ['slug' => $vehicleSlug]);
        $this->assertSame(200, $publicRes->getStatusCode());
        $publicData = $publicRes->getData();
        $this->assertSame($brand, $publicData['data']['brand']);

        // Nettoyage : suppression définitive
        $deleteReq = new Request(
            method: 'DELETE',
            path: "/api/admin/vehicles/{$vehicleId}",
            queryParams: ['confirm' => 'true']
        );
        $deleteRes = $this->adminController->destroy($deleteReq, ['id' => (string) $vehicleId]);
        $this->assertSame(200, $deleteRes->getStatusCode());
        $this->assertTrue($deleteRes->getData()['data']['hard_deleted']);
    }

    public function testRejectInvalidCategoryForVehicle(): void
    {
        // Récupérer une catégorie de type 'farm' (interdite pour un véhicule)
        $pdo = Database::getConnection();
        $stmt = $pdo->query("SELECT id FROM categories WHERE activity = 'farm' LIMIT 1");
        $cat = $stmt->fetch();
        $this->assertNotFalse($cat);

        $payload = [
            'category_id' => (int) $cat['id'],
            'brand' => 'InvalideCat',
            'model' => 'VoitureFerme',
            'year' => 2023,
            'mode' => 'sale',
            'status' => 'available',
        ];

        $request = new Request(method: 'POST', path: '/api/admin/vehicles', body: $payload);
        $response = $this->adminController->store($request);

        $this->assertSame(422, $response->getStatusCode());
        $data = $response->getData();
        $this->assertSame('VALIDATION_FAILED', $data['error']['code']);
    }

    public function testRejectNegativePriceAndInvalidSpecs(): void
    {
        $payload = [
            'category_id' => $this->categoryId,
            'brand' => 'PrixNegatif',
            'model' => 'ModeleX',
            'year' => 2023,
            'mode' => 'sale',
            'status' => 'available',
            'price_sale' => -5000, // Invalide
            'specs' => 'ceci_n_est_pas_un_json_valide', // Invalide
        ];

        $request = new Request(method: 'POST', path: '/api/admin/vehicles', body: $payload);
        $response = $this->adminController->store($request);

        $this->assertSame(422, $response->getStatusCode());
    }

    public function testSoftDeleteDeactivatesVehicle(): void
    {
        // Création d'un véhicule temporaire
        $payload = [
            'category_id' => $this->categoryId,
            'brand' => 'SoftDeleteBrand',
            'model' => 'SoftModel',
            'year' => 2022,
            'mode' => 'sale',
            'status' => 'available',
            'is_active' => true,
        ];

        $createReq = new Request(method: 'POST', path: '/api/admin/vehicles', body: $payload);
        $createRes = $this->adminController->store($createReq);
        $vehicleId = (int) $createRes->getData()['data']['id'];

        // Appel DELETE sans confirm -> doit désactiver (soft delete)
        $softReq = new Request(method: 'DELETE', path: "/api/admin/vehicles/{$vehicleId}");
        $softRes = $this->adminController->destroy($softReq, ['id' => (string) $vehicleId]);

        $this->assertSame(200, $softRes->getStatusCode());
        $this->assertFalse($softRes->getData()['data']['hard_deleted']);
        $this->assertFalse($softRes->getData()['data']['is_active']);

        // Vérifier en base que is_active = 0
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT is_active FROM vehicles WHERE id = :id");
        $stmt->execute([':id' => $vehicleId]);
        $this->assertSame(0, (int) $stmt->fetchColumn());

        // Nettoyage final : suppression définitive
        $hardReq = new Request(
            method: 'DELETE',
            path: "/api/admin/vehicles/{$vehicleId}",
            queryParams: ['confirm' => 'true']
        );
        $this->adminController->destroy($hardReq, ['id' => (string) $vehicleId]);
    }

    public function testUpdateVehicle(): void
    {
        $payload = [
            'category_id' => $this->categoryId,
            'brand' => 'BeforeUpdate',
            'model' => 'ModelA',
            'year' => 2022,
            'mode' => 'sale',
            'status' => 'available',
        ];

        $createRes = $this->adminController->store(new Request('POST', '/api/admin/vehicles', body: $payload));
        $vehicleId = (int) $createRes->getData()['data']['id'];

        $updatePayload = [
            'category_id' => $this->categoryId,
            'brand' => 'AfterUpdate',
            'model' => 'ModelB',
            'year' => 2023,
            'mode' => 'rental',
            'status' => 'reserved',
            'price_rental_day' => 60000,
        ];

        $updateReq = new Request('PUT', "/api/admin/vehicles/{$vehicleId}", body: $updatePayload);
        $updateRes = $this->adminController->update($updateReq, ['id' => (string) $vehicleId]);

        $this->assertSame(200, $updateRes->getStatusCode());

        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT brand, model, mode, status, price_rental_day FROM vehicles WHERE id = :id");
        $stmt->execute([':id' => $vehicleId]);
        $row = $stmt->fetch();

        $this->assertSame('AfterUpdate', $row['brand']);
        $this->assertSame('ModelB', $row['model']);
        $this->assertSame('rental', $row['mode']);
        $this->assertSame('reserved', $row['status']);
        $this->assertSame(60000, (int) $row['price_rental_day']);

        // Nettoyage
        $this->adminController->destroy(new Request('DELETE', "/api/admin/vehicles/{$vehicleId}", queryParams: ['confirm' => 'true']), ['id' => (string) $vehicleId]);
    }
}
