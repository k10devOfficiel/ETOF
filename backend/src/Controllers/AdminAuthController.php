<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use App\Services\RateLimiter;
use App\Services\SessionService;
use PDO;

/**
 * Contrôleur d'authentification administrateur, session sécurisée et jetons CSRF.
 */
final class AdminAuthController
{
    /**
     * Délivre le jeton CSRF de la session courante (GET /api/admin/csrf).
     */
    public function csrf(Request $request): Response
    {
        return Response::success([
            'csrf_token' => SessionService::getCsrfToken(),
        ]);
    }

    /**
     * Authentifie un administrateur avec limitation stricte des tentatives (POST /api/admin/login).
     */
    public function login(Request $request): Response
    {
        $ip = $request->getClientIp();
        $body = $request->getBody();

        $email = strtolower(trim((string) ($body['email'] ?? '')));
        $password = (string) ($body['password'] ?? '');

        $emailHash = hash('sha256', $email);
        $actionIp = 'admin_login_ip';
        $actionEmail = 'admin_login_email_' . $emailHash;

        // Contrôle de limitation : 5 échecs en 15 minutes par IP et par e-mail
        $ipAllowed = RateLimiter::check($ip, $actionIp, 5, 15);
        $emailAllowed = RateLimiter::check($ip, $actionEmail, 5, 15);

        if (!$ipAllowed || !$emailAllowed) {
            return RateLimiter::createTooManyRequestsResponse(900);
        }

        // Si l'e-mail ou le mot de passe est absent, incrémenter et renvoyer le message générique
        if ($email === '' || $password === '') {
            RateLimiter::hit($ip, $actionIp);
            RateLimiter::hit($ip, $actionEmail);
            return Response::error('INVALID_CREDENTIALS', 'Identifiants de connexion invalides.', 401);
        }

        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT id, email, password_hash, name, last_login_at FROM admins WHERE email = :email LIMIT 1");
        $stmt->bindValue(':email', $email, PDO::PARAM_STR);
        $stmt->execute();
        $admin = $stmt->fetch();

        // Message générique ne révélant pas si l'e-mail existe
        if ($admin === false || !password_verify($password, (string) $admin['password_hash'])) {
            RateLimiter::hit($ip, $actionIp);
            RateLimiter::hit($ip, $actionEmail);
            return Response::error('INVALID_CREDENTIALS', 'Identifiants de connexion invalides.', 401);
        }

        // Connexion réussie : démarrage et régénération sécurisée de session
        SessionService::start();
        SessionService::regenerate();

        $_SESSION['admin_id'] = (int) $admin['id'];
        $_SESSION['admin_email'] = (string) $admin['email'];
        $_SESSION['admin_name'] = (string) $admin['name'];
        $_SESSION['last_activity'] = time();

        // Mise à jour de la date de dernière connexion
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
     */
    public function me(Request $request): Response
    {
        SessionService::start();
        $adminId = (int) ($_SESSION['admin_id'] ?? 0);

        if ($adminId <= 0) {
            return Response::error('UNAUTHORIZED', 'Authentification requise.', 401);
        }

        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT id, email, name, last_login_at, created_at FROM admins WHERE id = :id LIMIT 1");
        $stmt->bindValue(':id', $adminId, PDO::PARAM_INT);
        $stmt->execute();
        $admin = $stmt->fetch();

        if ($admin === false) {
            SessionService::destroy();
            return Response::error('UNAUTHORIZED', 'Compte administrateur introuvable.', 401);
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
}

