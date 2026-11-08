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
        console.warn('Impossible de charger les réglages de contact:', error);
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
          <span className={styles.heroTag}>{t('contact.heroTag')}</span>
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
                      <svg className={styles.itemIcon} viewBox="0 0 24 24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                      </svg>
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
                      <svg className={styles.itemIcon} viewBox="0 0 24 24">
                        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                      </svg>
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
                      <svg className={styles.itemIcon} viewBox="0 0 24 24">
                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                      </svg>
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
                      <svg className={styles.itemIcon} viewBox="0 0 24 24">
                        <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2" />
                      </svg>
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
                    <svg className={styles.hoursIcon} viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                    </svg>
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
                          <svg className={styles.socialIcon} viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />
                          </svg>
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
                          <svg className={styles.socialIcon} viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                          </svg>
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
                          <svg className={styles.socialIcon} viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                          </svg>
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
            <svg className={styles.mapPinIcon} viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
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
                <svg className={styles.mapBtnIcon} viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
                <span>{t('contact.openInGoogleMaps')}</span>
              </a>

              <a
                href={openStreetMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.mapBtn} ${styles.mapBtnOsm}`}
              >
                <svg className={styles.mapBtnIcon} viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z" />
                </svg>
                <span>{t('contact.openInOpenStreetMap')}</span>
              </a>
            </div>
          </div>

          <p className={styles.mapNotice}>
            ℹ️ {t('contact.mapPrivacyNotice')}
          </p>
        </section>
      </Container>
    </main>
  );
}

export default ContactPage;

