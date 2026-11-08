import React, { useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import client from './api/client.js';
import catalog from './api/catalog.js';
import requests from './api/requests.js';
import DevUiPage from './pages/DevUi/DevUiPage.jsx';
import NotFoundPage from './pages/NotFound/NotFoundPage.jsx';
import AboutPage from './pages/About/AboutPage.jsx';
import FarmPage from './pages/Activities/FarmPage.jsx';
import VehiclesPage from './pages/Activities/VehiclesPage.jsx';
import OfficePage from './pages/Activities/OfficePage.jsx';
import FuelPage from './pages/Activities/FuelPage.jsx';
import CatalogPage from './pages/Catalog/CatalogPage.jsx';
import VehiclesCatalogPage from './pages/Vehicles/VehiclesCatalogPage.jsx';
import QuotePage from './pages/Quote/QuotePage.jsx';
import OrderSummaryPage from './pages/Order/OrderSummaryPage.jsx';
import ContactPage from './pages/Contact/ContactPage.jsx';
import LegalTermsPage from './pages/Legal/LegalTermsPage.jsx';
import PrivacyPolicyPage from './pages/Legal/PrivacyPolicyPage.jsx';
import TermsOfServicePage from './pages/Legal/TermsOfServicePage.jsx';
import Seo from './components/common/Seo.jsx';
import PublicLayout from './components/layout/PublicLayout.jsx';
import Button from './components/ui/Button.jsx';
import styles from './App.module.css';

/**
 * Composant racine avec routage SPA pour le site vitrine et commercial ETOF SARL.
 */
function App() {
  const { t } = useTranslation();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.etofApi = {
        client,
        catalog,
        requests,
      };
    }
  }, []);

  return (
    <Routes>
      {/* Route de développement UI accessible directement sans contrainte */}
      <Route path="/dev/ui" element={<DevUiPage />} />

      {/* Routes publiques enveloppées par le Layout institutionnel */}
      <Route element={<PublicLayout />}>
        <Route
          path="/"
          element={
            <div className={styles.container}>
              <Seo
                title={t('app.metaTitle')}
                description={t('app.metaDescription')}
                path="/"
              />
              <article className={styles.card}>
                <header>
                  <h1 className={styles.title}>{t('app.title')}</h1>
                  <p className={styles.subtitle}>{t('app.subtitle')}</p>
                </header>
                <nav style={{ marginTop: '2rem' }}>
                  <Link to="/dev/ui" style={{ textDecoration: 'none' }}>
                    <Button variant="primary" size="lg">
                      {t('app.link_to_dev_ui')}
                    </Button>
                  </Link>
                </nav>
              </article>
            </div>
          }
        />
        <Route path="/a-propos" element={<AboutPage />} />
        <Route path="/activites/ferme" element={<FarmPage />} />
        <Route path="/activites/vehicules" element={<VehiclesPage />} />
        <Route path="/activites/fournitures" element={<OfficePage />} />
        <Route path="/activites/hydrocarbures" element={<FuelPage />} />
        <Route path="/catalogue" element={<CatalogPage />} />
        <Route path="/catalogue/:slug" element={<CatalogPage />} />
        <Route path="/vehicules" element={<VehiclesCatalogPage />} />
        <Route path="/vehicules/:slug" element={<VehiclesCatalogPage />} />
        <Route path="/devis" element={<QuotePage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/commande" element={<OrderSummaryPage />} />
        <Route path="/recapitulatif" element={<OrderSummaryPage />} />
        <Route path="/mentions-legales" element={<LegalTermsPage />} />
        <Route path="/politique-de-confidentialite" element={<PrivacyPolicyPage />} />
        <Route path="/conditions-generales" element={<TermsOfServicePage />} />
        <Route path="/conditions" element={<TermsOfServicePage />} />
        {/* Route 404 pour toutes les adresses non trouvées */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
