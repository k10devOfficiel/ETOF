import React from 'react';
import styles from './Container.module.css';

/**
 * Conteneur responsive centré assurant les marges et alignements de page.
 *
 * @param {{
 *   children: React.ReactNode,
 *   size?: 'fixed' | 'fluid' | 'narrow',
 *   as?: React.ElementType,
 *   className?: string
 * }} props
 */
function Container({
  children,
  size = 'fixed',
  as: Component = 'div',
  className = '',
  ...restProps
}) {
  const containerClasses = [
    styles.container,
    styles[size] || styles.fixed,
    className,
  ].filter(Boolean).join(' ');

  return (
    <Component className={containerClasses} {...restProps}>
      {children}
    </Component>
  );
}

export { Container };
export default Container;

