<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use PDO;

/**
 * Contrôleur d'administration des réglages institutionnels de l'entreprise (GET et PUT /api/admin/settings).
 */
final class AdminSettingsController
{
    /**
     * Liste des clés de réglages autorisées et gérées.
     *
     * @var list<string>
     */
    private const ALLOWED_KEYS = [
        'phone',
        'whatsapp',
        'email',
        'address',
        'facebook',
        'instagram',
        'linkedin',
        'opening_hours',
    ];

    /**
     * Récupère la liste complète des réglages (GET /api/admin/settings).
     */
    public function index(Request $request): Response
    {
        $pdo = Database::getConnection();

        $placeholders = implode(',', array_fill(0, count(self::ALLOWED_KEYS), '?'));
        $sql = "SELECT setting_key, setting_value FROM settings WHERE setting_key IN ({$placeholders})";

        $stmt = $pdo->prepare($sql);
        foreach (self::ALLOWED_KEYS as $index => $key) {
            $stmt->bindValue($index + 1, $key, PDO::PARAM_STR);
        }
        $stmt->execute();

        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Initialisation avec des valeurs vides par défaut
        $settings = array_fill_keys(self::ALLOWED_KEYS, '');

        foreach ($rows as $row) {
            $k = (string) $row['setting_key'];
            if (array_key_exists($k, $settings)) {
                $settings[$k] = (string) ($row['setting_value'] ?? '');
            }
        }

        return Response::success($settings);
    }

    /**
     * Met à jour les réglages de l'entreprise (PUT /api/admin/settings).
     * Effectue une validation rigoureuse des formats (téléphone, URL, email) et proscrit tout script ou balise HTML.
     */
    public function update(Request $request): Response
    {
        $body = $request->getBody();
        $errors = [];

        // 1. Détection stricte d'injections de scripts ou balises HTML
        foreach ($body as $field => $val) {
            if (is_string($val)) {
                if (preg_match('/<script\b[^>]*>(.*?)<\/script>/is', $val) || preg_match('/<[^>]+>/', $val) || stripos($val, 'javascript:') !== false) {
                    $errors[$field] = 'Aucun script ou balise HTML n\'est autorisé.';
                }
            }
        }

        if (!empty($errors)) {
            return Response::error('VALIDATION_FAILED', 'Données de formulaire invalides.', 422, $errors);
        }

        // 2. Extraction et validation champ par champ
        $phone = trim((string) ($body['phone'] ?? ''));
        $whatsapp = trim((string) ($body['whatsapp'] ?? ''));
        $email = trim((string) ($body['email'] ?? ''));
        $address = trim((string) ($body['address'] ?? ''));
        $facebook = trim((string) ($body['facebook'] ?? ''));
        $instagram = trim((string) ($body['instagram'] ?? ''));
        $linkedin = trim((string) ($body['linkedin'] ?? ''));
        $openingHours = trim((string) ($body['opening_hours'] ?? ''));

        // Téléphone standard
        if ($phone !== '' && !preg_match('/^(\+?[0-9\s\-\.\(\)]{6,30})$/', $phone)) {
            $errors['phone'] = 'Format de numéro de téléphone invalide (ex: +225 07 00 00 00).';
        }

        // WhatsApp (format international avec ou sans indicatif explicite, chiffres et espaces)
        if ($whatsapp !== '') {
            $digitsOnly = preg_replace('/[^\d]/', '', $whatsapp);
            if (strlen((string) $digitsOnly) < 8 || strlen((string) $digitsOnly) > 16 || !preg_match('/^(\+?[0-9\s\-]{8,25})$/', $whatsapp)) {
                $errors['whatsapp'] = 'Format WhatsApp international invalide (ex: +2250700000000).';
            }
        }

        // E-mail public
        if ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
            $errors['email'] = 'Adresse e-mail invalide.';
        }

        // Réseaux sociaux (liens URL valides)
        if ($facebook !== '' && (!filter_var($facebook, FILTER_VALIDATE_URL) || !preg_match('/^https?:\/\//i', $facebook))) {
            $errors['facebook'] = 'L\'URL Facebook doit débuter par http:// ou https://.';
        }

        if ($instagram !== '' && (!filter_var($instagram, FILTER_VALIDATE_URL) || !preg_match('/^https?:\/\//i', $instagram))) {
            $errors['instagram'] = 'L\'URL Instagram doit débuter par http:// ou https://.';
        }

        if ($linkedin !== '' && (!filter_var($linkedin, FILTER_VALIDATE_URL) || !preg_match('/^https?:\/\//i', $linkedin))) {
            $errors['linkedin'] = 'L\'URL LinkedIn doit débuter par http:// ou https://.';
        }

        // Longueur maximale des champs textuels
        if (mb_strlen($address) > 255) {
            $errors['address'] = 'L\'adresse ne peut dépasser 255 caractères.';
        }

        if (mb_strlen($openingHours) > 255) {
            $errors['opening_hours'] = 'Les horaires ne peuvent dépasser 255 caractères.';
        }

        if (!empty($errors)) {
            return Response::error('VALIDATION_FAILED', 'Veuillez corriger les champs invalides.', 422, $errors);
        }

        // 3. Enregistrement en base de données
        $dataToSave = [
            'phone' => $phone,
            'whatsapp' => $whatsapp,
            'email' => $email,
            'address' => $address,
            'facebook' => $facebook,
            'instagram' => $instagram,
            'linkedin' => $linkedin,
            'opening_hours' => $openingHours,
        ];

        $pdo = Database::getConnection();
        $stmt = $pdo->prepare("
            INSERT INTO settings (setting_key, setting_value) 
            VALUES (:key, :value) 
            ON DUPLICATE KEY UPDATE setting_value = :value_update
        ");

        foreach ($dataToSave as $k => $v) {
            $stmt->bindValue(':key', $k, PDO::PARAM_STR);
            $stmt->bindValue(':value', $v, PDO::PARAM_STR);
            $stmt->bindValue(':value_update', $v, PDO::PARAM_STR);
            $stmt->execute();
        }

        return Response::success([
            'settings' => $dataToSave,
            'message' => 'Réglages enregistrés avec succès.',
        ]);
    }
}

