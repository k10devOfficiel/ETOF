<?php

declare(strict_types=1);

namespace App\Middlewares;

use App\Core\Config;
use App\Core\Request;
use App\Core\Response;
use App\Services\SessionService;

/**
 * Middleware d'authentification administrateur hautement sécurisé.
 * Renvoie systématiquement HTTP 404 (et non 401) si aucune session n'est valide ou si
 * l'adresse IP cliente ne figure pas dans la liste blanche (ADMIN_ALLOWED_IPS), afin de
 * ne donner aucun indice public sur l'existence ou la localisation des endpoints d'administration.
 */
final class AdminAuthMiddleware
{
    private const INACTIVITY_TIMEOUT = 7200; // 2 heures en secondes

    /**
     * Intercepte la requête et valide la session administrateur ainsi que l'IP autorisée.
     */
    public function handle(Request $request): ?Response
    {
        // 1. Contrôle de liste blanche d'adresses IP si configurée dans .env
        $allowedIpsRaw = (string) Config::get('ADMIN_ALLOWED_IPS', '');
        if ($allowedIpsRaw !== '') {
            $allowedIps = array_filter(array_map('trim', explode(',', $allowedIpsRaw)));
            $clientIp = $request->getClientIp();

            if (!in_array($clientIp, $allowedIps, true)) {
                return Response::error('NOT_FOUND', 'Ressource introuvable.', 404);
            }
        }

        // 2. Initialisation sécurisée de la session
        SessionService::start();

        // 3. Vérification de l'identifiant administrateur (renvoie 404 si non authentifié)
        if (empty($_SESSION['admin_id'])) {
            return Response::error('NOT_FOUND', 'Ressource introuvable.', 404);
        }

        // 4. Contrôle d'expiration par inactivité (2 heures max)
        $lastActivity = (int) ($_SESSION['last_activity'] ?? 0);
        if ($lastActivity > 0 && (time() - $lastActivity) > self::INACTIVITY_TIMEOUT) {
            SessionService::destroy();
            return Response::error('NOT_FOUND', 'Ressource introuvable.', 404);
        }

        // Mise à jour de l'horodatage de dernière activité
        $_SESSION['last_activity'] = time();

        return null;
    }
}
