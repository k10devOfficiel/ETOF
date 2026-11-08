import React, { useState, useEffect } from 'react';
import adminApi from '../api/adminApi.js';
import Spinner from '../../components/ui/Spinner.jsx';
import Alert from '../../components/ui/Alert.jsx';
import styles from './SettingsPage.module.css';

/**
 * Écran d'administration des réglages institutionnels d'ETOF SARL.
 * Permet de mettre à jour au fur et à mesure les coordonnées, horaires et réseaux sociaux.
 * Les valeurs non vides s'affichent instantanément sur le site public sans modification du code.
 *
 * @returns {JSX.Element}
 */
export function SettingsPage() {
  const [formData, setFormData] = useState({
    phone: '',
    whatsapp: '',
    email: '',
    address: '',
    facebook: '',
    instagram: '',
    linkedin: '',
    opening_hours: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState(null);

  // Chargement des données actuelles
  useEffect(() => {
    let isMounted = true;
    adminApi
      .getSettings()
      .then((data) => {
        if (isMounted && data) {
          setFormData({
            phone: data.phone || '',
            whatsapp: data.whatsapp || '',
            email: data.email || '',
            address: data.address || '',
            facebook: data.facebook || '',
            instagram: data.instagram || '',
            linkedin: data.linkedin || '',
            opening_hours: data.opening_hours || '',
          });
        }
      })
      .catch(() => {
        if (isMounted) {
          setError('Impossible de récupérer les réglages actuels.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setFieldErrors({});
      setSuccessMessage(null);

      const res = await adminApi.updateSettings(formData);

      setSuccessMessage(res?.message || 'Réglages enregistrés avec succès. Le site public a été actualisé.');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      if (err.data && typeof err.data === 'object' && Object.keys(err.data).length > 0) {
        setFieldErrors(err.data);
        setError('Certains champs comportent des erreurs de validation.');
      } else {
        setError(err.message || 'Erreur lors de la mise à jour des réglages.');
      }
    } finally {
      setSaving(false);
    }
  };

  const hasWhatsApp = Boolean(formData.whatsapp && formData.whatsapp.trim());

  return (
    <div>
      <header className={styles.header}>
        <h1 className={styles.title}>Réglages Institutionnels</h1>
        <p className={styles.subtitle}>
          Coordonnées officielles d'ETOF SARL diffusées dynamiquement sur le site public (pied de page, page contact, bouton WhatsApp).
        </p>
      </header>

      {successMessage && (
        <div style={{ marginBottom: '1.5rem' }}>
          <Alert variant="success">{successMessage}</Alert>
        </div>
      )}

      {error && (
        <div style={{ marginBottom: '1.5rem' }}>
          <Alert variant="danger">{error}</Alert>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '3.5rem', textAlign: 'center' }}>
          <Spinner size="lg" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          {/* Section 1 : Coordonnées directes */}
          <div className={styles.formCard}>
            <h2 className={styles.sectionTitle}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
              </svg>
              Coordonnées directes
            </h2>
            <p className={styles.sectionDesc}>
              Numéros de téléphone et e-mail accessibles par les visiteurs. Les champs laissés vides sont masqués automatiquement.
            </p>

            <div className={`${styles.grid} ${styles.gridThree}`}>
              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="set-phone">
                  Téléphone direct
                </label>
                <input
                  id="set-phone"
                  type="text"
                  placeholder="+225 27 22 00 00 00"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className={`${styles.input} ${fieldErrors.phone ? styles.inputError : ''}`}
                />
                {fieldErrors.phone ? (
                  <span className={styles.errorText}>{fieldErrors.phone}</span>
                ) : (
                  <span className={styles.helpText}>Numéro standard pour les appels téléphoniques.</span>
                )}
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="set-whatsapp">
                  WhatsApp (Format international)
                </label>
                <input
                  id="set-whatsapp"
                  type="text"
                  placeholder="+2250700000000"
                  value={formData.whatsapp}
                  onChange={(e) => handleChange('whatsapp', e.target.value)}
                  className={`${styles.input} ${fieldErrors.whatsapp ? styles.inputError : ''}`}
                />
                {fieldErrors.whatsapp ? (
                  <span className={styles.errorText}>{fieldErrors.whatsapp}</span>
                ) : (
                  <span className={styles.helpText}>Avec indicatif pays (ex: +225 pour la Côte d'Ivoire).</span>
                )}
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="set-email">
                  Adresse e-mail publique
                </label>
                <input
                  id="set-email"
                  type="email"
                  placeholder="contact@etofsarl.com"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={`${styles.input} ${fieldErrors.email ? styles.inputError : ''}`}
                />
                {fieldErrors.email ? (
                  <span className={styles.errorText}>{fieldErrors.email}</span>
                ) : (
                  <span className={styles.helpText}>Visible en pied de page et page Contact.</span>
                )}
              </div>
            </div>

            {/* Statut du bouton WhatsApp */}
            <div className={styles.badgePreview}>
              <svg className={styles.badgePreviewIcon} viewBox="0 0 24 24" fill={hasWhatsApp ? '#22c55e' : '#94a3b8'}>
                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.9C17.18 3.03 14.69 2 12.04 2" />
              </svg>
              <div>
                <p className={styles.badgePreviewText}>
                  <strong>Bouton flottant WhatsApp sur le site : </strong>
                  {hasWhatsApp ? (
                    <span style={{ color: '#16a34a', fontWeight: 600 }}>
                      Actif (le bouton vert flottant est visible par tous les visiteurs)
                    </span>
                  ) : (
                    <span style={{ color: '#64748b' }}>
                      Inactif (renseignez un numéro ci-dessus pour le faire apparaître immédiatement)
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Section 2 : Siège social & Horaires */}
          <div className={styles.formCard}>
            <h2 className={styles.sectionTitle}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              Siège social & Horaires d'ouverture
            </h2>
            <p className={styles.sectionDesc}>
              Localisation géographique et créneaux d'ouverture au public.
            </p>

            <div className={`${styles.grid} ${styles.gridTwo}`}>
              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="set-address">
                  Adresse géographique / Siège social
                </label>
                <input
                  id="set-address"
                  type="text"
                  placeholder="Abidjan, Cocody, Angré Oscars, Côte d’Ivoire"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className={`${styles.input} ${fieldErrors.address ? styles.inputError : ''}`}
                />
                {fieldErrors.address ? (
                  <span className={styles.errorText}>{fieldErrors.address}</span>
                ) : (
                  <span className={styles.helpText}>Utilisée pour le lien Google Maps / OpenStreetMap.</span>
                )}
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="set-hours">
                  Horaires d'ouverture
                </label>
                <input
                  id="set-hours"
                  type="text"
                  placeholder="Lun - Ven : 08h00 - 18h00 | Sam : 08h30 - 13h00"
                  value={formData.opening_hours}
                  onChange={(e) => handleChange('opening_hours', e.target.value)}
                  className={`${styles.input} ${fieldErrors.opening_hours ? styles.inputError : ''}`}
                />
                {fieldErrors.opening_hours ? (
                  <span className={styles.errorText}>{fieldErrors.opening_hours}</span>
                ) : (
                  <span className={styles.helpText}>Affichés sur la page Contact et les fiches institutionnelles.</span>
                )}
              </div>
            </div>
          </div>

          {/* Section 3 : Réseaux sociaux */}
          <div className={styles.formCard}>
            <h2 className={styles.sectionTitle}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
              </svg>
              Réseaux sociaux
            </h2>
            <p className={styles.sectionDesc}>
              Liens officiels vers les profils d'ETOF SARL. Les icônes n'apparaissent sur le site que si le lien correspondant est renseigné.
            </p>

            <div className={`${styles.grid} ${styles.gridThree}`}>
              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="set-facebook">
                  Lien Facebook
                </label>
                <input
                  id="set-facebook"
                  type="url"
                  placeholder="https://facebook.com/..."
                  value={formData.facebook}
                  onChange={(e) => handleChange('facebook', e.target.value)}
                  className={`${styles.input} ${fieldErrors.facebook ? styles.inputError : ''}`}
                />
                {fieldErrors.facebook ? (
                  <span className={styles.errorText}>{fieldErrors.facebook}</span>
                ) : (
                  <span className={styles.helpText}>URL complète débutant par https://</span>
                )}
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="set-instagram">
                  Lien Instagram
                </label>
                <input
                  id="set-instagram"
                  type="url"
                  placeholder="https://instagram.com/..."
                  value={formData.instagram}
                  onChange={(e) => handleChange('instagram', e.target.value)}
                  className={`${styles.input} ${fieldErrors.instagram ? styles.inputError : ''}`}
                />
                {fieldErrors.instagram ? (
                  <span className={styles.errorText}>{fieldErrors.instagram}</span>
                ) : (
                  <span className={styles.helpText}>URL complète débutant par https://</span>
                )}
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="set-linkedin">
                  Lien LinkedIn
                </label>
                <input
                  id="set-linkedin"
                  type="url"
                  placeholder="https://linkedin.com/company/..."
                  value={formData.linkedin}
                  onChange={(e) => handleChange('linkedin', e.target.value)}
                  className={`${styles.input} ${fieldErrors.linkedin ? styles.inputError : ''}`}
                />
                {fieldErrors.linkedin ? (
                  <span className={styles.errorText}>{fieldErrors.linkedin}</span>
                ) : (
                  <span className={styles.helpText}>URL complète débutant par https://</span>
                )}
              </div>
            </div>

            <div className={styles.saveBar}>
              <button
                type="submit"
                disabled={saving}
                className={styles.saveBtn}
              >
                {saving ? (
                  <>
                    <Spinner size="sm" />
                    <span>Enregistrement…</span>
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z" />
                    </svg>
                    <span>Enregistrer les réglages</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

export default SettingsPage;
