import { client } from './client.js';

/**
 * Service API pour le catalogue public (produits, véhicules, catégories et réglages).
 */

/**
 * Récupère les paramètres publics de contact et réseaux de l'entreprise.
 *
 * @returns {Promise<{
 *   phone: string,
 *   whatsapp: string,
 *   email: string,
 *   address: string,
 *   facebook: string,
 *   instagram: string,
 *   linkedin: string
 * }>}
 */
export function getSettings() {
  return client.get('/settings');
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
  return client.get('/categories', { params });
}

/**
 * Récupère la liste paginée des produits du catalogue.
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
 *   items: Array<{
 *     id: number,
 *     slug: string,
 *     reference: string | null,
 *     name: string,
 *     description: string | null,
 *     unit: string | null,
 *     price: number | null,
 *     min_quantity: number,
 *     is_orderable: boolean,
 *     is_available: boolean,
 *     image: string | null,
 *     sort_order: number,
 *     category: {
 *       id: number,
 *       slug: string,
 *       name: string,
 *       activity: string
 *     }
 *   }>,
 *   pagination: {
 *     page: number,
 *     per_page: number,
 *     total: number,
 *     total_pages: number
 *   }
 * }>}
 */
export function getProducts(params = {}) {
  return client.get('/products', { params });
}

/**
 * Récupère la fiche détaillée d'un produit par son slug unique.
 *
 * @param {string} slug
 * @param {{ lang?: string }} [params={}]
 * @returns {Promise<any>}
 */
export function getProductBySlug(slug, params = {}) {
  return client.get(`/products/${encodeURIComponent(slug)}`, { params });
}

/**
 * Récupère la liste paginée des véhicules (vente et location).
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
 *   items: Array<{
 *     id: number,
 *     slug: string,
 *     brand: string,
 *     model: string,
 *     year: number,
 *     mode: string,
 *     status: string,
 *     price_sale: number | null,
 *     price_rental_day: number | null,
 *     description: string | null,
 *     main_image: string | null,
 *     category: {
 *       id: number,
 *       slug: string,
 *       name: string
 *     }
 *   }>,
 *   pagination: {
 *     page: number,
 *     per_page: number,
 *     total: number,
 *     total_pages: number
 *   }
 * }>}
 */
export function getVehicles(params = {}) {
  return client.get('/vehicles', { params });
}

/**
 * Récupère la fiche complète d'un véhicule avec sa galerie photos et caractéristiques techniques (specs).
 *
 * @param {string} slug
 * @param {{ lang?: string }} [params={}]
 * @returns {Promise<any>}
 */
export function getVehicleBySlug(slug, params = {}) {
  return client.get(`/vehicles/${encodeURIComponent(slug)}`, { params });
}

export default {
  getSettings,
  getCategories,
  getProducts,
  getProductBySlug,
  getVehicles,
  getVehicleBySlug,
};

