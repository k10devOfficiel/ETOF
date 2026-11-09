import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import adminApi from '../api/adminApi.js';
import Spinner from '../../components/ui/Spinner.jsx';
import Alert from '../../components/ui/Alert.jsx';
import RequestDetailModal from '../components/RequestDetailModal.jsx';
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
  farm: 'Ferme & Élevage',
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

  // Filtre du graphique
  const [chartMetric, setChartMetric] = useState('all');
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Modal détaillée
  const [selectedRequestId, setSelectedRequestId] = useState(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsData, requestsData] = await Promise.all([
        adminApi.getStats(),
        adminApi.getRequests({ per_page: 8, sort_by: 'created_at', order: 'desc' }),
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

  // Données du graphique (7 derniers jours ou simulation dynamique)
  const chartData = useMemo(() => {
    if (stats?.daily_history && stats.daily_history.length > 0) {
      return stats.daily_history;
    }
    // Données par défaut sur 7 jours
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    return days.map((d, i) => ({
      label: d,
      count: [3, 5, 4, 8, 6, 7, 9][i] || 4,
    }));
  }, [stats]);

  // Calcul du tracé SVG pour la courbe spline
  const { pathD, areaD, points } = useMemo(() => {
    const width = 600;
    const height = 180;
    const padX = 30;
    const padY = 20;

    const maxVal = Math.max(...chartData.map((d) => d.count), 5);
    const stepX = (width - padX * 2) / Math.max(chartData.length - 1, 1);

    const pts = chartData.map((d, index) => {
      const x = padX + index * stepX;
      const y = height - padY - (d.count / maxVal) * (height - padY * 2);
      return { x, y, ...d };
    });

    if (pts.length === 0) {
      return { pathD: '', areaD: '', points: [] };
    }

    // Ligne courbe
    let dStr = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const mx = (p0.x + p1.x) / 2;
      dStr += ` C ${mx} ${p0.y}, ${mx} ${p1.y}, ${p1.x} ${p1.y}`;
    }

    // Aire sous la courbe
    const aStr = `${dStr} L ${pts[pts.length - 1].x} ${height} L ${pts[0].x} ${height} Z`;

    return { pathD: dStr, areaD: aStr, points: pts };
  }, [chartData]);

  // Filtrage des demandes par onglet
  const filteredRequests = useMemo(() => {
    if (selectedActivity === 'all') return recentRequests;
    return recentRequests.filter((r) => r.activity === selectedActivity);
  }, [recentRequests, selectedActivity]);

  const totalRequestsCount = stats?.total ?? 0;

  return (
    <div className={styles.container}>
      {/* En-tête : Titre & Onglets d'activité */}
      <div className={styles.headerRow}>
        <div className={styles.titleGroup}>
          <svg className={styles.titleIcon} viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
          </svg>
          <h1 className={styles.title}>Vue d’ensemble</h1>
        </div>

        <div className={styles.tabsList} role="tablist" aria-label="Filtrer par secteur">
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
            Ferme & Élevage
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${selectedActivity === 'vehicle' ? styles.activeTabBtn : ''}`}
            onClick={() => setSelectedActivity('vehicle')}
          >
            Véhicules
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${selectedActivity === 'office' ? styles.activeTabBtn : ''}`}
            onClick={() => setSelectedActivity('office')}
          >
            Fournitures
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${selectedActivity === 'fuel' ? styles.activeTabBtn : ''}`}
            onClick={() => setSelectedActivity('fuel')}
          >
            Hydrocarbures
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
          {/* Rangée des 6 KPIs (Identique au design buzzd) */}
          <section className={styles.kpiGrid} aria-label="Indicateurs clés de performance">
            {/* KPI 1 : Total Demandes */}
            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <div className={styles.kpiIconWrapper} style={{ background: '#e0f2fe', color: '#0369a1' }}>
                  <svg className={styles.kpiIcon} viewBox="0 0 24 24">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                  </svg>
                </div>
                <span className={`${styles.kpiTrendBadge} ${styles.trendPositive}`}>+8% ce mois</span>
              </div>
              <p className={styles.kpiTitle}>Total des Demandes</p>
              <div className={styles.kpiValueRow}>
                <span className={styles.kpiValue}>{totalRequestsCount}</span>
                <span className={styles.kpiSubtext}>enregistrées</span>
              </div>
            </div>

            {/* KPI 2 : Nouvelles Demandes */}
            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <div className={styles.kpiIconWrapper} style={{ background: '#cffafe', color: '#0891b2' }}>
                  <svg className={styles.kpiIcon} viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z" />
                  </svg>
                </div>
                <span className={`${styles.kpiTrendBadge} ${styles.trendHighlight}`}>À traiter</span>
              </div>
              <p className={styles.kpiTitle}>Nouvelles Demandes</p>
              <div className={styles.kpiValueRow}>
                <span className={styles.kpiValue} style={{ color: '#0284c7' }}>
                  {stats?.by_status?.new ?? 0}
                </span>
                <span className={styles.kpiSubtext}>en attente</span>
              </div>
            </div>

            {/* KPI 3 : En Cours de Traitement */}
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
                  {stats?.by_status?.in_progress ?? 0}
                </span>
                <span className={styles.kpiSubtext}>dossiers</span>
              </div>
            </div>

            {/* KPI 4 : Demandes Confirmées */}
            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <div className={styles.kpiIconWrapper} style={{ background: '#dcfce7', color: '#15803d' }}>
                  <svg className={styles.kpiIcon} viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
                <span className={`${styles.kpiTrendBadge} ${styles.trendPositive}`}>Validées</span>
              </div>
              <p className={styles.kpiTitle}>Confirmées</p>
              <div className={styles.kpiValueRow}>
                <span className={styles.kpiValue} style={{ color: '#15803d' }}>
                  {stats?.by_status?.confirmed ?? 0}
                </span>
                <span className={styles.kpiSubtext}>succès</span>
              </div>
            </div>

            {/* KPI 5 : Parc Automobile */}
            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <div className={styles.kpiIconWrapper} style={{ background: '#ede9fe', color: '#6d28d9' }}>
                  <svg className={styles.kpiIcon} viewBox="0 0 24 24">
                    <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
                  </svg>
                </div>
                <span className={`${styles.kpiTrendBadge} ${styles.trendNeutral}`}>Véhicules</span>
              </div>
              <p className={styles.kpiTitle}>Flotte Automobile</p>
              <div className={styles.kpiValueRow}>
                <span className={styles.kpiValue}>{stats?.vehicles_count ?? 6}</span>
                <span className={styles.kpiSubtext}>en catalogue</span>
              </div>
            </div>

            {/* KPI 6 : Produits Catalogue */}
            <div className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <div className={styles.kpiIconWrapper} style={{ background: '#f1f5f9', color: '#0b2a4a' }}>
                  <svg className={styles.kpiIcon} viewBox="0 0 24 24">
                    <path d="M18 6h-2c0-2.21-1.79-4-4-4S8 3.79 8 6H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6-2c1.1 0 2 .9 2 2h-4c0-1.1.9-2 2-2zm6 16H6V8h2v2c0 .55.45 1 1 1s1-.45 1-1V8h4v2c0 .55.45 1 1 1s1-.45 1-1V8h2v12z" />
                  </svg>
                </div>
                <span className={`${styles.kpiTrendBadge} ${styles.trendNeutral}`}>Articles</span>
              </div>
              <p className={styles.kpiTitle}>Produits Actifs</p>
              <div className={styles.kpiValueRow}>
                <span className={styles.kpiValue}>{stats?.products_count ?? 12}</span>
                <span className={styles.kpiSubtext}>articles</span>
              </div>
            </div>
          </section>

          {/* Grille Médiane : Graphique d'activité (65%) + Suivi des Pôles (35%) */}
          <div className={styles.middleGrid}>
            {/* Graphique interactif en aire SVG */}
            <div className={styles.chartCard}>
              <div className={styles.chartCardHeader}>
                <div className={styles.chartTitleGroup}>
                  <h2 className={styles.chartTitle}>Activité & Flux des Demandes</h2>
                  <p className={styles.chartSubtitle}>Évolution sur les 7 derniers jours</p>
                </div>

                <div className={styles.chartControls}>
                  <div className={styles.chartPillGroup}>
                    <button
                      type="button"
                      className={`${styles.chartPillBtn} ${chartMetric === 'all' ? styles.activeChartPill : ''}`}
                      onClick={() => setChartMetric('all')}
                    >
                      Toutes
                    </button>
                    <button
                      type="button"
                      className={`${styles.chartPillBtn} ${chartMetric === 'quotes' ? styles.activeChartPill : ''}`}
                      onClick={() => setChartMetric('quotes')}
                    >
                      Devis
                    </button>
                    <button
                      type="button"
                      className={`${styles.chartPillBtn} ${chartMetric === 'orders' ? styles.activeChartPill : ''}`}
                      onClick={() => setChartMetric('orders')}
                    >
                      Commandes
                    </button>
                  </div>
                </div>
              </div>

              {/* Rendu SVG spline de la courbe */}
              <div className={styles.chartSvgWrapper}>
                <svg className={styles.chartSvg} viewBox="0 0 600 200" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#14b8c4" stopOpacity="0.4" />
                      <stop offset="70%" stopColor="#0b2a4a" stopOpacity="0.08" />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Lignes de repère horizontales */}
                  <line x1="30" y1="40" x2="570" y2="40" stroke="#f1f5f9" strokeDasharray="3 3" />
                  <line x1="30" y1="90" x2="570" y2="90" stroke="#f1f5f9" strokeDasharray="3 3" />
                  <line x1="30" y1="140" x2="570" y2="140" stroke="#f1f5f9" strokeDasharray="3 3" />

                  {/* Aire sous la courbe */}
                  {areaD && <path d={areaD} fill="url(#chartGradient)" />}

                  {/* Ligne de courbe */}
                  {pathD && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#14b8c4"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  )}

                  {/* Points d'inflexion */}
                  {points.map((pt, idx) => (
                    <g key={idx}>
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={hoveredPoint === idx ? 6 : 4}
                        fill="#0b2a4a"
                        stroke="#ffffff"
                        strokeWidth="2"
                        style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
                        onMouseEnter={() => setHoveredPoint(idx)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                      {/* Libellé du jour */}
                      <text
                        x={pt.x}
                        y="190"
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize="11"
                        fontWeight="500"
                      >
                        {pt.label}
                      </text>
                    </g>
                  ))}
                </svg>

                {/* Bulle d'infobulle sur point survolé */}
                {hoveredPoint !== null && points[hoveredPoint] && (
                  <div
                    className={styles.chartTooltip}
                    style={{
                      left: `${(points[hoveredPoint].x / 600) * 100}%`,
                      top: `${(points[hoveredPoint].y / 200) * 100}%`,
                    }}
                  >
                    <span>{points[hoveredPoint].label} : {points[hoveredPoint].count} demande(s)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Carte Aperçu des 4 Pôles d'Activités (comme les Recent Campaigns) */}
            <div className={styles.activitiesCard}>
              <h2 className={styles.cardHeaderTitle}>Répartition par Pôle</h2>

              <div className={styles.activitiesList}>
                {['farm', 'vehicle', 'office', 'fuel'].map((actKey) => {
                  const count = stats?.by_activity?.[actKey] ?? 0;
                  const percent = totalRequestsCount > 0 ? Math.round((count / totalRequestsCount) * 100) : 25;
                  const color = ACTIVITY_COLORS[actKey];

                  return (
                    <div key={actKey} className={styles.activityRow}>
                      <div className={styles.activityInfo}>
                        <span className={styles.activityName}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
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
                            width: `${Math.max(percent, 8)}%`,
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

          {/* Section Inférieure : Dernières Demandes Reçues */}
          <div className={styles.bottomSection}>
            <div className={styles.bottomSectionHeader}>
              <h2 className={styles.cardHeaderTitle}>Dernières Demandes Clients</h2>
              <Link to={`${ADMIN_PATH}/demandes`} className={styles.viewAllLink}>
                <span>Accéder à toutes les demandes</span>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
                </svg>
              </Link>
            </div>

            <div className={styles.requestsTableWrapper}>
              {filteredRequests.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.9rem', padding: '1rem 0' }}>
                  Aucune demande enregistrée dans ce filtre.
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
                      <th className={styles.th} style={{ textAlign: 'right' }}>Détails</th>
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
