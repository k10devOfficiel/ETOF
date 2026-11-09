import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Container from '../ui/Container.jsx';
import Spinner from '../ui/Spinner.jsx';
import Alert from '../ui/Alert.jsx';
import Button from '../ui/Button.jsx';
import ProductCard from './ProductCard.jsx';
import ProductDetailModal from './ProductDetailModal.jsx';
import { getProducts, getCategories } from '../../api/catalog.js';
import styles from './ActivityProductCatalog.module.css';

/**
 * Section catalogue dédiée à une activité spécifique (ferme ou fournitures).
 * Isole strictement les produits et les catégories appartenant à l'activité donnée.
 *
 * @param {{
 *   activity: 'farm' | 'office',
 *   title?: string,
 *   subtitle?: string,
 *   badge?: string
 * }} props
 * @returns {JSX.Element}
 */
export function ActivityProductCatalog({
  activity,
  title,
  subtitle,
  badge,
}) {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Lecture des filtres synchronisés dans l'URL
  const currentCategory = searchParams.get('category') || '';
  const currentSearch = searchParams.get('q') || '';
  const currentAvailable = searchParams.get('available') === '1';
  const currentPage = Math.max(1, parseInt(searchParams.get('page') || '1', 10));

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
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Chargement des catégories strictement filtrées par cette activité
  useEffect(() => {
    let isMounted = true;
    const fetchCats = async () => {
      try {
        const data = await getCategories({ activity });
        if (isMounted) {
          setCategories(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Erreur chargement catégories activité:', err);
      }
    };

    fetchCats();
    return () => {
      isMounted = false;
    };
  }, [activity, i18n.language]);

  // Chargement des produits strictement isolés sur cette activité
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        activity,
        page: currentPage,
        per_page: 12,
      };

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
  }, [activity, currentCategory, currentSearch, currentAvailable, currentPage, i18n.language]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

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

  const handleCategoryChange = (e) => {
    updateFilters({ category: e.target.value, page: 1 });
  };

  const handleSearchChange = (e) => {
    updateFilters({ q: e.target.value, page: 1 });
  };

  const handleAvailableToggle = (e) => {
    updateFilters({ available: e.target.checked ? '1' : '', page: 1 });
  };

  const handleResetFilters = () => {
    const updated = new URLSearchParams();
    setSearchParams(updated, { replace: true });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      updateFilters({ page: newPage });
      const el = document.getElementById(`catalog-${activity}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleSelectProduct = (prod) => {
    setSelectedProduct(prod);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  const hasActiveFilters = Boolean(currentCategory || currentSearch || currentAvailable);

  return (
    <section id={`catalog-${activity}`} className={styles.catalogSection} aria-label={title || t('catalog.pageTitle')}>
      <Container size="fixed">
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{title || t('catalog.pageTitle')}</h2>
          {subtitle && <p className={styles.sectionSubtitle}>{subtitle}</p>}
        </header>

        {/* Barre de filtrage spécifique à la section */}
        <div className={styles.filtersBar}>
          <div className={styles.filtersGrid}>
            <input
              type="search"
              className={styles.searchInput}
              placeholder={t('catalog.searchPlaceholder')}
              value={currentSearch}
              onChange={handleSearchChange}
              aria-label={t('catalog.searchAriaLabel')}
            />

            <select
              className={styles.categorySelect}
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

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                className={styles.checkboxInput}
                checked={currentAvailable}
                onChange={handleAvailableToggle}
              />
              <span>{t('catalog.filterAvailableOnly')}</span>
            </label>

            {hasActiveFilters && (
              <button
                type="button"
                className={styles.resetBtn}
                onClick={handleResetFilters}
              >
                {t('catalog.resetFilters')}
              </button>
            )}
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div style={{ marginBottom: '2rem' }}>
            <Alert variant="error" title={t('catalog.errorTitle')}>
              {t('catalog.errorMessage')}
              <div style={{ marginTop: '0.75rem' }}>
                <Button variant="outline" size="sm" onClick={fetchProducts}>
                  {t('catalog.retry')}
                </Button>
              </div>
            </Alert>
          </div>
        )}

        {/* État de chargement */}
        {loading && (
          <div className={styles.loadingBox} role="status">
            <Spinner size="lg" color="primary" />
            <span>{t('catalog.loading')}</span>
          </div>
        )}

        {/* Liste des produits & pagination */}
        {!loading && !error && (
          <>
            <div className={styles.resultsSummary}>
              <span>{t('catalog.resultsCount', { count: pagination.total })}</span>
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
              <div className={styles.emptyBox}>
                <svg className={styles.emptyIcon} viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" />
                </svg>
                <h3 className={styles.emptyTitle}>{t('catalog.noResultsTitle')}</h3>
                <p className={styles.emptySubtitle}>{t('catalog.noResultsSubtitle')}</p>
                {hasActiveFilters && (
                  <Button variant="outline" size="md" onClick={handleResetFilters}>
                    {t('catalog.resetFilters')}
                  </Button>
                )}
              </div>
            ) : (
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

      {/* Modal Fiche Produit */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </section>
  );
}

export default ActivityProductCatalog;

