import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Seo from '../../components/common/Seo.jsx';
import Container from '../../components/ui/Container.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import ProductCard from '../../components/catalog/ProductCard.jsx';
import ProductDetailModal from '../../components/catalog/ProductDetailModal.jsx';
import { getProducts, getCategories, getProductBySlug } from '../../api/catalog.js';
import styles from './CatalogPage.module.css';

/**
 * Page catalogue de produits (ferme, élevage et fournitures de bureau).
 * Intègre un filtrage complet par activité, catégorie, recherche textuelle,
 * disponibilité et pagination synchronisée dans l'URL (searchParams partageables).
 *
 * @returns {JSX.Element}
 */
export function CatalogPage() {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { slug: routeSlug } = useParams();
  const navigate = useNavigate();

  // Lecture des filtres depuis l'URL
  const currentActivity = searchParams.get('activity') || '';
  const currentCategory = searchParams.get('category') || '';
  const currentSearch = searchParams.get('q') || '';
  const currentAvailable = searchParams.get('available') === '1';
  const currentPage = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const currentProductSlug = routeSlug || searchParams.get('product') || null;

  // États locaux
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 12,
    total: 0,
    total_pages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // État du produit sélectionné pour la fiche détaillée
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Chargement des catégories actives
  useEffect(() => {
    let isMounted = true;
    const fetchCats = async () => {
      try {
        const catParams = {};
        if (currentActivity) {
          catParams.activity = currentActivity;
        }
        const data = await getCategories(catParams);
        if (isMounted) {
          setCategories(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Erreur chargement catégories:', err);
      }
    };

    fetchCats();
    return () => {
      isMounted = false;
    };
  }, [currentActivity, i18n.language]);

  // Chargement des produits selon les filtres de l'URL
  const fetchProductList = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        per_page: 12,
      };

      if (currentActivity) {
        params.activity = currentActivity;
      }
      if (currentCategory) {
        params.category = currentCategory;
      }
      if (currentSearch.trim()) {
        params.q = currentSearch.trim();
      }
      if (currentAvailable) {
        params.available = 1;
      }

      const res = await getProducts(params);

      if (res && typeof res === 'object') {
        setProducts(Array.isArray(res.items) ? res.items : []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [currentActivity, currentCategory, currentSearch, currentAvailable, currentPage, i18n.language]);

  useEffect(() => {
    fetchProductList();
  }, [fetchProductList]);

  // Chargement direct du produit si un slug est présent dans l'URL (?product=slug)
  useEffect(() => {
    if (!currentProductSlug) {
      setSelectedProduct(null);
      setIsModalOpen(false);
      return;
    }

    let isMounted = true;
    const loadProductDetails = async () => {
      try {
        const prod = await getProductBySlug(currentProductSlug);
        if (isMounted && prod) {
          setSelectedProduct(prod);
          setIsModalOpen(true);
        }
      } catch (err) {
        console.error('Produit introuvable via URL slug:', err);
      }
    };

    loadProductDetails();
    return () => {
      isMounted = false;
    };
  }, [currentProductSlug, i18n.language]);

  // Mise à jour propre des searchParams de l'URL
  const updateFilters = (newFilters) => {
    const updated = new URLSearchParams(searchParams);

    Object.entries(newFilters).forEach(([key, val]) => {
      if (val === null || val === undefined || val === '' || val === false) {
        updated.delete(key);
      } else if (val === true) {
        updated.set(key, '1');
      } else {
        updated.set(key, String(val));
      }
    });

    setSearchParams(updated, { replace: true });
  };

  const handleActivityChange = (e) => {
    const activity = e.target.value;
    updateFilters({
      activity,
      category: '', // réinitialise la catégorie si l'activité change
      page: 1,
    });
  };

  const handleCategoryChange = (e) => {
    updateFilters({
      category: e.target.value,
      page: 1,
    });
  };

  const handleSearchChange = (e) => {
    updateFilters({
      q: e.target.value,
      page: 1,
    });
  };

  const handleAvailableToggle = (e) => {
    updateFilters({
      available: e.target.checked,
      page: 1,
    });
  };

  const handleResetFilters = () => {
    const cleared = new URLSearchParams();
    setSearchParams(cleared);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      updateFilters({ page: newPage });
      window.scrollTo({ top: 320, behavior: 'smooth' });
    }
  };

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
    updateFilters({ product: product.slug });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    if (routeSlug) {
      const qs = searchParams.toString();
      navigate(qs ? `/catalogue?${qs}` : '/catalogue', { replace: true });
    } else {
      updateFilters({ product: null });
    }
  };

  return (
    <>
      <Seo
        title={t('catalog.metaTitle')}
        description={t('catalog.metaDescription')}
        path="/catalogue"
      />

      {/* En-tête de page */}
      <header className={styles.pageHeader}>
        <Container size="fixed">
          <span className={styles.pageTag}>{t('catalog.pageTag')}</span>
          <h1 className={styles.pageTitle}>{t('catalog.pageTitle')}</h1>
          <p className={styles.pageSubtitle}>{t('catalog.pageSubtitle')}</p>
        </Container>
      </header>

      {/* Barre de filtres synchronisée dans l'URL */}
      <section className={styles.filtersSection} aria-label={t('catalog.filtersAriaLabel')}>
        <Container size="fixed">
          <div className={styles.filtersGrid}>
            {/* Recherche textuelle */}
            <div className={styles.searchInputWrapper}>
              <svg className={styles.searchIcon} viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
              <input
                type="search"
                className={styles.searchInput}
                placeholder={t('catalog.searchPlaceholder')}
                value={currentSearch}
                onChange={handleSearchChange}
                aria-label={t('catalog.searchAriaLabel')}
              />
            </div>

            {/* Filtre par Activité (Ferme, Fournitures) */}
            <div>
              <select
                className={styles.select}
                value={currentActivity}
                onChange={handleActivityChange}
                aria-label={t('catalog.filterActivityAriaLabel')}
              >
                <option value="">{t('catalog.allActivities')}</option>
                <option value="farm">{t('activities.farm')}</option>
                <option value="office">{t('activities.office')}</option>
              </select>
            </div>

            {/* Filtre par Catégorie */}
            <div>
              <select
                className={styles.select}
                value={currentCategory}
                onChange={handleCategoryChange}
                aria-label={t('catalog.filterCategoryAriaLabel')}
              >
                <option value="">{t('catalog.allCategories')}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Option Disponibles uniquement */}
            <div>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  className={styles.checkboxInput}
                  checked={currentAvailable}
                  onChange={handleAvailableToggle}
                />
                <span>{t('catalog.availableOnly')}</span>
              </label>
            </div>

            {/* Bouton Réinitialiser */}
            {(currentActivity || currentCategory || currentSearch || currentAvailable) && (
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

      {/* Grille des produits & états */}
      <main className={styles.catalogSection}>
        <Container size="fixed">
          {/* État Erreur */}
          {error && (
            <div style={{ marginBottom: '2rem' }}>
              <Alert
                variant="error"
                title={t('catalog.errorTitle')}
              >
                {t('catalog.errorMessage')}
                <div style={{ marginTop: '0.75rem' }}>
                  <Button variant="outline" size="sm" onClick={fetchProductList}>
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
              <span>{t('catalog.loading')}</span>
            </div>
          )}

          {/* Contenu chargé */}
          {!loading && !error && (
            <>
              <div className={styles.resultsSummary}>
                <span>
                  {t('catalog.resultsCount', { count: pagination.total })}
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

              {products.length === 0 ? (
                /* État Aucun résultat */
                <div className={styles.emptyBox}>
                  <svg className={styles.emptyIcon} viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                  </svg>
                  <h2 className={styles.emptyTitle}>{t('catalog.noResultsTitle')}</h2>
                  <p className={styles.emptySubtitle}>{t('catalog.noResultsSubtitle')}</p>
                  <Button variant="outline" size="md" onClick={handleResetFilters}>
                    {t('catalog.resetFilters')}
                  </Button>
                </div>
              ) : (
                /* Grille des cartes produits */
                <div className={styles.productsGrid}>
                  {products.map((prod) => (
                    <ProductCard
                      key={prod.id}
                      product={prod}
                      onSelect={handleSelectProduct}
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

      {/* Fiche détaillée produit en dialogue accessible */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}

export default CatalogPage;
