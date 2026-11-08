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
        <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      )}

      {/* Icône Lune (Mode Sombre) */}
      {themeMode === 'dark' && (
        <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}

      {/* Icône Écran / Auto (Mode Automatique) */}
      {themeMode === 'auto' && (
        <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      )}

      <span className={styles.modeIndicator}>
        {themeMode === 'light' ? 'Clair' : themeMode === 'dark' ? 'Sombre' : 'Auto'}
      </span>
    </button>
  );
}

export default ThemeToggle;

