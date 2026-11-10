import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import adminApi from '../api/adminApi.js';
import Spinner from '../../components/ui/Spinner.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Icon from '../../components/common/Icon.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
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
  cancelled: { label: 'Annulée par client', className: styles.statusRejected },
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

  const [searchParams, setSearchParams] = useSearchParams();
  const urlActivity = searchParams.get('activity') || '';
  const urlQ = searchParams.get('q') || '';

  // Filtres
  const [search, setSearch] = useState(urlQ);
  const [typeFilter, setTypeFilter] = useState('');
  const [activityFilter, setActivityFilter] = useState(urlActivity);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Synchronisation avec l'URL si elle change (ex. clic sur le menu latéral)
  useEffect(() => {
    const act = searchParams.get('activity') || '';
    const q = searchParams.get('q') || '';
    setActivityFilter(act);
    if (q) setSearch(q);
    setPage(1);
  }, [searchParams]);

  // Tri & Pagination
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' ou 'asc'
  const [page, setPage] = useState(1);
  const [perPage] = useState(15);
  const [totalCount, setTotalCount] = useState(0);

  // Fiche détaillée modal
  const [selectedRequestId, setSelectedRequestId] = useState(null);

  // Sélection multiple pour actions groupées (CRUD Batch)
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isConfirmBatchDeleteOpen, setIsConfirmBatchDeleteOpen] = useState(false);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [singleDeleteId, setSingleDeleteId] = useState(null);
  const [isProcessingSingleDelete, setIsProcessingSingleDelete] = useState(false);

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === requests.length && requests.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(requests.map((r) => r.id)));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    try {
      setIsProcessingBatch(true);
      setError(null);
      const res = await adminApi.batchDeleteRequests(Array.from(selectedIds));
      setSuccessMessage(res?.message || 'Demandes sélectionnées supprimées.');
      setSelectedIds(new Set());
      setIsConfirmBatchDeleteOpen(false);
      loadRequests();
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err) {
      setError(err?.message || 'Erreur lors de la suppression groupée.');
    } finally {
      setIsProcessingBatch(false);
    }
  };

  const handleBatchStatus = async (status) => {
    if (selectedIds.size === 0 || !status) return;
    try {
      setIsProcessingBatch(true);
      setError(null);
      const res = await adminApi.batchUpdateRequestStatus(Array.from(selectedIds), status);
      setSuccessMessage(res?.message || 'Statut mis à jour pour la sélection.');
      setSelectedIds(new Set());
      loadRequests();
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err) {
      setError(err?.message || 'Erreur lors de la mise à jour groupée.');
    } finally {
      setIsProcessingBatch(false);
    }
  };

  const handleConfirmSingleDelete = async () => {
    if (!singleDeleteId) return;
    try {
      setIsProcessingSingleDelete(true);
      setError(null);
      await adminApi.deleteRequest(singleDeleteId);
      setSuccessMessage('Demande supprimée avec succès.');
      setSingleDeleteId(null);
      loadRequests();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err?.message || 'Erreur lors de la suppression.');
    } finally {
      setIsProcessingSingleDelete(false);
    }
  };

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

      {/* Sélecteur instantané des 4 Pôles d'Activités */}
      <div className={styles.activityTabs} role="tablist" aria-label="Filtrer les demandes par pôle">
        <button
          type="button"
          className={`${styles.activityTabBtn} ${activityFilter === '' ? styles.activityTabBtnActive : ''}`}
          onClick={() => {
            setActivityFilter('');
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev);
              next.delete('activity');
              return next;
            });
            setPage(1);
          }}
        >
          Tous les pôles
        </button>
        <button
          type="button"
          className={`${styles.activityTabBtn} ${activityFilter === 'farm' ? styles.activityTabBtnActive : ''}`}
          onClick={() => {
            setActivityFilter('farm');
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev);
              next.set('activity', 'farm');
              return next;
            });
            setPage(1);
          }}
        >
          <i className="fa-solid fa-feather-pointed" style={{ marginRight: '6px' }} />
          <span>Ferme & Volaille</span>
        </button>
        <button
          type="button"
          className={`${styles.activityTabBtn} ${activityFilter === 'vehicle' ? styles.activityTabBtnActive : ''}`}
          onClick={() => {
            setActivityFilter('vehicle');
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev);
              next.set('activity', 'vehicle');
              return next;
            });
            setPage(1);
          }}
        >
          <i className="fa-solid fa-car" style={{ marginRight: '6px' }} />
          <span>Vente & Location Voitures</span>
        </button>
        <button
          type="button"
          className={`${styles.activityTabBtn} ${activityFilter === 'office' ? styles.activityTabBtnActive : ''}`}
          onClick={() => {
            setActivityFilter('office');
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev);
              next.set('activity', 'office');
              return next;
            });
            setPage(1);
          }}
        >
          <i className="fa-solid fa-briefcase" style={{ marginRight: '6px' }} />
          <span>Fournitures de Bureau</span>
        </button>
        <button
          type="button"
          className={`${styles.activityTabBtn} ${activityFilter === 'fuel' ? styles.activityTabBtnActive : ''}`}
          onClick={() => {
            setActivityFilter('fuel');
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev);
              next.set('activity', 'fuel');
              return next;
            });
            setPage(1);
          }}
        >
          <i className="fa-solid fa-gas-pump" style={{ marginRight: '6px' }} />
          <span>Transport Hydrocarbures</span>
        </button>
      </div>

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
              <option value="cancelled">Annulée par client</option>
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
          {/* Barre d'actions groupées (CRUD Batch) */}
          {selectedIds.size > 0 && (
            <div className={styles.batchBar}>
              <div className={styles.batchInfo}>
                <Icon name="check-double" size={16} />
                <span style={{ marginLeft: '6px' }}>{selectedIds.size} demande(s) sélectionnée(s)</span>
              </div>
              <div className={styles.batchActions}>
                <select
                  className={styles.batchSelect}
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      handleBatchStatus(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  disabled={isProcessingBatch}
                >
                  <option value="" disabled>Changer statut en...</option>
                  <option value="confirmed">Confirmée</option>
                  <option value="in_progress">En cours</option>
                  <option value="closed">Clôturée</option>
                  <option value="rejected">Rejetée</option>
                </select>

                <button
                  type="button"
                  className={styles.batchDeleteBtn}
                  onClick={() => setIsConfirmBatchDeleteOpen(true)}
                  disabled={isProcessingBatch}
                >
                  <Icon name="trash" size={14} />
                  <span>Supprimer la sélection</span>
                </button>

                <button
                  type="button"
                  className={styles.batchClearBtn}
                  onClick={() => setSelectedIds(new Set())}
                >
                  Désélectionner
                </button>
              </div>
            </div>
          )}

          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.checkboxTh}>
                  <input
                    type="checkbox"
                    aria-label="Sélectionner toutes les demandes"
                    checked={requests.length > 0 && selectedIds.size === requests.length}
                    onChange={handleToggleSelectAll}
                  />
                </th>
                <th className={styles.th}>Référence</th>
                <th className={styles.th}>Date</th>
                <th className={styles.th}>Type</th>
                <th className={styles.th}>Activité</th>
                <th className={styles.th}>Client</th>
                <th className={styles.th}>Statut</th>
                <th className={styles.th} style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => {
                const statusMeta = STATUS_CONFIG[req.status] || {
                  label: req.status,
                  className: styles.statusClosed,
                };
                const isSelected = selectedIds.has(req.id);

                return (
                  <tr
                    key={req.id}
                    className={`${styles.tr} ${isSelected ? styles.selectedRow : ''}`}
                    onClick={() => setSelectedRequestId(req.id)}
                  >
                    <td className={styles.checkboxTd} onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        aria-label={`Sélectionner la demande ${req.reference || req.id}`}
                        checked={isSelected}
                        onChange={() => handleToggleSelect(req.id)}
                      />
                    </td>
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
                    <td className={styles.td} style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRequestId(req.id);
                        }}
                      >
                        Consulter / Éditer
                      </button>
                      <button
                        type="button"
                        className={styles.deleteBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSingleDeleteId(req.id);
                        }}
                        title="Supprimer la demande"
                      >
                        <Icon name="trash" size={13} />
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

      {/* Confirmation de suppression unitaire */}
      <ConfirmModal
        isOpen={Boolean(singleDeleteId)}
        onClose={() => setSingleDeleteId(null)}
        onConfirm={handleConfirmSingleDelete}
        title="Supprimer la demande"
        message="Êtes-vous sûr de vouloir supprimer cette demande ? Cette action effacera également tous les articles commandés qui y sont associés."
        confirmLabel="Supprimer définitivement"
        isProcessing={isProcessingSingleDelete}
      />

      {/* Confirmation de suppression groupée */}
      <ConfirmModal
        isOpen={isConfirmBatchDeleteOpen}
        onClose={() => setIsConfirmBatchDeleteOpen(false)}
        onConfirm={handleBatchDelete}
        title="Suppression groupée"
        message={`Confirmez-vous la suppression définitive des ${selectedIds.size} demandes sélectionnées ? Cette opération est irréversible.`}
        confirmLabel={`Supprimer les ${selectedIds.size} demandes`}
        isProcessing={isProcessingBatch}
      />
    </div>
  );
}

export default RequestsPage;
