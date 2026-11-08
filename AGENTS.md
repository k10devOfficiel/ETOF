# Règles et Directives pour les Agents IA – Site Internet ETOF SARL

Ce document définit les règles permanentes et obligatoires applicables à tout agent intervenant sur le projet **Site internet ETOF SARL**.

---

## 1. Contexte du Projet
- **Entreprise** : ETOF SARL, basée à Abidjan (Côte d’Ivoire).
- **Type de site** : Site vitrine institutionnel et commercial bilingue (Français / Anglais).
- **Slogan** : « Une nouvelle vision du monde des affaires ».
- **4 Activités principales** :
  1. Ferme et élevage
  2. Vente et location de véhicules
  3. Fournitures de bureau
  4. Transport d’hydrocarbures

---

## 2. Stack Imposée
- **Frontend** :
  - React 18 + Vite en **JavaScript pur** (TypeScript interdit).
  - React Router (navigation SPA).
  - `react-i18next` (gestion du multilingue FR/EN).
  - Styles : CSS Modules exclusivement.
- **Backend** :
  - PHP 8.3 sans framework.
  - Architecture Front Controller (`index.php`), routeur minimaliste, PDO natif, PHPMailer.
  - API REST pure retournant exclusivement du JSON.
- **Base de données** :
  - MySQL 8 avec encodage `utf8mb4` et collation `utf8mb4_unicode_ci`.
- **Règle stricte sur les dépendances** :
  - **Interdiction formelle** d’ajouter une dépendance (npm ou Composer) sans l'avoir préalablement proposée et fait valider par l'utilisateur.

---

## 3. Règles PHP (Backend)
- `declare(strict_types=1);` obligatoirement en tête de chaque fichier PHP.
- Requêtes préparées via PDO exclusivement (aucun paramètre concaténé ou injecté directement).
- Proscription totale des fonctions obsolètes ou dépréciées en PHP 8.3.
- Hachage sécurisé des mots de passe avec `password_hash()` et validation via `password_verify()`.
- Sorties systématiquement échappées ou sérialisées en JSON sécurisé.
- Gestion des erreurs : erreurs journalisées dans `storage/logs/` (rotation/fichiers log) et **jamais affichées au client** (pas d'affichage de stack trace en production).

---

## 4. Règles React (Frontend)
- Utilisation exclusive de composants fonctionnels avec Hooks.
- Un seul composant par fichier.
- **Zéro texte en dur dans le JSX** : toutes les chaînes textuelles passent obligatoirement par les clés de traduction `react-i18next`.
- Accessibilité (a11y) obligatoire : balises HTML sémantiques (`<main>`, `<nav>`, `<header>`, `<article>`, etc.), attributs `alt` pertinents sur les images, labels liés aux formulaires, états de focus visibles au clavier.
- Approche de conception **mobile-first** pour tous les styles CSS Modules.

---

## 5. Règles API REST
- Enveloppe JSON standardisée pour toutes les réponses HTTP :
  ```json
  {
    "success": true,
    "data": {},
    "error": null
  }
  ```
  *(En cas d'erreur : `"success": false`, `"data": null`, `"error": { "code": "...", "message": "..." }`)*
- Codes de statut HTTP appropriés et précis (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `422 Unprocessable Entity`, `500 Internal Server Error`).
- Validation rigoureuse côté serveur de l'ensemble des données d'entrée (inputs, formats, types, tailles).

---

## 6. Sécurité
- Aucun secret, identifiant, clé d'API ou mot de passe dans le code source ni dans git (utilisation exclusive de variables d'environnement via fichier `.env` non versionné, avec exemple dans `.env.example`).
- Protection CSRF active sur toutes les requêtes d'action / soumission d'état.
- Mécanismes anti-spam systématiques sur tous les formulaires publics (contact, demande de devis).

---

## 7. Style et Conventions
- **Code et identifiants** : exclusivement en anglais (noms de fichiers, fonctions, variables, classes, tables, champs).
- **Commentaires et documentation technique** : rédigés en français.
- **Messages utilisateur** : externalisés dans les fichiers de traduction (`locales/fr/*.json`, `locales/en/*.json`).

---

## 8. Méthode de Travail Obligatoire
1. **Avant de coder** : annoncer systématiquement le plan d'action en **5 lignes maximum**.
2. **Pendant le dev** : ne jamais toucher aux fichiers hors du périmètre strict de la tâche confiée.
3. **Après avoir codé** : lister explicitement les fichiers créés ou modifiés et détailler la procédure pas-à-pas pour tester et valider le travail.

