import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Container } from '../ui/Container.jsx';
import { BrandLogo } from '../common/BrandLogo.jsx';
import styles from './Footer.module.css';

/**
 * Pied de page institutionnel d'ETOF SARL avec slogan, coordonnées dynamiques,
 * navigation rapide, liens légaux et réseaux sociaux.
 *
 * @param {{
 *   settings?: {
 *     phone?: string,
 *     whatsapp?: string,
 *     email?: string,
 *     address?: string,
 *     facebook?: string,
 *     instagram?: string,
 *     linkedin?: string
 *   }
 * }} props
 * @returns {JSX.Element}
 */
export function Footer({ settings = {} }) {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  const hasPhone = Boolean(settings.phone && settings.phone.trim());
  const hasEmail = Boolean(settings.email && settings.email.trim());
  const hasAddress = Boolean(settings.address && settings.address.trim());
  const hasFacebook = Boolean(settings.facebook && settings.facebook.trim());
  const hasInstagram = Boolean(settings.instagram && settings.instagram.trim());
  const hasLinkedin = Boolean(settings.linkedin && settings.linkedin.trim());
  const hasSocials = hasFacebook || hasInstagram || hasLinkedin;

  return (
    <footer className={styles.footer} role="contentinfo">
      <Container size="xl">
        <div className={styles.grid}>
          {/* Colonne Marque & Slogan */}
          <div className={styles.brandCol}>
            <BrandLogo />
            <p className={styles.slogan}>{t('layout.slogan')}</p>
            <p className={styles.description}>{t('layout.companySummary')}</p>
          </div>

          {/* Colonne Navigation Rapide */}
          <div>
            <h3 className={styles.colTitle}>{t('layout.navigationTitle')}</h3>
            <ul className={styles.linksList}>
              <li className={styles.linkItem}>
                <Link to="/">{t('nav.home')}</Link>
              </li>
              <li className={styles.linkItem}>
                <Link to="/a-propos">{t('nav.about')}</Link>
              </li>
              <li className={styles.linkItem}>
                <Link to="/catalogue">{t('nav.catalog')}</Link>
              </li>
              <li className={styles.linkItem}>
                <Link to="/devis">{t('nav.quote')}</Link>
              </li>
              <li className={styles.linkItem}>
                <Link to="/contact">{t('nav.contact')}</Link>
              </li>
            </ul>
          </div>

          {/* Colonne Activités */}
          <div>
            <h3 className={styles.colTitle}>{t('nav.activities')}</h3>
            <ul className={styles.linksList}>
              <li className={styles.linkItem}>
                <Link to="/activites/ferme">{t('activities.farm')}</Link>
              </li>
              <li className={styles.linkItem}>
                <Link to="/activites/vehicules">{t('activities.vehicle')}</Link>
              </li>
              <li className={styles.linkItem}>
                <Link to="/activites/fournitures">{t('activities.office')}</Link>
              </li>
              <li className={styles.linkItem}>
                <Link to="/activites/hydrocarbures">{t('activities.fuel')}</Link>
              </li>
            </ul>
          </div>

          {/* Colonne Coordonnées */}
          <div>
            <h3 className={styles.colTitle}>{t('layout.contactTitle')}</h3>
            <ul className={styles.contactList}>
              {hasAddress && (
                <li className={styles.contactItem}>
                  <svg
                    className={styles.contactIcon}
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    role="img"
                  >
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                  <span>{settings.address}</span>
                </li>
              )}
              {hasPhone && (
                <li className={styles.contactItem}>
                  <svg
                    className={styles.contactIcon}
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    role="img"
                  >
                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                  </svg>
                  <a href={`tel:${settings.phone.replace(/\s+/g, '')}`}>
                    {settings.phone}
                  </a>
                </li>
              )}
              {hasEmail && (
                <li className={styles.contactItem}>
                  <svg
                    className={styles.contactIcon}
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    role="img"
                  >
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                  </svg>
                  <a href={`mailto:${settings.email}`}>{settings.email}</a>
                </li>
              )}
            </ul>

            {hasSocials && (
              <div className={styles.socials} aria-label={t('layout.socialsAriaLabel')}>
                {hasFacebook && (
                  <a
                    href={settings.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.socialLink}
                    aria-label="Facebook"
                  >
                    <svg className={styles.socialIcon} viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                    </svg>
                  </a>
                )}
                {hasInstagram && (
                  <a
                    href={settings.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.socialLink}
                    aria-label="Instagram"
                  >
                    <svg className={styles.socialIcon} viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </a>
                )}
                {hasLinkedin && (
                  <a
                    href={settings.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.socialLink}
                    aria-label="LinkedIn"
                  >
                    <svg className={styles.socialIcon} viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.64 1.64 0 1 0 0-3.28 1.64 1.64 0 0 0 0 3.28m1.4 9.74v-8.37H5.06v8.37h2.8z" />
                    </svg>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Barre inférieure de copyright et légale */}
        <div className={styles.bottomBar}>
          <div>
            &copy; {currentYear} {t('common.siteName')}. {t('layout.allRightsReserved')}
          </div>
          <div className={styles.legalLinks}>
            <Link to="/mentions-legales" className={styles.legalLink}>
              {t('legal.terms')}
            </Link>
            <span aria-hidden="true">&bull;</span>
            <Link to="/politique-de-confidentialite" className={styles.legalLink}>
              {t('legal.privacy')}
            </Link>
            <span aria-hidden="true">&bull;</span>
            <Link to="/conditions-generales" className={styles.legalLink}>
              {t('legal.conditions')}
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}

export default Footer;

