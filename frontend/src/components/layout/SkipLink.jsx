import { useTranslation } from 'react-i18next';
import styles from './SkipLink.module.css';

/**
 * Lien d'évitement accessible permettant aux utilisateurs de technologies d'assistance
 * et de navigation clavier d'accéder directement au contenu principal.
 *
 * @param {{ targetId?: string }} props
 * @returns {JSX.Element}
 */
export function SkipLink({ targetId = 'main-content' }) {
  const { t } = useTranslation();

  return (
    <a href={`#${targetId}`} className={styles.skipLink}>
      {t('layout.skipToContent')}
    </a>
  );
}

export default SkipLink;

