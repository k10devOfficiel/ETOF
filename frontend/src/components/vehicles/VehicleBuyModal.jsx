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
 * Formulaire modal dédié à l'achat d'un véhicule ETOF SARL.
 */
export function VehicleBuyModal({ vehicle, isOpen, onClose, onSuccess }) {
  const { t, i18n } = useTranslation();
  const { user, requireAuth } = useUserAuth();
  const { notifyBuySent } = useToast();
  const currentLang = (i18n.language || 'fr').slice(0, 2).toLowerCase();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [tradeIn, setTradeIn] = useState(false);
  const [tradeInDetails, setTradeInDetails] = useState('');
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
  const priceDisplay = formatPrice(vehicle.price_sale) || t('catalog.priceOnDemand');
  const specs = vehicle.specs || {};

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});

    const newErrors = {};
    if (!fullName.trim()) newErrors.full_name = t('forms.errors.nameRequired');
    if (!phone.trim()) newErrors.phone = t('forms.errors.phoneRequired');
    if (!email.trim()) newErrors.email = t('forms.errors.emailRequired');
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
          type: 'purchase',
          activity: 'vehicle',
          lang: currentLang,
          vehicle_id: Number(vehicle.id),
          full_name: userEffName,
          phone: userEffPhone,
          email: userEffEmail,
          message: message.trim() || undefined,
          consent: Boolean(consent),
          website: websiteHoneypot,
          details: {
            city: city.trim(),
            payment_method: paymentMethod,
            trade_in: tradeIn ? 'yes' : 'no',
            trade_in_details: tradeIn ? tradeInDetails.trim() : '',
          },
        };

        const res = await client.post('/requests', payload);
        const data = res.data || res;
        setSubmittedData(data);
        notifyBuySent(userEffName, vehicleName, data.reference || '');
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
      title={t('vehicles.buyModalTitle', { vehicle: vehicleName })}
      size="md"
    >
      {submittedData ? (
        <div className={styles.successBox} role="status">
          <div className={styles.successIcon} aria-hidden="true">✓</div>
          <h3 className={styles.successTitle}>{t('forms.success.title')}</h3>
          <p className={styles.successDesc}>{t('vehicles.buySuccessMessage')}</p>
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
              <span className={styles.vehicleLabel}>{t('vehicles.salePrice')}:</span>
              <span className={styles.vehiclePrice}>{priceDisplay}</span>
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
                <span className={styles.specLabel}>{t('vehicles.specKeys.mileage', 'Kilométrage')}</span>
                <span className={styles.specValue}>
                  {specs.mileage ? `${Number(specs.mileage).toLocaleString('fr-FR')} km` : t('common.notSpecified', 'N/C')}
                </span>
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
                <span className={styles.specLabel}>{t('vehicles.specKeys.color', 'Couleur')}</span>
                <span className={styles.specValue}>{specs.color || t('common.notSpecified', 'N/C')}</span>
              </div>
            </div>
            {(specs.options || specs.features) && (
              <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                <strong>{t('vehicles.optionsAndEquipment', 'Équipements & Options')} : </strong>
                {Array.isArray(specs.options || specs.features)
                  ? (specs.options || specs.features).join(', ')
                  : String(specs.options || specs.features)}
              </div>
            )}
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

          <div className={styles.fieldGroup}>
            <label htmlFor="buy-name" className={styles.label}>
              {t('forms.name')} *
            </label>
            <input
              id="buy-name"
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
              <label htmlFor="buy-phone" className={styles.label}>
                {t('forms.phone')} *
              </label>
              <input
                id="buy-phone"
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
              <label htmlFor="buy-email" className={styles.label}>
                {t('forms.email')} *
              </label>
              <input
                id="buy-email"
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
            <label htmlFor="buy-city" className={styles.label}>
              {t('vehicles.cityLabel', 'Ville de résidence')}
            </label>
            <input
              id="buy-city"
              type="text"
              className={styles.input}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              autoComplete="address-level2"
              placeholder={t('vehicles.cityPlaceholder', 'Ex : Abidjan, Bouaké, San-Pédro...')}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="buy-payment" className={styles.label}>
              {t('vehicles.paymentMethodLabel', 'Mode de paiement envisagé')}
            </label>
            <select
              id="buy-payment"
              className={styles.select}
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="cash">{t('vehicles.paymentCash', 'Paiement comptant / virement')}</option>
              <option value="financing">{t('vehicles.paymentFinancing', 'Financement / crédit bancaire')}</option>
              <option value="leasing">{t('vehicles.paymentLeasing', 'Crédit-bail (LOA / LLD)')}</option>
            </select>
          </div>

          {/* Option reprise véhicule */}
          <div className={styles.checkboxGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={tradeIn}
                onChange={(e) => setTradeIn(e.target.checked)}
              />
              <span>{t('vehicles.tradeInOption', 'Je souhaite faire reprendre mon véhicule actuel')}</span>
            </label>
          </div>

          {tradeIn && (
            <div className={styles.fieldGroup}>
              <label htmlFor="buy-trade-details" className={styles.label}>
                {t('vehicles.tradeInDetailsLabel', 'Précisions sur votre véhicule à reprendre (Marque, Modèle, Année, Kilométrage)')}
              </label>
              <textarea
                id="buy-trade-details"
                className={styles.textarea}
                rows="2"
                value={tradeInDetails}
                onChange={(e) => setTradeInDetails(e.target.value)}
                placeholder="Ex : Toyota Corolla 2018, 95 000 km, bon état général"
              />
            </div>
          )}

          <div className={styles.fieldGroup}>
            <label htmlFor="buy-message" className={styles.label}>
              {t('forms.message')} ({t('common.optional', 'Optionnel')})
            </label>
            <textarea
              id="buy-message"
              className={styles.textarea}
              rows="3"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('vehicles.buyMessagePlaceholder', 'Disponibilité pour visite, questions techniques ou essai...')}
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
              {t('vehicles.submitPurchaseRequest', 'Envoyer ma demande d’achat')}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export default VehicleBuyModal;

