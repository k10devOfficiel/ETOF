import i18n from '../i18n/index.js';

/**
 * Erreur typée pour les échecs de requêtes HTTP et réponses d'erreur API.
 */
export class ApiError extends Error {
  /**
   * @param {string} code Code d'erreur applicatif (ex: 'VALIDATION_FAILED', 'UNAUTHORIZED')
   * @param {string} message Message descriptif
   * @param {number} status Code statut HTTP (ex: 400, 401, 404, 422, 500)
   * @param {Record<string, string[]>|null} [fields=null] Erreurs de validation par champ
   * @param {unknown} [payload=null] Charge utile brute retournée par l'API
   */
  constructor(code, message, status = 500, fields = null, payload = null) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.fields = fields;
    this.payload = payload;
  }
}

/**
 * Récupère le code de langue actif pour la requête ('fr' ou 'en').
 *
 * @returns {string}
 */
export function getCurrentLanguage() {
  const lang = (i18n?.language || (typeof document !== 'undefined' ? document.documentElement.lang : '') || 'fr').toLowerCase();
  return lang.startsWith('en') ? 'en' : 'fr';
}

/**
 * Durée maximale d'attente d'une requête HTTP par défaut (10 secondes).
 */
const DEFAULT_TIMEOUT_MS = 10000;

/**
 * Fonction fetch commune centralisée pour l'ensemble des échanges API REST.
 * - Ajoute la langue courante (paramètre d'URL & en-tête Accept-Language)
 * - Gère l'interruption par délai d'attente (10 secondes)
 * - Traite l'enveloppe JSON { success, data, error }
 * - Lève une exception typée ApiError en cas d'échec
 *
 * @param {string} endpoint Chemin de la ressource (ex: '/products', '/api/health')
 * @param {RequestInit & { params?: Record<string, any>, timeout?: number }} [options={}]
 * @returns {Promise<any>}
 */
export async function apiFetch(endpoint, options = {}) {
  const {
    params = {},
    timeout = DEFAULT_TIMEOUT_MS,
    headers = {},
    ...customConfig
  } = options;

  // Normalisation du chemin : s'assure que le préfixe /api est présent si chemin relatif
  let url = endpoint;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    if (!url.startsWith('/api')) {
      url = '/api' + (url.startsWith('/') ? url : `/${url}`);
    }
  }

  // Injection de la langue active
  const currentLang = getCurrentLanguage();
  const queryParams = new URLSearchParams();

  // Ajout des paramètres passés en options
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  }

  // Injecter lang si non spécifié explicitement dans params
  if (!queryParams.has('lang')) {
    queryParams.append('lang', currentLang);
  }

  const queryString = queryParams.toString();
  if (queryString) {
    url += (url.includes('?') ? '&' : '?') + queryString;
  }

  // Configuration du contrôleur d'interruption (Timeout 10s)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  // En-têtes HTTP par défaut
  const defaultHeaders = {
    Accept: 'application/json',
    'Accept-Language': currentLang,
    ...headers,
  };

  // Traitement automatique du corps JSON
  let body = customConfig.body;
  if (body && typeof body === 'object' && !(body instanceof FormData) && !(body instanceof Blob)) {
    defaultHeaders['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, {
      ...customConfig,
      body,
      headers: defaultHeaders,
      signal: controller.signal,
      credentials: 'include', // Envoi automatique des cookies de session HttpOnly
    });

    clearTimeout(timeoutId);

    // Tentative de lecture du corps en JSON
    let json = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        json = await response.json();
      } catch (parseErr) {
        throw new ApiError(
          'INVALID_JSON_RESPONSE',
          'La réponse du serveur n\'est pas un JSON valide.',
          response.status
        );
      }
    }

    // Si le statut HTTP n'est pas un succès ou l'enveloppe indique un échec
    if (!response.ok || (json && json.success === false)) {
      const errorCode = json?.error?.code || `HTTP_${response.status}`;
      const errorMessage = json?.error?.message || response.statusText || 'Une erreur est survenue lors de l\'appel API.';
      const errorFields = json?.error?.fields || null;

      throw new ApiError(errorCode, errorMessage, response.status, errorFields, json);
    }

    // Retour de la charge utile de l'enveloppe { success: true, data: ... }
    if (json && typeof json === 'object' && 'data' in json) {
      return json.data;
    }

    return json;
  } catch (error) {
    clearTimeout(timeoutId);

    // Cas de l'interruption par timeout
    if (error.name === 'AbortError') {
      throw new ApiError(
        'TIMEOUT_ERROR',
        `Le serveur n'a pas répondu dans le délai imparti de ${Math.round(timeout / 1000)} secondes.`,
        408
      );
    }

    // Si c'est déjà une ApiError, la propager
    if (error instanceof ApiError) {
      throw error;
    }

    // Erreur réseau ou client non gérée
    throw new ApiError(
      'NETWORK_ERROR',
      error.message || 'Impossible de contacter le serveur distant.',
      0
    );
  }
}

/**
 * Méthodes utilitaires HTTP
 */
export const client = {
  get: (endpoint, options = {}) => apiFetch(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) => apiFetch(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options = {}) => apiFetch(endpoint, { ...options, method: 'PUT', body }),
  patch: (endpoint, body, options = {}) => apiFetch(endpoint, { ...options, method: 'PATCH', body }),
  delete: (endpoint, options = {}) => apiFetch(endpoint, { ...options, method: 'DELETE' }),
};

export default client;

