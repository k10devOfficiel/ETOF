<?php

declare(strict_types=1);

namespace App\Middlewares;

use App\Core\Request;
use App\Core\Response;
use App\Services\SessionService;

/**
 * Middleware d'authentification administrateur.
 * Vérifie la présence d'une session valide et renvoie HTTP 401 si non authentifié.
 */
final class AdminAuthMiddleware
{
    /**
     * Intercepte la requête et valide la session administrateur.
     */
    public function handle(Request $request): ?Response
    {
        SessionService::start();

        if (empty($_SESSION['admin_id'])) {
            return Response::error(
                'UNAUTHORIZED',
                'Authentification requise pour accéder à cette ressource.',
                401
            );
        }

        return null;
    }
}

