<?php

declare(strict_types=1);

namespace App\Core;

/**
 * Gestionnaire des réponses HTTP au format JSON standardisé.
 */
final class Response
{
    private int $statusCode;
    /**
     * @var array<string, mixed>
     */
    private array $payload;
    /**
     * @var array<string, string>
     */
    private array $headers;

    /**
     * @param array<string, mixed> $payload
     * @param array<string, string> $headers
     */
    public function __construct(int $statusCode, array $payload, array $headers = [])
    {
        $this->statusCode = $statusCode;
        $this->payload = $payload;
        $this->headers = $headers;
    }

    /**
     * Fabrique une réponse de succès : { success: true, data: ..., error: null }
     */
    public static function success(mixed $data = [], int $status = 200, array $headers = []): self
    {
        $payload = [
            'success' => true,
            'data' => $data,
            'error' => null,
        ];

        return new self($status, $payload, $headers);
    }

    /**
     * Fabrique une réponse d'erreur : { success: false, data: null, error: { code, message, fields } }
     *
     * @param array<string, mixed>|null $fields
     */
    public static function error(
        string $code,
        string $message,
        int $status = 400,
        ?array $fields = null,
        array $headers = []
    ): self {
        $error = [
            'code' => $code,
            'message' => $message,
        ];

        if ($fields !== null && !empty($fields)) {
            $error['fields'] = $fields;
        }

        $payload = [
            'success' => false,
            'data' => null,
            'error' => $error,
        ];

        return new self($status, $payload, $headers);
    }

    /**
     * Retourne le code HTTP de la réponse.
     */
    public function getStatusCode(): int
    {
        return $this->statusCode;
    }

    /**
     * Retourne les en-têtes HTTP de la réponse.
     *
     * @return array<string, string>
     */
    public function getHeaders(): array
    {
        return $this->headers;
    }

    /**
     * Retourne les données ou le contenu de la réponse (alias de getPayload).
     *
     * @return array<string, mixed>
     */
    public function getData(): array
    {
        return $this->payload;
    }

    /**
     * Retourne le corps de la réponse sous forme de tableau associatif.
     *
     * @return array<string, mixed>
     */
    public function getPayload(): array
    {
        return $this->payload;
    }

    /**
     * Émet les en-têtes HTTP et le corps JSON vers le client.
     */
    public function send(): void
    {
        if (!headers_sent()) {
            http_response_code($this->statusCode);
            header('Content-Type: application/json; charset=utf-8');

            // En-têtes de sécurité obligatoires
            header('X-Content-Type-Options: nosniff');
            header('X-Frame-Options: DENY');
            header('Referrer-Policy: strict-origin-when-cross-origin');
            header('Permissions-Policy: camera=(), microphone=(), geolocation=()');

            foreach ($this->headers as $name => $value) {
                header("{$name}: {$value}");
            }
        }

        echo json_encode($this->payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    }
}

