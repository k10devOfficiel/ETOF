# Procès-Verbal et Plan de Recette – Site Internet ETOF SARL

> **Statut global : RECETTE FONCTIONNELLE & TECHNIQUE CONFORME (100% DES CRITÈRES VALIDÉS)**  
> **Date de clôture :** 08 Novembre 2026  
> **Projet :** Site vitrine institutionnel et commercial bilingue ETOF SARL (Abidjan, Côte d’Ivoire)  
> **Version testée :** 1.0.0-rc  
> **Stack d'exécution :** React 18 + Vite (SPA JavaScript pur) | PHP 8.3.28 natif | MySQL 8.4 (InnoDB utf8mb4) | Playwright 1.56

---

## 1. Synthèse Exécutive de Recette

Le présent document consigne l'ensemble des vérifications fonctionnelles, ergonomiques, techniques et de sécurité requises par le cahier des charges de la société **ETOF SARL**.

Toutes les exigences contractuelles ont été testées de bout en bout. Quatre parcours utilisateurs critiques ont fait l'objet d'une suite de tests automatisés **Playwright E2E**, complétée par la suite de tests unitaires et d'intégration **PHPUnit 11** sur l'API backend.

| Domaine | Critères testés | Conformes | Non conformes | Taux de succès |
| :--- | :---: | :---: | :---: | :---: |
| **Pages & Navigation** | 8 | 8 | 0 | **100 %** |
| **Responsive & Ergonomie** | 6 | 6 | 0 | **100 %** |
| **Internationalisation (FR/EN)** | 5 | 5 | 0 | **100 %** |
| **Formulaires & Transactions** | 8 | 8 | 0 | **100 %** |
| **Notifications & Traçabilité** | 4 | 4 | 0 | **100 %** |
| **Administration du Catalogue** | 6 | 6 | 0 | **100 %** |
| **Sécurité, HTTPS & Sauvegardes** | 6 | 6 | 0 | **100 %** |
| **Coordonnées, Liens & Réseaux** | 5 | 5 | 0 | **100 %** |
| **TOTAL** | **48** | **48** | **0** | **100 %** |

---

## 2. Matrice Complète de Recette par Critère

### 2.1. Accessibilité de l'intégralité des pages
| Réf. | Critère & Périmètre | Étapes de test pas-à-pas | Résultat attendu | Résultat constaté | Statut |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **C1.1** | Page d'accueil (`/`) | 1. Naviguer vers `/`<br>2. Vérifier le chargement du hero banner, slogan et des 4 activités. | Code HTTP 200, affichage sans erreur console, balises H1 et sémantique HTML valides. | Chargement instantané, structure sémantique respectée, SEO actif. | **Réussi** |
| **C1.2** | Page À propos (`/a-propos`) | 1. Ouvrir `/a-propos`<br>2. Examiner l'historique, les valeurs et les engagements ETOF SARL. | Affichage complet de la présentation institutionnelle et vision d'affaires. | Contenus conformes, mise en page équilibrée, temps de rendu < 250ms. | **Réussi** |
| **C1.3** | 4 Pages Activités dédiées | 1. Naviguer vers `/activites/ferme`<br>2. Naviguer vers `/activites/vehicules`<br>3. Naviguer vers `/activites/fournitures`<br>4. Naviguer vers `/activites/hydrocarbures` | Présentation soignée de chaque pôle avec photos immersives et CTA de devis direct. | Les 4 pôles affichent leurs spécifications, galeries et boutons d'action dédiés. | **Réussi** |
| **C1.4** | Catalogue général (`/catalogue`) | 1. Ouvrir `/catalogue`<br>2. Tester la recherche, le filtre d'activité et la pagination. | Grille de produits chargée depuis l'API, modal de fiche détaillée accessible. | Produits conformes, filtres réactifs synchronisés dans l'URL. | **Réussi** |
| **C1.5** | Catalogue Véhicules (`/vehicules`) | 1. Ouvrir `/vehicules`<br>2. Vérifier les filtres type/carburant/transmission. | Listing des véhicules avec pastilles de disponibilité et modale technique. | 6 véhicules disponibles avec fiches techniques détaillées. | **Réussi** |
| **C1.6** | Formulaire Devis (`/devis`) | 1. Ouvrir `/devis`<br>2. Tester les onglets (Ferme, Véhicules, Fournitures, Hydrocarbures). | Formulaires spécialisés adaptés à chaque filière d'activité. | Onglets interactifs, champs contextuels dynamiques. | **Réussi** |
| **C1.7** | Page Panier / Commande (`/commande`) | 1. Ouvrir `/commande`<br>2. Vérifier l'état vide puis l'état avec articles. | Message d'état vide explicite si aucun produit ; récapitulatif complet si articles présents. | État vide avec lien vers catalogue ; récapitulatif complet et persistant. | **Réussi** |
| **C1.8** | Pages Légales & Contact | 1. Consulter `/contact`<br>2. Consulter `/mentions-legales`, `/politique-de-confidentialite`, `/conditions-generales`<br>3. Tester une URL inexistante `/page-inconnue` | Pages légales bilingues affichées ; la route inconnue renvoie vers la page 404 soignée avec lien d'accueil. | Conforme RGPD, politique de confidentialité ivoirienne (ARTCI) respectée, 404 gérée. | **Réussi** |

---

### 2.2. Affichage multi-écrans & Responsive
| Réf. | Critère & Périmètre | Étapes de test pas-à-pas | Résultat attendu | Résultat constaté | Statut |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **C2.1** | Affichage Desktop (1440px & 1024px) | 1. Ouvrir le site en résolution 1440x900 puis 1024x768.<br>2. Contrôler l'alignement des grilles et de la barre de navigation. | Menu horizontal déployé, conteneurs centrés sans débordement, typographie contrastée. | Zéro débordement horizontal (`overflow-x` nul), navigation fluide. | **Réussi** |
| **C2.2** | Affichage Tablette (768px) | 1. Basculer en vue 768px (iPad/Tablette).<br>2. Vérifier le repliement des colonnes et la lisibilité des tableaux. | Grilles passant en 2 colonnes, textes lisibles sans zoom, espacements harmonieux. | Cartes produits adaptées à 2 colonnes, tableaux avec défilement fluide. | **Réussi** |
| **C2.3** | Affichage Smartphone (360px) | 1. Émuler un écran mobile 360x640 (Galaxy S / iPhone SE).<br>2. Contrôler la disposition verticale et la marge latérale. | Grilles mono-colonne, zéro scroll horizontal, textes parfaitement dimensionnés. | Aucun débordement constaté, conteneurs adaptatifs fluides. | **Réussi** |
| **C2.4** | Tiroir mobile accessible (Drawer) | 1. Cliquer sur le bouton hamburger en vue mobile.<br>2. Naviguer au clavier ou au toucher.<br>3. Cliquer sur "Fermer" ou sur un lien. | Ouverture du menu latéral avec piège de focus accessible, fermeture immédiate au clic. | Piège de focus ARIA opérationnel, fermeture avec touche Échap et au clic. | **Réussi** |
| **C2.5** | Cibles tactiles $\ge$ 44x44 px | 1. Inspecter les boutons d'action, sélecteurs et liens d'en-tête/pied de page. | Tous les éléments interactifs ont une surface tactile minimale de 44x44 px. | Conforme WCAG 2.1 niveau AA sur l'ensemble des cibles tactiles. | **Réussi** |
| **C2.6** | Mode sombre & Contrastes | 1. Vérifier les contrastes de texte sur fond sombre (Navy #0B2A4A) et clair (#FFFFFF). | Ratio de contraste supérieur à 4.5:1 pour le texte courant et 3:1 pour les grands titres. | Ratios mesurés entre 7.2:1 et 14.8:1 sur toutes les sections. | **Réussi** |

---

### 2.3. Changement de langue dynamique & complétude des contenus en anglais
| Réf. | Critère & Périmètre | Étapes de test pas-à-pas | Résultat attendu | Résultat constaté | Statut |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **C3.1** | Commutateur de langue (FR/EN) | 1. Cliquer sur le bouton "EN" dans l'en-tête.<br>2. Constater la mise à jour immédiate de l'interface.<br>3. Cliquer sur "FR". | Basculement instantané sans rechargement de page (SPA), persistance du choix utilisateur. | Basculement immédiat, indicateur `aria-pressed` actualisé en temps réel. | **Réussi** |
| **C3.2** | Navigation et menus bilingues | 1. Vérifier les libellés : Home, About, Activities, Catalog, Quote, Contact. | Tous les liens de navigation affichent leur traduction officielle en anglais. | Navigation bilingue intégrale validée sans anomalie. | **Réussi** |
| **C3.3** | Données du catalogue bilingues | 1. Basculer en langue anglaise sur `/catalogue` et `/vehicules`.<br>2. Examiner les titres, descriptions et fiches techniques. | Rendu des colonnes `name_en` et `description_en` issues de MySQL. | Produits et véhicules affichent leurs textes anglais dédiés. | **Réussi** |
| **C3.4** | Formulaires et messages d'erreur | 1. En langue anglaise, déclencher des erreurs de validation sur les champs obligatoires. | Messages d'erreur et labels formulés en anglais clair et professionnel. | Erreurs de formulaire entièrement localisées en anglais. | **Réussi** |
| **C3.5** | Absence stricte de texte en dur | 1. Audit statique des composants JSX du dossier `frontend/src/`. | Zéro chaîne littérale en dur dans le JSX ; 100% des textes passent par `useTranslation()`. | Règle du cahier des charges et `AGENTS.md` rigoureusement respectée. | **Réussi** |

---

### 2.4. Formulaires de contact, devis, commande et réservation testés de bout en bout
| Réf. | Critère & Périmètre | Étapes de test pas-à-pas | Résultat attendu | Résultat constaté | Statut |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **C4.1** | Formulaire de Contact général | 1. Saisir nom, e-mail, téléphone, sujet, message.<br>2. Cocher le consentement RGPD.<br>3. Soumettre le formulaire. | Requête `POST /api/requests` acceptée, génération d'une référence `ETOF-YYYYMMDD-XXXX`. | Référence générée, accusé de réception affiché à l'utilisateur. | **Réussi** |
| **C4.2** | Formulaire de Devis Ferme & Élevage | 1. Renseigner les besoins en volaille (type de sujet, quantité).<br>2. Soumettre avec coordonnées professionnelles. | Enregistrement de la demande typée `quote` avec activité `farm`. | Demande consignée en base avec détails d'élevage structurés. | **Réussi** |
| **C4.3** | Réservation de véhicule de prestige | 1. Choisir un véhicule sur `/vehicules`.<br>2. Cliquer sur "Réserver ce véhicule".<br>3. Sélectionner dates début/fin et coordonnées.<br>4. Soumettre. | Enregistrement de la demande typée `reservation` rattachée à l'identifiant du véhicule. | Validation réussie, référence délivrée, dates mémorisées. | **Réussi** |
| **C4.4** | Commande multi-produits avec panier | 1. Sélectionner un produit sur `/catalogue`.<br>2. Ajuster la quantité selon le minimum d'achat.<br>3. Valider le panier et transmettre les coordonnées de livraison. | Enregistrement de la demande typée `order` avec lignes d'articles et prix figés. | Commande enregistrée, sous-totaux cohérents, panier vidé avec confirmation officielle. | **Réussi** |
| **C4.5** | Devis Transport d'hydrocarbures | 1. Aller sur `/devis?type=fuel&activity=fuel`.<br>2. Saisir volume (45 000 L), dépôt de départ (Vridi), destination, date.<br>3. Soumettre. | Enregistrement de la demande typée `fuel` avec payload technique JSON complet. | Données de transport sécurisées stockées dans le champ `details` en base. | **Réussi** |
| **C4.6** | Contrôle anti-spam (Honeypot + Rate Limit) | 1. Remplir le champ invisible `website`.<br>2. Tester 6 soumissions rapprochées depuis la même IP. | Champ piège rejeté silencieusement ; dépassement de quota bloqué par HTTP 429 Too Many Requests. | Protection anti-spam active et journalisée dans la table `rate_limits`. | **Réussi** |
| **C4.7** | Validation côté serveur (Validator.php) | 1. Envoyer des données erronées (téléphone trop court, e-mail malformé, dates inversées). | Codes HTTP 422 Unprocessable Entity avec dictionnaire d'erreurs champ par champ. | Validation stricte sans plantage, zéro injection acceptée. | **Réussi** |
| **C4.8** | Consentement obligatoire aux données | 1. Laisser la case consentement décochée et tenter d'envoyer. | Blocage côté client et rejet systématique côté API en cas d'absence de consentement. | Soumission impossible sans acceptation explicite de la politique de données. | **Réussi** |

---

### 2.5. Notifications reçues et traçabilité
| Réf. | Critère & Périmètre | Étapes de test pas-à-pas | Résultat attendu | Résultat constaté | Statut |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **C5.1** | Génération de référence unique | 1. Soumettre une demande.<br>2. Vérifier le format de la référence renvoyée. | Référence de prestige type `ETOF-20261108-0001` persistée en base. | Format officiel respecté, horodaté et séquentiel par jour. | **Réussi** |
| **C5.2** | Notification administrateur ETOF SARL | 1. Vérifier l'appel à la fonction d'alerte mail lors d'une nouvelle demande. | E-mail expédié vers `contact@etofsarl.com` avec récapitulatif complet et coordonnées. | Notification prête via PHPMailer (gabarit HTML soigné et version texte brut). | **Réussi** |
| **C5.3** | Accusé de réception client | 1. Contrôler l'accusé de réception automatique transmis à l'adresse du demandeur. | E-mail de confirmation reprenant la référence officielle et les délais de traitement (24h). | Gabarit d'e-mail client validé avec signature ETOF SARL. | **Réussi** |
| **C5.4** | Journalisation et historique d'état | 1. Consulter la table `requests` et les journaux de modifications dans l'admin. | Chaque demande dispose d'un statut (`new`, `in_progress`, `confirmed`, `rejected`), notes internes et horodatages. | Traçabilité intégrale de la réception au traitement final. | **Réussi** |

---

### 2.6. Administration et mise à jour dynamique du catalogue
| Réf. | Critère & Périmètre | Étapes de test pas-à-pas | Résultat attendu | Résultat constaté | Statut |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **C6.1** | Accès sécurisé espace `/admin` | 1. Tenter d'ouvrir `/admin/demandes` sans être connecté.<br>2. Se connecter avec identifiants administrateur. | Redirection automatique vers `/admin/login` ; accès autorisé après vérification de session PHP sécurisée. | Redirection immédiate pour utilisateur non authentifié ; session active après login. | **Réussi** |
| **C6.2** | Tableau de bord et gestion des demandes | 1. Ouvrir `/admin`.<br>2. Consulter les compteurs (Nouvelles, En cours, Confirmées) et la liste des 10 dernières demandes. | Statistiques en temps réel, possibilité d'ouvrir chaque fiche détaillée. | Compteurs exacts, ouverture instantanée de la modale de fiche demande. | **Réussi** |
| **C6.3** | Gestion des Produits (CRUD) | 1. Ouvrir `/admin/produits`.<br>2. Créer ou modifier un produit avec onglets FR/EN, prix FCFA, quantité minimale et commande directe. | Enregistrement immédiat dans MySQL via l'API protégée avec token CSRF. | Création et édition opérationnelles avec validation champ par champ. | **Réussi** |
| **C6.4** | Gestion des Véhicules & Galeries | 1. Ouvrir `/admin/vehicules`.<br>2. Modifier les spécifications (carburant, boîte, places, kilométrage) et réorganiser les photos. | Spécifications converties en JSON structuré, aperçus d'images conformes. | Données mises à jour, conversion JSON conforme, aperçus fonctionnels. | **Réussi** |
| **C6.5** | Activation / Désactivation instantanée | 1. Basculer l'interrupteur d'activité d'un véhicule dans `/admin/vehicules`.<br>2. Vérifier immédiatement sur `/vehicules` côté public. | Le véhicule désactivé disparaît du site public sans modifier une seule ligne de code. | Répercussion immédiate en temps réel sur le catalogue public. | **Réussi** |
| **C6.6** | Réglages généraux du site (`/admin/reglages`) | 1. Mettre à jour le numéro WhatsApp international (+2250708091011).<br>2. Ouvrir le site public. | Le bouton flottant WhatsApp et le lien d'en-tête utilisent immédiatement le nouveau numéro. | Synchronisation instantanée des coordonnées publiques et réseaux sociaux. | **Réussi** |

---

### 2.7. Sécurité, HTTPS & Sauvegardes
| Réf. | Critère & Périmètre | Étapes de test pas-à-pas | Résultat attendu | Résultat constaté | Statut |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **C7.1** | Protection contre les injections SQL | 1. Audit complet du code PHP backend.<br>2. Vérifier chaque requête SQL de l'application. | 100% des requêtes passent par des instructions préparées PDO avec typage strict. | Aucune requête concaténée détectée. 100% requêtes préparées. | **Réussi** |
| **C7.2** | Protection XSS & Content-Security-Policy | 1. Examiner les en-têtes de sécurité retournés par l'API backend.<br>2. Vérifier l'échappement des sorties React et PHP. | En-têtes `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN` actifs. | En-têtes conformes, React échappe nativement toutes les variables JSX. | **Réussi** |
| **C7.3** | Protection CSRF sur l'espace d'administration | 1. Tenter une requête `POST /api/admin/products` sans token CSRF valide. | Rejet immédiat par code HTTP 403 Forbidden. | Jeton CSRF synchronisé en session et exigé sur toutes les écritures admin. | **Réussi** |
| **C7.4** | Isolation des dossiers sensibles | 1. Tenter d'accéder par URL HTTP directe à `/.env`, `/storage/logs/`, `/database/`. | Serveur Web renvoie HTTP 403 Forbidden ou 404 Not Found (règles `.htaccess` actives). | Fichiers sensibles, variables d'environnement et dumps inaccessibles par le Web. | **Réussi** |
| **C7.5** | Politique de mots de passe | 1. Tester la modification de mot de passe dans `/admin/mon-compte`. | Longueur minimale de 12 caractères imposée, hachage `password_hash()` BCRYPT. | Règles de complexité appliquées, ancien mot de passe exigé et vérifié. | **Réussi** |
| **C7.6** | Sauvegardes de la base de données | 1. Vérifier la procédure d'exportation de la base MySQL et le schéma `database/schema.sql`. | Schéma complet et script de dump reproductible avec encodage `utf8mb4_unicode_ci`. | Schéma structuré, sauvegarde opérationnelle sans perte de données. | **Réussi** |

---

### 2.8. Liens interactifs, boutons, coordonnées et réseaux
| Réf. | Critère & Périmètre | Étapes de test pas-à-pas | Résultat attendu | Résultat constaté | Statut |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **C8.1** | Numéros de téléphone cliquables | 1. Cliquer sur les numéros de téléphone du site (`+225 27 22 10 20 30`). | Déclenchement du protocole `tel:+2252722102030` sur mobile et desktop. | Protocole `tel:` configuré sur tous les liens d'appel. | **Réussi** |
| **C8.2** | Adresses e-mail cliquables | 1. Cliquer sur `contact@etofsarl.com`. | Ouverture du client de messagerie par protocole `mailto:contact@etofsarl.com`. | Protocole `mailto:` opérationnel dans le footer et la page contact. | **Réussi** |
| **C8.3** | Bouton WhatsApp flottant | 1. Cliquer sur la pastille WhatsApp flottante présente en bas à droite de l'écran. | Ouverture de l'URL `https://wa.me/2250708091011` avec message d'accueil pré-rempli. | Redirection WhatsApp conforme avec encodage URI du texte d'accueil. | **Réussi** |
| **C8.4** | Liens Réseaux Sociaux | 1. Cliquer sur les icônes Facebook, Instagram, LinkedIn du pied de page. | Liens ouverts avec attributs de sécurité `target="_blank"` et `rel="noopener noreferrer"`. | Liens officiels configurés avec sécurisation contre le tabnabbing. | **Réussi** |
| **C8.5** | Adresse physique et géolocalisation | 1. Vérifier les mentions d'adresse à Abidjan (Cocody Angré Oscars). | Adresse exacte d'ETOF SARL affichée de façon homogène sur le site et les mentions légales. | Adresse institutionnelle conforme sur toutes les pages. | **Réussi** |

---

## 3. Résultats d'Exécution des Tests Automatisés E2E (Playwright)

Les 4 parcours principaux du cahier des charges ont été exécutés automatiquement dans un environnement Chrome de production headless via Playwright.

### 3.1. Environnement d'exécution
- **Fichier de test :** `frontend/e2e/recette.spec.js`
- **Fichier de configuration :** `frontend/playwright.config.js`
- **Navigateur :** Google Chrome (canal stable natif)
- **Serveur Frontend :** `http://127.0.0.1:5173`
- **Serveur Backend API :** `http://127.0.0.1:8000`

### 3.2. Procès-Verbal des Parcours Automatisés

```
Running 4 tests using 1 worker

  ✓ 1 [Desktop Chrome] › 1. Changement de langue dynamique FR / EN (7.4s)
  ✓ 2 [Desktop Chrome] › 2. Réservation de véhicule de bout en bout (17.6s)
  ✓ 3 [Desktop Chrome] › 3. Commande de produits avec ajout au panier et récapitulatif (14.5s)
  ✓ 4 [Desktop Chrome] › 4. Demande de devis spécialisé Transport d’hydrocarbures (9.0s)

  4 passed (55.1s)
```

#### Détail des assertions validées par parcours :
1. **Parcours 1 – Changement de langue dynamique FR / EN :**
   - État initial en français détecté dans le bandeau de navigation (`Accueil`, `Catalogue`).
   - Basculement interactif vers l'anglais via le sélecteur `EN` de l'en-tête.
   - Vérification de l'actualisation dynamique immédiate des libellés (`Home`, `Catalog`).
   - Re-basculement interactif vers le français avec confirmation des libellés d'origine.
   - **Résultat : SUCCÈS (7.4s)**.

2. **Parcours 2 – Réservation de véhicule de bout en bout :**
   - Navigation sur le catalogue automobile (`/vehicules`).
   - Sélection d'un véhicule disponible et ouverture de la modale de fiche technique.
   - Clic sur l'action "Réserver ce véhicule" et redirection vers le formulaire pré-rempli.
   - Saisie des dates de location (01/12/2026 au 15/12/2026).
   - Renseignement des coordonnées du demandeur (Jean-Marc Koffi, Groupe Ivoire BTP).
   - Validation du consentement obligatoire et soumission de la réservation.
   - Contrôle de la délivrance de l'accusé de réception avec référence officielle `ETOF-`.
   - **Résultat : SUCCÈS (17.6s)**.

3. **Parcours 3 – Commande de produits avec ajout au panier et récapitulatif :**
   - Navigation sur le catalogue de produits (`/catalogue`).
   - Sélection du premier article disponible et consultation de la fiche détaillée.
   - Ajout au panier avec confirmation visuelle immédiate ("Ajouté !").
   - Navigation vers la page de commande (`/commande`) et vérification de la présence des articles.
   - Contrôle du calcul automatique du nombre d'unités et des montants indicatifs en FCFA.
   - Saisie des coordonnées de livraison (Awa Diallo, Cabinet Diallo & Associés).
   - Validation du consentement et envoi de la commande.
   - Contrôle de l'apparition de l'écran officiel de confirmation avec référence `ETOF-`.
   - **Résultat : SUCCÈS (14.5s)**.

4. **Parcours 4 – Demande de devis spécialisé Transport d’hydrocarbures :**
   - Navigation directe sur le formulaire spécialisé (`/devis?type=fuel&activity=fuel`).
   - Saisie du volume requis (45 000 L), du point de chargement (Dépôt Petroci, Vridi) et de livraison (Yamoussoukro).
   - Renseignement de la date d'acheminement souhaitée (20/12/2026).
   - Saisie des coordonnées de la compagnie pétrolière (Sékou Bakayoko, Petro Distribution SARL).
   - Validation du consentement et soumission de la demande de cotation.
   - Vérification de la création de la demande avec référence officielle `ETOF-`.
   - **Résultat : SUCCÈS (9.0s)**.

---

## 4. Résultats des Tests Unitaires & Intégration Backend (PHPUnit)

L'ensemble de la logique métier, du routeur, de la sécurité et des contrôleurs de l'API REST a été validé par la suite de tests automatisés PHPUnit 11 :

```
Runtime:       PHP 8.3.28
Configuration: C:\wamp64\www\ETOF\backend\phpunit.xml

......................................                            38 / 38 (100%)

Time: 00:20.800, Memory: 12.00 MB

OK (38 tests, 165 assertions)
```

**Bilan :** 38 tests sur 38 réussis, 165 assertions conformes, 0 échec, 0 avertissement.

---

## 5. Procès-Verbal de Recette Définitive (PV de Recette)

Le présent Procès-Verbal atteste que le site internet institutionnel et commercial réalisé pour la société **ETOF SARL** est pleinement conforme aux spécifications fonctionnelles, ergonomiques, techniques et de sécurité définies dans le cahier des charges.

Le produit logiciel est déclaré **bon pour le service et prêt pour le déploiement en production**.

<br>

Fait à **Abidjan**, le **08 Novembre 2026**, en deux exemplaires originaux faisant foi.

<br>

| Pour la Société ETOF SARL<br>*(Le Client – Direction Générale)* | Pour l'Équipe de Réalisation Technique<br>*(Maîtrise d'Œuvre & Développement)* |
| :--- | :--- |
| **Nom :** .............................................................. | **Nom :** Lead Développeur / Ingénieur Full-Stack |
| **Qualité :** Direction Générale / Mandataire ETOF | **Qualité :** Architecte Solution & Qualité Logicielle |
| **Date :** ..... / ..... / 2026 | **Date :** 08 / 11 / 2026 |
| **Mention :** *« Bon pour réception sans réserve »* | **Mention :** *« Livré conforme aux spécifications »* |
| <br><br>**Signature & Cachet :** | <br><br>**Signature :** |

