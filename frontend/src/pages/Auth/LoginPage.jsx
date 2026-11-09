import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUserAuth } from '../../context/UserAuthContext.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import styles from './AuthCommon.module.css';

export function ClientLoginPage() {
  const { t } = useTranslation();
  const { login, user } = useUserAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const from = location.state?.from || '/mon-compte';

  if (user) {
    navigate(from, { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError(t('auth.errors.requiredFields', 'Veuillez remplir tous les champs obligatoires.'));
      return;
    }

    try {
      setLoading(true);
      await login(cleanEmail, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err?.message || t('toast.genericError', 'Une erreur est survenue, réessayez dans un instant.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authPageWrapper}>
      <div className={styles.authCard}>
        <header className={styles.authHeader}>
          <h1 className={styles.authTitle}>{t('auth.loginTitle', 'Connexion Client')}</h1>
          <p className={styles.authSubtitle}>
            Accédez à votre espace personnel, vos demandes et vos devis ETOF SARL
          </p>
        </header>

        {error && (
          <div className={styles.errorBanner} role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.authForm} noValidate>
          <div className={styles.field}>
            <label htmlFor="client-login-email" className={styles.label}>
              {t('auth.email', 'Adresse e-mail')} *
            </label>
            <input
              id="client-login-email"
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ex: nom@entreprise.ci"
              required
              autoComplete="email"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="client-login-password" className={styles.label}>
              {t('auth.password', 'Mot de passe')} *
            </label>
            <input
              id="client-login-password"
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? <Spinner size="sm" color="white" /> : t('auth.submitLogin', 'Se connecter et continuer')}
          </button>
        </form>

        <div className={styles.footerSwitch}>
          <span>Vous n’avez pas encore de compte ?</span>
          <Link to="/inscription" state={{ from }} className={styles.footerLink}>
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ClientLoginPage;
