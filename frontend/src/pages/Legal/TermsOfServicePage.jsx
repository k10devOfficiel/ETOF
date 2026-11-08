import React from 'react';
import { useTranslation } from 'react-i18next';
import { LegalPageLayout } from './LegalPageLayout.jsx';
import styles from './LegalPageLayout.module.css';

/**
 * Page officielle des Conditions Générales de Réservation et de Commande d'ETOF SARL.
 * Modèle contractuel régissant les prestations des 4 activités avec repères [À COMPLÉTER].
 *
 * @returns {JSX.Element}
 */
export function TermsOfServicePage() {
  const { t } = useTranslation();

  return (
    <LegalPageLayout
      path="/conditions-generales"
      title={t('termsOfService.title')}
      subtitle={t('termsOfService.subtitle')}
      metaTitle={t('termsOfService.metaTitle')}
      metaDescription={t('termsOfService.metaDescription')}
      lastUpdated="2026"
    >
      {/* 1. Objet et Champ d'application */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('termsOfService.scopeTitle')}</h2>
        <p className={styles.paragraph}>{t('termsOfService.scopeP1')}</p>
        <p className={styles.paragraph}>{t('termsOfService.scopeP2')}</p>
      </section>

      {/* 2. Processus de commande et nature des demandes en ligne */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('termsOfService.orderingProcessTitle')}</h2>
        <p className={styles.paragraph}>{t('termsOfService.orderingProcessP1')}</p>
        <p className={styles.paragraph}>{t('termsOfService.orderingProcessP2')}</p>
        <p className={styles.paragraph}>{t('termsOfService.orderingProcessP3')}</p>
      </section>

      {/* 3. Dispositions relatives à la Vente et Location de Véhicules */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('termsOfService.vehiclesTitle')}</h2>
        <p className={styles.paragraph}>{t('termsOfService.vehiclesIntro')}</p>
        <ul className={styles.list}>
          <li>
            <strong>{t('termsOfService.rentalConditionsLabel')} :</strong>{' '}
            {t('termsOfService.rentalConditionsDesc')}{' '}
            <span className={styles.placeholderTag}>
              {t('termsOfService.placeholders.driverRequirements')}
            </span>
          </li>
          <li>
            <strong>{t('termsOfService.depositLabel')} :</strong>{' '}
            {t('termsOfService.depositDesc')}{' '}
            <span className={styles.placeholderTag}>
              {t('termsOfService.placeholders.depositAmount')}
            </span>
          </li>
          <li>
            <strong>{t('termsOfService.vehicleSaleLabel')} :</strong>{' '}
            {t('termsOfService.vehicleSaleDesc')}
          </li>
        </ul>
      </section>

      {/* 4. Dispositions relatives au Pôle Ferme et Élevage */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('termsOfService.farmTitle')}</h2>
        <p className={styles.paragraph}>{t('termsOfService.farmP1')}</p>
        <p className={styles.paragraph}>{t('termsOfService.farmP2')}</p>
      </section>

      {/* 5. Dispositions relatives aux Fournitures de Bureau */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('termsOfService.officeTitle')}</h2>
        <p className={styles.paragraph}>{t('termsOfService.officeP1')}</p>
        <p className={styles.paragraph}>
          {t('termsOfService.officeClaimsText')}{' '}
          <span className={styles.placeholderTag}>
            {t('termsOfService.placeholders.claimsDelay')}
          </span>
          .
        </p>
      </section>

      {/* 6. Dispositions relatives au Transport d'Hydrocarbures */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('termsOfService.fuelTitle')}</h2>
        <p className={styles.paragraph}>{t('termsOfService.fuelP1')}</p>
        <p className={styles.paragraph}>{t('termsOfService.fuelP2')}</p>
      </section>

      {/* 7. Modalités de règlement & Facturation proforma */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('termsOfService.paymentTitle')}</h2>
        <p className={styles.paragraph}>{t('termsOfService.paymentP1')}</p>
        <p className={styles.paragraph}>
          {t('termsOfService.paymentP2')}{' '}
          <span className={styles.placeholderTag}>
            {t('termsOfService.placeholders.paymentTerms')}
          </span>
        </p>
      </section>

      {/* 8. Droit applicable et Règlement des différends */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('termsOfService.jurisdictionTitle')}</h2>
        <p className={styles.paragraph}>{t('termsOfService.jurisdictionP1')}</p>
        <p className={styles.paragraph}>{t('termsOfService.jurisdictionP2')}</p>
      </section>
    </LegalPageLayout>
  );
}

export default TermsOfServicePage;

