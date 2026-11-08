import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './DevPlaceholder.module.css';

/**
 * Composant d'aide à l'intégration affichant un bloc d'avertissement [À COMPLÉTER PAR ETOF SARL].
 * Ce bloc n'apparaît qu'en environnement de développement (import.meta.env.DEV)
 * et est totalement masqué en production.
 *
 * @param {{
 *   topicKey?: string,
 *   className?: string
 * }} props
 * @returns {JSX.Element | null}
 */
export function DevPlaceholder({ topicKey, className = '' }) {
  const { t } = useTranslation();

  // Masqué en environnement de production
  if (!import.meta.env.DEV) {
    return null;
  }

  const label = topicKey ? t(`about.placeholders.${topicKey}`) : t('about.devPlaceholder');

  return (
    <aside
      className={`${styles.placeholderNotice} ${className}`.trim()}
      role="note"
      aria-label={label}
    >
      <svg
        className={styles.icon}
        viewBox="0 0 24 24"
        aria-hidden="true"
        role="img"
      >
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
      </svg>
      <span>{label}</span>
    </aside>
  );
}

export default DevPlaceholder;

