import React from 'react';
import { useTranslation } from 'react-i18next';
import { LegalPageLayout } from './LegalPageLayout.jsx';
import styles from './LegalPageLayout.module.css';

/**
 * Page officielle des Mentions Légales d'ETOF SARL.
 * Modèle juridique conforme au droit ivoirien avec repères [À COMPLÉTER] pour les champs en attente de formalisation.
 *
 * @returns {JSX.Element}
 */
export function LegalTermsPage() {
  const { t } = useTranslation();

  return (
    <LegalPageLayout
      path="/mentions-legales"
      title={t('legalTerms.title')}
      subtitle={t('legalTerms.subtitle')}
      metaTitle={t('legalTerms.metaTitle')}
      metaDescription={t('legalTerms.metaDescription')}
      lastUpdated="2026"
    >
      {/* 1. Éditeur du site */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('legalTerms.editorTitle')}</h2>
        <p className={styles.paragraph}>{t('legalTerms.editorIntro')}</p>
        <ul className={styles.list}>
          <li>
            <strong>{t('legalTerms.companyNameLabel')} :</strong> ETOF SARL
          </li>
          <li>
            <strong>{t('legalTerms.legalFormLabel')} :</strong> Société à Responsabilité Limitée (SARL){' '}
            <span className={styles.placeholderTag}>
              {t('legalTerms.placeholders.capital')}
            </span>
          </li>
          <li>
            <strong>{t('legalTerms.creationYearLabel')} :</strong> 2013
          </li>
          <li>
            <strong>{t('legalTerms.headOfficeLabel')} :</strong> Abidjan, Commune de Cocody, Quartier Angré Oscars, République de Côte d’Ivoire{' '}
            <span className={styles.placeholderTag}>
              {t('legalTerms.placeholders.postalAddress')}
            </span>
          </li>
          <li>
            <strong>{t('legalTerms.rccmLabel')} :</strong>{' '}
            <span className={styles.placeholderTag}>
              {t('legalTerms.placeholders.rccm')}
            </span>
          </li>
          <li>
            <strong>{t('legalTerms.ccLabel')} :</strong>{' '}
            <span className={styles.placeholderTag}>
              {t('legalTerms.placeholders.ccNumber')}
            </span>
          </li>
          <li>
            <strong>{t('legalTerms.emailLabel')} :</strong> contact@etofsarl.com{' '}
            <span className={styles.placeholderTag}>
              {t('legalTerms.placeholders.officialEmail')}
            </span>
          </li>
          <li>
            <strong>{t('legalTerms.phoneLabel')} :</strong>{' '}
            <span className={styles.placeholderTag}>
              {t('legalTerms.placeholders.officialPhone')}
            </span>
          </li>
        </ul>
      </section>

      {/* 2. Responsable de la publication */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('legalTerms.publishingDirectorTitle')}</h2>
        <p className={styles.paragraph}>
          <strong>{t('legalTerms.directorLabel')} :</strong>{' '}
          <span className={styles.placeholderTag}>
            {t('legalTerms.placeholders.directorName')}
          </span>
          , en sa qualité de Gérant d’ETOF SARL.
        </p>
        <p className={styles.paragraph}>{t('legalTerms.editorialContactText')}</p>
      </section>

      {/* 3. Hébergement du site */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('legalTerms.hostingTitle')}</h2>
        <p className={styles.paragraph}>{t('legalTerms.hostingIntro')}</p>
        <ul className={styles.list}>
          <li>
            <strong>{t('legalTerms.hostNameLabel')} :</strong>{' '}
            <span className={styles.placeholderTag}>
              {t('legalTerms.placeholders.hostName')}
            </span>
          </li>
          <li>
            <strong>{t('legalTerms.hostAddressLabel')} :</strong>{' '}
            <span className={styles.placeholderTag}>
              {t('legalTerms.placeholders.hostAddress')}
            </span>
          </li>
          <li>
            <strong>{t('legalTerms.hostContactLabel')} :</strong>{' '}
            <span className={styles.placeholderTag}>
              {t('legalTerms.placeholders.hostContact')}
            </span>
          </li>
        </ul>
      </section>

      {/* 4. Secteurs d'activités & Mission */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('legalTerms.activitiesTitle')}</h2>
        <p className={styles.paragraph}>{t('legalTerms.activitiesIntro')}</p>
        <ul className={styles.list}>
          <li>{t('activities.farm')}</li>
          <li>{t('activities.vehicle')}</li>
          <li>{t('activities.office')}</li>
          <li>{t('activities.fuel')}</li>
        </ul>
        <p className={styles.paragraph}>{t('legalTerms.activitiesDisclaimer')}</p>
      </section>

      {/* 5. Propriété intellectuelle */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('legalTerms.ipTitle')}</h2>
        <p className={styles.paragraph}>{t('legalTerms.ipP1')}</p>
        <p className={styles.paragraph}>{t('legalTerms.ipP2')}</p>
      </section>

      {/* 6. Responsabilité & Liens externes */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('legalTerms.liabilityTitle')}</h2>
        <p className={styles.paragraph}>{t('legalTerms.liabilityP1')}</p>
        <p className={styles.paragraph}>{t('legalTerms.liabilityP2')}</p>
      </section>

      {/* 7. Droit applicable et juridiction compétente */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('legalTerms.jurisdictionTitle')}</h2>
        <p className={styles.paragraph}>{t('legalTerms.jurisdictionP1')}</p>
        <p className={styles.paragraph}>{t('legalTerms.jurisdictionP2')}</p>
      </section>
    </LegalPageLayout>
  );
}

export default LegalTermsPage;

