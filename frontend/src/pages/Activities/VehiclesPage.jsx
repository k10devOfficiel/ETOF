import React from 'react';
import { useTranslation } from 'react-i18next';
import ActivityPage from '../../components/activity/ActivityPage.jsx';

/**
 * Page dédiée au pôle Vente et Location de Véhicules d'ETOF SARL.
 * Berlines, SUV, véhicules utilitaires et prestige à Abidjan.
 *
 * @returns {JSX.Element}
 */
export function VehiclesPage() {
  const { t } = useTranslation();

  return (
    <ActivityPage
      path="/activites/vehicules"
      metaTitle={t('vehicles.metaTitle')}
      metaDescription={t('vehicles.metaDescription')}
      badge={t('vehicles.badge')}
      title={t('vehicles.title')}
      subtitle={t('vehicles.subtitle')}
      heroActions={[
        {
          label: t('vehicles.btnReserve'),
          to: '/devis?type=reservation&activity=vehicle',
          variant: 'primary',
        },
        {
          label: t('vehicles.btnPurchase'),
          to: '/devis?type=purchase&activity=vehicle',
          variant: 'outline',
        },
      ]}
      presentation={{
        title: t('vehicles.presentationTitle'),
        paragraphs: [
          t('vehicles.presentationP1'),
          t('vehicles.presentationP2'),
        ],
        sideCardTitle: t('vehicles.sideTitle'),
        sideCardText: t('vehicles.sideText'),
      }}
      services={{
        title: t('vehicles.servicesTitle'),
        subtitle: t('vehicles.servicesSubtitle'),
        items: [
          {
            title: t('vehicles.itemRentalTitle'),
            description: t('vehicles.itemRentalDesc'),
            linkText: t('vehicles.seeCatalog'),
            linkTo: '/vehicules?mode=rental',
          },
          {
            title: t('vehicles.itemSaleTitle'),
            description: t('vehicles.itemSaleDesc'),
            linkText: t('vehicles.seeCatalog'),
            linkTo: '/vehicules?mode=sale',
          },
          {
            title: t('vehicles.itemDriverTitle'),
            description: t('vehicles.itemDriverDesc'),
            linkText: t('vehicles.btnReserve'),
            linkTo: '/devis?type=reservation&activity=vehicle',
          },
          {
            title: t('vehicles.itemFleetTitle'),
            description: t('vehicles.itemFleetDesc'),
            linkText: t('vehicles.btnPurchase'),
            linkTo: '/devis?type=quote&activity=vehicle',
          },
          {
            title: t('vehicles.itemInspectionTitle'),
            description: t('vehicles.itemInspectionDesc'),
          },
          {
            title: t('vehicles.itemCustomTitle'),
            description: t('vehicles.itemCustomDesc'),
          },
        ],
      }}
      advantages={{
        title: t('vehicles.advTitle'),
        subtitle: t('vehicles.advSubtitle'),
        items: [
          {
            title: t('vehicles.adv1Title'),
            description: t('vehicles.adv1Desc'),
          },
          {
            title: t('vehicles.adv2Title'),
            description: t('vehicles.adv2Desc'),
          },
          {
            title: t('vehicles.adv3Title'),
            description: t('vehicles.adv3Desc'),
          },
          {
            title: t('vehicles.adv4Title'),
            description: t('vehicles.adv4Desc'),
          },
        ],
      }}
      cta={{
        title: t('vehicles.ctaTitle'),
        subtitle: t('vehicles.ctaSubtitle'),
        actions: [
          {
            label: t('vehicles.btnReserve'),
            to: '/devis?type=reservation&activity=vehicle',
            variant: 'primary',
          },
          {
            label: t('vehicles.btnPurchase'),
            to: '/devis?type=purchase&activity=vehicle',
            variant: 'outline',
          },
        ],
      }}
      devTopicKey="keyFigures"
    />
  );
}

export default VehiclesPage;

