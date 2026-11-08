import { apiFetch, ApiError } from '../../api/client.js';
import { clearCatalogCache } from '../../api/catalog.js';

/**
 * Gestionnaire mémoire du jeton CSRF pour les requêtes d'administration.
 */
let memoryCsrfToken = null;

/**
 * Définit ou met à jour le jeton CSRF en mémoire.
 *
 * @param {string|null} token
 */
export function setCsrfToken(token) {
  memoryCsrfToken = token || null;
}

/**
 * Récupère le jeton CSRF actuellement stocké en mémoire.
 *
 * @returns {string|null}
 */
export function getCsrfToken() {
  return memoryCsrfToken;
}

/**
 * Récupère un jeton CSRF frais depuis le serveur via GET /api/admin/csrf.
 *
 * @returns {Promise<string>}
 */
export async function fetchCsrfToken() {
  const data = await apiFetch('/api/admin/csrf', { method: 'GET' });
  const token = data?.csrf_token || null;
  setCsrfToken(token);
  return token;
}

/**
 * Effectue un appel API d'administration avec injection et régénération automatique du jeton CSRF.
 *
 * @param {string} endpoint
 * @param {RequestInit & { params?: Record<string, any>, timeout?: number }} [options={}]
 * @returns {Promise<any>}
 */
export async function adminFetch(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const isWriteMethod = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  const headers = { ...(options.headers || {}) };

  // Injection du jeton CSRF pour les requêtes d'écriture
  if (isWriteMethod) {
    if (!memoryCsrfToken && endpoint !== '/api/admin/login') {
      try {
        await fetchCsrfToken();
      } catch (err) {
        console.warn('Impossible de pré-récupérer le jeton CSRF:', err);
      }
    }

    if (memoryCsrfToken) {
      headers['X-CSRF-Token'] = memoryCsrfToken;
    }
  }

  try {
    const data = await apiFetch(endpoint, {
      ...options,
      headers,
    });

    // Mise à jour automatique si la réponse fournit un jeton CSRF frais
    if (data && typeof data === 'object' && data.csrf_token) {
      setCsrfToken(data.csrf_token);
    }

    return data;
  } catch (error) {
    // Si l'erreur indique un jeton CSRF invalide/expiré, on réessaie une fois avec un nouveau jeton
    if (
      isWriteMethod &&
      error instanceof ApiError &&
      (error.code === 'CSRF_TOKEN_INVALID' || error.status === 403) &&
      !options._isCsrfRetry
    ) {
      const freshToken = await fetchCsrfToken();
      if (freshToken) {
        return adminFetch(endpoint, {
          ...options,
          _isCsrfRetry: true,
          headers: {
            ...headers,
            'X-CSRF-Token': freshToken,
          },
        });
      }
    }

    throw error;
  }
}

/**
 * Points d'accès d'authentification et d'état administrateur
 */
export const adminApi = {
  /**
   * Connexion administrateur
   * @param {string} email
   * @param {string} password
   */
  login: async (email, password) => {
    const data = await adminFetch('/api/admin/login', {
      method: 'POST',
      body: { email, password },
    });
    if (data?.csrf_token) {
      setCsrfToken(data.csrf_token);
    }
    return data;
  },

  /**
   * Déconnexion administrateur
   */
  logout: async () => {
    try {
      await adminFetch('/api/admin/logout', { method: 'POST' });
    } finally {
      setCsrfToken(null);
    }
  },

  /**
   * Profil administrateur connecté
   */
  getMe: async () => {
    const data = await adminFetch('/api/admin/me', { method: 'GET' });
    if (data?.csrf_token) {
      setCsrfToken(data.csrf_token);
    }
    return data;
  },

  /**
   * Jeton CSRF
   */
  getCsrf: fetchCsrfToken,

  /**
   * Statistiques tableau de bord
   */
  getStats: async () => adminFetch('/api/admin/stats', { method: 'GET' }),

  /**
   * Demandes clients
   */
  getRequests: async (params = {}) => adminFetch('/api/admin/requests', { method: 'GET', params }),

  /**
   * Détail complet d'une demande avec ses articles et véhicule rattaché
   * @param {number} id
   */
  getRequest: async (id) => adminFetch(`/api/admin/requests/${id}`, { method: 'GET' }),

  /**
   * Mise à jour du statut et/ou de la note interne d'une demande
   * @param {number} id
   * @param {{ status?: string, internal_note?: string|null, update_vehicle?: boolean }} data
   */
  updateRequest: async (id, data) =>
    adminFetch(`/api/admin/requests/${id}`, {
      method: 'PATCH',
      body: data,
    }),

  /**
   * Mise à jour rapide du statut d'une demande
   */
  updateRequestStatus: async (id, status, notes = '') =>
    adminFetch(`/api/admin/requests/${id}`, {
      method: 'PATCH',
      body: { status, internal_note: notes },
    }),

  /**
   * Télécharge l'export CSV des demandes avec les filtres actifs
   * @param {Record<string, any>} params
   */
  downloadRequestsCsv: async (params = {}) => {
    const query = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, String(v));
      }
    }
    const url = `/api/admin/requests/export${query.toString() ? `?${query.toString()}` : ''}`;
    
    // Téléchargement sécurisé via blob pour transmettre la session et le jeton
    const res = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error("Échec de l'export CSV.");
    }
    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `export-demandes-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },

  /**
   * Catégories publiques et administratives
   */
  getCategories: async () => apiFetch('/api/categories', { method: 'GET' }),

  /**
   * Téléversement d'image générique / produit
   * @param {File} file
   */
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return adminFetch('/api/admin/upload', {
      method: 'POST',
      body: formData,
    });
  },

  /**
   * Produits (admin)
   */
  getProducts: async (params = {}) => adminFetch('/api/admin/products', { method: 'GET', params }),

  /**
   * Créer un produit
   */
  createProduct: async (data) =>
    adminFetch('/api/admin/products', {
      method: 'POST',
      body: data,
    }),

  /**
   * Mettre à jour un produit
   */
  updateProduct: async (id, data) =>
    adminFetch(`/api/admin/products/${id}`, {
      method: 'PUT',
      body: data,
    }),

  /**
   * Supprimer un produit (soft delete ou hard delete)
   */
  deleteProduct: async (id, hard = false) =>
    adminFetch(`/api/admin/products/${id}${hard ? '?confirm=true' : ''}`, {
      method: 'DELETE',
    }),

  /**
   * Véhicules (admin)
   */
  getVehicles: async (params = {}) => adminFetch('/api/admin/vehicles', { method: 'GET', params }),

  /**
   * Créer un véhicule
   */
  createVehicle: async (data) =>
    adminFetch('/api/admin/vehicles', {
      method: 'POST',
      body: data,
    }),

  /**
   * Mettre à jour un véhicule
   */
  updateVehicle: async (id, data) =>
    adminFetch(`/api/admin/vehicles/${id}`, {
      method: 'PUT',
      body: data,
    }),

  /**
   * Supprimer un véhicule (soft delete ou hard delete)
   */
  deleteVehicle: async (id, hard = false) =>
    adminFetch(`/api/admin/vehicles/${id}${hard ? '?confirm=true' : ''}`, {
      method: 'DELETE',
    }),

  /**
   * Ajouter une image à la galerie d'un véhicule
   * @param {number} vehicleId
   * @param {File} file
   * @param {string} [altFr]
   * @param {string} [altEn]
   * @param {number} [sortOrder]
   */
  addVehicleImage: async (vehicleId, file, altFr = '', altEn = '', sortOrder = 0) => {
    const formData = new FormData();
    formData.append('image', file);
    if (altFr) formData.append('alt_fr', altFr);
    if (altEn) formData.append('alt_en', altEn);
    formData.append('sort_order', String(sortOrder));
    return adminFetch(`/api/admin/vehicles/${vehicleId}/images`, {
      method: 'POST',
      body: formData,
    });
  },

  /**
   * Supprimer une image de la galerie d'un véhicule
   * @param {number} vehicleId
   * @param {number} imageId
   */
  deleteVehicleImage: async (vehicleId, imageId) =>
    adminFetch(`/api/admin/vehicles/${vehicleId}/images/${imageId}`, {
      method: 'DELETE',
    }),

  /**
   * Récupérer les réglages institutionnels
   */
  getSettings: async () => adminFetch('/api/admin/settings', { method: 'GET' }),

  /**
   * Enregistrer les réglages institutionnels
   * @param {Record<string, any>} data
   */
  updateSettings: async (data) => {
    const res = await adminFetch('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    clearCatalogCache();
    return res;
  },

  /**
   * Modifier le mot de passe du compte administrateur
   * @param {{ current_password: string, new_password: string, new_password_confirmation: string }} data
   */
  updatePassword: async (data) =>
    adminFetch('/api/admin/profile/password', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

export default adminApi;

