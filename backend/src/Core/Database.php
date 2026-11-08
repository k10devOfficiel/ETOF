<?php

declare(strict_types=1);

namespace App\Core;

use PDO;
use PDOException;

/**
 * Gestionnaire de connexion à la base de données MySQL via PDO natif.
 */
final class Database
{
    private static ?PDO $connection = null;

    private function __construct()
    {
    }

    /**
     * Retourne l'instance unique de connexion PDO.
     *
     * @throws PDOException En cas d'échec de connexion
     */
    public static function getConnection(): PDO
    {
        if (self::$connection instanceof PDO) {
            return self::$connection;
        }

        $host = (string) Config::get('DB_HOST', '127.0.0.1');
        $port = (string) Config::get('DB_PORT', '3306');
        $dbname = (string) Config::get('DB_NAME', 'etof_site');
        $user = (string) Config::get('DB_USER', 'root');
        $pass = (string) Config::get('DB_PASS', '');

        $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $host, $port, $dbname);

        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
        ];

        self::$connection = new PDO($dsn, $user, $pass, $options);

        return self::$connection;
    }

    /**
     * Ferme explicitement la connexion PDO (utile pour les tests ou réinitialisations).
     */
    public static function disconnect(): void
    {
        self::$connection = null;
    }
}

