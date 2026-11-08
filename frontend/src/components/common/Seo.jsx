import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

/**
 * Composant centralisé de référencement (SEO) basé sur react-helmet-async.
 * Définit dynamiquement le titre, la méta description, l'URL canonique, les balises
 * hreflang (fr, en, x-default), les balises Open Graph, Twitter Cards et les données
 * structurées JSON-LD (Organization & LocalBusiness).
 *
 * @param {{
 *   title: string,
 *   description?: string,
 *   path?: string,
 *   image?: string,
 *   type?: 'website' | 'article' | 'product',
 *   noindex?: boolean,
 *   structuredData?: Record<string, any> | Array<Record<string, any>>
 * }} props
 * @returns {JSX.Element}
 */
export function Seo({
  title,
  description,
  path = '',
  image,
  type = 'website',
  noindex = false,
  structuredData,
}) {
  const { t, i18n } = useTranslation();
  const currentLang = (i18n.language || 'fr').slice(0, 2).toLowerCase();

  const siteUrl = (
    import.meta.env.VITE_SITE_URL ||
    (typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://etof.ci')
  ).replace(/\/$/, '');

  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const canonicalUrl = `${siteUrl}${cleanPath === '/' ? '' : cleanPath}`;
  const frUrl = `${siteUrl}${cleanPath === '/' ? '' : cleanPath}`;
  const enUrl = `${siteUrl}${cleanPath === '/' ? '' : cleanPath}`;

  const defaultTitle = t('app.title', 'ETOF SARL');
  const siteSlogan = t('layout.slogan', 'Une nouvelle vision du monde des affaires');
  const fullTitle = title
    ? title.includes('ETOF SARL')
      ? title
      : `${title} | ${defaultTitle}`
    : `${defaultTitle} – ${siteSlogan}`;

  const metaDescription =
    description || t('layout.companySummary', 'Société multisectorielle basée à Abidjan : élevage & ferme, vente & location de véhicules de prestige, fournitures de bureau et transport sécurisé d’hydrocarbures.');

  const defaultImage = `${siteUrl}/assets/logo/logo.svg`;
  const shareImage = image
    ? image.startsWith('http')
      ? image
      : `${siteUrl}${image.startsWith('/') ? '' : '/'}${image}`
    : defaultImage;

  // Données structurées JSON-LD (Organization & LocalBusiness)
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ETOF SARL',
    legalName: 'ETOF SARL',
    url: siteUrl,
    logo: `${siteUrl}/assets/logo/logo.svg`,
    slogan: siteSlogan,
    description: metaDescription,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Angré Oscars',
      addressLocality: 'Cocody, Abidjan',
      addressCountry: 'CI',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['French', 'English'],
    },
  };

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'ETOF SARL',
    image: shareImage,
    url: siteUrl,
    priceRange: 'FCFA',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Angré Oscars',
      addressLocality: 'Abidjan, Cocody',
      addressRegion: 'Lagunes',
      addressCountry: 'CI',
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '08:00',
        closes: '18:00',
      },
    ],
  };

  const jsonLdPayloads = [organizationSchema, localBusinessSchema];
  if (structuredData) {
    if (Array.isArray(structuredData)) {
      jsonLdPayloads.push(...structuredData);
    } else {
      jsonLdPayloads.push(structuredData);
    }
  }

  return (
    <Helmet>
      {/* Balises primaires */}
      <html lang={currentLang} />
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="robots" content={noindex ? 'noindex, follow' : 'index, follow'} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Balises d'internationalisation bilingue (hreflang) */}
      <link rel="alternate" hrefLang="fr" href={frUrl} />
      <link rel="alternate" hrefLang="en" href={enUrl} />
      <link rel="alternate" hrefLang="x-default" href={frUrl} />

      {/* Protocole Open Graph (Facebook, LinkedIn, WhatsApp) */}
      <meta property="og:site_name" content="ETOF SARL" />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={shareImage} />
      <meta
        property="og:locale"
        content={currentLang === 'fr' ? 'fr_FR' : 'en_US'}
      />
      <meta
        property="og:locale:alternate"
        content={currentLang === 'fr' ? 'en_US' : 'fr_FR'}
      />

      {/* Balises Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={shareImage} />

      {/* Données structurées JSON-LD */}
      {jsonLdPayloads.map((payload, index) => (
        <script key={`jsonld-${index}`} type="application/ld+json">
          {JSON.stringify(payload)}
        </script>
      ))}
    </Helmet>
  );
}

export default Seo;
