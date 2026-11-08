<?php

declare(strict_types=1);

namespace App\Core;

use Closure;
use Exception;

/**
 * Routeur HTTP minimaliste supportant les paramètres dynamiques, groupes de routes et middlewares.
 */
final class Router
{
    /**
     * @var array<int, array{
     *     method: string,
     *     pattern: string,
     *     rawPath: string,
     *     handler: callable|array,
     *     middlewares: array<callable|string>
     * }>
     */
    private array $routes = [];

    private string $groupPrefix = '';
    /**
     * @var array<callable|string>
     */
    private array $groupMiddlewares = [];

    /**
     * Enregistre une route GET.
     */
    public function get(string $path, callable|array $handler, array $middlewares = []): self
    {
        return $this->add('GET', $path, $handler, $middlewares);
    }

    /**
     * Enregistre une route POST.
     */
    public function post(string $path, callable|array $handler, array $middlewares = []): self
    {
        return $this->add('POST', $path, $handler, $middlewares);
    }

    /**
     * Enregistre une route PUT.
     */
    public function put(string $path, callable|array $handler, array $middlewares = []): self
    {
        return $this->add('PUT', $path, $handler, $middlewares);
    }

    /**
     * Enregistre une route PATCH.
     */
    public function patch(string $path, callable|array $handler, array $middlewares = []): self
    {
        return $this->add('PATCH', $path, $handler, $middlewares);
    }

    /**
     * Enregistre une route DELETE.
     */
    public function delete(string $path, callable|array $handler, array $middlewares = []): self
    {
        return $this->add('DELETE', $path, $handler, $middlewares);
    }

    /**
     * Enregistre une route OPTIONS.
     */
    public function options(string $path, callable|array $handler, array $middlewares = []): self
    {
        return $this->add('OPTIONS', $path, $handler, $middlewares);
    }

    /**
     * Enregistre une route avec méthode, chemin, gestionnaire et middlewares.
     */
    public function add(string $method, string $path, callable|array $handler, array $middlewares = []): self
    {
        $fullPath = '/' . trim($this->groupPrefix . '/' . trim($path, '/'), '/');
        if ($fullPath !== '/' && str_ends_with($fullPath, '/')) {
            $fullPath = rtrim($fullPath, '/');
        }

        $allMiddlewares = array_merge($this->groupMiddlewares, $middlewares);

        $pattern = $this->compilePattern($fullPath);

        $this->routes[] = [
            'method' => strtoupper($method),
            'pattern' => $pattern,
            'rawPath' => $fullPath,
            'handler' => $handler,
            'middlewares' => $allMiddlewares,
        ];

        return $this;
    }

    /**
     * Définit un groupe de routes partageant un préfixe et des middlewares communs.
     */
    public function group(string $prefix, callable $callback, array $middlewares = []): void
    {
        $previousPrefix = $this->groupPrefix;
        $previousMiddlewares = $this->groupMiddlewares;

        $this->groupPrefix = '/' . trim($previousPrefix . '/' . trim($prefix, '/'), '/');
        $this->groupMiddlewares = array_merge($previousMiddlewares, $middlewares);

        $callback($this);

        $this->groupPrefix = $previousPrefix;
        $this->groupMiddlewares = $previousMiddlewares;
    }

    /**
     * Exécute la résolution de la route pour la requête fournie.
     */
    public function dispatch(Request $request): Response
    {
        $requestMethod = $request->getMethod();
        $requestPath = $request->getPath();

        $matchedMethod = false;

        foreach ($this->routes as $route) {
            if (!preg_match($route['pattern'], $requestPath, $matches)) {
                continue;
            }

            if ($route['method'] !== $requestMethod) {
                $matchedMethod = true;
                continue;
            }

            // Extraction des paramètres nommés de la route ({id}, {slug}, etc.)
            $params = [];
            foreach ($matches as $key => $value) {
                if (is_string($key)) {
                    $params[$key] = $value;
                }
            }

            // Exécution des middlewares
            foreach ($route['middlewares'] as $middleware) {
                $res = $this->executeMiddleware($middleware, $request);
                if ($res instanceof Response) {
                    return $res;
                }
            }

            // Exécution du gestionnaire de la route
            return $this->executeHandler($route['handler'], $request, $params);
        }

        if ($matchedMethod) {
            return Response::error('METHOD_NOT_ALLOWED', "Méthode {$requestMethod} non autorisée pour cette ressource", 405);
        }

        return Response::error('NOT_FOUND', "La ressource '{$requestPath}' n'existe pas", 404);
    }

    /**
     * Transforme un motif de route en expression régulière (gère {id}, {slug} et {param}).
     */
    private function compilePattern(string $path): string
    {
        // Remplace {id} par une capture numérique
        $pattern = preg_replace('/\{id\}/', '(?P<id>[0-9]+)', $path);
        // Remplace {slug} par une capture de slug
        $pattern = preg_replace('/\{slug\}/', '(?P<slug>[a-zA-Z0-9\-_]+)', (string) $pattern);
        // Remplace tout autre {param} par capture générale
        $pattern = preg_replace('/\{([a-zA-Z0-9_]+)\}/', '(?P<$1>[^/]+)', (string) $pattern);

        return '#^' . $pattern . '$#u';
    }

    /**
     * Exécute un middleware (callable ou classe avec méthode handle).
     */
    private function executeMiddleware(callable|string $middleware, Request $request): ?Response
    {
        if (is_callable($middleware)) {
            return $middleware($request);
        }

        if (is_string($middleware) && class_exists($middleware)) {
            $instance = new $middleware();
            if (method_exists($instance, 'handle')) {
                return $instance->handle($request);
            }
        }

        return null;
    }

    /**
     * Exécute le contrôleur ou le callable associé à la route.
     *
     * @param array<string, string> $params
     */
    private function executeHandler(callable|array $handler, Request $request, array $params): Response
    {
        if (is_callable($handler)) {
            $result = $handler($request, $params);
            if ($result instanceof Response) {
                return $result;
            }
            return Response::success($result);
        }

        if (is_array($handler) && count($handler) === 2) {
            [$class, $method] = $handler;
            if (is_string($class) && class_exists($class)) {
                $controller = new $class();
                if (method_exists($controller, $method)) {
                    $result = $controller->$method($request, $params);
                    if ($result instanceof Response) {
                        return $result;
                    }
                    return Response::success($result);
                }
            }
        }

        throw new Exception("Gestionnaire de route invalide");
    }
}

