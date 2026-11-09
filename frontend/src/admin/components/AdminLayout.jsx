import React, { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import AdminNotificationBell from './AdminNotificationBell.jsx';
import { ADMIN_PATH } from '../../config/adminConfig.js';
import logoOfficial from '../../assets/logo/logo-etof.png';
import styles from './AdminLayout.module.css';

/**
 * Gabarit structurel de l'espace privé d'administration d'ETOF SARL.
 * Inspiré du design épuré buzzd avec sidebar blanche, groupes de navigation et top bar élégante.
 *
 * @returns {JSX.Element}
 */
export function AdminLayout() {
  const { admin, logout, sessionExpired, dismissSessionExpired } = useAuth();
  const { i18n } = useTranslation();
  const currentLang = (i18n.language || 'fr').slice(0, 2).toLowerCase();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate(`${ADMIN_PATH}/login`, { replace: true });
  };

  const navGroups = [
    {
      title: 'Vue d’ensemble',
      items: [
        {
          to: ADMIN_PATH,
          end: true,
          label: 'Tableau de bord',
          faIcon: 'fa-solid fa-gauge-high',
        },
        {
          to: `${ADMIN_PATH}/demandes`,
          label: 'Demandes & Devis',
          faIcon: 'fa-solid fa-file-invoice',
        },
      ],
    },
    {
      title: 'Les 4 Pôles d’Activités',
      items: [
        {
          to: `${ADMIN_PATH}/produits?activity=farm`,
          label: 'Ferme & Volaille',
          faIcon: 'fa-solid fa-feather-pointed',
        },
        {
          to: `${ADMIN_PATH}/vehicules`,
          label: 'Vente & Location Voitures',
          faIcon: 'fa-solid fa-car',
        },
        {
          to: `${ADMIN_PATH}/produits?activity=office`,
          label: 'Fournitures de Bureau',
          faIcon: 'fa-solid fa-briefcase',
        },
        {
          to: `${ADMIN_PATH}/demandes?activity=fuel`,
          label: 'Transport Hydrocarbures',
          faIcon: 'fa-solid fa-gas-pump',
        },
      ],
    },
    {
      title: 'Configuration',
      items: [
        {
          to: `${ADMIN_PATH}/reglages`,
          label: 'Réglages du site',
          faIcon: 'fa-solid fa-sliders',
        },
        {
          to: `${ADMIN_PATH}/mon-compte`,
          label: 'Mon compte',
          faIcon: 'fa-solid fa-user-gear',
        },
      ],
    },
  ];

  const adminInitials = admin?.name
    ? admin.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'AD';

  const todayFormatted = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  // Détermination dynamique du titre et du fil d'Ariane de la page active
  const searchParams = new URLSearchParams(location.search);
  const currentActivity = searchParams.get('activity');
  const path = location.pathname;

  let pageInfo = { title: 'Administration', icon: 'fa-solid fa-shield-halved', category: 'ETOF SARL' };
  if (path === ADMIN_PATH || path === `${ADMIN_PATH}/`) {
    pageInfo = { title: 'Tableau de bord', icon: 'fa-solid fa-gauge-high', category: 'Vue d’ensemble' };
  } else if (path.startsWith(`${ADMIN_PATH}/demandes`)) {
    if (currentActivity === 'fuel') {
      pageInfo = { title: 'Transport d’Hydrocarbures', icon: 'fa-solid fa-gas-pump', category: 'Demandes & Cotations' };
    } else {
      pageInfo = { title: 'Demandes & Devis', icon: 'fa-solid fa-file-invoice', category: 'Gestion commerciale' };
    }
  } else if (path.startsWith(`${ADMIN_PATH}/vehicules`)) {
    pageInfo = { title: 'Vente & Location de Véhicules', icon: 'fa-solid fa-car', category: 'Catalogue & Flotte' };
  } else if (path.startsWith(`${ADMIN_PATH}/produits`)) {
    if (currentActivity === 'farm') {
      pageInfo = { title: 'Ferme & Élevage de Volailles', icon: 'fa-solid fa-feather-pointed', category: 'Catalogue Produits' };
    } else if (currentActivity === 'office') {
      pageInfo = { title: 'Fournitures de Bureau', icon: 'fa-solid fa-briefcase', category: 'Catalogue Produits' };
    } else {
      pageInfo = { title: 'Catalogue des Produits', icon: 'fa-solid fa-box-open', category: 'Catalogue' };
    }
  } else if (path.startsWith(`${ADMIN_PATH}/reglages`)) {
    pageInfo = { title: 'Réglages du site', icon: 'fa-solid fa-sliders', category: 'Configuration' };
  } else if (path.startsWith(`${ADMIN_PATH}/mon-compte`)) {
    pageInfo = { title: 'Mon compte administrateur', icon: 'fa-solid fa-user-gear', category: 'Sécurité' };
  }

  return (
    <div className={styles.layoutRoot}>
      <Helmet>
        <title>Administration – ETOF SARL</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Fond sombre pour fermeture du menu mobile */}
      {mobileMenuOpen && (
        <div
          className={styles.backdrop}
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Barre latérale (Sidebar blanche épurée) */}
      <aside
        className={`${styles.sidebar} ${mobileMenuOpen ? styles.sidebarOpen : ''}`}
        aria-label="Navigation de l'administration"
      >
        <div className={styles.sidebarHeader}>
          <Link to={ADMIN_PATH} className={styles.logoLink} aria-label="Tableau de bord ETOF SARL">
            <img
              src={logoOfficial}
              alt="ETOF SARL – Une nouvelle vision du monde des affaires"
              className={styles.sidebarLogoImg}
            />
          </Link>
        </div>

        <nav className={styles.sidebarNav}>
          {navGroups.map((group) => (
            <div key={group.title} className={styles.navGroup}>
              <span className={styles.navGroupTitle}>{group.title}</span>
              {group.items.map((item) => {
                const currentFullPath = location.pathname + location.search;
                const isItemActive = item.to.includes('?')
                  ? currentFullPath === item.to
                  : location.pathname === item.to && (!location.search || item.to === ADMIN_PATH);

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`${styles.navLink} ${isItemActive ? styles.activeNavLink : ''}`}
                  >
                    <i className={`${item.faIcon} ${styles.navIcon}`} aria-hidden="true" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userCard}>
            <div className={styles.avatar} aria-hidden="true">
              {adminInitials}
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName} title={admin?.name || 'Administrateur'}>
                {admin?.name || 'Administrateur'}
              </span>
              <span className={styles.userEmail} title={admin?.email || ''}>
                {admin?.email || ''}
              </span>
            </div>
          </div>

          <button
            type="button"
            className={styles.logoutBtn}
            onClick={handleLogout}
            aria-label="Se déconnecter"
          >
            <i className="fa-solid fa-arrow-right-from-bracket" aria-hidden="true" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Zone Principale */}
      <div className={styles.mainWrapper}>
        <header className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <button
              type="button"
              className={styles.mobileMenuBtn}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Ouvrir le menu de navigation"
            >
              <i className="fa-solid fa-bars" aria-hidden="true" style={{ fontSize: '18px' }} />
            </button>

            {/* Titre et Fil d'Ariane de la page active */}
            <div className={styles.headerTitleBox}>
              <div className={styles.breadcrumb}>
                <span>Administration</span>
                <span className={styles.breadcrumbSeparator}>/</span>
                <span className={styles.breadcrumbCategory}>{pageInfo.category}</span>
              </div>
              <h1 className={styles.pageHeading}>
                <i className={`${pageInfo.icon} ${styles.headingIcon}`} aria-hidden="true" />
                <span>{pageInfo.title}</span>
              </h1>
            </div>
          </div>

          <div className={styles.topBarRight}>
            {/* Sélecteur de langue bilingue pour l'administration */}
            <div className={styles.langSwitch} role="group" aria-label="Langue d'administration">
              <button
                type="button"
                className={`${styles.langBtn} ${currentLang === 'fr' ? styles.langBtnActive : ''}`}
                onClick={() => i18n.changeLanguage('fr')}
                title="Passer l'administration en français"
              >
                FR
              </button>
              <span className={styles.langDivider}>|</span>
              <button
                type="button"
                className={`${styles.langBtn} ${currentLang === 'en' ? styles.langBtnActive : ''}`}
                onClick={() => i18n.changeLanguage('en')}
                title="Switch admin to English"
              >
                EN
              </button>
            </div>

            <AdminNotificationBell />

            <div className={styles.dateWidget}>
              <i className={`fa-regular fa-calendar ${styles.dateIcon}`} aria-hidden="true" />
              <span>{todayFormatted}</span>
            </div>

            <Link to="/" className={styles.viewSiteLink} target="_blank" rel="noopener noreferrer">
              <span>Voir le site</span>
              <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" style={{ fontSize: '11px', marginLeft: '4px' }} />
            </Link>
          </div>
        </header>

        <main className={styles.contentArea}>
          {sessionExpired && (
            <div className={styles.expiredBanner}>
              <Alert
                variant="warning"
                dismissible
                onDismiss={dismissSessionExpired}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <span>Votre session a expiré. Veuillez vous reconnecter pour poursuivre vos actions.</span>
                  <Button variant="primary" size="sm" onClick={() => navigate(`${ADMIN_PATH}/login`)}>
                    Se reconnecter
                  </Button>
                </div>
              </Alert>
            </div>
          )}

          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
