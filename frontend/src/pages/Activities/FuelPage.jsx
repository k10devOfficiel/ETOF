import React from 'react';
import { useTranslation } from 'react-i18next';
import ActivityPage from '../../components/activity/ActivityPage.jsx';

/**
 * Page dédiée au pôle Transport d'Hydrocarbures d'ETOF SARL.
 * Acheminement sécurisé de carburants et logistique pétrolière en Côte d'Ivoire.
 * Comprend un bandeau prudent pour les informations réglementaires disponibles sur demande.
 *
 * @returns {JSX.Element}
 */
export function FuelPage() {
  const { t } = useTranslation();

  return (
    <ActivityPage
      path="/activites/hydrocarbures"
      metaTitle={t('fuel.metaTitle')}
      metaDescription={t('fuel.metaDescription')}
      badge={t('fuel.badge')}
      title={t('fuel.title')}
      subtitle={t('fuel.subtitle')}
      heroActions={[
        {
          label: t('fuel.btnQuote'),
          to: '/devis?type=quote&activity=fuel',
          variant: 'primary',
        },
        {
          label: t('fuel.btnContact'),
          to: '/contact?subject=hydrocarbures',
          variant: 'outline',
        },
      ]}
      notice={{
        text: t('fuel.noticeText'),
        details: t('fuel.noticeDetails'),
      }}
      presentation={{
        title: t('fuel.presentationTitle'),
        paragraphs: [t('fuel.presentationP1'), t('fuel.presentationP2')],
        sideCardTitle: t('fuel.sideTitle'),
        sideCardText: t('fuel.sideText'),
      }}
      services={{
        title: t('fuel.servicesTitle'),
        subtitle: t('fuel.servicesSubtitle'),
        items: [
          {
            title: t('fuel.itemBulkTitle'),
            description: t('fuel.itemBulkDesc'),
            linkText: t('fuel.btnQuote'),
            linkTo: '/devis?type=quote&activity=fuel',
          },
          {
            title: t('fuel.itemDepotTitle'),
            description: t('fuel.itemDepotDesc'),
            linkText: t('fuel.btnQuote'),
            linkTo: '/devis?type=quote&activity=fuel',
          },
          {
            title: t('fuel.itemSafetyTitle'),
            description: t('fuel.itemSafetyDesc'),
          },
          {
            title: t('fuel.itemTrackingTitle'),
            description: t('fuel.itemTrackingDesc'),
          },
          {
            title: t('fuel.itemDedicatedTitle'),
            description: t('fuel.itemDedicatedDesc'),
          },
          {
            title: t('fuel.itemComplianceTitle'),
            description: t('fuel.itemComplianceDesc'),
          },
        ],
      }}
      advantages={{
        title: t('fuel.advTitle'),
        subtitle: t('fuel.advSubtitle'),
        items: [
          {
            title: t('fuel.adv1Title'),
            description: t('fuel.adv1Desc'),
          },
          {
            title: t('fuel.adv2Title'),
            description: t('fuel.adv2Desc'),
          },
          {
            title: t('fuel.adv3Title'),
            description: t('fuel.adv3Desc'),
          },
          {
            title: t('fuel.adv4Title'),
            description: t('fuel.adv4Desc'),
          },
        ],
      }}
      cta={{
        title: t('fuel.ctaTitle'),
        subtitle: t('fuel.ctaSubtitle'),
        actions: [
          {
            label: t('fuel.btnQuote'),
            to: '/devis?type=quote&activity=fuel',
            variant: 'primary',
          },
          {
            label: t('fuel.btnContact'),
            to: '/contact?subject=hydrocarbures',
            variant: 'outline',
          },
        ],
      }}
      devTopicKey="certifications"
    />
  );
}

export default FuelPage;

