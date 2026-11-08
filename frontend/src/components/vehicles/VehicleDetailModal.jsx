import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Modal from '../ui/Modal.jsx';
import Badge from '../ui/Badge.jsx';
import Button from '../ui/Button.jsx';
import VehicleGallery from './VehicleGallery.jsx';
import styles from './VehicleDetailModal.module.css';

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
 * Boîte de dialogue détaillée affichant la fiche complète d'un véhicule,
 * sa galerie interactive, ses caractéristiques techniques (specs), son statut,
 * et ses actions de réservation / achat conditionnées par la disponibilité.
 *
 * @param {{
 *   vehicle: any | null,
 *   isOpen: boolean,
 *   onClose: () => void
 * }} props
 * @returns {JSX.Element | null}
 */
export function VehicleDetailModal({ vehicle, isOpen, onClose }) {
  const { t } = useTranslation();

  if (!vehicle) return null;

  const fullName = `${vehicle.brand} ${vehicle.model}`;
  const isAvailable = vehicle.status === 'available';
  const isRentalAllowed = vehicle.mode === 'rental' || vehicle.mode === 'both';
  const isSaleAllowed = vehicle.mode === 'sale' || vehicle.mode === 'both';

  const badgeVariant =
    vehicle.status === 'available'
      ? 'available'
      : vehicle.status === 'reserved'
      ? 'reserved'
      : vehicle.status === 'sold'
      ? 'sold'
      : 'unavailable';

  // Normalisation des specs techniques
  const specsObject = React.useMemo(() => {
    if (!vehicle.specs) return {};
    if (typeof vehicle.specs === 'object') return vehicle.specs;
    try {
      return JSON.parse(vehicle.specs);
    } catch {
      return {};
    }
  }, [vehicle.specs]);

  const hasSalePrice =
    vehicle.price_sale !== null &&
    vehicle.price_sale !== undefined &&
    Number(vehicle.price_sale) > 0;

  const hasRentalPrice =
    vehicle.price_rental_day !== null &&
    vehicle.price_rental_day !== undefined &&
    Number(vehicle.price_rental_day) > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={fullName}
      size="lg"
    >
      <div className={styles.grid}>
        {/* Colonne Galerie */}
        <div>
          <VehicleGallery
            images={vehicle.images || []}
            mainImage={vehicle.main_image}
            vehicleName={fullName}
          />
        </div>

        {/* Colonne Caractéristiques & Actions */}
        <div className={styles.detailsCol}>
          <div className={styles.headerRow}>
            <div>
              <span className={styles.brandYear}>
                {vehicle.brand} {vehicle.year ? `• ${vehicle.year}` : ''}
              </span>
              <h2 className={styles.title}>{vehicle.model}</h2>
            </div>
            <Badge variant={badgeVariant}>
              {t(`vehicles.status_${vehicle.status}`)}
            </Badge>
          </div>

          {vehicle.description && (
            <p className={styles.description}>{vehicle.description}</p>
          )}

          {/* Grille des tarifs */}
          <div className={styles.pricesGrid}>
            {isRentalAllowed && (
              <div className={styles.priceBox}>
                <span className={styles.priceLabel}>{t('vehicles.rentalPerDay')}</span>
                {hasRentalPrice ? (
                  <span className={styles.priceValue}>
                    {formatPrice(Number(vehicle.price_rental_day))}
                  </span>
                ) : (
                  <span className={styles.priceOnDemand}>{t('catalog.priceOnDemand')}</span>
                )}
              </div>
            )}

            {isSaleAllowed && (
              <div className={styles.priceBox}>
                <span className={styles.priceLabel}>{t('vehicles.salePrice')}</span>
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

          {/* Tableau des caractéristiques lues depuis specs */}
          {Object.keys(specsObject).length > 0 && (
            <div className={styles.specsSection}>
              <h3 className={styles.specsTitle}>{t('vehicles.technicalSpecs')}</h3>
              <table className={styles.specsTable}>
                <tbody>
                  {Object.entries(specsObject).map(([key, value]) => (
                    <tr key={key}>
                      <td className={styles.specKey}>
                        {t(`vehicles.specKeys.${key}`, { defaultValue: key })}
                      </td>
                      <td className={styles.specVal}>
                        {typeof value === 'boolean'
                          ? value
                            ? t('common.yes')
                            : t('common.no')
                          : String(value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Message d'indisponibilité si vendu, réservé ou indisponible */}
          {!isAvailable && (
            <div className={styles.unavailabilityNotice} role="alert">
              <svg className={styles.noticeIcon} viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              <span>{t(`vehicles.unavailableReason_${vehicle.status}`)}</span>
            </div>
          )}

          {/* Mention obligatoire de confirmation par ETOF SARL pour les réservations */}
          {isRentalAllowed && isAvailable && (
            <div className={styles.reservationNotice} role="note">
              <svg className={styles.noticeIcon} viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
              </svg>
              <span>{t('vehicles.reservationNotice')}</span>
            </div>
          )}

          {/* Boutons d'action : Réserver & Demande d'achat */}
          <div className={styles.actionsRow}>
            {isRentalAllowed && (
              isAvailable ? (
                <Link
                  to={`/devis?type=reservation&activity=vehicle&vehicle_id=${vehicle.id}`}
                  style={{ textDecoration: 'none', flex: 1 }}
                  onClick={onClose}
                >
                  <Button variant="primary" size="lg" fullWidth>
                    {t('vehicles.btnReserveThis')}
                  </Button>
                </Link>
              ) : (
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  disabled
                  aria-disabled="true"
                  title={t(`vehicles.unavailableReason_${vehicle.status}`)}
                >
                  {t('vehicles.btnReserveThis')}
                </Button>
              )
            )}

            {isSaleAllowed && (
              isAvailable ? (
                <Link
                  to={`/devis?type=purchase&activity=vehicle&vehicle_id=${vehicle.id}`}
                  style={{ textDecoration: 'none', flex: 1 }}
                  onClick={onClose}
                >
                  <Button variant="outline" size="lg" fullWidth>
                    {t('vehicles.btnPurchaseThis')}
                  </Button>
                </Link>
              ) : (
                <Button
                  variant="outline"
                  size="lg"
                  fullWidth
                  disabled
                  aria-disabled="true"
                  title={t(`vehicles.unavailableReason_${vehicle.status}`)}
                >
                  {t('vehicles.btnPurchaseThis')}
                </Button>
              )
            )}

            <Button variant="ghost" size="lg" onClick={onClose}>
              {t('common.close')}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default VehicleDetailModal;

