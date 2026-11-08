<?php

declare(strict_types=1);

namespace Tests\Integration;

use App\Controllers\RequestController;
use App\Core\Database;
use App\Core\Request;
use App\Services\RequestService;
use App\Services\ValidationException;
use PHPUnit\Framework\TestCase;

final class RequestCreationTest extends TestCase
{
    private string $testIp = '10.0.0.42';

    public function testCreateValidContactRequest(): void
    {
        $payload = [
            'type' => 'contact',
            'activity' => 'general',
            'lang' => 'fr',
            'full_name' => 'Adjoua Marie',
            'company' => 'ETOF Test Partner',
            'email' => 'adjoua.marie@example.ci',
            'phone' => '+225 07 11 22 33 44',
            'message' => 'Demande de rendez-vous pour partenariat commercial.',
            'consent' => true,
        ];

        $result = RequestService::createRequest($payload, $this->testIp);

        $this->assertArrayHasKey('reference', $result);
        $this->assertStringStartsWith('ETOF-', $result['reference']);
        $this->assertSame('contact', $result['type']);

        // Vérification de l'enregistrement en BDD
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT * FROM requests WHERE reference = :ref LIMIT 1");
        $stmt->execute([':ref' => $result['reference']]);
        $req = $stmt->fetch();

        $this->assertNotFalse($req);
        $this->assertSame('Adjoua Marie', $req['full_name']);
        $this->assertSame('adjoua.marie@example.ci', $req['email']);
        $this->assertSame('new', $req['status']);
    }

    public function testCreateValidVehicleReservationRequest(): void
    {
        // Récupérer un véhicule actif et disponible
        $pdo = Database::getConnection();
        $stmt = $pdo->query("SELECT id FROM vehicles WHERE is_active = 1 AND status = 'available' LIMIT 1");
        $vehicle = $stmt->fetch();
        $this->assertNotFalse($vehicle, "Un véhicule de démonstration disponible doit exister.");

        $vehicleId = (int) $vehicle['id'];
        $nextMonth = date('Y-m-d', strtotime('+10 days'));
        $nextMonthEnd = date('Y-m-d', strtotime('+15 days'));

        $payload = [
            'type' => 'reservation',
            'activity' => 'vehicle',
            'lang' => 'fr',
            'full_name' => 'Kouassi Yves',
            'email' => 'yves.kouassi@example.ci',
            'phone' => '+225 05 05 05 05 05',
            'vehicle_id' => $vehicleId,
            'start_date' => $nextMonth,
            'end_date' => $nextMonthEnd,
            'message' => 'Réservation pour déplacement en région.',
            'consent' => true,
        ];

        $result = RequestService::createRequest($payload, $this->testIp);

        $this->assertNotEmpty($result['reference']);
        $this->assertSame('reservation', $result['type']);

        $stmt = $pdo->prepare("SELECT vehicle_id, start_date, end_date FROM requests WHERE reference = :ref");
        $stmt->execute([':ref' => $result['reference']]);
        $row = $stmt->fetch();

        $this->assertSame($vehicleId, (int) $row['vehicle_id']);
        $this->assertSame($nextMonth, $row['start_date']);
        $this->assertSame($nextMonthEnd, $row['end_date']);
    }

    public function testCreateValidFuelQuoteRequest(): void
    {
        $payload = [
            'type' => 'quote',
            'activity' => 'fuel',
            'lang' => 'en',
            'full_name' => 'John Doe Logistics',
            'company' => 'International Mining SARL',
            'email' => 'john.doe@logistics.com',
            'phone' => '+225 27 22 11 00 99',
            'message' => 'Need quote for bulk fuel haulage.',
            'consent' => '1',
            'details' => [
                'service_type' => 'heavy_fuel_transport',
                'estimated_volume' => '45000 Liters',
                'origin' => 'Vridi Terminal, Abidjan',
                'destination' => 'Yamoussoukro Depot',
                'desired_date' => '2026-12-15',
            ],
        ];

        $result = RequestService::createRequest($payload, $this->testIp);

        $this->assertNotEmpty($result['reference']);

        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT details, lang FROM requests WHERE reference = :ref");
        $stmt->execute([':ref' => $result['reference']]);
        $row = $stmt->fetch();

        $this->assertSame('en', $row['lang']);
        $details = json_decode((string) $row['details'], true);
        $this->assertIsArray($details);
        $this->assertSame('heavy_fuel_transport', $details['service_type']);
        $this->assertSame('45000 Liters', $details['estimated_volume']);
    }

    public function testCreateValidOrderWithSnapshots(): void
    {
        $pdo = Database::getConnection();
        $stmt = $pdo->query("SELECT id, name_fr, price, min_quantity FROM products WHERE is_active = 1 AND is_orderable = 1 AND is_available = 1 LIMIT 1");
        $product = $stmt->fetch();
        $this->assertNotFalse($product, "Un produit commandable doit être présent pour ce test.");

        $productId = (int) $product['id'];
        $quantity = max(1, (int) $product['min_quantity']);

        $payload = [
            'type' => 'order',
            'activity' => 'farm',
            'lang' => 'fr',
            'full_name' => 'Aïcha Traoré',
            'email' => 'aicha.traore@example.ci',
            'phone' => '07 10 20 30 40',
            'message' => 'Livraison rapide souhaitée.',
            'consent' => true,
            'items' => [
                ['product_id' => $productId, 'quantity' => $quantity],
            ],
        ];

        $result = RequestService::createRequest($payload, $this->testIp);
        $this->assertNotEmpty($result['reference']);

        // Vérifier les lignes request_items et les snapshots
        $stmt = $pdo->prepare("SELECT ri.* FROM request_items ri 
                               INNER JOIN requests r ON ri.request_id = r.id 
                               WHERE r.reference = :ref");
        $stmt->execute([':ref' => $result['reference']]);
        $items = $stmt->fetchAll();

        $this->assertCount(1, $items);
        $this->assertSame($productId, (int) $items[0]['product_id']);
        $this->assertSame($quantity, (int) $items[0]['quantity']);
        $this->assertSame($product['name_fr'], $items[0]['label_snapshot']);
        if ($product['price'] !== null) {
            $this->assertSame((int) $product['price'], (int) $items[0]['unit_price_snapshot']);
        }
    }

    public function testRejectMissingConsent(): void
    {
        $payload = [
            'type' => 'contact',
            'activity' => 'general',
            'full_name' => 'Test Sans Consentement',
            'email' => 'test@example.ci',
            'phone' => '0701020304',
            'consent' => false,
        ];

        $this->expectException(ValidationException::class);
        RequestService::createRequest($payload, $this->testIp);
    }

    public function testRejectPastDatesInReservation(): void
    {
        $payload = [
            'type' => 'reservation',
            'activity' => 'vehicle',
            'full_name' => 'Test Dates Passees',
            'email' => 'test@example.ci',
            'phone' => '0701020304',
            'vehicle_id' => 1,
            'start_date' => '2020-01-01',
            'end_date' => '2020-01-05',
            'consent' => true,
        ];

        $this->expectException(ValidationException::class);
        RequestService::createRequest($payload, $this->testIp);
    }

    public function testRejectEndDateBeforeStartDate(): void
    {
        $payload = [
            'type' => 'reservation',
            'activity' => 'vehicle',
            'full_name' => 'Test Inversion Dates',
            'email' => 'test@example.ci',
            'phone' => '0701020304',
            'vehicle_id' => 1,
            'start_date' => '2026-12-10',
            'end_date' => '2026-12-05',
            'consent' => true,
        ];

        $this->expectException(ValidationException::class);
        RequestService::createRequest($payload, $this->testIp);
    }

    public function testRejectInvalidEmailAndPhone(): void
    {
        $payload = [
            'type' => 'contact',
            'activity' => 'general',
            'full_name' => 'Format Errone',
            'email' => 'mauvais-email',
            'phone' => '1234',
            'consent' => true,
        ];

        try {
            RequestService::createRequest($payload, $this->testIp);
            $this->fail("Une ValidationException aurait dû être levée.");
        } catch (ValidationException $e) {
            $fields = $e->getFields();
            $this->assertArrayHasKey('email', $fields);
            $this->assertArrayHasKey('phone', $fields);
        }
    }

    public function testHoneypotRejectsSilentlyInController(): void
    {
        $controller = new RequestController();
        $request = new Request(
            method: 'POST',
            path: '/api/requests',
            body: [
                'type' => 'contact',
                'activity' => 'general',
                'full_name' => 'Spam Bot',
                'email' => 'bot@spammer.org',
                'phone' => '0701020304',
                'website' => 'http://spam-link.ru', // Piège Honeypot rempli
                'consent' => true,
            ],
            server: ['REMOTE_ADDR' => '127.0.0.99']
        );

        $response = $controller->store($request);
        $this->assertSame(200, $response->getStatusCode());
        $data = $response->getData();
        $this->assertTrue($data['success']);

        // Aucune demande créée en BDD pour cet e-mail spam
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM requests WHERE email = 'bot@spammer.org'");
        $stmt->execute();
        $this->assertSame(0, (int) $stmt->fetchColumn());
    }
}
