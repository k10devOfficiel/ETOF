import React from 'react';
import { useTranslation } from 'react-i18next';
import ActivityPage from '../../components/activity/ActivityPage.jsx';

/**
 * Page dédiée au pôle Fournitures de Bureau d'ETOF SARL.
 * Papeterie, consommables d'impression, mobilier et réponses aux appels d'offres.
 *
 * @returns {JSX.Element}
 */
export function OfficePage() {
  const { t } = useTranslation();

  return (
    <ActivityPage
      path="/activites/fournitures"
      metaTitle={t('office.metaTitle')}
      metaDescription={t('office.metaDescription')}
      badge={t('office.badge')}
      title={t('office.title')}
      subtitle={t('office.subtitle')}
      heroActions={[
        {
          label: t('office.btnCatalog'),
          to: '/catalogue?activity=office',
          variant: 'primary',
        },
        {
          label: t('office.btnQuote'),
          to: '/devis?type=quote&activity=office',
          variant: 'outline',
        },
      ]}
      presentation={{
        title: t('office.presentationTitle'),
        paragraphs: [t('office.presentationP1'), t('office.presentationP2')],
        sideCardTitle: t('office.sideTitle'),
        sideCardText: t('office.sideText'),
      }}
      services={{
        title: t('office.servicesTitle'),
        subtitle: t('office.servicesSubtitle'),
        items: [
          {
            title: t('office.itemStationeryTitle'),
            description: t('office.itemStationeryDesc'),
            linkText: t('office.seeCatalog'),
            linkTo: '/catalogue?activity=office&category=papeterie',
          },
          {
            title: t('office.itemConsumablesTitle'),
            description: t('office.itemConsumablesDesc'),
            linkText: t('office.seeCatalog'),
            linkTo: '/catalogue?activity=office&category=consommables',
          },
          {
            title: t('office.itemEquipmentTitle'),
            description: t('office.itemEquipmentDesc'),
            linkText: t('office.seeCatalog'),
            linkTo: '/catalogue?activity=office&category=equipements',
          },
          {
            title: t('office.itemFurnitureTitle'),
            description: t('office.itemFurnitureDesc'),
            linkText: t('office.seeCatalog'),
            linkTo: '/catalogue?activity=office&category=mobilier',
          },
          {
            title: t('office.itemWritingTitle'),
            description: t('office.itemWritingDesc'),
            linkText: t('office.seeCatalog'),
            linkTo: '/catalogue?activity=office&category=ecriture',
          },
          {
            title: t('office.itemTendersTitle'),
            description: t('office.itemTendersDesc'),
            linkText: t('office.btnQuote'),
            linkTo: '/devis?type=quote&activity=office',
          },
        ],
      }}
      advantages={{
        title: t('office.advTitle'),
        subtitle: t('office.advSubtitle'),
        items: [
          {
            title: t('office.adv1Title'),
            description: t('office.adv1Desc'),
          },
          {
            title: t('office.adv2Title'),
            description: t('office.adv2Desc'),
          },
          {
            title: t('office.adv3Title'),
            description: t('office.adv3Desc'),
          },
          {
            title: t('office.adv4Title'),
            description: t('office.adv4Desc'),
          },
        ],
      }}
      cta={{
        title: t('office.ctaTitle'),
        subtitle: t('office.ctaSubtitle'),
        actions: [
          {
            label: t('office.btnCatalog'),
            to: '/catalogue?activity=office',
            variant: 'primary',
          },
          {
            label: t('office.btnQuote'),
            to: '/devis?type=quote&activity=office',
            variant: 'outline',
          },
        ],
      }}
      devTopicKey="keyFigures"
    />
  );
}

export default OfficePage;

