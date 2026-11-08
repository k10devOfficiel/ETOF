import React from 'react';
import styles from './Card.module.css';

/**
 * Carte de contenu polyvalente pour les produits, véhicules et encarts d'information.
 *
 * @param {{
 *   children: React.ReactNode,
 *   variant?: 'default' | 'elevated' | 'interactive' | 'outline',
 *   padding?: 'none' | 'sm' | 'md' | 'lg',
 *   as?: React.ElementType,
 *   className?: string
 * }} props
 */
function Card({
  children,
  variant = 'default',
  padding = 'md',
  as: Component = 'article',
  className = '',
  ...restProps
}) {
  const paddingClass = `padding${padding.charAt(0).toUpperCase() + padding.slice(1)}`;

  const cardClasses = [
    styles.card,
    styles[variant] || styles.default,
    styles[paddingClass] || styles.paddingMd,
    className,
  ].filter(Boolean).join(' ');

  return (
    <Component className={cardClasses} {...restProps}>
      {children}
    </Component>
  );
}

export default Card;

