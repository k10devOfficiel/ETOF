import React from 'react';
import Icon from '../common/Icon.jsx';
import styles from './Badge.module.css';

/**
 * Pastille/Badge de statut rectangulaire (radius max 2px, majuscules, icône à gauche).
 * Code couleur strict : vert = disponible, orange = réservé, rouge = indisponible / vendu.
 *
 * @param {{
 *   children: React.ReactNode,
 *   variant?: 'available' | 'reserved' | 'sold' | 'unavailable' | 'on_demand' | 'primary' | 'accent',
 *   showIcon?: boolean,
 *   className?: string
 * }} props
 */
export function Badge({
  children,
  variant = 'available',
  showIcon = true,
  className = '',
  ...restProps
}) {
  const normalizedVariant =
    variant === 'unavailable'
      ? 'sold'
      : variant === 'on_demand'
      ? 'onDemand'
      : variant;

  const iconName =
    variant === 'available'
      ? 'check'
      : variant === 'reserved'
      ? 'clock'
      : variant === 'sold' || variant === 'unavailable'
      ? 'ban'
      : 'tag';

  const badgeClasses = [
    styles.badge,
    styles[normalizedVariant] || styles.available,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={badgeClasses} {...restProps}>
      {showIcon && (
        <span className={styles.iconWrapper} aria-hidden="true">
          <Icon name={iconName} size={14} />
        </span>
      )}
      <span className={styles.text}>{children}</span>
    </span>
  );
}

export default Badge;
