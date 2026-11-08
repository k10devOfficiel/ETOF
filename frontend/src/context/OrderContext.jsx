import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * Clé de stockage local pour la persistance du récapitulatif de commande.
 */
const STORAGE_KEY = 'etof_order_items';

/**
 * Lecture sécurisée du stockage local avec gestion d'erreurs en cas de restrictions
 * du navigateur (mode privé strict, quota dépassé, corruption JSON).
 *
 * @returns {Array<any>}
 */
function loadStoredItems() {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Impossible de lire les articles de commande depuis localStorage:', error);
    return [];
  }
}

/**
 * Sauvegarde sécurisée du récapitulatif dans le stockage local du navigateur.
 *
 * @param {Array<any>} items
 */
function persistItems(items) {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.warn('Impossible de sauvegarder les articles de commande dans localStorage:', error);
  }
}

const OrderContext = createContext(null);

/**
 * Fournisseur de contexte pour la gestion réactive du récapitulatif de commande multi-produits.
 *
 * @param {{ children: React.ReactNode }} props
 * @returns {JSX.Element}
 */
export function OrderProvider({ children }) {
  const [items, setItems] = useState(loadStoredItems);

  // Synchronisation automatique vers localStorage à chaque modification
  useEffect(() => {
    persistItems(items);
  }, [items]);

  /**
   * Ajoute un produit au récapitulatif ou incrémente sa quantité s'il existe déjà.
   * Respecte rigoureusement la quantité minimale imposée par ETOF SARL.
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
   * Met à jour la quantité d'un article en s'assurant qu'elle ne descende jamais
   * en dessous de sa quantité minimale.
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
   * Supprime définitivement un produit du récapitulatif.
   *
   * @param {number} productId
   */
  const removeItem = (productId) => {
    const pId = Number(productId);
    setItems((prevItems) => prevItems.filter((item) => Number(item.id) !== pId));
  };

  /**
   * Vide intégralement le récapitulatif de commande (ex: après envoi réussi).
   */
  const clearOrder = () => {
    setItems([]);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        console.warn('Impossible de nettoyer localStorage:', error);
      }
    }
  };

  /**
   * Nombre total d'articles distincts dans le récapitulatif.
   */
  const itemCount = items.length;

  /**
   * Nombre total d'unités cumulées de produits.
   */
  const totalQuantity = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  /**
   * Total financier indicatif uniquement pour les articles disposant d'un prix affiché.
   */
  const indicativeTotal = items.reduce((sum, item) => {
    const p = Number(item.price);
    if (!isNaN(p) && p > 0) {
      return sum + p * (Number(item.quantity) || 1);
    }
    return sum;
  }, 0);

  /**
   * Indique si au moins un article du panier a une mention "Prix sur demande".
   */
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

/**
 * Hook personnalisé permettant d'accéder au contexte de commande.
 *
 * @returns {{
 *   items: Array<any>,
 *   itemCount: number,
 *   totalQuantity: number,
 *   indicativeTotal: number,
 *   hasUnpricedItems: boolean,
 *   isEmpty: boolean,
 *   addItem: (product: any, quantity?: number) => void,
 *   updateQuantity: (productId: number, newQuantity: number) => void,
 *   removeItem: (productId: number) => void,
 *   clearOrder: () => void
 * }}
 */
export function useOrder() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder doit être utilisé au sein d’un OrderProvider');
  }
  return context;
}

export default OrderContext;

