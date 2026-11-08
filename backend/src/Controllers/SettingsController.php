<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use PDO;

/**
 * Contrôleur exposant les paramètres publics de l'entreprise (coordonnées et réseaux).
 */
final class SettingsController
{
    /**
     * @var list<string>
     */
    private const PUBLIC_KEYS = [
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
     * Récupère la liste des réglages publics.
     */
    public function index(Request $request): Response
    {
        $pdo = Database::getConnection();

        $placeholders = implode(',', array_fill(0, count(self::PUBLIC_KEYS), '?'));
        $sql = "SELECT setting_key, setting_value FROM settings WHERE setting_key IN ({$placeholders})";

        $stmt = $pdo->prepare($sql);
        foreach (self::PUBLIC_KEYS as $index => $key) {
            $stmt->bindValue($index + 1, $key, PDO::PARAM_STR);
        }
        $stmt->execute();

        $rows = $stmt->fetchAll();
        $settings = [];

        // Initialisation avec des valeurs par défaut vides
        foreach (self::PUBLIC_KEYS as $key) {
            $settings[$key] = '';
        }

        foreach ($rows as $row) {
            $key = (string) $row['setting_key'];
            $settings[$key] = (string) ($row['setting_value'] ?? '');
        }

        return Response::success($settings);
    }
}

