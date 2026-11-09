import React, { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import { ADMIN_PATH } from '../../config/adminConfig.js';
import logoSrc from '../../assets/logo/logo.svg';
import styles from './AdminLayout.module.css';

/**
 * Gabarit structurel de l'espace privé d'administration d'ETOF SARL.
 * Intègre la barre latérale de navigation (Tableau de bord, Demandes, Produits, Véhicules, Réglages),
 * le bandeau supérieur de statut, le bouton de déconnexion et l'alerte de session expirée.
 * Protégé par une balise méta noindex permanente.
 *
 * @returns {JSX.Element}
 */
export function AdminLayout() {
  const { admin, logout, sessionExpired, dismissSessionExpired } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate(`${ADMIN_PATH}/login`, { replace: true });
  };

  const navItems = [
    {
      to: ADMIN_PATH,
      end: true,
      label: 'Tableau de bord',
      icon: (
        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
      ),
    },
    {
      to: `${ADMIN_PATH}/demandes`,
      label: 'Demandes',
      icon: (
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
      ),
    },
    {
      to: `${ADMIN_PATH}/produits`,
      label: 'Produits',
      icon: (
        <path d="M18 6h-2c0-2.21-1.79-4-4-4S8 3.79 8 6H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6-2c1.1 0 2 .9 2 2h-4c0-1.1.9-2 2-2zm6 16H6V8h2v2c0 .55.45 1 1 1s1-.45 1-1V8h4v2c0 .55.45 1 1 1s1-.45 1-1V8h2v12z" />
      ),
    },
    {
      to: `${ADMIN_PATH}/vehicules`,
      label: 'Véhicules',
      icon: (
        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
      ),
    },
    {
      to: `${ADMIN_PATH}/reglages`,
      label: 'Réglages',
      icon: (
        <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
      ),
    },
    {
      to: `${ADMIN_PATH}/mon-compte`,
      label: 'Mon compte',
      icon: (
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      ),
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

      {/* Barre latérale (Sidebar) */}
      <aside
        className={`${styles.sidebar} ${mobileMenuOpen ? styles.sidebarOpen : ''}`}
        aria-label="Navigation de l'administration"
      >
        <div className={styles.sidebarHeader}>
          <Link to="/admin" className={styles.logoLink} aria-label="Tableau de bord" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: 'var(--font-family-heading, serif)', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '0.06em', color: '#ffffff' }}>
              ETOF <span style={{ color: 'var(--color-accent, #14B8C4)' }}>SARL</span>
            </span>
          </Link>
          <span className={styles.adminBadge}>Espace Privé</span>
        </div>

        <nav className={styles.sidebarNav}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.activeNavLink : ''}`
              }
            >
              <svg className={styles.navIcon} viewBox="0 0 24 24" aria-hidden="true">
                {item.icon}
              </svg>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userBlock}>
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
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
            </svg>
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
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
              </svg>
            </button>
          </div>

          <div className={styles.topBarRight}>
            <Link to="/" className={styles.viewSiteLink} target="_blank" rel="noopener noreferrer">
              <span>Voir le site public</span>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
                <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
              </svg>
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
                  <Button variant="primary" size="sm" onClick={() => navigate('/admin/login')}>
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

