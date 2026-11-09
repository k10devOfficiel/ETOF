import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { useUserAuth } from '../../context/UserAuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { displayName } from '../../utils/userHelper.js';
import { client } from '../../api/client.js';
import styles from './VehicleModalForms.module.css';

/**
 * Formatage d'un montant monétaire en FCFA.
 */
function formatPrice(amount) {
  if (!amount || isNaN(Number(amount))) return null;
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(Number(amount)) + ' FCFA';
}

/**
 * Formulaire modal dédié à la location d'un véhicule ETOF SARL avec contrôle de dates,
 * gestion de quantité de véhicules et vérification de permis.
 */
export function VehicleRentModal({ vehicle, isOpen, onClose, onSuccess, initialQuantity = 1 }) {
  const { t, i18n } = useTranslation();
  const { user } = useUserAuth();
  const { notifyRentalSent, notifyError } = useToast();
  const currentLang = (i18n.language || 'fr').slice(0, 2).toLowerCase();

  const todayStr = new Date().toISOString().split('T')[0];

  const [quantity, setQuantity] = useState(initialQuantity || 1);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [usageZone, setUsageZone] = useState('abidjan');
  const [pickupLocation, setPickupLocation] = useState('abidjan_headquarters');
  const [withDriver, setWithDriver] = useState(false);
  const [hasValidLicense, setHasValidLicense] = useState(false);
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  const [websiteHoneypot, setWebsiteHoneypot] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [submittedData, setSubmittedData] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setQuantity(initialQuantity || 1);
    }
  }, [isOpen, initialQuantity]);

  useEffect(() => {
    if (user) {
      if (!fullName) setFullName(displayName(user, currentLang));
      if (!email && user.email) setEmail(user.email);
      if (!phone && user.phone) setPhone(user.phone);
    }
  }, [user, currentLang]);

  if (!vehicle) return null;

  const vehicleName = `${vehicle.brand} ${vehicle.model} ${vehicle.year ? `(${vehicle.year})` : ''}`.trim();
  const specs = vehicle.specs || {};

  const dayRate = vehicle.price_rental_day ? Number(vehicle.price_rental_day) : null;
  const weekRate = specs.price_rental_week ? Number(specs.price_rental_week) : (dayRate ? Math.round(dayRate * 6) : null);
  const monthRate = specs.price_rental_month ? Number(specs.price_rental_month) : (dayRate ? Math.round(dayRate * 22) : null);

  const daysCount = (() => {
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diff = Math.round((e - s) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  })();

  const estimatedUnitTotal = (() => {
    if (!daysCount || !dayRate) return null;
    if (daysCount >= 30 && monthRate) {
      const months = Math.floor(daysCount / 30);
      const remDays = daysCount % 30;
      return (months * monthRate) + (remDays * dayRate);
    }
    if (daysCount >= 7 && weekRate) {
      const weeks = Math.floor(daysCount / 7);
      const remDays = daysCount % 7;
      return (weeks * weekRate) + (remDays * dayRate);
    }
    return daysCount * dayRate;
  })();

  const estimatedTotal = estimatedUnitTotal ? estimatedUnitTotal * quantity : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const newErrors = {};
    if (!fullName.trim()) newErrors.full_name = t('forms.errors.nameRequired');
    if (!phone.trim()) newErrors.phone = t('forms.errors.phoneRequired');
    if (!email.trim()) newErrors.email = t('forms.errors.emailRequired');
    if (!startDate) newErrors.start_date = t('forms.errors.startDateRequired');
    if (!endDate) newErrors.end_date = t('forms.errors.endDateRequired');

    if (startDate && endDate && endDate <= startDate) {
      newErrors.end_date = t('vehicles.endDateMustBeAfter', 'La date de fin doit être strictement postérieure à la date de début.');
    }

    if (!withDriver && !hasValidLicense) {
      newErrors.license = t('vehicles.licenseRequiredForSelfDrive', 'La possession d’un permis de conduire valide est obligatoire pour la conduite sans chauffeur.');
    }

    if (!consent) newErrors.consent = t('forms.errors.consentRequired');

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      const userEffName = user ? displayName(user, currentLang) : fullName.trim();
      const userEffEmail = user?.email || email.trim();
      const userEffPhone = user?.phone || phone.trim();

      const payload = {
        type: 'reservation',
        activity: 'vehicle',
        lang: currentLang,
        vehicle_id: Number(vehicle.id),
        start_date: startDate,
        end_date: endDate,
        full_name: userEffName,
        phone: userEffPhone,
        email: userEffEmail,
        message: message.trim() || undefined,
        consent: Boolean(consent),
        website: websiteHoneypot,
        details: {
          city: city.trim(),
          usage_zone: usageZone,
          days_count: daysCount,
          quantity: Number(quantity),
          estimated_cost: estimatedTotal,
          pickup_location: pickupLocation,
          with_driver: withDriver ? 'yes' : 'no',
          has_valid_license: hasValidLicense ? 'yes' : 'no',
        },
      };

      const res = await client.post('/requests', payload);
      const data = res.data || res;
      setSubmittedData(data);
      notifyRentalSent(userEffName, `${quantity > 1 ? `${quantity}x ` : ''}${vehicleName}`, startDate, endDate, data.reference || '');

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('etof:new-request-submitted', { detail: data }));
        if (typeof BroadcastChannel !== 'undefined') {
          try {
            const bc = new BroadcastChannel('etof_orders_sync');
            bc.postMessage({ type: 'new_rental_submitted', detail: data });
            bc.close();
          } catch {}
        }
      }

      if (onSuccess) onSuccess(data);
    } catch (err) {
      if (err.fields) {
        setErrors(err.fields);
      } else {
        setErrors({ global: err.message || t('forms.errors.genericServer') });
      }
      notifyError(err.message || t('forms.errors.genericServer'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmittedData(null);
    setErrors({});
    onClose();
  };

  const clientName = fullName.trim() || (user ? displayName(user, currentLang) : '');
  const modalTitle = clientName
    ? t('vehicles.rentModalTitle', { name: clientName, defaultValue: `Réservation de véhicule – ${clientName}` })
    : vehicleName
    ? `${t('vehicles.rentModalTitleDefault', 'Réservation de véhicule')} – ${vehicleName}`
    : t('vehicles.rentModalTitleDefault', 'Réservation de véhicule');

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleResetAndClose}
      title={modalTitle}
      size="md"
    >
      {submittedData ? (
        <div className={styles.successBox} role="status">
          <div className={styles.successIcon} aria-hidden="true">✓</div>
          <h3 className={styles.successTitle}>{t('forms.success.title')}</h3>
          <p className={styles.successDesc}>{t('vehicles.rentSuccessMessage')}</p>
          {submittedData.reference && (
            <div className={styles.refBadge}>
              {t('forms.success.reference')} : <strong>{submittedData.reference}</strong>
            </div>
          )}
          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <Button variant="primary" size="md" onClick={handleResetAndClose}>
              {t('common.close')}
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className={styles.form}>
          {/* Récapitulatif Véhicule & Grille des Tarifs */}
          <div className={styles.vehicleSummary}>
            <div>
              <span className={styles.vehicleLabel}>{t('vehicles.vehicle')}:</span>
              <strong className={styles.vehicleName}>{vehicleName}</strong>
            </div>
            <div>
              <span className={styles.vehicleLabel}>{t('vehicles.rentalPerDay')}:</span>
              <span className={styles.vehiclePrice}>{formatPrice(dayRate) || t('catalog.priceOnDemand')}</span>
            </div>
          </div>

          {/* Grille des tarifs Jour / Semaine / Mois */}
          <div className={styles.ratesGrid}>
            <div className={styles.rateCard}>
              <div className={styles.ratePeriod}>{t('vehicles.rentalPerDay', 'Par jour')}</div>
              <div className={styles.rateAmount}>{formatPrice(dayRate) || t('catalog.priceOnDemand')}</div>
            </div>
            <div className={styles.rateCard}>
              <div className={styles.ratePeriod}>{t('vehicles.rentalPerWeek', 'Par semaine')}</div>
              <div className={styles.rateAmount}>{formatPrice(weekRate) || t('catalog.priceOnDemand')}</div>
            </div>
            <div className={styles.rateCard}>
              <div className={styles.ratePeriod}>{t('vehicles.rentalPerMonth', 'Par mois')}</div>
              <div className={styles.rateAmount}>{formatPrice(monthRate) || t('catalog.priceOnDemand')}</div>
            </div>
          </div>

          {/* Sélecteur de quantité pour les véhicules */}
          <div className={styles.quantitySection}>
            <div className={styles.quantityLabelGroup}>
              <span className={styles.quantityTitle}>
                <i className="fa-solid fa-car" style={{ marginRight: '6px' }} />
                {t('vehicles.quantityLabel', 'Quantité de véhicules')}
              </span>
              <span className={styles.quantitySubtitle}>
                {t('vehicles.quantityHelper', 'Nombre d’unités souhaitées pour la mission')}
              </span>
            </div>
            <div className={styles.quantityPicker}>
              <button
                type="button"
                className={styles.quantityBtn}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                aria-label="Diminuer la quantité"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                max="50"
                className={styles.quantityInput}
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val >= 1) setQuantity(val);
                }}
                aria-label="Quantité de véhicules"
              />
              <button
                type="button"
                className={styles.quantityBtn}
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Augmenter la quantité"
              >
                +
              </button>
            </div>
          </div>

          {/* Caractéristiques techniques du véhicule */}
          <div className={styles.specsBox}>
            <div className={styles.specsTitle}>{t('vehicles.technicalSpecs', 'Caractéristiques techniques')}</div>
            <div className={styles.specsGrid}>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>{t('vehicles.specKeys.year', 'Année modèle')}</span>
                <span className={styles.specValue}>{vehicle.year || t('common.notSpecified', 'N/C')}</span>
              </div>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>{t('vehicles.specKeys.fuel', 'Carburant')}</span>
                <span className={styles.specValue}>{specs.fuel || specs.fuel_type || t('common.notSpecified', 'N/C')}</span>
              </div>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>{t('vehicles.specKeys.transmission', 'Boîte de vitesses')}</span>
                <span className={styles.specValue}>{specs.transmission || t('common.notSpecified', 'N/C')}</span>
              </div>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>{t('vehicles.specKeys.seats', 'Places assises')}</span>
                <span className={styles.specValue}>{specs.seats || t('common.notSpecified', 'N/C')}</span>
              </div>
            </div>
          </div>

          {/* Coordonnées Client */}
          <div className={styles.grid2}>
            <div className={styles.fieldGroup}>
              <label htmlFor="rent-fullname" className={styles.label}>
                {t('forms.fullName', 'Nom et Prénoms')} *
              </label>
              <input
                id="rent-fullname"
                type="text"
                className={`${styles.input} ${errors.full_name ? styles.inputError : ''}`}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex : Koffi Kouassi"
                required
              />
              {errors.full_name && <span className={styles.fieldError}>{Array.isArray(errors.full_name) ? errors.full_name.join(' ') : errors.full_name}</span>}
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="rent-phone" className={styles.label}>
                {t('forms.phone', 'Numéro de téléphone')} *
              </label>
              <input
                id="rent-phone"
                type="tel"
                className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex : +225 07 00 00 00 00"
                required
              />
              {errors.phone && <span className={styles.fieldError}>{Array.isArray(errors.phone) ? errors.phone.join(' ') : errors.phone}</span>}
            </div>
          </div>

          <div className={styles.grid2}>
            <div className={styles.fieldGroup}>
              <label htmlFor="rent-email" className={styles.label}>
                {t('forms.email', 'Adresse email')} *
              </label>
              <input
                id="rent-email"
                type="email"
                className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex : contact@entreprise.ci"
                required
              />
              {errors.email && <span className={styles.fieldError}>{Array.isArray(errors.email) ? errors.email.join(' ') : errors.email}</span>}
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="rent-city" className={styles.label}>
                {t('forms.city', 'Ville ou Commune')}
              </label>
              <input
                id="rent-city"
                type="text"
                className={styles.input}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ex : Abidjan - Cocody"
              />
            </div>
          </div>

          {/* Champ piège antispam invisible */}
          <div style={{ display: 'none' }} aria-hidden="true">
            <input
              type="text"
              name="website"
              value={websiteHoneypot}
              onChange={(e) => setWebsiteHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          {/* Sélection des dates avec calcul dynamique */}
          <div className={styles.grid2}>
            <div className={styles.fieldGroup}>
              <label htmlFor="rent-start" className={styles.label}>
                {t('forms.startDate', 'Date de début')} *
              </label>
              <input
                id="rent-start"
                type="date"
                min={todayStr}
                className={`${styles.input} ${errors.start_date ? styles.inputError : ''}`}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
              {errors.start_date && <span className={styles.fieldError}>{Array.isArray(errors.start_date) ? errors.start_date.join(' ') : errors.start_date}</span>}
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="rent-end" className={styles.label}>
                {t('forms.endDate', 'Date de restitution')} *
              </label>
              <input
                id="rent-end"
                type="date"
                min={startDate || todayStr}
                className={`${styles.input} ${errors.end_date ? styles.inputError : ''}`}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
              {errors.end_date && <span className={styles.fieldError}>{Array.isArray(errors.end_date) ? errors.end_date.join(' ') : errors.end_date}</span>}
            </div>
          </div>

          {/* Calcul automatique du nombre de jours et estimation du prix avec quantité */}
          {daysCount > 0 && (
            <div className={styles.estimateBox} role="status">
              <div>
                <span className={styles.estimateLabel}>{t('vehicles.estimatedDuration', 'Durée')} : </span>
                <strong className={styles.estimateDays}>{t('vehicles.daysCount', { count: daysCount })}</strong>
                {quantity > 1 && (
                  <span style={{ marginLeft: '8px', color: '#0b2a4a', fontWeight: 600 }}>
                    ({quantity} véhicules)
                  </span>
                )}
              </div>
              {estimatedTotal && (
                <div>
                  <span className={styles.estimateLabel}>{t('vehicles.estimatedCost', 'Estimation')} : </span>
                  <span className={styles.estimateTotal}>{formatPrice(estimatedTotal)}</span>
                </div>
              )}
            </div>
          )}

          {/* Zone d'utilisation et Lieu de prise en charge */}
          <div className={styles.grid2}>
            <div className={styles.fieldGroup}>
              <label htmlFor="rent-zone" className={styles.label}>
                {t('vehicles.usageZoneLabel', 'Zone d’utilisation prévue')}
              </label>
              <select
                id="rent-zone"
                className={styles.select}
                value={usageZone}
                onChange={(e) => setUsageZone(e.target.value)}
              >
                <option value="abidjan">{t('vehicles.usageZoneAbidjan', 'Grand Abidjan uniquement')}</option>
                <option value="national">{t('vehicles.usageZoneNational', 'Intérieur du pays (Côte d’Ivoire)')}</option>
                <option value="subregion">{t('vehicles.usageZoneSubregion', 'Sous-région (CEDEAO)')}</option>
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="rent-pickup" className={styles.label}>
                {t('vehicles.pickupLocationLabel', 'Lieu de prise en charge')}
              </label>
              <input
                id="rent-pickup"
                type="text"
                className={styles.input}
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                placeholder={t('vehicles.pickupLocationPlaceholder', 'Ex : Siège ETOF Cocody ou Aéroport FHB')}
              />
            </div>
          </div>

          {/* Option Chauffeur professionnel & Permis de conduire */}
          <div className={styles.checkboxBlock}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={withDriver}
                onChange={(e) => setWithDriver(e.target.checked)}
              />
              <span>{t('vehicles.withDriverLabel', 'Mise à disposition d’un chauffeur professionnel ETOF SARL')}</span>
            </label>

            {!withDriver && (
              <div style={{ marginTop: '0.75rem', paddingLeft: '1.75rem' }}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={hasValidLicense}
                    onChange={(e) => setHasValidLicense(e.target.checked)}
                  />
                  <span>{t('vehicles.driverLicenseCheckbox', 'Le conducteur dispose d’un permis de conduire valide depuis plus de 2 ans')} *</span>
                </label>
                {errors.license && <span className={styles.fieldError}>{errors.license}</span>}
              </div>
            )}
          </div>

          {/* Précisions ou Message */}
          <div className={styles.fieldGroup}>
            <label htmlFor="rent-message" className={styles.label}>
              {t('forms.message', 'Précisions supplémentaires (facultatif)')}
            </label>
            <textarea
              id="rent-message"
              className={styles.textarea}
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ex : Besoins particuliers, horaires de mise à disposition..."
            />
          </div>

          {/* Consentement RGPD / Confidentialité */}
          <div className={styles.fieldGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                required
              />
              <span className={styles.consentText}>
                {t('forms.consentPrefix', 'J’accepte que mes données soient traitées par ETOF SARL conformément aux ')}
                <a href="/mentions-legales" target="_blank" rel="noopener noreferrer" className={styles.consentLink}>
                  {t('forms.privacyPolicy', 'conditions générales')}
                </a>.
              </span>
            </label>
            {errors.consent && <span className={styles.fieldError}>{Array.isArray(errors.consent) ? errors.consent.join(' ') : errors.consent}</span>}
          </div>

          {/* Note sur la réservation préalable */}
          <div className={styles.disclaimerBox}>
            <i className={`fa-solid fa-circle-info ${styles.disclaimerIcon}`} aria-hidden="true" />
            <p className={styles.disclaimerText}>
              {t('vehicles.reservationNotice', 'Note : Toute demande transmise fait l’objet d’une vérification préalable de disponibilité par les équipes d’ETOF SARL.')}
            </p>
          </div>

          {/* Bouton de confirmation */}
          <div style={{ marginTop: '1rem' }}>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className={styles.spinner} aria-hidden="true" />
                  {t('forms.submitting', 'Traitement en cours...')}
                </>
              ) : (
                t('vehicles.submitRentalRequest', 'Confirmer ma réservation')
              )}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export default VehicleRentModal;
