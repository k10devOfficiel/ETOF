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

        // 1. Limitation de débit : 30 envois par 10 minutes par empreinte IP
        if (!RateLimiter::check($ip, 'create_request', 30, 10)) {
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
                'id' => $result['id'] ?? null,
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

    /**
     * Annule et supprime une commande côté client (POST /api/requests/cancel).
     * Supprime aussitôt la commande de la base (visible côté admin)
     * tout en permettant au frontend de conserver le panier garni.
     */
    public function cancel(Request $request): Response
    {
        $body = $request->getBody();
        $reference = trim((string) ($body['reference'] ?? ''));
        $id = !empty($body['id']) ? (int) $body['id'] : null;

        if ($reference === '' && $id === null) {
            return Response::error('MISSING_IDENTIFIER', 'Référence ou ID de commande manquant.', 422);
        }

        \App\Services\SessionService::start();
        $currentUserId = !empty($_SESSION['user_id']) ? (int) $_SESSION['user_id'] : null;

        $pdo = \App\Core\Database::getConnection();

        if ($id !== null) {
            $stmt = $pdo->prepare("SELECT id, reference, user_id FROM requests WHERE id = :id LIMIT 1");
            $stmt->bindValue(':id', $id, \PDO::PARAM_INT);
        } else {
            $stmt = $pdo->prepare("SELECT id, reference, user_id FROM requests WHERE reference = :ref LIMIT 1");
            $stmt->bindValue(':ref', $reference, \PDO::PARAM_STR);
        }
        $stmt->execute();
        $req = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$req) {
            return Response::error('NOT_FOUND', 'Commande introuvable ou déjà annulée.', 404);
        }

        // Contrôle de propriété si utilisateur connecté
        if ($currentUserId !== null && $req['user_id'] !== null && (int) $req['user_id'] !== $currentUserId) {
            return Response::error('FORBIDDEN', 'Vous n’êtes pas autorisé à modifier cette commande.', 403);
        }

        $targetId = (int) $req['id'];
        $targetRef = (string) $req['reference'];

        $pdo->beginTransaction();
        try {
            // Suppression des items associés
            $delItems = $pdo->prepare("DELETE FROM request_items WHERE request_id = :rid");
            $delItems->bindValue(':rid', $targetId, \PDO::PARAM_INT);
            $delItems->execute();

            // Suppression de la demande
            $delReq = $pdo->prepare("DELETE FROM requests WHERE id = :rid");
            $delReq->bindValue(':rid', $targetId, \PDO::PARAM_INT);
            $delReq->execute();

            $pdo->commit();

            return Response::success([
                'deleted' => true,
                'reference' => $targetRef,
                'message' => "La commande {$targetRef} a été annulée et supprimée avec succès.",
            ]);
        } catch (\Throwable $e) {
            $pdo->rollBack();
            return Response::error('CANCEL_ERROR', 'Impossible de supprimer la commande : ' . $e->getMessage(), 500);
        }
    }
}

