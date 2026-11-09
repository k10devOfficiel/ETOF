import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './admin/context/AuthContext.jsx';
import ProtectedRoute from './admin/components/ProtectedRoute.jsx';
import AdminLayout from './admin/components/AdminLayout.jsx';
import PublicLayout from './components/layout/PublicLayout.jsx';
import Spinner from './components/ui/Spinner.jsx';
import { ADMIN_PATH } from './config/adminConfig.js';

/**
 * Chargement différé (code-splitting / lazy loading) de l'ensemble des pages.
 * Permet de réduire la taille du bundle initial et d'accélérer l'affichage sur mobile et connexion lente.
 */
const LoginPage = React.lazy(() => import('./admin/pages/LoginPage.jsx'));
const DashboardPage = React.lazy(() => import('./admin/pages/DashboardPage.jsx'));
const RequestsPage = React.lazy(() => import('./admin/pages/RequestsPage.jsx'));
const ProductsPage = React.lazy(() => import('./admin/pages/ProductsPage.jsx'));
const VehiclesPageAdmin = React.lazy(() => import('./admin/pages/VehiclesPage.jsx'));
const SettingsPage = React.lazy(() => import('./admin/pages/SettingsPage.jsx'));
const ProfilePage = React.lazy(() => import('./admin/pages/ProfilePage.jsx'));

const HomePage = React.lazy(() => import('./pages/Home/HomePage.jsx'));
const ActivitiesIndexPage = React.lazy(() => import('./pages/Activities/ActivitiesIndexPage.jsx'));
const NotFoundPage = React.lazy(() => import('./pages/NotFound/NotFoundPage.jsx'));
const AboutPage = React.lazy(() => import('./pages/About/AboutPage.jsx'));
const FarmPage = React.lazy(() => import('./pages/Activities/FarmPage.jsx'));
const VehiclesPage = React.lazy(() => import('./pages/Activities/VehiclesPage.jsx'));
const OfficePage = React.lazy(() => import('./pages/Activities/OfficePage.jsx'));
const FuelPage = React.lazy(() => import('./pages/Activities/FuelPage.jsx'));
const CatalogPage = React.lazy(() => import('./pages/Catalog/CatalogPage.jsx'));
const VehiclesCatalogPage = React.lazy(() => import('./pages/Vehicles/VehiclesCatalogPage.jsx'));
const QuotePage = React.lazy(() => import('./pages/Quote/QuotePage.jsx'));
const OrderSummaryPage = React.lazy(() => import('./pages/Order/OrderSummaryPage.jsx'));
const ContactPage = React.lazy(() => import('./pages/Contact/ContactPage.jsx'));
const LegalTermsPage = React.lazy(() => import('./pages/Legal/LegalTermsPage.jsx'));
const PrivacyPolicyPage = React.lazy(() => import('./pages/Legal/PrivacyPolicyPage.jsx'));
const TermsOfServicePage = React.lazy(() => import('./pages/Legal/TermsOfServicePage.jsx'));

/**
 * Écran de transition accessible affiché pendant le chargement à la demande d'un composant de page.
 */
function PageLoader() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: '3rem',
      }}
      role="status"
      aria-live="polite"
    >
      <Spinner size="lg" color="primary" />
      <span style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', border: 0 }}>
        Chargement de la page…
      </span>
    </div>
  );
}

/**
 * Composant racine avec routage SPA et chargement différé pour le site vitrine et commercial ETOF SARL.
 */
function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Espace privé d'Administration sur URL secrète (obfusquée, non référencée, noindex) */}
          <Route path={`${ADMIN_PATH}/login`} element={<LoginPage />} />
          <Route
            path={ADMIN_PATH}
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="demandes" element={<RequestsPage />} />
            <Route path="produits" element={<ProductsPage />} />
            <Route path="vehicules" element={<VehiclesPageAdmin />} />
            <Route path="reglages" element={<SettingsPage />} />
            <Route path="mon-compte" element={<ProfilePage />} />
          </Route>

          {/* Routes publiques enveloppées par le Layout institutionnel */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/a-propos" element={<AboutPage />} />
            <Route path="/activites" element={<ActivitiesIndexPage />} />
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
            {/* Route 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}

export default App;
