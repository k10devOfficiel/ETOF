import { client } from './client.js';

/**
 * Service API pour le catalogue public (produits, véhicules, catégories et réglages).
 * Intègre un cache en mémoire côté client avec durée de validité (TTL) pour accélérer
 * la navigation et réduire la consommation réseau sur mobile et connexion lente.
 */

const cacheStore = new Map();
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

/**
 * Exécute un appel GET mis en cache en mémoire.
 *
 * @param {string} endpoint
 * @param {Record<string, any>} [params={}]
 * @returns {Promise<any>}
 */
async function cachedGet(endpoint, params = {}) {
  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') {
      query.append(k, String(v));
    }
  }
  const queryString = query.toString();
  const cacheKey = queryString ? `${endpoint}?${queryString}` : endpoint;
  const now = Date.now();

  if (cacheStore.has(cacheKey)) {
    const entry = cacheStore.get(cacheKey);
    if (now - entry.timestamp < CACHE_TTL_MS) {
      return entry.data;
    }
    cacheStore.delete(cacheKey);
  }

  const data = await client.get(endpoint, { params });
  cacheStore.set(cacheKey, { data, timestamp: now });
  return data;
}

/**
 * Réinitialise manuellement l'ensemble du cache catalogue côté client.
 */
export function clearCatalogCache() {
  cacheStore.clear();
}

/**
 * Récupère les paramètres publics de contact et réseaux de l'entreprise (avec cache).
 *
 * @returns {Promise<{
 *   phone: string,
 *   whatsapp: string,
 *   email: string,
 *   address: string,
 *   facebook: string,
 *   instagram: string,
 *   linkedin: string,
 *   opening_hours: string
 * }>}
 */
export function getSettings() {
  return cachedGet('/settings');
}

/**
 * Récupère la liste des catégories actives, filtrable par activité ('farm', 'vehicle', 'office').
 *
 * @param {{ activity?: 'farm' | 'vehicle' | 'office', lang?: string }} [params={}]
 * @returns {Promise<Array<{
 *   id: number,
 *   activity: string,
 *   slug: string,
 *   name: string,
 *   sort_order: number
 * }>>}
 */
export function getCategories(params = {}) {
  return cachedGet('/categories', params);
}

/**
 * Récupère la liste paginée des produits du catalogue (avec cache).
 *
 * @param {{
 *   category?: string,
 *   q?: string,
 *   available?: 0 | 1 | string,
 *   page?: number,
 *   per_page?: number,
 *   lang?: string
 * }} [params={}]
 * @returns {Promise<{
 *   items: Array<any>,
 *   pagination: {
 *     page: number,
 *     per_page: number,
 *     total: number,
 *     total_pages: number
 *   }
 * }>}
 */
export function getProducts(params = {}) {
  return cachedGet('/products', params);
}

/**
 * Récupère la fiche détaillée d'un produit par son slug unique (avec cache).
 *
 * @param {string} slug
 * @param {{ lang?: string }} [params={}]
 * @returns {Promise<any>}
 */
export function getProductBySlug(slug, params = {}) {
  return cachedGet(`/products/${encodeURIComponent(slug)}`, params);
}

/**
 * Récupère la liste paginée des véhicules (vente et location) (avec cache).
 *
 * @param {{
 *   type?: string,
 *   mode?: 'sale' | 'rental' | 'both',
 *   status?: 'available' | 'reserved' | 'sold' | 'unavailable',
 *   brand?: string,
 *   page?: number,
 *   per_page?: number,
 *   lang?: string
 * }} [params={}]
 * @returns {Promise<{
 *   items: Array<any>,
 *   pagination: {
 *     page: number,
 *     per_page: number,
 *     total: number,
 *     total_pages: number
 *   }
 * }>}
 */
export function getVehicles(params = {}) {
  return cachedGet('/vehicles', params);
}

/**
 * Récupère la fiche complète d'un véhicule avec sa galerie photos et caractéristiques techniques (avec cache).
 *
 * @param {string} slug
 * @param {{ lang?: string }} [params={}]
 * @returns {Promise<any>}
 */
export function getVehicleBySlug(slug, params = {}) {
  return cachedGet(`/vehicles/${encodeURIComponent(slug)}`, params);
}

export default {
  getSettings,
  getCategories,
  getProducts,
  getProductBySlug,
  getVehicles,
  getVehicleBySlug,
  clearCatalogCache,
};
