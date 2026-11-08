import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
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
 * Formulaire modal dédié à la location d'un véhicule ETOF SARL avec contrôle de dates et de permis.
 */
export function VehicleRentModal({ vehicle, isOpen, onClose, onSuccess }) {
  const { t, i18n } = useTranslation();
  const currentLang = (i18n.language || 'fr').slice(0, 2).toLowerCase();

  const todayStr = new Date().toISOString().split('T')[0];

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pickupLocation, setPickupLocation] = useState('abidjan_headquarters');
  const [withDriver, setWithDriver] = useState(false);
  const [hasValidLicense, setHasValidLicense] = useState(false);
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  const [websiteHoneypot, setWebsiteHoneypot] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [submittedData, setSubmittedData] = useState(null);

  if (!vehicle) return null;

  const vehicleName = `${vehicle.brand} ${vehicle.model} ${vehicle.year ? `(${vehicle.year})` : ''}`;
  const priceDisplay = formatPrice(vehicle.price_rental_day) || t('catalog.priceOnDemand');

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
      const payload = {
        type: 'reservation',
        activity: 'vehicle',
        lang: currentLang,
        vehicle_id: Number(vehicle.id),
        start_date: startDate,
        end_date: endDate,
        full_name: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        message: message.trim() || undefined,
        consent: Boolean(consent),
        website: websiteHoneypot,
        details: {
          pickup_location: pickupLocation,
          with_driver: withDriver ? 'yes' : 'no',
          has_valid_license: hasValidLicense ? 'yes' : 'no',
        },
      };

      const res = await client.post('/requests', payload);
      setSubmittedData(res.data || res);
      if (onSuccess) onSuccess(res.data || res);
    } catch (err) {
      if (err.fields) {
        setErrors(err.fields);
      } else {
        setErrors({ global: err.message || t('forms.errors.genericServer') });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmittedData(null);
    setErrors({});
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleResetAndClose}
      title={t('vehicles.rentModalTitle', { vehicle: vehicleName })}
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
          {/* Récapitulatif Véhicule */}
          <div className={styles.vehicleSummary}>
            <div>
              <span className={styles.vehicleLabel}>{t('vehicles.vehicle')}:</span>
              <strong className={styles.vehicleName}>{vehicleName}</strong>
            </div>
            <div>
              <span className={styles.vehicleLabel}>{t('vehicles.rentalPerDay')}:</span>
              <span className={styles.vehiclePrice}>{priceDisplay}</span>
            </div>
          </div>

          {errors.global && (
            <div className={styles.errorMessage} role="alert">
              {errors.global}
            </div>
          )}

          {/* Champ Honeypot invisible */}
          <div style={{ display: 'none' }} aria-hidden="true">
            <input
              type="text"
              name="website"
              value={websiteHoneypot}
              onChange={(e) => setWebsiteHoneypot(e.target.value)}
              tabIndex="-1"
              autoComplete="off"
            />
          </div>

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

          <div className={styles.fieldGroup}>
            <label htmlFor="rent-name" className={styles.label}>
              {t('forms.name')} *
            </label>
            <input
              id="rent-name"
              type="text"
              className={`${styles.input} ${errors.full_name ? styles.inputError : ''}`}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              required
            />
            {errors.full_name && <span className={styles.fieldError}>{errors.full_name}</span>}
          </div>

          <div className={styles.grid2}>
            <div className={styles.fieldGroup}>
              <label htmlFor="rent-phone" className={styles.label}>
                {t('forms.phone')} *
              </label>
              <input
                id="rent-phone"
                type="tel"
                className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                placeholder="+225 07 00 00 00 00"
                required
              />
              {errors.phone && <span className={styles.fieldError}>{errors.phone}</span>}
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="rent-email" className={styles.label}>
                {t('forms.email')} *
              </label>
              <input
                id="rent-email"
                type="email"
                className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="nom@exemple.ci"
                required
              />
              {errors.email && <span className={styles.fieldError}>{errors.email}</span>}
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="rent-location" className={styles.label}>
              {t('vehicles.pickupLocationLabel', 'Lieu de prise en charge')}
            </label>
            <select
              id="rent-location"
              className={styles.select}
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
            >
              <option value="abidjan_headquarters">{t('vehicles.locHeadquarters', 'Siège ETOF SARL (Cocody Angré Oscars)')}</option>
              <option value="abidjan_airport">{t('vehicles.locAirport', 'Aéroport International Félix-Houphouët-Boigny')}</option>
              <option value="delivery_address">{t('vehicles.locDelivery', 'Livraison à domicile ou au bureau (sur devis)')}</option>
            </select>
          </div>

          <div className={styles.checkboxGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={withDriver}
                onChange={(e) => setWithDriver(e.target.checked)}
              />
              <span>{t('vehicles.withDriverOption', 'Option avec chauffeur professionnel')}</span>
            </label>
          </div>

          {!withDriver && (
            <div className={styles.checkboxGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={hasValidLicense}
                  onChange={(e) => setHasValidLicense(e.target.checked)}
                  required
                />
                <span>{t('vehicles.validLicenseCheckbox', 'Oui, je certifie posséder un permis de conduire valide')} *</span>
              </label>
              {errors.license && <span className={styles.fieldError}>{errors.license}</span>}
            </div>
          )}

          <div className={styles.fieldGroup}>
            <label htmlFor="rent-message" className={styles.label}>
              {t('forms.message')} ({t('common.optional', 'Optionnel')})
            </label>
            <textarea
              id="rent-message"
              className={styles.textarea}
              rows="2"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('vehicles.rentMessagePlaceholder', 'Besoins particuliers, itinéraire envisagé...')}
            />
          </div>

          <div className={styles.checkboxGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                required
              />
              <span>{t('forms.consent')} *</span>
            </label>
            {errors.consent && <span className={styles.fieldError}>{errors.consent}</span>}
          </div>

          <div className={styles.actions}>
            <Button type="button" variant="ghost" size="md" onClick={handleResetAndClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="primary" size="md" loading={isSubmitting}>
              {t('vehicles.submitRentalRequest', 'Confirmer ma réservation')}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export default VehicleRentModal;

