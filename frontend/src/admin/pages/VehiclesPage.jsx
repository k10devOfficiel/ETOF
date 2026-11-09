import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import adminApi from '../api/adminApi.js';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import Alert from '../../components/ui/Alert.jsx';
import VehicleModal from '../components/VehicleModal.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import { ADMIN_PATH } from '../../config/adminConfig.js';
import styles from './ProductsPage.module.css';

/**
 * Vue d'administration complète du parc de véhicules.
 * Propose la recherche, les filtres par catégorie, mode et disponibilité, le tri,
 * la pagination, la modification rapide du statut directement dans le tableau,
 * l'activation/désactivation et la suppression définitive avec confirmation.
 *
 * @returns {JSX.Element}
 */
export function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 12,
    total: 0,
    total_pages: 1,
  });

  // Filtres et tri
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [modeFilter, setModeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [order, setOrder] = useState('desc');

  // États de chargement et notifications
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Modales
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [deleteVehicleTarget, setDeleteVehicleTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  // Chargement des catégories dédiées aux véhicules
  useEffect(() => {
    adminApi
      .getCategories()
      .then((data) => {
        const items = Array.isArray(data) ? data : data?.items || [];
        setCategories(items.filter((c) => c.activity === 'vehicle'));
      })
      .catch((err) => console.warn('Erreur chargement catégories véhicules:', err));
  }, []);

  // Chargement des véhicules
  const loadVehicles = useCallback(
    async (pageToLoad = pagination.page) => {
      try {
        setLoading(true);
        setError(null);

        const params = {
          page: pageToLoad,
          per_page: pagination.per_page,
          sort_by: sortBy,
          order: order,
        };

        if (search.trim()) params.q = search.trim();
        if (categoryId) params.category_id = categoryId;
        if (modeFilter) params.mode = modeFilter;
        if (statusFilter) params.status = statusFilter;
        if (activeFilter !== '') params.is_active = activeFilter;

        const data = await adminApi.getVehicles(params);
        setVehicles(data?.items || []);
        if (data?.pagination) {
          setPagination(data.pagination);
        }
      } catch (err) {
        setError('Impossible de charger le parc automobile.');
      } finally {
        setLoading(false);
      }
    },
    [pagination.page, pagination.per_page, search, categoryId, modeFilter, statusFilter, activeFilter, sortBy, order]
  );

  useEffect(() => {
    loadVehicles(1);
  }, [search, categoryId, modeFilter, statusFilter, activeFilter, sortBy, order]);

  // Ouverture modale création
  const handleOpenCreate = () => {
    setSelectedVehicle(null);
    setModalOpen(true);
  };

  // Ouverture modale modification
  const handleOpenEdit = (vehicle) => {
    setSelectedVehicle(vehicle);
    setModalOpen(true);
  };

  // Changement rapide du statut directement dans le tableau
  const handleQuickStatusChange = async (vehicle, newStatus) => {
    try {
      setUpdatingStatusId(vehicle.id);
      setError(null);

      await adminApi.updateVehicle(vehicle.id, {
        category_id: vehicle.category_id || vehicle.category?.id,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        mode: vehicle.mode,
        status: newStatus,
        price_sale: vehicle.price_sale,
        price_rental_day: vehicle.price_rental_day,
        specs: vehicle.specs,
        description_fr: vehicle.description_fr,
        description_en: vehicle.description_en,
        is_active: vehicle.is_active,
      });

      setVehicles((prev) =>
        prev.map((v) => (v.id === vehicle.id ? { ...v, status: newStatus } : v))
      );

      const statusLabels = {
        available: 'Disponible',
        reserved: 'Réservé',
        sold: 'Vendu',
        unavailable: 'Indisponible',
      };
      setSuccessMessage(`Statut de « ${vehicle.brand} ${vehicle.model} » mis à jour : ${statusLabels[newStatus] || newStatus}. Visible immédiatement sur le site.`);
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err) {
      setError('Erreur lors du changement de statut du véhicule.');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // Bascule rapide Actif / Inactif
  const handleToggleActive = async (vehicle) => {
    try {
      setTogglingId(vehicle.id);
      const newActive = !vehicle.is_active;

      await adminApi.updateVehicle(vehicle.id, {
        category_id: vehicle.category_id || vehicle.category?.id,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        mode: vehicle.mode,
        status: vehicle.status,
        price_sale: vehicle.price_sale,
        price_rental_day: vehicle.price_rental_day,
        specs: vehicle.specs,
        description_fr: vehicle.description_fr,
        description_en: vehicle.description_en,
        is_active: newActive,
      });

      setVehicles((prev) =>
        prev.map((v) => (v.id === vehicle.id ? { ...v, is_active: newActive } : v))
      );
      setSuccessMessage(`Le véhicule a été ${newActive ? 'activé' : 'désactivé'} avec succès.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Erreur lors du changement d\'état du véhicule.');
    } finally {
      setTogglingId(null);
    }
  };

  // Suppression définitive
  const handleConfirmDelete = async () => {
    if (!deleteVehicleTarget) return;

    try {
      setIsDeleting(true);
      await adminApi.deleteVehicle(deleteVehicleTarget.id, true);
      setSuccessMessage(`Le véhicule « ${deleteVehicleTarget.brand} ${deleteVehicleTarget.model} » a été définitivement supprimé.`);
      setDeleteVehicleTarget(null);
      loadVehicles(pagination.page);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Erreur lors de la suppression définitive du véhicule.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'available':
        return 'available';
      case 'reserved':
        return 'reserved';
      case 'sold':
        return 'sold';
      default:
        return 'unavailable';
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Vente & Location de Véhicules</h1>
          <p className={styles.subtitle}>
            Gérez la flotte automobile, les prix de vente et de location journalière, les angles et la disponibilité.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link
            to={`${ADMIN_PATH}/demandes?activity=vehicle`}
            style={{ textDecoration: 'none' }}
          >
            <Button variant="outline" size="md">
              📋 Réservations & Achats Voitures
            </Button>
          </Link>

          <Button variant="primary" size="md" onClick={handleOpenCreate}>
            + Nouveau Véhicule
          </Button>
        </div>
      </header>

      {successMessage && <Alert variant="success">{successMessage}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}

      {/* Barre d'outils et de filtres */}
      <section className={styles.toolbar} aria-label="Filtres de recherche véhicules">
        <div className={styles.filterGroup}>
          <input
            type="search"
            placeholder="Rechercher marque, modèle..."
            className={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className={styles.select}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            aria-label="Filtrer par catégorie"
          >
            <option value="">Toutes les carrosseries</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_fr || c.name}
              </option>
            ))}
          </select>

          <select
            className={styles.select}
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            aria-label="Filtrer par mode"
          >
            <option value="">Tous les modes</option>
            <option value="both">Vente et Location</option>
            <option value="rental">Location uniquement</option>
            <option value="sale">Vente uniquement</option>
          </select>

          <select
            className={styles.select}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filtrer par statut"
          >
            <option value="">Tous les statuts</option>
            <option value="available">Disponible</option>
            <option value="reserved">Réservé</option>
            <option value="sold">Vendu</option>
            <option value="unavailable">Indisponible</option>
          </select>

          <select
            className={styles.select}
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            aria-label="Filtrer par visibilité"
          >
            <option value="">Tous les états</option>
            <option value="1">Actifs uniquement</option>
            <option value="0">Inactifs uniquement</option>
          </select>

          <select
            className={styles.select}
            value={`${sortBy}:${order}`}
            onChange={(e) => {
              const [newSort, newOrder] = e.target.value.split(':');
              setSortBy(newSort);
              setOrder(newOrder);
            }}
            aria-label="Trier les véhicules"
          >
            <option value="created_at:desc">Date : Plus récents</option>
            <option value="brand:asc">Marque : A à Z</option>
            <option value="model:asc">Modèle : A à Z</option>
            <option value="year:desc">Année : Plus récente</option>
          </select>
        </div>
      </section>

      {/* Tableau des véhicules */}
      <div className={styles.tableCard}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <Spinner size="lg" />
          </div>
        ) : vehicles.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Aucun véhicule ne correspond aux critères sélectionnés.</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th} style={{ width: '60px' }}>Photo</th>
                  <th className={styles.th}>Véhicule</th>
                  <th className={styles.th}>Mode</th>
                  <th className={styles.th}>Tarif location</th>
                  <th className={styles.th}>Prix vente</th>
                  <th className={styles.th}>Changer le statut (instantané)</th>
                  <th className={styles.th}>État</th>
                  <th className={styles.th} style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => {
                  const isActive = Boolean(v.is_active);
                  const isUpdatingThis = updatingStatusId === v.id;

                  return (
                    <tr key={v.id} className={styles.tr}>
                      <td className={styles.td}>
                        {v.main_image ? (
                          <img src={v.main_image} alt={`${v.brand} ${v.model}`} className={styles.thumbImg} />
                        ) : (
                          <div className={styles.thumbPlaceholder}>Sans photo</div>
                        )}
                      </td>
                      <td className={styles.td}>
                        <strong>{v.brand} {v.model}</strong>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          {v.year} • {v.category_name_fr || v.category?.name_fr || 'Véhicule'}
                        </div>
                      </td>
                      <td className={styles.td}>
                        <Badge variant="default">
                          {v.mode === 'both' ? 'Vente & Location' : v.mode === 'rental' ? 'Location' : 'Vente'}
                        </Badge>
                      </td>
                      <td className={styles.td}>
                        {v.price_rental_day ? (
                          <strong>{Number(v.price_rental_day).toLocaleString('fr-FR')} FCFA/j</strong>
                        ) : (
                          <span style={{ color: '#64748b' }}>-</span>
                        )}
                      </td>
                      <td className={styles.td}>
                        {v.price_sale ? (
                          <strong>{Number(v.price_sale).toLocaleString('fr-FR')} FCFA</strong>
                        ) : (
                          <span style={{ color: '#64748b' }}>-</span>
                        )}
                      </td>
                      <td className={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <select
                            className={styles.select}
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.825rem' }}
                            value={v.status}
                            disabled={isUpdatingThis}
                            onChange={(e) => handleQuickStatusChange(v, e.target.value)}
                            title="Modifier le statut du véhicule"
                          >
                            <option value="available">Disponible</option>
                            <option value="reserved">Réservé</option>
                            <option value="sold">Vendu</option>
                            <option value="unavailable">Indisponible</option>
                          </select>
                          {isUpdatingThis && <Spinner size="sm" />}
                        </div>
                      </td>
                      <td className={styles.td}>
                        <Badge variant={isActive ? 'available' : 'sold'}>
                          {isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                      </td>
                      <td className={styles.td} style={{ textAlign: 'right' }}>
                        <div className={styles.actionsCell} style={{ justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className={styles.actionBtn}
                            onClick={() => handleOpenEdit(v)}
                            title="Modifier ce véhicule"
                          >
                            Modifier
                          </button>

                          <button
                            type="button"
                            className={styles.actionBtn}
                            onClick={() => handleToggleActive(v)}
                            disabled={togglingId === v.id}
                            title={isActive ? 'Désactiver ce véhicule' : 'Activer ce véhicule'}
                          >
                            {isActive ? 'Désactiver' : 'Activer'}
                          </button>

                          <button
                            type="button"
                            className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                            onClick={() => setDeleteVehicleTarget(v)}
                            title="Supprimer définitivement ce véhicule"
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Contrôles de pagination */}
        {!loading && pagination.total > 0 && (
          <footer className={styles.pagination}>
            <span>
              Affichage de {vehicles.length} sur {pagination.total} véhicule(s)
            </span>
            <div className={styles.paginationControls}>
              <button
                type="button"
                className={styles.pageBtn}
                disabled={pagination.page <= 1}
                onClick={() => loadVehicles(pagination.page - 1)}
              >
                Précédent
              </button>
              <span style={{ alignSelf: 'center', padding: '0 0.5rem', fontWeight: 600 }}>
                {pagination.page} / {pagination.total_pages}
              </span>
              <button
                type="button"
                className={styles.pageBtn}
                disabled={pagination.page >= pagination.total_pages}
                onClick={() => loadVehicles(pagination.page + 1)}
              >
                Suivant
              </button>
            </div>
          </footer>
        )}
      </div>

      {/* Modale de création / édition de véhicule */}
      <VehicleModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        vehicle={selectedVehicle}
        categories={categories}
        onSaved={() => loadVehicles(pagination.page)}
      />

      {/* Modale de confirmation avant suppression définitive */}
      <ConfirmModal
        isOpen={Boolean(deleteVehicleTarget)}
        onClose={() => setDeleteVehicleTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Supprimer définitivement le véhicule"
        message={`Êtes-vous sûr de vouloir supprimer définitivement le véhicule « ${deleteVehicleTarget?.brand} ${deleteVehicleTarget?.model} » ? Cette action est irréversible et supprimera le véhicule ainsi que toutes les photos de sa galerie.`}
        confirmLabel="Oui, supprimer définitivement"
        isProcessing={isDeleting}
      />
    </div>
  );
}

export default VehiclesPage;
