import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Seo from '../../components/common/Seo.jsx';
import Container from '../../components/ui/Container.jsx';
import styles from './AboutPage.module.css';

/**
 * Page institutionnelle « À propos » présentant l'histoire, la vision,
 * les valeurs et les 4 secteurs d'activités d'ETOF SARL.
 *
 * @returns {JSX.Element}
 */
export function AboutPage() {
  const { t } = useTranslation();

  return (
    <>
      <Seo
        title={t('about.metaTitle')}
        description={t('about.metaDescription')}
        path="/a-propos"
      />

      {/* En-tête Héro */}
      <header className={styles.hero}>
        <Container size="fixed">
          <h1 className={styles.heroTitle}>{t('about.heroTitle')}</h1>
          <p className={styles.heroSubtitle}>{t('about.heroSubtitle')}</p>
        </Container>
      </header>

      {/* Section Présentation */}
      <section className={styles.section} aria-labelledby="presentation-title">
        <Container size="fixed">
          <div className={styles.twoCols}>
            <div>
              <h2 id="presentation-title" className={styles.sectionTitle}>
                {t('about.presentationTitle')}
              </h2>
              <div className={styles.textBlock}>
                <p>{t('about.presentationP1')}</p>
                <p>{t('about.presentationP2')}</p>
              </div>
            </div>

            <div className={styles.highlightCard}>
              <h3 className={styles.highlightCardTitle}>{t('about.visionTitle')}</h3>
              <p className={styles.sectionSubtitle}>{t('about.visionP1')}</p>
              <p className={styles.sectionSubtitle}>{t('about.visionP2')}</p>
            </div>
          </div>
        </Container>
      </section>

      {/* Section Notre Histoire */}
      <section
        className={`${styles.section} ${styles.sectionAlt}`}
        aria-labelledby="history-title"
      >
        <Container size="fixed">
          <div className={styles.sectionHeader}>
            <h2 id="history-title" className={styles.sectionTitle}>
              {t('about.historyTitle')}
            </h2>
          </div>

          <div className={styles.textBlock}>
            <p>{t('about.historyP1')}</p>
            <p>{t('about.historyP2')}</p>
          </div>
        </Container>
      </section>

      {/* Section Nos Valeurs */}
      <section className={styles.section} aria-labelledby="values-title">
        <Container size="fixed">
          <div className={styles.sectionHeader}>
            <h2 id="values-title" className={styles.sectionTitle}>
              {t('about.valuesTitle')}
            </h2>
            <p className={styles.sectionSubtitle}>{t('about.valuesSubtitle')}</p>
          </div>

          <div className={styles.valuesGrid}>
            {/* Valeur 1 : Excellence */}
            <article className={styles.valueCard}>
              <div className={styles.valueIconWrapper} aria-hidden="true">
                <svg className={styles.valueIcon} viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <h3 className={styles.valueTitle}>{t('about.value1Title')}</h3>
              <p className={styles.valueDesc}>{t('about.value1Desc')}</p>
            </article>

            {/* Valeur 2 : Intégrité */}
            <article className={styles.valueCard}>
              <div className={styles.valueIconWrapper} aria-hidden="true">
                <svg className={styles.valueIcon} viewBox="0 0 24 24">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                </svg>
              </div>
              <h3 className={styles.valueTitle}>{t('about.value2Title')}</h3>
              <p className={styles.valueDesc}>{t('about.value2Desc')}</p>
            </article>

            {/* Valeur 3 : Innovation */}
            <article className={styles.valueCard}>
              <div className={styles.valueIconWrapper} aria-hidden="true">
                <svg className={styles.valueIcon} viewBox="0 0 24 24">
                  <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z" />
                </svg>
              </div>
              <h3 className={styles.valueTitle}>{t('about.value3Title')}</h3>
              <p className={styles.valueDesc}>{t('about.value3Desc')}</p>
            </article>

            {/* Valeur 4 : Ancrage ivoirien */}
            <article className={styles.valueCard}>
              <div className={styles.valueIconWrapper} aria-hidden="true">
                <svg className={styles.valueIcon} viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
              </div>
              <h3 className={styles.valueTitle}>{t('about.value4Title')}</h3>
              <p className={styles.valueDesc}>{t('about.value4Desc')}</p>
            </article>
          </div>
        </Container>
      </section>

      {/* Section Nos 4 Pôles d'Activités */}
      <section
        className={`${styles.section} ${styles.sectionAlt}`}
        aria-labelledby="activities-title"
      >
        <Container size="fixed">
          <div className={styles.sectionHeader}>
            <h2 id="activities-title" className={styles.sectionTitle}>
              {t('about.activitiesTitle')}
            </h2>
            <p className={styles.sectionSubtitle}>{t('about.activitiesSubtitle')}</p>
          </div>

          <div className={styles.activitiesGrid}>
            {/* Pôle Ferme */}
            <article className={styles.activityCard}>
              <div>
                <h3 className={styles.activityCardTitle}>
                  {t('about.activityFarmTitle')}
                </h3>
                <p className={styles.activityCardDesc}>
                  {t('about.activityFarmDesc')}
                </p>
              </div>
              <Link to="/activites/ferme" className={styles.activityLink}>
                <span>{t('about.learnMore')}</span>
                <svg
                  className={styles.arrowIcon}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </article>

            {/* Pôle Véhicules */}
            <article className={styles.activityCard}>
              <div>
                <h3 className={styles.activityCardTitle}>
                  {t('about.activityVehicleTitle')}
                </h3>
                <p className={styles.activityCardDesc}>
                  {t('about.activityVehicleDesc')}
                </p>
              </div>
              <Link to="/activites/vehicules" className={styles.activityLink}>
                <span>{t('about.learnMore')}</span>
                <svg
                  className={styles.arrowIcon}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </article>

            {/* Pôle Fournitures */}
            <article className={styles.activityCard}>
              <div>
                <h3 className={styles.activityCardTitle}>
                  {t('about.activityOfficeTitle')}
                </h3>
                <p className={styles.activityCardDesc}>
                  {t('about.activityOfficeDesc')}
                </p>
              </div>
              <Link to="/activites/fournitures" className={styles.activityLink}>
                <span>{t('about.learnMore')}</span>
                <svg
                  className={styles.arrowIcon}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </article>

            {/* Pôle Hydrocarbures */}
            <article className={styles.activityCard}>
              <div>
                <h3 className={styles.activityCardTitle}>
                  {t('about.activityFuelTitle')}
                </h3>
                <p className={styles.activityCardDesc}>
                  {t('about.activityFuelDesc')}
                </p>
              </div>
              <Link to="/activites/hydrocarbures" className={styles.activityLink}>
                <span>{t('about.learnMore')}</span>
                <svg
                  className={styles.arrowIcon}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </article>
          </div>
        </Container>
      </section>

      {/* Section Équipe & Gouvernance et Certifications */}
      <section className={styles.section} aria-labelledby="governance-title">
        <Container size="fixed">
          <div className={styles.twoCols}>
            <div>
              <h2 id="governance-title" className={styles.sectionTitle}>
                {t('about.teamTitle')}
              </h2>
              <div className={styles.textBlock}>
                <p>{t('about.teamDesc')}</p>
              </div>
            </div>

            <div>
              <h2 className={styles.sectionTitle}>{t('about.certificationsTitle')}</h2>
              <div className={styles.textBlock}>
                <p>{t('about.certificationsDesc')}</p>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

export default AboutPage;

