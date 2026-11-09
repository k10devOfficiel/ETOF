import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserAuth } from '../../context/UserAuthContext.jsx';
import Icon from '../common/Icon.jsx';
import Spinner from '../ui/Spinner.jsx';
import styles from './AuthModal.module.css';

/**
 * Modale accessible de connexion et d'inscription client.
 * S'ouvre automatiquement avant toute action protégée (devis, commande, réservation, achat).
 * Reprend l'action en attente dès la connexion/inscription sans perte de données.
 */
export function AuthModal() {
  const { t } = useTranslation();
  const { isAuthModalOpen, closeAuthModal, authModalMessage, login, register } = useUserAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [civility, setCivility] = useState('none'); // 'mr' | 'mrs' | 'none'
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const modalRef = useRef(null);
  const emailInputRef = useRef(null);

  useEffect(() => {
    if (isAuthModalOpen) {
      setError(null);
      setTimeout(() => {
        if (emailInputRef.current) {
          emailInputRef.current.focus();
        }
      }, 100);
    }
  }, [isAuthModalOpen, mode]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isAuthModalOpen) {
        closeAuthModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthModalOpen, closeAuthModal]);

  if (!isAuthModalOpen) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        if (!email.trim() || !password) {
          setError(t('auth.errors.requiredFields', 'Veuillez remplir tous les champs obligatoires.'));
          setLoading(false);
          return;
        }
        await login(email.trim(), password);
      } else {
        if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
          setError(t('auth.errors.requiredFields', 'Veuillez remplir tous les champs obligatoires.'));
          setLoading(false);
          return;
        }
        await register({
          civility,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          company: company.trim(),
          password,
        });
      }
    } catch (err) {
      setError(err?.message || t('toast.genericError', 'Une erreur est survenue, réessayez dans un instant.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeAuthModal();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className={styles.modal} ref={modalRef}>
        <header className={styles.header}>
          <h2 id="auth-modal-title" className={styles.title}>
            {mode === 'login' ? t('auth.loginTitle', 'Connexion') : t('auth.registerTitle', 'Créer un compte')}
          </h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={closeAuthModal}
            aria-label={t('common.close', 'Fermer')}
            title={t('common.close', 'Fermer')}
          >
            <Icon name="xmark" size={20} />
          </button>
        </header>

        {/* Message d'exergue contextuel */}
        <div className={styles.banner} role="note">
          <Icon name="circle-info" size={18} color="currentColor" />
          <span>
            {authModalMessage || t('auth.requireAuthBanner', 'Connectez-vous ou créez un compte pour envoyer votre demande')}
          </span>
        </div>

        {/* Onglets Connexion / Inscription */}
        <div className={styles.tabs} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={`${styles.tabBtn} ${mode === 'login' ? styles.activeTab : ''}`}
            onClick={() => {
              setMode('login');
              setError(null);
            }}
          >
            {t('auth.tabs.login', 'J’ai déjà un compte')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            className={`${styles.tabBtn} ${mode === 'register' ? styles.activeTab : ''}`}
            onClick={() => {
              setMode('register');
              setError(null);
            }}
          >
            {t('auth.tabs.register', 'Nouveau client')}
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {error && (
            <p className={styles.errorText} role="alert">
              {error}
            </p>
          )}

          {mode === 'register' && (
            <>
              {/* Civilité */}
              <div className={styles.field}>
                <label className={styles.label}>{t('auth.civility', 'Civilité')}</label>
                <div className={styles.civilityGroup} role="radiogroup" aria-label={t('auth.civility', 'Civilité')}>
                  <label className={`${styles.civilityOption} ${civility === 'mr' ? styles.selected : ''}`}>
                    <input
                      type="radio"
                      name="civility"
                      value="mr"
                      checked={civility === 'mr'}
                      onChange={() => setCivility('mr')}
                    />
                    {t('auth.civilityMr', 'Monsieur')}
                  </label>
                  <label className={`${styles.civilityOption} ${civility === 'mrs' ? styles.selected : ''}`}>
                    <input
                      type="radio"
                      name="civility"
                      value="mrs"
                      checked={civility === 'mrs'}
                      onChange={() => setCivility('mrs')}
                    />
                    {t('auth.civilityMrs', 'Madame')}
                  </label>
                  <label className={`${styles.civilityOption} ${civility === 'none' ? styles.selected : ''}`}>
                    <input
                      type="radio"
                      name="civility"
                      value="none"
                      checked={civility === 'none'}
                      onChange={() => setCivility('none')}
                    />
                    {t('auth.civilityNone', 'Sans civilité')}
                  </label>
                </div>
              </div>

              {/* Prénom et Nom séparés */}
              <div className={styles.row}>
                <div className={styles.field}>
                  <label htmlFor="reg-first-name" className={styles.label}>
                    {t('auth.firstName', 'Prénom')} *
                  </label>
                  <input
                    id="reg-first-name"
                    type="text"
                    className={styles.input}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="reg-last-name" className={styles.label}>
                    {t('auth.lastName', 'Nom')} *
                  </label>
                  <input
                    id="reg-last-name"
                    type="text"
                    className={styles.input}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Téléphone & Société */}
              <div className={styles.row}>
                <div className={styles.field}>
                  <label htmlFor="reg-phone" className={styles.label}>
                    {t('auth.phone', 'Téléphone')}
                  </label>
                  <input
                    id="reg-phone"
                    type="tel"
                    className={styles.input}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+225 07 00 00 00 00"
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="reg-company" className={styles.label}>
                    {t('auth.company', 'Entreprise (optionnel)')}
                  </label>
                  <input
                    id="reg-company"
                    type="text"
                    className={styles.input}
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {/* E-mail & Mot de passe */}
          <div className={styles.field}>
            <label htmlFor="auth-email" className={styles.label}>
              {t('auth.email', 'Adresse e-mail')} *
            </label>
            <input
              id="auth-email"
              ref={emailInputRef}
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="auth-password" className={styles.label}>
              {t('auth.password', 'Mot de passe')} *
            </label>
            <input
              id="auth-password"
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength={mode === 'register' ? 8 : undefined}
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? (
              <Spinner size="sm" color="white" />
            ) : mode === 'login' ? (
              t('auth.submitLogin', 'Se connecter et continuer')
            ) : (
              t('auth.submitRegister', 'Créer mon compte et continuer')
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AuthModal;
