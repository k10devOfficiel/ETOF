<?php

declare(strict_types=1);

namespace App\Middlewares;

use App\Core\Request;
use App\Core\Response;
use App\Services\SessionService;

/**
 * Middleware d'authentification utilisateur client.
 * Vérifie qu'une session client active est présente.
 * Répond systématiquement HTTP 401 si non authentifié afin de garantir que les routes
 * d'action (soumission de devis, commandes, réservations, achats) ne peuvent être contournées.
 */
final class UserAuthMiddleware
{
    private const USER_INACTIVITY_TIMEOUT = 7200; // 2 heures

    /**
     * Valide la présence d'une session client active.
     */
    public function handle(Request $request): ?Response
    {
        SessionService::start();

        if (empty($_SESSION['user_id'])) {
            return Response::error(
                'UNAUTHORIZED',
                'Connectez-vous ou créez un compte pour envoyer votre demande.',
                401
            );
        }

        // Contrôle d'expiration d'inactivité
        $lastActivity = (int) ($_SESSION['user_last_activity'] ?? 0);
        if ($lastActivity > 0 && (time() - $lastActivity) > self::USER_INACTIVITY_TIMEOUT) {
            unset($_SESSION['user_id'], $_SESSION['user_email'], $_SESSION['user_last_activity']);
            return Response::error(
                'UNAUTHORIZED',
                'Votre session a expiré après inactivité. Veuillez vous reconnecter.',
                401
            );
        }

        $_SESSION['user_last_activity'] = time();

        return null;
    }
}
