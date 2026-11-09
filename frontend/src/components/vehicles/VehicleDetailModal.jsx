import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import Badge from '../ui/Badge.jsx';
import VehicleGallery from './VehicleGallery.jsx';
import { client } from '../../api/client.js';
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
 * sa galerie interactive multi-angles (Extérieur / Intérieur / Autres),
 * un sélecteur de quantité réactif, ses caractéristiques techniques,
 * et ses actions de réservation / achat.
 *
 * @param {{
 *   vehicle: any | null,
 *   isOpen: boolean,
 *   onClose: () => void,
 *   onBuy?: (vehicle: any, quantity?: number) => void,
 *   onRent?: (vehicle: any, quantity?: number) => void
 * }} props
 * @returns {JSX.Element | null}
 */
export function VehicleDetailModal({ vehicle, isOpen, onClose, onBuy, onRent }) {
  const { t } = useTranslation();
  const [quantity, setQuantity] = useState(1);
  const [fullVehicleData, setFullVehicleData] = useState(null);

  // Réinitialiser la quantité à 1 lors de l'ouverture
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
    }
  }, [isOpen, vehicle?.id]);

  // Chargement asynchrone des photos multi-angles complètes si nécessaire
  useEffect(() => {
    let isMounted = true;
    if (isOpen && vehicle?.slug && (!vehicle.images || vehicle.images.length === 0)) {
      client
        .get(`/vehicles/${vehicle.slug}`)
        .then((res) => {
          if (isMounted && res) {
            setFullVehicleData(res);
          }
        })
        .catch(() => {
          // Utiliser les données de base si indisponible
        });
    } else {
      setFullVehicleData(null);
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, vehicle?.slug]);

  const activeVehicle = fullVehicleData || vehicle;

  // Normalisation des specs techniques
  const specsObject = useMemo(() => {
    if (!activeVehicle?.specs) return {};
    if (typeof activeVehicle.specs === 'object') return activeVehicle.specs;
    try {
      return JSON.parse(activeVehicle.specs);
    } catch {
      return {};
    }
  }, [activeVehicle?.specs]);

  if (!activeVehicle) return null;

  const fullName = `${activeVehicle.brand} ${activeVehicle.model}`;
  const isAvailable = activeVehicle.status === 'available';
  const isRentalAllowed = activeVehicle.mode === 'rental' || activeVehicle.mode === 'both';
  const isSaleAllowed = activeVehicle.mode === 'sale' || activeVehicle.mode === 'both';

  const badgeVariant =
    activeVehicle.status === 'available'
      ? 'available'
      : activeVehicle.status === 'reserved'
      ? 'reserved'
      : activeVehicle.status === 'sold'
      ? 'sold'
      : 'unavailable';

  const unitSalePrice =
    activeVehicle.price_sale !== null && activeVehicle.price_sale !== undefined
      ? Number(activeVehicle.price_sale)
      : null;

  const unitRentalPrice =
    activeVehicle.price_rental_day !== null && activeVehicle.price_rental_day !== undefined
      ? Number(activeVehicle.price_rental_day)
      : null;

  const totalSalePrice = unitSalePrice ? unitSalePrice * quantity : null;
  const totalRentalPrice = unitRentalPrice ? unitRentalPrice * quantity : null;

  // Liste ordonnée de toutes les photos
  const galleryImages = activeVehicle.images || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={fullName}
      size="lg"
    >
      <div className={styles.grid}>
        {/* Colonne Galerie Multi-Angles */}
        <div>
          <VehicleGallery
            images={galleryImages}
            mainImage={activeVehicle.main_image}
            vehicleName={fullName}
          />
        </div>

        {/* Colonne Caractéristiques & Actions */}
        <div className={styles.detailsCol}>
          <div className={styles.headerRow}>
            <div>
              <span className={styles.brandYear}>
                {activeVehicle.brand} {activeVehicle.year ? `• ${activeVehicle.year}` : ''}
              </span>
              <h2 className={styles.title}>{activeVehicle.model}</h2>
            </div>
            <Badge variant={badgeVariant}>
              {activeVehicle.status === 'available'
                ? t('vehicles.status_available', 'Disponible')
                : activeVehicle.status === 'sold'
                ? t('vehicles.status_sold', 'Vendu')
                : activeVehicle.status === 'reserved'
                ? t('vehicles.status_reserved', 'Réservé')
                : t('vehicles.status_unavailable', 'Indisponible')}
            </Badge>
          </div>

          {activeVehicle.description && (
            <p className={styles.description}>{activeVehicle.description}</p>
          )}

          {/* Sélecteur de quantité réactif pour véhicule */}
          {isAvailable && (
            <div className={styles.quantityBox}>
              <span className={styles.quantityLabel}>
                <i className="fa-solid fa-car" aria-hidden="true" />
                <span>{t('vehicles.quantityLabel', 'Quantité de véhicules')} :</span>
              </span>
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
          )}

          {/* Grille des tarifs avec calcul réactif selon la quantité */}
          <div className={styles.pricesGrid}>
            {isRentalAllowed && (
              <div className={styles.priceBox}>
                <span className={styles.priceLabel}>
                  {quantity > 1
                    ? `${t('vehicles.rentalPerDay', 'Location / jour')} (${quantity} unités)`
                    : t('vehicles.rentalPerDay', 'Location / jour')}
                </span>
                {totalRentalPrice !== null ? (
                  <span className={styles.priceValue}>
                    {formatPrice(totalRentalPrice)}
                    {quantity > 1 && (
                      <small style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', fontWeight: 500 }}>
                        ({formatPrice(unitRentalPrice)} / unité)
                      </small>
                    )}
                  </span>
                ) : (
                  <span className={styles.priceOnDemand}>{t('catalog.priceOnDemand', 'Sur devis')}</span>
                )}
              </div>
            )}

            {isSaleAllowed && (
              <div className={styles.priceBox}>
                <span className={styles.priceLabel}>
                  {quantity > 1
                    ? `${t('vehicles.salePrice', 'Prix d’achat')} (${quantity} unités)`
                    : t('vehicles.salePrice', 'Prix d’achat')}
                </span>
                {totalSalePrice !== null ? (
                  <span className={styles.priceValue}>
                    {formatPrice(totalSalePrice)}
                    {quantity > 1 && (
                      <small style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', fontWeight: 500 }}>
                        ({formatPrice(unitSalePrice)} / unité)
                      </small>
                    )}
                  </span>
                ) : (
                  <span className={styles.priceOnDemand}>{t('catalog.priceOnDemand', 'Sur devis')}</span>
                )}
              </div>
            )}
          </div>

          {/* Tableau des caractéristiques lues depuis specs */}
          {Object.keys(specsObject).length > 0 && (
            <div className={styles.specsSection}>
              <h3 className={styles.specsTitle}>{t('vehicles.technicalSpecs', 'Caractéristiques techniques')}</h3>
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
                            ? t('common.yes', 'Oui')
                            : t('common.no', 'Non')
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
              <i className={`fa-solid fa-circle-exclamation ${styles.noticeIcon}`} aria-hidden="true" />
              <span>{t(`vehicles.unavailableReason_${activeVehicle.status}`)}</span>
            </div>
          )}

          {/* Mention obligatoire de confirmation par ETOF SARL pour les réservations */}
          {isRentalAllowed && isAvailable && (
            <div className={styles.reservationNotice} role="note">
              <i className={`fa-solid fa-circle-info ${styles.noticeIcon}`} aria-hidden="true" />
              <span>{t('vehicles.reservationNotice')}</span>
            </div>
          )}

          {/* Boutons d'action : Réserver & Demande d'achat avec report de la quantité */}
          <div className={styles.actionsRow}>
            {isRentalAllowed && (
              isAvailable ? (
                onRent ? (
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={() => {
                      onClose();
                      onRent(activeVehicle, quantity);
                    }}
                  >
                    {t('vehicles.btnReserveThis', 'Réserver')} {quantity > 1 ? `(${quantity})` : ''}
                  </Button>
                ) : (
                  <Link
                    to={`/devis?type=reservation&activity=vehicle&vehicle_id=${activeVehicle.id}&quantity=${quantity}`}
                    style={{ textDecoration: 'none', flex: 1 }}
                    onClick={onClose}
                  >
                    <Button variant="primary" size="lg" fullWidth>
                      {t('vehicles.btnReserveThis', 'Réserver')} {quantity > 1 ? `(${quantity})` : ''}
                    </Button>
                  </Link>
                )
              ) : (
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  disabled
                  aria-disabled="true"
                  title={t(`vehicles.unavailableReason_${activeVehicle.status}`)}
                >
                  {t('vehicles.btnReserveThis', 'Réserver')}
                </Button>
              )
            )}

            {isSaleAllowed && (
              isAvailable ? (
                onBuy ? (
                  <Button
                    variant="outline"
                    size="lg"
                    fullWidth
                    onClick={() => {
                      onClose();
                      onBuy(activeVehicle, quantity);
                    }}
                  >
                    {t('vehicles.btnPurchaseThis', 'Acheter')} {quantity > 1 ? `(${quantity})` : ''}
                  </Button>
                ) : (
                  <Link
                    to={`/devis?type=purchase&activity=vehicle&vehicle_id=${activeVehicle.id}&quantity=${quantity}`}
                    style={{ textDecoration: 'none', flex: 1 }}
                    onClick={onClose}
                  >
                    <Button variant="outline" size="lg" fullWidth>
                      {t('vehicles.btnPurchaseThis', 'Acheter')} {quantity > 1 ? `(${quantity})` : ''}
                    </Button>
                  </Link>
                )
              ) : (
                <Button
                  variant="outline"
                  size="lg"
                  fullWidth
                  disabled
                  aria-disabled="true"
                  title={t(`vehicles.unavailableReason_${activeVehicle.status}`)}
                >
                  {t('vehicles.btnPurchaseThis', 'Acheter')}
                </Button>
              )
            )}

            <Button variant="ghost" size="lg" onClick={onClose}>
              {t('common.close', 'Fermer')}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default VehicleDetailModal;
