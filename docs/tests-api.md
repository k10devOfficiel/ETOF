# Guide Exhaustif des Tests d'API – Site Internet ETOF SARL

Ce document fournit la documentation complète et opérationnelle de **l'intégralité des routes de l'API REST backend** d'ETOF SARL.
Chaque endpoint est documenté avec sa méthode, son URL, ses en-têtes requis, un exemple de commande `curl` et un exemple concret de réponse JSON standardisée.

---

## Sommaire des Endpoints de l'API

| Méthode | Route | Description | Authentification |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Vérification de santé et connectivité BDD | Publique |
| `GET` | `/api/settings` | Paramètres publics de l'entreprise | Publique |
| `GET` | `/api/categories` | Liste des catégories par pôle d'activité | Publique |
| `GET` | `/api/products` | Catalogue paginé des produits avec filtres | Publique |
| `GET` | `/api/products/{slug}` | Fiche détaillée d'un produit par slug | Publique |
| `GET` | `/api/vehicles` | Parc paginé des véhicules avec filtres | Publique |
| `GET` | `/api/vehicles/{slug}` | Fiche détaillée d'un véhicule avec specs et photos | Publique |
| `POST` | `/api/requests` | Soumission de devis, commande, réservation ou contact | Publique |
| `GET` | `/api/admin/csrf` | Génération et obtention du jeton CSRF | Publique / Session |
| `POST` | `/api/admin/login` | Connexion administrateur avec régénération de session | Publique / Limité |
| `GET` | `/api/admin/me` | Informations de session de l'administrateur connecté | Admin Session |
| `POST` | `/api/admin/logout` | Déconnexion et destruction de la session | Admin + CSRF |
| `GET` | `/api/admin/products` | Liste administrative complète des produits | Admin Session |
| `POST` | `/api/admin/products` | Création d'un nouveau produit | Admin + CSRF |
| `PUT` | `/api/admin/products/{id}` | Mise à jour d'un produit existant | Admin + CSRF |
| `DELETE` | `/api/admin/products/{id}` | Désactivation douce ou suppression définitive d'un produit | Admin + CSRF |
| `POST` | `/api/admin/upload` | Téléversement d'image produit avec assainissement GD | Admin + CSRF |
| `GET` | `/api/admin/vehicles` | Liste administrative complète des véhicules | Admin Session |
| `POST` | `/api/admin/vehicles` | Création d'un véhicule avec specs JSON | Admin + CSRF |
| `PUT` | `/api/admin/vehicles/{id}` | Mise à jour d'un véhicule existant | Admin + CSRF |
| `DELETE` | `/api/admin/vehicles/{id}` | Désactivation douce ou suppression définitive avec cascade | Admin + CSRF |
| `POST` | `/api/admin/vehicles/{id}/images` | Ajout d'une photo à la galerie d'un véhicule | Admin + CSRF |
| `DELETE` | `/api/admin/vehicles/{id}/images/{image_id}` | Suppression d'une photo de galerie et purge fichier | Admin + CSRF |
| `GET` | `/api/admin/stats` | Comptages agrégés des demandes par statut et pôle | Admin Session |
| `GET` | `/api/admin/requests/export` | Export CSV Excel (BOM UTF-8, séparateur `;`) | Admin Session |
| `GET` | `/api/admin/requests` | Liste administrative filtrée et paginée des demandes | Admin Session |
| `GET` | `/api/admin/requests/{id}` | Détail complet d'une demande avec véhicule et articles | Admin Session |
| `PATCH` | `/api/admin/requests/{id}` | Mise à jour du statut, note interne et véhicule lié | Admin + CSRF |

---

## 1. Routes Publiques Générales

### 1.1 GET `/api/health`
Vérifie la disponibilité de l'API et la liaison active avec MySQL 8.

```bash
curl -i http://localhost:8000/api/health
```

**Réponse HTTP 200 OK :**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "service": "ETOF Backend API",
    "environment": "dev",
    "database": {
      "connected": true
    },
    "language": "fr",
    "timestamp": "2026-11-08T12:00:00+00:00"
  },
  "error": null
}
```

---

### 1.2 GET `/api/settings`
Expose les coordonnées officielles et réseaux sociaux publics de l'entreprise.

```bash
curl -i http://localhost:8000/api/settings
```

**Réponse HTTP 200 OK :**
```json
{
  "success": true,
  "data": {
    "phone": "+225 07 00 00 00 00",
    "whatsapp": "+225 07 00 00 00 00",
    "email": "contact@etofsarl.com",
    "address": "Abidjan, Cocody, Angré Oscars",
    "facebook": "",
    "instagram": "",
    "linkedin": ""
  },
  "error": null
}
```

---

### 1.3 GET `/api/categories`
Liste les catégories ordonnées par `sort_order`, avec filtre optionnel par pôle d'activité (`farm`, `vehicle`, `office`) et langue (`lang=fr` ou `lang=en`).

```bash
curl -i "http://localhost:8000/api/categories?activity=farm&lang=fr"
```

**Réponse HTTP 200 OK :**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "activity": "farm",
      "slug": "volailles",
      "name": "Volailles",
      "sort_order": 1
    },
    {
      "id": 2,
      "activity": "farm",
      "slug": "oeufs",
      "name": "Œufs",
      "sort_order": 2
    }
  ],
  "error": null
}
```

---

## 2. Catalogue Produits et Parc Véhicules (Public)

### 2.1 GET `/api/products`
Liste paginée des produits avec filtres : `category` (slug ou alias bilingue), `q` (recherche texte), `available` (0 ou 1), `page`, `per_page` et `lang`.

```bash
curl -i "http://localhost:8000/api/products?lang=fr&category=oeufs&page=1&per_page=12"
```

**Réponse HTTP 200 OK :**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 5,
        "slug": "oeufs-frais-de-caille",
        "reference": "DEMO-FARM-005",
        "name": "[DEMO] Œufs frais de caille (plaquette de 30)",
        "description": "Œufs de caille extra-frais du jour, calibrés et conditionnés.",
        "unit": "plaquette",
        "price": null,
        "min_quantity": 5,
        "is_orderable": true,
        "is_available": true,
        "image": "/uploads/demo/oeufs-caille.jpg",
        "sort_order": 5,
        "created_at": "2026-11-08 12:00:00",
        "category": {
          "id": 2,
          "slug": "oeufs",
          "name": "Œufs",
          "activity": "farm"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "per_page": 12,
      "total": 1,
      "total_pages": 1
    }
  },
  "error": null
}
```

---

### 2.2 GET `/api/products/{slug}`
Consultation unitaire de la fiche produit. Retourne 404 si inactif ou introuvable.

```bash
curl -i http://localhost:8000/api/products/oeufs-frais-de-caille
```

**Réponse HTTP 200 OK :**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "slug": "oeufs-frais-de-caille",
    "reference": "DEMO-FARM-005",
    "name": "[DEMO] Œufs frais de caille (plaquette de 30)",
    "description": "Œufs de caille extra-frais du jour, calibrés et conditionnés.",
    "unit": "plaquette",
    "price": null,
    "min_quantity": 5,
    "is_orderable": true,
    "is_available": true,
    "image": "/uploads/demo/oeufs-caille.jpg",
    "sort_order": 5,
    "created_at": "2026-11-08 12:00:00",
    "category": {
      "id": 2,
      "slug": "oeufs",
      "name": "Œufs",
      "activity": "farm"
    }
  },
  "error": null
}
```

---

### 2.3 GET `/api/vehicles`
Parc paginé des véhicules avec filtres : `type` (slug catégorie), `mode` (`sale`, `rental`, `both`), `status` (`available`, `reserved`, `sold`, `unavailable`), `brand`, `page`, `per_page`.

```bash
curl -i "http://localhost:8000/api/vehicles?mode=rental&lang=fr"
```

**Réponse HTTP 200 OK :**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "slug": "toyota-land-cruiser-prado-txl",
        "brand": "Toyota",
        "model": "Land Cruiser Prado TXL [DEMO]",
        "year": 2024,
        "mode": "both",
        "status": "available",
        "price_sale": null,
        "price_rental_day": null,
        "description": "Véhicule tout-terrain de prestige, tout confort pour missions professionnelles.",
        "main_image": "/uploads/demo/prado-1.jpg",
        "created_at": "2026-11-08 12:00:00",
        "category": {
          "id": 4,
          "slug": "suv-et-4x4",
          "name": "SUV et 4x4"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "per_page": 12,
      "total": 2,
      "total_pages": 1
    }
  },
  "error": null
}
```

---

### 2.4 GET `/api/vehicles/{slug}`
Fiche détaillée incluant la galerie photo complète ordonnée et l'objet JSON `specs`.

```bash
curl -i http://localhost:8000/api/vehicles/toyota-land-cruiser-prado-txl
```

**Réponse HTTP 200 OK :**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "slug": "toyota-land-cruiser-prado-txl",
    "brand": "Toyota",
    "model": "Land Cruiser Prado TXL [DEMO]",
    "year": 2024,
    "mode": "both",
    "status": "available",
    "price_sale": null,
    "price_rental_day": null,
    "specs": {
      "fuel": "Diesel",
      "transmission": "Automatique",
      "seats": 7,
      "mileage": "15 000 km"
    },
    "description": "Véhicule tout-terrain de prestige, tout confort pour missions professionnelles.",
    "created_at": "2026-11-08 12:00:00",
    "category": {
      "id": 4,
      "slug": "suv-et-4x4",
      "name": "SUV et 4x4"
    },
    "images": [
      {
        "id": 1,
        "path": "/uploads/demo/prado-1.jpg",
        "alt": "Toyota Land Cruiser Prado - Vue avant 3/4",
        "sort_order": 1
      }
    ]
  },
  "error": null
}
```

---

## 3. Demandes Clients (POST /api/requests)

Reçoit les soumissions unifiées : devis (`quote`), commande (`order`), réservation (`reservation`), achat (`purchase`) ou contact (`contact`).

### 3.1 Réservation de Véhicule Valide
```bash
curl -i -X POST http://localhost:8000/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "type": "reservation",
    "activity": "vehicle",
    "lang": "fr",
    "full_name": "Kouamé Jean",
    "company": "Société BTP",
    "email": "jean.kouame@example.ci",
    "phone": "+225 07 01 02 03 04",
    "message": "Réservation terrain.",
    "vehicle_id": 1,
    "start_date": "2026-12-01",
    "end_date": "2026-12-05",
    "consent": true,
    "website": ""
  }'
```

**Réponse HTTP 201 Created :**
```json
{
  "success": true,
  "data": {
    "reference": "ETOF-2026-00001",
    "message": "Votre demande a été enregistrée avec succès sous la référence ETOF-2026-00001.",
    "created_at": "2026-11-08T12:40:49+00:00"
  },
  "error": null
}
```

---

### 3.2 Commande de Produits avec Snapshots
```bash
curl -i -X POST http://localhost:8000/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "type": "order",
    "activity": "farm",
    "lang": "fr",
    "full_name": "Aïcha Traoré",
    "email": "aicha.traore@example.ci",
    "phone": "07 10 20 30 40",
    "consent": true,
    "items": [
      { "product_id": 1, "quantity": 10 }
    ]
  }'
```

**Réponse HTTP 201 Created :**
```json
{
  "success": true,
  "data": {
    "reference": "ETOF-2026-00002",
    "message": "Votre demande a été enregistrée avec succès sous la référence ETOF-2026-00002.",
    "created_at": "2026-11-08T12:41:00+00:00"
  },
  "error": null
}
```

---

### 3.3 Devis Hydrocarbures (Pôle Fuel)
```bash
curl -i -X POST http://localhost:8000/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "type": "quote",
    "activity": "fuel",
    "lang": "en",
    "full_name": "International Haulage Ltd",
    "email": "dispatch@haulage.com",
    "phone": "+225 27 20 00 00 00",
    "consent": true,
    "details": {
      "service_type": "heavy_fuel_transport",
      "estimated_volume": "50 000 Litres",
      "origin": "Vridi Depot",
      "destination": "San Pedro",
      "desired_date": "2026-12-10"
    }
  }'
```

---

### 3.4 Erreur de Validation (Ex: Dates Inversées)
```bash
curl -i -X POST http://localhost:8000/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "type": "reservation",
    "activity": "vehicle",
    "full_name": "Test Invalide",
    "email": "test@test.ci",
    "phone": "0701020304",
    "vehicle_id": 1,
    "start_date": "2026-12-10",
    "end_date": "2026-12-01",
    "consent": true
  }'
```

**Réponse HTTP 422 Unprocessable Entity :**
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Les données transmises sont incomplètes ou invalides.",
    "fields": {
      "end_date": [
        "La date de fin doit être postérieure ou égale à la date de début."
      ]
    }
  }
}
```

---

## 4. Authentification et Sécurité Administrateur

### 4.1 GET `/api/admin/csrf`
Retourne le jeton CSRF de la session en cours.

```bash
curl -i -c cookies.txt http://localhost:8000/api/admin/csrf
```

**Réponse HTTP 200 OK :**
```json
{
  "success": true,
  "data": {
    "csrf_token": "ae637693606686ebab561c17493aa320e3a8f6235b95790d5b6bada53a3d8d71"
  },
  "error": null
}
```

---

### 4.2 POST `/api/admin/login`
Authentifie l'administrateur, régénère l'ID de session et délivre le jeton CSRF.

```bash
curl -i -b cookies.txt -c cookies.txt -X POST http://localhost:8000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@etofsarl.com",
    "password": "Password12345!"
  }'
```

**Réponse HTTP 200 OK :**
```json
{
  "success": true,
  "data": {
    "admin": {
      "id": 1,
      "email": "admin@etofsarl.com",
      "name": "Administrateur ETOF"
    },
    "csrf_token": "ae637693606686ebab561c17493aa320e3a8f6235b95790d5b6bada53a3d8d71",
    "message": "Connexion réussie."
  },
  "error": null
}
```

---

### 4.3 GET `/api/admin/me`
Consultation des informations de l'administrateur connecté.

```bash
curl -i -b cookies.txt http://localhost:8000/api/admin/me
```

**Réponse HTTP 200 OK :**
```json
{
  "success": true,
  "data": {
    "admin": {
      "id": 1,
      "email": "admin@etofsarl.com",
      "name": "Administrateur ETOF",
      "last_login_at": "2026-11-08 12:45:00"
    }
  },
  "error": null
}
```

*(Si non authentifié : HTTP 401 Unauthorized `{"success": false, "data": null, "error": {"code": "UNAUTHORIZED", "message": "Authentification requise pour accéder à cette ressource."}}`)*

---

### 4.4 POST `/api/admin/logout`
Détruit la session administrateur et purge les cookies.

```bash
curl -i -b cookies.txt -c cookies.txt -X POST http://localhost:8000/api/admin/logout \
  -H "X-CSRF-Token: <VOTRE_JETON_CSRF>"
```

**Réponse HTTP 200 OK :**
```json
{
  "success": true,
  "data": {
    "message": "Déconnexion effectuée avec succès."
  },
  "error": null
}
```

---

## 5. Gestion Administrative des Produits

### 5.1 GET `/api/admin/products`
Liste administrative complète incluant les articles inactifs, avec pagination, tri (`sort_by`, `order`) et recherche (`q`).

```bash
curl -b cookies.txt "http://localhost:8000/api/admin/products?page=1&per_page=10&is_active=1"
```

**Réponse HTTP 200 OK :**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "category_id": 1,
        "slug": "poulet-de-chair-fermier",
        "reference": "DEMO-FARM-001",
        "name_fr": "[DEMO] Poulet de chair fermier",
        "name_en": "[DEMO] Farm-raised Broiler Chicken",
        "description_fr": "Poulet fermier élevé en plein air, abattu selon les normes sanitaires.",
        "description_en": "Free-range farm chicken, healthy and tender.",
        "unit_fr": "pièce",
        "unit_en": "piece",
        "price": null,
        "min_quantity": 10,
        "is_orderable": true,
        "is_available": true,
        "image": "/uploads/demo/poulet-fermier.jpg",
        "is_active": true,
        "sort_order": 1,
        "created_at": "2026-11-08 12:00:00",
        "updated_at": "2026-11-08 12:00:00",
        "category": {
          "id": 1,
          "activity": "farm",
          "name_fr": "Volailles",
          "name_en": "Poultry"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "per_page": 10,
      "total": 12,
      "total_pages": 2
    }
  },
  "error": null
}
```

---

### 5.2 POST `/api/admin/upload`
Téléversement d'une image produit avec vérification MIME (`finfo`) et ré-encodage GD à 1600 px maximum.

```bash
curl -i -b cookies.txt -X POST http://localhost:8000/api/admin/upload \
  -H "X-CSRF-Token: <VOTRE_JETON_CSRF>" \
  -F "image=@photo_produit.jpg"
```

**Réponse HTTP 201 Created :**
```json
{
  "success": true,
  "data": {
    "filename": "7f8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d.jpg",
    "relative_path": "uploads/products/7f8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d.jpg",
    "mime_type": "image/jpeg",
    "size": 328450,
    "width": 1200,
    "height": 800,
    "url": "/uploads/products/7f8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d.jpg"
  },
  "error": null
}
```

---

### 5.3 POST `/api/admin/products`
Création d'un produit avec slug automatique.

```bash
curl -i -b cookies.txt -X POST http://localhost:8000/api/admin/products \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: <VOTRE_JETON_CSRF>" \
  -d '{
    "category_id": 1,
    "name_fr": "Pintade fermière locale",
    "name_en": "Local Farm Guinea Fowl",
    "price": 6500,
    "min_quantity": 5,
    "is_orderable": true,
    "is_available": true,
    "image": "/uploads/products/7f8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d.jpg"
  }'
```

**Réponse HTTP 201 Created :**
```json
{
  "success": true,
  "data": {
    "id": 13,
    "slug": "pintade-fermiere-locale",
    "message": "Produit créé avec succès."
  },
  "error": null
}
```

---

### 5.4 PUT `/api/admin/products/{id}`
Mise à jour d'un produit existant.

```bash
curl -i -b cookies.txt -X PUT http://localhost:8000/api/admin/products/13 \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: <VOTRE_JETON_CSRF>" \
  -d '{
    "category_id": 1,
    "name_fr": "Pintade fermière locale bio",
    "name_en": "Organic Local Farm Guinea Fowl",
    "price": 7000,
    "min_quantity": 5,
    "is_orderable": true,
    "is_available": true
  }'
```

**Réponse HTTP 200 OK :**
```json
{
  "success": true,
  "data": {
    "id": 13,
    "slug": "pintade-fermiere-locale-bio",
    "message": "Produit mis à jour avec succès."
  },
  "error": null
}
```

---

### 5.5 DELETE `/api/admin/products/{id}`
Désactivation douce (`is_active = 0`) ou suppression définitive (`confirm=true`) avec purge des fichiers orphelins.

```bash
# Désactivation douce (soft delete)
curl -i -b cookies.txt -X DELETE http://localhost:8000/api/admin/products/13 \
  -H "X-CSRF-Token: <VOTRE_JETON_CSRF>"

# Suppression définitive
curl -i -b cookies.txt -X DELETE "http://localhost:8000/api/admin/products/13?confirm=true" \
  -H "X-CSRF-Token: <VOTRE_JETON_CSRF>"
```

**Réponse HTTP 200 OK (Suppression définitive) :**
```json
{
  "success": true,
  "data": {
    "message": "Le produit 'Pintade fermière locale bio' a été définitivement supprimé de la base de données.",
    "hard_deleted": true
  },
  "error": null
}
```

---

## 6. Gestion Administrative des Véhicules

### 6.1 GET `/api/admin/vehicles`
Liste administrative complète des véhicules avec statut et photo principale.

```bash
curl -b cookies.txt "http://localhost:8000/api/admin/vehicles?page=1&per_page=10"
```

**Réponse HTTP 200 OK :**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "category_id": 4,
        "slug": "toyota-land-cruiser-prado-txl",
        "brand": "Toyota",
        "model": "Land Cruiser Prado TXL [DEMO]",
        "year": 2024,
        "mode": "both",
        "status": "available",
        "price_sale": null,
        "price_rental_day": null,
        "specs": {
          "fuel": "Diesel",
          "transmission": "Automatique",
          "seats": 7,
          "mileage": "15 000 km"
        },
        "description_fr": "Véhicule tout-terrain de prestige.",
        "description_en": "Luxury all-terrain vehicle.",
        "is_active": true,
        "main_image": "/uploads/demo/prado-1.jpg",
        "images_count": 1,
        "created_at": "2026-11-08 12:00:00",
        "updated_at": "2026-11-08 12:00:00",
        "category": {
          "id": 4,
          "name_fr": "SUV et 4x4",
          "name_en": "SUV and 4x4"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "per_page": 10,
      "total": 5,
      "total_pages": 1
    }
  },
  "error": null
}
```

---

### 6.2 POST `/api/admin/vehicles`
Création d'un véhicule avec specs JSON.

```bash
curl -i -b cookies.txt -X POST http://localhost:8000/api/admin/vehicles \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: <VOTRE_JETON_CSRF>" \
  -d '{
    "category_id": 3,
    "brand": "Mercedes-Benz",
    "model": "Classe C 200",
    "year": 2023,
    "mode": "rental",
    "status": "available",
    "price_rental_day": 85000,
    "specs": {
      "fuel": "Essence",
      "transmission": "Automatique",
      "seats": 5,
      "mileage": "18 000 km"
    },
    "description_fr": "Berline premium luxueuse et raffinée.",
    "is_active": true
  }'
```

**Réponse HTTP 201 Created :**
```json
{
  "success": true,
  "data": {
    "id": 6,
    "slug": "mercedes-benz-classe-c-200",
    "message": "Véhicule créé avec succès."
  },
  "error": null
}
```

---

### 6.3 PUT `/api/admin/vehicles/{id}`
Mise à jour des informations d'un véhicule.

```bash
curl -i -b cookies.txt -X PUT http://localhost:8000/api/admin/vehicles/6 \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: <VOTRE_JETON_CSRF>" \
  -d '{
    "category_id": 3,
    "brand": "Mercedes-Benz",
    "model": "Classe C 200 AMG Line",
    "year": 2023,
    "mode": "both",
    "status": "available",
    "price_sale": 32000000,
    "price_rental_day": 85000
  }'
```

**Réponse HTTP 200 OK :**
```json
{
  "success": true,
  "data": {
    "id": 6,
    "slug": "mercedes-benz-classe-c-200-amg-line",
    "message": "Véhicule mis à jour avec succès."
  },
  "error": null
}
```

---

### 6.4 POST `/api/admin/vehicles/{id}/images`
Ajoute une photo à la galerie du véhicule.

```bash
curl -i -b cookies.txt -X POST http://localhost:8000/api/admin/vehicles/6/images \
  -H "X-CSRF-Token: <VOTRE_JETON_CSRF>" \
  -F "image=@mercedes_front.jpg" \
  -F "alt_fr=Mercedes Classe C - Vue avant" \
  -F "alt_en=Mercedes C-Class - Front view" \
  -F "sort_order=1"
```

**Réponse HTTP 201 Created :**
```json
{
  "success": true,
  "data": {
    "id": 8,
    "vehicle_id": 6,
    "path": "/uploads/vehicles/a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6.jpg",
    "sort_order": 1,
    "message": "Image ajoutée à la galerie du véhicule avec succès."
  },
  "error": null
}
```

---

### 6.5 DELETE `/api/admin/vehicles/{id}/images/{image_id}`
Supprime une image de la galerie et élimine le fichier physique du disque.

```bash
curl -i -b cookies.txt -X DELETE http://localhost:8000/api/admin/vehicles/6/images/8 \
  -H "X-CSRF-Token: <VOTRE_JETON_CSRF>"
```

**Réponse HTTP 200 OK :**
```json
{
  "success": true,
  "data": {
    "message": "Image supprimée avec succès."
  },
  "error": null
}
```

---

### 6.6 DELETE `/api/admin/vehicles/{id}`
Désactivation douce ou suppression définitive en cascade (véhicule + images associées).

```bash
# Suppression définitive avec confirmation
curl -i -b cookies.txt -X DELETE "http://localhost:8000/api/admin/vehicles/6?confirm=true" \
  -H "X-CSRF-Token: <VOTRE_JETON_CSRF>"
```

**Réponse HTTP 200 OK :**
```json
{
  "success": true,
  "data": {
    "message": "Le véhicule 'Mercedes-Benz Classe C 200 AMG Line' et ses photos ont été définitivement supprimés.",
    "hard_deleted": true
  },
  "error": null
}
```

---

## 7. Gestion Administrative des Demandes et Statistiques

### 7.1 GET `/api/admin/stats`
Statistiques consolidées par statut (`new`, `in_progress`, `confirmed`, `rejected`, `closed`) et par pôle d'activité (`farm`, `vehicle`, `office`, `fuel`, `general`).

```bash
curl -i -b cookies.txt http://localhost:8000/api/admin/stats
```

**Réponse HTTP 200 OK :**
```json
{
  "success": true,
  "data": {
    "total": 3,
    "by_status": {
      "new": 2,
      "in_progress": 0,
      "confirmed": 1,
      "rejected": 0,
      "closed": 0
    },
    "by_activity": {
      "farm": 1,
      "vehicle": 1,
      "office": 0,
      "fuel": 1,
      "general": 0
    },
    "timestamp": "2026-11-08T13:00:00+00:00"
  },
  "error": null
}
```

---

### 7.2 GET `/api/admin/requests`
Liste paginée des demandes avec recherche globale (`q`), filtres (`type`, `activity`, `status`, `date_from`, `date_to`) et tri (`sort_by`, `order`).

```bash
curl -b cookies.txt "http://localhost:8000/api/admin/requests?activity=vehicle&status=confirmed&page=1&per_page=10"
```

**Réponse HTTP 200 OK :**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "reference": "ETOF-2026-00001",
        "type": "reservation",
        "activity": "vehicle",
        "status": "confirmed",
        "lang": "fr",
        "full_name": "Kouamé Jean",
        "company": "Société BTP",
        "email": "jean.kouame@example.ci",
        "phone": "+225 07 01 02 03 04",
        "message": "Mission terrain",
        "details": null,
        "vehicle_id": 1,
        "vehicle_brand": "Toyota",
        "vehicle_model": "Land Cruiser Prado TXL [DEMO]",
        "start_date": "2026-12-01",
        "end_date": "2026-12-05",
        "items_count": 0,
        "internal_note": "Réservation confirmée avec accord commercial. Véhicule bloqué.",
        "created_at": "2026-11-08 12:40:49",
        "updated_at": "2026-11-08 12:57:12"
      }
    ],
    "pagination": {
      "page": 1,
      "per_page": 10,
      "total": 1,
      "total_pages": 1
    }
  },
  "error": null
}
```

---

### 7.3 GET `/api/admin/requests/{id}`
Détail complet d'une demande avec la liste des articles liés (`request_items`) et le véhicule associé (`vehicle`).

```bash
curl -i -b cookies.txt http://localhost:8000/api/admin/requests/1
```

**Réponse HTTP 200 OK :**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "reference": "ETOF-2026-00001",
    "type": "reservation",
    "activity": "vehicle",
    "status": "confirmed",
    "lang": "fr",
    "full_name": "Kouamé Jean",
    "company": "Société BTP",
    "email": "jean.kouame@example.ci",
    "phone": "+225 07 01 02 03 04",
    "message": "Mission terrain",
    "details": null,
    "vehicle_id": 1,
    "vehicle_name": "Toyota Land Cruiser Prado TXL [DEMO]",
    "start_date": "2026-12-01",
    "end_date": "2026-12-05",
    "items_count": 0,
    "internal_note": "Réservation confirmée avec accord commercial. Véhicule bloqué.",
    "created_at": "2026-11-08 12:40:49",
    "updated_at": "2026-11-08 12:57:12",
    "items": [],
    "vehicle": {
      "id": 1,
      "brand": "Toyota",
      "model": "Land Cruiser Prado TXL [DEMO]",
      "year": 2024,
      "status": "reserved"
    }
  },
  "error": null
}
```

---

### 7.4 PATCH `/api/admin/requests/{id}`
Met à jour le statut d'une demande, la note interne, et applique la mise à jour du statut du véhicule si `update_vehicle: true`. Envoie un e-mail de notification bilingue au client lors des passages à `confirmed` ou `rejected`.

```bash
curl -i -b cookies.txt -X PATCH http://localhost:8000/api/admin/requests/1 \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: <VOTRE_JETON_CSRF>" \
  -d '{
    "status": "confirmed",
    "internal_note": "Validation commerciale effectuée.",
    "update_vehicle": true
  }'
```

**Réponse HTTP 200 OK :**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "reference": "ETOF-2026-00001",
    "previous_status": "new",
    "current_status": "confirmed",
    "vehicle_status_updated": true,
    "message": "Demande mise à jour avec succès."
  },
  "error": null
}
```

---

### 7.5 GET `/api/admin/requests/export`
Exporte les demandes au format CSV configuré pour Excel (BOM UTF-8 `\xEF\xBB\xBF`, séparateur point-virgule `;`).

```bash
curl -b cookies.txt "http://localhost:8000/api/admin/requests/export?status=confirmed" -o export_demandes.csv
```

**Format des données exportées (Fichier texte UTF-8 avec BOM) :**
```csv
Référence;Type;Activité;Statut;Langue;"Nom complet";Société;Email;Téléphone;Véhicule;"Date début";"Date fin";"Nombre articles";"Date création";"Note interne"
ETOF-2026-00001;reservation;vehicle;confirmed;fr;"Kouamé Jean";"Société BTP";jean.kouame@example.ci;"+225 07 01 02 03 04";"Toyota Land Cruiser Prado TXL [DEMO]";2026-12-01;2026-12-05;0;"2026-11-08 12:40:49";"Validation commerciale effectuée."
```
