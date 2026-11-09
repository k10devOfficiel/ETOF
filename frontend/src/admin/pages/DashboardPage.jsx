import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import adminApi from '../api/adminApi.js';
import Spinner from '../../components/ui/Spinner.jsx';
import Alert from '../../components/ui/Alert.jsx';
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

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsData, requestsData] = await Promise.all([
        adminApi.getStats(),
        adminApi.getRequests({ per_page: 25, sort_by: 'created_at', order: 'desc' }),
      ]);

      setStats(statsData);
      setRecentRequests(requestsData?.items || []);
    } catch {
      setError('Impossible de charger les données du tableau de bord.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
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
        const refMatch = (r.reference || '').toLowerCase().includes(query);
        const nameMatch = (r.name || '').toLowerCase().includes(query);
        const emailMatch = (r.email || '').toLowerCase().includes(query);
        const phoneMatch = (r.phone || '').toLowerCase().includes(query);
        const typeMatch = (TYPE_LABELS[r.type] || '').toLowerCase().includes(query);
        return refMatch || nameMatch || emailMatch || phoneMatch || typeMatch;
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
      total: actRequests.length,
      new: actRequests.filter((r) => r.status === 'new').length,
      in_progress: actRequests.filter((r) => r.status === 'in_progress').length,
      confirmed: actRequests.filter((r) => r.status === 'confirmed').length,
      vehicles: selectedActivity === 'vehicle' ? (stats?.vehicles_count ?? 6) : 0,
      products: selectedActivity === 'farm' || selectedActivity === 'office' ? (stats?.products_count ?? 6) : 0,
    };
  }, [stats, recentRequests, selectedActivity]);

  return (
    <div className={styles.container}>
      {/* En-tête : Titre & Sélecteur interactif des 4 Pôles */}
      <div className={styles.headerRow}>
        <div className={styles.titleGroup}>
          <svg className={styles.titleIcon} viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
          </svg>
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
                  <svg className={styles.kpiIcon} viewBox="0 0 24 24">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                  </svg>
                </div>
                <span className={`${styles.kpiTrendBadge} ${styles.trendPositive}`}>+8%</span>
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
                  <svg className={styles.kpiIcon} viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z" />
                  </svg>
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
                  <svg className={styles.kpiIcon} viewBox="0 0 24 24">
                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                  </svg>
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
                  <svg className={styles.kpiIcon} viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
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

            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <div className={styles.kpiIconWrapper} style={{ background: '#ede9fe', color: '#6d28d9' }}>
                  <svg className={styles.kpiIcon} viewBox="0 0 24 24">
                    <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
                  </svg>
                </div>
                <span className={`${styles.kpiTrendBadge} ${styles.trendNeutral}`}>Parc</span>
              </div>
              <p className={styles.kpiTitle}>Voitures</p>
              <div className={styles.kpiValueRow}>
                <span className={styles.kpiValue}>{displayedStats.vehicles}</span>
                <span className={styles.kpiSubtext}>modèles</span>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <div className={styles.kpiIconWrapper} style={{ background: '#f1f5f9', color: '#0b2a4a' }}>
                  <svg className={styles.kpiIcon} viewBox="0 0 24 24">
                    <path d="M18 6h-2c0-2.21-1.79-4-4-4S8 3.79 8 6H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6-2c1.1 0 2 .9 2 2h-4c0-1.1.9-2 2-2zm6 16H6V8h2v2c0 .55.45 1 1 1s1-.45 1-1V8h4v2c0 .55.45 1 1 1s1-.45 1-1V8h2v12z" />
                  </svg>
                </div>
                <span className={`${styles.kpiTrendBadge} ${styles.trendNeutral}`}>Stock</span>
              </div>
              <p className={styles.kpiTitle}>Produits</p>
              <div className={styles.kpiValueRow}>
                <span className={styles.kpiValue}>{displayedStats.products}</span>
                <span className={styles.kpiSubtext}>articles</span>
              </div>
            </div>
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
                  <svg className={styles.searchFilterIcon} viewBox="0 0 24 24">
                    <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                  </svg>
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
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                    <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
                  </svg>
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
                              <span className={styles.clientName}>{req.name || 'Client'}</span>
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
                              Consulter
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
