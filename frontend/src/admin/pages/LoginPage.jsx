import React, { useState } from 'react';
import { useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../../components/ui/Button.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import { ADMIN_PATH } from '../../config/adminConfig.js';
import logoSrc from '../../assets/logo/logo-etof.jpg';
import styles from './LoginPage.module.css';

/**
 * Page de connexion à l'espace privé d'administration d'ETOF SARL.
 * En français uniquement, protégée contre l'indexation (noindex, nofollow),
 * avec messages d'erreur génériques sécurisés et état de chargement.
 *
 * @returns {JSX.Element}
 */
export function LoginPage() {
  const { login, isAuthenticated, sessionExpired, dismissSessionExpired } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Redirection sécurisée immédiate si déjà connecté (protection contre les redirections ouvertes)
  const rawFrom = location.state?.from?.pathname || ADMIN_PATH;
  const from = (typeof rawFrom === 'string' && rawFrom.startsWith('/') && !rawFrom.startsWith('//'))
    ? rawFrom
    : ADMIN_PATH;
  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMessage('Veuillez renseigner votre adresse e-mail et votre mot de passe.');
      return;
    }

    try {
      setIsSubmitting(true);
      await login(cleanEmail, password);
      navigate(from, { replace: true });
    } catch (err) {
      if (err?.status === 429) {
        setErrorMessage(
          'Trop de tentatives infructueuses. Par mesure de sécurité, veuillez patienter quelques minutes avant de réessayer.'
        );
      } else {
        // Message générique sécurisé : ne révèle jamais si l'e-mail existe ou non
        setErrorMessage('Identifiants de connexion invalides. Veuillez vérifier votre saisie.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={styles.pageContainer}>
      <Helmet>
        <title>Connexion Administration – ETOF SARL</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <section className={styles.loginCard} aria-labelledby="admin-login-title">
        <header className={styles.header}>
          <div className={styles.logoWrapper}>
            <img
              src={logoSrc}
              alt="Logo ETOF SARL"
              className={styles.logo}
              width="220"
              height="48"
            />
          </div>
          <span className={styles.badge}>Espace Privé</span>
          <h1 id="admin-login-title" className={styles.title}>
            Administration
          </h1>
          <p className={styles.subtitle}>
            Connectez-vous pour gérer les demandes, produits et véhicules.
          </p>
        </header>

        {sessionExpired && (
          <div className={styles.alertWrapper}>
            <Alert
              variant="warning"
              dismissible
              onDismiss={dismissSessionExpired}
            >
              Votre session a expiré. Veuillez vous reconnecter pour continuer.
            </Alert>
          </div>
        )}

        {errorMessage && (
          <div className={styles.alertWrapper}>
            <Alert variant="danger">{errorMessage}</Alert>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.fieldGroup}>
            <label htmlFor="admin-email" className={styles.label}>
              Adresse e-mail
            </label>
            <input
              id="admin-email"
              type="email"
              required
              autoComplete="email"
              autoFocus
              className={styles.input}
              placeholder="administrateur@etofsarl.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="admin-password" className={styles.label}>
              Mot de passe
            </label>
            <input
              id="admin-password"
              type="password"
              required
              autoComplete="current-password"
              className={styles.input}
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Spinner size="sm" />
                <span>Connexion en cours...</span>
              </>
            ) : (
              'Se connecter'
            )}
          </Button>
        </form>

        <footer className={styles.footer}>
          <Link to="/" className={styles.backLink}>
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
            Retourner au site public
          </Link>
        </footer>
      </section>
    </main>
  );
}

export default LoginPage;

