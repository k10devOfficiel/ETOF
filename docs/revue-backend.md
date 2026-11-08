# Rapport de Revue Complète du Backend – ETOF SARL

Ce document consigne la revue exhaustive de sécurité, de robustesse, d'architecture et de conformité du backend PHP 8.3 du site internet **ETOF SARL**.

---

## 1. Synthèse Générale de l'Audit

- **Périmètre audité** : Architecture REST, contrôleurs publics et d'administration, services métier, gestion des erreurs, sécurité SQL, authentification, sessions, limitations de débit et téléversements.
- **Résultat de la suite de tests automatisée** : **34 tests / 154 assertions exécutés avec succès (100% Vert via PHPUnit 11.5.57)**.
- **Statut des vulnérabilités critiques / majeures** : **0 point critique ouvert**.

---

## 2. Sécurité des Requêtes SQL et Prévention des Injections

### 2.1 Requêtes Préparées PDO Systématiques
- L'intégralité des requêtes SQL interagissant avec des données dynamiques ou entrées utilisateur utilise le mécanisme des requêtes préparées PDO (`PDO::prepare()` + `bindValue()` ou passage de paramètres associatifs à `execute()`).
- L'émulation des requêtes préparées est désactivée nativement dans la configuration PDO (`PDO::ATTR_EMULATE_PREPARES => false`), forçant le serveur MySQL à traiter séparément la structure SQL et les données.
- Aucun paramètre issu de `$_GET`, `$_POST`, corps JSON ou en-têtes HTTP n'est concaténé ou interpolé dans des requêtes SQL.

### 2.2 Sécurisation des Clauses `ORDER BY` et Pagination
- Toutes les clauses `ORDER BY` dynamiques au niveau des listes d'administration (`AdminProductController`, `AdminVehicleController`, `AdminRequestController`) et du catalogue public utilisent un système de liste blanche stricte (`$allowedSorts`).
- Toute valeur de colonne non répertoriée bascule automatiquement sur la valeur par défaut sécurisée.
- La direction du tri est strictement normalisée par comparaison booléenne (`$order === 'desc' ? 'DESC' : 'ASC'`).
- Les paramètres `LIMIT` et `OFFSET` sont systématiquement castés en entiers positifs (`PDO::PARAM_INT`) avec des bornes maximales garantissant l'absence de déni de service par pagination abusive.

---

## 3. Gestion des Erreurs et Étancheité en Production

### 3.1 Masquage Absolu des Traces et Erreurs
- La classe `App\Core\ErrorHandler` désactive systématiquement l'affichage des erreurs à l'exécution :
  - `ini_set('display_errors', '0');`
  - `ini_set('display_startup_errors', '0');`
- Toutes les exceptions non interceptées et erreurs PHP sont converties et centralisées via `set_error_handler`, `set_exception_handler` et `register_shutdown_function`.

### 3.2 Journalisation Sécurisée dans `storage/logs/`
- Les détails complets des anomalies (type d'exception, message, fichier, ligne, stack trace, méthode HTTP, URI et IP cliente) sont enregistrés dans des fichiers journaliers horodatés : `storage/logs/error-YYYY-MM-DD.log`.
- Les fichiers journaux sont protégés contre tout accès HTTP direct via `.gitignore` et `.htaccess`.

### 3.3 Enveloppe JSON Standardisée sans Fuite de Données
- Le client reçoit exclusivement une réponse HTTP 500 neutre et sécurisée :
  ```json
  {
    "success": false,
    "data": null,
    "error": {
      "code": "INTERNAL_SERVER_ERROR",
      "message": "Une erreur interne est survenue sur le serveur."
    }
  }
  ```
- Aucun identifiant de base de données, mot de passe, secret d'environnement ou chemin système local n'est exposé dans la réponse JSON.

---

## 4. Authentification, Sessions et Protection CSRF

### 4.1 Sécurisation des Sessions Administrateur
- Sessions natives PHP configurées de manière étanche :
  - `session.cookie_httponly = 1` (inaccessible depuis JavaScript, neutralisant les attaques XSS de vol de session).
  - `session.use_only_cookies = 1` et `session.use_strict_mode = 1` (rejet des identifiants non générés par le serveur).
  - `SameSite = Lax` (protection contre les requêtes inter-sites non sollicitées).
  - `Secure = true` en production (transmission HTTPS exclusive).
  - Régénération immédiate de l'ID de session (`session_regenerate_id(true)`) à la connexion pour contrer la fixation de session.
  - Déconnexion automatique après 2 heures d'inactivité (`last_activity`).

### 4.2 Protection CSRF
- Jeton cryptographique pseudo-aléatoire fort de 64 caractères hexadécimaux (`bin2hex(random_bytes(32))`) généré par session.
- Middleware `CsrfMiddleware` contrôlant rigoureusement l'en-tête `X-CSRF-Token` sur toutes les requêtes d'action modifiant l'état (`POST`, `PUT`, `PATCH`, `DELETE`) sous `/api/admin`.

### 4.3 Prévention des Attaques par Force Brute
- Contrôle de limitation de débit sur `/api/admin/login` : 5 échecs maximum par fenêtre de 15 minutes, calculés cumulativement par IP et par adresse email hachée.
- Message d'erreur uniforme (`Identifiants de connexion invalides.`) empêchant toute énumération d'utilisateurs.

---

## 5. Protection Anti-Spam et Contrôle des Entrées

- **Honeypot** : Champ invisible `website` piégeant les robots ; en cas de saisie, renvoi d'une réponse de succès factice sans écriture en base de données ni envoi d'email.
- **Cloudflare Turnstile** : Intégration optionnelle gérée sans blocage si la clé secrète est absente du fichier `.env`.
- **Limitation de charge** : Taille du corps JSON limitée à 200 Ko pour prévenir l'épuisement mémoire (`HTTP 413 Payload Too Large`).
- **Validateur strict** : Règles typées (`required`, `email`, `phone` avec support ivoirien +225 et international, `min`, `max`, `in`, `date`, `integer`, `boolean`).

---

## 6. Points Identifiés et Corrections Appliquées

| N° | Composant | Point Identifié / Risque Potentiel | Action Corrective Appliquée | Statut |
| :--- | :--- | :--- | :--- | :--- |
| **1** | `SlugHelper.php` | Nom de table interpolé dans `makeUnique` sans validation explicite. | Ajout d'une liste blanche stricte (`['products', 'vehicles', 'categories']`) et levée d'une `InvalidArgumentException` en cas de table non autorisée. | **Résolu** |
| **2** | `public/index.php` | Méthode `PATCH` absente de l'en-tête CORS `Access-Control-Allow-Methods`. | Ajout de `PATCH` dans la liste des méthodes autorisées pour permettre la mise à jour des statuts de demande via SPA. | **Résolu** |
| **3** | `AdminProductController.php` & `AdminVehicleController.php` | Fonction de suppression de fichier physique risquant de supprimer des médias de démo ou des fichiers partagés. | Vérification stricte interdisant la suppression sous `uploads/demo/` et contrôle d'absence d'autre référence en base avant `unlink()`. | **Résolu** |
| **4** | `Core/Response.php` | Méthodes d'inspection `getData()` et `getHeaders()` non exposées pour l'outillage de test. | Ajout des accesseurs `getData(): array` (alias de `getPayload`) et `getHeaders(): array`. | **Résolu** |
| **5** | `Services/SessionService.php` | Nettoyage du tableau `$_SESSION` dépendant de `session_status() === PHP_SESSION_ACTIVE` en environnement CLI. | Réinitialisation inconditionnelle de `$_SESSION = []` lors de l'appel à `SessionService::destroy()`. | **Résolu** |

---

## 7. Couverture de la Suite de Tests PHPUnit

La suite de tests automatisée est organisée en deux répertoires sous `backend/tests/` :

1. **Tests Unitaires (`tests/Unit/`)** :
   - `ValidatorTest.php` : Validation exhaustive de l'ensemble des règles (obligatoire, email, formats de téléphone ivoiriens/internationaux, min/max numériques et chaînes, liste de valeurs, dates valides/bissextiles/invalides, booléens, entiers).
   - `RateLimiterTest.php` : Hachage SHA-256 avec sel, contrôle d'incrément, blocage au seuil maximal, purge des données obsolètes, conformité de la réponse HTTP 429 avec en-tête `Retry-After`.

2. **Tests d'Intégration (`tests/Integration/`)** :
   - `RequestCreationTest.php` : Création de contacts, devis carburant avec métadonnées, réservations de véhicules avec dates futures, commandes avec snapshots de prix/dénominations, rejet pour absence de consentement, rejet de dates passées ou inversées, et rejet silencieux du spam via honeypot.
   - `AuthTest.php` : Authentification réussie, rejet d'identifiants erronés, protection contre l'énumération d'emails, limitation anti-bruteforce (blocage HTTP 429 après 5 échecs), contrôles des middlewares `AdminAuthMiddleware` et `CsrfMiddleware`, déconnexion.
   - `VehicleCrudTest.php` : Création complète avec slugification automatique et validation JSON des spécifications techniques, rejet de catégories inappropriées, rejet de prix négatifs, désactivation par suppression douce (`is_active = 0`), mise à jour et suppression définitive avec purge en cascade.

