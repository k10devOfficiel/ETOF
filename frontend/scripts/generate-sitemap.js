/**
 * Générateur de sitemap.xml statique pour le site ETOF SARL.
 * Exécuté automatiquement lors du build Vite pour produire un fichier XML conforme
 * aux spécifications sitemaps.org avec balises d'alternance bilingue xhtml:link (FR, EN, x-default).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITE_URL = (process.env.VITE_SITE_URL || 'https://www.etofsarl.com').replace(/\/$/, '');
const TODAY = new Date().toISOString().split('T')[0];

const STATIC_ROUTES = [
  { path: '', priority: '1.0', changefreq: 'daily' },
  { path: '/a-propos', priority: '0.8', changefreq: 'monthly' },
  { path: '/activites/ferme', priority: '0.9', changefreq: 'weekly' },
  { path: '/activites/vehicules', priority: '0.9', changefreq: 'weekly' },
  { path: '/activites/fournitures', priority: '0.9', changefreq: 'weekly' },
  { path: '/activites/hydrocarbures', priority: '0.9', changefreq: 'weekly' },
  { path: '/catalogue', priority: '0.9', changefreq: 'daily' },
  { path: '/vehicules', priority: '0.9', changefreq: 'daily' },
  { path: '/devis', priority: '0.8', changefreq: 'monthly' },
  { path: '/commande', priority: '0.7', changefreq: 'monthly' },
  { path: '/contact', priority: '0.8', changefreq: 'monthly' },
  { path: '/mentions-legales', priority: '0.3', changefreq: 'yearly' },
  { path: '/politique-de-confidentialite', priority: '0.3', changefreq: 'yearly' },
  { path: '/conditions-generales', priority: '0.3', changefreq: 'yearly' },
];

function generateSitemapXml() {
  const urls = STATIC_ROUTES.map((route) => {
    const loc = `${SITE_URL}${route.path}`;
    return `  <url>
    <loc>${loc}</loc>
    <xhtml:link rel="alternate" hreflang="fr" href="${loc}" />
    <xhtml:link rel="alternate" hreflang="en" href="${loc}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${loc}" />
    <lastmod>${TODAY}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;
}

const sitemapContent = generateSitemapXml();

// Écriture dans public/sitemap.xml (source)
const publicDir = path.resolve(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapContent, 'utf-8');

// Écriture également dans dist/sitemap.xml si le dossier dist existe déjà
const distDir = path.resolve(__dirname, '../dist');
if (fs.existsSync(distDir)) {
  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemapContent, 'utf-8');
}

console.log(`[SEO] sitemap.xml généré avec succès (${STATIC_ROUTES.length} routes statiques bilingues).`);

