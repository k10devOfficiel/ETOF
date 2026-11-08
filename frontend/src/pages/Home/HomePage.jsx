import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Seo from '../../components/common/Seo.jsx';
import Container from '../../components/ui/Container.jsx';
import Button from '../../components/ui/Button.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import ProductCard from '../../components/catalog/ProductCard.jsx';
import ProductDetailModal from '../../components/catalog/ProductDetailModal.jsx';
import VehicleCard from '../../components/vehicles/VehicleCard.jsx';
import VehicleDetailModal from '../../components/vehicles/VehicleDetailModal.jsx';
import VehicleBuyModal from '../../components/vehicles/VehicleBuyModal.jsx';
import VehicleRentModal from '../../components/vehicles/VehicleRentModal.jsx';
import { getProducts, getVehicles } from '../../api/catalog.js';
import { useSettings } from '../../hooks/useSettings.js';
import styles from './HomePage.module.css';

/**
 * Page d'accueil enrichie du site vitrine et commercial ETOF SARL.
 * Vitrine institutionnelle multi-activités :
 * 1. Hero & Présentation courte de la vision et de l'ancrage ivoirien.
 * 2. Mise en valeur des 4 pôles d'activités avec accès directs.
 * 3. Aperçu des produits et véhicules phares (données réelles issues de la base).
 * 4. Pourquoi nous choisir (engagements concrets sans données factices).
 * 5. Appels à l'action finaux (devis, contact, WhatsApp direct).
 *
 * @returns {JSX.Element}
 */
export function HomePage() {
  const { t, i18n } = useTranslation();
  const { settings } = useSettings();

  // Onglet actif pour l'aperçu du catalogue (farm, office, vehicles, fuel)
  const [activeTab, setActiveTab] = useState('farm');

  // Données réelles chargées depuis l'API
  const [farmProducts, setFarmProducts] = useState([]);
  const [officeProducts, setOfficeProducts] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);

  // Modales d'interaction
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [buyVehicle, setBuyVehicle] = useState(null);
  const [rentVehicle, setRentVehicle] = useState(null);

  // Chargement des produits et véhicules phares (3 à 4 éléments)
  useEffect(() => {
    let isMounted = true;
    const fetchPreviews = async () => {
      try {
        setLoadingItems(true);
        const [farmRes, officeRes, vehRes] = await Promise.all([
          getProducts({ activity: 'farm', page: 1, per_page: 4 }),
          getProducts({ activity: 'office', page: 1, per_page: 4 }),
          getVehicles({ page: 1, per_page: 4 }),
        ]);

        if (isMounted) {
          setFarmProducts(Array.isArray(farmRes?.items) ? farmRes.items : []);
          setOfficeProducts(Array.isArray(officeRes?.items) ? officeRes.items : []);
          setVehicles(Array.isArray(vehRes?.items) ? vehRes.items : []);
        }
      } catch (err) {
        console.error('Erreur chargement aperçu catalogue accueil:', err);
      } finally {
        if (isMounted) {
          setLoadingItems(false);
        }
      }
    };

    fetchPreviews();
    return () => {
      isMounted = false;
    };
  }, [i18n.language]);

  // Construction du lien WhatsApp dynamique depuis les paramètres d'administration
  const rawWhatsApp = settings?.whatsapp || '';
  const cleanPhone = rawWhatsApp.replace(/\D/g, '');
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
        t('home.whatsappDefaultMessage', 'Bonjour ETOF SARL, je souhaite avoir des informations sur vos services.')
      )}`
    : null;

  return (
    <>
      <Seo
        title={t('home.metaTitle')}
        description={t('home.metaDescription')}
        path="/"
      />

      {/* 1. HERO SECTION */}
      <section className={styles.heroSection} aria-label={t('home.heroAriaLabel')}>
        <Container size="fixed">
          <div className={styles.heroContent}>
            <span className={styles.heroBadge}>{t('home.heroBadge')}</span>
            <h1 className={styles.heroTitle}>{t('home.heroTitle')}</h1>
            <p className={styles.heroSubtitle}>{t('home.heroSubtitle')}</p>
            <div className={styles.heroActions}>
              <Link to="/devis" style={{ textDecoration: 'none' }}>
                <Button variant="primary" size="lg">
                  {t('home.btnRequestQuote')}
                </Button>
              </Link>
              <Link to="/activites" style={{ textDecoration: 'none' }}>
                <Button variant="outline" size="lg">
                  {t('home.btnDiscoverActivities')}
                </Button>
              </Link>
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.whatsappBtn}
                  aria-label={t('home.whatsappContactAria')}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm.01 18.17c-1.49 0-2.94-.4-4.21-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.4c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c.02 4.54-3.68 8.25-8.21 8.25zm4.52-6.17c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.84-.86 2.05s.88 2.38 1 2.54c.12.17 1.73 2.65 4.2 3.71.59.25 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.07-.12-.23-.19-.48-.31z" />
                  </svg>
                  <span>{t('home.btnWhatsApp')}</span>
                </a>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* 2. PRÉSENTATION COURTE DE L'ENTREPRISE */}
      <section className={styles.aboutIntroSection} aria-label={t('home.aboutIntroTitle')}>
        <Container size="fixed">
          <div className={styles.aboutGrid}>
            <div className={styles.aboutText}>
              <span className={styles.sectionBadge}>{t('home.aboutBadge')}</span>
              <h2>{t('home.aboutIntroTitle')}</h2>
              <p>{t('home.aboutIntroP1')}</p>
              <p>{t('home.aboutIntroP2')}</p>
              <div style={{ marginTop: '1.5rem' }}>
                <Link to="/a-propos" style={{ textDecoration: 'none' }}>
                  <Button variant="outline" size="md">
                    {t('home.btnLearnMoreAboutUs')}
                  </Button>
                </Link>
              </div>
            </div>

            <aside className={styles.aboutCard}>
              <h3 className={styles.aboutCardTitle}>{t('home.aboutCardTitle')}</h3>
              <div className={styles.aboutPillList}>
                <div className={styles.aboutPillItem}>
                  <svg className={styles.aboutPillIcon} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                  <span>{t('home.aboutPillLocation')}</span>
                </div>
                <div className={styles.aboutPillItem}>
                  <svg className={styles.aboutPillIcon} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H6v-2h6v2zm4-4H6v-2h10v2zm0-4H6V7h10v2z" />
                  </svg>
                  <span>{t('home.aboutPillSlogan')}</span>
                </div>
                <div className={styles.aboutPillItem}>
                  <svg className={styles.aboutPillIcon} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                  <span>{t('home.aboutPillB2bB2c')}</span>
                </div>
              </div>
            </aside>
          </div>
        </Container>
      </section>

      {/* 3. LES 4 ACTIVITÉS MISES EN VALEUR */}
      <section className={styles.activitiesSection} aria-label={t('home.activitiesTitle')}>
        <Container size="fixed">
          <header className={styles.sectionHeader}>
            <span className={styles.sectionBadge}>{t('home.activitiesBadge')}</span>
            <h2 className={styles.sectionTitle}>{t('home.activitiesTitle')}</h2>
            <p className={styles.sectionSubtitle}>{t('home.activitiesSubtitle')}</p>
          </header>

          <div className={styles.activitiesGrid}>
            {/* 1. Élevage et vente de volailles */}
            <article className={styles.activityCard}>
              <div className={styles.activityIconBox}>
                <svg className={styles.activityIcon} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2a5 5 0 0 0-5 5c0 1.74.89 3.28 2.24 4.18A9.006 9.006 0 0 0 3 20h2a7.002 7.002 0 0 1 7-7 7.002 7.002 0 0 1 7 7h2a9.006 9.006 0 0 0-6.24-8.82A5.006 5.006 0 0 0 17 7a5 5 0 0 0-5-5zm0 2a3 3 0 0 1 3 3 3 3 0 0 1-3 3 3 3 0 0 1-3-3 3 3 0 0 1 3-3z" />
                </svg>
              </div>
              <h3 className={styles.activityTitle}>{t('home.activityFarmTitle')}</h3>
              <p className={styles.activityDesc}>{t('home.activityFarmDesc')}</p>
              <div>
                <Link to="/activites/ferme" style={{ textDecoration: 'none' }}>
                  <Button variant="outline" size="sm" fullWidth>
                    {t('home.btnViewActivity')}
                  </Button>
                </Link>
              </div>
            </article>

            {/* 2. Produits pétroliers */}
            <article className={styles.activityCard}>
              <div className={styles.activityIconBox}>
                <svg className={styles.activityIcon} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33 0 1.38 1.12 2.5 2.5 2.5.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v16h10v-7.5h1.5v5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V9c0-.69-.28-1.32-.73-1.77zM12 10H6V5h6v5zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
                </svg>
              </div>
              <h3 className={styles.activityTitle}>{t('home.activityFuelTitle')}</h3>
              <p className={styles.activityDesc}>{t('home.activityFuelDesc')}</p>
              <div>
                <Link to="/activites/hydrocarbures" style={{ textDecoration: 'none' }}>
                  <Button variant="outline" size="sm" fullWidth>
                    {t('home.btnViewActivity')}
                  </Button>
                </Link>
              </div>
            </article>

            {/* 3. Fournitures de bureau */}
            <article className={styles.activityCard}>
              <div className={styles.activityIconBox}>
                <svg className={styles.activityIcon} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z" />
                </svg>
              </div>
              <h3 className={styles.activityTitle}>{t('home.activityOfficeTitle')}</h3>
              <p className={styles.activityDesc}>{t('home.activityOfficeDesc')}</p>
              <div>
                <Link to="/activites/fournitures" style={{ textDecoration: 'none' }}>
                  <Button variant="outline" size="sm" fullWidth>
                    {t('home.btnViewActivity')}
                  </Button>
                </Link>
              </div>
            </article>

            {/* 4. Véhicules : vente et location */}
            <article className={styles.activityCard}>
              <div className={styles.activityIconBox}>
                <svg className={styles.activityIcon} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
                </svg>
              </div>
              <h3 className={styles.activityTitle}>{t('home.activityVehiclesTitle')}</h3>
              <p className={styles.activityDesc}>{t('home.activityVehiclesDesc')}</p>
              <div>
                <Link to="/vehicules" style={{ textDecoration: 'none' }}>
                  <Button variant="outline" size="sm" fullWidth>
                    {t('home.btnViewActivity')}
                  </Button>
                </Link>
              </div>
            </article>
          </div>
        </Container>
      </section>

      {/* 4. APERÇU DES PRODUITS ET VÉHICULES PHARES */}
      <section className={styles.previewSection} aria-label={t('home.previewTitle')}>
        <Container size="fixed">
          <header className={styles.sectionHeader}>
            <span className={styles.sectionBadge}>{t('home.previewBadge')}</span>
            <h2 className={styles.sectionTitle}>{t('home.previewTitle')}</h2>
            <p className={styles.sectionSubtitle}>{t('home.previewSubtitle')}</p>
          </header>

          {/* Sélecteur d'onglets de prévisualisation */}
          <div className={styles.previewTabHeader}>
            <button
              type="button"
              className={`${styles.previewTabBtn} ${activeTab === 'farm' ? styles.previewTabBtnActive : ''}`}
              onClick={() => setActiveTab('farm')}
            >
              {t('home.tabFarm', 'Ferme & Élevage')}
            </button>
            <button
              type="button"
              className={`${styles.previewTabBtn} ${activeTab === 'office' ? styles.previewTabBtnActive : ''}`}
              onClick={() => setActiveTab('office')}
            >
              {t('home.tabOffice', 'Fournitures de Bureau')}
            </button>
            <button
              type="button"
              className={`${styles.previewTabBtn} ${activeTab === 'vehicles' ? styles.previewTabBtnActive : ''}`}
              onClick={() => setActiveTab('vehicles')}
            >
              {t('home.tabVehicles', 'Véhicules')}
            </button>
            <button
              type="button"
              className={`${styles.previewTabBtn} ${activeTab === 'fuel' ? styles.previewTabBtnActive : ''}`}
              onClick={() => setActiveTab('fuel')}
            >
              {t('home.tabFuel', 'Hydrocarbures')}
            </button>
          </div>

          {loadingItems ? (
            <div style={{ textAlign: 'center', padding: '3rem 0' }} role="status">
              <Spinner size="lg" color="primary" />
            </div>
          ) : (
            <>
              {/* Onglet Ferme */}
              {activeTab === 'farm' && (
                <>
                  <div className={styles.previewGrid}>
                    {farmProducts.map((prod) => (
                      <ProductCard
                        key={prod.id}
                        product={prod}
                        onSelect={(p) => setSelectedProduct(p)}
                      />
                    ))}
                  </div>
                  <div className={styles.previewCtaBox}>
                    <Link to="/activites/ferme" style={{ textDecoration: 'none' }}>
                      <Button variant="primary" size="md">
                        {t('home.btnViewAllFarmProducts')}
                      </Button>
                    </Link>
                  </div>
                </>
              )}

              {/* Onglet Fournitures */}
              {activeTab === 'office' && (
                <>
                  <div className={styles.previewGrid}>
                    {officeProducts.map((prod) => (
                      <ProductCard
                        key={prod.id}
                        product={prod}
                        onSelect={(p) => setSelectedProduct(p)}
                      />
                    ))}
                  </div>
                  <div className={styles.previewCtaBox}>
                    <Link to="/activites/fournitures" style={{ textDecoration: 'none' }}>
                      <Button variant="primary" size="md">
                        {t('home.btnViewAllOfficeProducts')}
                      </Button>
                    </Link>
                  </div>
                </>
              )}

              {/* Onglet Véhicules */}
              {activeTab === 'vehicles' && (
                <>
                  <div className={styles.previewGrid}>
                    {vehicles.map((veh) => (
                      <VehicleCard
                        key={veh.id}
                        vehicle={veh}
                        onSelect={(v) => setSelectedVehicle(v)}
                        onBuy={(v) => setBuyVehicle(v)}
                        onRent={(v) => setRentVehicle(v)}
                      />
                    ))}
                  </div>
                  <div className={styles.previewCtaBox}>
                    <Link to="/vehicules" style={{ textDecoration: 'none' }}>
                      <Button variant="primary" size="md">
                        {t('home.btnViewAllVehicles')}
                      </Button>
                    </Link>
                  </div>
                </>
              )}

              {/* Onglet Hydrocarbures */}
              {activeTab === 'fuel' && (
                <div className={styles.fuelHighlightCard}>
                  <div>
                    <span className={styles.sectionBadge}>{t('fuel.badge')}</span>
                    <h3 className={styles.fuelHighlightTitle}>{t('home.fuelHighlightTitle')}</h3>
                    <p className={styles.fuelHighlightDesc}>{t('home.fuelHighlightDesc')}</p>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      <Link to="/activites/hydrocarbures#devis-hydrocarbures" style={{ textDecoration: 'none' }}>
                        <Button variant="primary" size="md">
                          {t('home.btnQuoteFuel')}
                        </Button>
                      </Link>
                      <Link to="/activites/hydrocarbures" style={{ textDecoration: 'none' }}>
                        <Button variant="outline" size="md">
                          {t('home.btnLearnMoreFuel')}
                        </Button>
                      </Link>
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        padding: '1.5rem',
                        background: 'var(--color-background, #ffffff)',
                        borderRadius: 'var(--radius-md, 8px)',
                        border: '1px solid var(--color-border, #e2e8f0)',
                      }}
                    >
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-muted, #64748b)' }}>
                        {t('home.fuelModePricing')}
                      </span>
                      <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary, #047857)', margin: '0.5rem 0 0' }}>
                        {t('catalog.priceOnDemand')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </Container>
      </section>

      {/* 5. POURQUOI NOUS CHOISIR (POINTS FORTS RÉELS) */}
      <section className={styles.whyUsSection} aria-label={t('home.whyUsTitle')}>
        <Container size="fixed">
          <header className={styles.sectionHeader}>
            <span className={styles.sectionBadge}>{t('home.whyUsBadge')}</span>
            <h2 className={styles.sectionTitle}>{t('home.whyUsTitle')}</h2>
            <p className={styles.sectionSubtitle}>{t('home.whyUsSubtitle')}</p>
          </header>

          <div className={styles.whyUsGrid}>
            <article className={styles.whyCard}>
              <span className={styles.whyNumber}>01</span>
              <h3 className={styles.whyTitle}>{t('home.why1Title')}</h3>
              <p className={styles.whyDesc}>{t('home.why1Desc')}</p>
            </article>

            <article className={styles.whyCard}>
              <span className={styles.whyNumber}>02</span>
              <h3 className={styles.whyTitle}>{t('home.why2Title')}</h3>
              <p className={styles.whyDesc}>{t('home.why2Desc')}</p>
            </article>

            <article className={styles.whyCard}>
              <span className={styles.whyNumber}>03</span>
              <h3 className={styles.whyTitle}>{t('home.why3Title')}</h3>
              <p className={styles.whyDesc}>{t('home.why3Desc')}</p>
            </article>

            <article className={styles.whyCard}>
              <span className={styles.whyNumber}>04</span>
              <h3 className={styles.whyTitle}>{t('home.why4Title')}</h3>
              <p className={styles.whyDesc}>{t('home.why4Desc')}</p>
            </article>
          </div>
        </Container>
      </section>

      {/* 6. APPELS À L'ACTION FINAUX */}
      <section className={styles.finalCtaSection} aria-label={t('home.finalCtaTitle')}>
        <Container size="fixed">
          <div className={styles.finalCtaContent}>
            <h2 className={styles.finalCtaTitle}>{t('home.finalCtaTitle')}</h2>
            <p className={styles.finalCtaSubtitle}>{t('home.finalCtaSubtitle')}</p>
            <div className={styles.finalCtaActions}>
              <Link to="/devis" style={{ textDecoration: 'none' }}>
                <Button variant="secondary" size="lg">
                  {t('home.btnRequestQuote')}
                </Button>
              </Link>
              <Link to="/contact" style={{ textDecoration: 'none' }}>
                <Button variant="outline" size="lg" style={{ color: '#ffffff', borderColor: '#ffffff' }}>
                  {t('home.btnContactUs')}
                </Button>
              </Link>
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.whatsappBtn}
                  aria-label={t('home.whatsappContactAria')}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm.01 18.17c-1.49 0-2.94-.4-4.21-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.4c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c.02 4.54-3.68 8.25-8.21 8.25zm4.52-6.17c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.84-.86 2.05s.88 2.38 1 2.54c.12.17 1.73 2.65 4.2 3.71.59.25 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.07-.12-.23-.19-.48-.31z" />
                  </svg>
                  <span>{t('home.btnWhatsApp')}</span>
                </a>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* Modale Fiche Produit */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
      />

      {/* Modale Détails Véhicule */}
      <VehicleDetailModal
        vehicle={selectedVehicle}
        isOpen={Boolean(selectedVehicle)}
        onClose={() => setSelectedVehicle(null)}
        onBuy={(v) => {
          setSelectedVehicle(null);
          setBuyVehicle(v);
        }}
        onRent={(v) => {
          setSelectedVehicle(null);
          setRentVehicle(v);
        }}
      />

      {/* Modale Achat Véhicule */}
      <VehicleBuyModal
        vehicle={buyVehicle}
        isOpen={Boolean(buyVehicle)}
        onClose={() => setBuyVehicle(null)}
      />

      {/* Modale Location Véhicule */}
      <VehicleRentModal
        vehicle={rentVehicle}
        isOpen={Boolean(rentVehicle)}
        onClose={() => setRentVehicle(null)}
      />
    </>
  );
}

export default HomePage;

