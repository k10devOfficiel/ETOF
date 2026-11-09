import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserAuth } from '../../context/UserAuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { clientAuthApi } from '../../api/auth.js';
import { displayName } from '../../utils/userHelper.js';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import styles from './ClientProfilePage.module.css';

/**
 * Page « Mon compte » pour les utilisateurs clients.
 * Permet de modifier la civilité, le prénom, le nom, le choix du nom préféré,
 * et de suivre les demandes de devis, commandes, réservations et achats.
 */
export function ClientProfilePage() {
  const { t, i18n } = useTranslation();
  const { user, updateProfile, requireAuth } = useUserAuth();
  const { notifySuccess, notifyError } = useToast();

  const currentLang = (i18n.language || 'fr').slice(0, 2).toLowerCase();

  const [civility, setCivility] = useState(user?.civility || 'none');
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [preferredName, setPreferredName] = useState(user?.preferred_name || 'first_name');
  const [phone, setPhone] = useState(user?.phone || '');
  const [company, setCompany] = useState(user?.company || '');

  const [saving, setSaving] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  useEffect(() => {
    if (user) {
      setCivility(user.civility || 'none');
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setPreferredName(user.preferred_name || 'first_name');
      setPhone(user.phone || '');
      setCompany(user.company || '');
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      requireAuth(() => {}, t('auth.requireAuthAccount', 'Connectez-vous pour accéder à votre espace'));
      return;
    }

    let isMounted = true;
    clientAuthApi
      .getMyRequests()
      .then((res) => {
        if (isMounted) {
          setRequests(res?.data?.items || []);
        }
      })
      .catch(() => {
        if (isMounted) setRequests([]);
      })
      .finally(() => {
        if (isMounted) setLoadingRequests(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user, requireAuth, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({
        civility,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        preferred_name: preferredName,
        phone: phone.trim(),
        company: company.trim(),
      });
      notifySuccess(
        t('account.savedTitle', 'Profil mis à jour'),
        t('account.savedMessage', 'Vos coordonnées et préférences ont été enregistrées avec succès.')
      );
    } catch (err) {
      notifyError(err?.message);
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className={styles.container} style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <p>{t('auth.requireAuthAccount', 'Connectez-vous pour accéder à votre espace client.')}</p>
      </div>
    );
  }

  const currentDisplayName = displayName(user, currentLang);

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('account.pageTitle', 'Mon Compte')}</h1>
        <p className={styles.subtitle}>
          {t('account.welcomeUser', { name: currentDisplayName, defaultValue: `Bienvenue, ${currentDisplayName}` })}
        </p>
      </header>

      {/* Formulaire des informations personnelles et civilité */}
      <section className={styles.card} aria-labelledby="personal-info-title">
        <h2 id="personal-info-title" className={styles.cardTitle}>
          {t('account.personalInfoTitle', 'Informations personnelles & Civilité')}
        </h2>

        <form onSubmit={handleSubmit} noValidate>
          <div className={styles.formGrid}>
            {/* Civilité */}
            <div className={styles.field}>
              <label htmlFor="acc-civility" className={styles.label}>
                {t('auth.civility', 'Civilité')}
              </label>
              <select
                id="acc-civility"
                className={styles.select}
                value={civility}
                onChange={(e) => setCivility(e.target.value)}
              >
                <option value="mr">{t('auth.civilityMr', 'Monsieur')}</option>
                <option value="mrs">{t('auth.civilityMrs', 'Madame')}</option>
                <option value="none">{t('auth.civilityNone', 'Sans civilité')}</option>
              </select>
            </div>

            {/* Nom d'affichage préféré */}
            <div className={styles.field}>
              <label htmlFor="acc-pref" className={styles.label}>
                {t('account.preferredNameChoice', 'Nom d’affichage préféré')}
              </label>
              <select
                id="acc-pref"
                className={styles.select}
                value={preferredName}
                onChange={(e) => setPreferredName(e.target.value)}
              >
                <option value="first_name">{t('account.useFirstName', 'Prénom (recommandé)')}</option>
                <option value="last_name">{t('account.useLastName', 'Nom de famille')}</option>
              </select>
            </div>

            {/* Prénom */}
            <div className={styles.field}>
              <label htmlFor="acc-first-name" className={styles.label}>
                {t('auth.firstName', 'Prénom')} *
              </label>
              <input
                id="acc-first-name"
                type="text"
                className={styles.input}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>

            {/* Nom */}
            <div className={styles.field}>
              <label htmlFor="acc-last-name" className={styles.label}>
                {t('auth.lastName', 'Nom')} *
              </label>
              <input
                id="acc-last-name"
                type="text"
                className={styles.input}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>

            {/* E-mail (lecture seule) */}
            <div className={styles.field}>
              <label className={styles.label}>{t('auth.email', 'Adresse e-mail')}</label>
              <input
                type="email"
                className={styles.input}
                value={user.email}
                disabled
                style={{ opacity: 0.7 }}
              />
            </div>

            {/* Téléphone */}
            <div className={styles.field}>
              <label htmlFor="acc-phone" className={styles.label}>
                {t('auth.phone', 'Téléphone')}
              </label>
              <input
                id="acc-phone"
                type="tel"
                className={styles.input}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            {/* Entreprise */}
            <div className={`${styles.field} ${styles.fullWidth}`}>
              <label htmlFor="acc-company" className={styles.label}>
                {t('auth.company', 'Entreprise (optionnel)')}
              </label>
              <input
                id="acc-company"
                type="text"
                className={styles.input}
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.btnRow}>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? <Spinner size="sm" color="white" /> : t('common.save', 'Enregistrer les modifications')}
            </Button>
          </div>
        </form>
      </section>

      {/* Historique des demandes du client */}
      <section className={styles.card} aria-labelledby="requests-history-title">
        <h2 id="requests-history-title" className={styles.cardTitle}>
          {t('account.requestsHistoryTitle', 'Historique de mes demandes')}
        </h2>

        {loadingRequests ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <Spinner size="md" />
          </div>
        ) : requests.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>
            {t('account.noRequestsYet', 'Vous n’avez pas encore soumis de demande.')}
          </p>
        ) : (
          <div className={styles.requestList}>
            {requests.map((req) => (
              <div key={req.id} className={styles.requestItem}>
                <div>
                  <div className={styles.reqRef}>
                    {req.reference} &bull; {req.type.toUpperCase()}
                  </div>
                  <div className={styles.reqDate}>
                    {new Date(req.created_at).toLocaleDateString(currentLang === 'en' ? 'en-US' : 'fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                  {req.vehicle_brand && (
                    <div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                      {req.vehicle_brand} {req.vehicle_model}
                    </div>
                  )}
                </div>

                <Badge
                  variant={
                    req.status === 'confirmed'
                      ? 'available'
                      : req.status === 'rejected'
                      ? 'unavailable'
                      : 'available'
                  }
                >
                  {req.status === 'confirmed'
                    ? t('requests.status_confirmed', 'Confirmée')
                    : req.status === 'in_progress'
                    ? t('requests.status_in_progress', 'En cours')
                    : req.status === 'rejected'
                    ? t('requests.status_rejected', 'Rejetée')
                    : t('requests.status_new', 'Nouvelle')}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default ClientProfilePage;
