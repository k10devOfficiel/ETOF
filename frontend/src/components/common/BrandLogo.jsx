import { Link } from 'react-router-dom';
import styles from './BrandLogo.module.css';

/**
 * Composant de marque officiel ETOF SARL.
 * Affiche une typographie soignée et épurée au nom de l'entreprise.
 * Conçu pour accueillir facilement un logo fichier unique ultérieur (src/assets/logo).
 *
 * @param {{
 *   onClick?: () => void,
 *   className?: string
 * }} props
 */
export function BrandLogo({ onClick, className = '' }) {
  return (
    <Link to="/" className={`${styles.logoLink} ${className}`} onClick={onClick} aria-label="ETOF SARL – Accueil">
      <div className={styles.logoBadge}>
        <span className={styles.monogram}>E</span>
      </div>
      <div className={styles.textGroup}>
        <span className={styles.companyName}>ETOF SARL</span>
        <span className={styles.tagline}>Une nouvelle vision du monde des affaires</span>
      </div>
    </Link>
  );
}

export default BrandLogo;

