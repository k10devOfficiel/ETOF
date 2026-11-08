import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import adminApi from '../api/adminApi.js';
import Spinner from '../../components/ui/Spinner.jsx';
import Alert from '../../components/ui/Alert.jsx';
import RequestDetailModal from '../components/RequestDetailModal.jsx';
import styles from './DashboardPage.module.css';

/**
 * Libellés et styles de statut
 */
const STATUS_CONFIG = {
  new: { label: 'Nouvelle', className: styles.statusNew },
  in_progress: { label: 'En cours', className: styles.statusInProgress },
  confirmed: { label: 'Confirmée', className: styles.statusConfirmed },
  rejected: { label: 'Rejetée', className: styles.statusRejected },
  closed: { label: 'Clôturée', className: styles.statusClosed },
};

/**
 * Libellés pour les types de demande
 */
const TYPE_LABELS = {
  quote: 'Devis',
  order: 'Commande',
  reservation: 'Réservation',
  purchase: 'Achat direct',
  contact: 'Contact',
};

/**
 * Vue principale du tableau de bord administrateur.
 * Présente le nombre de demandes nouvelles, en cours et confirmées,
 * et la liste des 10 dernières demandes reçues avec consultation rapide.
 *
 * @returns {JSX.Element}
 */
export function DashboardPage() {
  const { admin } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fiche détaillée modal
  const [selectedRequestId, setSelectedRequestId] = useState(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsData, requestsData] = await Promise.all([
        adminApi.getStats(),
        adminApi.getRequests({ per_page: 10, sort_by: 'created_at', order: 'desc' }),
      ]);

      setStats(statsData);
      setRecentRequests(requestsData?.items || []);
    } catch (err) {
      setError('Impossible de charger les données du tableau de bord.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return (
    <div>
      <header className={styles.header}>
        <h1 className={styles.title}>Tableau de bord</h1>
        <p className={styles.subtitle}>
          Bienvenue, {admin?.name || 'Administrateur'}. Suivi des indicateurs clés et des demandes reçues.
        </p>
      </header>

      {error && (
        <div style={{ marginBottom: '1.5rem' }}>
          <Alert variant="danger">{error}</Alert>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '3.5rem', textAlign: 'center' }}>
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* Grille des statistiques de demandes */}
          <section className={styles.statsGrid}>
            {/* Nouvelles demandes */}
            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <span className={styles.statLabel}>Nouvelles demandes</span>
                <svg className={styles.statIcon} viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z" />
                </svg>
              </div>
              <span className={styles.statValue} style={{ color: '#0284c7' }}>
                {stats?.by_status?.new ?? 0}
              </span>
            </div>

            {/* En cours */}
            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <span className={styles.statLabel}>En cours de traitement</span>
                <svg className={styles.statIcon} viewBox="0 0 24 24">
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                </svg>
              </div>
              <span className={styles.statValue} style={{ color: '#d97706' }}>
                {stats?.by_status?.in_progress ?? 0}
              </span>
            </div>

            {/* Confirmées */}
            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <span className={styles.statLabel}>Confirmées</span>
                <svg className={styles.statIcon} viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
              <span className={styles.statValue} style={{ color: '#16a34a' }}>
                {stats?.by_status?.confirmed ?? 0}
              </span>
            </div>

            {/* Total demandes */}
            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <span className={styles.statLabel}>Total des demandes</span>
                <svg className={styles.statIcon} viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                </svg>
              </div>
              <span className={styles.statValue}>
                {stats?.total ?? 0}
              </span>
            </div>
          </section>

          {/* Section 10 dernières demandes */}
          <section>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>10 dernières demandes</h2>
              <Link to="/admin/demandes" className={styles.viewAllLink}>
                Voir toutes les demandes →
              </Link>
            </div>

            <div className={styles.tableContainer}>
              {recentRequests.length === 0 ? (
                <div className={styles.emptyNotice}>
                  Aucune demande enregistrée pour le moment.
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.th}>Référence</th>
                      <th className={styles.th}>Date</th>
                      <th className={styles.th}>Type</th>
                      <th className={styles.th}>Client</th>
                      <th className={styles.th}>Statut</th>
                      <th className={styles.th} style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentRequests.map((req) => {
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
                            <span className={styles.refCode}>{req.reference || `#${req.id}`}</span>
                          </td>
                          <td className={styles.td}>
                            {req.created_at
                              ? new Date(req.created_at).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '-'}
                          </td>
                          <td className={styles.td}>
                            <strong>{TYPE_LABELS[req.type] || req.type || 'Général'}</strong>
                          </td>
                          <td className={styles.td}>
                            <div className={styles.clientName}>{req.name || 'Client sans nom'}</div>
                            <div className={styles.clientContact}>
                              {req.email || req.phone || '-'}
                            </div>
                          </td>
                          <td className={styles.td}>
                            <span className={`${styles.statusBadge} ${statusMeta.className}`}>
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
          </section>

          {/* État du système */}
          <section className={styles.card}>
            <h2 className={styles.sectionTitle} style={{ marginBottom: '0.5rem' }}>État du système</h2>
            <p style={{ color: '#475569', fontSize: '0.9rem', margin: '0 0 1rem 0' }}>
              Base de données connectée. Authentification administrateur avec renouvellement automatique du jeton CSRF.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.85rem', color: '#64748b' }}>
              <span>Dernière connexion : {admin?.last_login_at ? new Date(admin.last_login_at).toLocaleString('fr-FR') : 'Session courante'}</span>
              <span>•</span>
              <span>Compte : {admin?.email}</span>
            </div>
          </section>
        </>
      )}

      {/* Fiche détaillée de la demande (Modal) */}
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
