import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './ProductGallery.module.css';

/**
 * Galerie visuelle multi-angles pour la fiche d'un article ou produit.
 * Permet de visualiser le produit sous plusieurs angles réels, avec support clavier
 * (flèches gauche/droite) et sélecteur de vignettes.
 *
 * @param {{
 *   images?: Array<{ id?: number, path?: string, url?: string, alt_fr?: string } | string>,
 *   mainImage?: string | null,
 *   productName: string
 * }} props
 * @returns {JSX.Element}
 */
export function ProductGallery({ images = [], mainImage = null, productName }) {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);

  // Normalisation des URLs d'images disponibles
  const normalizedImages = React.useMemo(() => {
    const list = [];
    if (mainImage && typeof mainImage === 'string' && mainImage.trim()) {
      list.push(mainImage.trim());
    }
    if (Array.isArray(images) && images.length > 0) {
      images.forEach((img) => {
        let path = null;
        if (typeof img === 'string') {
          path = img.trim();
        } else if (img && typeof img === 'object') {
          path = (img.path || img.url || '').trim();
        }
        if (path && !list.includes(path)) {
          list.push(path);
        }
      });
    }
    return list;
  }, [images, mainImage]);

  const total = normalizedImages.length;

  const handlePrev = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : total - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev < total - 1 ? prev + 1 : 0));
  };

  const handleKeyDown = (e) => {
    if (total <= 1) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handlePrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleNext();
    }
  };

  if (total === 0) {
    return (
      <div className={styles.mainWrapper}>
        <div className={styles.placeholder}>
          <i className={`fa-solid fa-image ${styles.placeholderIcon}`} aria-hidden="true" />
          <span>{t('catalog.noImage', 'Aucune photo disponible')}</span>
        </div>
      </div>
    );
  }

  const currentImageUrl = normalizedImages[activeIndex] || normalizedImages[0];

  return (
    <div
      ref={containerRef}
      className={styles.gallery}
      onKeyDown={handleKeyDown}
      role="region"
      aria-label={`${t('catalog.galleryAriaLabel', 'Galerie photos')} - ${productName}`}
    >
      {/* Affichage principal grand angle */}
      <div
        className={styles.mainWrapper}
        tabIndex="0"
        aria-roledescription="carousel"
        aria-label={`${productName} (${activeIndex + 1}/${total})`}
      >
        <img
          src={currentImageUrl}
          alt={`${productName} - Vue ${activeIndex + 1}`}
          className={styles.mainImage}
          loading="lazy"
          decoding="async"
          width="600"
          height="450"
        />

        {total > 1 && (
          <>
            <button
              type="button"
              className={`${styles.navBtn} ${styles.navPrev}`}
              onClick={handlePrev}
              aria-label={t('vehicles.prevPhoto', 'Photo précédente')}
            >
              <i className="fa-solid fa-chevron-left" aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`${styles.navBtn} ${styles.navNext}`}
              onClick={handleNext}
              aria-label={t('vehicles.nextPhoto', 'Photo suivante')}
            >
              <i className="fa-solid fa-chevron-right" aria-hidden="true" />
            </button>
            <span className={styles.imageCounter}>
              {activeIndex + 1} / {total}
            </span>
          </>
        )}
      </div>

      {/* Rangée de vignettes d'angles secondaires */}
      {total > 1 && (
        <div
          className={styles.thumbnailsTrack}
          role="tablist"
          aria-label={t('catalog.thumbnailsAriaLabel', 'Angles et vues du produit')}
        >
          {normalizedImages.map((imgUrl, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={index}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`${t('catalog.viewAngle', 'Voir l’angle')} ${index + 1}`}
                className={`${styles.thumbnailBtn} ${isActive ? styles.thumbnailActive : ''}`}
                onClick={() => setActiveIndex(index)}
              >
                <img
                  src={imgUrl}
                  alt=""
                  aria-hidden="true"
                  className={styles.thumbnailImage}
                  loading="lazy"
                  decoding="async"
                  width="72"
                  height="54"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ProductGallery;

