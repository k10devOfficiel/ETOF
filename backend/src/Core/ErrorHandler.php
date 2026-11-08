<?php

declare(strict_types=1);

namespace App\Core;

use ErrorException;
use Throwable;

/**
 * Gestionnaire d'erreurs et d'exceptions globales.
 * Journalise les détails dans storage/logs et retourne un JSON 500 générique sans trace au client.
 */
final class ErrorHandler
{
    private static string $logDir = '';
    private static bool $registered = false;

    /**
     * Enregistre les gestionnaires d'exceptions, d'erreurs et d'arrêt PHP.
     */
    public static function register(string $logDir): void
    {
        if (self::$registered) {
            return;
        }

        self::$logDir = rtrim($logDir, '/\\');
        self::$registered = true;

        if (!is_dir(self::$logDir)) {
            @mkdir(self::$logDir, 0755, true);
        }

        // Désactive l'affichage par défaut des erreurs dans la sortie HTTP
        ini_set('display_errors', '0');
        ini_set('display_startup_errors', '0');
        error_reporting(E_ALL);

        set_error_handler([self::class, 'handleError']);
        set_exception_handler([self::class, 'handleException']);
        register_shutdown_function([self::class, 'handleShutdown']);
    }

    /**
     * Convertit les avertissements et erreurs PHP en exceptions ErrorException.
     *
     * @throws ErrorException
     */
    public static function handleError(int $severity, string $message, string $file, int $line): bool
    {
        if (!(error_reporting() & $severity)) {
            return false;
        }

        throw new ErrorException($message, 0, $severity, $file, $line);
    }

    /**
     * Capture toute exception non interceptée et émet une réponse JSON sécurisée.
     */
    public static function handleException(Throwable $throwable): void
    {
        self::logThrowable($throwable);

        if (!headers_sent()) {
            $response = Response::error(
                'INTERNAL_SERVER_ERROR',
                'Une erreur interne est survenue sur le serveur.',
                500
            );
            $response->send();
        }

        exit(1);
    }

    /**
     * Intercepte les erreurs fatales au moment de l'arrêt du script.
     */
    public static function handleShutdown(): void
    {
        $error = error_get_last();
        if ($error !== null && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
            $exception = new ErrorException(
                $error['message'],
                0,
                $error['type'],
                $error['file'],
                $error['line']
            );
            self::handleException($exception);
        }
    }

    /**
     * Écrit les informations de débogage complètes dans un fichier de journalisation journalier.
     */
    public static function logThrowable(Throwable $throwable): void
    {
        if (self::$logDir === '') {
            return;
        }

        $logFile = self::$logDir . '/error-' . date('Y-m-d') . '.log';
        $timestamp = date('Y-m-d H:i:s');
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'UNKNOWN_IP';
        $method = $_SERVER['REQUEST_METHOD'] ?? 'CLI';
        $uri = $_SERVER['REQUEST_URI'] ?? 'N/A';

        $entry = sprintf(
            "[%s] [%s] %s %s\nException: %s: %s in %s:%d\nStack Trace:\n%s\n--------------------------------------------------\n",
            $timestamp,
            $ip,
            $method,
            $uri,
            get_class($throwable),
            $throwable->getMessage(),
            $throwable->getFile(),
            $throwable->getLine(),
            $throwable->getTraceAsString()
        );

        @file_put_contents($logFile, $entry, FILE_APPEND | LOCK_EX);
    }
}

