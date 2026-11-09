import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Seo from '../../components/common/Seo.jsx';
import PageHero from '../../components/layout/PageHero.jsx';
import Container from '../../components/ui/Container.jsx';
import RequestForm from '../../components/forms/RequestForm.jsx';
import { getProducts, getVehicles } from '../../api/catalog.js';
import styles from './QuotePage.module.css';

/**
 * Page unifiée des demandes client ETOF SARL (devis, commande, réservation,
 * achat automobile et devis transport hydrocarbures).
 *
 * @returns {JSX.Element}
 */
export function QuotePage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Lecture des paramètres de l'URL
  const rawType = searchParams.get('type') || 'quote';
  const rawActivity = searchParams.get('activity') || 'general';
  const productId = searchParams.get('product_id');
  const vehicleId = searchParams.get('vehicle_id');
  const initialQty = parseInt(searchParams.get('quantity') || '1', 10);

  // État du type actif (quote, order, reservation, purchase, fuel)
  const currentTab =
    rawType === 'fuel' || rawActivity === 'fuel'
      ? 'fuel'
      : ['quote', 'order', 'reservation', 'purchase', 'contact'].includes(rawType)
      ? rawType
      : 'quote';

  // Objets pré-remplis
  const [prefilledItem, setPrefilledItem] = useState(null);
  const [prefilledVehicle, setPrefilledVehicle] = useState(null);

  // Chargement asynchrone des données de pré-remplissage
  useEffect(() => {
    let isMounted = true;

    if (productId) {
      const loadProduct = async () => {
        try {
          const res = await getProducts({ per_page: 48 });
          if (isMounted && res?.items) {
            const found = res.items.find((p) => String(p.id) === String(productId));
            if (found) {
              setPrefilledItem({
                id: found.id,
                name: found.name,
                price: found.price,
                unit: found.unit,
                quantity: initialQty,
              });
            }
          }
        } catch (err) {
          if (import.meta.env.DEV) {
            console.error('Erreur chargement produit pré-rempli:', err);
          }
        }
      };
      loadProduct();
    } else {
      setPrefilledItem(null);
    }

    if (vehicleId) {
      const loadVehicle = async () => {
        try {
          const res = await getVehicles({ per_page: 48 });
          if (isMounted && res?.items) {
            const found = res.items.find((v) => String(v.id) === String(vehicleId));
            if (found) {
              setPrefilledVehicle({
                id: found.id,
                brand: found.brand,
                model: found.model,
                year: found.year,
                mode: found.mode,
              });
            }
          }
        } catch (err) {
          if (import.meta.env.DEV) {
            console.error('Erreur chargement véhicule pré-rempli:', err);
          }
        }
      };
      loadVehicle();
    } else {
      setPrefilledVehicle(null);
    }

    return () => {
      isMounted = false;
    };
  }, [productId, vehicleId, initialQty]);

  const handleTabChange = (tabKey) => {
    const updated = new URLSearchParams(searchParams);
    if (tabKey === 'fuel') {
      updated.set('type', 'fuel');
      updated.set('activity', 'fuel');
    } else if (tabKey === 'reservation' || tabKey === 'purchase') {
      updated.set('type', tabKey);
      updated.set('activity', 'vehicle');
    } else {
      updated.set('type', tabKey);
      if (rawActivity === 'fuel' || rawActivity === 'vehicle') {
        updated.delete('activity');
      }
    }
    // Nettoyer les présélections si l'utilisateur change d'onglet délibérément
    if (tabKey !== 'order' && tabKey !== 'quote') {
      updated.delete('product_id');
      updated.delete('quantity');
    }
    if (tabKey !== 'reservation' && tabKey !== 'purchase') {
      updated.delete('vehicle_id');
    }
    setSearchParams(updated);
  };

  return (
    <>
      <Seo
        title={t('forms.pageMetaTitle')}
        description={t('forms.pageMetaDescription')}
        path="/devis"
      />

      {/* En-tête de page propre avec Fil d'Ariane */}
      <PageHero
        badge={t('forms.pageTag')}
        title={t('forms.pageTitle')}
        subtitle={t('forms.pageSubtitle')}
        breadcrumbs={[
          { label: t('nav.home'), to: '/' },
          { label: t('forms.pageTitle') },
        ]}
      />

      {/* Onglets d'orientation entre les 4 usages + hydrocarbures */}
      <nav className={styles.tabsContainer} aria-label={t('forms.tabsAriaLabel')}>
        <Container size="fixed">
          <div className={styles.tabsTrack} role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={currentTab === 'quote'}
              className={`${styles.tabBtn} ${currentTab === 'quote' ? styles.activeTabBtn : ''}`}
              onClick={() => handleTabChange('quote')}
            >
              {t('forms.tabQuote')}
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={currentTab === 'order'}
              className={`${styles.tabBtn} ${currentTab === 'order' ? styles.activeTabBtn : ''}`}
              onClick={() => handleTabChange('order')}
            >
              {t('forms.tabOrder')}
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={currentTab === 'reservation'}
              className={`${styles.tabBtn} ${currentTab === 'reservation' ? styles.activeTabBtn : ''}`}
              onClick={() => handleTabChange('reservation')}
            >
              {t('forms.tabReservation')}
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={currentTab === 'purchase'}
              className={`${styles.tabBtn} ${currentTab === 'purchase' ? styles.activeTabBtn : ''}`}
              onClick={() => handleTabChange('purchase')}
            >
              {t('forms.tabPurchase')}
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={currentTab === 'fuel'}
              className={`${styles.tabBtn} ${currentTab === 'fuel' ? styles.activeTabBtn : ''}`}
              onClick={() => handleTabChange('fuel')}
            >
              {t('forms.tabFuel')}
            </button>
          </div>
        </Container>
      </nav>

      {/* Formulaire & Volet d'engagement */}
      <main className={styles.contentSection}>
        <Container size="fixed">
          <div className={styles.layoutGrid}>
            <div>
              <RequestForm
                formType={currentTab}
                initialActivity={rawActivity}
                prefilledItem={prefilledItem}
                prefilledVehicle={prefilledVehicle}
              />
            </div>

            {/* Volet latéral de garanties et engagements ETOF */}
            <aside className={styles.sidebar}>
              <div className={styles.sidebarCard}>
                <h3 className={styles.sidebarTitle}>{t('forms.commitmentsTitle')}</h3>
                <ul className={styles.commitmentList}>
                  <li className={styles.commitmentItem}>
                    <svg className={styles.checkIcon} viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
                    </svg>
                    <span>{t('forms.commitment1')}</span>
                  </li>
                  <li className={styles.commitmentItem}>
                    <svg className={styles.checkIcon} viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
                    </svg>
                    <span>{t('forms.commitment2')}</span>
                  </li>
                  <li className={styles.commitmentItem}>
                    <svg className={styles.checkIcon} viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
                    </svg>
                    <span>{t('forms.commitment3')}</span>
                  </li>
                  <li className={styles.commitmentItem}>
                    <svg className={styles.checkIcon} viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
                    </svg>
                    <span>{t('forms.commitment4')}</span>
                  </li>
                </ul>
              </div>

              <div className={styles.sidebarCard}>
                <h3 className={styles.sidebarTitle}>{t('forms.sidebarHelpTitle')}</h3>
                <p className={styles.sidebarText}>{t('forms.sidebarHelpText')}</p>
              </div>
            </aside>
          </div>
        </Container>
      </main>
    </>
  );
}

export default QuotePage;

