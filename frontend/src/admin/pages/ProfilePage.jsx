import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import adminApi from '../api/adminApi.js';
import Spinner from '../../components/ui/Spinner.jsx';
import Alert from '../../components/ui/Alert.jsx';
import styles from './ProfilePage.module.css';

/**
 * Écran « Mon compte » permettant à l'administrateur de consulter son identité
 * et de modifier son mot de passe avec vérification de l'ancien et 12 caractères minimum.
 *
 * @returns {JSX.Element}
 */
export function ProfilePage() {
  const { admin } = useAuth();

  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState(null);

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

      // Validation côté client
      const errors = {};
      if (!formData.current_password) {
        errors.current_password = 'Le mot de passe actuel est requis.';
      }
      if (!formData.new_password) {
        errors.new_password = 'Le nouveau mot de passe est requis.';
      } else if (formData.new_password.length < 12) {
        errors.new_password = 'Le nouveau mot de passe doit comporter au moins 12 caractères.';
      }
      if (!formData.new_password_confirmation) {
        errors.new_password_confirmation = 'Veuillez confirmer le nouveau mot de passe.';
      } else if (formData.new_password !== formData.new_password_confirmation) {
        errors.new_password_confirmation = 'La confirmation ne correspond pas au nouveau mot de passe.';
      }

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setError('Veuillez corriger les champs requis.');
        setSaving(false);
        return;
      }

      const res = await adminApi.updatePassword(formData);

      setSuccessMessage(res?.message || 'Mot de passe modifié avec succès.');
      setFormData({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
      });
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      if (err.data && typeof err.data === 'object' && Object.keys(err.data).length > 0) {
        setFieldErrors(err.data);
        setError('Le mot de passe n\'a pas pu être modifié.');
      } else {
        setError(err.message || 'Erreur lors du changement de mot de passe.');
      }
    } finally {
      setSaving(false);
    }
  };

  const isLengthValid = formData.new_password.length >= 12;

  return (
    <div>
      <header className={styles.header}>
        <h1 className={styles.title}>Mon Compte</h1>
        <p className={styles.subtitle}>
          Informations de session et gestion de la sécurité de votre compte administrateur.
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

      {/* Carte des informations du compte */}
      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
          Informations du profil
        </h2>
        <p className={styles.sectionDesc}>
          Identifiants de connexion actifs sur la plateforme d'administration ETOF SARL.
        </p>

        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <div className={styles.infoLabel}>Nom complet</div>
            <div className={styles.infoValue}>{admin?.name || 'Administrateur ETOF'}</div>
          </div>

          <div className={styles.infoItem}>
            <div className={styles.infoLabel}>Adresse e-mail</div>
            <div className={styles.infoValue}>{admin?.email || 'admin@etofsarl.com'}</div>
          </div>

          <div className={styles.infoItem}>
            <div className={styles.infoLabel}>Rôle</div>
            <div className={styles.infoValue}>Super Administrateur</div>
          </div>

          <div className={styles.infoItem}>
            <div className={styles.infoLabel}>Dernière connexion</div>
            <div className={styles.infoValue}>
              {admin?.last_login_at
                ? new Date(admin.last_login_at).toLocaleString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Session en cours'}
            </div>
          </div>
        </div>
      </section>

      {/* Carte de changement du mot de passe */}
      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
          </svg>
          Changer le mot de passe
        </h2>
        <p className={styles.sectionDesc}>
          Pour garantir la sécurité de l'espace administration, le nouveau mot de passe doit comporter un minimum de 12 caractères.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className={styles.formGrid}>
            {/* Ancien mot de passe */}
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="prof-current-pwd">
                Mot de passe actuel
              </label>
              <div className={styles.passwordWrapper}>
                <input
                  id="prof-current-pwd"
                  type={showCurrent ? 'text' : 'password'}
                  value={formData.current_password}
                  onChange={(e) => handleChange('current_password', e.target.value)}
                  className={`${styles.input} ${fieldErrors.current_password ? styles.inputError : ''}`}
                  placeholder="Saisissez votre mot de passe actuel"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className={styles.toggleBtn}
                  tabIndex={-1}
                  aria-label={showCurrent ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    {showCurrent ? (
                      <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />
                    ) : (
                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                    )}
                  </svg>
                </button>
              </div>
              {fieldErrors.current_password && (
                <span className={styles.errorText}>{fieldErrors.current_password}</span>
              )}
            </div>

            {/* Nouveau mot de passe */}
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="prof-new-pwd">
                Nouveau mot de passe
              </label>
              <div className={styles.passwordWrapper}>
                <input
                  id="prof-new-pwd"
                  type={showNew ? 'text' : 'password'}
                  value={formData.new_password}
                  onChange={(e) => handleChange('new_password', e.target.value)}
                  className={`${styles.input} ${fieldErrors.new_password ? styles.inputError : ''}`}
                  placeholder="Au moins 12 caractères"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className={styles.toggleBtn}
                  tabIndex={-1}
                  aria-label={showNew ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    {showNew ? (
                      <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />
                    ) : (
                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                    )}
                  </svg>
                </button>
              </div>
              <div className={`${styles.passwordMeter} ${isLengthValid ? styles.meterValid : styles.meterInvalid}`}>
                {isLengthValid ? '✓ Longueur valide (12+ caractères)' : `${formData.new_password.length} / 12 caractères minimum`}
              </div>
              {fieldErrors.new_password && (
                <span className={styles.errorText}>{fieldErrors.new_password}</span>
              )}
            </div>

            {/* Confirmation du mot de passe */}
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="prof-confirm-pwd">
                Confirmer le nouveau mot de passe
              </label>
              <div className={styles.passwordWrapper}>
                <input
                  id="prof-confirm-pwd"
                  type={showConfirm ? 'text' : 'password'}
                  value={formData.new_password_confirmation}
                  onChange={(e) => handleChange('new_password_confirmation', e.target.value)}
                  className={`${styles.input} ${fieldErrors.new_password_confirmation ? styles.inputError : ''}`}
                  placeholder="Répétez le nouveau mot de passe"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className={styles.toggleBtn}
                  tabIndex={-1}
                  aria-label={showConfirm ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    {showConfirm ? (
                      <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />
                    ) : (
                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                    )}
                  </svg>
                </button>
              </div>
              {fieldErrors.new_password_confirmation && (
                <span className={styles.errorText}>{fieldErrors.new_password_confirmation}</span>
              )}
            </div>

            <button
              type="submit"
              disabled={saving}
              className={styles.submitBtn}
            >
              {saving ? (
                <>
                  <Spinner size="sm" />
                  <span>Modification en cours…</span>
                </>
              ) : (
                <span>Mettre à jour le mot de passe</span>
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default ProfilePage;

