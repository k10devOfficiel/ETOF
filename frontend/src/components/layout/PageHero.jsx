import React from 'react';
import Container from '../ui/Container.jsx';
import Breadcrumb from '../common/Breadcrumb.jsx';
import styles from './PageHero.module.css';

/**
 * En-tête visuel propre et distinct pour chaque page du site ETOF SARL.
 *
 * @param {{
 *   badge?: string,
 *   title: string,
 *   subtitle?: string,
 *   breadcrumbs?: Array<{ label: string, to?: string }>,
 *   actions?: React.ReactNode,
 *   visual?: React.ReactNode,
 *   className?: string
 * }} props
 * @returns {JSX.Element}
 */
export function PageHero({
  badge,
  title,
  subtitle,
  breadcrumbs = [],
  actions,
  visual,
  className = '',
}) {
  return (
    <header className={`${styles.hero} ${className}`}>
      <Container size="xl">
        {breadcrumbs.length > 0 && <Breadcrumb items={breadcrumbs} />}

        <div className={`${styles.inner} ${visual ? styles.innerWithVisual : ''}`}>
          <div className={styles.textContent}>
            {badge && <span className={styles.badge}>{badge}</span>}
            <h1 className={styles.title}>{title}</h1>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
            {actions && <div className={styles.actions}>{actions}</div>}
          </div>

          {visual && <div className={styles.visualWrapper}>{visual}</div>}
        </div>
      </Container>
    </header>
  );
}

export default PageHero;

