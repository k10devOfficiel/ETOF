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
export function DevPlaceholder() {
  return null;
}

export default DevPlaceholder;

