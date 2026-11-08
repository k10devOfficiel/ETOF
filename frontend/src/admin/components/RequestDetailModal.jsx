import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import Alert from '../../components/ui/Alert.jsx';
import ConfirmModal from './ConfirmModal.jsx';
import adminApi from '../api/adminApi.js';
import styles from './RequestDetailModal.module.css';

/**
 * Nettoie une chaîne de numéro de téléphone pour constituer une URL WhatsApp internationale.
 *
 * @param {string} phone
 * @returns {string}
 */
function sanitizePhone(phone) {
  if (!phone) return '';
  return phone.replace(/[^0-9]/g, '');
}

/**
 * Fiche détaillée complète d'une demande client.
 * Affiche les coordonnées cliquables (appel, WhatsApp, e-mail), le détail des articles
 * avec prix mémorisés, le véhicule et les dates de réservation, la note interne modifiable
 * et la gestion des statuts avec case « Marquer le véhicule comme réservé ».
 *
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   requestId: number | null,
 *   onUpdated: () => void
 * }} props
 * @returns {JSX.Element | null}
 */
export function RequestDetailModal({ isOpen, onClose, requestId, onUpdated }) {
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Note interne modifiable
  const [internalNote, setInternalNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Changement de statut et confirmation
  const [pendingStatus, setPendingStatus] = useState(null);
  const [markVehicleReserved, setMarkVehicleReserved] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const loadDetail = async () => {
    if (!requestId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getRequest(requestId);
      setRequest(data);
      setInternalNote(data?.internal_note || '');
    } catch (err) {
      setError('Impossible de charger le détail de la demande.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && requestId) {
      loadDetail();
      setSuccessMessage(null);
      setPendingStatus(null);
    }
  }, [isOpen, requestId]);

  if (!isOpen) return null;

  // Sauvegarde de la note interne
  const handleSaveNote = async (e) => {
    e.preventDefault();
    try {
      setSavingNote(true);
      setError(null);
      await adminApi.updateRequest(requestId, {
        internal_note: internalNote.trim() || null,
      });
      setSuccessMessage('Note interne enregistrée.');
      setTimeout(() => setSuccessMessage(null), 3000);
      onUpdated();
    } catch (err) {
      setError('Erreur lors de la sauvegarde de la note interne.');
    } finally {
      setSavingNote(false);
    }
  };

  // Demande de confirmation de statut
  const promptStatusChange = (status) => {
    if (status === request?.status) return;
    setPendingStatus(status);
  };

  // Exécution du changement de statut confirmé
  const handleConfirmStatusChange = async () => {
    if (!pendingStatus || !requestId) return;

    try {
      setIsUpdatingStatus(true);
      setError(null);

      const payload = {
        status: pendingStatus,
        internal_note: internalNote.trim() || null,
      };

      // Case "Marquer le véhicule comme réservé" pour les réservations confirmées
      if (pendingStatus === 'confirmed' && request?.type === 'reservation') {
        payload.update_vehicle = Boolean(markVehicleReserved);
      }

      await adminApi.updateRequest(requestId, payload);

      setSuccessMessage(
        `Statut mis à jour avec succès : ${getStatusLabel(pendingStatus)}.${
          payload.update_vehicle ? ' Le véhicule a été passé en statut Réservé sur le site public.' : ''
        }`
      );
      setPendingStatus(null);
      await loadDetail();
      onUpdated();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setError('Erreur lors de la mise à jour du statut.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusLabel = (st) => {
    switch (st) {
      case 'new':
        return 'Nouvelle';
      case 'in_progress':
        return 'En cours';
      case 'confirmed':
        return 'Confirmée';
      case 'rejected':
        return 'Refusée';
      case 'closed':
        return 'Clôturée';
      default:
        return st;
    }
  };

  const getStatusBadgeVariant = (st) => {
    switch (st) {
      case 'confirmed':
        return 'available';
      case 'in_progress':
        return 'reserved';
      case 'rejected':
      case 'closed':
        return 'sold';
      default:
        return 'default';
    }
  };

  const cleanPhone = sanitizePhone(request?.phone);
  const items = request?.items || [];
  const hasVehicle = Boolean(request?.vehicle || request?.vehicle_id);

  // Calcul du total des articles mémorisés
  let totalOrder = 0;
  let hasPricedItems = false;
  items.forEach((it) => {
    if (it.unit_price) {
      totalOrder += it.unit_price * it.quantity;
      hasPricedItems = true;
    }
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={request ? `Fiche Demande : ${request.reference}` : 'Détail de la demande'}
      size="lg"
    >
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <Spinner size="lg" />
        </div>
      ) : error && !request ? (
        <Alert variant="danger">{error}</Alert>
      ) : request ? (
        <div className={styles.container}>
          {successMessage && <Alert variant="success">{successMessage}</Alert>}
          {error && <Alert variant="danger">{error}</Alert>}

          {/* En-tête : Référence, Type & Statut actuel */}
          <div className={styles.headerRow}>
            <div>
              <span className={styles.reference}>{request.reference}</span>
              <div style={{ fontSize: '0.825rem', color: '#64748b', marginTop: '0.2rem' }}>
                Reçue le {new Date(request.created_at).toLocaleString('fr-FR')} • Langue : {request.lang?.toUpperCase()}
              </div>
            </div>

            <div className={styles.badges}>
              <Badge variant="default">{request.type?.toUpperCase()}</Badge>
              <Badge variant="default">{request.activity?.toUpperCase()}</Badge>
              <Badge variant={getStatusBadgeVariant(request.status)}>
                {getStatusLabel(request.status)}
              </Badge>
            </div>
          </div>

          {/* Coordonnées client avec liens cliquables */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
              Coordonnées du Client
            </h2>

            <div className={styles.contactGrid}>
              <div className={styles.contactItem}>
                <span className={styles.contactLabel}>Nom complet</span>
                <span className={styles.contactValue}>{request.full_name || request.name}</span>
                {request.company && (
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Société : {request.company}</span>
                )}
              </div>

              <div className={styles.contactItem}>
                <span className={styles.contactLabel}>Téléphone</span>
                <a href={`tel:${cleanPhone}`} className={styles.linkAction}>
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                  </svg>
                  Appeler : {request.phone}
                </a>
                {cleanPhone && (
                  <a
                    href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                      `Bonjour ${request.full_name}, nous revenons vers vous concernant votre demande ${request.reference} chez ETOF SARL.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${styles.linkAction} ${styles.whatsappLink}`}
                    style={{ marginTop: '0.2rem' }}
                  >
                    💬 WhatsApp Direct
                  </a>
                )}
              </div>

              <div className={styles.contactItem}>
                <span className={styles.contactLabel}>Adresse e-mail</span>
                <a href={`mailto:${request.email}?subject=${encodeURIComponent(`ETOF SARL - Demande ${request.reference}`)}`} className={styles.linkAction}>
                  ✉️ {request.email}
                </a>
              </div>
            </div>
          </section>

          {/* Véhicule & Dates de réservation (si applicable) */}
          {hasVehicle && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                🚗 Véhicule et Période Souhaitée
              </h2>

              <div className={styles.vehicleBox}>
                <div>
                  <strong>
                    {request.vehicle?.brand} {request.vehicle?.model} {request.vehicle?.year ? `(${request.vehicle.year})` : ''}
                  </strong>
                  <div style={{ fontSize: '0.825rem', color: '#64748b', marginTop: '0.2rem' }}>
                    Statut actuel du véhicule : <Badge variant={getStatusBadgeVariant(request.vehicle?.status)}>{request.vehicle?.status || 'available'}</Badge>
                  </div>
                </div>

                <div style={{ fontSize: '0.9rem', color: '#334155' }}>
                  {request.start_date ? (
                    <span>Du <strong>{request.start_date}</strong> au <strong>{request.end_date || 'Date indéfinie'}</strong></span>
                  ) : (
                    <span>Dates à convenir</span>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Lignes de commande avec prix mémorisés (snapshots) */}
          {items.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                📦 Articles Commandés (Prix figés)
              </h2>

              <table className={styles.itemsTable}>
                <thead>
                  <tr>
                    <th>Article</th>
                    <th>Quantité</th>
                    <th>Prix unitaire figé</th>
                    <th style={{ textAlign: 'right' }}>Total ligne</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => {
                    const lineTotal = it.unit_price ? it.unit_price * it.quantity : null;
                    return (
                      <tr key={it.id}>
                        <td><strong>{it.label}</strong></td>
                        <td>{it.quantity}</td>
                        <td>{it.unit_price ? `${Number(it.unit_price).toLocaleString('fr-FR')} FCFA` : 'Sur demande'}</td>
                        <td style={{ textAlign: 'right' }}>
                          {lineTotal ? <strong>{Number(lineTotal).toLocaleString('fr-FR')} FCFA</strong> : '-'}
                        </td>
                      </tr>
                    );
                  })}
                  {hasPricedItems && (
                    <tr className={styles.totalRow}>
                      <td colSpan={3}>Total estimatif de la commande :</td>
                      <td style={{ textAlign: 'right' }}>{Number(totalOrder).toLocaleString('fr-FR')} FCFA</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>
          )}

          {/* Message du client & détails complémentaires */}
          {request.message && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>📝 Message du Client</h2>
              <p style={{ margin: 0, whiteSpace: 'pre-line', color: '#334155', fontSize: '0.9rem', lineHeight: 1.6 }}>
                {request.message}
              </p>
            </section>
          )}

          {/* Note interne modifiable */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>🔒 Note Interne (Réservée à l'équipe)</h2>
            <form onSubmit={handleSaveNote} className={styles.noteForm}>
              <textarea
                className={styles.noteTextarea}
                placeholder="Ajoutez des commentaires internes (suivi commercial, accords verbaux, relances)..."
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button type="submit" variant="outline" size="sm" disabled={savingNote}>
                  {savingNote ? 'Enregistrement...' : 'Enregistrer la note interne'}
                </Button>
              </div>
            </form>
          </section>

          {/* Changement de statut avec confirmation et case véhicule */}
          <section className={styles.statusActions}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>
              Modifier l'état de traitement de la demande :
            </span>

            <div className={styles.statusButtons}>
              <button
                type="button"
                className={`${styles.statusBtn} ${styles.btnNew} ${request.status === 'new' ? styles.statusBtnActive : ''}`}
                onClick={() => promptStatusChange('new')}
              >
                Nouvelle
              </button>

              <button
                type="button"
                className={`${styles.statusBtn} ${styles.btnInProgress} ${request.status === 'in_progress' ? styles.statusBtnActive : ''}`}
                onClick={() => promptStatusChange('in_progress')}
              >
                En cours
              </button>

              <button
                type="button"
                className={`${styles.statusBtn} ${styles.btnConfirmed} ${request.status === 'confirmed' ? styles.statusBtnActive : ''}`}
                onClick={() => promptStatusChange('confirmed')}
              >
                ✓ Confirmer la demande
              </button>

              <button
                type="button"
                className={`${styles.statusBtn} ${styles.btnRejected} ${request.status === 'rejected' ? styles.statusBtnActive : ''}`}
                onClick={() => promptStatusChange('rejected')}
              >
                Refuser
              </button>

              <button
                type="button"
                className={`${styles.statusBtn} ${styles.btnClose} ${request.status === 'closed' ? styles.statusBtnActive : ''}`}
                onClick={() => promptStatusChange('closed')}
              >
                Clôturer
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {/* Confirmation de changement de statut */}
      <ConfirmModal
        isOpen={Boolean(pendingStatus)}
        onClose={() => setPendingStatus(null)}
        onConfirm={handleConfirmStatusChange}
        title={`Changer le statut en : ${getStatusLabel(pendingStatus)}`}
        message={`Confirmez-vous le passage de la demande ${request?.reference} au statut « ${getStatusLabel(pendingStatus)} » ?`}
        confirmLabel="Confirmer le statut"
        isProcessing={isUpdatingStatus}
      >
        {pendingStatus === 'confirmed' && hasVehicle && (
          <div style={{ marginTop: '1rem' }}>
            <label className={styles.checkboxVehicle}>
              <input
                type="checkbox"
                checked={markVehicleReserved}
                onChange={(e) => setMarkVehicleReserved(e.target.checked)}
              />
              <span>Marquer immédiatement le véhicule comme Réservé sur le site public</span>
            </label>
          </div>
        )}
      </ConfirmModal>
    </Modal>
  );
}

export default RequestDetailModal;

