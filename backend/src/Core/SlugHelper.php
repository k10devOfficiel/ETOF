<?php

declare(strict_types=1);

namespace App\Core;

use PDO;

/**
 * Utilitaire de génération et d'unicité de slugs URL normalisés.
 */
final class SlugHelper
{
    /**
     * Génère un slug normalisé (minuscules, sans accents, sans caractères spéciaux).
     */
    public static function slugify(string $text): string
    {
        // Translittération UTF-8 vers ASCII
        $translitted = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $text);
        if ($translitted === false) {
            $translitted = $text;
        }

        // Nettoyage des caractères non alphanumériques
        $slug = preg_replace('/[^a-zA-Z0-9\-_]+/', '-', $translitted) ?? '';
        $slug = strtolower(trim($slug, '-'));

        return $slug !== '' ? $slug : 'item-' . bin2hex(random_bytes(4));
    }

    /**
     * @var list<string>
     */
    private const ALLOWED_TABLES = ['products', 'vehicles', 'categories'];

    /**
     * Garantit l'unicité d'un slug au sein d'une table MySQL en ajoutant un suffixe numérique si nécessaire.
     */
    public static function makeUnique(PDO $pdo, string $table, string $slug, ?int $excludeId = null): string
    {
        if (!in_array($table, self::ALLOWED_TABLES, true)) {
            throw new \InvalidArgumentException("Table non autorisée pour la génération de slug : {$table}");
        }

        $baseSlug = $slug;
        $counter = 1;

        while (true) {
            $sql = "SELECT COUNT(*) FROM `{$table}` WHERE `slug` = :slug";
            if ($excludeId !== null) {
                $sql .= " AND `id` != :exclude_id";
            }

            $stmt = $pdo->prepare($sql);
            $stmt->bindValue(':slug', $slug, PDO::PARAM_STR);
            if ($excludeId !== null) {
                $stmt->bindValue(':exclude_id', $excludeId, PDO::PARAM_INT);
            }
            $stmt->execute();

            $count = (int) $stmt->fetchColumn();
            if ($count === 0) {
                return $slug;
            }

            $counter++;
            $slug = "{$baseSlug}-{$counter}";
        }
    }
}

