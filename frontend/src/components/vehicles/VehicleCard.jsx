import React from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../ui/Button.jsx';
import Icon from '../common/Icon.jsx';
import styles from './VehicleCard.module.css';

/**
 * Formatage d'un montant monétaire en FCFA sans décimales.
 *
 * @param {number} amount
 * @returns {string}
 */
function formatPrice(amount) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(amount) + ' FCFA';
}

/**
 * Carte de présentation d'un véhicule pour la grille du catalogue automobile.
 *
 * @param {{
 *   vehicle: {
 *     id: number,
 *     slug: string,
 *     brand: string,
 *     model: string,
 *     year?: number,
 *     mode: 'sale' | 'rental' | 'both',
 *     status: 'available' | 'reserved' | 'sold' | 'unavailable',
 *     price_sale?: number | null,
 *     price_rental_day?: number | null,
 *     description?: string | null,
 *     main_image?: string | null,
 *     category?: {
 *       name: string,
 *       slug: string
 *     }
 *   },
 *   onSelect: (vehicle: any) => void
 * }} props
 * @returns {JSX.Element}
 */
export function VehicleCard({ vehicle, onSelect, onBuy, onRent }) {
  const { t } = useTranslation();

  const fullName = `${vehicle.brand} ${vehicle.model}`;

  // Détermination de la variante du badge selon le statut (vert = disponible, rouge = indisponible / vendu)
  const isAvailable = vehicle.status === 'available';
  const badgeVariant = isAvailable ? 'available' : 'unavailable';
  const badgeText = isAvailable
    ? t('vehicles.status_available', 'Disponible')
    : vehicle.status === 'sold'
    ? t('vehicles.status_sold', 'Vendu')
    : t('vehicles.status_unavailable', 'Indisponible');

  const hasSalePrice =
    vehicle.price_sale !== null &&
    vehicle.price_sale !== undefined &&
    Number(vehicle.price_sale) > 0;

  const hasRentalPrice =
    vehicle.price_rental_day !== null &&
    vehicle.price_rental_day !== undefined &&
    Number(vehicle.price_rental_day) > 0;

  const showBuyBtn = vehicle.mode === 'sale' || vehicle.mode === 'both';
  const showRentBtn = vehicle.mode === 'rental' || vehicle.mode === 'both';

  const unavailableExplanation = !isAvailable
    ? vehicle.status === 'reserved'
      ? t('vehicles.reservedNotice', 'Actuellement réservé')
      : vehicle.status === 'sold'
      ? t('vehicles.soldNotice', 'Ce véhicule est vendu')
      : t('vehicles.unavailableNotice', 'Actuellement indisponible')
    : null;

  return (
    <article className={styles.card} aria-labelledby={`vehicle-title-${vehicle.id}`}>
      {/* Zone visuelle */}
      <div
        className={styles.imageWrapper}
        onClick={() => onSelect(vehicle)}
        role="button"
        tabIndex="0"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(vehicle);
          }
        }}
        aria-label={`${t('vehicles.viewDetails')} - ${fullName}`}
      >
        {vehicle.main_image ? (
          <img
            src={vehicle.main_image}
            alt={fullName}
            className={styles.image}
            loading="lazy"
            width="400"
            height="260"
          />
        ) : (
          <div className={styles.placeholderImage}>
            <i className={`fa-solid fa-car ${styles.placeholderIcon}`} aria-hidden="true" style={{ fontSize: '32px' }} />
            <span>{t('catalog.noImage')}</span>
          </div>
        )}
      </div>

      {/* Contenu textuel */}
      <div className={styles.content}>
        <div className={styles.headerRow}>
          <span className={styles.brand}>{vehicle.brand}</span>
          <h3
            id={`vehicle-title-${vehicle.id}`}
            className={styles.title}
            onClick={() => onSelect(vehicle)}
          >
            {vehicle.model}{' '}
            {vehicle.year ? <span className={styles.year}>({vehicle.year})</span> : null}
          </h3>
        </div>

        {vehicle.description && (
          <p className={styles.description}>{vehicle.description}</p>
        )}

        {/* Lignes tarifaires */}
        <div className={styles.pricesBlock}>
          {(vehicle.mode === 'rental' || vehicle.mode === 'both') && (
            <div className={styles.priceItem}>
              <span className={styles.priceLabel}>{t('vehicles.rentalPerDay')} :</span>
              {hasRentalPrice ? (
                <span className={styles.priceValue}>
                  {formatPrice(Number(vehicle.price_rental_day))}
                </span>
              ) : (
                <span className={styles.priceOnDemand}>{t('catalog.priceOnDemand')}</span>
              )}
            </div>
          )}

          {(vehicle.mode === 'sale' || vehicle.mode === 'both') && (
            <div className={styles.priceItem}>
              <span className={styles.priceLabel}>{t('vehicles.salePrice')} :</span>
              {hasSalePrice ? (
                <span className={styles.priceValue}>
                  {formatPrice(Number(vehicle.price_sale))}
                </span>
              ) : (
                <span className={styles.priceOnDemand}>{t('catalog.priceOnDemand')}</span>
              )}
            </div>
          )}
        </div>

        {/* Boutons d'actions Acheter / Louer */}
        <div className={styles.actions}>
          {showBuyBtn && (
            <Button
              variant="primary"
              size="sm"
              disabled={!isAvailable}
              onClick={() => (onBuy ? onBuy(vehicle) : onSelect(vehicle))}
              title={unavailableExplanation || t('vehicles.buy', 'Acheter')}
            >
              {t('vehicles.buy', 'Acheter')}
            </Button>
          )}

          {showRentBtn && (
            <Button
              variant={showBuyBtn ? 'outline' : 'primary'}
              size="sm"
              disabled={!isAvailable}
              onClick={() => (onRent ? onRent(vehicle) : onSelect(vehicle))}
              title={unavailableExplanation || t('vehicles.rent', 'Louer')}
            >
              {t('vehicles.rent', 'Louer')}
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelect(vehicle)}
          >
            {t('vehicles.viewDetails', 'Voir la fiche')}
          </Button>
        </div>

        {!isAvailable && (
          <p className={styles.statusExplainer} role="note">
            <Icon name="circle-info" size={16} color="currentColor" style={{ verticalAlign: 'middle', marginRight: '6px' }} />
            <span>{unavailableExplanation}</span>
          </p>
        )}
      </div>
    </article>
  );
}

export default VehicleCard;

