import { useEffect, useRef, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useOrder } from '../../context/OrderContext.jsx';
import { Button } from '../ui/Button.jsx';
import { ThemeToggle } from '../ui/ThemeToggle.jsx';
import { BrandLogo } from '../common/BrandLogo.jsx';
import Icon from '../common/Icon.jsx';
import styles from './MobileDrawer.module.css';

/**
 * Menu mobile accessible en panneau latéral (tiroir / slide-over).
 * Supporte le piège de focus, la fermeture via Escape et la restauration du focus.
 *
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   triggerRef?: React.RefObject<HTMLButtonElement>
 * }} props
 * @returns {JSX.Element}
 */
export function MobileDrawer({ isOpen, onClose, triggerRef }) {
  const { t, i18n } = useTranslation();
  const { totalQuantity } = useOrder();
  const location = useLocation();
  const drawerRef = useRef(null);
  const closeBtnRef = useRef(null);
  const [activitiesOpen, setActivitiesOpen] = useState(false);

  // Fermeture automatique lors d'un changement de route
  useEffect(() => {
    if (isOpen) {
      onClose();
    }
  }, [location.pathname]);

  // Gestion du scroll body, touche Escape et focus trap
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Placer le focus sur le bouton de fermeture
    if (closeBtnRef.current) {
      closeBtnRef.current.focus();
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === 'Tab') {
        if (!drawerRef.current) return;
        const focusableElements = drawerRef.current.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      // Restauration du focus sur l'élément déclencheur
      if (triggerRef?.current) {
        triggerRef.current.focus();
      }
    };
  }, [isOpen, onClose, triggerRef]);

  const currentLang = (i18n.language || 'fr').slice(0, 2).toLowerCase();

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
  };

  return (
    <>
      <div
        className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={drawerRef}
        className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ''}`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!isOpen}
        aria-label={t('nav.menu')}
        tabIndex="-1"
      >
        <div className={styles.drawerHeader}>
          <BrandLogo onClick={onClose} />
          <button
            ref={closeBtnRef}
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label={t('common.close')}
          >
            <Icon name="xmark" size={24} className={styles.closeIcon} />
          </button>
        </div>

        <div className={styles.drawerBody}>
          <nav className={styles.navSection} aria-label={t('nav.mainNavAriaLabel')}>
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.activeNavLink : ''}`
              }
              onClick={onClose}
            >
              {t('nav.home')}
            </NavLink>

            <div>
              <button
                type="button"
                className={styles.accordionBtn}
                onClick={() => setActivitiesOpen((prev) => !prev)}
                aria-expanded={activitiesOpen}
                aria-controls="mobile-activities-list"
              >
                <span>{t('nav.activities')}</span>
                <span className={`${styles.accordionChevron} ${activitiesOpen ? styles.accordionOpen : ''}`} aria-hidden="true">
                  <Icon name="chevronDown" size={16} />
                </span>
              </button>

              {activitiesOpen && (
                <ul id="mobile-activities-list" className={styles.subList}>
                  <li>
                    <Link
                      to="/activites"
                      className={styles.subLink}
                      onClick={onClose}
                      style={{ fontWeight: 600, color: 'var(--color-primary)' }}
                    >
                      {t('activities.overview', 'Toutes nos activités')} →
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/activites/ferme"
                      className={styles.subLink}
                      onClick={onClose}
                    >
                      {t('activities.farm')}
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/activites/vehicules"
                      className={styles.subLink}
                      onClick={onClose}
                    >
                      {t('activities.vehicle')}
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/activites/fournitures"
                      className={styles.subLink}
                      onClick={onClose}
                    >
                      {t('activities.office')}
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/activites/hydrocarbures"
                      className={styles.subLink}
                      onClick={onClose}
                    >
                      {t('activities.fuel')}
                    </Link>
                  </li>
                </ul>
              )}
            </div>

            <NavLink
              to="/catalogue"
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.activeNavLink : ''}`
              }
              onClick={onClose}
            >
              {t('nav.catalog')}
            </NavLink>

            <NavLink
              to="/a-propos"
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.activeNavLink : ''}`
              }
              onClick={onClose}
            >
              {t('nav.about')}
            </NavLink>

            <NavLink
              to="/commande"
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.activeNavLink : ''}`
              }
              onClick={onClose}
            >
              <span>{t('order.summaryNav')}</span>
              {totalQuantity > 0 && (
                <span className={styles.mobileOrderBadge}>
                  {totalQuantity}
                </span>
              )}
            </NavLink>

            <NavLink
              to="/devis"
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.activeNavLink : ''}`
              }
              onClick={onClose}
            >
              {t('nav.quote')}
            </NavLink>

            <NavLink
              to="/contact"
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.activeNavLink : ''}`
              }
              onClick={onClose}
            >
              {t('nav.contact')}
            </NavLink>
          </nav>

          <div className={styles.ctaWrapper}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{t('theme.title', 'Thème')}</span>
              <ThemeToggle />
            </div>

            <div className={styles.langWrapper}>
              <span>{t('layout.language')}</span>
              <div role="group" aria-label={t('layout.languageAriaLabel')}>
                <Button
                  size="sm"
                  variant={currentLang === 'fr' ? 'primary' : 'outline'}
                  onClick={() => changeLanguage('fr')}
                  aria-pressed={currentLang === 'fr'}
                >
                  FR
                </Button>
                {' '}
                <Button
                  size="sm"
                  variant={currentLang === 'en' ? 'primary' : 'outline'}
                  onClick={() => changeLanguage('en')}
                  aria-pressed={currentLang === 'en'}
                >
                  EN
                </Button>
              </div>
            </div>

            <Link to="/devis" onClick={onClose} style={{ textDecoration: 'none' }}>
              <Button variant="primary" fullWidth>
                {t('nav.requestQuote')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default MobileDrawer;

