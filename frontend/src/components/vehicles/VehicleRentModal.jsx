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
 * Formulaire modal dédié à la location d'un véhicule ETOF SARL avec contrôle de dates et de permis.
 */
export function VehicleRentModal({ vehicle, isOpen, onClose, onSuccess }) {
  const { t, i18n } = useTranslation();
  const { user, requireAuth } = useUserAuth();
  const { notifyRentalSent } = useToast();
  const currentLang = (i18n.language || 'fr').slice(0, 2).toLowerCase();

  const todayStr = new Date().toISOString().split('T')[0];

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
    if (user) {
      if (!fullName) setFullName(displayName(user, currentLang));
      if (!email && user.email) setEmail(user.email);
      if (!phone && user.phone) setPhone(user.phone);
    }
  }, [user, currentLang]);

  if (!vehicle) return null;

  const vehicleName = `${vehicle.brand} ${vehicle.model} ${vehicle.year ? `(${vehicle.year})` : ''}`;
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

  const estimatedTotal = (() => {
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

  const handleSubmit = (e) => {
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

    requireAuth(async (activeUser) => {
      try {
        setIsSubmitting(true);
        const userEffName = activeUser ? displayName(activeUser, currentLang) : fullName.trim();
        const userEffEmail = activeUser?.email || email.trim();
        const userEffPhone = activeUser?.phone || phone.trim();

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
            estimated_cost: estimatedTotal,
            pickup_location: pickupLocation,
            with_driver: withDriver ? 'yes' : 'no',
            has_valid_license: hasValidLicense ? 'yes' : 'no',
          },
        };

        const res = await client.post('/requests', payload);
        const data = res.data || res;
        setSubmittedData(data);
        notifyRentalSent(userEffName, vehicleName, startDate, endDate, data.reference || '');
        if (onSuccess) onSuccess(data);
      } catch (err) {
        if (err.status === 401) {
          requireAuth(() => handleSubmit(e), t('auth.sessionExpiredBanner', 'Votre session a expiré. Veuillez vous reconnecter.'));
          return;
        }
        if (err.fields) {
          setErrors(err.fields);
        } else {
          setErrors({ global: err.message || t('forms.errors.genericServer') });
        }
      } finally {
        setIsSubmitting(false);
      }
    }, t('auth.requireAuthBanner', 'Connectez-vous ou créez un compte pour envoyer votre demande'));
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
                <span className={styles.specLabel}>{t('vehicles.specKeys.seats', 'Nombre de places')}</span>
                <span className={styles.specValue}>{specs.seats ? `${specs.seats} places` : t('common.notSpecified', 'N/C')}</span>
              </div>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>{t('vehicles.specKeys.air_conditioning', 'Climatisation')}</span>
                <span className={styles.specValue}>{specs.air_conditioning !== false ? t('common.yes', 'Oui') : t('common.no', 'Non')}</span>
              </div>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>{t('vehicles.specKeys.color', 'Couleur')}</span>
                <span className={styles.specValue}>{specs.color || t('common.notSpecified', 'N/C')}</span>
              </div>
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

          {/* Calcul automatique du nombre de jours et estimation du prix */}
          {daysCount > 0 && (
            <div className={styles.estimateBox} role="status">
              <div>
                <span className={styles.estimateLabel}>{t('vehicles.estimatedDuration', 'Durée')} : </span>
                <strong className={styles.estimateDays}>{t('vehicles.daysCount', { count: daysCount })}</strong>
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
            <label htmlFor="rent-city" className={styles.label}>
              {t('vehicles.cityLabel', 'Ville de résidence')}
            </label>
            <input
              id="rent-city"
              type="text"
              className={styles.input}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              autoComplete="address-level2"
              placeholder={t('vehicles.cityPlaceholder', 'Ex : Abidjan, Bouaké, San-Pédro...')}
            />
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

