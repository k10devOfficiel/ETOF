import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useOrder } from '../../context/OrderContext.jsx';
import Badge from '../ui/Badge.jsx';
import Button from '../ui/Button.jsx';
import styles from './ProductCard.module.css';

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
 * Carte produit standard pour la grille du catalogue.
 *
 * @param {{
 *   product: {
 *     id: number,
 *     slug: string,
 *     name: string,
 *     description?: string | null,
 *     unit?: string | null,
 *     price?: number | null,
 *     min_quantity?: number,
 *     is_orderable?: boolean,
 *     is_available?: boolean,
 *     image?: string | null,
 *     category?: {
 *       name: string,
 *       slug: string,
 *       activity: string
 *     }
 *   },
 *   onSelect: (product: any) => void
 * }} props
 * @returns {JSX.Element}
 */
export function ProductCard({ product, onSelect }) {
  const { t } = useTranslation();
  const { addItem } = useOrder();
  const [added, setAdded] = useState(false);

  const isAvailable = Boolean(product.is_available);
  const isOrderable = Boolean(product.is_orderable && isAvailable);
  const hasPrice = product.price !== null && product.price !== undefined && Number(product.price) > 0;

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addItem(product, product.min_quantity || 1);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
    }, 2000);
  };

  return (
    <article className={styles.card} aria-labelledby={`product-title-${product.id}`}>
      {/* Zone visuelle */}
      <div
        className={styles.imageWrapper}
        onClick={() => onSelect(product)}
        role="button"
        tabIndex="0"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(product);
          }
        }}
        aria-label={`${t('catalog.viewDetails')} - ${product.name}`}
      >
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className={styles.image}
            loading="lazy"
            width="400"
            height="300"
          />
        ) : (
          <div className={styles.placeholderImage}>
            <svg
              className={styles.placeholderIcon}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
            </svg>
            <span>{t('catalog.noImage')}</span>
          </div>
        )}

        <div className={styles.badgePosition}>
          <Badge variant={isAvailable ? 'available' : 'unavailable'}>
            {isAvailable ? t('catalog.available') : t('catalog.unavailable')}
          </Badge>
        </div>
      </div>

      {/* Contenu textuel */}
      <div className={styles.content}>
        <h3
          id={`product-title-${product.id}`}
          className={styles.title}
          onClick={() => onSelect(product)}
        >
          {product.name}
        </h3>

        {product.description && (
          <p className={styles.description}>{product.description}</p>
        )}

        {/* Ligne tarifaire & unité */}
        <div className={styles.priceRow}>
          <div>
            {hasPrice ? (
              <span className={styles.price}>{formatPrice(Number(product.price))}</span>
            ) : (
              <span className={styles.priceOnDemand}>{t('catalog.priceOnDemand')}</span>
            )}
          </div>
          {product.unit && (
            <span className={styles.unit}>{t('catalog.perUnit', { unit: product.unit })}</span>
          )}
        </div>

        {/* Boutons d'actions */}
        <div className={styles.actions}>
          {isOrderable ? (
            <Button
              variant={added ? 'secondary' : 'primary'}
              size="sm"
              fullWidth
              onClick={handleAddToCart}
              aria-label={`${t('catalog.addToOrder')} - ${product.name}`}
            >
              {added ? t('catalog.addedToOrder') : t('catalog.addToOrder')}
            </Button>
          ) : (
            <Link
              to={`/devis?type=quote&product_id=${product.id}`}
              style={{ textDecoration: 'none' }}
            >
              <Button variant="outline" size="sm" fullWidth>
                {t('catalog.requestPrice')}
              </Button>
            </Link>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelect(product)}
            aria-label={`${t('catalog.viewDetails')} ${product.name}`}
          >
            {t('catalog.viewDetails')}
          </Button>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;

