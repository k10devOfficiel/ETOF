import { Outlet } from 'react-router-dom';
import { Header } from './Header.jsx';
import { Footer } from './Footer.jsx';
import { SkipLink } from './SkipLink.jsx';
import { WhatsAppButton } from './WhatsAppButton.jsx';
import { ScrollToTop } from './ScrollToTop.jsx';
import { useSettings } from '../../hooks/useSettings.js';
import styles from './PublicLayout.module.css';

/**
 * Layout public standard pour l'ensemble des pages vitrine et institutionnelles.
 * Comprend le lien d'évitement, l'en-tête fixe, la zone de contenu principale,
 * le pied de page, le bouton WhatsApp dynamique et le scroll to top automatique.
 *
 * @returns {JSX.Element}
 */
export function PublicLayout() {
  const { settings } = useSettings();

  return (
    <div className={styles.layoutRoot}>
      <ScrollToTop />
      <SkipLink targetId="main-content" />
      <Header settings={settings} />
      <main id="main-content" className={styles.mainContent} tabIndex="-1">
        <Outlet />
      </main>
      <Footer settings={settings} />
      <WhatsAppButton phoneNumber={settings?.whatsapp} />
    </div>
  );
}

export default PublicLayout;

