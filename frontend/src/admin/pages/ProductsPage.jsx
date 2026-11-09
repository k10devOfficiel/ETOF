import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import adminApi from '../api/adminApi.js';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import Alert from '../../components/ui/Alert.jsx';
import ProductModal from '../components/ProductModal.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import { ADMIN_PATH } from '../../config/adminConfig.js';
import styles from './ProductsPage.module.css';

/**
 * Vue d'administration complète du catalogue de produits.
 * Intègre la recherche, le filtrage par catégorie et statut actif, le tri,
 * la pagination, la création, la modification, l'activation/désactivation rapide
 * et la suppression définitive avec confirmation.
 *
 * @returns {JSX.Element}
 */
export function ProductsPage() {
  const [searchParams] = useSearchParams();
  const activityParam = searchParams.get('activity') || '';

  const [products, setProducts] = useState([]);
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
  const [activeFilter, setActiveFilter] = useState('');
  const [sortBy, setSortBy] = useState('sort_order');
  const [order, setOrder] = useState('asc');

  // États de chargement et notification
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Modales
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [deleteProductTarget, setDeleteProductTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  // Chargement des catégories pour le filtre
  useEffect(() => {
    adminApi
      .getCategories()
      .then((data) => {
        const items = Array.isArray(data) ? data : data?.items || [];
        if (activityParam) {
          setCategories(items.filter((c) => c.activity === activityParam));
        } else {
          setCategories(items.filter((c) => c.activity === 'farm' || c.activity === 'office'));
        }
      })
      .catch((err) => console.warn('Erreur chargement catégories:', err));
  }, [activityParam]);

  // Chargement des produits
  const loadProducts = useCallback(
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
        if (activityParam) params.activity = activityParam;
        if (categoryId) params.category_id = categoryId;
        if (activeFilter !== '') params.is_active = activeFilter;

        const data = await adminApi.getProducts(params);
        setProducts(data?.items || []);
        if (data?.pagination) {
          setPagination(data.pagination);
        }
      } catch (err) {
        setError('Impossible de charger les produits.');
      } finally {
        setLoading(false);
      }
    },
    [pagination.page, pagination.per_page, search, categoryId, activeFilter, sortBy, order]
  );

  useEffect(() => {
    loadProducts(1);
  }, [search, categoryId, activeFilter, sortBy, order]);

  // Ouverture modale création
  const handleOpenCreate = () => {
    setSelectedProduct(null);
    setModalOpen(true);
  };

  // Ouverture modale modification
  const handleOpenEdit = (product) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  // Bascule rapide Actif / Inactif
  const handleToggleActive = async (product) => {
    try {
      setTogglingId(product.id);
      const newActive = !product.is_active;
      await adminApi.updateProduct(product.id, {
        category_id: product.category_id || product.category?.id,
        name_fr: product.name_fr || product.name,
        name_en: product.name_en || product.name_fr || product.name,
        is_active: newActive,
        min_quantity: product.min_quantity || 1,
      });

      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_active: newActive } : p))
      );
      setSuccessMessage(`Le produit a été ${newActive ? 'activé' : 'désactivé'} avec succès.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Erreur lors du changement d\'état du produit.');
    } finally {
      setTogglingId(null);
    }
  };

  // Basculement instantané de la disponibilité (Disponible / Indisponible)
  const handleToggleAvailable = async (product) => {
    try {
      setTogglingId(product.id);
      const newAvailable = !product.is_available;
      await adminApi.updateProduct(product.id, {
        category_id: product.category_id || product.category?.id,
        name_fr: product.name_fr || product.name,
        name_en: product.name_en || product.name_fr || product.name,
        is_available: newAvailable,
        min_quantity: product.min_quantity || 1,
      });

      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_available: newAvailable } : p))
      );
      setSuccessMessage(`Disponibilité mise à jour : ${newAvailable ? 'Disponible' : 'Indisponible'}.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      setError('Erreur lors du changement de disponibilité du produit.');
    } finally {
      setTogglingId(null);
    }
  };

  // Confirmation de suppression définitive
  const handleConfirmDelete = async () => {
    if (!deleteProductTarget) return;

    try {
      setIsDeleting(true);
      await adminApi.deleteProduct(deleteProductTarget.id, true);
      setSuccessMessage(`Le produit '${deleteProductTarget.name_fr || deleteProductTarget.name}' a été définitivement supprimé.`);
      setDeleteProductTarget(null);
      loadProducts(pagination.page);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Erreur lors de la suppression définitive du produit.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>
            {activityParam === 'farm'
              ? 'Ferme & Élevage de Volailles'
              : activityParam === 'office'
              ? 'Fournitures de Bureau'
              : 'Gestion des Produits'}
          </h1>
          <p className={styles.subtitle}>
            {activityParam === 'farm'
              ? 'Gestion des poulets fermiers, pondeuses, pintades, cailles et œufs frais.'
              : activityParam === 'office'
              ? 'Gestion des articles de papeterie, consommables et matériel de bureau.'
              : "Créez, modifiez et gérez l'ensemble des produits des pôles Ferme et Fournitures."}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {activityParam && (
            <Link
              to={`${ADMIN_PATH}/demandes?activity=${activityParam}`}
              style={{ textDecoration: 'none' }}
            >
              <Button variant="outline" size="md">
                📋 Voir les commandes {activityParam === 'farm' ? 'Ferme' : 'Fournitures'}
              </Button>
            </Link>
          )}

          <Button variant="primary" size="md" onClick={handleOpenCreate}>
            + Nouveau Produit
          </Button>
        </div>
      </header>

      {successMessage && <Alert variant="success">{successMessage}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}

      {/* Barre d'outils et de filtrage */}
      <section className={styles.toolbar} aria-label="Filtres de recherche">
        <div className={styles.filterGroup}>
          <input
            type="search"
            placeholder="Rechercher par nom, réf..."
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
            <option value="">Toutes les catégories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_fr || c.name}
              </option>
            ))}
          </select>

          <select
            className={styles.select}
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            aria-label="Filtrer par état"
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
            aria-label="Trier les produits"
          >
            <option value="sort_order:asc">Tri : Par ordre défini</option>
            <option value="name:asc">Nom : A à Z</option>
            <option value="name:desc">Nom : Z à A</option>
            <option value="price:asc">Prix : Croissant</option>
            <option value="price:desc">Prix : Décroissant</option>
            <option value="created_at:desc">Date : Plus récents</option>
          </select>
        </div>
      </section>

      {/* Tableau des produits */}
      <div className={styles.tableCard}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <Spinner size="lg" />
          </div>
        ) : products.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Aucun produit ne correspond aux critères sélectionnés.</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th} style={{ width: '60px' }}>Visuel</th>
                  <th className={styles.th}>Produit</th>
                  <th className={styles.th}>Catégorie</th>
                  <th className={styles.th}>Prix unitaire</th>
                  <th className={styles.th}>Stock / Dispo</th>
                  <th className={styles.th}>État</th>
                  <th className={styles.th} style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const hasPrice = p.price !== null && p.price !== undefined && Number(p.price) > 0;
                  const isActive = Boolean(p.is_active);

                  return (
                    <tr key={p.id} className={styles.tr}>
                      <td className={styles.td}>
                        {p.image ? (
                          <img src={p.image} alt={p.name_fr || p.name} className={styles.thumbImg} />
                        ) : (
                          <div className={styles.thumbPlaceholder}>Sans photo</div>
                        )}
                      </td>
                      <td className={styles.td}>
                        <strong>{p.name_fr || p.name}</strong>
                        {p.reference && <div className={styles.refTag}>{p.reference}</div>}
                      </td>
                      <td className={styles.td}>
                        <Badge variant="default">
                          {p.category_name_fr || p.category?.name_fr || p.category?.name || 'Général'}
                        </Badge>
                      </td>
                      <td className={styles.td}>
                        {hasPrice ? (
                          <strong>{Number(p.price).toLocaleString('fr-FR')} FCFA</strong>
                        ) : (
                          <span style={{ color: '#64748b' }}>Sur demande</span>
                        )}
                        {p.unit_fr && <span style={{ fontSize: '0.8rem', color: '#64748b' }}> / {p.unit_fr}</span>}
                      </td>
                      <td className={styles.td}>
                        <button
                          type="button"
                          onClick={() => handleToggleAvailable(p)}
                          disabled={togglingId === p.id}
                          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                          title="Cliquer pour basculer instantanément la disponibilité"
                        >
                          <Badge variant={p.is_available ? 'available' : 'unavailable'}>
                            {p.is_available ? 'Disponible' : 'Indisponible'}
                          </Badge>
                        </button>
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
                            onClick={() => handleOpenEdit(p)}
                            title="Modifier ce produit"
                          >
                            Modifier
                          </button>

                          <button
                            type="button"
                            className={styles.actionBtn}
                            onClick={() => handleToggleActive(p)}
                            disabled={togglingId === p.id}
                            title={isActive ? 'Désactiver ce produit' : 'Activer ce produit'}
                          >
                            {isActive ? 'Désactiver' : 'Activer'}
                          </button>

                          <button
                            type="button"
                            className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                            onClick={() => setDeleteProductTarget(p)}
                            title="Supprimer définitivement ce produit"
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
              Affichage de {products.length} sur {pagination.total} produit(s)
            </span>
            <div className={styles.paginationControls}>
              <button
                type="button"
                className={styles.pageBtn}
                disabled={pagination.page <= 1}
                onClick={() => loadProducts(pagination.page - 1)}
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
                onClick={() => loadProducts(pagination.page + 1)}
              >
                Suivant
              </button>
            </div>
          </footer>
        )}
      </div>

      {/* Modale de création / édition de produit */}
      <ProductModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        product={selectedProduct}
        categories={categories}
        onSaved={() => loadProducts(pagination.page)}
      />

      {/* Modale de confirmation avant suppression définitive */}
      <ConfirmModal
        isOpen={Boolean(deleteProductTarget)}
        onClose={() => setDeleteProductTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Supprimer définitivement le produit"
        message={`Êtes-vous sûr de vouloir supprimer définitivement le produit « ${deleteProductTarget?.name_fr || deleteProductTarget?.name} » ? Cette action est irréversible et effacera l'article ainsi que son fichier photo.`}
        confirmLabel="Oui, supprimer définitivement"
        isProcessing={isDeleting}
      />
    </div>
  );
}

export default ProductsPage;
