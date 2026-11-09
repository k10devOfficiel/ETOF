<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\Config;

/**
 * Gestionnaire des sessions administrateur sécurisées et des jetons CSRF.
 */
final class SessionService
{
    private const INACTIVITY_TIMEOUT = 7200; // 2 heures (en secondes)
    private const SESSION_NAME = 'etof_admin_session';

    /**
     * Démarre et sécurise la session PHP avec cookies HttpOnly, SameSite=Lax et contrôle d'inactivité.
     */
    public static function start(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }

        ini_set('session.cookie_httponly', '1');
        ini_set('session.use_only_cookies', '1');
        ini_set('session.use_strict_mode', '1');

        session_name(self::SESSION_NAME);

        session_set_cookie_params([
            'lifetime' => 0, // Cookie de session qui expire à la fermeture du navigateur
            'path' => '/',
            'domain' => '',
            'secure' => !Config::isDev() || (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
            'httponly' => true,             // Inaccessible depuis JavaScript
            'samesite' => 'Strict',         // Protection CSRF stricte
        ]);

        session_start();

        // Contrôle de la durée d'inactivité de 2 heures
        if (!empty($_SESSION['admin_id'])) {
            $lastActivity = (int) ($_SESSION['last_activity'] ?? 0);
            if ($lastActivity > 0 && (time() - $lastActivity) > self::INACTIVITY_TIMEOUT) {
                self::destroy();
                return;
            }
            $_SESSION['last_activity'] = time();
        }

        // Initialisation automatique du jeton CSRF s'il est absent
        if (empty($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
    }

    /**
     * Régénère l'identifiant de session lors d'un changement de privilège (connexion).
     */
    public static function regenerate(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_regenerate_id(true);
        }
    }

    /**
     * Détruit complètement la session et purge le cookie associé.
     */
    public static function destroy(): void
    {
        $_SESSION = [];

        if (session_status() === PHP_SESSION_ACTIVE) {
            if (ini_get('session.use_cookies')) {
                $params = session_get_cookie_params();
                setcookie(
                    session_name(),
                    '',
                    time() - 42000,
                    $params['path'],
                    $params['domain'],
                    $params['secure'],
                    $params['httponly']
                );
            }

            session_destroy();
        }
    }

    /**
     * Récupère le jeton CSRF courant de la session.
     */
    public static function getCsrfToken(): string
    {
        self::start();
        return (string) ($_SESSION['csrf_token'] ?? '');
    }

    /**
     * Vérifie la concordance à temps constant du jeton CSRF reçu.
     */
    public static function validateCsrfToken(?string $token): bool
    {
        self::start();

        $sessionToken = (string) ($_SESSION['csrf_token'] ?? '');
        if ($sessionToken === '' || $token === null || $token === '') {
            return false;
        }

        return hash_equals($sessionToken, $token);
    }
}

