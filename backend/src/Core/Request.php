<?php

declare(strict_types=1);

namespace App\Core;

/**
 * Représente la requête HTTP entrante avec parsing JSON, gestion de la langue et détection IP sécurisée.
 */
final class Request
{
    private string $method;
    private string $path;
    /**
     * @var array<string, mixed>
     */
    private array $queryParams;
    /**
     * @var array<string, mixed>
     */
    private array $body;
    /**
     * @var array<string, string>
     */
    private array $headers;
    /**
     * @var array<string, mixed>
     */
    private array $server;
    private bool $payloadTooLarge = false;

    /**
     * @param array<string, mixed> $queryParams
     * @param array<string, mixed> $body
     * @param array<string, string> $headers
     * @param array<string, mixed> $server
     */
    public function __construct(
        string $method,
        string $path,
        array $queryParams = [],
        array $body = [],
        array $headers = [],
        array $server = [],
        bool $payloadTooLarge = false
    ) {
        $this->method = strtoupper($method);
        $this->path = '/' . trim($path, '/');
        if ($this->path !== '/' && str_ends_with($this->path, '/')) {
            $this->path = rtrim($this->path, '/');
        }
        $this->queryParams = $queryParams;
        $this->body = $body;
        $this->headers = $headers;
        $this->server = $server;
        $this->payloadTooLarge = $payloadTooLarge;
    }

    /**
     * Initialise une instance Request à partir des superglobales PHP.
     */
    public static function fromGlobals(): self
    {
        $server = $_SERVER;
        $method = $server['REQUEST_METHOD'] ?? 'GET';
        $uri = $server['REQUEST_URI'] ?? '/';
        $path = (string) parse_url($uri, PHP_URL_PATH);

        $headers = self::extractHeaders($server);
        $queryParams = $_GET;

        // Limite stricte de 200 Ko sur le corps de requête JSON
        $contentLength = (int) ($server['CONTENT_LENGTH'] ?? 0);
        $maxBytes = 200 * 1024; // 204800 octets
        if ($contentLength > $maxBytes) {
            return new self($method, $path, $queryParams, [], $headers, $server, true);
        }

        $body = [];
        $rawInput = file_get_contents('php://input');
        if ($rawInput !== false && trim($rawInput) !== '') {
            if (strlen($rawInput) > $maxBytes) {
                return new self($method, $path, $queryParams, [], $headers, $server, true);
            }

            $contentType = $headers['content-type'] ?? $server['CONTENT_TYPE'] ?? '';
            if (str_contains(strtolower($contentType), 'application/json')) {
                $decoded = json_decode($rawInput, true);
                if (is_array($decoded)) {
                    $body = $decoded;
                }
            } else {
                $body = $_POST;
            }
        } elseif (!empty($_POST)) {
            $body = $_POST;
        }

        return new self($method, $path, $queryParams, $body, $headers, $server, false);
    }

    /**
     * Indique si le corps de la requête dépasse la limite autorisée de 200 Ko.
     */
    public function isPayloadTooLarge(): bool
    {
        return $this->payloadTooLarge;
    }

    /**
     * Méthode HTTP (GET, POST, etc.)
     */
    public function getMethod(): string
    {
        return $this->method;
    }

    /**
     * Chemin de l'URI nettoyé (ex: /api/health)
     */
    public function getPath(): string
    {
        return $this->path;
    }

    /**
     * Paramètres de la Query String
     *
     * @return array<string, mixed>
     */
    public function getQueryParams(): array
    {
        return $this->queryParams;
    }

    /**
     * Récupère un paramètre de Query String spécifique.
     */
    public function getQuery(string $key, mixed $default = null): mixed
    {
        return $this->queryParams[$key] ?? $default;
    }

    /**
     * Données du corps de la requête (JSON décodé).
     *
     * @return array<string, mixed>
     */
    public function getBody(): array
    {
        return $this->body;
    }

    /**
     * Récupère un champ du body (ou de la query à défaut).
     */
    public function get(string $key, mixed $default = null): mixed
    {
        return $this->body[$key] ?? $this->queryParams[$key] ?? $default;
    }

    /**
     * Détermine la langue de la requête ('fr' ou 'en', défaut 'fr').
     */
    public function getLang(): string
    {
        $langQuery = strtolower(trim((string) ($this->queryParams['lang'] ?? '')));
        if (in_array($langQuery, ['fr', 'en'], true)) {
            return $langQuery;
        }

        $headerLang = $this->getHeader('accept-language');
        if ($headerLang !== null && str_starts_with(strtolower(trim($headerLang)), 'en')) {
            return 'en';
        }

        return 'fr';
    }

    /**
     * Récupère l'adresse IP du client en prenant en compte les proxys de confiance.
     */
    public function getClientIp(): string
    {
        $remoteAddr = (string) ($this->server['REMOTE_ADDR'] ?? '127.0.0.1');

        $trustedProxiesStr = (string) Config::get('TRUSTED_PROXIES', '127.0.0.1,::1');
        $trustedProxies = array_map('trim', explode(',', $trustedProxiesStr));

        if (in_array($remoteAddr, $trustedProxies, true)) {
            $forwarded = $this->getHeader('x-forwarded-for') ?? ($this->server['HTTP_X_FORWARDED_FOR'] ?? null);
            if ($forwarded !== null && trim($forwarded) !== '') {
                $ips = array_map('trim', explode(',', $forwarded));
                foreach ($ips as $ip) {
                    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                        return $ip;
                    }
                }
                return $ips[0];
            }

            $realIp = $this->getHeader('x-real-ip') ?? ($this->server['HTTP_X_REAL_IP'] ?? null);
            if ($realIp !== null && filter_var(trim($realIp), FILTER_VALIDATE_IP)) {
                return trim($realIp);
            }
        }

        return $remoteAddr;
    }

    /**
     * Récupère un en-tête HTTP spécifique (insensible à la casse).
     */
    public function getHeader(string $name, ?string $default = null): ?string
    {
        $normalized = strtolower(trim($name));
        return $this->headers[$normalized] ?? $default;
    }

    /**
     * Extrait l'ensemble des en-têtes de la requête.
     *
     * @param array<string, mixed> $server
     * @return array<string, string>
     */
    private static function extractHeaders(array $server): array
    {
        $headers = [];

        if (function_exists('getallheaders')) {
            $raw = getallheaders();
            if (is_array($raw)) {
                foreach ($raw as $key => $val) {
                    $headers[strtolower((string) $key)] = (string) $val;
                }
                return $headers;
            }
        }

        foreach ($server as $key => $val) {
            if (str_starts_with($key, 'HTTP_')) {
                $name = str_replace('_', '-', strtolower(substr($key, 5)));
                $headers[$name] = (string) $val;
            } elseif (in_array($key, ['CONTENT_TYPE', 'CONTENT_LENGTH'], true)) {
                $name = str_replace('_', '-', strtolower($key));
                $headers[$name] = (string) $val;
            }
        }

        return $headers;
    }
}

