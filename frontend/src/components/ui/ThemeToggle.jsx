import { useTheme } from '../../context/ThemeContext.jsx';
import { useTranslation } from 'react-i18next';
import styles from './ThemeToggle.module.css';

/**
 * Bouton accessible pour basculer entre les modes Clair, Sombre et Automatique.
 */
export function ThemeToggle({ className = '' }) {
  const { themeMode, resolvedTheme, cycleTheme } = useTheme();
  const { t } = useTranslation();

  const labels = {
    light: t('theme.light', 'Mode clair'),
    dark: t('theme.dark', 'Mode sombre'),
    auto: t('theme.auto', 'Mode automatique (système)'),
  };

  const nextModeText = {
    light: t('theme.switchToDark', 'Passer au mode sombre'),
    dark: t('theme.switchToAuto', 'Passer au mode automatique'),
    auto: t('theme.switchToLight', 'Passer au mode clair'),
  };

  return (
    <button
      type="button"
      className={`${styles.toggleBtn} ${className}`}
      onClick={cycleTheme}
      title={`${labels[themeMode]} – ${nextModeText[themeMode]}`}
      aria-label={`${labels[themeMode]} – ${nextModeText[themeMode]}`}
    >
      {/* Icône Soleil (Mode Clair) */}
      {themeMode === 'light' && (
        <i className={`fa-solid fa-sun ${styles.icon}`} aria-hidden="true" />
      )}

      {/* Icône Lune (Mode Sombre) */}
      {themeMode === 'dark' && (
        <i className={`fa-solid fa-moon ${styles.icon}`} aria-hidden="true" />
      )}

      {/* Icône Écran / Auto (Mode Automatique) */}
      {themeMode === 'auto' && (
        <i className={`fa-solid fa-circle-half-stroke ${styles.icon}`} aria-hidden="true" />
      )}

      <span className={styles.modeIndicator}>
        {themeMode === 'light' ? 'Clair' : themeMode === 'dark' ? 'Sombre' : 'Auto'}
      </span>
    </button>
  );
}

export default ThemeToggle;

