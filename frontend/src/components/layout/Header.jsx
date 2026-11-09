import { useState, useRef, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useOrder } from '../../context/OrderContext.jsx';
import { Container } from '../ui/Container.jsx';
import { Button } from '../ui/Button.jsx';
import { ThemeToggle } from '../ui/ThemeToggle.jsx';
import { BrandLogo } from '../common/BrandLogo.jsx';
import { MobileDrawer } from './MobileDrawer.jsx';
import styles from './Header.module.css';

/**
 * En-tête principal fixe du site ETOF SARL avec logo, navigation de premier niveau,
 * sous-menu d'activités, sélecteur bilingue et déclencheur mobile.
 *
 * @param {{
 *   settings?: Record<string, string>
 * }} props
 * @returns {JSX.Element}
 */
export function Header({ settings }) {
  const { t, i18n } = useTranslation();
  const { totalQuantity } = useOrder();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const hamburgerRef = useRef(null);

  const currentLang = (i18n.language || 'fr').slice(0, 2).toLowerCase();

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
  };

  // Fermeture du dropdown activités en cliquant en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && dropdownOpen) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropdownOpen]);

  return (
    <>
      <header className={styles.header} role="banner">
        <Container size="xl">
          <div className={styles.inner}>
            {/* Logo épuré officiel ETOF SARL */}
            <BrandLogo />

            {/* Navigation Desktop */}
            <nav className={styles.navDesktop} aria-label={t('nav.mainNavAriaLabel')}>
              <ul className={styles.navList}>
                <li>
                  <NavLink
                    to="/"
                    end
                    className={({ isActive }) =>
                      `${styles.navLink} ${isActive ? styles.activeLink : ''}`
                    }
                  >
                    {t('nav.home')}
                  </NavLink>
                </li>

                {/* Dropdown 4 activités (dépliage au survol et au clic) */}
                <li
                  className={styles.dropdownWrapper}
                  ref={dropdownRef}
                  onMouseEnter={() => setDropdownOpen(true)}
                  onMouseLeave={() => setDropdownOpen(false)}
                >
                  <button
                    type="button"
                    className={styles.dropdownTrigger}
                    onClick={() => setDropdownOpen((prev) => !prev)}
                    aria-expanded={dropdownOpen}
                    aria-haspopup="true"
                    aria-controls="activities-dropdown-menu"
                  >
                    <span>{t('nav.activities')}</span>
                    <svg
                      className={`${styles.dropdownChevron} ${
                        dropdownOpen ? styles.chevronOpen : ''
                      }`}
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      role="img"
                    >
                      <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                    </svg>
                  </button>

                  {dropdownOpen && (
                    <ul
                      id="activities-dropdown-menu"
                      className={styles.dropdownMenu}
                      role="menu"
                    >
                      <li role="none" className={styles.dropdownItem}>
                        <Link
                          to="/activites"
                          role="menuitem"
                          onClick={() => setDropdownOpen(false)}
                          style={{ fontWeight: 600, borderBottom: '1px solid var(--color-border)' }}
                        >
                          {t('activities.overview', 'Toutes nos activités')} →
                        </Link>
                      </li>
                      <li role="none" className={styles.dropdownItem}>
                        <Link
                          to="/activites/ferme"
                          role="menuitem"
                          onClick={() => setDropdownOpen(false)}
                        >
                          {t('activities.farm')}
                        </Link>
                      </li>
                      <li role="none" className={styles.dropdownItem}>
                        <Link
                          to="/activites/vehicules"
                          role="menuitem"
                          onClick={() => setDropdownOpen(false)}
                        >
                          {t('activities.vehicle')}
                        </Link>
                      </li>
                      <li role="none" className={styles.dropdownItem}>
                        <Link
                          to="/activites/fournitures"
                          role="menuitem"
                          onClick={() => setDropdownOpen(false)}
                        >
                          {t('activities.office')}
                        </Link>
                      </li>
                      <li role="none" className={styles.dropdownItem}>
                        <Link
                          to="/activites/hydrocarbures"
                          role="menuitem"
                          onClick={() => setDropdownOpen(false)}
                        >
                          {t('activities.fuel')}
                        </Link>
                      </li>
                    </ul>
                  )}
                </li>

                <li>
                  <NavLink
                    to="/catalogue"
                    className={({ isActive }) =>
                      `${styles.navLink} ${isActive ? styles.activeLink : ''}`
                    }
                  >
                    {t('nav.catalog')}
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/a-propos"
                    className={({ isActive }) =>
                      `${styles.navLink} ${isActive ? styles.activeLink : ''}`
                    }
                  >
                    {t('nav.about')}
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/contact"
                    className={({ isActive }) =>
                      `${styles.navLink} ${isActive ? styles.activeLink : ''}`
                    }
                  >
                    {t('nav.contact')}
                  </NavLink>
                </li>
              </ul>
            </nav>

            {/* Actions à droite : Sélecteur Langue, CTA Devis & Hamburger mobile */}
            <div className={styles.actions}>
              {/* Récapitulatif de commande */}
              <Link
                to="/commande"
                className={styles.orderSummaryBtn}
                aria-label={t('order.viewSummaryAria', { count: totalQuantity })}
                title={t('order.summaryTitle')}
              >
                <svg
                  className={styles.orderSummaryIcon}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
                {totalQuantity > 0 && (
                  <span className={styles.orderBadge}>
                    {totalQuantity > 99 ? '99+' : totalQuantity}
                  </span>
                )}
              </Link>

              {/* Bascule de thème Jour / Nuit / Auto */}
              <ThemeToggle />

              <div
                className={styles.langSwitcher}
                role="group"
                aria-label={t('layout.languageAriaLabel')}
              >
                <button
                  type="button"
                  className={`${styles.langBtn} ${
                    currentLang === 'fr' ? styles.langBtnActive : ''
                  }`}
                  onClick={() => changeLanguage('fr')}
                  aria-pressed={currentLang === 'fr'}
                >
                  FR
                </button>
                <button
                  type="button"
                  className={`${styles.langBtn} ${
                    currentLang === 'en' ? styles.langBtnActive : ''
                  }`}
                  onClick={() => changeLanguage('en')}
                  aria-pressed={currentLang === 'en'}
                >
                  EN
                </button>
              </div>

              <div className={styles.ctaBtnDesktop}>
                <Link to="/devis" style={{ textDecoration: 'none' }}>
                  <Button variant="primary" size="md">
                    {t('nav.requestQuote')}
                  </Button>
                </Link>
              </div>

              <button
                ref={hamburgerRef}
                type="button"
                className={styles.hamburgerBtn}
                onClick={() => setMobileOpen(true)}
                aria-expanded={mobileOpen}
                aria-label={t('nav.openMenu')}
              >
                <svg
                  className={styles.hamburgerIcon}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  role="img"
                >
                  <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
                </svg>
              </button>
            </div>
          </div>
        </Container>
      </header>

      {/* Panneau latéral mobile accessible */}
      <MobileDrawer
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        triggerRef={hamburgerRef}
      />
    </>
  );
}

export default Header;

