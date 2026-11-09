import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Seo from '../../components/common/Seo.jsx';
import { getSettings } from '../../api/catalog.js';
import { Container } from '../../components/ui/Container.jsx';
import { RequestForm } from '../../components/forms/RequestForm.jsx';
import styles from './ContactPage.module.css';

/**
 * Nettoie une chaîne de numéro téléphonique pour constituer une URL WhatsApp internationale.
 *
 * @param {string} raw
 * @returns {string}
 */
function sanitizePhoneForWhatsApp(raw) {
  if (!raw) return '';
  return raw.replace(/[^0-9]/g, '');
}

/**
 * Page officielle de contact pour ETOF SARL.
 * Affiche l'ensemble des coordonnées lues dynamiquement depuis les réglages (adresse, téléphone,
 * WhatsApp, email, réseaux sociaux et horaires) en masquant rigoureusement toute valeur non renseignée.
 * Propose des boutons d'action directe (Appeler, WhatsApp), un formulaire de contact unifié
 * avec sélecteur de sujet, et un emplacement de carte sécurisé sans iframe avec liens Google Maps et OpenStreetMap.
 *
 * @returns {JSX.Element}
 */
export function ContactPage() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState({
    address: 'Abidjan, Cocody, Angré Oscars',
    phone: '',
    whatsapp: '',
    email: '',
    facebook: '',
    instagram: '',
    linkedin: '',
    opening_hours: '',
  });

  useEffect(() => {
    let isMounted = true;
    getSettings()
      .then((data) => {
        if (isMounted && data) {
          setSettings((prev) => ({
            ...prev,
            ...data,
          }));
        }
      })
      .catch((error) => {
        if (import.meta.env.DEV) {
          console.warn('Impossible de charger les réglages de contact:', error);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const hasAddress = Boolean(settings.address && settings.address.trim());
  const hasPhone = Boolean(settings.phone && settings.phone.trim());
  const hasWhatsApp = Boolean(settings.whatsapp && settings.whatsapp.trim());
  const hasEmail = Boolean(settings.email && settings.email.trim());
  const hasHours = Boolean(settings.opening_hours && settings.opening_hours.trim());
  const hasSocials = Boolean(
    (settings.facebook && settings.facebook.trim()) ||
    (settings.instagram && settings.instagram.trim()) ||
    (settings.linkedin && settings.linkedin.trim())
  );

  const cleanWhatsAppNumber = sanitizePhoneForWhatsApp(settings.whatsapp);
  const cleanPhoneNumber = settings.phone ? settings.phone.replace(/\s+/g, '') : '';

  const encodedMapQuery = encodeURIComponent(
    hasAddress ? `${settings.address}, Côte d'Ivoire` : 'ETOF SARL Abidjan Cocody Angré Oscars'
  );
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedMapQuery}`;
  const openStreetMapUrl = `https://www.openstreetmap.org/search?query=${encodedMapQuery}`;

  return (
    <main className={styles.page}>
      <Seo
        title={`${t('contact.pageTitle')} – ${t('common.siteName')}`}
        description={t('contact.pageSubtitle')}
        path="/contact"
      />

      {/* En-tête / Bannière Hero */}
      <section className={styles.hero} aria-labelledby="contact-heading">
        <Container size="xl">
          <h1 id="contact-heading" className={styles.heroTitle}>
            {t('contact.pageTitle')}
          </h1>
          <p className={styles.heroSubtitle}>{t('contact.pageSubtitle')}</p>
        </Container>
      </section>

      <Container size="xl">
        <div className={styles.grid}>
          {/* Colonne de gauche : Coordonnées & Accès direct */}
          <div className={styles.infoColumn}>
            <article className={styles.card} aria-labelledby="contact-details-title">
              <h2 id="contact-details-title" className={styles.cardTitle}>
                {t('contact.detailsTitle')}
              </h2>
              <p className={styles.cardSubtitle}>
                {t('contact.detailsSubtitle')}
              </p>

              {/* Boutons d'action rapide : Appeler & WhatsApp */}
              {(hasPhone || hasWhatsApp) && (
                <div className={styles.quickActions} role="group" aria-label={t('contact.quickActionsAria')}>
                  {hasPhone && (
                    <a
                      href={`tel:${cleanPhoneNumber}`}
                      className={styles.callBtn}
                      aria-label={`${t('contact.callBtn')} : ${settings.phone}`}
                    >
                      <svg className={styles.actionIcon} viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                      </svg>
                      <span>{t('contact.callBtn')}</span>
                    </a>
                  )}

                  {hasWhatsApp && (
                    <a
                      href={`https://wa.me/${cleanWhatsAppNumber}?text=${encodeURIComponent(
                        t('layout.whatsappMessage')
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.whatsappBtn}
                      aria-label={t('layout.whatsappAriaLabel')}
                    >
                      <svg className={styles.actionIcon} viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.13.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.53.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.07-.12-.23-.19-.48-.32z" />
                      </svg>
                      <span>{t('contact.whatsappBtn')}</span>
                    </a>
                  )}
                </div>
              )}

              {/* Coordonnées détaillées (masque strictement les valeurs vides) */}
              <address className={styles.detailsList}>
                {hasAddress && (
                  <div className={styles.detailItem}>
                    <div className={styles.iconWrapper} aria-hidden="true">
                      <i className="fa-solid fa-location-dot" style={{ fontSize: '18px' }} />
                    </div>
                    <div className={styles.itemText}>
                      <span className={styles.itemLabel}>{t('contact.addressLabel')}</span>
                      <span className={styles.itemValue}>{settings.address}</span>
                    </div>
                  </div>
                )}

                {hasPhone && (
                  <div className={styles.detailItem}>
                    <div className={styles.iconWrapper} aria-hidden="true">
                      <i className="fa-solid fa-phone" style={{ fontSize: '18px' }} />
                    </div>
                    <div className={styles.itemText}>
                      <span className={styles.itemLabel}>{t('contact.phoneLabel')}</span>
                      <a href={`tel:${cleanPhoneNumber}`} className={styles.itemValue}>
                        {settings.phone}
                      </a>
                    </div>
                  </div>
                )}

                {hasEmail && (
                  <div className={styles.detailItem}>
                    <div className={styles.iconWrapper} aria-hidden="true">
                      <i className="fa-solid fa-envelope" style={{ fontSize: '18px' }} />
                    </div>
                    <div className={styles.itemText}>
                      <span className={styles.itemLabel}>{t('contact.emailLabel')}</span>
                      <a href={`mailto:${settings.email}`} className={styles.itemValue}>
                        {settings.email}
                      </a>
                    </div>
                  </div>
                )}

                {hasWhatsApp && (
                  <div className={styles.detailItem}>
                    <div className={styles.iconWrapper} aria-hidden="true">
                      <i className="fa-brands fa-whatsapp" style={{ fontSize: '20px' }} />
                    </div>
                    <div className={styles.itemText}>
                      <span className={styles.itemLabel}>{t('contact.whatsappLabel')}</span>
                      <a
                        href={`https://wa.me/${cleanWhatsAppNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.itemValue}
                      >
                        {settings.whatsapp}
                      </a>
                    </div>
                  </div>
                )}
              </address>

              {/* Horaires d'ouverture si renseignés */}
              {hasHours && (
                <div className={styles.hoursBox} role="note">
                  <h3 className={styles.hoursTitle}>
                    <i className="fa-solid fa-clock" aria-hidden="true" style={{ fontSize: '18px', marginRight: '8px' }} />
                    <span>{t('contact.hoursTitle')}</span>
                  </h3>
                  <p style={{ margin: 0 }}>{settings.opening_hours}</p>
                </div>
              )}

              {/* Réseaux sociaux (masque ceux qui sont vides) */}
              {hasSocials && (
                <div className={styles.socialsBox}>
                  <h3 className={styles.socialsTitle}>{t('contact.socialsTitle')}</h3>
                  <ul className={styles.socialsList}>
                    {settings.facebook && settings.facebook.trim() && (
                      <li>
                        <a
                          href={settings.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.socialLink}
                          aria-label={t('contact.facebookAria')}
                        >
                          <i className="fa-brands fa-facebook" aria-hidden="true" style={{ fontSize: '18px' }} />
                        </a>
                      </li>
                    )}
                    {settings.instagram && settings.instagram.trim() && (
                      <li>
                        <a
                          href={settings.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.socialLink}
                          aria-label={t('contact.instagramAria')}
                        >
                          <i className="fa-brands fa-instagram" aria-hidden="true" style={{ fontSize: '18px' }} />
                        </a>
                      </li>
                    )}
                    {settings.linkedin && settings.linkedin.trim() && (
                      <li>
                        <a
                          href={settings.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.socialLink}
                          aria-label={t('contact.linkedinAria')}
                        >
                          <i className="fa-brands fa-linkedin" aria-hidden="true" style={{ fontSize: '18px' }} />
                        </a>
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </article>
          </div>

          {/* Colonne de droite : Formulaire de contact direct */}
          <div className={styles.formColumn}>
            <div className={styles.formCard} aria-labelledby="contact-form-title">
              <h2 id="contact-form-title" className={styles.cardTitle}>
                {t('contact.formSectionTitle')}
              </h2>
              <p className={styles.cardSubtitle}>
                {t('contact.formSectionSubtitle')}
              </p>

              <RequestForm formType="contact" initialActivity="general" />
            </div>
          </div>
        </div>

        {/* Emplacement de carte géographique (SANS IFRAME avec liens Google Maps & OpenStreetMap) */}
        <section className={styles.mapSection} aria-labelledby="contact-map-title">
          <div className={styles.mapVisual}>
            <i className="fa-solid fa-location-dot" aria-hidden="true" style={{ fontSize: '36px', color: 'var(--color-accent)' }} />
            <h2 id="contact-map-title" className={styles.mapTitle}>
              {t('contact.mapTitle')}
            </h2>
            <p className={styles.mapAddress}>
              {hasAddress ? settings.address : 'Abidjan, Cocody, Angré Oscars, Côte d’Ivoire'}
            </p>

            <div className={styles.mapButtons}>
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.mapBtn}
              >
                <i className="fa-solid fa-map-location-dot" aria-hidden="true" style={{ fontSize: '15px', marginRight: '6px' }} />
                <span>{t('contact.openInGoogleMaps')}</span>
              </a>

              <a
                href={openStreetMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.mapBtn} ${styles.mapBtnOsm}`}
              >
                <i className="fa-solid fa-map" aria-hidden="true" style={{ fontSize: '15px', marginRight: '6px' }} />
                <span>{t('contact.openInOpenStreetMap')}</span>
              </a>
            </div>
          </div>

          <p className={styles.mapNotice}>
            <i className="fa-solid fa-circle-info" aria-hidden="true" style={{ marginRight: '6px' }} />
            <span>{t('contact.mapPrivacyNotice')}</span>
          </p>
        </section>
      </Container>
    </main>
  );
}

export default ContactPage;

