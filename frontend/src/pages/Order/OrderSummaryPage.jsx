import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Seo from '../../components/common/Seo.jsx';
import { useOrder } from '../../context/OrderContext.jsx';
import { useUserAuth } from '../../context/UserAuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { Container } from '../../components/ui/Container.jsx';
import Button from '../../components/ui/Button.jsx';
import { RequestForm } from '../../components/forms/RequestForm.jsx';
import { cancelRequest } from '../../api/requests.js';
import styles from './OrderSummaryPage.module.css';

/**
 * Formatage d'un montant monétaire en FCFA sans décimales.
 *
 * @param {number} amount
 * @returns {string}
 */
function formatPrice(amount) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(amount) + ' FCFA';
}

/**
 * Page de récapitulatif de commande multi-produits.
 * Après soumission, le panier reste conservé avec tous ses articles et affiche
 * la mention « Votre commande a été envoyée » avec sa référence et la possibilité
 * de modifier ou d'annuler/supprimer la commande en base immédiatement côté admin.
 *
 * @returns {JSX.Element}
 */
export function OrderSummaryPage() {
  const { t, i18n } = useTranslation();
  const { user } = useUserAuth();
  const { notifySuccess, notifyError } = useToast();
  const formSectionRef = useRef(null);

  const storageKey = user ? `etof_submitted_order_${user.id}` : 'etof_submitted_order_guest';

  const [submittedOrder, setSubmittedOrder] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isCancelling, setIsCancelling] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const {
    items,
    itemCount,
    totalQuantity,
    indicativeTotal,
    hasUnpricedItems,
    isEmpty,
    updateQuantity,
    removeItem,
    clearOrder,
  } = useOrder();

  // Synchronisation du localStorage lorsque la commande soumise change
  useEffect(() => {
    if (submittedOrder) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(submittedOrder));
      } catch {
        // Ignorer les erreurs éventuelles de quota localStorage
      }
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [submittedOrder, storageKey]);

  // Diffuse les événements en temps réel vers l'Admin sans rechargement
  const broadcastSync = (type, detail) => {
    try {
      window.dispatchEvent(new CustomEvent('etof:new-request-submitted', { detail }));
      window.dispatchEvent(new CustomEvent('etof:request-cancelled', { detail }));
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('etof_orders_sync');
        bc.postMessage({ type, detail });
        bc.close();
      }
    } catch {
      // Ignorer si indisponible
    }
  };

  // Annulation et suppression de la commande envoyée
  const handleCancelOrder = async () => {
    if (!submittedOrder) return;

    const confirmCancel = window.confirm(
      t('order.cancelConfirmQuestion', 'Êtes-vous certain de vouloir supprimer cette commande ? Vos articles resteront dans votre panier.')
    );
    if (!confirmCancel) return;

    setIsCancelling(true);
    try {
      await cancelRequest({
        id: submittedOrder.id,
        reference: submittedOrder.reference,
      });

      broadcastSync('order_deleted', { reference: submittedOrder.reference, id: submittedOrder.id });

      const oldRef = submittedOrder.reference;
      setSubmittedOrder(null);
      setIsEditing(false);

      notifySuccess(
        t('order.orderCancelledNotice', 'La commande a bien été supprimée. Vos articles sont toujours dans votre panier.')
      );
    } catch (err) {
      notifyError(err.message || 'Impossible de supprimer la commande.');
    } finally {
      setIsCancelling(false);
    }
  };

  // Clic sur "Modifier ma commande"
  const handleStartEditing = () => {
    setIsEditing(true);
    if (formSectionRef.current) {
      formSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Détection automatique de l'activité cible selon les articles du panier
  const detectedActivity = useMemo(() => {
    if (!items || items.length === 0) return 'farm';
    const firstWithAct = items.find((i) => i.activity || i.category?.activity);
    if (firstWithAct) {
      return firstWithAct.activity || firstWithAct.category?.activity;
    }
    return 'farm';
  }, [items]);

  return (
    <main className={styles.page}>
      <Seo
        title={`${t('order.pageTitle')} – ${t('common.siteName')}`}
        description={t('order.pageSubtitle')}
        path="/commande"
      />

      {/* En-tête / Bannière de prestige */}
      <section className={styles.hero} aria-labelledby="order-summary-title">
        <Container size="xl">
          <span className={styles.heroTag}>{t('order.metaTag')}</span>
          <h1 id="order-summary-title" className={styles.heroTitle}>
            {t('order.pageTitle')}
          </h1>
          <p className={styles.heroSubtitle}>{t('order.pageSubtitle')}</p>
        </Container>
      </section>

      <Container size="xl">
        {/* BANDEAU OFFICIEL QUAND UNE COMMANDE EST ENVOYÉE (PANIER PERSISTANT) */}
        {submittedOrder && (
          <section className={styles.submittedOrderBanner} role="status" aria-live="polite">
            <div className={styles.bannerContent}>
              <div className={styles.bannerIconWrapper} aria-hidden="true">
                <i className="fa-solid fa-circle-check" />
              </div>
              <div>
                <h2 className={styles.bannerTitle}>
                  {t('order.orderSentBannerTitle', 'Votre commande a été envoyée avec succès')}
                </h2>
                <p className={styles.bannerSubtitle}>
                  {t('order.orderSentBannerSubtitle', 'Nos équipes traitent votre demande en priorité. Vos articles restent mémorisés dans votre panier ci-dessous.')}
                </p>
                <div className={styles.bannerMeta}>
                  <span>{t('order.orderReferenceLabel', 'Réf. officielle')} :</span>
                  <span className={styles.refBadge}>{submittedOrder.reference}</span>
                  {submittedOrder.created_at && (
                    <span className={styles.dateBadge}>
                      • {new Date(submittedOrder.created_at).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.bannerActions}>
              <button
                type="button"
                className={styles.btnModify}
                onClick={handleStartEditing}
              >
                <i className="fa-solid fa-pen-to-square" aria-hidden="true" />
                <span>{t('order.btnModifyOrder', 'Modifier ma commande')}</span>
              </button>

              <button
                type="button"
                className={styles.btnCancel}
                onClick={handleCancelOrder}
                disabled={isCancelling}
              >
                <i className="fa-solid fa-trash-can" aria-hidden="true" />
                <span>{isCancelling ? t('common.loading', 'Suppression...') : t('order.btnCancelOrder', 'Supprimer la commande')}</span>
              </button>
            </div>
          </section>
        )}

        {isEmpty ? (
          /* État vide du récapitulatif */
          <div className={styles.emptyCard} role="status">
            <div className={styles.emptyIconWrapper} aria-hidden="true">
              <svg className={styles.emptyIcon} viewBox="0 0 24 24">
                <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            </div>
            <h2 className={styles.emptyTitle}>{t('order.emptyTitle')}</h2>
            <p className={styles.emptyDesc}>{t('order.emptyDesc')}</p>
            <Link to="/catalogue" style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="lg">
                {t('order.browseCatalog')}
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Grille principale : Articles à gauche, Synthèse à droite */}
            <div className={styles.layoutGrid}>
              {/* Colonne Liste des articles */}
              <section className={styles.itemsSection} aria-label={t('order.itemsSectionTitle')}>
                <div className={styles.itemsHeader}>
                  <h2 className={styles.sectionTitle}>
                    {t('order.itemsCountHeader', { count: itemCount })}
                  </h2>
                  <button
                    type="button"
                    className={styles.clearAllBtn}
                    onClick={() => clearOrder(true)}
                    aria-label={t('order.clearAllAria')}
                  >
                    {t('order.clearAll')}
                  </button>
                </div>

                {items.map((item) => {
                  const hasPrice = item.price !== null && item.price !== undefined && Number(item.price) > 0;
                  const unitPrice = hasPrice ? Number(item.price) : 0;
                  const lineTotal = unitPrice * Number(item.quantity);
                  const minQty = Math.max(1, Number(item.min_quantity) || 1);

                  return (
                    <article
                      key={item.id}
                      className={styles.itemCard}
                      aria-labelledby={`item-title-${item.id}`}
                    >
                      {/* Vignette produit */}
                      <div className={styles.itemImageWrapper}>
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className={styles.itemImage}
                            loading="lazy"
                            width="80"
                            height="80"
                          />
                        ) : (
                          <div className={styles.itemPlaceholder}>
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                            </svg>
                            <span>{t('catalog.noImage')}</span>
                          </div>
                        )}
                      </div>

                      {/* Détails du produit */}
                      <div className={styles.itemDetails}>
                        <h3 id={`item-title-${item.id}`} className={styles.itemTitle}>
                          {item.name}
                        </h3>
                        {item.category && (
                          <span className={styles.itemCategory}>{item.category}</span>
                        )}
                        <div className={styles.itemPriceUnit}>
                          {hasPrice ? (
                            <span className={styles.itemUnitPrice}>
                              {formatPrice(unitPrice)}
                            </span>
                          ) : (
                            <span className={styles.itemPriceOnDemand}>
                              {t('catalog.priceOnDemand')}
                            </span>
                          )}
                          {item.unit && (
                            <span className={styles.itemCategory}>
                              {t('catalog.perUnit', { unit: item.unit })}
                            </span>
                          )}
                        </div>
                        {minQty > 1 && (
                          <span className={styles.itemMinNotice}>
                            {t('catalog.minQuantityNotice', { min: minQty })}
                          </span>
                        )}
                      </div>

                      {/* Contrôles de quantité et sous-total */}
                      <div className={styles.itemActionsWrapper}>
                        <div className={styles.qtyControls}>
                          <button
                            type="button"
                            className={styles.qtyBtn}
                            onClick={() => updateQuantity(item.id, Number(item.quantity) - 1)}
                            disabled={Number(item.quantity) <= minQty}
                            aria-label={t('catalog.decreaseQty')}
                          >
                            -
                          </button>
                          <input
                            type="number"
                            className={styles.qtyInput}
                            min={minQty}
                            value={item.quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              if (!isNaN(val)) {
                                updateQuantity(item.id, val);
                              }
                            }}
                            aria-label={`${t('catalog.quantity')} - ${item.name}`}
                          />
                          <button
                            type="button"
                            className={styles.qtyBtn}
                            onClick={() => updateQuantity(item.id, Number(item.quantity) + 1)}
                            aria-label={t('catalog.increaseQty')}
                          >
                            +
                          </button>
                        </div>

                        {hasPrice && (
                          <div className={styles.itemSubtotalWrapper}>
                            <span className={styles.itemSubtotalLabel}>
                              {t('order.lineSubtotal')}
                            </span>
                            <span className={styles.itemSubtotalValue}>
                              {formatPrice(lineTotal)}
                            </span>
                          </div>
                        )}

                        <button
                          type="button"
                          className={styles.removeBtn}
                          onClick={() => removeItem(item.id)}
                          aria-label={`${t('order.remove')} ${item.name}`}
                        >
                          <svg className={styles.removeIcon} viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                          </svg>
                          <span>{t('order.remove')}</span>
                        </button>
                      </div>
                    </article>
                  );
                })}
              </section>

              {/* Colonne latérale Synthèse & Mentions */}
              <aside className={styles.summarySidebar} aria-label={t('order.summarySidebarAria')}>
                <div className={styles.summaryCard}>
                  <h2 className={styles.summaryCardTitle}>{t('order.summaryCardTitle')}</h2>

                  <div className={styles.summaryRow}>
                    <span>{t('order.totalArticles')}</span>
                    <strong>{t('order.articlesCount', { count: totalQuantity })}</strong>
                  </div>

                  <div className={styles.summaryRow}>
                    <span>{t('order.distinctReferences')}</span>
                    <span>{itemCount}</span>
                  </div>

                  <div className={styles.summaryRowTotal}>
                    <span className={styles.totalLabel}>{t('order.indicativeTotalLabel')}</span>
                    <span className={styles.totalValue}>{formatPrice(indicativeTotal)}</span>
                  </div>

                  {hasUnpricedItems && (
                    <p className={styles.itemMinNotice} style={{ marginTop: '0.5rem' }}>
                      * {t('order.unpricedNotice')}
                    </p>
                  )}

                  {/* Mention obligatoire de confirmation par ETOF SARL */}
                  <div className={styles.disclaimerBox} role="note">
                    <div className={styles.disclaimerTitle}>
                      <svg className={styles.disclaimerIcon} viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                      </svg>
                      <span>{t('order.disclaimerHeader')}</span>
                    </div>
                    <p style={{ margin: 0 }}>{t('order.confirmationDisclaimer')}</p>
                  </div>

                  <div className={styles.futurePaymentNotice}>
                    <small>
                      ℹ️ {t('order.paymentNotice')}
                    </small>
                  </div>
                </div>
              </aside>
            </div>

            {/* Section formulaire de finalisation ou modification de commande */}
            <section
              ref={formSectionRef}
              className={styles.orderFormSection}
              aria-labelledby="order-form-heading"
            >
              <h2 id="order-form-heading" className={styles.orderFormTitle}>
                {isEditing
                  ? t('order.formTitleEdit', 'Mettre à jour vos coordonnées ou votre message')
                  : t('order.formTitle')}
              </h2>
              <p className={styles.orderFormSubtitle}>
                {isEditing
                  ? t('order.formSubtitleEdit', 'Vous pouvez réajuster vos informations et renvoyer la mise à jour aux équipes ETOF SARL.')
                  : t('order.formSubtitle')}
              </p>

              <RequestForm
                formType="order"
                initialActivity={detectedActivity}
                items={items}
                onSuccess={(res) => {
                  // Mémoriser la commande soumise pour afficher le bandeau officiel
                  setSubmittedOrder(res);
                  setIsEditing(false);
                  broadcastSync('new_order_submitted', res);
                  // NE PAS VIDER LE PANIER : les articles restent visibles et modifiables !
                  window.scrollTo({ top: 120, behavior: 'smooth' });
                }}
              />
            </section>
          </>
        )}
      </Container>
    </main>
  );
}

export default OrderSummaryPage;
