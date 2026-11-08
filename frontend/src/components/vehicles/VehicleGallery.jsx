import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './VehicleGallery.module.css';

/**
 * Galerie photos interactive et accessible pour la fiche d'un véhicule.
 * Prend en charge la navigation au clavier (touches Flèche Gauche et Flèche Droite),
 * les boutons Précédent/Suivant et les vignettes de prévisualisation cliquables.
 *
 * @param {{
 *   images: Array<{ id?: number, url: string, is_main?: boolean } | string>,
 *   mainImage?: string | null,
 *   vehicleName: string
 * }} props
 * @returns {JSX.Element}
 */
export function VehicleGallery({ images = [], mainImage = null, vehicleName }) {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);

  // Normalisation de la liste des URLs d'images
  const normalizedImages = React.useMemo(() => {
    const list = [];
    if (Array.isArray(images) && images.length > 0) {
      images.forEach((img) => {
        if (typeof img === 'string' && img.trim()) {
          list.push(img.trim());
        } else if (img && typeof img === 'object' && img.url) {
          list.push(img.url.trim());
        }
      });
    }
    if (list.length === 0 && mainImage && typeof mainImage === 'string') {
      list.push(mainImage.trim());
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

  // Gestion des touches clavier Flèche Gauche & Flèche Droite
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
          <svg className={styles.placeholderIcon} viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
          </svg>
          <span>{t('catalog.noImage')}</span>
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
      aria-label={`${t('vehicles.galleryAriaLabel')} - ${vehicleName}`}
    >
      {/* Affichage principal */}
      <div
        className={styles.mainWrapper}
        tabIndex="0"
        aria-roledescription="carousel"
        aria-label={`${vehicleName} (${activeIndex + 1}/${total})`}
      >
        <img
          src={currentImageUrl}
          alt={`${vehicleName} - ${t('vehicles.photoIndex', { current: activeIndex + 1, total })}`}
          className={styles.mainImage}
          width="600"
          height="400"
        />

        {total > 1 && (
          <>
            <button
              type="button"
              className={`${styles.navBtn} ${styles.navPrev}`}
              onClick={handlePrev}
              aria-label={t('vehicles.prevImage')}
            >
              <svg className={styles.navIcon} viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
              </svg>
            </button>

            <button
              type="button"
              className={`${styles.navBtn} ${styles.navNext}`}
              onClick={handleNext}
              aria-label={t('vehicles.nextImage')}
            >
              <svg className={styles.navIcon} viewBox="0 0 24 24" aria-hidden="true">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
              </svg>
            </button>

            <span className={styles.imageCounter} aria-hidden="true">
              {activeIndex + 1} / {total}
            </span>
          </>
        )}
      </div>

      {/* Rangée des miniatures */}
      {total > 1 && (
        <div className={styles.thumbnailsTrack} role="tablist" aria-label={t('vehicles.thumbnailsAriaLabel')}>
          {normalizedImages.map((url, idx) => (
            <button
              key={idx}
              type="button"
              role="tab"
              aria-selected={idx === activeIndex}
              className={`${styles.thumbnailBtn} ${idx === activeIndex ? styles.thumbnailActive : ''}`}
              onClick={() => setActiveIndex(idx)}
              aria-label={`${t('vehicles.showPhoto')} ${idx + 1}`}
            >
              <img
                src={url}
                alt=""
                className={styles.thumbnailImage}
                loading="lazy"
                width="80"
                height="60"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default VehicleGallery;

