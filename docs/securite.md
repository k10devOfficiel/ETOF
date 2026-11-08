# Architecture de Sécurité du Backend – ETOF SARL

Ce document détaille les briques de sécurité implémentées dans le backend PHP 8.3 avant la mise en place des routes sensibles.

---

## 1. Validation Stricte des Données (`App\Core\Validator`)
- **Principe** : Contrôle systématique des données reçues avant tout traitement applicatif ou insertion en base.
- **Règles supportées** :
  - `required` : présence obligatoire et valeur non vide.
  - `email` : validation stricte du format d'adresse email (`FILTER_VALIDATE_EMAIL`).
  - `phone` : validation des numéros ivoiriens à 10 chiffres (avec indicatifs `+225` ou `00225`, ou formats locaux `01`, `05`, `07`, `21-27`) ainsi que du standard international souple E.164.
  - `min` / `max` : contrôle de longueur de chaîne, de seuil numérique ou de taille de tableau.
  - `in` : vérification d'appartenance à une liste restreinte de valeurs autorisées.
  - `date` : contrôle de validité d'une date au format ISO `YYYY-MM-DD`.
  - `integer` / `boolean` : vérification stricte des types primitifs.
- **Format de réponse** : Les erreurs sont regroupées par champ et intégrées dans la réponse standardisée `{ "success": false, "data": null, "error": { "code": "VALIDATION_FAILED", "fields": { ... } } }`.

---

## 2. Limitation de Débit (`App\Services\RateLimiter`)
- **Protection** : Prévient les attaques par force brute, le spamming et le déni de service sur les formulaires publics.
- **Anonymisation et conformité RGPD** : L'adresse IP est salée avec une clé secrète (`RATE_LIMIT_SALT` dans le fichier `.env`) et hachée en **SHA-256** avant stockage dans la table `rate_limits`. Aucune IP brute n'est persistée.
- **Seuil par défaut** : 5 requêtes par fenêtre glissante de 10 minutes par action et par empreinte IP.
- **Réponse HTTP 429** : Renvoie une réponse explicite avec le code HTTP `429 Too Many Requests` et l'en-tête `Retry-After`.
- **Maintenance** : Purge automatique des enregistrements expirés.

---

## 3. Dispositif Anti-Spam Hybride (`App\Services\AntiSpam`)
- **Piège Honeypot (`website`)** : Un champ invisible pour les utilisateurs humains est intégré aux formulaires. Si ce champ est complété par un robot spammeur, la requête est rejetée **silencieusement** avec une réponse factice positive (200 OK), neutralisant le spam sans informer le robot du blocage.
- **Cloudflare Turnstile (Optionnel)** : Vérification cryptographique des requêtes via l'API Cloudflare (`TURNSTILE_SECRET`). Si la variable d'environnement est laissée vide, la vérification est automatiquement contournée sans bloquer le développement local.

---

## 4. En-têtes HTTP de Sécurité
Chaque réponse produite par le système intègre automatiquement les en-têtes suivants :
- `X-Content-Type-Options: nosniff` : empêche le navigateur d'interpréter un fichier avec un type MIME différent de celui déclaré.
- `X-Frame-Options: DENY` : neutralise les attaques par détournement de clic (Clickjacking) en interdisant l'intégration du site dans une iframe externe.
- `Referrer-Policy: strict-origin-when-cross-origin` : restreint la fuite d'informations sensibles dans l'en-tête `Referer`.
- `Permissions-Policy: camera=(), microphone=(), geolocation=()` : désactive l'accès aux capteurs sensibles du périphérique client.

---

## 5. Téléversement Sécurisé de Fichiers (`App\Services\UploadService`)
- **Formats acceptés** : `jpg`, `png`, `webp` exclusivement.
- **Vérification MIME réelle** : Utilisation de l'extension PHP `finfo` (analyse magique des octets d'en-tête du fichier). Un fichier exécutable (ex: script PHP) simplement renommé en `.jpg` est immédiatement détecté et refusé.
- **Limite de taille** : 4 Mo maximum par image.
- **Nommage aléatoire** : Génération d'un nom cryptographiquement imprévisible (`bin2hex(random_bytes(16))`) empêchant les collisions et l'écrasement de fichiers.
- **Neutralisation et redimensionnement GD** : L'image est re-échantillonnée via la bibliothèque graphique GD avec une taille maximale de 1600 px. Cette manipulation supprime d'éventuels scripts PHP ou métadonnées EXIF malveillantes dissimulés dans les données de l'image.
- **Protection du répertoire de stockage** : Un fichier `.htaccess` présent dans `public/uploads/` interdit formellement l'exécution de tout script (`.php`, `.phtml`, `.sh`, etc.).

---

## 6. Limitation de Taille des Requêtes JSON
- Le corps des requêtes entrantes est bridé à **200 Ko maximum** au niveau du noyau applicatif (`Request`).
- Toute charge utile supérieure déclenche immédiatement un code d'erreur HTTP **413 Payload Too Large**.

---

## 7. Journalisation Aveugle des Erreurs (`App\Core\ErrorHandler`)
- En cas d'erreur ou d'exception non gérée, **aucune stack trace ni chemin de fichier n'est exposé au client**.
- Une réponse générique sécurisée HTTP 500 est retournée.
- L'intégralité des détails techniques (trace, ligne, code, IP) est consignée dans les fichiers journaux locaux dans `storage/logs/error-YYYY-MM-DD.log`.

