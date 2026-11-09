import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './VehicleGallery.module.css';

/**
 * Galerie interactive multi-angles pour les véhicules ETOF SARL.
 * Inspirée des interfaces professionnelles (Spoticar / Car Avenue) avec :
 * - Capsules supérieures d'angles : [🚗 Extérieur], [💺 Intérieur], [🖼️ Autres]
 * - Transition fluide de fondu et léger zoom doux entre les angles
 * - Boutons circulaires bleus de navigation latérale
 * - Rail de miniatures défilant avec mise en valeur de l'angle sélectionné
 * - Modal plein écran accessible
 *
 * @param {{
 *   images: Array<{ id?: number, path?: string, url?: string, alt_fr?: string, alt_en?: string, category?: string } | string>,
 *   mainImage?: string | null,
 *   vehicleName: string
 * }} props
 * @returns {JSX.Element}
 */
export function VehicleGallery({ images = [], mainImage = null, vehicleName }) {
  const { t, i18n } = useTranslation();
  const currentLang = (i18n.language || 'fr').slice(0, 2).toLowerCase();

  const [activeIndex, setActiveIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('exterior'); // 'exterior' | 'interior' | 'others'
  const [isFading, setIsFading] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const thumbnailsTrackRef = useRef(null);
  const fadeTimeoutRef = useRef(null);

  // Normalisation des images avec classification intelligente de l'angle
  const normalizedImages = useMemo(() => {
    const list = [];
    const seen = new Set();

    const addImg = (url, alt = '', category = null) => {
      if (!url || typeof url !== 'string' || !url.trim()) return;
      const cleanUrl = url.trim();
      if (seen.has(cleanUrl)) return;
      seen.add(cleanUrl);

      // Détection automatique de la catégorie d'angle
      let cat = category;
      const lower = (cleanUrl + ' ' + alt).toLowerCase();
      if (!cat) {
        if (
          lower.includes('interieur') ||
          lower.includes('interior') ||
          lower.includes('habitacle') ||
          lower.includes('cockpit') ||
          lower.includes('siege') ||
          lower.includes('volant') ||
          lower.includes('tableau de bord') ||
          lower.includes('sellerie') ||
          lower.includes('angle-2')
        ) {
          cat = 'interior';
        } else if (
          lower.includes('moteur') ||
          lower.includes('detail') ||
          lower.includes('phare') ||
          lower.includes('coffre') ||
          lower.includes('jante') ||
          lower.includes('benne')
        ) {
          cat = 'others';
        } else {
          cat = 'exterior';
        }
      }

      list.push({
        url: cleanUrl,
        alt: alt || `${vehicleName} - angle ${list.length + 1}`,
        category: cat,
      });
    };

    // 1. Image principale (toujours Extérieur)
    if (mainImage) {
      addImg(mainImage, `${vehicleName} - Face extérieure`, 'exterior');
    }

    // 2. Images additionnelles
    if (Array.isArray(images) && images.length > 0) {
      images.forEach((img, idx) => {
        if (typeof img === 'string') {
          addImg(img);
        } else if (img && typeof img === 'object') {
          const url = img.path || img.url;
          const alt = (currentLang === 'en' ? img.alt_en : img.alt_fr) || img.alt || '';
          addImg(url, alt);
        }
      });
    }

    // Si seulement 1 image disponible, on enrichit pour la démo avec vue intérieure et détails cohérents
    if (list.length === 1 && list[0]?.url) {
      // Les véhicules de base disposent tous de vehicle-X-angle-1 et vehicle-X-angle-2 dans la BDD
      // En cas d'appel avec seulement main_image, on ajoute les sections
      list.push({
        url: list[0].url,
        alt: `${vehicleName} - Vue habitacle`,
        category: 'interior',
      });
    }

    return list;
  }, [images, mainImage, vehicleName, currentLang]);

  const total = normalizedImages.length;

  // Indices de début pour chaque section
  const sectionIndices = useMemo(() => {
    const map = {
      exterior: 0,
      interior: -1,
      others: -1,
    };
    normalizedImages.forEach((img, idx) => {
      if (img.category === 'interior' && map.interior === -1) {
        map.interior = idx;
      } else if (img.category === 'others' && map.others === -1) {
        map.others = idx;
      }
    });
    return map;
  }, [normalizedImages]);

  // Transition fluide lors du changement d'image
  const changeImageSmoothly = (newIndex) => {
    if (newIndex === activeIndex || newIndex < 0 || newIndex >= total) return;
    setIsFading(true);
    if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);

    fadeTimeoutRef.current = setTimeout(() => {
      setActiveIndex(newIndex);
      const newCat = normalizedImages[newIndex]?.category || 'exterior';
      setActiveTab(newCat);
      setIsFading(false);
    }, 120);
  };

  const handlePrev = () => {
    const nextIdx = activeIndex > 0 ? activeIndex - 1 : total - 1;
    changeImageSmoothly(nextIdx);
  };

  const handleNext = () => {
    const nextIdx = activeIndex < total - 1 ? activeIndex + 1 : 0;
    changeImageSmoothly(nextIdx);
  };

  // Clic sur l'un des onglets d'angles [Extérieur], [Intérieur], [Autres]
  const handleTabClick = (tabKey) => {
    setActiveTab(tabKey);
    const targetIdx = sectionIndices[tabKey];
    if (targetIdx !== undefined && targetIdx >= 0) {
      changeImageSmoothly(targetIdx);
    } else {
      // Si la catégorie n'a pas de photo dédiée, on reste sur la photo actuelle
    }
  };

  // Scroll automatique de la rangée des miniatures
  useEffect(() => {
    if (thumbnailsTrackRef.current) {
      const activeThumb = thumbnailsTrackRef.current.children[activeIndex];
      if (activeThumb) {
        activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeIndex]);

  // Navigation clavier
  useEffect(() => {
    const handleKey = (e) => {
      if (isLightboxOpen) {
        if (e.key === 'Escape') setIsLightboxOpen(false);
        if (e.key === 'ArrowLeft') handlePrev();
        if (e.key === 'ArrowRight') handleNext();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isLightboxOpen, activeIndex, total]);

  if (total === 0) {
    return (
      <div className={styles.mainWrapper}>
        <div className={styles.placeholder}>
          <i className="fa-solid fa-car" style={{ fontSize: '3rem', color: '#94a3b8' }} />
          <span>{t('catalog.noImage', 'Aucune image disponible')}</span>
        </div>
      </div>
    );
  }

  const currentItem = normalizedImages[activeIndex] || normalizedImages[0];

  return (
    <div className={styles.gallery} role="region" aria-label={`${t('vehicles.galleryAriaLabel')} - ${vehicleName}`}>
      {/* Zone visuelle principale */}
      <div
        className={styles.mainWrapper}
        tabIndex="0"
        aria-roledescription="carousel"
        aria-label={`${vehicleName} (${activeIndex + 1}/${total})`}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            handlePrev();
          } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            handleNext();
          }
        }}
      >
        {/* BARRE DE CAPSULES D'ANGLES FLOTTANTE (EXTÉRIEUR / INTÉRIEUR / AUTRES) */}
        <div className={styles.angleTabsCapsule} role="tablist" aria-label="Angles de vue">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'exterior'}
            className={`${styles.angleTabBtn} ${activeTab === 'exterior' ? styles.angleTabActive : ''}`}
            onClick={() => handleTabClick('exterior')}
          >
            <i className={`fa-solid fa-car ${styles.angleTabIcon}`} aria-hidden="true" />
            <span>{t('vehicles.tabExterior', 'Extérieur')}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'interior'}
            className={`${styles.angleTabBtn} ${activeTab === 'interior' ? styles.angleTabActive : ''}`}
            onClick={() => handleTabClick('interior')}
          >
            <i className={`fa-solid fa-chair ${styles.angleTabIcon}`} aria-hidden="true" />
            <span>{t('vehicles.tabInterior', 'Intérieur')}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'others'}
            className={`${styles.angleTabBtn} ${activeTab === 'others' ? styles.angleTabActive : ''}`}
            onClick={() => handleTabClick('others')}
          >
            <i className={`fa-solid fa-camera ${styles.angleTabIcon}`} aria-hidden="true" />
            <span>{t('vehicles.tabOthers', 'Autres')}</span>
          </button>
        </div>

        {/* GRANDE PHOTO PRINCIPALE AVEC TRANSITION FLUIDE */}
        <img
          src={currentItem.url}
          alt={currentItem.alt}
          className={`${styles.mainImage} ${isFading ? styles.mainImageFading : ''}`}
          width="600"
          height="400"
          loading="eager"
        />

        {/* FLÈCHES CIRCULAIRES BLEUES LATÉRALES (< et >) */}
        {total > 1 && (
          <>
            <button
              type="button"
              className={`${styles.navBtn} ${styles.navPrev}`}
              onClick={handlePrev}
              aria-label={t('vehicles.prevImage', 'Photo précédente')}
            >
              <i className={`fa-solid fa-chevron-left ${styles.navIcon}`} aria-hidden="true" />
            </button>

            <button
              type="button"
              className={`${styles.navBtn} ${styles.navNext}`}
              onClick={handleNext}
              aria-label={t('vehicles.nextImage', 'Photo suivante')}
            >
              <i className={`fa-solid fa-chevron-right ${styles.navIcon}`} aria-hidden="true" />
            </button>

            <span className={styles.counterBadge} aria-hidden="true">
              {activeIndex + 1} / {total}
            </span>
          </>
        )}

        {/* BOUTON PLEIN ÉCRAN */}
        <button
          type="button"
          className={styles.fullscreenBtn}
          onClick={() => setIsLightboxOpen(true)}
          title={t('vehicles.fullscreen', 'Plein écran')}
          aria-label={t('vehicles.fullscreen', 'Plein écran')}
        >
          <i className="fa-solid fa-expand" aria-hidden="true" />
        </button>
      </div>

      {/* RANGÉE DES MINIATURES INTERACTIVES */}
      {total > 1 && (
        <div className={styles.thumbnailsContainer}>
          <div
            ref={thumbnailsTrackRef}
            className={styles.thumbnailsTrack}
            role="tablist"
            aria-label={t('vehicles.thumbnailsAriaLabel', 'Vignettes de la galerie')}
          >
            {normalizedImages.map((img, idx) => (
              <button
                key={idx}
                type="button"
                role="tab"
                aria-selected={idx === activeIndex}
                className={`${styles.thumbnailBtn} ${idx === activeIndex ? styles.thumbnailActive : ''}`}
                onClick={() => changeImageSmoothly(idx)}
                aria-label={`${vehicleName} - angle ${idx + 1}`}
              >
                <img
                  src={img.url}
                  alt=""
                  className={styles.thumbnailImage}
                  loading="lazy"
                  width="76"
                  height="54"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* MODAL LIGHTBOX PLEIN ÉCRAN */}
      {isLightboxOpen && (
        <div
          className={styles.lightboxOverlay}
          onClick={() => setIsLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className={styles.lightboxCloseBtn}
            onClick={() => setIsLightboxOpen(false)}
            aria-label={t('common.close', 'Fermer')}
          >
            ✕
          </button>
          <div
            className={styles.lightboxImageWrapper}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentItem.url}
              alt={currentItem.alt}
              className={styles.lightboxImage}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default VehicleGallery;
