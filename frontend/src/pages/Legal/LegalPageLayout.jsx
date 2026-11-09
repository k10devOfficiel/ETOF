import React from 'react';
import { useTranslation } from 'react-i18next';
import Seo from '../../components/common/Seo.jsx';
import Breadcrumb from '../../components/common/Breadcrumb.jsx';
import { Container } from '../../components/ui/Container.jsx';
import styles from './LegalPageLayout.module.css';

/**
 * Gabarit réutilisable pour les pages légales du site ETOF SARL.
 * Intègre le bandeau hero de prestige, l'encart d'avertissement de développement
 * obligatoire pour la relecture par un juriste, et le conteneur typographique accessible.
 *
 * @param {{
 *   path?: string,
 *   title: string,
 *   subtitle: string,
 *   metaTitle: string,
 *   metaDescription: string,
 *   tag?: string,
 *   lastUpdated?: string,
 *   children: React.ReactNode
 * }} props
 * @returns {JSX.Element}
 */
export function LegalPageLayout({
  path,
  title,
  subtitle,
  metaTitle,
  metaDescription,
  tag,
  lastUpdated,
  children,
}) {
  const { t } = useTranslation();
  const isDev = Boolean(import.meta.env.DEV);

  return (
    <main className={styles.page}>
      <Seo
        title={`${metaTitle} – ${t('common.siteName')}`}
        description={metaDescription}
        path={path}
      />

      {/* En-tête / Hero */}
      <section className={styles.hero} aria-labelledby="legal-page-title">
        <Container size="xl">
          <div style={{ marginBottom: '1.5rem' }}>
            <Breadcrumb
              items={[
                { label: t('nav.home', 'Accueil'), to: '/' },
                { label: title },
              ]}
            />
          </div>
          <span className={styles.heroTag}>{tag || t('legal.defaultTag')}</span>
          <h1 id="legal-page-title" className={styles.heroTitle}>
            {title}
          </h1>
          <p className={styles.heroSubtitle}>{subtitle}</p>
        </Container>
      </section>

      <Container size="xl">
        {/* Note interne visible exclusivement en environnement de développement */}
        {isDev && (
          <aside className={styles.devAlert} role="note" aria-label={t('legal.devNoteTitle')}>
            <svg className={styles.devAlertIcon} viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            <div>
              <div className={styles.devAlertTitle}>{t('legal.devNoteTitle')}</div>
              <div>{t('legal.devNoteMessage')}</div>
            </div>
          </aside>
        )}

        {/* Contenu textuel structuré */}
        <div className={styles.contentCard}>
          <article className={styles.article}>
            {children}
            {lastUpdated && (
              <footer className={styles.updateDate}>
                {t('legal.lastUpdated', { date: lastUpdated })}
              </footer>
            )}
          </article>
        </div>
      </Container>
    </main>
  );
}

export default LegalPageLayout;

