# Guide du Référencement Naturel (SEO) – ETOF SARL

Ce document détaille la stratégie et l'architecture SEO déployées pour le site vitrine et commercial d'**ETOF SARL**, les démarches d'enregistrement auprès de **Google Search Console**, ainsi que les options recommandées pour ajouter une pré-génération statique (SSG / Prerendering) des pages publiques.

---

## 1. Architecture SEO en Place

### 1.1 Composant `<Seo />` Centralisé (`frontend/src/components/common/Seo.jsx`)
Chaque vue de l'application React intègre le composant `<Seo />` propulsé par `react-helmet-async`. Ce composant configure automatiquement dans l'en-tête `<head>` :
- **Attribut de langue** : `<html lang="fr">` ou `<html lang="en">` synchronisé avec `react-i18next`.
- **Titre de page unique (`<title>`)** : Titre explicite suffixé du nom institutionnel `ETOF SARL`.
- **Méta-description unique (`<meta name="description">`)** : Synthèse percutante adaptée à la page et à la langue active.
- **Directives pour les robots** : `<meta name="robots" content="index, follow">` (ou `noindex, follow` pour la 404).
- **URL Canonique** : `<link rel="canonical" href="...">` pointant vers l'URL absolue normalisée sans paramètres superflus.
- **Balises d'alternance linguistique (`hreflang`)** :
  - `<link rel="alternate" hreflang="fr" href="..." />`
  - `<link rel="alternate" hreflang="en" href="..." />`
  - `<link rel="alternate" hreflang="x-default" href="..." />`
- **Réseaux sociaux & Messageries (Open Graph & Twitter Cards)** :
  - `og:site_name`, `og:type`, `og:url`, `og:title`, `og:description`, `og:image`, `og:locale`, `og:locale:alternate`.
  - `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`.
- **Données Structurées JSON-LD (`schema.org`)** :
  - Schéma `Organization` : raison sociale, logo officiel, description, coordonnées et profils sociaux d'ETOF SARL.
  - Schéma `LocalBusiness` : ancrage géographique à Abidjan (Cocody Angré Oscars, Côte d'Ivoire), géolocalisation indicative et horaires d'ouverture.

### 1.2 URLs Lisibles et Partageables
Toutes les routes publiques utilisent des chemins sémantiques en minuscules sans identifiants opaques :
- `/` : Accueil
- `/a-propos` : Présentation institutionnelle
- `/activites/ferme` : Pôle Ferme & Élevage
- `/activites/vehicules` : Pôle Vente & Location de Véhicules
- `/activites/fournitures` : Pôle Fournitures de Bureau
- `/activites/hydrocarbures` : Pôle Transport d'Hydrocarbures
- `/catalogue` et `/catalogue/:slug` : Catalogue de produits
- `/vehicules` et `/vehicules/:slug` : Parc automobile
- `/devis` : Formulaires unifiés
- `/commande` : Récapitulatif de commande
- `/contact` : Coordonnées, accès direct et carte
- `/mentions-legales`, `/politique-de-confidentialite`, `/conditions-generales` : Pages légales

### 1.3 Optimisation des Images & Core Web Vitals
- **Dimensions explicites** : Tous les éléments `<img>` (cartes produits, cartes véhicules, miniatures de galerie, récapitulatif de panier) comportent des attributs `width` et `height` pour éliminer le décalage de mise en page (*Cumulative Layout Shift* - CLS).
- **Chargement différé (`loading="lazy"`)** : Toutes les images situées sous la ligne de flottaison intègrent `loading="lazy"` afin d'optimiser le temps de chargement initial (*Largest Contentful Paint* - LCP) et d'économiser la bande passante sur mobile.

---

## 2. Sitemaps et Fichier `robots.txt`

### 2.1 Sitemaps bilingues (FR / EN)
1. **Sitemap statique (`sitemap.xml`)** :
   - Fichier XML généré automatiquement lors du build Vite via le script `frontend/scripts/generate-sitemap.js`.
   - Couvre l'ensemble des routes statiques en intégrant les balises `<xhtml:link rel="alternate" hreflang="...">`.
2. **Sitemap dynamique (`backend/public/sitemap-dynamic.php`)** :
   - Script PHP autonome qui interroge la base de données MySQL en temps réel.
   - Agrège les pages statiques ainsi que l'ensemble des fiches produits (`/catalogue/{slug}`) et des fiches véhicules (`/vehicules/{slug}`) actives avec leur date de dernière mise à jour (`lastmod`).
   - Accessible directement via l'URL : `https://www.etofsarl.com/sitemap-dynamic.php`.

### 2.2 Fichier `robots.txt`
Déployé à la racine publique (`frontend/public/robots.txt` et `backend/public/robots.txt`) :
```txt
User-agent: *
Disallow: /admin
Disallow: /admin/
Disallow: /api
Disallow: /api/

# Sitemaps officiels ETOF SARL (bilingues FR / EN)
Sitemap: https://www.etofsarl.com/sitemap.xml
Sitemap: https://www.etofsarl.com/sitemap-dynamic.php
```
Ce fichier garantit l'interdiction d'exploration de l'espace d'administration et des points de terminaison techniques de l'API REST par les robots d'indexation.

---

## 3. Déclaration du Site dans Google Search Console

Suivez ces étapes pour déclarer officiellement le site d'ETOF SARL auprès de Google :

### Étape 1 : Connexion et ajout de la propriété
1. Rendez-vous sur [Google Search Console](https://search.google.com/search-console).
2. Connectez-vous avec le compte Google professionnel de l'entreprise.
3. Cliquez sur **Ajouter la propriété**.
4. Choisissez le type **Domaine** (recommandé pour couvrir `https://etofsarl.com`, `https://www.etofsarl.com`, ainsi que les sous-domaines) ou **Préfixe de l'URL** (`https://www.etofsarl.com`).

### Étape 2 : Validation de la propriété
- **Validation DNS (Type Domaine - Recommandé)** :
  1. Copiez l'enregistrement `TXT` fourni par Google (ex. `google-site-verification=xxxxxxxxxxxxxxxx`).
  2. Connectez-vous à l'espace d'administration du bureau d'enregistrement DNS du domaine (ex. OVH, GoDaddy, Hostinger).
  3. Ajoutez un enregistrement de type `TXT` à la racine de la zone DNS avec la valeur fournie.
  4. Cliquez sur **Valider** dans Google Search Console (la propagation DNS peut prendre de quelques minutes à 24 heures).
- **Validation alternative (Balise HTML ou Fichier)** :
  1. Si la validation par préfixe d'URL est retenue, vous pouvez placer la balise méta `<meta name="google-site-verification" content="..." />` dans `frontend/index.html` ou déposer le fichier de validation dans `frontend/public/`.

### Étape 3 : Soumission des sitemaps
1. Dans le menu de gauche de Search Console, rendez-vous dans la section **Indexation** > **Sitemaps**.
2. Dans le champ « Ajouter un sitemap », saisissez :
   - `sitemap.xml` puis cliquez sur **Envoyer**.
   - `sitemap-dynamic.php` puis cliquez sur **Envoyer**.
3. Vérifiez que l'état affiche **Opération réussie** et le nombre d'URL découvertes.

### Étape 4 : Inspection et demande d'indexation des pages clés
1. Utilisez l'outil **Inspection de l'URL** en haut de la console.
2. Testez l'URL de la page d'accueil : `https://www.etofsarl.com/`.
3. Cliquez sur **Tester l'URL en direct** pour vérifier le rendu HTML et l'absence d'erreurs d'exploration.
4. Cliquez sur **Demander l'indexation**.
5. Répétez l'opération pour les pages piliers : `/catalogue`, `/vehicules`, `/a-propos`, `/contact`.

---

## 4. Pré-génération des Pages Publiques (SSG / Prerendering)

Le site d'ETOF SARL est actuellement une Single Page Application (SPA) propulsée par React et Vite. Bien que Googlebot exécute désormais le JavaScript moderne, la pré-génération statique (Static Site Generation ou Prerendering) apporte des avantages majeurs :
- Vitesse d'affichage quasi instantanée (First Contentful Paint < 0.5s).
- Indexation garantie à 100% par l'ensemble des moteurs de recherche (Bing, Yahoo, DuckDuckGo, Yandex).
- Prévisualisations parfaites des cartes de partage lors de l'envoi de liens sur WhatsApp, Facebook, LinkedIn et Twitter (qui ne disposent pas de moteur d'exécution JavaScript lors du crawl des métadonnées).

### Option A : Prerendering au build avec Puppeteer (Recommandé pour Vite)
Cette approche consiste à générer des fichiers HTML statiques prêts à l'emploi dans le dossier `dist/` pour chaque route publique lors de la commande `npm run build`.

#### Procédure d'installation future :
1. Installer le plugin Vite adapté (soumis à validation préalable de l'utilisateur) :
   ```bash
   npm install --save-dev vite-plugin-prerender
   ```
2. Mettre à jour `vite.config.js` :
   ```javascript
   import { defineConfig } from 'vite';
   import react from '@vitejs/plugin-react';
   import path from 'path';
   import vitePrerender from 'vite-plugin-prerender';

   export default defineConfig({
     plugins: [
       react(),
       vitePrerender({
         staticDir: path.join(__dirname, 'dist'),
         routes: [
           '/',
           '/a-propos',
           '/activites/ferme',
           '/activites/vehicules',
           '/activites/fournitures',
           '/activites/hydrocarbures',
           '/catalogue',
           '/vehicules',
           '/devis',
           '/contact',
           '/mentions-legales',
           '/politique-de-confidentialite',
           '/conditions-generales'
         ],
         renderer: '@prerenderer/renderer-puppeteer',
         rendererOptions: {
           renderAfterDocumentEvent: 'custom-render-trigger',
           headless: true
         }
       })
     ]
   });
   ```

### Option B : Prerender à la volée via Apache / Nginx (Serveur Web)
Si l'hébergement de production repose sur un serveur Apache ou Nginx avec le backend PHP :
1. Configurer un middleware ou une règle de réécriture Apache dans `.htaccess` détectant les User-Agents des robots (`Googlebot`, `bingbot`, `Twitterbot`, `facebookexternalhit`, `WhatsApp`, `LinkedInBot`).
2. Rediriger ces robots vers un service de rendu comme [Prerender.io](https://prerender.io/) ou une fonction Node locale exécutant Chromium pour leur servir le snapshot HTML complet.
3. Les utilisateurs réguliers continuent de recevoir la SPA React standard fluide et interactive.

### Option C : Migration progressive vers le SSR ou un framework hybride
Si les besoins de catalogue temps réel deviennent massifs (> 10 000 références), une transition vers une solution avec Server-Side Rendering (Node.js ou Remix/Next.js) pourra être envisagée, tout en conservant la structure actuelle des composants et des feuilles de style CSS Modules.

