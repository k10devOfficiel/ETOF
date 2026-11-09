import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../components/common/Icon.jsx';
import styles from '../components/ui/Toast.module.css';

const ToastContext = createContext(null);

const TOAST_DURATION = 5000; // 5 secondes

/**
 * Composant individuel de notification toast accessible.
 */
function ToastItem({ toast, onDismiss }) {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const remainingTimeRef = useRef(TOAST_DURATION);
  const lastTickRef = useRef(Date.now());
  const animationFrameRef = useRef(null);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onDismiss(toast.id);
    }, 250);
  }, [toast.id, onDismiss]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  useEffect(() => {
    if (isPaused) {
      lastTickRef.current = Date.now();
      return;
    }

    lastTickRef.current = Date.now();

    const loop = () => {
      const now = Date.now();
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;

      remainingTimeRef.current -= delta;
      const pct = Math.max(0, (remainingTimeRef.current / TOAST_DURATION) * 100);
      setProgress(pct);

      if (remainingTimeRef.current <= 0) {
        handleClose();
      } else {
        animationFrameRef.current = requestAnimationFrame(loop);
      }
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPaused, handleClose]);

  // Sélection de l'icône Font Awesome
  const iconName = toast.type === 'error'
    ? 'circle-xmark'
    : toast.type === 'info'
    ? 'circle-info'
    : 'circle-check';

  return (
    <div
      className={`${styles.toastItem} ${isClosing ? styles.closing : ''}`}
      role="status"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      tabIndex={0}
      aria-label={`${toast.title || ''} : ${toast.message}`}
    >
      <div className={styles.iconBox} aria-hidden="true">
        <Icon name={iconName} size={20} color="currentColor" />
      </div>

      <div className={styles.body}>
        {toast.title && <div className={styles.title}>{toast.title}</div>}
        <p className={styles.message}>{toast.message}</p>
      </div>

      <button
        type="button"
        className={styles.closeBtn}
        onClick={handleClose}
        aria-label="Fermer la notification"
        title="Fermer"
      >
        <Icon name="xmark" size={16} />
      </button>

      <div
        className={styles.progressBar}
        style={{ width: `${progress}%` }}
        aria-hidden="true"
      />
    </div>
  );
}

/**
 * Fournisseur de contexte pour le système de notifications Toast personnalisées.
 */
export function ToastProvider({ children }) {
  const { t } = useTranslation();
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((toast) => {
    const id = Date.now() + Math.random().toString(36).slice(2, 7);
    const newToast = {
      id,
      type: toast.type || 'success',
      title: toast.title,
      message: toast.message,
    };

    setToasts((prev) => [...prev, newToast]);
    return id;
  }, []);

  // Helpers personnalisés pour chaque action métier spécifique
  const notifySuccess = useCallback((title, message) => {
    return showToast({ type: 'success', title, message });
  }, [showToast]);

  const notifyError = useCallback((message, title) => {
    return showToast({
      type: 'error',
      title: title || t('toast.titles.error', 'Attention'),
      message: message || t('toast.genericError', 'Une erreur est survenue, réessayez dans un instant.'),
    });
  }, [showToast, t]);

  const notifyInfo = useCallback((title, message) => {
    return showToast({ type: 'info', title, message });
  }, [showToast]);

  // 1. Connexion : « Bienvenue {name}, ravi de vous revoir. »
  const notifyLogin = useCallback((name) => {
    showToast({
      type: 'success',
      title: t('toast.titles.auth', 'Espace Client'),
      message: t('toast.login', { name }),
    });
  }, [showToast, t]);

  // 2. Inscription : « Bienvenue {name}, votre compte est créé... »
  const notifyRegister = useCallback((name) => {
    showToast({
      type: 'success',
      title: t('toast.titles.welcome', 'Bienvenue chez ETOF SARL'),
      message: t('toast.register', { name }),
    });
  }, [showToast, t]);

  // 3. Déconnexion : « À bientôt {name}. »
  const notifyLogout = useCallback((name) => {
    showToast({
      type: 'info',
      title: t('toast.titles.auth', 'Déconnexion'),
      message: t('toast.logout', { name }),
    });
  }, [showToast, t]);

  // 4. Ajout au panier : « {name}, {item} a été ajouté à votre panier. »
  const notifyCartAdd = useCallback((name, item) => {
    showToast({
      type: 'success',
      title: t('toast.titles.cart', 'Panier'),
      message: t('toast.cartAdd', { name, item }),
    });
  }, [showToast, t]);

  // 5. Retrait du panier : « {item} a été retiré de votre panier. »
  const notifyCartRemove = useCallback((item) => {
    showToast({
      type: 'info',
      title: t('toast.titles.cart', 'Panier'),
      message: t('toast.cartRemove', { item }),
    });
  }, [showToast, t]);

  // 6. Panier vidé : « Votre panier est vide, {name}. »
  const notifyCartEmpty = useCallback((name) => {
    showToast({
      type: 'info',
      title: t('toast.titles.cart', 'Panier'),
      message: t('toast.cartEmpty', { name }),
    });
  }, [showToast, t]);

  // 7. Devis envoyé : « {name}, votre demande de devis a bien été envoyée (réf. {ref}). Nous vous répondrons au plus vite. »
  const notifyQuoteSent = useCallback((name, ref) => {
    showToast({
      type: 'success',
      title: t('toast.titles.requestSent', 'Demande enregistrée'),
      message: t('toast.quoteSent', { name, ref }),
    });
  }, [showToast, t]);

  // 8. Commande envoyée : « {name}, votre commande de {count} article(s) a bien été envoyée (réf. {ref}). Nous vous contacterons pour la confirmer. »
  const notifyOrderSent = useCallback((name, count, ref) => {
    showToast({
      type: 'success',
      title: t('toast.titles.orderSent', 'Commande envoyée'),
      message: t('toast.orderSent', { name, count, ref }),
    });
  }, [showToast, t]);

  // 9. Réservation / location envoyée : « {name}, votre demande de location du {item} du {start} au {end} a bien été envoyée (réf. {ref}). »
  const notifyRentalSent = useCallback((name, item, start, end, ref) => {
    showToast({
      type: 'success',
      title: t('toast.titles.rentalSent', 'Réservation enregistrée'),
      message: t('toast.rentalSent', { name, item, start, end, ref }),
    });
  }, [showToast, t]);

  // 10. Achat de véhicule : « {name}, votre demande d'achat pour {item} a bien été envoyée (réf. {ref}). »
  const notifyBuySent = useCallback((name, item, ref) => {
    showToast({
      type: 'success',
      title: t('toast.titles.buySent', 'Demande d’achat enregistrée'),
      message: t('toast.buySent', { name, item, ref }),
    });
  }, [showToast, t]);

  // 11. Confirmation admin : « {name}, votre demande {ref} est confirmée. »
  const notifyAdminConfirmed = useCallback((name, ref) => {
    showToast({
      type: 'success',
      title: t('toast.titles.confirmed', 'Confirmation'),
      message: t('toast.adminConfirmed', { name, ref }),
    });
  }, [showToast, t]);

  const value = {
    showToast,
    notifySuccess,
    notifyError,
    notifyInfo,
    notifyLogin,
    notifyRegister,
    notifyLogout,
    notifyCartAdd,
    notifyCartRemove,
    notifyCartEmpty,
    notifyQuoteSent,
    notifyOrderSent,
    notifyRentalSent,
    notifyBuySent,
    notifyAdminConfirmed,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className={styles.toastContainer}
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast doit être utilisé au sein d’un ToastProvider');
  }
  return ctx;
}

export default useToast;
