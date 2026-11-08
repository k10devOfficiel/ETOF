import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Seo from '../../components/common/Seo.jsx';
import { Container } from '../../components/ui/Container.jsx';
import { Button } from '../../components/ui/Button.jsx';
import styles from './ActivitiesIndexPage.module.css';

/**
 * Page d'ensemble présentant de façon claire et prestigieuse les 4 activités clés d'ETOF SARL.
 */
export function ActivitiesIndexPage() {
  const { t } = useTranslation();

  const activities = [
    {
      id: 'farm',
      title: t('activities.farm', 'Ferme et élevage'),
      tagline: t('activities.farmTagline', 'Élevage responsable de volailles de chair, pondeuses et œufs frais du jour.'),
      link: '/activites/ferme',
      ctaText: t('activities.viewFarmProducts', 'Voir les volailles & produits'),
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
        </svg>
      ),
      highlights: [
        t('activities.farmPoint1', 'Poulets fermiers, pintades et volailles de ponte'),
        t('activities.farmPoint2', 'Alimentation saine et respect des normes sanitaires'),
        t('activities.farmPoint3', 'Vente aux particuliers, traiteurs et restaurants'),
      ],
    },
    {
      id: 'vehicle',
      title: t('activities.vehicle', 'Vente et location de véhicules'),
      tagline: t('activities.vehicleTagline', 'Berlines de prestige, SUV et citadines récents pour particuliers et entreprises.'),
      link: '/activites/vehicules',
      ctaText: t('activities.viewVehiclesCatalog', 'Consulter le parc automobile'),
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
        </svg>
      ),
      highlights: [
        t('activities.vehiclePoint1', 'Options achat comptant, crédit ou reprise'),
        t('activities.vehiclePoint2', 'Location courte et longue durée avec ou sans chauffeur'),
        t('activities.vehiclePoint3', 'Entretien certifié et traçabilité technique complète'),
      ],
    },
    {
      id: 'office',
      title: t('activities.office', 'Fournitures de bureau'),
      tagline: t('activities.officeTagline', 'Mobilier ergonomique, fauteuils de direction, équipements informatiques et papeterie.'),
      link: '/activites/fournitures',
      ctaText: t('activities.viewOfficeCatalog', 'Voir le mobilier & fournitures'),
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z" />
        </svg>
      ),
      highlights: [
        t('activities.officePoint1', 'Chaises et fauteuils de bureau ergonomiques'),
        t('activities.officePoint2', 'Aménagement complet d’espaces professionnels'),
        t('activities.officePoint3', 'Livraison rapide sur Abidjan et expédition nationale'),
      ],
    },
    {
      id: 'fuel',
      title: t('activities.fuel', 'Transport d’hydrocarbures'),
      tagline: t('activities.fuelTagline', 'Acheminement sécurisé de carburants et produits pétroliers par camions-citernes certifiés.'),
      link: '/activites/hydrocarbures',
      ctaText: t('activities.requestFuelQuote', 'Demander une cotation transport'),
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33 0 1.38 1.12 2.5 2.5 2.5.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v16h10v-7.5h1.5v5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V9c0-.69-.28-1.32-.73-1.77zM18 10c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zM8 18v-4.5H6V18h2zm0-6V7.5H6V12h2z" />
        </svg>
      ),
      highlights: [
        t('activities.fuelPoint1', 'Flotte de citernes étalonnées et conformes aux normes'),
        t('activities.fuelPoint2', 'Traçabilité GPS en temps réel et chauffeurs formés'),
        t('activities.fuelPoint3', 'Dessertes des dépôts côtiers et stations de l’intérieur'),
      ],
    },
  ];

  return (
    <>
      <Seo
        title={`${t('activities.metaTitle', 'Nos Activités')} – ${t('common.siteName')}`}
        description={t('activities.metaDescription', 'Découvrez les 4 pôles d’excellence d’ETOF SARL à Abidjan : élevage, vente & location de véhicules, fournitures de bureau et transport d’hydrocarbures.')}
        path="/activites"
      />

      <header className={styles.heroSection}>
        <Container size="xl">
          <h1 className={styles.heroTitle}>{t('activities.pageTitle', 'Nos Domaines d’Activité')}</h1>
          <p className={styles.heroSubtitle}>
            {t('activities.pageSubtitle', 'Une organisation multisectorielle intégrée au service des particuliers, des entreprises et des institutions en Côte d’Ivoire.')}
          </p>
        </Container>
      </header>

      <main className={styles.mainSection}>
        <Container size="xl">
          <div className={styles.grid}>
            {activities.map((act) => (
              <article key={act.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.iconWrapper}>{act.icon}</div>
                  <h2 className={styles.cardTitle}>{act.title}</h2>
                </div>

                <p className={styles.cardTagline}>{act.tagline}</p>

                <ul className={styles.highlightList}>
                  {act.highlights.map((h, idx) => (
                    <li key={idx} className={styles.highlightItem}>
                      <svg className={styles.checkIcon} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>

                <div className={styles.cardFooter}>
                  <Link to={act.link} style={{ textDecoration: 'none', width: '100%' }}>
                    <Button variant="primary" size="md" fullWidth>
                      {act.ctaText} →
                    </Button>
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {/* Section d'accompagnement B2B / Devis sur-mesure */}
          <div className={styles.bannerB2B}>
            <div className={styles.bannerContent}>
              <h2 className={styles.bannerTitle}>{t('activities.customProjectTitle', 'Un projet spécifique ou un partenariat B2B ?')}</h2>
              <p className={styles.bannerText}>
                {t('activities.customProjectText', 'Nos équipes commerciales et techniques étudient vos cahiers des charges avec réactivité.')}
              </p>
            </div>
            <div className={styles.bannerActions}>
              <Link to="/devis" style={{ textDecoration: 'none' }}>
                <Button variant="primary" size="lg">
                  {t('nav.requestQuote')}
                </Button>
              </Link>
              <Link to="/contact" style={{ textDecoration: 'none' }}>
                <Button variant="outline" size="lg">
                  {t('nav.contact')}
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </main>
    </>
  );
}

export default ActivitiesIndexPage;

