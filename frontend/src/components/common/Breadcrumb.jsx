import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Icon from './Icon.jsx';
import styles from './Breadcrumb.module.css';

/**
 * Fil d'Ariane sémantique et accessible (WCAG AA).
 *
 * @param {{
 *   items: Array<{
 *     label: string,
 *     to?: string
 *   }>
 * }} props
 * @returns {JSX.Element}
 */
export function Breadcrumb({ items = [] }) {
  const { t } = useTranslation();

  if (!items || items.length === 0) return null;

  return (
    <nav className={styles.nav} aria-label={t('layout.breadcrumbAriaLabel', 'Fil d’Ariane')}>
      <ol className={styles.list}>
        <li className={styles.item}>
          <Link to="/" className={styles.link}>
            {t('nav.home', 'Accueil')}
          </Link>
          <span className={styles.separator} aria-hidden="true">
            <Icon name="arrowRight" size={12} />
          </span>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className={styles.item}>
              {isLast || !item.to ? (
                <span className={styles.current} aria-current="page">
                  {item.label}
                </span>
              ) : (
                <>
                  <Link to={item.to} className={styles.link}>
                    {item.label}
                  </Link>
                  <span className={styles.separator} aria-hidden="true">
                    <Icon name="arrowRight" size={12} />
                  </span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumb;

