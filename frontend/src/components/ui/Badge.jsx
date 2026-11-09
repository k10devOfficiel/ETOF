import React from 'react';
import styles from './Badge.module.css';

/**
 * Pastille de statut pour les disponibilités, catégories et étiquettes commerciales.
 *
 * @param {{
 *   children: React.ReactNode,
 *   variant?: 'available' | 'reserved' | 'sold' | 'on_demand' | 'primary' | 'accent',
 *   withDot?: boolean,
 *   className?: string
 * }} props
 */
function Badge({
  children,
  variant = 'available',
  withDot = true,
  className = '',
  ...restProps
}) {
  const variantClass = variant === 'on_demand' ? 'onDemand' : variant;

  const badgeClasses = [
    styles.badge,
    styles[variantClass] || styles.available,
    className,
  ].filter(Boolean).join(' ');

  return (
    <span className={badgeClasses} {...restProps}>
      {withDot && <span className={styles.dot} aria-hidden="true" />}
      <span>{children}</span>
    </span>
  );
}

export default Badge;

