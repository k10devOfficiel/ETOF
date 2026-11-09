<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Config;
use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use App\Services\RateLimiter;
use App\Services\SessionService;
use App\Services\TotpService;
use PDO;

/**
 * Contrôleur d'authentification administrateur hautement sécurisé.
 * Protection stricte contre le brute-force, protection contre l'énumération par timing constant,
 * requêtes préparées PDO, régénération de session et conformité 404 par défaut.
 */
final class AdminAuthController
{
    /**
     * Hash bcrypt factice pré-calculé (coût 12) utilisé pour neutraliser les attaques par analyse temporelle.
     */
    private const DUMMY_HASH = '$2y$12$4L3v8u1mQ8N2y2A3b4c5dOe6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t';

    /**
     * Délivre le jeton CSRF de la session courante (GET /api/admin/csrf).
     */
    public function csrf(Request $request): Response
    {
        $this->enforceIpWhitelist($request);

        return Response::success([
            'csrf_token' => SessionService::getCsrfToken(),
        ]);
    }

    /**
     * Authentifie un administrateur avec limitation stricte des tentatives (POST /api/admin/login).
     */
    public function login(Request $request): Response
    {
        $this->enforceIpWhitelist($request);

        $ip = $request->getClientIp();
        $body = $request->getBody();

        $email = strtolower(trim((string) ($body['email'] ?? '')));
        $password = (string) ($body['password'] ?? '');
        $totpCode = trim((string) ($body['totp_code'] ?? ''));

        $emailHash = hash('sha256', $email);
        $actionIp = 'admin_login_ip';
        $actionEmail = 'admin_login_email_' . $emailHash;

        // Contrôle anti-bruteforce strict : 5 échecs en 15 minutes par IP et par compte
        $ipAllowed = RateLimiter::check($ip, $actionIp, 5, 15);
        $emailAllowed = RateLimiter::check($ip, $actionEmail, 5, 15);

        if (!$ipAllowed || !$emailAllowed) {
            return RateLimiter::createTooManyRequestsResponse(900);
        }

        // Si l'e-mail ou le mot de passe est vide, exécuter un hachage factice pour égaliser le temps
        if ($email === '' || $password === '') {
            password_verify('dummy_pass', self::DUMMY_HASH);
            RateLimiter::hit($ip, $actionIp);
            RateLimiter::hit($ip, $actionEmail);
            return Response::error('INVALID_CREDENTIALS', 'Identifiants invalides.', 401);
        }

        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT id, email, password_hash, name, last_login_at FROM admins WHERE email = :email LIMIT 1");
        $stmt->bindValue(':email', $email, PDO::PARAM_STR);
        $stmt->execute();
        $admin = $stmt->fetch();

        // Si l'utilisateur n'existe pas, exécuter password_verify sur le hash factice pour un temps de réponse identique
        $hashToVerify = $admin !== false ? (string) $admin['password_hash'] : self::DUMMY_HASH;
        $passwordValid = password_verify($password, $hashToVerify);

        if ($admin === false || !$passwordValid) {
            RateLimiter::hit($ip, $actionIp);
            RateLimiter::hit($ip, $actionEmail);
            return Response::error('INVALID_CREDENTIALS', 'Identifiants invalides.', 401);
        }

        // Vérification 2FA TOTP optionnelle si activée dans l'environnement
        $is2FaEnforced = (bool) Config::get('ADMIN_2FA_ENABLED', false);
        $globalTotpSecret = (string) Config::get('ADMIN_2FA_SECRET', '');

        if ($is2FaEnforced && $globalTotpSecret !== '') {
            if ($totpCode === '' || !TotpService::verify($globalTotpSecret, $totpCode)) {
                RateLimiter::hit($ip, $actionIp);
                RateLimiter::hit($ip, $actionEmail);
                return Response::error('INVALID_CREDENTIALS', 'Identifiants invalides.', 401);
            }
        }

        // Connexion réussie : réinitialisation de session et régénération sécurisée de l'ID
        SessionService::start();
        SessionService::regenerate();

        $_SESSION['admin_id'] = (int) $admin['id'];
        $_SESSION['admin_email'] = (string) $admin['email'];
        $_SESSION['admin_name'] = (string) $admin['name'];
        $_SESSION['last_activity'] = time();

        // Mise à jour de la date de dernière connexion avec requête préparée
        $upStmt = $pdo->prepare("UPDATE admins SET last_login_at = NOW() WHERE id = :id");
        $upStmt->bindValue(':id', (int) $admin['id'], PDO::PARAM_INT);
        $upStmt->execute();

        return Response::success([
            'admin' => [
                'id' => (int) $admin['id'],
                'email' => (string) $admin['email'],
                'name' => (string) $admin['name'],
            ],
            'csrf_token' => SessionService::getCsrfToken(),
            'message' => 'Connexion réussie.',
        ]);
    }

    /**
     * Déconnecte l'administrateur et détruit la session (POST /api/admin/logout).
     */
    public function logout(Request $request): Response
    {
        SessionService::destroy();

        return Response::success([
            'message' => 'Déconnexion effectuée avec succès.',
        ]);
    }

    /**
     * Renvoie le profil de l'administrateur actuellement connecté (GET /api/admin/me).
     * Renvoie HTTP 404 si non authentifié afin de ne pas divulguer l'existence de l'administration.
     */
    public function me(Request $request): Response
    {
        $this->enforceIpWhitelist($request);

        SessionService::start();
        $adminId = (int) ($_SESSION['admin_id'] ?? 0);

        if ($adminId <= 0) {
            return Response::error('NOT_FOUND', 'Ressource introuvable.', 404);
        }

        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT id, email, name, last_login_at, created_at FROM admins WHERE id = :id LIMIT 1");
        $stmt->bindValue(':id', $adminId, PDO::PARAM_INT);
        $stmt->execute();
        $admin = $stmt->fetch();

        if ($admin === false) {
            SessionService::destroy();
            return Response::error('NOT_FOUND', 'Ressource introuvable.', 404);
        }

        return Response::success([
            'admin' => [
                'id' => (int) $admin['id'],
                'email' => (string) $admin['email'],
                'name' => (string) $admin['name'],
                'last_login_at' => $admin['last_login_at'],
                'created_at' => $admin['created_at'],
            ],
            'csrf_token' => SessionService::getCsrfToken(),
        ]);
    }

    /**
     * Bloque l'accès si une liste blanche d'IP est définie et ne correspond pas au client.
     */
    private function enforceIpWhitelist(Request $request): void
    {
        $allowedIpsRaw = (string) Config::get('ADMIN_ALLOWED_IPS', '');
        if ($allowedIpsRaw !== '') {
            $allowedIps = array_filter(array_map('trim', explode(',', $allowedIpsRaw)));
            $clientIp = $request->getClientIp();

            if (!in_array($clientIp, $allowedIps, true)) {
                Response::error('NOT_FOUND', 'Ressource introuvable.', 404)->send();
                exit;
            }
        }
    }
}
