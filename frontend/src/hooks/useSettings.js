import { useState, useEffect, useCallback } from 'react';
import { getSettings } from '../api/catalog.js';

/**
 * Hook personnalisé pour récupérer et mettre en cache les paramètres publics du site (ETOF SARL).
 *
 * @returns {{
 *   settings: {
 *     phone: string,
 *     whatsapp: string,
 *     email: string,
 *     address: string,
 *     facebook: string,
 *     instagram: string,
 *     linkedin: string
 *   },
 *   loading: boolean,
 *   error: Error | null,
 *   refresh: () => Promise<void>
 * }}
 */
export function useSettings() {
  const [settings, setSettings] = useState({
    phone: '',
    whatsapp: '',
    email: '',
    address: '',
    facebook: '',
    instagram: '',
    linkedin: '',
    opening_hours: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSettings();
      if (data && typeof data === 'object') {
        setSettings({
          phone: (data.phone || '').trim(),
          whatsapp: (data.whatsapp || '').trim(),
          email: (data.email || '').trim(),
          address: (data.address || '').trim(),
          facebook: (data.facebook || '').trim(),
          instagram: (data.instagram || '').trim(),
          linkedin: (data.linkedin || '').trim(),
          opening_hours: (data.opening_hours || '').trim(),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return { settings, loading, error, refresh: fetchSettings };
}

export default useSettings;

