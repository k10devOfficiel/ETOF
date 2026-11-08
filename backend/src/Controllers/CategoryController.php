<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use PDO;

/**
 * Contrôleur des catégories de produits et véhicules par pôle d'activité.
 */
final class CategoryController
{
    /**
     * Liste les catégories actives filtrées par pôle d'activité avec libellés bilingues.
     */
    public function index(Request $request): Response
    {
        $pdo = Database::getConnection();
        $lang = $request->getLang();
        $activity = $request->getQuery('activity');

        $sql = "SELECT id, activity, slug, name_fr, name_en, sort_order 
                FROM categories 
                WHERE is_active = 1";

        $params = [];

        if (is_string($activity) && in_array(strtolower(trim($activity)), ['farm', 'vehicle', 'office'], true)) {
            $sql .= " AND activity = :activity";
            $params[':activity'] = strtolower(trim($activity));
        }

        $sql .= " ORDER BY sort_order ASC, id ASC";

        $stmt = $pdo->prepare($sql);
        foreach ($params as $paramKey => $paramValue) {
            $stmt->bindValue($paramKey, $paramValue, PDO::PARAM_STR);
        }
        $stmt->execute();

        $rows = $stmt->fetchAll();
        $categories = [];

        foreach ($rows as $row) {
            $name = ($lang === 'en' && !empty($row['name_en']))
                ? (string) $row['name_en']
                : (string) $row['name_fr'];

            $categories[] = [
                'id' => (int) $row['id'],
                'activity' => (string) $row['activity'],
                'slug' => (string) $row['slug'],
                'name' => $name,
                'sort_order' => (int) $row['sort_order'],
            ];
        }

        return Response::success($categories);
    }
}

