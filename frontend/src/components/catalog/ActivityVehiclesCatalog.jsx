import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Container from '../ui/Container.jsx';
import Spinner from '../ui/Spinner.jsx';
import Alert from '../ui/Alert.jsx';
import Button from '../ui/Button.jsx';
import VehicleCard from '../vehicles/VehicleCard.jsx';
import VehicleDetailModal from '../vehicles/VehicleDetailModal.jsx';
import VehicleBuyModal from '../vehicles/VehicleBuyModal.jsx';
import VehicleRentModal from '../vehicles/VehicleRentModal.jsx';
import { getVehicles } from '../../api/catalog.js';
import styles from './ActivityVehiclesCatalog.module.css';

/**
 * Sous-catalogue automobile dédié affiché directement sur la page d'activité Véhicules.
 * Permet l'achat et la réservation immédiate sans quitter la section.
 *
 * @returns {JSX.Element}
 */
export function ActivityVehiclesCatalog() {
  const { t, i18n } = useTranslation();
  const currentLang = (i18n.language || 'fr').slice(0, 2).toLowerCase();

  const [modeFilter, setModeFilter] = useState('');
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [buyVehicle, setBuyVehicle] = useState(null);
  const [rentVehicle, setRentVehicle] = useState(null);
  const [buyQuantity, setBuyQuantity] = useState(1);
  const [rentQuantity, setRentQuantity] = useState(1);

  useEffect(() => {
    let isMounted = true;
    const fetchVehicles = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = {
          per_page: 6,
          lang: currentLang,
        };
        if (modeFilter) {
          params.mode = modeFilter;
        }
        const data = await getVehicles(params);
        if (isMounted) {
          setVehicles(data.items || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || t('vehicles.errorMessage'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchVehicles();

    return () => {
      isMounted = false;
    };
  }, [modeFilter, currentLang, t]);

  const handleOpenDetail = (vehicle) => {
    setSelectedVehicle(vehicle);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setSelectedVehicle(null);
    setIsDetailOpen(false);
  };

  return (
    <section className={styles.section} aria-labelledby="vehicles-catalog-title">
      <Container size="xl">
        <header className={styles.header}>
          <span className={styles.badge}>{t('vehicles.badge')}</span>
          <h2 id="vehicles-catalog-title" className={styles.title}>
            {t('vehicles.catalogPageTitle')}
          </h2>
          <p className={styles.subtitle}>{t('vehicles.catalogPageSubtitle')}</p>
        </header>

        {/* Barre de filtrage par mode */}
        <div className={styles.filterBar}>
          <div
            className={styles.modeTabs}
            role="tablist"
            aria-label={t('vehicles.filterModeAriaLabel')}
          >
            <button
              type="button"
              role="tab"
              aria-selected={modeFilter === ''}
              className={`${styles.tabBtn} ${modeFilter === '' ? styles.tabBtnActive : ''}`}
              onClick={() => setModeFilter('')}
            >
              {t('vehicles.allModes')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={modeFilter === 'rental'}
              className={`${styles.tabBtn} ${modeFilter === 'rental' ? styles.tabBtnActive : ''}`}
              onClick={() => setModeFilter('rental')}
            >
              {t('vehicles.mode_rental')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={modeFilter === 'sale'}
              className={`${styles.tabBtn} ${modeFilter === 'sale' ? styles.tabBtnActive : ''}`}
              onClick={() => setModeFilter('sale')}
            >
              {t('vehicles.mode_sale')}
            </button>
          </div>

          <Link to="/vehicules" style={{ textDecoration: 'none' }}>
            <Button variant="outline" size="sm">
              {t('vehicles.btnViewPark')} →
            </Button>
          </Link>
        </div>

        {/* État de chargement */}
        {loading && (
          <div className={styles.stateBox} role="status">
            <Spinner size="lg" />
            <p style={{ marginTop: '1rem', color: 'var(--color-text-muted)' }}>
              {t('vehicles.loading')}
            </p>
          </div>
        )}

        {/* État d'erreur */}
        {!loading && error && (
          <Alert variant="error" title={t('vehicles.errorTitle')}>
            {error}
          </Alert>
        )}

        {/* Grille des véhicules */}
        {!loading && !error && vehicles.length > 0 && (
          <div className={styles.grid}>
            {vehicles.map((v) => (
              <VehicleCard
                key={v.id}
                vehicle={v}
                onSelect={handleOpenDetail}
                onBuy={(veh, q = 1) => {
                  setBuyQuantity(q);
                  setBuyVehicle(veh);
                }}
                onRent={(veh, q = 1) => {
                  setRentQuantity(q);
                  setRentVehicle(veh);
                }}
              />
            ))}
          </div>
        )}

        {/* Absence de résultats */}
        {!loading && !error && vehicles.length === 0 && (
          <div className={styles.stateBox} role="status">
            <h3>{t('vehicles.noResultsTitle')}</h3>
            <p>{t('vehicles.noResultsSubtitle')}</p>
          </div>
        )}

        <div className={styles.footerActions}>
          <Link to="/vehicules" style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="lg">
              {t('vehicles.btnViewPark')}
            </Button>
          </Link>
        </div>
      </Container>

      {/* Modales */}
      {selectedVehicle && (
        <VehicleDetailModal
          slug={selectedVehicle.slug}
          isOpen={isDetailOpen}
          onClose={handleCloseDetail}
          onReserve={(v, q = 1) => {
            handleCloseDetail();
            setRentQuantity(q);
            setRentVehicle(v);
          }}
          onPurchase={(v, q = 1) => {
            handleCloseDetail();
            setBuyQuantity(q);
            setBuyVehicle(v);
          }}
          onRent={(v, q = 1) => {
            handleCloseDetail();
            setRentQuantity(q);
            setRentVehicle(v);
          }}
          onBuy={(v, q = 1) => {
            handleCloseDetail();
            setBuyQuantity(q);
            setBuyVehicle(v);
          }}
        />
      )}

      {buyVehicle && (
        <VehicleBuyModal
          vehicle={buyVehicle}
          isOpen={Boolean(buyVehicle)}
          initialQuantity={buyQuantity}
          onClose={() => setBuyVehicle(null)}
        />
      )}

      {rentVehicle && (
        <VehicleRentModal
          vehicle={rentVehicle}
          isOpen={Boolean(rentVehicle)}
          initialQuantity={rentQuantity}
          onClose={() => setRentVehicle(null)}
        />
      )}
    </section>
  );
}

export default ActivityVehiclesCatalog;
