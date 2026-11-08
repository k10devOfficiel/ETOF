import React from 'react';
import styles from './Section.module.css';

/**
 * Section structurante avec en-tête typographique prestige et ligne accentuée turquoise.
 *
 * @param {{
 *   children: React.ReactNode,
 *   title?: React.ReactNode,
 *   subtitle?: React.ReactNode,
 *   align?: 'left' | 'center',
 *   theme?: 'default' | 'white' | 'surface' | 'dark',
 *   as?: React.ElementType,
 *   className?: string
 * }} props
 */
function Section({
  children,
  title = null,
  subtitle = null,
  align = 'center',
  theme = 'default',
  as: Component = 'section',
  className = '',
  ...restProps
}) {
  const sectionClasses = [
    styles.section,
    styles[theme] || styles.default,
    className,
  ].filter(Boolean).join(' ');

  const headerClass = align === 'left' ? styles.headerLeft : styles.headerCenter;

  return (
    <Component className={sectionClasses} {...restProps}>
      {(title || subtitle) && (
        <header className={headerClass}>
          {title && <h2 className={styles.title}>{title}</h2>}
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          <div className={styles.accentBar} aria-hidden="true" />
        </header>
      )}
      {children}
    </Component>
  );
}

export default Section;

