<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use App\Services\SessionService;
use PDO;

/**
 * Contrôleur de gestion du profil administrateur et de mise à jour du mot de passe.
 */
final class AdminProfileController
{
    /**
     * Met à jour le mot de passe de l'administrateur connecté (PUT /api/admin/profile/password).
     * Exige la vérification du mot de passe actuel et une longueur minimale de 12 caractères.
     */
    public function updatePassword(Request $request): Response
    {
        SessionService::start();
        $adminId = (int) ($_SESSION['admin_id'] ?? 0);

        if ($adminId <= 0) {
            return Response::error('UNAUTHORIZED', 'Authentification requise.', 401);
        }

        $body = $request->getBody();
        $currentPassword = (string) ($body['current_password'] ?? '');
        $newPassword = (string) ($body['new_password'] ?? '');
        $newPasswordConfirmation = (string) ($body['new_password_confirmation'] ?? ($body['confirm_password'] ?? ''));

        $errors = [];

        if ($currentPassword === '') {
            $errors['current_password'] = 'Le mot de passe actuel est requis.';
        }

        if ($newPassword === '') {
            $errors['new_password'] = 'Le nouveau mot de passe est requis.';
        } elseif (mb_strlen($newPassword) < 12) {
            $errors['new_password'] = 'Le nouveau mot de passe doit comporter au moins 12 caractères.';
        }

        if ($newPassword !== '' && $newPasswordConfirmation === '') {
            $errors['new_password_confirmation'] = 'Veuillez confirmer le nouveau mot de passe.';
        } elseif ($newPassword !== '' && $newPassword !== $newPasswordConfirmation) {
            $errors['new_password_confirmation'] = 'La confirmation ne correspond pas au nouveau mot de passe.';
        }

        if (!empty($errors)) {
            return Response::error('VALIDATION_FAILED', 'Données de formulaire invalides.', 422, $errors);
        }

        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("SELECT id, email, password_hash FROM admins WHERE id = :id LIMIT 1");
        $stmt->bindValue(':id', $adminId, PDO::PARAM_INT);
        $stmt->execute();
        $admin = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($admin === false) {
            return Response::error('NOT_FOUND', 'Compte administrateur introuvable.', 404);
        }

        // Vérification de l'ancien mot de passe
        if (!password_verify($currentPassword, (string) $admin['password_hash'])) {
            return Response::error('INVALID_PASSWORD', 'Le mot de passe actuel est incorrect.', 422, [
                'current_password' => 'Le mot de passe actuel est incorrect.',
            ]);
        }

        // Interdire de réutiliser le même mot de passe
        if (password_verify($newPassword, (string) $admin['password_hash'])) {
            return Response::error('SAME_PASSWORD', 'Le nouveau mot de passe doit être différent de l\'actuel.', 422, [
                'new_password' => 'Le nouveau mot de passe doit être différent du mot de passe actuel.',
            ]);
        }

        // Hachage sécurisé du nouveau mot de passe
        $newHash = password_hash($newPassword, PASSWORD_DEFAULT);

        $updateStmt = $pdo->prepare("UPDATE admins SET password_hash = :hash WHERE id = :id");
        $updateStmt->bindValue(':hash', $newHash, PDO::PARAM_STR);
        $updateStmt->bindValue(':id', $adminId, PDO::PARAM_INT);
        $updateStmt->execute();

        return Response::success([
            'message' => 'Votre mot de passe a été modifié avec succès.',
        ]);
    }
}
