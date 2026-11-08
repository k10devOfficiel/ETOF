import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Seo from '../../components/common/Seo.jsx';
import Container from '../../components/ui/Container.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import VehicleCard from '../../components/vehicles/VehicleCard.jsx';
import VehicleDetailModal from '../../components/vehicles/VehicleDetailModal.jsx';
import { getVehicles, getCategories, getVehicleBySlug } from '../../api/catalog.js';
import styles from './VehiclesCatalogPage.module.css';

/**
 * Page catalogue du parc automobile ETOF SARL (vente et location de véhicules).
 * Filtres par type de carrosserie, mode d'acquisition, marque et disponibilité,
 * entièrement synchronisés avec les paramètres d'URL (liens partageables).
 *
 * @returns {JSX.Element}
 */
export function VehiclesCatalogPage() {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { slug: routeSlug } = useParams();
  const navigate = useNavigate();

  // Lecture des filtres depuis l'URL
  const currentType = searchParams.get('type') || '';
  const currentMode = searchParams.get('mode') || '';
  const currentStatus = searchParams.get('status') || '';
  const currentBrand = searchParams.get('brand') || '';
  const currentPage = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const currentVehicleSlug = routeSlug || searchParams.get('vehicle') || null;

  // États locaux
  const [categories, setCategories] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 12,
    total: 0,
    total_pages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // État du véhicule sélectionné pour la fiche détaillée
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Chargement des catégories de véhicules
  useEffect(() => {
    let isMounted = true;
    const fetchCats = async () => {
      try {
        const data = await getCategories({ activity: 'vehicle' });
        if (isMounted) {
          setCategories(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Erreur chargement catégories véhicules:', err);
      }
    };

    fetchCats();
    return () => {
      isMounted = false;
    };
  }, [i18n.language]);

  // Chargement de la liste des véhicules selon les filtres d'URL
  const fetchVehicleList = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        per_page: 12,
      };

      if (currentType) {
        params.type = currentType;
      }
      if (currentMode) {
        params.mode = currentMode;
      }
      if (currentStatus) {
        params.status = currentStatus;
      }
      if (currentBrand.trim()) {
        params.brand = currentBrand.trim();
      }

      const res = await getVehicles(params);

      if (res && typeof res === 'object') {
        setVehicles(Array.isArray(res.items) ? res.items : []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [currentType, currentMode, currentStatus, currentBrand, currentPage, i18n.language]);

  useEffect(() => {
    fetchVehicleList();
  }, [fetchVehicleList]);

  // Chargement direct du véhicule si un slug est présent dans l'URL
  useEffect(() => {
    if (!currentVehicleSlug) {
      setSelectedVehicle(null);
      setIsModalOpen(false);
      return;
    }

    let isMounted = true;
    const loadVehicleDetails = async () => {
      try {
        const veh = await getVehicleBySlug(currentVehicleSlug);
        if (isMounted && veh) {
          setSelectedVehicle(veh);
          setIsModalOpen(true);
        }
      } catch (err) {
        console.error('Véhicule introuvable via slug URL:', err);
      }
    };

    loadVehicleDetails();
    return () => {
      isMounted = false;
    };
  }, [currentVehicleSlug, i18n.language]);

  // Mise à jour synchronisée des paramètres d'URL
  const updateFilters = (newFilters) => {
    const updated = new URLSearchParams(searchParams);

    Object.entries(newFilters).forEach(([key, val]) => {
      if (val === null || val === undefined || val === '') {
        updated.delete(key);
      } else {
        updated.set(key, String(val));
      }
    });

    setSearchParams(updated, { replace: true });
  };

  const handleTypeChange = (e) => {
    updateFilters({ type: e.target.value, page: 1 });
  };

  const handleModeChange = (e) => {
    updateFilters({ mode: e.target.value, page: 1 });
  };

  const handleStatusChange = (e) => {
    updateFilters({ status: e.target.value, page: 1 });
  };

  const handleBrandChange = (e) => {
    updateFilters({ brand: e.target.value, page: 1 });
  };

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      updateFilters({ page: newPage });
      window.scrollTo({ top: 320, behavior: 'smooth' });
    }
  };

  const handleSelectVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    setIsModalOpen(true);
    updateFilters({ vehicle: vehicle.slug });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    if (routeSlug) {
      const qs = searchParams.toString();
      navigate(qs ? `/vehicules?${qs}` : '/vehicules', { replace: true });
    } else {
      updateFilters({ vehicle: null });
    }
  };

  const hasActiveFilters = Boolean(currentType || currentMode || currentStatus || currentBrand);

  return (
    <>
      <Seo
        title={t('vehicles.catalogMetaTitle')}
        description={t('vehicles.catalogMetaDescription')}
        path="/vehicules"
      />

      {/* En-tête de page */}
      <header className={styles.pageHeader}>
        <Container size="fixed">
          <span className={styles.pageTag}>{t('vehicles.badge')}</span>
          <h1 className={styles.pageTitle}>{t('vehicles.catalogPageTitle')}</h1>
          <p className={styles.pageSubtitle}>{t('vehicles.catalogPageSubtitle')}</p>
        </Container>
      </header>

      {/* Barre de filtres interactive */}
      <section className={styles.filtersSection} aria-label={t('vehicles.filtersAriaLabel')}>
        <Container size="fixed">
          <div className={styles.filtersGrid}>
            {/* Filtre par Type (Catégorie de véhicule) */}
            <div>
              <select
                className={styles.select}
                value={currentType}
                onChange={handleTypeChange}
                aria-label={t('vehicles.filterTypeAriaLabel')}
              >
                <option value="">{t('vehicles.allTypes')}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtre par Mode (Vente, Location, Les deux) */}
            <div>
              <select
                className={styles.select}
                value={currentMode}
                onChange={handleModeChange}
                aria-label={t('vehicles.filterModeAriaLabel')}
              >
                <option value="">{t('vehicles.allModes')}</option>
                <option value="rental">{t('vehicles.mode_rental')}</option>
                <option value="sale">{t('vehicles.mode_sale')}</option>
                <option value="both">{t('vehicles.mode_both')}</option>
              </select>
            </div>

            {/* Filtre par Marque */}
            <div>
              <input
                type="text"
                className={styles.select}
                placeholder={t('vehicles.filterBrandPlaceholder')}
                value={currentBrand}
                onChange={handleBrandChange}
                aria-label={t('vehicles.filterBrandAriaLabel')}
              />
            </div>

            {/* Filtre par Statut (Disponibilité) */}
            <div>
              <select
                className={styles.select}
                value={currentStatus}
                onChange={handleStatusChange}
                aria-label={t('vehicles.filterStatusAriaLabel')}
              >
                <option value="">{t('vehicles.allStatuses')}</option>
                <option value="available">{t('vehicles.status_available')}</option>
                <option value="reserved">{t('vehicles.status_reserved')}</option>
                <option value="sold">{t('vehicles.status_sold')}</option>
                <option value="unavailable">{t('vehicles.status_unavailable')}</option>
              </select>
            </div>

            {/* Bouton Réinitialiser */}
            {hasActiveFilters && (
              <div>
                <button
                  type="button"
                  className={styles.resetBtn}
                  onClick={handleResetFilters}
                >
                  {t('catalog.resetFilters')}
                </button>
              </div>
            )}
          </div>
        </Container>
      </section>

      {/* Grille des véhicules & pagination */}
      <main className={styles.vehiclesSection}>
        <Container size="fixed">
          {/* État Erreur */}
          {error && (
            <div style={{ marginBottom: '2rem' }}>
              <Alert variant="error" title={t('vehicles.errorTitle')}>
                {t('vehicles.errorMessage')}
                <div style={{ marginTop: '0.75rem' }}>
                  <Button variant="outline" size="sm" onClick={fetchVehicleList}>
                    {t('catalog.retry')}
                  </Button>
                </div>
              </Alert>
            </div>
          )}

          {/* État Chargement */}
          {loading && (
            <div className={styles.loadingBox} role="status">
              <Spinner size="lg" color="primary" />
              <span>{t('vehicles.loading')}</span>
            </div>
          )}

          {/* Contenu chargé */}
          {!loading && !error && (
            <>
              <div className={styles.resultsSummary}>
                <span>
                  {t('vehicles.resultsCount', { count: pagination.total })}
                </span>
                {pagination.total_pages > 1 && (
                  <span>
                    {t('catalog.pageIndicator', {
                      current: pagination.page,
                      total: pagination.total_pages,
                    })}
                  </span>
                )}
              </div>

              {vehicles.length === 0 ? (
                /* État Aucun résultat */
                <div className={styles.emptyBox}>
                  <svg className={styles.emptyIcon} viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
                  </svg>
                  <h2 className={styles.emptyTitle}>{t('vehicles.noResultsTitle')}</h2>
                  <p className={styles.emptySubtitle}>{t('vehicles.noResultsSubtitle')}</p>
                  <Button variant="outline" size="md" onClick={handleResetFilters}>
                    {t('catalog.resetFilters')}
                  </Button>
                </div>
              ) : (
                /* Grille des cartes véhicules */
                <div className={styles.vehiclesGrid}>
                  {vehicles.map((veh) => (
                    <VehicleCard
                      key={veh.id}
                      vehicle={veh}
                      onSelect={handleSelectVehicle}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pagination.total_pages > 1 && (
                <nav className={styles.pagination} aria-label={t('catalog.paginationAriaLabel')}>
                  <button
                    type="button"
                    className={styles.pageBtn}
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    aria-label={t('catalog.prevPage')}
                  >
                    &larr;
                  </button>

                  {Array.from({ length: pagination.total_pages }, (_, idx) => idx + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`${styles.pageBtn} ${
                        p === pagination.page ? styles.activePageBtn : ''
                      }`}
                      onClick={() => handlePageChange(p)}
                      aria-current={p === pagination.page ? 'page' : undefined}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    type="button"
                    className={styles.pageBtn}
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.total_pages}
                    aria-label={t('catalog.nextPage')}
                  >
                    &rarr;
                  </button>
                </nav>
              )}
            </>
          )}
        </Container>
      </main>

      {/* Fiche détaillée véhicule en modale accessible */}
      <VehicleDetailModal
        vehicle={selectedVehicle}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}

export default VehiclesCatalogPage;

