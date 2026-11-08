import { client } from './client.js';

/**
 * Service API pour l'envoi des demandes unifiées des utilisateurs.
 */

/**
 * Soumet une nouvelle demande client (contact, devis, commande, réservation ou achat).
 *
 * @param {{
 *   type: 'quote' | 'order' | 'reservation' | 'purchase' | 'contact',
 *   activity: 'farm' | 'vehicle' | 'office' | 'fuel' | 'general',
 *   lang?: 'fr' | 'en',
 *   full_name: string,
 *   email: string,
 *   phone: string,
 *   company?: string,
 *   message?: string,
 *   consent: boolean,
 *   website?: string, // Champ piège honeypot (doit rester vide)
 *   turnstile_token?: string,
 *   items?: Array<{ product_id: number, quantity: number }>,
 *   vehicle_id?: number,
 *   start_date?: string,
 *   end_date?: string,
 *   details?: Record<string, any>
 * }} payload
 * @returns {Promise<{
 *   reference: string,
 *   message: string,
 *   created_at: string
 * }>}
 */
export function submitRequest(payload) {
  return client.post('/requests', payload);
}

/**
 * Raccourci pour envoyer un message de contact général.
 *
 * @param {Omit<Parameters<typeof submitRequest>[0], 'type' | 'activity'> & { activity?: 'general' | 'farm' | 'vehicle' | 'office' | 'fuel' }} data
 */
export function sendContact(data) {
  return submitRequest({
    ...data,
    type: 'contact',
    activity: data.activity || 'general',
  });
}

/**
 * Raccourci pour soumettre une demande de devis.
 *
 * @param {Omit<Parameters<typeof submitRequest>[0], 'type'>} data
 */
export function sendQuote(data) {
  return submitRequest({
    ...data,
    type: 'quote',
  });
}

/**
 * Raccourci pour soumettre une réservation de véhicule.
 *
 * @param {Omit<Parameters<typeof submitRequest>[0], 'type' | 'activity'>} data
 */
export function sendReservation(data) {
  return submitRequest({
    ...data,
    type: 'reservation',
    activity: 'vehicle',
  });
}

/**
 * Raccourci pour soumettre une commande de produits (ferme ou fournitures).
 *
 * @param {Omit<Parameters<typeof submitRequest>[0], 'type'>} data
 */
export function sendOrder(data) {
  return submitRequest({
    ...data,
    type: 'order',
  });
}

export default {
  submitRequest,
  sendContact,
  sendQuote,
  sendReservation,
  sendOrder,
};

