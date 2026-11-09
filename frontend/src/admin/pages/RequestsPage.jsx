import React, { useState, useEffect, useCallback } from 'react';
import adminApi from '../api/adminApi.js';
import Spinner from '../../components/ui/Spinner.jsx';
import Alert from '../../components/ui/Alert.jsx';
import RequestDetailModal from '../components/RequestDetailModal.jsx';
import styles from './RequestsPage.module.css';

/**
 * Libellés et badges pour les statuts
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
 * Libellés pour les activités
 */
const ACTIVITY_LABELS = {
  farm: 'Ferme & Élevage',
  vehicle: 'Véhicules',
  office: 'Fournitures',
  fuel: 'Hydrocarbures',
  general: 'Général',
};

/**
 * Écran de gestion des demandes clients.
 * Propose une liste filtrable, recherche textuelle, tri par date, pagination,
 * export CSV et ouverture de la fiche détaillée avec mise à jour du statut.
 *
 * @returns {JSX.Element}
 */
export function RequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Filtres
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [activityFilter, setActivityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Tri & Pagination
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' ou 'asc'
  const [page, setPage] = useState(1);
  const [perPage] = useState(15);
  const [totalCount, setTotalCount] = useState(0);

  // Fiche détaillée modal
  const [selectedRequestId, setSelectedRequestId] = useState(null);

  // Construction des paramètres de requête
  const buildQueryParams = useCallback(() => {
    const params = {
      page,
      per_page: perPage,
      sort_by: 'created_at',
      order: sortOrder,
    };

    if (search.trim()) params.q = search.trim();
    if (typeFilter) params.type = typeFilter;
    if (activityFilter) params.activity = activityFilter;
    if (statusFilter) params.status = statusFilter;
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;

    return params;
  }, [page, perPage, sortOrder, search, typeFilter, activityFilter, statusFilter, dateFrom, dateTo]);

  // Chargement des demandes avec option silencieuse pour l'arrière-plan
  const loadRequests = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      setError(null);
      const params = buildQueryParams();
      const res = await adminApi.getRequests(params);

      setRequests(res?.items || []);
      setTotalCount(res?.total || 0);
    } catch {
      if (!silent) {
        setError('Impossible de charger la liste des demandes clients.');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [buildQueryParams]);

  useEffect(() => {
    loadRequests();

    // Actualisation silencieuse quasi temps réel (toutes les 3,5 secondes)
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadRequests(true);
      }
    }, 3500);

    // Écoute des événements temps réel (même onglet et cross-onglets)
    const handleSyncEvent = () => {
      loadRequests(true);
    };

    window.addEventListener('etof:new-request-received', handleSyncEvent);
    window.addEventListener('etof:new-request-submitted', handleSyncEvent);
    window.addEventListener('etof:request-cancelled', handleSyncEvent);

    let bc = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel('etof_orders_sync');
        bc.onmessage = () => {
          loadRequests(true);
        };
      } catch {
        // Ignorer si indisponible
      }
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('etof:new-request-received', handleSyncEvent);
      window.removeEventListener('etof:new-request-submitted', handleSyncEvent);
      window.removeEventListener('etof:request-cancelled', handleSyncEvent);
      if (bc) {
        try {
          bc.close();
        } catch {}
      }
    };
  }, [loadRequests]);

  // Réinitialisation des filtres
  const handleResetFilters = () => {
    setSearch('');
    setTypeFilter('');
    setActivityFilter('');
    setStatusFilter('');
    setDateFrom('');
    setDateTo('');
    setSortOrder('desc');
    setPage(1);
  };

  // Bascule du tri par date
  const handleToggleSort = () => {
    setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    setPage(1);
  };

  // Export CSV avec les filtres actifs
  const handleExportCsv = async () => {
    try {
      setExportLoading(true);
      setError(null);

      // Mêmes filtres que la liste actuelle sans pagination
      const exportParams = {};
      if (search.trim()) exportParams.q = search.trim();
      if (typeFilter) exportParams.type = typeFilter;
      if (activityFilter) exportParams.activity = activityFilter;
      if (statusFilter) exportParams.status = statusFilter;
      if (dateFrom) exportParams.date_from = dateFrom;
      if (dateTo) exportParams.date_to = dateTo;
      exportParams.sort_by = 'created_at';
      exportParams.order = sortOrder;

      await adminApi.downloadRequestsCsv(exportParams);
      setSuccessMessage('Export CSV téléchargé avec succès.');
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err) {
      setError("Échec lors du téléchargement de l'export CSV.");
    } finally {
      setExportLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / perPage) || 1;

  return (
    <div>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Demandes Clients</h1>
          <p className={styles.subtitle}>
            Suivi des devis, commandes directes, réservations de véhicules et messages de contact.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          disabled={exportLoading}
          className={styles.exportBtn}
          title="Exporter la sélection courante en fichier CSV"
        >
          {exportLoading ? (
            <Spinner size="sm" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
            </svg>
          )}
          <span>{exportLoading ? 'Génération…' : 'Exporter en CSV'}</span>
        </button>
      </header>

      {successMessage && (
        <div style={{ marginBottom: '1.25rem' }}>
          <Alert variant="success">{successMessage}</Alert>
        </div>
      )}

      {error && (
        <div style={{ marginBottom: '1.25rem' }}>
          <Alert variant="danger">{error}</Alert>
        </div>
      )}

      {/* Barre de filtres multi-critères */}
      <section className={styles.filtersCard}>
        <div className={styles.filtersGrid}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel} htmlFor="req-search">Recherche</label>
            <input
              id="req-search"
              type="text"
              placeholder="Nom, e-mail, référence…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className={styles.filterInput}
            />
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel} htmlFor="req-type">Type</label>
            <select
              id="req-type"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className={styles.filterSelect}
            >
              <option value="">Tous les types</option>
              <option value="quote">Devis</option>
              <option value="order">Commande</option>
              <option value="reservation">Réservation</option>
              <option value="purchase">Achat direct</option>
              <option value="contact">Contact</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel} htmlFor="req-activity">Activité</label>
            <select
              id="req-activity"
              value={activityFilter}
              onChange={(e) => {
                setActivityFilter(e.target.value);
                setPage(1);
              }}
              className={styles.filterSelect}
            >
              <option value="">Toutes les activités</option>
              <option value="farm">Ferme & Élevage</option>
              <option value="vehicle">Véhicules</option>
              <option value="office">Fournitures</option>
              <option value="fuel">Hydrocarbures</option>
              <option value="general">Général</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel} htmlFor="req-status">Statut</label>
            <select
              id="req-status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className={styles.filterSelect}
            >
              <option value="">Tous les statuts</option>
              <option value="new">Nouvelle</option>
              <option value="in_progress">En cours</option>
              <option value="confirmed">Confirmée</option>
              <option value="rejected">Rejetée</option>
              <option value="closed">Clôturée</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel} htmlFor="req-date-from">Du</label>
            <input
              id="req-date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className={styles.filterInput}
            />
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel} htmlFor="req-date-to">Au</label>
            <input
              id="req-date-to"
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className={styles.filterInput}
            />
          </div>

          <button
            type="button"
            onClick={handleResetFilters}
            className={styles.resetBtn}
            title="Réinitialiser tous les filtres"
          >
            Réinitialiser
          </button>
        </div>
      </section>

      {/* Méta-informations & contrôle de tri */}
      <div className={styles.tableHeaderMeta}>
        <div>
          {totalCount} {totalCount > 1 ? 'demandes trouvées' : 'demande trouvée'}
        </div>

        <button
          type="button"
          onClick={handleToggleSort}
          className={styles.sortToggle}
          title="Inverser l'ordre de tri chronologique"
        >
          <span>Date : {sortOrder === 'desc' ? 'Plus récentes en premier' : 'Plus anciennes en premier'}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            {sortOrder === 'desc' ? (
              <path d="M7 10l5 5 5-5z" />
            ) : (
              <path d="M7 14l5-5 5 5z" />
            )}
          </svg>
        </button>
      </div>

      {/* Table des résultats */}
      {loading ? (
        <div style={{ padding: '3.5rem', textAlign: 'center' }}>
          <Spinner size="lg" />
        </div>
      ) : requests.length === 0 ? (
        <div className={styles.tableContainer}>
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>Aucune demande correspondante</p>
            <p>Modifiez vos filtres ou réinitialisez la recherche pour voir d'autres résultats.</p>
          </div>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Référence</th>
                <th className={styles.th}>Date</th>
                <th className={styles.th}>Type</th>
                <th className={styles.th}>Activité</th>
                <th className={styles.th}>Client</th>
                <th className={styles.th}>Statut</th>
                <th className={styles.th} style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => {
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
                      {ACTIVITY_LABELS[req.activity] || req.activity || '-'}
                    </td>
                    <td className={styles.td}>
                      <div className={styles.clientName}>{req.name || 'Client sans nom'}</div>
                      <div className={styles.clientMeta}>
                        {req.email && <span>{req.email}</span>}
                        {req.email && req.phone && <span> • </span>}
                        {req.phone && <span>{req.phone}</span>}
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

          {/* Pagination */}
          <div className={styles.pagination}>
            <div className={styles.pageInfo}>
              Page {page} sur {totalPages} ({totalCount} au total)
            </div>
            <div className={styles.pageButtons}>
              <button
                type="button"
                className={styles.pageBtn}
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Précédent
              </button>
              <button
                type="button"
                className={styles.pageBtn}
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Suivant
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fiche détaillée de la demande (Modal) */}
      {selectedRequestId && (
        <RequestDetailModal
          isOpen={Boolean(selectedRequestId)}
          requestId={selectedRequestId}
          onClose={() => setSelectedRequestId(null)}
          onUpdated={loadRequests}
        />
      )}
    </div>
  );
}

export default RequestsPage;
