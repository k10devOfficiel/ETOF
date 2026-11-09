import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from './ToastContext.jsx';
import { useUserAuth } from './UserAuthContext.jsx';
import { displayName } from '../utils/userHelper.js';

/**
 * Génère la clé de stockage isolée par utilisateur pour garantir une stricte
 * confidentialité des données du panier entre différents clients.
 *
 * @param {number|string|null} userId
 * @returns {string}
 */
function getCartStorageKey(userId) {
  if (userId) {
    return `etof_cart_user_${userId}`;
  }
  return 'etof_cart_guest';
}

/**
 * Lecture sécurisée du panier d'un client spécifique depuis localStorage.
 *
 * @param {number|string|null} userId
 * @returns {Array<any>}
 */
function loadUserStoredItems(userId) {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const key = getCartStorageKey(userId);
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Impossible de lire les articles du panier:', error);
    }
    return [];
  }
}

/**
 * Sauvegarde sécurisée du panier dans la zone de stockage propre au client.
 *
 * @param {number|string|null} userId
 * @param {Array<any>} items
 */
function persistUserItems(userId, items) {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    const key = getCartStorageKey(userId);
    if (items && items.length > 0) {
      window.localStorage.setItem(key, JSON.stringify(items));
    } else {
      window.localStorage.removeItem(key);
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Impossible de sauvegarder les articles du panier:', error);
    }
  }
}

const OrderContext = createContext(null);

/**
 * Fournisseur de contexte pour la gestion réactive et confidentielle du panier client.
 * Garantit l'isolation stricte des paniers : aucun client n'a accès aux informations
 * d'un autre client. À la déconnexion, la session active est détruite et le panier
 * est mis en sûreté pour la prochaine reconnexion de ce même client.
 *
 * @param {{ children: React.ReactNode }} props
 * @returns {JSX.Element}
 */
export function OrderProvider({ children }) {
  const { i18n } = useTranslation();
  const { user } = useUserAuth();
  const { notifyCartAdd, notifyCartRemove, notifyCartEmpty } = useToast();

  const currentUserId = user?.id ? String(user.id) : null;
  const prevUserIdRef = useRef(currentUserId);
  const isInitialMount = useRef(true);

  // Initialisation du panier avec les articles propres à l'utilisateur courant (ou invité)
  const [items, setItems] = useState(() => loadUserStoredItems(currentUserId));

  const currentLang = (i18n.language || 'fr').slice(0, 2).toLowerCase();

  // Gestion de la transition d'authentification (Connexion / Déconnexion / Changement de compte)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const prevUserId = prevUserIdRef.current;

    // Cas 1 : Déconnexion du client actif (user devient null)
    if (prevUserId && !currentUserId) {
      // Sauvegarder le panier du client sortant sous sa clé propre pour sa prochaine session
      persistUserItems(prevUserId, items);
      // Nettoyer immédiatement le panier en mémoire et le stockage invité pour confidentialité absolue
      setItems([]);
      try {
        window.localStorage.removeItem('etof_cart_guest');
        window.localStorage.removeItem('etof_order_items');
      } catch {}
    }
    // Cas 2 : Connexion ou bascule vers un autre client
    else if (currentUserId && currentUserId !== prevUserId) {
      if (prevUserId) {
        // Sauvegarder l'ancien panier sous l'ancien compte
        persistUserItems(prevUserId, items);
      }
      // Charger le panier stocké spécifiquement pour ce client
      const restored = loadUserStoredItems(currentUserId);
      setItems(restored);
    }

    prevUserIdRef.current = currentUserId;
  }, [currentUserId]);

  // Synchronisation automatique vers localStorage à chaque modification du panier
  useEffect(() => {
    persistUserItems(currentUserId, items);
  }, [items, currentUserId]);

  /**
   * Ajoute un produit au récapitulatif ou incrémente sa quantité.
   *
   * @param {any} product
   * @param {number} [quantityToAdd]
   */
  const addItem = (product, quantityToAdd) => {
    if (!product || !product.id) return;

    const pId = Number(product.id);
    const minQty = Math.max(1, Number(product.min_quantity) || 1);
    const addedQty = quantityToAdd !== undefined && quantityToAdd !== null
      ? Math.max(1, Number(quantityToAdd))
      : minQty;

    const productName = product.name || product.name_fr || product.name_en || '';
    const userName = displayName(user, currentLang);
    notifyCartAdd(userName, productName);

    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((it) => Number(it.id) === pId);

      if (existingIndex >= 0) {
        const next = [...prevItems];
        const existing = next[existingIndex];
        const currentQty = Number(existing.quantity) || minQty;
        next[existingIndex] = {
          ...existing,
          quantity: currentQty + addedQty,
        };
        return next;
      }

      const newItem = {
        id: pId,
        slug: product.slug || '',
        name: product.name || '',
        unit: product.unit || null,
        price: product.price !== null && product.price !== undefined && Number(product.price) > 0
          ? Number(product.price)
          : null,
        min_quantity: minQty,
        image: product.image || null,
        category: product.category?.name || product.category || null,
        activity: product.category?.activity || product.activity || 'farm',
        quantity: Math.max(minQty, addedQty),
      };

      return [...prevItems, newItem];
    });
  };

  /**
   * Met à jour la quantité d'un article.
   *
   * @param {number} productId
   * @param {number} newQuantity
   */
  const updateQuantity = (productId, newQuantity) => {
    const pId = Number(productId);
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (Number(item.id) !== pId) return item;
        const min = Math.max(1, Number(item.min_quantity) || 1);
        const clampedQty = Math.max(min, Number(newQuantity) || min);
        return {
          ...item,
          quantity: clampedQty,
        };
      })
    );
  };

  /**
   * Supprime un produit du récapitulatif.
   *
   * @param {number} productId
   */
  const removeItem = (productId) => {
    const pId = Number(productId);
    const targetItem = items.find((item) => Number(item.id) === pId);
    if (targetItem) {
      notifyCartRemove(targetItem.name || '');
    }
    setItems((prevItems) => prevItems.filter((item) => Number(item.id) !== pId));
  };

  /**
   * Vide intégralement le récapitulatif de commande.
   *
   * @param {boolean} [notify=false]
   */
  const clearOrder = (notify = false) => {
    if (notify) {
      const userName = displayName(user, currentLang);
      notifyCartEmpty(userName);
    }
    setItems([]);
    if (typeof window !== 'undefined') {
      try {
        const key = getCartStorageKey(currentUserId);
        window.localStorage.removeItem(key);
        window.localStorage.removeItem('etof_order_items');
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn('Impossible de nettoyer localStorage:', error);
        }
      }
    }
  };

  const itemCount = items.length;
  const totalQuantity = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  const indicativeTotal = items.reduce((sum, item) => {
    const p = Number(item.price);
    if (!isNaN(p) && p > 0) {
      return sum + p * (Number(item.quantity) || 1);
    }
    return sum;
  }, 0);

  const hasUnpricedItems = items.some(
    (item) => item.price === null || item.price === undefined || Number(item.price) <= 0
  );

  const value = {
    items,
    itemCount,
    totalQuantity,
    indicativeTotal,
    hasUnpricedItems,
    isEmpty: items.length === 0,
    addItem,
    updateQuantity,
    removeItem,
    clearOrder,
  };

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrder() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder doit être utilisé au sein d’un OrderProvider');
  }
  return context;
}

export default OrderContext;
