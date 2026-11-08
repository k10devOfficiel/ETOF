<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Core\Database;
use App\Services\RateLimiter;
use PHPUnit\Framework\TestCase;

final class RateLimiterTest extends TestCase
{
    private string $testIp = '192.168.100.99';
    private string $testAction = 'unit_test_action';

    protected function setUp(): void
    {
        parent::setUp();
        // Nettoyage préalable pour l'IP de test
        $pdo = Database::getConnection();
        $ipHash = RateLimiter::hashIp($this->testIp);
        $stmt = $pdo->prepare("DELETE FROM rate_limits WHERE ip_hash = :hash");
        $stmt->execute([':hash' => $ipHash]);
    }

    protected function tearDown(): void
    {
        $pdo = Database::getConnection();
        $ipHash = RateLimiter::hashIp($this->testIp);
        $stmt = $pdo->prepare("DELETE FROM rate_limits WHERE ip_hash = :hash");
        $stmt->execute([':hash' => $ipHash]);
        parent::tearDown();
    }

    public function testHashIpProducesSha256(): void
    {
        $hash1 = RateLimiter::hashIp('127.0.0.1');
        $hash2 = RateLimiter::hashIp('127.0.0.1');
        $hash3 = RateLimiter::hashIp('192.168.1.1');

        $this->assertSame(64, strlen($hash1));
        $this->assertMatchesRegularExpression('/^[a-f0-9]{64}$/', $hash1);
        $this->assertSame($hash1, $hash2);
        $this->assertNotSame($hash1, $hash3);
    }

    public function testCheckAllowsUnderLimitAndBlocksWhenExceeded(): void
    {
        $maxAttempts = 3;
        $decayMinutes = 10;

        // Avant toute tentative : autorisé
        $this->assertTrue(RateLimiter::check($this->testIp, $this->testAction, $maxAttempts, $decayMinutes));

        // 1ère tentative
        RateLimiter::hit($this->testIp, $this->testAction);
        $this->assertTrue(RateLimiter::check($this->testIp, $this->testAction, $maxAttempts, $decayMinutes));

        // 2ème tentative
        RateLimiter::hit($this->testIp, $this->testAction);
        $this->assertTrue(RateLimiter::check($this->testIp, $this->testAction, $maxAttempts, $decayMinutes));

        // 3ème tentative (seuil atteint)
        RateLimiter::hit($this->testIp, $this->testAction);
        // Le quota est maintenant épuisé
        $this->assertFalse(RateLimiter::check($this->testIp, $this->testAction, $maxAttempts, $decayMinutes));
    }

    public function testPurgeRemovesExpiredEntries(): void
    {
        $pdo = Database::getConnection();
        $ipHash = RateLimiter::hashIp($this->testIp);

        // Insertion manuelle d'une entrée expirée (il y a 2 heures)
        $stmt = $pdo->prepare("INSERT INTO rate_limits (ip_hash, action, created_at) VALUES (:hash, :action, NOW() - INTERVAL 120 MINUTE)");
        $stmt->execute([':hash' => $ipHash, ':action' => $this->testAction]);

        // Purge des entrées de plus de 60 minutes
        $purged = RateLimiter::purge(60);
        $this->assertGreaterThanOrEqual(1, $purged);

        // L'action doit être à nouveau autorisée
        $this->assertTrue(RateLimiter::check($this->testIp, $this->testAction, 1, 10));
    }

    public function testTooManyRequestsResponse(): void
    {
        $response = RateLimiter::createTooManyRequestsResponse(600);

        $this->assertSame(429, $response->getStatusCode());
        $this->assertSame('600', $response->getHeaders()['Retry-After'] ?? null);

        $data = $response->getData();
        $this->assertFalse($data['success']);
        $this->assertSame('TOO_MANY_REQUESTS', $data['error']['code']);
    }
}

