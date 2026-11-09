<?php

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use App\Core\Config;
use App\Core\Database;
use App\Services\RateLimiter;
use App\Services\SessionService;

Config::load(__DIR__ . '/..');

echo "=== TEST DE SÉCURITÉ LOT 3 (ADMIN & API) ===\n\n";

$baseUrl = 'http://127.0.0.1:8000';
$cookieFile = sys_get_temp_dir() . '/etof_lot3_cookies.txt';
if (file_exists($cookieFile)) {
    unlink($cookieFile);
}

// Fonction helper pour requête HTTP avec support des cookies de session
function makeRequest(string $method, string $url, ?array $data = null, array $headers = [], ?string $cookieJar = null): array {
    $curl = curl_init();
    $opts = [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_HEADER => true,
        CURLOPT_TIMEOUT => 5,
    ];

    if ($cookieJar !== null) {
        $opts[CURLOPT_COOKIEJAR] = $cookieJar;
        $opts[CURLOPT_COOKIEFILE] = $cookieJar;
    }

    $formattedHeaders = [];
    foreach ($headers as $k => $v) {
        $formattedHeaders[] = "{$k}: {$v}";
    }

    if ($data !== null) {
        $opts[CURLOPT_POSTFIELDS] = json_encode($data);
        $formattedHeaders[] = 'Content-Type: application/json';
    }

    $opts[CURLOPT_HTTPHEADER] = $formattedHeaders;
    curl_setopt_array($curl, $opts);

    $raw = curl_exec($curl);
    $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $headerSize = curl_getinfo($curl, CURLINFO_HEADER_SIZE);
    curl_close($curl);

    $rawHeaders = substr((string)$raw, 0, $headerSize);
    $body = substr((string)$raw, $headerSize);
    $json = json_decode($body, true);

    return [
        'code' => $httpCode,
        'headers' => $rawHeaders,
        'body' => $body,
        'json' => $json,
    ];
}

// 1. TEST : API /api/admin/* sans session renvoie 404 (et non 401)
echo "1. Vérification 404 sur les endpoints admin sans session...\n";
$resMe = makeRequest('GET', "{$baseUrl}/api/admin/me");
echo "   GET /api/admin/me -> HTTP {$resMe['code']} (Attendu: 404)\n";
$resProd = makeRequest('GET', "{$baseUrl}/api/admin/products");
echo "   GET /api/admin/products -> HTTP {$resProd['code']} (Attendu: 404)\n";
$resReq = makeRequest('GET', "{$baseUrl}/api/admin/requests");
echo "   GET /api/admin/requests -> HTTP {$resReq['code']} (Attendu: 404)\n";

$pass1 = ($resMe['code'] === 404 && $resProd['code'] === 404 && $resReq['code'] === 404);
echo "   => " . ($pass1 ? "SUCCÈS: Toutes les routes admin non authentifiées renvoient 404" : "ÉCHEC") . "\n\n";

// 2. TEST : Échec injection SQL sur la connexion admin
echo "2. Test d'injection SQL sur la connexion admin...\n";
$csrfRes = makeRequest('GET', "{$baseUrl}/api/admin/csrf", null, [], $cookieFile);
$csrfToken = $csrfRes['json']['data']['csrf_token'] ?? '';

$sqlInjectionPayload = [
    'email' => "' OR '1'='1' -- ",
    'password' => "' OR '1'='1' -- ",
];
$resSql = makeRequest('POST', "{$baseUrl}/api/admin/login", $sqlInjectionPayload, [
    'X-CSRF-Token' => $csrfToken,
], $cookieFile);
echo "   POST /api/admin/login avec injection SQL -> HTTP {$resSql['code']} (Message: " . ($resSql['json']['error']['message'] ?? 'none') . ")\n";
$pass2 = ($resSql['code'] === 401 && ($resSql['json']['error']['message'] ?? '') === 'Identifiants invalides.');
echo "   => " . ($pass2 ? "SUCCÈS: Injection SQL neutralisée, réponse générique 'Identifiants invalides.'" : "ÉCHEC") . "\n\n";

// 3. TEST : Protection anti-brute force (5 tentatives échouées -> blocage)
echo "3. Test anti-bruteforce (5 échecs consécutifs)...\n";
$bruteIp = '198.51.100.99'; // IP fictive pour isoler le test
$actionIp = 'admin_login_ip';
$actionEmail = 'admin_login_email_' . hash('sha256', 'bad-attempt@etofsarl.com');

// Réinitialiser les hits éventuels de test
$pdo = Database::getConnection();
$cleanStmt = $pdo->prepare("DELETE FROM rate_limits WHERE action IN ('admin_login_ip', :emailAction)");
$cleanStmt->bindValue(':emailAction', $actionEmail);
$cleanStmt->execute();

$isBlocked = false;
for ($i = 1; $i <= 6; $i++) {
    $allowed = RateLimiter::check($bruteIp, $actionIp, 5, 15) && RateLimiter::check($bruteIp, $actionEmail, 5, 15);
    if ($allowed) {
        RateLimiter::hit($bruteIp, $actionIp);
        RateLimiter::hit($bruteIp, $actionEmail);
        echo "   Tentative {$i} : Enregistrée (échec normal)\n";
    } else {
        $isBlocked = true;
        echo "   Tentative {$i} : BLOQUÉE par RateLimiter (Délai 15 min)\n";
        break;
    }
}
$pass3 = $isBlocked;
echo "   => " . ($pass3 ? "SUCCÈS: 5 tentatives consécutives entraînent le blocage temporaire (15 min)" : "ÉCHEC") . "\n\n";

// 4. TEST : En-têtes HTTP de sécurité
echo "4. Vérification des en-têtes HTTP de sécurité...\n";
$headers = $resMe['headers'];
$hasNoSniff = str_contains($headers, 'X-Content-Type-Options: nosniff');
$hasDeny = str_contains($headers, 'X-Frame-Options: DENY');
$hasReferrer = str_contains($headers, 'Referrer-Policy: strict-origin-when-cross-origin');
$hasCsp = str_contains($headers, 'Content-Security-Policy:');

echo "   X-Content-Type-Options: " . ($hasNoSniff ? "PRÉSENT" : "ABSENT") . "\n";
echo "   X-Frame-Options: " . ($hasDeny ? "PRÉSENT" : "ABSENT") . "\n";
echo "   Referrer-Policy: " . ($hasReferrer ? "PRÉSENT" : "ABSENT") . "\n";
echo "   Content-Security-Policy: " . ($hasCsp ? "PRÉSENT" : "ABSENT") . "\n";

$pass4 = ($hasNoSniff && $hasDeny && $hasReferrer && $hasCsp);
echo "   => " . ($pass4 ? "SUCCÈS: Tous les en-têtes stricts de sécurité sont actifs" : "ÉCHEC") . "\n\n";

// Nettoyage cookie temporaire
if (file_exists($cookieFile)) {
    unlink($cookieFile);
}

// Bilan global
$allPassed = $pass1 && $pass2 && $pass3 && $pass4;
echo "=== BILAN TEST LOT 3 : " . ($allPassed ? "TOUS LES CRITÈRES SONT VALIDÉS (100%)" : "CERTAINS CRITÈRES ONT ÉCHOUÉ") . " ===\n";

exit($allPassed ? 0 : 1);
