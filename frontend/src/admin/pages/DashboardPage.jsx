import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import adminApi from '../api/adminApi.js';
import Spinner from '../../components/ui/Spinner.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Icon from '../../components/common/Icon.jsx';
import RequestDetailModal from '../components/RequestDetailModal.jsx';
import DemandChart from '../components/DemandChart.jsx';
import { ADMIN_PATH } from '../../config/adminConfig.js';
import styles from './DashboardPage.module.css';

const STATUS_CONFIG = {
  new: { label: 'Nouvelle', className: styles.statusNew },
  in_progress: { label: 'En cours', className: styles.statusInProgress },
  confirmed: { label: 'Confirmée', className: styles.statusConfirmed },
  rejected: { label: 'Rejetée', className: styles.statusRejected },
  closed: { label: 'Clôturée', className: styles.statusClosed },
};

const TYPE_LABELS = {
  quote: 'Devis',
  order: 'Commande',
  reservation: 'Réservation',
  purchase: 'Achat direct',
  contact: 'Contact',
};

const ACTIVITY_LABELS = {
  farm: 'Ferme & Volaille',
  vehicle: 'Parc Véhicules',
  office: 'Fournitures de bureau',
  fuel: 'Transport Hydrocarbures',
  general: 'Général',
};

const ACTIVITY_COLORS = {
  farm: '#14b8c4',
  vehicle: '#0b2a4a',
  office: '#10b981',
  fuel: '#6366f1',
  general: '#64748b',
};

export function DashboardPage() {
  const { admin } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtre d'activité sélectionné
  const [selectedActivity, setSelectedActivity] = useState('all');

  // Recherche locale instantanée
  const [searchFilter, setSearchFilter] = useState('');

  // Modal détaillée
  const [selectedRequestId, setSelectedRequestId] = useState(null);

  const loadDashboardData = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      setError(null);

      const [statsData, requestsData] = await Promise.all([
        adminApi.getStats(),
        adminApi.getRequests({ per_page: 25, sort_by: 'created_at', order: 'desc' }),
      ]);

      setStats(statsData);
      setRecentRequests(requestsData?.items || []);
    } catch {
      if (!silent) {
        setError('Impossible de charger les données du tableau de bord.');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadDashboardData();

    // Actualisation silencieuse périodique toutes les 3,5 secondes
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadDashboardData(true);
      }
    }, 3500);

    // Écoute des événements temps réel émis lors d'une soumission ou annulation
    const handleSync = () => {
      loadDashboardData(true);
    };

    window.addEventListener('etof:new-request-received', handleSync);
    window.addEventListener('etof:new-request-submitted', handleSync);
    window.addEventListener('etof:request-cancelled', handleSync);

    let bc = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel('etof_orders_sync');
        bc.onmessage = () => {
          loadDashboardData(true);
        };
      } catch {}
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('etof:new-request-received', handleSync);
      window.removeEventListener('etof:new-request-submitted', handleSync);
      window.removeEventListener('etof:request-cancelled', handleSync);
      if (bc) {
        try {
          bc.close();
        } catch {}
      }
    };
  }, [loadDashboardData]);

  // Filtrage combiné : Activité + Recherche instantanée
  const filteredRequests = useMemo(() => {
    return recentRequests.filter((r) => {
      // Filtre activité
      if (selectedActivity !== 'all' && r.activity !== selectedActivity) {
        return false;
      }
      // Filtre recherche textuelle
      if (searchFilter.trim() !== '') {
        const query = searchFilter.toLowerCase().trim();
        const clientFullName = (r.full_name || r.name || '').toLowerCase();
        const refStr = (r.reference || '').toLowerCase();
        const emailStr = (r.email || '').toLowerCase();
        const phoneStr = (r.phone || '').toLowerCase();
        const companyStr = (r.company || '').toLowerCase();
        const vehicleStr = (r.vehicle_name || '').toLowerCase();
        const typeStr = (TYPE_LABELS[r.type] || r.type || '').toLowerCase();
        const actStr = (ACTIVITY_LABELS[r.activity] || r.activity || '').toLowerCase();
        const statusStr = (STATUS_CONFIG[r.status]?.label || r.status || '').toLowerCase();

        return (
          clientFullName.includes(query) ||
          refStr.includes(query) ||
          emailStr.includes(query) ||
          phoneStr.includes(query) ||
          companyStr.includes(query) ||
          vehicleStr.includes(query) ||
          typeStr.includes(query) ||
          actStr.includes(query) ||
          statusStr.includes(query)
        );
      }
      return true;
    });
  }, [recentRequests, selectedActivity, searchFilter]);

  // Statistiques calculées dynamiquement selon le pôle sélectionné
  const displayedStats = useMemo(() => {
    if (selectedActivity === 'all') {
      return {
        total: stats?.total ?? recentRequests.length,
        new: stats?.by_status?.new ?? recentRequests.filter((r) => r.status === 'new').length,
        in_progress: stats?.by_status?.in_progress ?? recentRequests.filter((r) => r.status === 'in_progress').length,
        confirmed: stats?.by_status?.confirmed ?? recentRequests.filter((r) => r.status === 'confirmed').length,
        vehicles: stats?.vehicles_count ?? 6,
        products: stats?.products_count ?? 12,
      };
    }

    const actRequests = recentRequests.filter((r) => r.activity === selectedActivity);
    return {
      total: stats?.by_activity?.[selectedActivity] ?? actRequests.length,
      new: actRequests.filter((r) => r.status === 'new').length,
      in_progress: actRequests.filter((r) => r.status === 'in_progress').length,
      confirmed: actRequests.filter((r) => r.status === 'confirmed').length,
      vehicles: selectedActivity === 'vehicle' ? (stats?.vehicles_count ?? 6) : null,
      products: selectedActivity === 'farm'
        ? (stats?.farm_products_count ?? 6)
        : selectedActivity === 'office'
        ? (stats?.office_products_count ?? 6)
        : null,
    };
  }, [stats, recentRequests, selectedActivity]);

  return (
    <div className={styles.container}>
      {/* En-tête : Titre & Sélecteur interactif des 4 Pôles */}
      <div className={styles.headerRow}>
        <div className={styles.titleGroup}>
          <i className={`fa-solid fa-gauge-high ${styles.titleIcon}`} aria-hidden="true" />
          <h1 className={styles.title}>Vue d’ensemble</h1>
        </div>

        {/* Boutons interactifs pour switcher sur les catégories */}
        <div className={styles.tabsList} role="tablist" aria-label="Filtrer par secteur d'activité">
          <button
            type="button"
            className={`${styles.tabBtn} ${selectedActivity === 'all' ? styles.activeTabBtn : ''}`}
            onClick={() => setSelectedActivity('all')}
          >
            Tous les pôles
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${selectedActivity === 'farm' ? styles.activeTabBtn : ''}`}
            onClick={() => setSelectedActivity('farm')}
          >
            Ferme & Volaille
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${selectedActivity === 'vehicle' ? styles.activeTabBtn : ''}`}
            onClick={() => setSelectedActivity('vehicle')}
          >
            Vente & Location Voitures
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${selectedActivity === 'office' ? styles.activeTabBtn : ''}`}
            onClick={() => setSelectedActivity('office')}
          >
            Fournitures de Bureau
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${selectedActivity === 'fuel' ? styles.activeTabBtn : ''}`}
            onClick={() => setSelectedActivity('fuel')}
          >
            Transport Hydrocarbures
          </button>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* Rangée des 6 KPIs dynamiques */}
          <section className={styles.kpiGrid} aria-label="Indicateurs clés">
            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <div className={styles.kpiIconWrapper} style={{ background: '#e0f2fe', color: '#0369a1' }}>
                  <Icon name="file-lines" size={18} />
                </div>
                <span className={`${styles.kpiTrendBadge} ${styles.trendPositive}`}>Actif</span>
              </div>
              <p className={styles.kpiTitle}>Total Demandes</p>
              <div className={styles.kpiValueRow}>
                <span className={styles.kpiValue}>{displayedStats.total}</span>
                <span className={styles.kpiSubtext}>dossiers</span>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <div className={styles.kpiIconWrapper} style={{ background: '#cffafe', color: '#0891b2' }}>
                  <Icon name="bell" size={18} />
                </div>
                <span className={`${styles.kpiTrendBadge} ${styles.trendHighlight}`}>À traiter</span>
              </div>
              <p className={styles.kpiTitle}>Nouvelles</p>
              <div className={styles.kpiValueRow}>
                <span className={styles.kpiValue} style={{ color: '#0284c7' }}>
                  {displayedStats.new}
                </span>
                <span className={styles.kpiSubtext}>en attente</span>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <div className={styles.kpiIconWrapper} style={{ background: '#fef3c7', color: '#b45309' }}>
                  <Icon name="clock" size={18} />
                </div>
                <span className={`${styles.kpiTrendBadge} ${styles.trendNeutral}`}>En cours</span>
              </div>
              <p className={styles.kpiTitle}>En Traitement</p>
              <div className={styles.kpiValueRow}>
                <span className={styles.kpiValue} style={{ color: '#b45309' }}>
                  {displayedStats.in_progress}
                </span>
                <span className={styles.kpiSubtext}>actives</span>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <div className={styles.kpiIconWrapper} style={{ background: '#dcfce7', color: '#15803d' }}>
                  <Icon name="circle-check" size={18} />
                </div>
                <span className={`${styles.kpiTrendBadge} ${styles.trendPositive}`}>Succès</span>
              </div>
              <p className={styles.kpiTitle}>Confirmées</p>
              <div className={styles.kpiValueRow}>
                <span className={styles.kpiValue} style={{ color: '#15803d' }}>
                  {displayedStats.confirmed}
                </span>
                <span className={styles.kpiSubtext}>validées</span>
              </div>
            </div>

            {/* Carte Voitures : affichée uniquement pour Tous les pôles et le pôle Véhicules */}
            {(selectedActivity === 'all' || selectedActivity === 'vehicle') && (
              <div className={styles.kpiCard}>
                <div className={styles.kpiHeader}>
                  <div className={styles.kpiIconWrapper} style={{ background: '#ede9fe', color: '#6d28d9' }}>
                    <Icon name="car" size={18} />
                  </div>
                  <span className={`${styles.kpiTrendBadge} ${styles.trendNeutral}`}>Parc</span>
                </div>
                <p className={styles.kpiTitle}>
                  {selectedActivity === 'vehicle' ? 'Véhicules du Parc' : 'Voitures'}
                </p>
                <div className={styles.kpiValueRow}>
                  <span className={styles.kpiValue}>{displayedStats.vehicles}</span>
                  <span className={styles.kpiSubtext}>modèles</span>
                </div>
              </div>
            )}

            {/* Carte Produits : affichée uniquement pour Tous les pôles, Ferme et Fournitures */}
            {(selectedActivity === 'all' || selectedActivity === 'farm' || selectedActivity === 'office') && (
              <div className={styles.kpiCard}>
                <div className={styles.kpiHeader}>
                  <div className={styles.kpiIconWrapper} style={{ background: '#f1f5f9', color: '#0b2a4a' }}>
                    <Icon name={selectedActivity === 'farm' ? 'feather' : 'box'} size={18} />
                  </div>
                  <span className={`${styles.kpiTrendBadge} ${styles.trendNeutral}`}>
                    {selectedActivity === 'farm' ? 'Élevage' : selectedActivity === 'office' ? 'Fournitures' : 'Stock'}
                  </span>
                </div>
                <p className={styles.kpiTitle}>
                  {selectedActivity === 'farm' ? 'Volailles Référencées' : selectedActivity === 'office' ? 'Articles de Bureau' : 'Produits'}
                </p>
                <div className={styles.kpiValueRow}>
                  <span className={styles.kpiValue}>{displayedStats.products}</span>
                  <span className={styles.kpiSubtext}>articles</span>
                </div>
              </div>
            )}
          </section>

          {/* Grille Médiane : Graphique interactif Chart.js + Suivi des 4 Pôles */}
          <div className={styles.middleGrid}>
            <DemandChart stats={stats} loading={loading} error={error} />

            {/* Suivi des 4 Pôles d'Activités */}
            <div className={styles.activitiesCard}>
              <h2 className={styles.cardHeaderTitle}>Suivi des 4 Pôles</h2>

              <div className={styles.activitiesList}>
                {['farm', 'vehicle', 'office', 'fuel'].map((actKey) => {
                  const count = stats?.by_activity?.[actKey] ?? 0;
                  const total = stats?.total ?? 1;
                  const percent = total > 0 ? Math.round((count / total) * 100) : 25;
                  const color = ACTIVITY_COLORS[actKey];

                  return (
                    <div
                      key={actKey}
                      className={styles.activityRow}
                      onClick={() => setSelectedActivity(actKey)}
                      title={`Filtrer sur ${ACTIVITY_LABELS[actKey]}`}
                    >
                      <div className={styles.activityInfo}>
                        <span className={styles.activityName}>
                          <span style={{ width: 9, height: 9, borderRadius: '50%', background: color }} />
                          {ACTIVITY_LABELS[actKey]}
                        </span>
                        <span className={styles.activityCount}>
                          {count} ({percent}%)
                        </span>
                      </div>
                      <div className={styles.progressBarTrack}>
                        <div
                          className={styles.progressBarFill}
                          style={{
                            width: `${Math.max(percent, 10)}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section Inférieure : Demandes avec Recherche instantanée et Action directe */}
          <div className={styles.bottomSection}>
            <div className={styles.bottomSectionHeader}>
              <h2 className={styles.cardHeaderTitle}>
                Demandes Clients ({filteredRequests.length})
              </h2>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                {/* Champ de recherche instantanée qui filtre le tableau */}
                <div className={styles.searchFilterWrapper}>
                  <span className={styles.searchFilterIcon} aria-hidden="true">
                    <Icon name="magnifying-glass" size={15} color="#94a3b8" />
                  </span>
                  <input
                    type="text"
                    className={styles.searchFilterInput}
                    placeholder="Filtrer par nom, réf, tél..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                  />
                  {searchFilter && (
                    <button
                      type="button"
                      onClick={() => setSearchFilter('')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1rem', padding: 0 }}
                      title="Effacer"
                    >
                      ×
                    </button>
                  )}
                </div>

                <Link to={`${ADMIN_PATH}/demandes`} className={styles.viewAllLink}>
                  <span>Toutes les demandes</span>
                  <Icon name="arrow-right" size={13} />
                </Link>
              </div>
            </div>

            <div className={styles.requestsTableWrapper}>
              {filteredRequests.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.9rem', padding: '1.5rem 0', textAlign: 'center' }}>
                  Aucune demande ne correspond aux critères sélectionnés.
                </p>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.th}>Réf.</th>
                      <th className={styles.th}>Date</th>
                      <th className={styles.th}>Secteur</th>
                      <th className={styles.th}>Type</th>
                      <th className={styles.th}>Client</th>
                      <th className={styles.th}>Statut</th>
                      <th className={styles.th} style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((req) => {
                      const statusMeta = STATUS_CONFIG[req.status] || {
                        label: req.status,
                        className: styles.statusClosed,
                      };

                      return (
                        <tr
                          key={req.id}
                          className={styles.tr}
                          onClick={() => setSelectedRequestId(req.id)}
                        >
                          <td className={styles.td}>
                            <span className={styles.refBadge}>{req.reference || `#${req.id}`}</span>
                          </td>
                          <td className={styles.td}>
                            {req.created_at
                              ? new Date(req.created_at).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: 'short',
                                })
                              : '-'}
                          </td>
                          <td className={styles.td}>
                            <span style={{ fontWeight: 600, color: '#0f172a' }}>
                              {ACTIVITY_LABELS[req.activity] || req.activity}
                            </span>
                          </td>
                          <td className={styles.td}>
                            {TYPE_LABELS[req.type] || req.type}
                          </td>
                          <td className={styles.td}>
                            <div className={styles.clientMeta}>
                              <span className={styles.clientName}>{req.full_name || req.name || 'Client'}</span>
                              <span className={styles.clientContact}>{req.email || req.phone || '-'}</span>
                            </div>
                          </td>
                          <td className={styles.td}>
                            <span className={`${styles.statusBadge} ${statusMeta.className}`}>
                              <span className={styles.statusDot} />
                              {statusMeta.label}
                            </span>
                          </td>
                          <td className={styles.td} style={{ textAlign: 'right' }}>
                            <button
                              type="button"
                              className={styles.actionBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRequestId(req.id);
                              }}
                            >
                              <Icon name="eye" size={13} />
                              <span>Consulter</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {/* Modal Fiche de consultation */}
      {selectedRequestId && (
        <RequestDetailModal
          isOpen={Boolean(selectedRequestId)}
          requestId={selectedRequestId}
          onClose={() => setSelectedRequestId(null)}
          onUpdated={loadDashboardData}
        />
      )}
    </div>
  );
}

export default DashboardPage;
