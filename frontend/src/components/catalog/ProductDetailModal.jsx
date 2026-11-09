import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useOrder } from '../../context/OrderContext.jsx';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import styles from './ProductDetailModal.module.css';

/**
 * Formatage d'un montant monétaire en FCFA sans décimales.
 *
 * @param {number} amount
 * @returns {string}
 */
function formatPrice(amount) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(amount) + ' FCFA';
}

/**
 * Boîte de dialogue détaillée affichant la fiche produit complète avec photos,
 * référence, description, quantité minimale et sélecteur de quantité interactif.
 *
 * @param {{
 *   product: any | null,
 *   isOpen: boolean,
 *   onClose: () => void
 * }} props
 * @returns {JSX.Element | null}
 */
export function ProductDetailModal({ product, isOpen, onClose }) {
  const { t } = useTranslation();
  const { addItem } = useOrder();
  const minQty = Math.max(1, Number(product?.min_quantity) || 1);
  const [quantity, setQuantity] = useState(minQty);
  const [added, setAdded] = useState(false);

  // Réinitialiser la quantité lors de l'ouverture d'un nouveau produit
  useEffect(() => {
    if (product) {
      setQuantity(Math.max(1, Number(product.min_quantity) || 1));
      setAdded(false);
    }
  }, [product]);

  if (!product) return null;

  const isAvailable = Boolean(product.is_available);
  const isOrderable = Boolean(product.is_orderable && isAvailable);
  const hasPrice = product.price !== null && product.price !== undefined && Number(product.price) > 0;
  const unitPrice = hasPrice ? Number(product.price) : 0;
  const totalPrice = unitPrice * quantity;

  const handleAddToCart = () => {
    addItem(product, quantity);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
    }, 2500);
  };

  const handleDecrease = () => {
    setQuantity((prev) => Math.max(minQty, prev - 1));
  };

  const handleIncrease = () => {
    setQuantity((prev) => prev + 1);
  };

  const handleQuantityChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) {
      setQuantity(Math.max(minQty, val));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product.name}
      size="lg"
    >
      <div className={styles.grid}>
        {/* Colonne visuelle */}
        <div className={styles.imageContainer}>
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className={styles.image}
              loading="lazy"
              width="600"
              height="450"
            />
          ) : (
            <div className={styles.placeholderImage}>
              <i className={`fa-solid fa-image ${styles.placeholderIcon}`} aria-hidden="true" style={{ fontSize: '40px' }} />
              <span>{t('catalog.noImage')}</span>
            </div>
          )}
        </div>

        {/* Colonne détails et commande */}
        <div className={styles.detailsCol}>
          {/* Métadonnées : Référence & Catégorie */}
          <div className={styles.metaRow}>
            {product.category?.name && (
              <span className={styles.categoryBadge}>{product.category.name}</span>
            )}
            {product.reference && (
              <span className={styles.referenceBadge}>
                {t('catalog.referenceLabel')}: {product.reference}
              </span>
            )}
          </div>

          <h2 className={styles.title}>{product.name}</h2>

          {product.description && (
            <p className={styles.description}>{product.description}</p>
          )}

          {/* Bloc Tarif */}
          <div className={styles.priceBlock}>
            <div>
              {hasPrice ? (
                <span className={styles.priceAmount}>{formatPrice(unitPrice)}</span>
              ) : (
                <span className={styles.priceOnDemand}>{t('catalog.priceOnDemand')}</span>
              )}
            </div>
            {product.unit && (
              <span className={styles.unitText}>
                {t('catalog.perUnit', { unit: product.unit })}
              </span>
            )}
          </div>

          {/* Condition de quantité minimale */}
          {minQty > 1 && (
            <div className={styles.minQtyNotice}>
              <i className="fa-solid fa-circle-info" aria-hidden="true" style={{ fontSize: '14px', marginRight: '6px' }} />
              <span>{t('catalog.minQuantityNotice', { min: minQty })}</span>
            </div>
          )}

          {/* Sélecteur de quantité */}
          <div className={styles.qtySection}>
            <label htmlFor="product-qty-input" className={styles.qtyLabel}>
              {t('catalog.selectQuantity')}
            </label>
            <div className={styles.qtyControls}>
              <button
                type="button"
                className={styles.qtyBtn}
                onClick={handleDecrease}
                disabled={quantity <= minQty}
                aria-label={t('catalog.decreaseQty')}
              >
                -
              </button>
              <input
                id="product-qty-input"
                type="number"
                className={styles.qtyInput}
                min={minQty}
                value={quantity}
                onChange={handleQuantityChange}
                aria-label={t('catalog.quantity')}
              />
              <button
                type="button"
                className={styles.qtyBtn}
                onClick={handleIncrease}
                aria-label={t('catalog.increaseQty')}
              >
                +
              </button>
            </div>

            {hasPrice && quantity > 1 && (
              <div className={styles.totalRow}>
                <span>{t('catalog.estimatedTotal')} :</span>
                <span className={styles.totalValue}>{formatPrice(totalPrice)}</span>
              </div>
            )}
          </div>

          {/* Boutons d'action */}
          <div className={styles.modalActions}>
            {isOrderable ? (
              <>
                <Button
                  variant={added ? 'secondary' : 'primary'}
                  size="lg"
                  onClick={handleAddToCart}
                  style={{ flex: 1 }}
                >
                  {added ? t('catalog.addedToOrder') : t('catalog.addToOrder')}
                </Button>
                <Link
                  to="/commande"
                  style={{ textDecoration: 'none' }}
                  onClick={onClose}
                >
                  <Button variant="outline" size="lg">
                    {t('order.viewSummary')}
                  </Button>
                </Link>
              </>
            ) : (
              <Link
                to={`/devis?type=quote&product_id=${product.id}&quantity=${quantity}`}
                style={{ textDecoration: 'none', flex: 1 }}
                onClick={onClose}
              >
                <Button variant="outline" size="lg" fullWidth>
                  {t('catalog.requestPrice')}
                </Button>
              </Link>
            )}

            <Button variant="ghost" size="lg" onClick={onClose}>
              {t('common.close')}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default ProductDetailModal;

