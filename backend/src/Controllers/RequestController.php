<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Services\AntiSpam;
use App\Services\RateLimiter;
use App\Services\RequestService;
use App\Services\ValidationException;
use Throwable;

/**
 * Contrôleur des demandes client unifiées (devis, commandes, réservations, achats, contacts).
 */
final class RequestController
{
    /**
     * Traite la soumission d'une nouvelle demande (POST /api/requests).
     */
    public function store(Request $request): Response
    {
        $ip = $request->getClientIp();
        $body = $request->getBody();

        // 1. Limitation de débit : 5 envois par 10 minutes par empreinte IP
        if (!RateLimiter::check($ip, 'create_request', 5, 10)) {
            return RateLimiter::createTooManyRequestsResponse(600);
        }

        // 2. Piège Honeypot (champ 'website') : rejet silencieux pour tromper les robots
        if (AntiSpam::isHoneypotTriggered($body, 'website')) {
            return AntiSpam::fakeSuccessResponse();
        }

        // 3. Validation Cloudflare Turnstile optionnelle
        $turnstileToken = isset($body['turnstile_token']) ? (string) $body['turnstile_token'] : null;
        if (!AntiSpam::verifyTurnstile($turnstileToken, $ip)) {
            return Response::error(
                'TURNSTILE_FAILED',
                'La vérification anti-robot a échoué. Veuillez recharger la page et réessayer.',
                422
            );
        }

        // 4. Traitement métier via RequestService
        try {
            $result = RequestService::createRequest($body, $ip);

            // Incrémente le compteur de débit après soumission réussie
            RateLimiter::hit($ip, 'create_request');

            return Response::success([
                'reference' => $result['reference'],
                'message' => 'Votre demande a été enregistrée avec succès sous la référence ' . $result['reference'] . '.',
                'created_at' => $result['created_at'],
            ], 201);
        } catch (ValidationException $e) {
            return Response::error('VALIDATION_FAILED', $e->getMessage(), 422, $e->getFields());
        } catch (Throwable $e) {
            return Response::error('REQUEST_PROCESSING_ERROR', $e->getMessage(), 500);
        }
    }
}

