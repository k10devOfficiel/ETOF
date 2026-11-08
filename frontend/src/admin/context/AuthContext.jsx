import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { adminApi, setCsrfToken } from '../api/adminApi.js';
import { ApiError } from '../../api/client.js';

const AuthContext = createContext(null);

/**
 * Fournisseur de contexte d'authentification pour l'espace privé administration.
 * Vérifie automatiquement la session active via GET /api/admin/me au montage initial.
 *
 * @param {{ children: React.ReactNode }} props
 * @returns {JSX.Element}
 */
export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  /**
   * Vérifie la session administrateur courante auprès du serveur
   */
  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await adminApi.getMe();
      if (data?.admin) {
        setAdmin(data.admin);
        setSessionExpired(false);
      } else {
        setAdmin(null);
      }
    } catch (err) {
      setAdmin(null);
      // Si une session précédente existait et qu'on reçoit 401, marquer expirée
      if (err instanceof ApiError && err.status === 401 && admin) {
        setSessionExpired(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [admin]);

  // Vérification de la session au chargement initial
  useEffect(() => {
    let isMounted = true;

    adminApi
      .getMe()
      .then((data) => {
        if (isMounted) {
          if (data?.admin) {
            setAdmin(data.admin);
          } else {
            setAdmin(null);
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          setAdmin(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Connecte l'administrateur
   *
   * @param {string} email
   * @param {string} password
   */
  const login = useCallback(async (email, password) => {
    const data = await adminApi.login(email, password);
    if (data?.admin) {
      setAdmin(data.admin);
      setSessionExpired(false);
    }
    return data;
  }, []);

  /**
   * Déconnecte l'administrateur et réinitialise l'état
   */
  const logout = useCallback(async () => {
    try {
      await adminApi.logout();
    } catch (err) {
      console.warn('Erreur lors de la déconnexion:', err);
    } finally {
      setAdmin(null);
      setCsrfToken(null);
      setSessionExpired(false);
    }
  }, []);

  /**
   * Notifie l'expiration de session (déclenché par ProtectedRoute ou un intercepteur 401)
   */
  const notifySessionExpired = useCallback(() => {
    setAdmin(null);
    setCsrfToken(null);
    setSessionExpired(true);
  }, []);

  /**
   * Réinitialise le signal d'expiration de session
   */
  const dismissSessionExpired = useCallback(() => {
    setSessionExpired(false);
  }, []);

  const value = {
    admin,
    isAuthenticated: Boolean(admin),
    isLoading,
    sessionExpired,
    login,
    logout,
    checkAuth,
    notifySessionExpired,
    dismissSessionExpired,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook personnalisé pour consommer le contexte d'authentification administrateur
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
}

export default AuthContext;

