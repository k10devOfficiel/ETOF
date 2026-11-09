<?php

declare(strict_types=1);

namespace App\Services;

/**
 * Fonctions utilitaires dédiées aux utilisateurs clients et à la mise en forme de la civilité.
 */
final class UserHelper
{
    /**
     * Génère l'appellation respectueuse de l'utilisateur selon sa civilité, sa langue et sa préférence de nom.
     * Exemples :
     * - FR : « Monsieur Kofi », « Madame Ama », « Kofi » (sans civilité)
     * - EN : « Mr Kofi », « Ms Ama », « Kofi » (none)
     *
     * @param array<string, mixed>|null $user
     * @param string $lang 'fr' ou 'en'
     */
    public static function displayName(?array $user, string $lang = 'fr'): string
    {
        if ($user === null || empty($user)) {
            return $lang === 'en' ? 'Customer' : 'Cher Client';
        }

        $civility = (string) ($user['civility'] ?? 'none');
        $preferredNameChoice = (string) ($user['preferred_name'] ?? 'first_name');
        $firstName = trim((string) ($user['first_name'] ?? ''));
        $lastName = trim((string) ($user['last_name'] ?? ''));

        // Sélection du nom choisi (prénom par défaut, nom si préféré ou si prénom vide)
        $chosenName = '';
        if ($preferredNameChoice === 'last_name' && $lastName !== '') {
            $chosenName = $lastName;
        } elseif ($firstName !== '') {
            $chosenName = $firstName;
        } elseif ($lastName !== '') {
            $chosenName = $lastName;
        } else {
            $chosenName = trim((string) ($user['name'] ?? $user['full_name'] ?? ''));
        }

        if ($chosenName === '') {
            return $lang === 'en' ? 'Customer' : 'Cher Client';
        }

        $isEn = strtolower(substr($lang, 0, 2)) === 'en';

        return match ($civility) {
            'mr' => ($isEn ? 'Mr ' : 'Monsieur ') . $chosenName,
            'mrs' => ($isEn ? 'Ms ' : 'Madame ') . $chosenName,
            default => $chosenName,
        };
    }
}

