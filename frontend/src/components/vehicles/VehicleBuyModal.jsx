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
 * Formulaire modal dédié à la demande d'achat de véhicule avec gestion de quantité,
 * options de financement et reprise de véhicule.
 */
export function VehicleBuyModal({ vehicle, isOpen, onClose, onSuccess, initialQuantity = 1 }) {
  const { t, i18n } = useTranslation();
  const { user } = useUserAuth();
  const { notifyBuySent, notifyError } = useToast();
  const currentLang = (i18n.language || 'fr').slice(0, 2).toLowerCase();

  const [quantity, setQuantity] = useState(initialQuantity || 1);
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
  const unitPrice = vehicle.price_sale ? Number(vehicle.price_sale) : null;
  const totalPrice = unitPrice ? unitPrice * quantity : null;
  const priceDisplay = formatPrice(totalPrice) || t('catalog.priceOnDemand');
  const specs = vehicle.specs || {};

  const handleSubmit = async (e) => {
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

    try {
      setIsSubmitting(true);
      const userEffName = user ? displayName(user, currentLang) : fullName.trim();
      const userEffEmail = user?.email || email.trim();
      const userEffPhone = user?.phone || phone.trim();

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
          quantity: Number(quantity),
          unit_price: unitPrice,
          total_price: totalPrice,
          payment_method: paymentMethod,
          trade_in: tradeIn ? 'yes' : 'no',
          trade_in_details: tradeIn ? tradeInDetails.trim() : undefined,
        },
      };

      const res = await client.post('/requests', payload);
      const data = res.data || res;
      setSubmittedData(data);
      notifyBuySent(userEffName, `${quantity > 1 ? `${quantity}x ` : ''}${vehicleName}`, data.reference || '');

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('etof:new-request-submitted', { detail: data }));
        if (typeof BroadcastChannel !== 'undefined') {
          try {
            const bc = new BroadcastChannel('etof_orders_sync');
            bc.postMessage({ type: 'new_purchase_submitted', detail: data });
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
    ? t('vehicles.buyModalTitle', { name: clientName, defaultValue: `Demande d’achat – ${clientName}` })
    : vehicleName
    ? `${t('vehicles.buyModalTitleDefault', 'Demande d’achat')} – ${vehicleName}`
    : t('vehicles.buyModalTitleDefault', 'Demande d’achat');

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
          {/* Récapitulatif Véhicule & Prix */}
          <div className={styles.vehicleSummary}>
            <div>
              <span className={styles.vehicleLabel}>{t('vehicles.vehicle')}:</span>
              <strong className={styles.vehicleName}>{vehicleName}</strong>
            </div>
            <div>
              <span className={styles.vehicleLabel}>
                {quantity > 1 ? `${t('vehicles.salePrice')} (${quantity} unités)` : t('vehicles.salePrice')}:
              </span>
              <span className={styles.vehiclePrice}>{priceDisplay}</span>
            </div>
          </div>

          {/* Sélecteur de quantité pour l'achat de véhicules */}
          <div className={styles.quantitySection}>
            <div className={styles.quantityLabelGroup}>
              <span className={styles.quantityTitle}>
                <i className="fa-solid fa-car" style={{ marginRight: '6px' }} />
                {t('vehicles.quantityLabel', 'Quantité de véhicules')}
              </span>
              <span className={styles.quantitySubtitle}>
                {t('vehicles.quantityHelper', 'Nombre d’unités souhaitées à l’achat')}
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
            </div>
          </div>

          {/* Coordonnées Client */}
          <div className={styles.grid2}>
            <div className={styles.fieldGroup}>
              <label htmlFor="buy-fullname" className={styles.label}>
                {t('forms.fullName', 'Nom et Prénoms')} *
              </label>
              <input
                id="buy-fullname"
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
              <label htmlFor="buy-phone" className={styles.label}>
                {t('forms.phone', 'Numéro de téléphone')} *
              </label>
              <input
                id="buy-phone"
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
              <label htmlFor="buy-email" className={styles.label}>
                {t('forms.email', 'Adresse email')} *
              </label>
              <input
                id="buy-email"
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
              <label htmlFor="buy-city" className={styles.label}>
                {t('forms.city', 'Ville ou Commune')}
              </label>
              <input
                id="buy-city"
                type="text"
                className={styles.input}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ex : Abidjan - Cocody"
              />
            </div>
          </div>

          {/* Mode de financement */}
          <div className={styles.fieldGroup}>
            <label htmlFor="buy-payment-method" className={styles.label}>
              {t('vehicles.paymentMethodLabel', 'Mode de paiement envisagé')}
            </label>
            <select
              id="buy-payment-method"
              className={styles.select}
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="cash">{t('vehicles.paymentMethodCash', 'Comptant (chèque de banque / virement)')}</option>
              <option value="financing">{t('vehicles.paymentMethodFinancing', 'Financement bancaire / Crédit auto')}</option>
              <option value="leasing">{t('vehicles.paymentMethodLeasing', 'Leasing / Location avec option d’achat (LOA)')}</option>
            </select>
          </div>

          {/* Option Reprise d'un ancien véhicule */}
          <div className={styles.checkboxBlock}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={tradeIn}
                onChange={(e) => setTradeIn(e.target.checked)}
              />
              <span>{t('vehicles.tradeInLabel', 'Je souhaite faire reprendre mon ancien véhicule')}</span>
            </label>

            {tradeIn && (
              <div style={{ marginTop: '0.75rem' }}>
                <label htmlFor="buy-tradein-details" className={styles.label}>
                  {t('vehicles.tradeInDetailsLabel', 'Détails du véhicule de reprise')}
                </label>
                <input
                  id="buy-tradein-details"
                  type="text"
                  className={styles.input}
                  value={tradeInDetails}
                  onChange={(e) => setTradeInDetails(e.target.value)}
                  placeholder={t('vehicles.tradeInDetailsPlaceholder', 'Marque, modèle, année, kilométrage approximatif...')}
                />
              </div>
            )}
          </div>

          {/* Précisions ou Message */}
          <div className={styles.fieldGroup}>
            <label htmlFor="buy-message" className={styles.label}>
              {t('forms.message', 'Précisions supplémentaires (facultatif)')}
            </label>
            <textarea
              id="buy-message"
              className={styles.textarea}
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ex : Équipements spécifiques demandés, délai souhaité..."
            />
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
                t('vehicles.btnSendBuyRequest', 'Transmettre ma demande d’achat')
              )}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export default VehicleBuyModal;
