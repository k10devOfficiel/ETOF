<?php

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use App\Core\Config;
use App\Core\Database;

Config::load(__DIR__ . '/..');

echo "========================================================\n";
echo "   ETOF SARL - Création d'un Administrateur Système    \n";
echo "========================================================\n\n";

// Support des arguments en ligne de commande pour exécution automatisée ou interactive
$options = getopt('', ['name::', 'email::', 'password::']);

$name = (string) ($options['name'] ?? '');
$email = (string) ($options['email'] ?? '');
$password = (string) ($options['password'] ?? '');

// Mode interactif si non fourni en argument
if ($name === '') {
    echo "Nom complet [Administrateur ETOF] : ";
    $input = trim((string) fgets(STDIN));
    $name = $input !== '' ? $input : 'Administrateur ETOF';
}

if ($email === '') {
    do {
        echo "Adresse e-mail : ";
        $email = strtolower(trim((string) fgets(STDIN)));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            echo " [!] Adresse email invalide. Veuillez recommencer.\n";
            $email = '';
        }
    } while ($email === '');
} else {
    $email = strtolower(trim($email));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        fwrite(STDERR, "Erreur : L'adresse email fournie est invalide.\n");
        exit(1);
    }
}

if ($password === '') {
    do {
        echo "Mot de passe (minimum 12 caractères) : ";
        $password = trim((string) fgets(STDIN));
        if (mb_strlen($password) < 12) {
            echo " [!] Le mot de passe doit comporter au moins 12 caractères. Réessayez.\n";
            $password = '';
        }
    } while ($password === '');
} else {
    if (mb_strlen($password) < 12) {
        fwrite(STDERR, "Erreur : Le mot de passe doit comporter au moins 12 caractères.\n");
        exit(1);
    }
}

try {
    $pdo = Database::getConnection();

    // Vérifier si l'adresse email existe déjà
    $checkStmt = $pdo->prepare("SELECT id FROM admins WHERE email = :email LIMIT 1");
    $checkStmt->bindValue(':email', $email, PDO::PARAM_STR);
    $checkStmt->execute();

    if ($checkStmt->fetchColumn() !== false) {
        echo "\n[!] Un compte administrateur avec l'email '{$email}' existe déjà.\n";
        echo "Mise à jour du mot de passe de ce compte...\n";

        $hash = password_hash($password, PASSWORD_DEFAULT);
        $updateStmt = $pdo->prepare("UPDATE admins SET password_hash = :hash, name = :name WHERE email = :email");
        $updateStmt->execute([
            ':hash' => $hash,
            ':name' => $name,
            ':email' => $email,
        ]);

        echo "[✓] Mot de passe administrateur mis à jour avec succès.\n";
        exit(0);
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);

    $insertStmt = $pdo->prepare("INSERT INTO admins (name, email, password_hash, created_at) VALUES (:name, :email, :hash, NOW())");
    $insertStmt->execute([
        ':name' => $name,
        ':email' => $email,
        ':hash' => $hash,
    ]);

    echo "\n[✓] Administrateur créé avec succès !\n";
    echo "    Nom   : {$name}\n";
    echo "    Email : {$email}\n";
    echo "========================================================\n";
} catch (\Throwable $e) {
    fwrite(STDERR, "\n[X] Erreur lors de la création : " . $e->getMessage() . "\n");
    exit(1);
}

