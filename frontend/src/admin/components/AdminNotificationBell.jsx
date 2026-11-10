import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import adminApi from '../api/adminApi.js';
import { ADMIN_PATH } from '../../config/adminConfig.js';
import { playSound } from '../../utils/soundHelper.js';
import styles from './AdminNotificationBell.module.css';

const TYPE_LABELS = {
  quote: 'Devis',
  order: 'Commande',
  reservation: 'Réservation',
  purchase: 'Achat direct',
  contact: 'Contact',
};

const ACTIVITY_ICONS = {
  farm: { icon: 'fa-solid fa-feather-pointed', className: styles.iconFarm },
  vehicle: { icon: 'fa-solid fa-car', className: styles.iconVehicle },
  office: { icon: 'fa-solid fa-briefcase', className: styles.iconOffice },
  fuel: { icon: 'fa-solid fa-gas-pump', className: styles.iconFuel },
  general: { icon: 'fa-solid fa-file-lines', className: styles.iconFarm },
};

/**
 * Produit un bip doux et agréable via l'API Web Audio native (sans fichier externe).
 */
function playNotificationChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Arpège rapide doux (La 520Hz vers Do 659Hz)
    osc.frequency.setValueAtTime(523.25, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.36);
  } catch {
    // Les politiques d'autoplay des navigateurs peuvent bloquer le son si aucune interaction préalable
  }
}

/**
 * Formate une date en heure relative (ex: "À l'instant", "Il y a 3 min", "14:32").
 *
 * @param {string} dateString
 * @returns {string}
 */
function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString.replace(' ', 'T'));
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 45) return 'À l’instant';
  if (diffSec < 3600) {
    const mins = Math.max(1, Math.floor(diffSec / 60));
    return `Il y a ${mins} min`;
  }
  if (diffSec < 86400) {
    const hours = Math.floor(diffSec / 3600);
    return `Il y a ${hours} h`;
  }
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Composant Cloche de Notification temps réel pour l'espace privé d'administration d'ETOF SARL.
 * Assure un polling discret et alerte instantanément l'administrateur lors de l'arrivée d'une demande.
 */
export function AdminNotificationBell() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [recentRequests, setRecentRequests] = useState([]);
  const [newCount, setNewCount] = useState(0);
  const [isRinging, setIsRinging] = useState(false);

  const lastMaxIdRef = useRef(null);
  const containerRef = useRef(null);
  const isInitialLoadRef = useRef(true);

  // Récupération des demandes récentes et comptage
  const fetchLatest = useCallback(async () => {
    try {
      const res = await adminApi.getRequests({
        page: 1,
        per_page: 8,
        sort_by: 'created_at',
        order: 'desc',
      });

      const items = res?.items || [];
      const currentNewCount = items.filter((it) => it.status === 'new').length;
      setNewCount(currentNewCount);
      setRecentRequests(items);

      if (items.length > 0) {
        const topId = Number(items[0].id);

        // Si ce n'est pas le chargement initial et qu'un ID supérieur apparaît : nouvelle demande !
        if (!isInitialLoadRef.current && lastMaxIdRef.current !== null && topId > lastMaxIdRef.current) {
          playSound('notification');
          setIsRinging(true);
          setTimeout(() => setIsRinging(false), 3000);

          // Notifier les composants d'administration (Dashboard et RequestsPage)
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('etof:new-request-received', {
                detail: items[0],
              })
            );
          }
        }

        lastMaxIdRef.current = Math.max(lastMaxIdRef.current || 0, topId);
      }

      isInitialLoadRef.current = false;
    } catch {
      // Échec silencieux pendant le polling
    }
  }, []);

  // Flux Server-Sent Events (SSE) en temps réel instantané avec repli polling haute réactivité
  useEffect(() => {
    fetchLatest();
    let es = null;
    let fallbackInterval = null;

    try {
      es = new EventSource('/api/notifications/stream?target=admin');

      es.addEventListener('new_request', () => {
        playSound('notification');
        setIsRinging(true);
        setTimeout(() => setIsRinging(false), 3000);
        fetchLatest();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('etof:refresh-requests'));
        }
      });

      es.addEventListener('request_cancelled', () => {
        playSound('status_alert');
        fetchLatest();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('etof:refresh-requests'));
        }
      });

      es.onerror = () => {
        if (es) {
          try { es.close(); } catch {}
          es = null;
        }
        if (!fallbackInterval) {
          fallbackInterval = setInterval(() => {
            if (document.visibilityState === 'visible') {
              fetchLatest();
            }
          }, 2500);
        }
      };
    } catch {
      fallbackInterval = setInterval(fetchLatest, 2500);
    }

    return () => {
      if (es) {
        try { es.close(); } catch {}
      }
      if (fallbackInterval) {
        clearInterval(fallbackInterval);
      }
    };
  }, [fetchLatest]);

  // Écoute des événements de soumission et d'annulation pour actualisation instantanée
  useEffect(() => {
    const handleSync = () => {
      fetchLatest();
    };

    const handleCancelled = () => {
      playSound('status_alert');
      fetchLatest();
    };

    window.addEventListener('etof:new-request-submitted', handleSync);
    window.addEventListener('etof:request-cancelled', handleCancelled);
    window.addEventListener('etof:refresh-requests', handleSync);

    let bc = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel('etof_orders_sync');
        bc.onmessage = (evt) => {
          if (evt.data?.type === 'order_deleted' || evt.data?.type === 'order_cancelled') {
            playSound('status_alert');
          }
          fetchLatest();
        };
      } catch {}
    }

    return () => {
      window.removeEventListener('etof:new-request-submitted', handleSync);
      window.removeEventListener('etof:request-cancelled', handleCancelled);
      window.removeEventListener('etof:refresh-requests', handleSync);
      if (bc) {
        try {
          bc.close();
        } catch {}
      }
    };
  }, [fetchLatest]);

  // Fermeture du dropdown au clic en dehors et touche Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleItemClick = (reference) => {
    setIsOpen(false);
    navigate(`${ADMIN_PATH}/demandes?q=${encodeURIComponent(reference)}`);
  };

  const handleViewAll = () => {
    setIsOpen(false);
    navigate(`${ADMIN_PATH}/demandes`);
  };

  return (
    <div className={styles.bellWrapper} ref={containerRef}>
      <button
        type="button"
        className={`${styles.bellButton} ${isRinging ? styles.ringing : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Notifications des demandes"
        aria-expanded={isOpen}
      >
        <i className={`fa-solid fa-bell ${styles.bellIcon}`} aria-hidden="true" />
        {newCount > 0 && (
          <span className={styles.badge} aria-label={`${newCount} nouvelles demandes non traitées`}>
            {newCount > 9 ? '9+' : newCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={styles.dropdown} role="region" aria-label="Volet des dernières notifications">
          <div className={styles.dropdownHeader}>
            <div className={headerTitleWrapperClass}>
              <h3 className={styles.headerTitle}>Notifications</h3>
              {newCount > 0 && (
                <span className={styles.unreadPill}>
                  {newCount} {newCount > 1 ? 'nouvelles' : 'nouvelle'}
                </span>
              )}
            </div>
            <div className={styles.liveIndicator}>
              <span className={styles.liveDot} aria-hidden="true" />
              <span>Direct</span>
            </div>
          </div>

          <ul className={styles.notificationList}>
            {recentRequests.length === 0 ? (
              <li className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <i className="fa-regular fa-bell-slash" aria-hidden="true" />
                </div>
                <p style={{ margin: 0 }}>Aucune notification récente</p>
              </li>
            ) : (
              recentRequests.map((req) => {
                const isUnread = req.status === 'new';
                const actConfig = ACTIVITY_ICONS[req.activity] || ACTIVITY_ICONS.general;
                const typeLabel = TYPE_LABELS[req.type] || req.type;

                return (
                  <li
                    key={req.id}
                    className={`${styles.notificationItem} ${isUnread ? styles.unread : ''}`}
                    onClick={() => handleItemClick(req.reference)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleItemClick(req.reference);
                      }
                    }}
                  >
                    <div className={`${styles.itemIconWrapper} ${actConfig.className}`} aria-hidden="true">
                      <i className={actConfig.icon} />
                    </div>

                    <div className={styles.itemContent}>
                      <div className={styles.itemHeader}>
                        <span className={styles.itemType}>{typeLabel}</span>
                        <span className={styles.itemTime}>{formatRelativeTime(req.created_at)}</span>
                      </div>
                      <div className={styles.itemClient} title={req.name || req.full_name}>
                        {req.name || req.full_name}
                      </div>
                      <div className={styles.itemRef}>Réf: {req.reference}</div>
                    </div>

                    {isUnread && <span className={styles.unreadDot} title="Non traitée" />}
                  </li>
                );
              })
            )}
          </ul>

          <div className={styles.dropdownFooter}>
            <button
              type="button"
              className={styles.viewAllLink}
              onClick={handleViewAll}
            >
              <span>Voir toutes les demandes</span>
              <i className="fa-solid fa-arrow-right" aria-hidden="true" style={{ fontSize: '10px' }} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const headerTitleWrapperClass = styles.headerTitleWrapper;

export default AdminNotificationBell;

