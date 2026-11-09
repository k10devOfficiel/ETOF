import client from './client.js';

/**
 * Service API d'authentification et gestion de compte client ETOF SARL.
 */
export const clientAuthApi = {
  /**
   * Inscription d'un nouveau compte client.
   *
   * @param {{
   *   civility: 'mr' | 'mrs' | 'none',
   *   first_name: string,
   *   last_name: string,
   *   email: string,
   *   phone?: string,
   *   company?: string,
   *   password: string
   * }} data
   */
  async register(data) {
    return client.post('/api/auth/register', data);
  },

  /**
   * Connexion d'un utilisateur client.
   *
   * @param {string} email
   * @param {string} password
   */
  async login(email, password) {
    return client.post('/api/auth/login', { email, password });
  },

  /**
   * Déconnexion client.
   */
  async logout() {
    return client.post('/api/auth/logout');
  },

  /**
   * Vérifie et récupère le profil de l'utilisateur client connecté.
   */
  async getMe() {
    return client.get('/api/auth/me');
  },

  /**
   * Met à jour le profil de l'utilisateur client.
   *
   * @param {{
   *   civility?: 'mr' | 'mrs' | 'none',
   *   first_name?: string,
   *   last_name?: string,
   *   preferred_name?: 'first_name' | 'last_name',
   *   phone?: string,
   *   company?: string
   * }} data
   */
  async updateProfile(data) {
    return client.put('/api/auth/profile', data);
  },

  /**
   * Récupère l'historique des demandes du client connecté.
   */
  async getMyRequests() {
    return client.get('/api/auth/requests');
  },
};

export default clientAuthApi;
