<?php

declare(strict_types=1);

namespace App\Core;

use DateTimeImmutable;

/**
 * Validateur de données d'entrée supportant les règles obligatoires, formats ivoiriens/internationaux et types.
 */
final class Validator
{
    /**
     * @var array<string, list<string>>
     */
    private array $errors = [];

    /**
     * Valide un ensemble de données par rapport à une liste de règles.
     * Exemple de format de règles :
     * [
     *     'full_name' => 'required|min:3|max:100',
     *     'email' => 'required|email',
     *     'phone' => 'required|phone',
     *     'quantity' => 'required|integer|min:1',
     *     'status' => 'in:pending,confirmed',
     *     'start_date' => 'date',
     *     'consent' => 'boolean'
     * ]
     *
     * @param array<string, mixed> $data
     * @param array<string, string|list<string>> $rules
     */
    public function validate(array $data, array $rules): bool
    {
        $this->errors = [];

        foreach ($rules as $field => $fieldRules) {
            $ruleList = is_string($fieldRules) ? explode('|', $fieldRules) : $fieldRules;
            $value = $data[$field] ?? null;

            foreach ($ruleList as $ruleItem) {
                $ruleItem = trim($ruleItem);
                if ($ruleItem === '') {
                    continue;
                }

                $ruleName = $ruleItem;
                $parameter = null;

                if (str_contains($ruleItem, ':')) {
                    [$ruleName, $parameter] = explode(':', $ruleItem, 2);
                }

                $this->applyRule($field, $value, $ruleName, $parameter, $data);
            }
        }

        return empty($this->errors);
    }

    /**
     * Retourne les erreurs formatées par champ pour Response::error(..., fields: $errors).
     *
     * @return array<string, list<string>>
     */
    public function getErrors(): array
    {
        return $this->errors;
    }

    /**
     * Retourne la première erreur de chaque champ sous forme de tableau associatif simple.
     *
     * @return array<string, string>
     */
    public function getFirstErrors(): array
    {
        $first = [];
        foreach ($this->errors as $field => $messages) {
            $first[$field] = $messages[0] ?? 'Valeur invalide';
        }
        return $first;
    }

    /**
     * Applique une règle unitaire à une valeur donnée.
     *
     * @param array<string, mixed> $allData
     */
    private function applyRule(string $field, mixed $value, string $ruleName, ?string $parameter, array $allData): void
    {
        $isEmpty = ($value === null || $value === '' || (is_array($value) && empty($value)));

        if ($ruleName === 'required') {
            if ($isEmpty) {
                $this->addError($field, "Le champ '{$field}' est obligatoire.");
            }
            return;
        }

        // Si la valeur est vide et non requise, les autres validations sont ignorées
        if ($isEmpty) {
            return;
        }

        switch ($ruleName) {
            case 'email':
                if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
                    $this->addError($field, "Le champ '{$field}' doit être une adresse email valide.");
                }
                break;

            case 'phone':
                if (!is_string($value) || !$this->isValidPhone($value)) {
                    $this->addError($field, "Le champ '{$field}' doit être un numéro de téléphone valide (format ivoirien ou international).");
                }
                break;

            case 'min':
                $min = (int) $parameter;
                if (is_int($value) || is_float($value)) {
                    if ($value < $min) {
                        $this->addError($field, "Le champ '{$field}' doit être supérieur ou égal à {$min}.");
                    }
                } elseif (is_string($value)) {
                    if (mb_strlen($value) < $min) {
                        $this->addError($field, "Le champ '{$field}' doit contenir au moins {$min} caractères.");
                    }
                } elseif (is_array($value) && count($value) < $min) {
                    $this->addError($field, "Le champ '{$field}' doit contenir au moins {$min} éléments.");
                }
                break;

            case 'max':
                $max = (int) $parameter;
                if (is_int($value) || is_float($value)) {
                    if ($value > $max) {
                        $this->addError($field, "Le champ '{$field}' doit être inférieur ou égal à {$max}.");
                    }
                } elseif (is_string($value)) {
                    if (mb_strlen($value) > $max) {
                        $this->addError($field, "Le champ '{$field}' ne doit pas dépasser {$max} caractères.");
                    }
                } elseif (is_array($value) && count($value) > $max) {
                    $this->addError($field, "Le champ '{$field}' ne doit pas dépasser {$max} éléments.");
                }
                break;

            case 'in':
                $allowed = array_map('trim', explode(',', (string) $parameter));
                if (!in_array((string) $value, $allowed, true)) {
                    $allowedList = implode(', ', $allowed);
                    $this->addError($field, "La valeur du champ '{$field}' doit être parmi : {$allowedList}.");
                }
                break;

            case 'date':
                if (!is_string($value) || !$this->isValidDate($value)) {
                    $this->addError($field, "Le champ '{$field}' doit être une date valide (format YYYY-MM-DD).");
                }
                break;

            case 'integer':
                if (filter_var($value, FILTER_VALIDATE_INT) === false) {
                    $this->addError($field, "Le champ '{$field}' doit être un nombre entier.");
                }
                break;

            case 'boolean':
                if (filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) === null) {
                    $this->addError($field, "Le champ '{$field}' doit être un booléen.");
                }
                break;
        }
    }

    /**
     * Valide les numéros ivoiriens (10 chiffres, indicatif +225 ou 00225) et internationaux standards.
     */
    private function isValidPhone(string $phone): bool
    {
        $clean = preg_replace('/[\s\-\.\(\)]/', '', $phone) ?? '';

        // Format ivoirien avec indicatif (+225 ou 00225 suivi de 10 chiffres)
        if (preg_match('/^(?:\+225|00225)[0-9]{10}$/', $clean)) {
            return true;
        }

        // Format ivoirien local à 10 chiffres commençant par 01, 05, 07 ou 21-27
        if (preg_match('/^(?:01|05|07|21|25|27)[0-9]{8}$/', $clean)) {
            return true;
        }

        // Format international générique E.164 souple (8 à 15 chiffres précédés ou non d'un +)
        if (preg_match('/^\+?[1-9][0-9]{7,14}$/', $clean)) {
            return true;
        }

        return false;
    }

    /**
     * Valide le format de date YYYY-MM-DD.
     */
    private function isValidDate(string $date): bool
    {
        $d = DateTimeImmutable::createFromFormat('Y-m-d', $date);
        return $d !== false && $d->format('Y-m-d') === $date;
    }

    /**
     * Enregistre un message d'erreur pour un champ.
     */
    private function addError(string $field, string $message): void
    {
        if (!isset($this->errors[$field])) {
            $this->errors[$field] = [];
        }
        $this->errors[$field][] = $message;
    }
}

