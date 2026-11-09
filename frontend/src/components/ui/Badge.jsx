import React from 'react';
import styles from './Badge.module.css';

/**
 * Indicateur de disponibilité strict pour les produits et véhicules.
 * Format rectangulaire (border-radius 2 px maximum), deux états stricts :
 * - Vert = Disponible
 * - Rouge = Indisponible ou Rupture de stock
 *
 * @param {{
 *   children: React.ReactNode,
 *   variant?: 'available' | 'unavailable' | 'out_of_stock' | 'reserved' | 'sold',
 *   className?: string
 * }} props
 * @returns {JSX.Element}
 */
export function Badge({
  children,
  variant = 'available',
  className = '',
  ...restProps
}) {
  const isAvailable = variant === 'available';
  const badgeClass = isAvailable ? styles.available : styles.unavailable;

  return (
    <span className={`${styles.badge} ${badgeClass} ${className}`} {...restProps}>
      <span className={styles.dot} aria-hidden="true" />
      <span>{children}</span>
    </span>
  );
}

export default Badge;
