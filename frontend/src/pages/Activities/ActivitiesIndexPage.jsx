import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Seo from '../../components/common/Seo.jsx';
import { Container } from '../../components/ui/Container.jsx';
import { Button } from '../../components/ui/Button.jsx';
import Icon from '../../components/common/Icon.jsx';
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
      icon: <Icon name="feather" size={32} />,
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
      icon: <Icon name="car" size={32} />,
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
      icon: <Icon name="briefcase" size={32} />,
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
      icon: <Icon name="truck" size={32} />,
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

