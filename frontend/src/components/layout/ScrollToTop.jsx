import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Composant utilitaire déclenchant un retour automatique en haut de page à chaque changement de route.
 *
 * @returns {null}
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default ScrollToTop;

