import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import clientAuthApi from '../api/auth.js';
import { displayName } from '../utils/userHelper.js';
import { useToast } from './ToastContext.jsx';

const UserAuthContext = createContext(null);

export function UserAuthProvider({ children }) {
  const { i18n } = useTranslation();
  const { notifyLogin, notifyRegister, notifyLogout } = useToast();

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Gestion de la modale de connexion / inscription avec reprise d'action
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMessage, setAuthModalMessage] = useState(null);
  const pendingActionRef = useRef(null);

  const currentLang = (i18n.language || 'fr').slice(0, 2).toLowerCase();

  /**
   * Vérifie la session utilisateur client active auprès du serveur
   */
  const checkAuth = useCallback(async () => {
    try {
      const res = await clientAuthApi.getMe();
      if (res?.data?.user) {
        setUser(res.data.user);
        return res.data.user;
      }
      setUser(null);
      return null;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    clientAuthApi
      .getMe()
      .then((res) => {
        if (isMounted && res?.data?.user) {
          setUser(res.data.user);
        }
      })
      .catch(() => {
        if (isMounted) setUser(null);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Connexion client
   */
  const login = useCallback(async (email, password) => {
    const res = await clientAuthApi.login(email, password);
    const loggedUser = res?.data?.user;
    if (loggedUser) {
      setUser(loggedUser);
      const name = displayName(loggedUser, currentLang);
      notifyLogin(name);

      // Reprise automatique de l'action en attente
      if (typeof pendingActionRef.current === 'function') {
        const action = pendingActionRef.current;
        pendingActionRef.current = null;
        setIsAuthModalOpen(false);
        setTimeout(() => {
          action(loggedUser);
        }, 100);
      } else {
        setIsAuthModalOpen(false);
      }
    }
    return loggedUser;
  }, [currentLang, notifyLogin]);

  /**
   * Inscription client
   */
  const register = useCallback(async (data) => {
    const res = await clientAuthApi.register(data);
    const newUser = res?.data?.user;
    if (newUser) {
      setUser(newUser);
      const name = displayName(newUser, currentLang);
      notifyRegister(name);

      // Reprise automatique de l'action en attente
      if (typeof pendingActionRef.current === 'function') {
        const action = pendingActionRef.current;
        pendingActionRef.current = null;
        setIsAuthModalOpen(false);
        setTimeout(() => {
          action(newUser);
        }, 100);
      } else {
        setIsAuthModalOpen(false);
      }
    }
    return newUser;
  }, [currentLang, notifyRegister]);

  /**
   * Déconnexion client
   */
  const logout = useCallback(async () => {
    const name = displayName(user, currentLang);
    try {
      await clientAuthApi.logout();
    } finally {
      setUser(null);
      notifyLogout(name);
    }
  }, [user, currentLang, notifyLogout]);

  /**
   * Mise à jour du profil client
   */
  const updateProfile = useCallback(async (data) => {
    const res = await clientAuthApi.updateProfile(data);
    if (res?.data?.user) {
      setUser(res.data.user);
    }
    return res?.data?.user;
  }, []);

  /**
   * Exige une session active avant d'effectuer une action protégée.
   * Si une session est active, exécute immédiatement l'action.
   * Sinon, stocke l'action avec les données déjà saisies et ouvre la modale de connexion.
   *
   * @param {(user: object) => void} actionCallback
   * @param {string} [customMessage]
   */
  const requireAuth = useCallback(async (actionCallback, customMessage = null) => {
    // Vérification auprès du serveur si l'état local semble absent
    let activeUser = user;
    if (!activeUser) {
      activeUser = await checkAuth();
    }

    if (activeUser) {
      actionCallback(activeUser);
      return true;
    }

    pendingActionRef.current = actionCallback;
    setAuthModalMessage(customMessage);
    setIsAuthModalOpen(true);
    return false;
  }, [user, checkAuth]);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    pendingActionRef.current = null;
    setAuthModalMessage(null);
  }, []);

  const value = {
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    login,
    register,
    logout,
    checkAuth,
    updateProfile,
    requireAuth,
    isAuthModalOpen,
    authModalMessage,
    closeAuthModal,
  };

  return (
    <UserAuthContext.Provider value={value}>
      {children}
    </UserAuthContext.Provider>
  );
}

export function useUserAuth() {
  const ctx = useContext(UserAuthContext);
  if (!ctx) {
    throw new Error('useUserAuth doit être utilisé au sein d’un UserAuthProvider');
  }
  return ctx;
}

export default useUserAuth;

