import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUserAuth } from '../../context/UserAuthContext.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import logoOfficial from '../../assets/logo/logo-etof.jpg';
import styles from './AuthCommon.module.css';

export function ClientRegisterPage() {
  const { t } = useTranslation();
  const { register, user } = useUserAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [civility, setCivility] = useState('none');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

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

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      setError(t('auth.errors.requiredFields', 'Veuillez remplir tous les champs obligatoires.'));
      return;
    }

    if (password.length < 8) {
      setError(t('auth.errors.passwordTooShort', 'Le mot de passe doit comporter au moins 8 caractères.'));
      return;
    }

    if (password !== passwordConfirm) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    try {
      setLoading(true);
      await register({
        civility,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        company: company.trim(),
        password,
      });
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
          <div className={styles.authLogoWrapper}>
            <Link to="/" aria-label="Retour à l'accueil">
              <img src={logoOfficial} alt="ETOF SARL" className={styles.authLogo} />
            </Link>
          </div>
          <h1 className={styles.authTitle}>{t('auth.registerTitle', 'Créer un Compte Client')}</h1>
          <p className={styles.authSubtitle}>
            Remplissez vos coordonnées pour envoyer vos demandes de devis et commandes
          </p>
        </header>

        {error && (
          <div className={styles.errorBanner} role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.authForm} noValidate>
          {/* Civilité */}
          <div className={styles.field}>
            <label className={styles.label}>{t('auth.civility', 'Civilité')}</label>
            <div className={styles.civilityGroup} role="radiogroup">
              <label className={`${styles.civilityOption} ${civility === 'mr' ? styles.civilitySelected : ''}`}>
                <input
                  type="radio"
                  name="reg-civility"
                  value="mr"
                  checked={civility === 'mr'}
                  onChange={() => setCivility('mr')}
                  style={{ display: 'none' }}
                />
                {t('auth.civilityMr', 'Monsieur')}
              </label>
              <label className={`${styles.civilityOption} ${civility === 'mrs' ? styles.civilitySelected : ''}`}>
                <input
                  type="radio"
                  name="reg-civility"
                  value="mrs"
                  checked={civility === 'mrs'}
                  onChange={() => setCivility('mrs')}
                  style={{ display: 'none' }}
                />
                {t('auth.civilityMrs', 'Madame')}
              </label>
              <label className={`${styles.civilityOption} ${civility === 'none' ? styles.civilitySelected : ''}`}>
                <input
                  type="radio"
                  name="reg-civility"
                  value="none"
                  checked={civility === 'none'}
                  onChange={() => setCivility('none')}
                  style={{ display: 'none' }}
                />
                {t('auth.civilityNone', 'Sans civilité')}
              </label>
            </div>
          </div>

          {/* Prénom et Nom */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="reg-pg-firstname" className={styles.label}>
                {t('auth.firstName', 'Prénom')} *
              </label>
              <input
                id="reg-pg-firstname"
                type="text"
                className={styles.input}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="ex: Kofi"
                required
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="reg-pg-lastname" className={styles.label}>
                {t('auth.lastName', 'Nom')} *
              </label>
              <input
                id="reg-pg-lastname"
                type="text"
                className={styles.input}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="ex: Kouamé"
                required
              />
            </div>
          </div>

          {/* Téléphone et Entreprise */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="reg-pg-phone" className={styles.label}>
                {t('auth.phone', 'Téléphone')}
              </label>
              <input
                id="reg-pg-phone"
                type="tel"
                className={styles.input}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+225 07 00 00 00 00"
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="reg-pg-company" className={styles.label}>
                {t('auth.company', 'Entreprise (optionnel)')}
              </label>
              <input
                id="reg-pg-company"
                type="text"
                className={styles.input}
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Société SARL"
              />
            </div>
          </div>

          {/* E-mail */}
          <div className={styles.field}>
            <label htmlFor="reg-pg-email" className={styles.label}>
              {t('auth.email', 'Adresse e-mail')} *
            </label>
            <input
              id="reg-pg-email"
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre.email@domaine.com"
              required
              autoComplete="email"
            />
          </div>

          {/* Mot de passe et Confirmation */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="reg-pg-pass" className={styles.label}>
                {t('auth.password', 'Mot de passe (8 car. min.)')} *
              </label>
              <input
                id="reg-pg-pass"
                type="password"
                className={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="reg-pg-pass-confirm" className={styles.label}>
                Confirmer le mot de passe *
              </label>
              <input
                id="reg-pg-pass-confirm"
                type="password"
                className={styles.input}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? <Spinner size="sm" color="white" /> : t('auth.submitRegister', 'Créer mon compte et continuer')}
          </button>
        </form>

        <div className={styles.footerSwitch}>
          <span>Vous avez déjà un compte ?</span>
          <Link to="/connexion" state={{ from }} className={styles.footerLink}>
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ClientRegisterPage;

