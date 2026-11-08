import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Spinner.module.css';

/**
 * Indicateur visuel et accessible de chargement.
 *
 * @param {{
 *   size?: 'sm' | 'md' | 'lg',
 *   color?: 'primary' | 'accent' | 'white',
 *   className?: string
 * }} props
 */
function Spinner({ size = 'md', color = 'primary', className = '' }) {
  const { t } = useTranslation();

  const spinnerClasses = [
    styles.spinner,
    styles[size] || styles.md,
    styles[color] || styles.primary,
    className,
  ].filter(Boolean).join(' ');

  return (
    <span className={spinnerClasses} role="status" aria-live="polite">
      <span className={styles.srOnly}>{t('ui.loading')}</span>
    </span>
  );
}

export default Spinner;

