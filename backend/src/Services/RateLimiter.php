<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\Config;
use App\Core\Database;
use App\Core\Response;
use PDO;
use Throwable;

/**
 * Service de limitation de débit par IP hachée (SHA-256) et par action avec persistance MySQL.
 */
final class RateLimiter
{
    /**
     * Génère une empreinte SHA-256 sécurisée et salée de l'adresse IP.
     */
    public static function hashIp(string $ip): string
    {
        $salt = (string) Config::get('RATE_LIMIT_SALT', 'etof_default_security_salt_2026');
        return hash('sha256', $ip . '|' . $salt);
    }

    /**
     * Vérifie si le quota de requêtes autorisées n'est pas dépassé.
     *
     * @param string $ip Adresse IP du client
     * @param string $action Nom de l'action surveillée (ex: 'contact_form', 'quote_request')
     * @param int $maxAttempts Nombre maximal de tentatives (défaut : 5)
     * @param int $decayMinutes Fenêtre temporelle en minutes (défaut : 10)
     */
    public static function check(string $ip, string $action, int $maxAttempts = 5, int $decayMinutes = 10): bool
    {
        try {
            $pdo = Database::getConnection();
            $ipHash = self::hashIp($ip);

            // Purge opportuniste des anciennes entrées (au-delà de 24h)
            if (random_int(1, 100) <= 5) {
                self::purge(1440);
            }

            $sql = "SELECT COUNT(*) FROM rate_limits 
                    WHERE ip_hash = :ip_hash 
                      AND action = :action 
                      AND created_at >= (NOW() - INTERVAL :decay MINUTE)";

            $stmt = $pdo->prepare($sql);
            $stmt->bindValue(':ip_hash', $ipHash, PDO::PARAM_STR);
            $stmt->bindValue(':action', $action, PDO::PARAM_STR);
            $stmt->bindValue(':decay', $decayMinutes, PDO::PARAM_INT);
            $stmt->execute();

            $attempts = (int) $stmt->fetchColumn();

            return $attempts < $maxAttempts;
        } catch (Throwable) {
            // En cas d'indisponibilité momentanée de la BDD, autoriser pour ne pas bloquer les clients
            return true;
        }
    }

    /**
     * Enregistre une tentative dans la table rate_limits.
     */
    public static function hit(string $ip, string $action): void
    {
        try {
            $pdo = Database::getConnection();
            $ipHash = self::hashIp($ip);

            $stmt = $pdo->prepare("INSERT INTO rate_limits (ip_hash, action, created_at) VALUES (:ip_hash, :action, NOW())");
            $stmt->execute([
                ':ip_hash' => $ipHash,
                ':action' => $action,
            ]);
        } catch (Throwable) {
            // Tolérance aux pannes
        }
    }

    /**
     * Supprime les anciennes lignes expirées de la table rate_limits.
     */
    public static function purge(int $olderThanMinutes = 60): int
    {
        try {
            $pdo = Database::getConnection();
            $stmt = $pdo->prepare("DELETE FROM rate_limits WHERE created_at < (NOW() - INTERVAL :minutes MINUTE)");
            $stmt->bindValue(':minutes', $olderThanMinutes, PDO::PARAM_INT);
            $stmt->execute();

            return $stmt->rowCount();
        } catch (Throwable) {
            return 0;
        }
    }

    /**
     * Produit la réponse standardisée HTTP 429 Too Many Requests.
     */
    public static function createTooManyRequestsResponse(int $retryAfterSeconds = 600): Response
    {
        return Response::error(
            'TOO_MANY_REQUESTS',
            'Trop de requêtes soumises. Veuillez patienter avant de renouveler votre opération.',
            429,
            null,
            ['Retry-After' => (string) $retryAfterSeconds]
        );
    }
}

