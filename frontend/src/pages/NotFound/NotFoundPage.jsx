import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Seo from '../../components/common/Seo.jsx';
import { Button } from '../../components/ui/Button.jsx';
import styles from './NotFoundPage.module.css';

/**
 * Page d'erreur 404 soignée et accessible affichée en cas d'URL introuvable.
 *
 * @returns {JSX.Element}
 */
export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className={styles.container}>
      <Seo
        title={`${t('notFound.pageTitle')} - ${t('common.siteName')}`}
        description={t('notFound.description')}
        noindex
      />

      <div className={styles.card}>
        <span className={styles.errorCode} aria-hidden="true">
          404
        </span>
        <h1 className={styles.title}>{t('notFound.title')}</h1>
        <p className={styles.description}>{t('notFound.description')}</p>
        <div className={styles.actions}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="lg">
              {t('notFound.backHome')}
            </Button>
          </Link>
          <Link to="/catalogue" style={{ textDecoration: 'none' }}>
            <Button variant="outline" size="lg">
              {t('notFound.browseCatalog')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;

