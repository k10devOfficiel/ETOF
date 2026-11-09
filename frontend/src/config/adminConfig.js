/**
 * Configuration du chemin secret d'accès à l'administration ETOF SARL.
 * Configurable via la variable d'environnement VITE_ADMIN_PATH (défaut : /espace-gestion-etof-2026).
 * Tout accès aux chemins conventionnels (/admin, /admin/login, /wp-admin, etc.) renvoie une page 404.
 */
export const ADMIN_PATH = import.meta.env.VITE_ADMIN_PATH || '/espace-gestion-etof-2026';

