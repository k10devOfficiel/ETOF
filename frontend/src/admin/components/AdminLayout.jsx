import React, { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
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
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`${ADMIN_PATH}/demandes?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

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

            <form onSubmit={handleSearchSubmit} className={styles.searchBar}>
              <i className={`fa-solid fa-magnifying-glass ${styles.searchIcon}`} aria-hidden="true" />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Rechercher une demande, un client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Recherche rapide"
              />
              <span className={styles.searchShortcut}>⌘ /</span>
            </form>
          </div>

          <div className={styles.topBarRight}>
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
