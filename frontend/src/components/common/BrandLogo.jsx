import { Link } from 'react-router-dom';
import logoOfficial from '../../assets/logo/logo-etof.png';
import styles from './BrandLogo.module.css';

/**
 * Composant de marque officiel ETOF SARL.
 * Affiche le logo officiel de l'entreprise (globe terrestre et slogan).
 *
 * @param {{
 *   onClick?: () => void,
 *   className?: string,
 *   height?: number | string
 * }} props
 */
export function BrandLogo({ onClick, className = '', height }) {
  return (
    <Link
      to="/"
      className={`${styles.logoLink} ${className}`}
      onClick={onClick}
      aria-label="ETOF SARL – Une nouvelle vision du monde des affaires – Accueil"
    >
      <img
        src={logoOfficial}
        alt="ETOF SARL – Une nouvelle vision du monde des affaires"
        className={styles.logoImage}
        style={height ? { height: typeof height === 'number' ? `${height}px` : height } : undefined}
      />
    </Link>
  );
}

export default BrandLogo;

