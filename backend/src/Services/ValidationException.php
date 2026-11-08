<?php

declare(strict_types=1);

namespace App\Services;

use Exception;

/**
 * Exception spécifique levée lors d'un échec de validation avec détail des champs en erreur.
 */
final class ValidationException extends Exception
{
    /**
     * @var array<string, list<string>>
     */
    private array $fields;

    /**
     * @param array<string, list<string>> $fields
     */
    public function __construct(string $message, array $fields = [])
    {
        parent::__construct($message);
        $this->fields = $fields;
    }

    /**
     * Retourne la liste des erreurs groupées par champ.
     *
     * @return array<string, list<string>>
     */
    public function getFields(): array
    {
        return $this->fields;
    }
}

