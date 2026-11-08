<?php

declare(strict_types=1);

namespace App\Core;

use Dotenv\Dotenv;

/**
 * Gestionnaire de configuration basé sur Dotenv avec valeurs de secours.
 */
final class Config
{
    private static bool $loaded = false;

    /**
     * @var array<string, mixed>
     */
    private static array $defaults = [
        'APP_ENV' => 'production',
        'APP_URL' => 'http://localhost:8000',
        'FRONTEND_URL' => 'http://localhost:5173',
        'DB_HOST' => '127.0.0.1',
        'DB_PORT' => '3306',
        'DB_NAME' => 'etof_site',
        'DB_USER' => 'root',
        'DB_PASS' => '',
        'TRUSTED_PROXIES' => '127.0.0.1,::1',
    ];

    /**
     * Charge les variables d'environnement depuis le fichier .env
     */
    public static function load(string $baseDir): void
    {
        if (self::$loaded) {
            return;
        }

        if (file_exists($baseDir . '/.env')) {
            $dotenv = Dotenv::createImmutable($baseDir);
            $dotenv->safeLoad();
        }

        self::$loaded = true;
    }

    /**
     * Récupère une variable de configuration avec valeur par défaut optionnelle.
     */
    public static function get(string $key, mixed $default = null): mixed
    {
        if (array_key_exists($key, $_ENV) && $_ENV[$key] !== '') {
            return $_ENV[$key];
        }

        if (array_key_exists($key, $_SERVER) && $_SERVER[$key] !== '') {
            return $_SERVER[$key];
        }

        $envValue = getenv($key);
        if ($envValue !== false && $envValue !== '') {
            return $envValue;
        }

        return $default ?? self::$defaults[$key] ?? null;
    }

    /**
     * Vérifie si l'environnement applicatif est en mode développement.
     */
    public static function isDev(): bool
    {
        $env = strtolower((string) self::get('APP_ENV', 'production'));
        return in_array($env, ['dev', 'development', 'local'], true);
    }
}

