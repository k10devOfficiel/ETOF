import React from 'react';
import { useTranslation } from 'react-i18next';
import ActivityPage from '../../components/activity/ActivityPage.jsx';

/**
 * Page dédiée au pôle Ferme et Élevage d'ETOF SARL.
 * Volailles (poulets, pintades, dindons, cailles) et œufs frais.
 *
 * @returns {JSX.Element}
 */
export function FarmPage() {
  const { t } = useTranslation();

  return (
    <ActivityPage
      path="/activites/ferme"
      metaTitle={t('farm.metaTitle')}
      metaDescription={t('farm.metaDescription')}
      badge={t('farm.badge')}
      title={t('farm.title')}
      subtitle={t('farm.subtitle')}
      heroActions={[
        {
          label: t('farm.btnOrder'),
          to: '/devis?type=order&activity=farm',
          variant: 'primary',
        },
        {
          label: t('farm.btnQuote'),
          to: '/devis?type=quote&activity=farm',
          variant: 'outline',
        },
      ]}
      presentation={{
        title: t('farm.presentationTitle'),
        paragraphs: [t('farm.presentationP1'), t('farm.presentationP2')],
        sideCardTitle: t('farm.sideTitle'),
        sideCardText: t('farm.sideText'),
      }}
      services={{
        title: t('farm.servicesTitle'),
        subtitle: t('farm.servicesSubtitle'),
        items: [
          {
            title: t('farm.itemChickenTitle'),
            description: t('farm.itemChickenDesc'),
            linkText: t('farm.seeInCatalog'),
            linkTo: '/catalogue?category=poulets',
          },
          {
            title: t('farm.itemGuineaTitle'),
            description: t('farm.itemGuineaDesc'),
            linkText: t('farm.seeInCatalog'),
            linkTo: '/catalogue?category=pintades',
          },
          {
            title: t('farm.itemTurkeyTitle'),
            description: t('farm.itemTurkeyDesc'),
            linkText: t('farm.seeInCatalog'),
            linkTo: '/catalogue?category=dindons',
          },
          {
            title: t('farm.itemQuailTitle'),
            description: t('farm.itemQuailDesc'),
            linkText: t('farm.seeInCatalog'),
            linkTo: '/catalogue?category=cailles',
          },
          {
            title: t('farm.itemEggsQuailTitle'),
            description: t('farm.itemEggsQuailDesc'),
            linkText: t('farm.seeInCatalog'),
            linkTo: '/catalogue?category=oeufs-de-caille',
          },
          {
            title: t('farm.itemEggsChickenTitle'),
            description: t('farm.itemEggsChickenDesc'),
            linkText: t('farm.seeInCatalog'),
            linkTo: '/catalogue?category=oeufs-de-poule',
          },
        ],
      }}
      advantages={{
        title: t('farm.advTitle'),
        subtitle: t('farm.advSubtitle'),
        items: [
          {
            title: t('farm.adv1Title'),
            description: t('farm.adv1Desc'),
          },
          {
            title: t('farm.adv2Title'),
            description: t('farm.adv2Desc'),
          },
          {
            title: t('farm.adv3Title'),
            description: t('farm.adv3Desc'),
          },
          {
            title: t('farm.adv4Title'),
            description: t('farm.adv4Desc'),
          },
        ],
      }}
      cta={{
        title: t('farm.ctaTitle'),
        subtitle: t('farm.ctaSubtitle'),
        actions: [
          {
            label: t('farm.btnOrder'),
            to: '/devis?type=order&activity=farm',
            variant: 'primary',
          },
          {
            label: t('farm.btnQuote'),
            to: '/devis?type=quote&activity=farm',
            variant: 'outline',
          },
        ],
      }}
      devTopicKey="keyFigures"
    />
  );
}

export default FarmPage;

