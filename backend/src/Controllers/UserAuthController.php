<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use App\Services\RateLimiter;
use App\Services\SessionService;
use App\Services\UserHelper;
use PDO;

/**
 * Contrôleur d'authentification client (inscription, connexion, profil, déconnexion).
 */
final class UserAuthController
{
    private const DUMMY_HASH = '$2y$12$4L3v8u1mQ8N2y2A3b4c5dOe6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t';

    /**
     * Inscription d'un nouvel utilisateur client (POST /api/auth/register).
     */
    public function register(Request $request): Response
    {
        $ip = $request->getClientIp();
        $body = $request->getBody();

        // Limitation du nombre d'inscriptions par IP (max 10 par heure)
        if (!RateLimiter::check($ip, 'user_register', 10, 60)) {
            return RateLimiter::createTooManyRequestsResponse(3600);
        }

        $civility = (string) ($body['civility'] ?? 'none');
        if (!in_array($civility, ['mr', 'mrs', 'none'], true)) {
            $civility = 'none';
        }

        $firstName = trim((string) ($body['first_name'] ?? ''));
        $lastName = trim((string) ($body['last_name'] ?? ''));
        $email = strtolower(trim((string) ($body['email'] ?? '')));
        $phone = trim((string) ($body['phone'] ?? ''));
        $company = trim((string) ($body['company'] ?? ''));
        $password = (string) ($body['password'] ?? '');

        // Validation des champs
        $errors = [];
        if (mb_strlen($firstName) < 2 || mb_strlen($firstName) > 100) {
            $errors['first_name'] = 'Le prénom doit comporter entre 2 et 100 caractères.';
        }
        if (mb_strlen($lastName) < 2 || mb_strlen($lastName) > 100) {
            $errors['last_name'] = 'Le nom doit comporter entre 2 et 100 caractères.';
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'Adresse e-mail invalide.';
        }
        if (strlen($password) < 8) {
            $errors['password'] = 'Le mot de passe doit comporter au moins 8 caractères.';
        }

        if (!empty($errors)) {
            return Response::error('VALIDATION_FAILED', 'Données d’inscription invalides.', 422, $errors);
        }

        $pdo = Database::getConnection();

        // Vérifier si l'e-mail est déjà utilisé
        $checkStmt = $pdo->prepare("SELECT id FROM users WHERE email = :email LIMIT 1");
        $checkStmt->bindValue(':email', $email, PDO::PARAM_STR);
        $checkStmt->execute();
        if ($checkStmt->fetch() !== false) {
            return Response::error('EMAIL_ALREADY_EXISTS', 'Cette adresse e-mail est déjà associée à un compte.', 409);
        }

        $passwordHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);

        $insertStmt = $pdo->prepare("
            INSERT INTO users (civility, first_name, last_name, preferred_name, email, phone, company, password_hash)
            VALUES (:civility, :first_name, :last_name, 'first_name', :email, :phone, :company, :password_hash)
        ");
        $insertStmt->bindValue(':civility', $civility, PDO::PARAM_STR);
        $insertStmt->bindValue(':first_name', $firstName, PDO::PARAM_STR);
        $insertStmt->bindValue(':last_name', $lastName, PDO::PARAM_STR);
        $insertStmt->bindValue(':email', $email, PDO::PARAM_STR);
        $insertStmt->bindValue(':phone', $phone !== '' ? $phone : null, PDO::PARAM_STR);
        $insertStmt->bindValue(':company', $company !== '' ? $company : null, PDO::PARAM_STR);
        $insertStmt->bindValue(':password_hash', $passwordHash, PDO::PARAM_STR);
        $insertStmt->execute();

        $userId = (int) $pdo->lastInsertId();

        RateLimiter::hit($ip, 'user_register');

        // Initialisation de la session
        SessionService::start();
        SessionService::regenerate();

        $_SESSION['user_id'] = $userId;
        $_SESSION['user_email'] = $email;
        $_SESSION['user_last_activity'] = time();

        $userData = [
            'id' => $userId,
            'civility' => $civility,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'preferred_name' => 'first_name',
            'display_name' => UserHelper::displayName([
                'civility' => $civility,
                'first_name' => $firstName,
                'last_name' => $lastName,
                'preferred_name' => 'first_name',
            ], $request->getLang()),
            'email' => $email,
            'phone' => $phone,
            'company' => $company,
        ];

        return Response::success([
            'user' => $userData,
            'csrf_token' => SessionService::getCsrfToken(),
            'message' => 'Compte créé avec succès.',
        ], 201);
    }

    /**
     * Authentification utilisateur client (POST /api/auth/login).
     */
    public function login(Request $request): Response
    {
        $ip = $request->getClientIp();
        $body = $request->getBody();

        $email = strtolower(trim((string) ($body['email'] ?? '')));
        $password = (string) ($body['password'] ?? '');

        $emailHash = hash('sha256', $email);
        $actionIp = 'client_login_ip';
        $actionEmail = 'client_login_email_' . $emailHash;

        // Anti-bruteforce : 5 échecs en 15 minutes
        if (!RateLimiter::check($ip, $actionIp, 5, 15) || !RateLimiter::check($ip, $actionEmail, 5, 15)) {
            return RateLimiter::createTooManyRequestsResponse(900);
        }

        if ($email === '' || $password === '') {
            password_verify('dummy', self::DUMMY_HASH);
            RateLimiter::hit($ip, $actionIp);
            RateLimiter::hit($ip, $actionEmail);
            return Response::error('INVALID_CREDENTIALS', 'Identifiants invalides.', 401);
        }

        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("
            SELECT id, civility, first_name, last_name, preferred_name, email, phone, company, password_hash 
            FROM users 
            WHERE email = :email 
            LIMIT 1
        ");
        $stmt->bindValue(':email', $email, PDO::PARAM_STR);
        $stmt->execute();
        $user = $stmt->fetch();

        $hashToVerify = $user !== false ? (string) $user['password_hash'] : self::DUMMY_HASH;
        $isValid = password_verify($password, $hashToVerify);

        if ($user === false || !$isValid) {
            RateLimiter::hit($ip, $actionIp);
            RateLimiter::hit($ip, $actionEmail);
            return Response::error('INVALID_CREDENTIALS', 'Identifiants invalides.', 401);
        }

        SessionService::start();
        SessionService::regenerate();

        $_SESSION['user_id'] = (int) $user['id'];
        $_SESSION['user_email'] = (string) $user['email'];
        $_SESSION['user_last_activity'] = time();

        $upStmt = $pdo->prepare("UPDATE users SET last_login_at = NOW() WHERE id = :id");
        $upStmt->bindValue(':id', (int) $user['id'], PDO::PARAM_INT);
        $upStmt->execute();

        $userData = [
            'id' => (int) $user['id'],
            'civility' => (string) $user['civility'],
            'first_name' => (string) $user['first_name'],
            'last_name' => (string) $user['last_name'],
            'preferred_name' => (string) $user['preferred_name'],
            'display_name' => UserHelper::displayName($user, $request->getLang()),
            'email' => (string) $user['email'],
            'phone' => (string) ($user['phone'] ?? ''),
            'company' => (string) ($user['company'] ?? ''),
        ];

        return Response::success([
            'user' => $userData,
            'csrf_token' => SessionService::getCsrfToken(),
            'message' => 'Connexion réussie.',
        ]);
    }

    /**
     * Profil de l'utilisateur connecté (GET /api/auth/me).
     */
    public function me(Request $request): Response
    {
        SessionService::start();
        $userId = (int) ($_SESSION['user_id'] ?? 0);

        if ($userId <= 0) {
            return Response::error('UNAUTHORIZED', 'Aucune session active.', 401);
        }

        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("
            SELECT id, civility, first_name, last_name, preferred_name, email, phone, company, created_at 
            FROM users 
            WHERE id = :id 
            LIMIT 1
        ");
        $stmt->bindValue(':id', $userId, PDO::PARAM_INT);
        $stmt->execute();
        $user = $stmt->fetch();

        if ($user === false) {
            unset($_SESSION['user_id'], $_SESSION['user_email']);
            return Response::error('UNAUTHORIZED', 'Compte utilisateur introuvable.', 401);
        }

        $userData = [
            'id' => (int) $user['id'],
            'civility' => (string) $user['civility'],
            'first_name' => (string) $user['first_name'],
            'last_name' => (string) $user['last_name'],
            'preferred_name' => (string) $user['preferred_name'],
            'display_name' => UserHelper::displayName($user, $request->getLang()),
            'email' => (string) $user['email'],
            'phone' => (string) ($user['phone'] ?? ''),
            'company' => (string) ($user['company'] ?? ''),
            'created_at' => (string) $user['created_at'],
        ];

        return Response::success([
            'user' => $userData,
            'csrf_token' => SessionService::getCsrfToken(),
        ]);
    }

    /**
     * Mise à jour du profil utilisateur (PUT /api/auth/profile).
     */
    public function updateProfile(Request $request): Response
    {
        SessionService::start();
        $userId = (int) ($_SESSION['user_id'] ?? 0);

        if ($userId <= 0) {
            return Response::error('UNAUTHORIZED', 'Authentification requise.', 401);
        }

        $body = $request->getBody();

        $civility = (string) ($body['civility'] ?? 'none');
        if (!in_array($civility, ['mr', 'mrs', 'none'], true)) {
            $civility = 'none';
        }

        $preferredName = (string) ($body['preferred_name'] ?? 'first_name');
        if (!in_array($preferredName, ['first_name', 'last_name'], true)) {
            $preferredName = 'first_name';
        }

        $firstName = trim((string) ($body['first_name'] ?? ''));
        $lastName = trim((string) ($body['last_name'] ?? ''));
        $phone = trim((string) ($body['phone'] ?? ''));
        $company = trim((string) ($body['company'] ?? ''));

        if (mb_strlen($firstName) < 2 || mb_strlen($firstName) > 100) {
            return Response::error('VALIDATION_FAILED', 'Prénom invalide (2 à 100 caractères).', 422);
        }
        if (mb_strlen($lastName) < 2 || mb_strlen($lastName) > 100) {
            return Response::error('VALIDATION_FAILED', 'Nom invalide (2 à 100 caractères).', 422);
        }

        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("
            UPDATE users 
            SET civility = :civility, 
                first_name = :first_name, 
                last_name = :last_name, 
                preferred_name = :preferred_name, 
                phone = :phone, 
                company = :company 
            WHERE id = :id
        ");
        $stmt->bindValue(':civility', $civility, PDO::PARAM_STR);
        $stmt->bindValue(':first_name', $firstName, PDO::PARAM_STR);
        $stmt->bindValue(':last_name', $lastName, PDO::PARAM_STR);
        $stmt->bindValue(':preferred_name', $preferredName, PDO::PARAM_STR);
        $stmt->bindValue(':phone', $phone !== '' ? $phone : null, PDO::PARAM_STR);
        $stmt->bindValue(':company', $company !== '' ? $company : null, PDO::PARAM_STR);
        $stmt->bindValue(':id', $userId, PDO::PARAM_INT);
        $stmt->execute();

        return $this->me($request);
    }

    /**
     * Déconnexion utilisateur client (POST /api/auth/logout).
     */
    public function logout(Request $request): Response
    {
        SessionService::start();
        unset($_SESSION['user_id'], $_SESSION['user_email'], $_SESSION['user_last_activity']);
        SessionService::regenerate();

        return Response::success([
            'message' => 'Déconnexion réussie.',
        ]);
    }

    /**
     * Liste des demandes de l'utilisateur connecté (GET /api/auth/requests).
     */
    public function requests(Request $request): Response
    {
        SessionService::start();
        $userId = (int) ($_SESSION['user_id'] ?? 0);

        if ($userId <= 0) {
            return Response::error('UNAUTHORIZED', 'Authentification requise.', 401);
        }

        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("
            SELECT r.id, r.reference, r.type, r.activity, r.status, r.created_at, r.message,
                   v.brand AS vehicle_brand, v.model AS vehicle_model,
                   (SELECT COUNT(*) FROM request_items ri WHERE ri.request_id = r.id) AS items_count
            FROM requests r
            LEFT JOIN vehicles v ON r.vehicle_id = v.id
            WHERE r.user_id = :user_id OR r.email = :email
            ORDER BY r.created_at DESC
        ");
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':email', (string) ($_SESSION['user_email'] ?? ''), PDO::PARAM_STR);
        $stmt->execute();
        $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return Response::success([
            'items' => $requests,
        ]);
    }
}

