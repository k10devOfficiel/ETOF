import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import FormField from '../ui/FormField.jsx';
import Input from '../ui/Input.jsx';
import Textarea from '../ui/Textarea.jsx';
import Select from '../ui/Select.jsx';
import Button from '../ui/Button.jsx';
import Alert from '../ui/Alert.jsx';
import { useUserAuth } from '../../context/UserAuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { displayName } from '../../utils/userHelper.js';
import { submitRequest } from '../../api/requests.js';
import { ApiError, getCurrentLanguage } from '../../api/client.js';
import styles from './RequestForm.module.css';

/**
 * Moteur de formulaire unifié pour ETOF SARL couvrant l'ensemble des besoins :
 * devis général, commande de produits, réservation de véhicule, demande d'achat
 * et devis spécialisé pour le transport d'hydrocarbures.
 *
 * @param {{
 *   formType?: 'quote' | 'order' | 'reservation' | 'purchase' | 'contact' | 'fuel',
 *   initialActivity?: 'farm' | 'vehicle' | 'office' | 'fuel' | 'general',
 *   prefilledItem?: {
 *     id: number,
 *     name: string,
 *     price?: number | null,
 *     unit?: string | null,
 *     quantity?: number
 *   } | null,
 *   prefilledVehicle?: {
 *     id: number,
 *     brand: string,
 *     model: string,
 *     year?: number,
 *     mode?: string
 *   } | null,
 *   onSuccess?: (response: any) => void
 * }} props
 * @returns {JSX.Element}
 */
export function RequestForm({
  formType = 'quote',
  initialActivity = 'general',
  prefilledItem = null,
  prefilledVehicle = null,
  items = null,
  onSuccess,
}) {
  const { t, i18n } = useTranslation();
  const { user } = useUserAuth();
  const { notifyQuoteSent, notifyOrderSent, notifyRentalSent, notifyBuySent, notifyError } = useToast();

  const currentLang = (i18n.language || 'fr').slice(0, 2).toLowerCase();

  // États du formulaire commun
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  const [websiteHoneypot, setWebsiteHoneypot] = useState('');
  const [contactSubject, setContactSubject] = useState('general');

  // Pré-remplissage automatique si l'utilisateur est connecté
  useEffect(() => {
    if (user) {
      if (!fullName) {
        setFullName(displayName(user, currentLang));
      }
      if (!email && user.email) {
        setEmail(user.email);
      }
      if (!phone && user.phone) {
        setPhone(user.phone);
      }
      if (!company && user.company) {
        setCompany(user.company);
      }
    }
  }, [user, currentLang]);

  // Activité sélectionnée
  const [activity, setActivity] = useState(
    formType === 'fuel' ? 'fuel' : initialActivity
  );

  // Spécifique commande / devis produits
  const [itemQuantity, setItemQuantity] = useState(
    prefilledItem?.quantity ? Number(prefilledItem.quantity) : 1
  );

  // Spécifique réservation de véhicule
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Spécifique transport d'hydrocarbures
  const [fuelServiceType, setFuelServiceType] = useState('super_unleaded');
  const [estimatedVolume, setEstimatedVolume] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [desiredDate, setDesiredDate] = useState('');

  // États de cycle de vie et d'erreurs
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);

  // Synchronisation si les props changent
  useEffect(() => {
    if (formType === 'fuel') {
      setActivity('fuel');
    } else if (initialActivity) {
      setActivity(initialActivity);
    }
  }, [formType, initialActivity]);

  useEffect(() => {
    if (prefilledItem?.quantity) {
      setItemQuantity(Number(prefilledItem.quantity));
    }
  }, [prefilledItem]);

  // Validation côté client
  const validateForm = () => {
    const newErrors = {};

    if (!fullName.trim()) {
      newErrors.full_name = t('forms.errors.nameRequired');
    }

    if (!email.trim()) {
      newErrors.email = t('forms.errors.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = t('forms.errors.emailInvalid');
    }

    if (!phone.trim()) {
      newErrors.phone = t('forms.errors.phoneRequired');
    } else if (!/^[0-9+\s().-]{8,25}$/.test(phone.trim())) {
      newErrors.phone = t('forms.errors.phoneInvalid');
    }

    if (!consent) {
      newErrors.consent = t('forms.errors.consentRequired');
    }

    // Validation articles de commande
    if (formType === 'order') {
      const hasOrderItems = (Array.isArray(items) && items.length > 0) || Boolean(prefilledItem?.id);
      if (!hasOrderItems) {
        newErrors.items = t('order.emptyOrderError');
      }
    }

    // Validation dates réservation
    if (formType === 'reservation') {
      if (!startDate) {
        newErrors.start_date = t('forms.errors.startDateRequired');
      }
      if (!endDate) {
        newErrors.end_date = t('forms.errors.endDateRequired');
      } else if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
        newErrors.end_date = t('forms.errors.endDateBeforeStart');
      }
    }

    // Validation transport hydrocarbures
    if (formType === 'fuel' || activity === 'fuel') {
      if (!estimatedVolume.trim()) {
        newErrors.estimated_volume = t('forms.errors.volumeRequired');
      }
      if (!origin.trim()) {
        newErrors.origin = t('forms.errors.originRequired');
      }
      if (!destination.trim()) {
        newErrors.destination = t('forms.errors.destinationRequired');
      }
      if (!desiredDate) {
        newErrors.desired_date = t('forms.errors.desiredDateRequired');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError(null);
    setIsRateLimited(false);

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      const effectiveType = formType === 'fuel' ? 'quote' : formType;

      let effectiveActivity = activity || 'general';
      if (formType === 'contact') {
        effectiveActivity = ['farm', 'vehicle', 'office', 'fuel'].includes(contactSubject)
          ? contactSubject
          : 'general';
      } else if (formType === 'order' && Array.isArray(items) && items.length > 0) {
        const activities = new Set(items.map((it) => it.activity).filter(Boolean));
        if (activities.size === 1) {
          effectiveActivity = Array.from(activities)[0];
        } else {
          effectiveActivity = 'general';
        }
      }

      let effectiveMessage = message.trim() || undefined;
      if (formType === 'contact') {
        const subjectLabels = {
          general: t('contact.subjects.general'),
          farm: t('contact.subjects.farm'),
          vehicle: t('contact.subjects.vehicle'),
          office: t('contact.subjects.office'),
          fuel: t('contact.subjects.fuel'),
          partnership: t('contact.subjects.partnership'),
          other: t('contact.subjects.other'),
        };
        const subjectText = subjectLabels[contactSubject] || contactSubject;
        effectiveMessage = message.trim()
          ? `[${t('contact.subjectLabel')}: ${subjectText}]\n\n${message.trim()}`
          : `[${t('contact.subjectLabel')}: ${subjectText}]`;
      }

      const userEffectiveName = user ? displayName(user, currentLang) : fullName.trim();
      const userEffectiveEmail = user?.email || email.trim();
      const userEffectivePhone = user?.phone || phone.trim();

      const payload = {
        type: effectiveType,
        activity: effectiveActivity,
        lang: getCurrentLanguage(),
        full_name: userEffectiveName,
        email: userEffectiveEmail,
        phone: userEffectivePhone,
        company: company.trim() || user?.company || undefined,
        message: effectiveMessage,
        consent: Boolean(consent),
        website: websiteHoneypot, // Champ piège qui doit être vide
      };

      // Payload commande / devis produits (liste d'articles ou article unique pré-rempli)
      if (Array.isArray(items) && items.length > 0) {
        payload.items = items.map((it) => ({
          product_id: Number(it.product_id || it.id),
          quantity: Math.max(1, Number(it.quantity)),
        }));
      } else if (prefilledItem?.id) {
        payload.items = [
          {
            product_id: Number(prefilledItem.id),
            quantity: Math.max(1, itemQuantity),
          },
        ];
      }

      // Payload réservation / achat véhicule
      if (prefilledVehicle?.id) {
        payload.vehicle_id = Number(prefilledVehicle.id);
      }

      if (formType === 'reservation') {
        payload.start_date = startDate;
        payload.end_date = endDate;
      }

      // Payload détails hydrocarbures
      if (formType === 'fuel' || activity === 'fuel') {
        payload.details = {
          service_type: fuelServiceType,
          estimated_volume: estimatedVolume.trim(),
          origin: origin.trim(),
          destination: destination.trim(),
          desired_date: desiredDate,
        };
      }

      const res = await submitRequest(payload);
      setSubmittedData(res);

      // Déclenchement de la notification personnalisée adaptée
      const ref = res?.reference || '';
      if (formType === 'order') {
        const totalCount = Array.isArray(items)
          ? items.reduce((s, it) => s + (Number(it.quantity) || 1), 0)
          : itemQuantity;
        notifyOrderSent(userEffectiveName, totalCount, ref);
      } else if (formType === 'reservation') {
        const vName = prefilledVehicle ? `${prefilledVehicle.brand} ${prefilledVehicle.model}` : t('vehicles.vehicle');
        notifyRentalSent(userEffectiveName, vName, startDate, endDate, ref);
      } else if (formType === 'purchase') {
        const vName = prefilledVehicle ? `${prefilledVehicle.brand} ${prefilledVehicle.model}` : t('vehicles.vehicle');
        notifyBuySent(userEffectiveName, vName, ref);
      } else {
        notifyQuoteSent(userEffectiveName, ref);
      }

      // Notification globale dans le navigateur pour rafraîchir l'admin en temps réel
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('etof:new-request-submitted', { detail: res }));
      }

      if (onSuccess) {
        onSuccess(res);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 429) {
          setIsRateLimited(true);
        } else if (err.status === 422 && err.fields) {
          const apiErrors = {};
          Object.entries(err.fields).forEach(([fKey, fVal]) => {
            apiErrors[fKey] = Array.isArray(fVal) ? fVal.join(' ') : String(fVal);
          });
          setErrors(apiErrors);
        } else {
          setGlobalError(err.message || t('forms.errors.genericServer'));
        }
      } else {
        setGlobalError(t('forms.errors.networkError'));
      }
      notifyError(err.message || t('forms.errors.genericServer'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmittedData(null);
    setErrors({});
    setGlobalError(null);
    setIsRateLimited(false);
  };

  // Écran de confirmation de soumission réussie
  if (submittedData) {
    return (
      <div className={styles.successCard} role="status" aria-live="polite">
        <div className={styles.successIconWrapper}>
          <i className={`fa-solid fa-circle-check ${styles.successIcon}`} aria-hidden="true" style={{ fontSize: '48px', color: '#16a34a' }} />
        </div>

        <h2 className={styles.successTitle}>{t('forms.success.title')}</h2>

        {submittedData.reference && (
          <div>
            <span className={styles.referenceBadge}>
              {submittedData.reference}
            </span>
          </div>
        )}

        <p className={styles.successMessage}>
          {t('forms.success.message')}
        </p>

        <div className={styles.successActions}>
          <Link to="/catalogue" style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="md">
              {t('forms.success.backToCatalog')}
            </Button>
          </Link>
          <Button variant="outline" size="md" onClick={handleReset}>
            {t('forms.success.newRequest')}
          </Button>
        </div>
      </div>
    );
  }

  const isFuelForm = formType === 'fuel' || activity === 'fuel';
  const isVehicleForm =
    formType === 'reservation' || formType === 'purchase' || activity === 'vehicle';

  return (
    <div className={styles.formWrapper}>
      {/* Alerte Erreur Rate Limiting (429) */}
      {isRateLimited && (
        <Alert variant="warning" title={t('forms.errors.rateLimitTitle')}>
          {t('forms.errors.rateLimitMessage')}
        </Alert>
      )}

      {/* Alerte Erreur Réseau / Serveur avec persistance des champs */}
      {globalError && (
        <Alert variant="error" title={t('forms.errors.errorTitle')}>
          {globalError}
        </Alert>
      )}

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {/* Champ Honeypot masqué aux humains pour piéger les bots */}
        <div className={styles.honeypot} aria-hidden="true">
          <label htmlFor="website-field">Website</label>
          <input
            id="website-field"
            type="text"
            name="website"
            tabIndex="-1"
            autoComplete="off"
            value={websiteHoneypot}
            onChange={(e) => setWebsiteHoneypot(e.target.value)}
          />
        </div>

        {/* Récapitulatif pré-rempli pour produit */}
        {prefilledItem && (
          <aside className={styles.prefilledCard}>
            <div className={styles.prefilledHeader}>
              <h3 className={styles.prefilledTitle}>
                {t('forms.prefilledItemTitle')}
              </h3>
              <span className={styles.prefilledDetails}>{prefilledItem.name}</span>
            </div>
            {prefilledItem.price ? (
              <p className={styles.prefilledDetails}>
                {prefilledItem.price} FCFA {prefilledItem.unit ? `/ ${prefilledItem.unit}` : ''}
              </p>
            ) : null}

            <FormField
              label={t('forms.quantityLabel')}
              error={errors.quantity}
              required
            >
              <Input
                type="number"
                min="1"
                value={itemQuantity}
                onChange={(e) => setItemQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
              />
            </FormField>
          </aside>
        )}

        {/* Récapitulatif pré-rempli pour véhicule */}
        {prefilledVehicle && (
          <aside className={styles.prefilledCard}>
            <div className={styles.prefilledHeader}>
              <h3 className={styles.prefilledTitle}>
                {t('forms.prefilledVehicleTitle')}
              </h3>
              <span className={styles.prefilledDetails}>
                {prefilledVehicle.brand} {prefilledVehicle.model}{' '}
                {prefilledVehicle.year ? `(${prefilledVehicle.year})` : ''}
              </span>
            </div>
          </aside>
        )}

        {/* Coordonnées du demandeur */}
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>{t('forms.contactSectionTitle')}</legend>

          <div className={styles.row2}>
            <FormField
              label={t('forms.fullNameLabel')}
              error={errors.full_name}
              required
            >
              <Input
                type="text"
                placeholder={t('forms.fullNamePlaceholder')}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                error={Boolean(errors.full_name)}
                autoComplete="name"
              />
            </FormField>

            <FormField
              label={t('forms.companyLabel')}
              helperText={t('forms.companyHelper')}
              error={errors.company}
            >
              <Input
                type="text"
                placeholder={t('forms.companyPlaceholder')}
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                autoComplete="organization"
              />
            </FormField>
          </div>

          <div className={styles.row2}>
            <FormField
              label={t('forms.emailLabel')}
              error={errors.email}
              required
            >
              <Input
                type="email"
                placeholder={t('forms.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={Boolean(errors.email)}
                autoComplete="email"
              />
            </FormField>

            <FormField
              label={t('forms.phoneLabel')}
              helperText={t('forms.phoneHelper')}
              error={errors.phone}
              required
            >
              <Input
                type="tel"
                placeholder={t('forms.phonePlaceholder')}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                error={Boolean(errors.phone)}
                autoComplete="tel"
              />
            </FormField>
          </div>
        </fieldset>

        {/* Champs spécifiques : Dates de réservation véhicule */}
        {formType === 'reservation' && (
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>{t('forms.reservationSectionTitle')}</legend>

            <div className={styles.row2}>
              <FormField
                label={t('forms.startDateLabel')}
                error={errors.start_date}
                required
              >
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  error={Boolean(errors.start_date)}
                />
              </FormField>

              <FormField
                label={t('forms.endDateLabel')}
                error={errors.end_date}
                required
              >
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  error={Boolean(errors.end_date)}
                />
              </FormField>
            </div>
          </fieldset>
        )}

        {/* Champs spécifiques : Transport d'hydrocarbures */}
        {isFuelForm && (
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>{t('forms.fuelSectionTitle')}</legend>

            <div className={styles.row2}>
              <FormField
                label={t('forms.serviceTypeLabel')}
                error={errors.service_type}
                required
              >
                <Select
                  value={fuelServiceType}
                  onChange={(e) => setFuelServiceType(e.target.value)}
                >
                  <option value="super_unleaded">{t('forms.fuelTypes.super')}</option>
                  <option value="diesel">{t('forms.fuelTypes.diesel')}</option>
                  <option value="depot_delivery">{t('forms.fuelTypes.depot')}</option>
                  <option value="other">{t('forms.fuelTypes.other')}</option>
                </Select>
              </FormField>

              <FormField
                label={t('forms.estimatedVolumeLabel')}
                helperText={t('forms.estimatedVolumeHelper')}
                error={errors.estimated_volume}
                required
              >
                <Input
                  type="text"
                  placeholder={t('forms.estimatedVolumePlaceholder')}
                  value={estimatedVolume}
                  onChange={(e) => setEstimatedVolume(e.target.value)}
                  error={Boolean(errors.estimated_volume)}
                />
              </FormField>
            </div>

            <div className={styles.row3}>
              <FormField
                label={t('forms.originLabel')}
                error={errors.origin}
                required
              >
                <Input
                  type="text"
                  placeholder={t('forms.originPlaceholder')}
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  error={Boolean(errors.origin)}
                />
              </FormField>

              <FormField
                label={t('forms.destinationLabel')}
                error={errors.destination}
                required
              >
                <Input
                  type="text"
                  placeholder={t('forms.destinationPlaceholder')}
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  error={Boolean(errors.destination)}
                />
              </FormField>

              <FormField
                label={t('forms.desiredDateLabel')}
                error={errors.desired_date}
                required
              >
                <Input
                  type="date"
                  value={desiredDate}
                  onChange={(e) => setDesiredDate(e.target.value)}
                  error={Boolean(errors.desired_date)}
                />
              </FormField>
            </div>
          </fieldset>
        )}

        {/* Sélecteur de Sujet pour formulaire de contact */}
        {formType === 'contact' && (
          <fieldset className={styles.fieldset}>
            <FormField
              label={t('contact.subjectLabel')}
              required
            >
              <Select
                value={contactSubject}
                onChange={(e) => setContactSubject(e.target.value)}
              >
                <option value="general">{t('contact.subjects.general')}</option>
                <option value="farm">{t('contact.subjects.farm')}</option>
                <option value="vehicle">{t('contact.subjects.vehicle')}</option>
                <option value="office">{t('contact.subjects.office')}</option>
                <option value="fuel">{t('contact.subjects.fuel')}</option>
                <option value="partnership">{t('contact.subjects.partnership')}</option>
                <option value="other">{t('contact.subjects.other')}</option>
              </Select>
            </FormField>
          </fieldset>
        )}

        {/* Précisions / Message libre */}
        <fieldset className={styles.fieldset}>
          <FormField
            label={formType === 'contact' ? t('contact.messageLabel') : t('forms.messageLabel')}
            helperText={formType === 'contact' ? t('contact.messageHelper') : t('forms.messageHelper')}
            error={errors.message}
          >
            <Textarea
              rows={4}
              placeholder={formType === 'contact' ? t('contact.messagePlaceholder') : t('forms.messagePlaceholder')}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              error={Boolean(errors.message)}
            />
          </FormField>
        </fieldset>

        {/* Case de consentement RGPD obligatoire */}
        <div>
          <div className={styles.consentWrapper}>
            <input
              id="consent-checkbox"
              type="checkbox"
              className={styles.consentCheckbox}
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              aria-invalid={Boolean(errors.consent)}
            />
            <label htmlFor="consent-checkbox" className={styles.consentText}>
              {t('forms.consentPrefix')}{' '}
              <Link to="/politique-de-confidentialite" target="_blank" rel="noopener noreferrer">
                {t('forms.consentLink')}
              </Link>
              . {t('forms.consentSuffix')}
            </label>
          </div>
          {errors.consent && (
            <p className={styles.fieldErrorText} role="alert">
              {errors.consent}
            </p>
          )}
        </div>

        {/* Bouton de soumission avec état de chargement */}
        <div>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {formType === 'order'
              ? t('forms.submitOrder')
              : formType === 'reservation'
                ? t('forms.submitReservation')
                : formType === 'purchase'
                  ? t('forms.submitPurchase')
                  : formType === 'contact'
                    ? t('forms.submitContact')
                    : t('forms.submitQuote')}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default RequestForm;

