import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './ScrollRotationCanvas.module.css';

/**
 * Visualiseur 3D rotatif au défilement (60 fps avec requestAnimationFrame).
 * Utilise une séquence d'images WebP multi-angles (36 angles) projetée sur Canvas.
 * Désactivé en douceur sur mobile (< 768px) et en cas de préférence reduced-motion.
 *
 * @param {{
 *   activity: 'vehicle' | 'farm' | 'office' | 'fuel',
 *   altText?: string,
 *   className?: string
 * }} props
 * @returns {JSX.Element}
 */
export function ScrollRotationCanvas({
  activity = 'vehicle',
  altText = 'Modèle 3D en rotation ETOF SARL',
  className = '',
}) {
  const { t } = useTranslation();
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const imagesRef = useRef([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMobileOrReducedMotion, setIsMobileOrReducedMotion] = useState(false);

  const totalFrames = 36;
  const currentFrameRef = useRef(1);
  const isTickingRef = useRef(false);

  useEffect(() => {
    // Détection d'écran mobile ou demande d'accessibilité sans animation
    const checkMedia = () => {
      const isMobile = window.innerWidth < 768;
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setIsMobileOrReducedMotion(isMobile || prefersReduced);
    };

    checkMedia();
    window.addEventListener('resize', checkMedia, { passive: true });

    return () => {
      window.removeEventListener('resize', checkMedia);
    };
  }, []);

  // Préchargement des 36 images WebP
  useEffect(() => {
    let mounted = true;
    const loadedImages = [];
    let loadCounter = 0;

    for (let i = 1; i <= totalFrames; i++) {
      const img = new Image();
      const num = String(i).padStart(2, '0');
      img.src = `/sequences/${activity}/${num}.webp`;
      img.onload = () => {
        if (!mounted) return;
        loadCounter++;
        if (loadCounter === totalFrames) {
          setIsLoaded(true);
        }
      };
      loadedImages.push(img);
    }

    imagesRef.current = loadedImages;

    return () => {
      mounted = false;
    };
  }, [activity]);

  // Dessin sur canvas au défilement
  useEffect(() => {
    if (isMobileOrReducedMotion || !isLoaded) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawFrame = (frameIndex) => {
      const idx = Math.max(0, Math.min(totalFrames - 1, frameIndex - 1));
      const img = imagesRef.current[idx];
      if (img && img.complete) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
    };

    // Premier dessin
    drawFrame(1);

    const handleScroll = () => {
      if (!isTickingRef.current) {
        window.requestAnimationFrame(() => {
          if (!containerRef.current) {
            isTickingRef.current = false;
            return;
          }

          const rect = containerRef.current.getBoundingClientRect();
          const windowHeight = window.innerHeight || 800;

          // Calcul de la progression dans la zone visible (-windowHeight à windowHeight)
          const totalDistance = windowHeight + rect.height;
          const currentDistance = windowHeight - rect.top;
          const progress = Math.max(0, Math.min(1, currentDistance / totalDistance));

          // Mappage sur les 36 angles (1 à 36)
          const targetFrame = Math.floor(progress * totalFrames) + 1;
          const clampedFrame = ((targetFrame - 1) % totalFrames) + 1;

          if (clampedFrame !== currentFrameRef.current) {
            currentFrameRef.current = clampedFrame;
            drawFrame(clampedFrame);
          }

          isTickingRef.current = false;
        });
        isTickingRef.current = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isLoaded, isMobileOrReducedMotion]);

  const defaultImageSrc = `/sequences/${activity}/01.webp`;

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${className}`}
      role="img"
      aria-label={altText}
    >
      {isMobileOrReducedMotion ? (
        <img
          src={defaultImageSrc}
          alt={altText}
          className={styles.staticImage}
          loading="lazy"
          width="400"
          height="400"
        />
      ) : (
        <>
          <canvas
            ref={canvasRef}
            width={400}
            height={400}
            className={styles.canvas}
          />
          <span className={styles.hint} aria-hidden="true">
            3D ⟳ {t('common.scrollRotateHint', 'Faire défiler pour pivoter')}
          </span>
        </>
      )}
    </div>
  );
}

export default ScrollRotationCanvas;

