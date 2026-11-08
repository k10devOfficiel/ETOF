import { createContext, useContext, useState, useEffect } from 'react';

const THEME_STORAGE_KEY = 'etof_theme_mode';

const ThemeContext = createContext(null);

/**
 * Fournisseur de thème clair / sombre / automatique (suivi système).
 * Persiste le choix dans localStorage avec gestion d'erreurs et applique l'attribut data-theme sur <html>.
 */
export function ThemeProvider({ children }) {
  const [themeMode, setThemeMode] = useState(() => {
    if (typeof window === 'undefined') return 'auto';
    try {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'auto') {
        return stored;
      }
    } catch (e) {
      // Ignorer si localStorage bloqué
    }
    return 'auto';
  });

  const [resolvedTheme, setResolvedTheme] = useState('light');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateResolvedTheme = () => {
      let active = themeMode;
      if (themeMode === 'auto') {
        active = mediaQuery.matches ? 'dark' : 'light';
      }
      setResolvedTheme(active);
      document.documentElement.setAttribute('data-theme', active);
    };

    updateResolvedTheme();

    // Sauvegarde dans localStorage
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    } catch (e) {
      // Ignorer
    }

    const listener = () => {
      if (themeMode === 'auto') {
        updateResolvedTheme();
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(listener);
      return () => mediaQuery.removeListener(listener);
    }
  }, [themeMode]);

  const cycleTheme = () => {
    setThemeMode((prev) => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'auto';
      return 'light';
    });
  };

  const setSpecificTheme = (mode) => {
    if (mode === 'light' || mode === 'dark' || mode === 'auto') {
      setThemeMode(mode);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        resolvedTheme,
        cycleTheme,
        setThemeMode: setSpecificTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme doit être utilisé au sein d’un ThemeProvider');
  }
  return ctx;
}

export default ThemeContext;

