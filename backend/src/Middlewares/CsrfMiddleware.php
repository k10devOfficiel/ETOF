<?php

declare(strict_types=1);

namespace App\Middlewares;

use App\Core\Request;
use App\Core\Response;
use App\Services\SessionService;

/**
 * Middleware de validation du jeton CSRF sur les requêtes d'action (POST, PUT, PATCH, DELETE).
 */
final class CsrfMiddleware
{
    /**
     * Valide l'en-tête X-CSRF-Token sur les requêtes modifiant l'état sous /api/admin.
     */
    public function handle(Request $request): ?Response
    {
        $method = $request->getMethod();
        if (!in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
            return null;
        }

        $path = $request->getPath();
        $token = $request->getHeader('x-csrf-token');

        // Pour la connexion initiale, si le jeton est transmis il est vérifié, sinon toléré
        if ($path === '/api/admin/login') {
            if ($token !== null && $token !== '' && !SessionService::validateCsrfToken($token)) {
                return Response::error(
                    'CSRF_TOKEN_INVALID',
                    'Jeton CSRF invalide.',
                    403
                );
            }
            return null;
        }

        if (!SessionService::validateCsrfToken($token)) {
            return Response::error(
                'CSRF_TOKEN_INVALID',
                'Jeton CSRF manquant ou invalide. Veuillez fournir un jeton valide dans l\'en-tête X-CSRF-Token.',
                403
            );
        }

        return null;
    }
}
