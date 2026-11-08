import React from 'react';
import { useTranslation } from 'react-i18next';
import { LegalPageLayout } from './LegalPageLayout.jsx';
import styles from './LegalPageLayout.module.css';

/**
 * Page officielle de Politique de Confidentialité d'ETOF SARL.
 * Conforme à la Loi n° 2013-450 du 19 juin 2013 relative à la protection des données
 * à caractère personnel en République de Côte d’Ivoire (régulée par l'ARTCI).
 *
 * @returns {JSX.Element}
 */
export function PrivacyPolicyPage() {
  const { t } = useTranslation();

  return (
    <LegalPageLayout
      path="/politique-de-confidentialite"
      title={t('privacyPolicy.title')}
      subtitle={t('privacyPolicy.subtitle')}
      metaTitle={t('privacyPolicy.metaTitle')}
      metaDescription={t('privacyPolicy.metaDescription')}
      lastUpdated="2026"
    >
      {/* 1. Engagement & Cadre juridique ivoirien */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('privacyPolicy.frameworkTitle')}</h2>
        <p className={styles.paragraph}>{t('privacyPolicy.frameworkP1')}</p>
        <p className={styles.paragraph}>{t('privacyPolicy.frameworkP2')}</p>
        <p className={styles.paragraph}>
          <strong>{t('privacyPolicy.controllerLabel')} :</strong> ETOF SARL, sise à Abidjan Cocody Angré Oscars{' '}
          <span className={styles.placeholderTag}>
            {t('privacyPolicy.placeholders.dpoContact')}
          </span>
          .
        </p>
      </section>

      {/* 2. Données personnelles collectées */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('privacyPolicy.dataCollectedTitle')}</h2>
        <p className={styles.paragraph}>{t('privacyPolicy.dataCollectedIntro')}</p>
        <ul className={styles.list}>
          <li>
            <strong>{t('privacyPolicy.formDataLabel')} :</strong>{' '}
            {t('privacyPolicy.formDataDesc')}
          </li>
          <li>
            <strong>{t('privacyPolicy.technicalDataLabel')} :</strong>{' '}
            {t('privacyPolicy.technicalDataDesc')}
          </li>
        </ul>
        <p className={styles.paragraph}>{t('privacyPolicy.noSensitiveDataText')}</p>
      </section>

      {/* 3. Finalités des traitements */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('privacyPolicy.purposesTitle')}</h2>
        <p className={styles.paragraph}>{t('privacyPolicy.purposesIntro')}</p>
        <ul className={styles.list}>
          <li>{t('privacyPolicy.purpose1')}</li>
          <li>{t('privacyPolicy.purpose2')}</li>
          <li>{t('privacyPolicy.purpose3')}</li>
          <li>{t('privacyPolicy.purpose4')}</li>
        </ul>
      </section>

      {/* 4. Durée de conservation des données */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('privacyPolicy.retentionTitle')}</h2>
        <p className={styles.paragraph}>{t('privacyPolicy.retentionIntro')}</p>
        <ul className={styles.list}>
          <li>
            <strong>{t('privacyPolicy.commercialDataRetentionLabel')} :</strong>{' '}
            <span className={styles.placeholderTag}>
              {t('privacyPolicy.placeholders.commercialRetention')}
            </span>
          </li>
          <li>
            <strong>{t('privacyPolicy.technicalLogsRetentionLabel')} :</strong>{' '}
            <span className={styles.placeholderTag}>
              {t('privacyPolicy.placeholders.logsRetention')}
            </span>
          </li>
        </ul>
      </section>

      {/* 5. Destinataires et absence de revente */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('privacyPolicy.recipientsTitle')}</h2>
        <p className={styles.paragraph}>{t('privacyPolicy.recipientsP1')}</p>
        <p className={styles.paragraph}>{t('privacyPolicy.recipientsP2')}</p>
      </section>

      {/* 6. Droits des personnes (Loi n° 2013-450) */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('privacyPolicy.rightsTitle')}</h2>
        <p className={styles.paragraph}>{t('privacyPolicy.rightsIntro')}</p>
        <ul className={styles.list}>
          <li>
            <strong>{t('privacyPolicy.rightAccessLabel')} :</strong>{' '}
            {t('privacyPolicy.rightAccessDesc')}
          </li>
          <li>
            <strong>{t('privacyPolicy.rightRectificationLabel')} :</strong>{' '}
            {t('privacyPolicy.rightRectificationDesc')}
          </li>
          <li>
            <strong>{t('privacyPolicy.rightErasureLabel')} :</strong>{' '}
            {t('privacyPolicy.rightErasureDesc')}
          </li>
          <li>
            <strong>{t('privacyPolicy.rightOppositionLabel')} :</strong>{' '}
            {t('privacyPolicy.rightOppositionDesc')}
          </li>
        </ul>
        <p className={styles.paragraph}>
          <strong>{t('privacyPolicy.exerciseContactLabel')} :</strong>{' '}
          <span className={styles.placeholderTag}>
            {t('privacyPolicy.placeholders.exerciseEmail')}
          </span>
          .
        </p>
        <p className={styles.paragraph}>{t('privacyPolicy.artciRecourse')}</p>
      </section>

      {/* 7. Politique relative aux cookies & traceurs */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('privacyPolicy.cookiesTitle')}</h2>
        <p className={styles.paragraph}>{t('privacyPolicy.cookiesP1')}</p>
        <p className={styles.paragraph}>{t('privacyPolicy.cookiesP2')}</p>
      </section>

      {/* 8. Sécurité des systèmes et confidentialité */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('privacyPolicy.securityTitle')}</h2>
        <p className={styles.paragraph}>{t('privacyPolicy.securityP1')}</p>
      </section>
    </LegalPageLayout>
  );
}

export default PrivacyPolicyPage;

