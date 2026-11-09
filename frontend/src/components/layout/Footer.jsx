import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Container } from '../ui/Container.jsx';
import { BrandLogo } from '../common/BrandLogo.jsx';
import Icon from '../common/Icon.jsx';
import styles from './Footer.module.css';

/**
 * Pied de page institutionnel d'ETOF SARL.
 * Organisé de façon cohérente en colonnes dans l'ordre strict :
 * 1. Logo, slogan et description
 * 2. Nos activités
 * 3. Liens rapides
 * 4. Contact (adresse, téléphone, WhatsApp, e-mail, horaires, icônes Font Awesome)
 * 5. Réseaux sociaux
 * En bas : mentions légales, confidentialité, copyright.
 *
 * @param {{
 *   settings?: {
 *     phone?: string,
 *     whatsapp?: string,
 *     email?: string,
 *     address?: string,
 *     opening_hours?: string,
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

  const address = settings.address || 'Abidjan Cocody Angré Oscars, Côte d’Ivoire';
  const phone = settings.phone || '+225 07 00 00 00 00';
  const email = settings.email || 'contact@etofsarl.ci';
  const hours = settings.opening_hours || 'Lun - Ven : 08h00 - 18h00 | Sam : 08h30 - 13h00';
  const rawWhatsApp = settings.whatsapp || '+225 07 00 00 00 00';
  const cleanWhatsApp = rawWhatsApp.replace(/\D/g, '');
  const whatsappUrl = cleanWhatsApp
    ? `https://wa.me/${cleanWhatsApp}?text=${encodeURIComponent(
        t('layout.whatsappMessage', 'Bonjour ETOF SARL, je souhaite obtenir des informations sur vos services.')
      )}`
    : null;

  const facebookUrl = settings.facebook || 'https://facebook.com';
  const instagramUrl = settings.instagram || 'https://instagram.com';
  const linkedinUrl = settings.linkedin || 'https://linkedin.com';

  return (
    <footer className={styles.footer} role="contentinfo">
      <Container size="xl">
        <div className={styles.grid}>
          {/* Colonne 1 : Logo, Slogan et Description */}
          <div className={styles.brandCol}>
            <BrandLogo />
            <p className={styles.slogan}>« {t('layout.slogan')} »</p>
            <p className={styles.description}>{t('layout.companySummary')}</p>
          </div>

          {/* Colonne 2 : Nos Activités */}
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

          {/* Colonne 3 : Liens Rapides */}
          <div>
            <h3 className={styles.colTitle}>{t('layout.navigationTitle', 'Liens rapides')}</h3>
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
                <Link to="/vehicules">{t('nav.vehicles', 'Véhicules')}</Link>
              </li>
              <li className={styles.linkItem}>
                <Link to="/devis">{t('nav.quote')}</Link>
              </li>
              <li className={styles.linkItem}>
                <Link to="/contact">{t('nav.contact')}</Link>
              </li>
            </ul>
          </div>

          {/* Colonne 4 : Contact avec icônes Font Awesome Free */}
          <div>
            <h3 className={styles.colTitle}>{t('layout.contactTitle')}</h3>
            <ul className={styles.contactList}>
              <li className={styles.contactItem}>
                <Icon name="location-dot" size={18} className={styles.contactIcon} />
                <span>{address}</span>
              </li>
              <li className={styles.contactItem}>
                <Icon name="phone" size={18} className={styles.contactIcon} />
                <a href={`tel:${phone.replace(/\s+/g, '')}`}>
                  {phone}
                </a>
              </li>
              {whatsappUrl && (
                <li className={styles.contactItem}>
                  <Icon name="whatsapp" size={18} className={styles.contactIcon} />
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t('layout.whatsappAriaLabel')}
                  >
                    WhatsApp : {rawWhatsApp}
                  </a>
                </li>
              )}
              <li className={styles.contactItem}>
                <Icon name="envelope" size={18} className={styles.contactIcon} />
                <a href={`mailto:${email}`}>{email}</a>
              </li>
              <li className={styles.contactItem}>
                <Icon name="clock" size={18} className={styles.contactIcon} />
                <span>{hours}</span>
              </li>
            </ul>
          </div>

          {/* Colonne 5 : Réseaux Sociaux */}
          <div>
            <h3 className={styles.colTitle}>{t('layout.socialsAriaLabel', 'Réseaux sociaux')}</h3>
            <p className={styles.socialDesc}>
              {t('layout.followUs', 'Suivez notre actualité sur nos plateformes professionnelles.')}
            </p>
            <div className={styles.socials} aria-label={t('layout.socialsAriaLabel')}>
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                aria-label="Facebook"
              >
                <Icon name="facebook" size={20} />
              </a>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                aria-label="Instagram"
              >
                <Icon name="instagram" size={20} />
              </a>
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                aria-label="LinkedIn"
              >
                <Icon name="linkedin" size={20} />
              </a>
            </div>
          </div>
        </div>

        {/* En bas : Mentions légales, Confidentialité, CGV, Copyright */}
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
