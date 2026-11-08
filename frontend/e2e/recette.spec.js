import { test, expect } from '@playwright/test';

test.describe('Cahier des charges ETOF SARL - Parcours Principaux', () => {
  test('1. Changement de langue dynamique FR / EN', async ({ page }) => {
    await page.goto('http://127.0.0.1:5173/');

    // Vérifier l'état initial en français dans le bandeau de navigation
    const banner = page.getByRole('banner');
    await expect(banner.getByRole('button', { name: 'FR', exact: true })).toBeVisible();
    await expect(banner.getByRole('button', { name: 'EN', exact: true })).toBeVisible();

    const isDesktop = !page.viewportSize() || page.viewportSize().width >= 768;
    if (isDesktop) {
      await expect(banner).toContainText('Accueil');
      await expect(banner).toContainText('Catalogue');
    }

    // Basculer en anglais
    await banner.getByRole('button', { name: 'EN', exact: true }).click();

    // Vérifier l'actualisation dynamique des libellés en anglais
    if (isDesktop) {
      await expect(banner).toContainText('Home');
      await expect(banner).toContainText('Catalog');
    }

    // Revenir en français
    await banner.getByRole('button', { name: 'FR', exact: true }).click();
    if (isDesktop) {
      await expect(banner).toContainText('Accueil');
      await expect(banner).toContainText('Catalogue');
    }
  });

  test('2. Réservation de véhicule de bout en bout', async ({ page }) => {
    // Naviguer sur le catalogue automobile
    await page.goto('http://127.0.0.1:5173/vehicules');

    // Cibler un véhicule disponible dans le catalogue et ouvrir sa fiche
    const vehicleCard = page.locator('article:has-text("Hyundai"), article:has-text("Peugeot"), article:has-text("Mitsubishi")').first();
    await expect(vehicleCard).toBeVisible({ timeout: 15000 });
    await vehicleCard.getByRole('button', { name: 'Voir la fiche', exact: true }).click();

    // Dans la modale accessible du véhicule, cliquer sur le bouton de réservation
    const modal = page.locator('div[class*="_modal_"]');
    await expect(modal).toBeVisible({ timeout: 10000 });
    const reserveBtn = modal.getByRole('button', { name: /Réserver ce véhicule/i });
    await expect(reserveBtn).toBeVisible();
    await reserveBtn.click();

    // Vérifier l'arrivée sur la page de devis avec le formulaire de réservation pré-rempli
    await expect(page).toHaveURL(/.*devis.*type=reservation.*/);

    // Remplir les dates de début et de fin de location
    const dateInputs = page.locator('input[type="date"]');
    await dateInputs.nth(0).fill('2026-12-01');
    await dateInputs.nth(1).fill('2026-12-15');

    // Renseigner les coordonnées du demandeur
    await page.locator('input[autocomplete="name"]').fill('Jean-Marc Koffi');
    await page.locator('input[autocomplete="organization"]').fill('Groupe Ivoire BTP');
    await page.locator('input[autocomplete="email"]').fill('jm.koffi@ivoirebtp.ci');
    await page.locator('input[autocomplete="tel"]').fill('+2250708091011');

    // Cocher la case obligatoire de consentement RGPD
    await page.locator('#consent-checkbox').check();

    // Soumettre le formulaire
    await page.locator('button[type="submit"]').click();

    // Vérifier l'apparition de l'écran de confirmation avec référence officielle ETOF
    await expect(page.locator('text=ETOF-')).toBeVisible({ timeout: 15000 });
  });

  test('3. Commande de produits avec ajout au panier et récapitulatif', async ({ page }) => {
    // Naviguer sur le catalogue de produits
    await page.goto('http://127.0.0.1:5173/catalogue');

    // Trouver un article disponible à la commande directe et l'ajouter
    const addToOrderBtn = page.getByRole('button', { name: /Ajouter à la commande/i }).first();
    await expect(addToOrderBtn).toBeVisible({ timeout: 15000 });
    await addToOrderBtn.click();

    // Naviguer vers la page de commande via le lien du panier dans l'en-tête (navigation SPA)
    const cartLink = page.getByRole('banner').locator('a[href="/commande"]');
    await cartLink.click();

    // Vérifier la présence du titre du récapitulatif et des articles sélectionnés
    await expect(page.getByRole('heading', { name: /Récapitulatif de commande/i })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Total des unités')).toBeVisible({ timeout: 10000 });

    // Renseigner les coordonnées de livraison
    await page.locator('input[autocomplete="name"]').fill('Awa Diallo');
    await page.locator('input[autocomplete="organization"]').fill('Cabinet Diallo & Associés');
    await page.locator('input[autocomplete="email"]').fill('adiallo@cabinet-diallo.ci');
    await page.locator('input[autocomplete="tel"]').fill('+2250102030405');

    // Consentement RGPD
    await page.locator('#consent-checkbox').check();

    // Validation et envoi de la commande
    await page.locator('button[type="submit"]').click();

    // Contrôler l'accusé de réception avec référence officielle ETOF
    await expect(page.locator('text=ETOF-')).toBeVisible({ timeout: 15000 });
  });

  test('4. Demande de devis spécialisé Transport d’hydrocarbures', async ({ page }) => {
    // Naviguer directement sur le formulaire hydrocarbures
    await page.goto('http://127.0.0.1:5173/devis?type=fuel&activity=fuel');

    // Renseigner les spécifications techniques du transport
    const volumeField = page.getByPlaceholder(/35 000|volume/i);
    await expect(volumeField).toBeVisible({ timeout: 15000 });
    await volumeField.fill('45000 L');

    const originField = page.getByPlaceholder(/Vridi|départ/i);
    await originField.fill('Dépôt Petroci, Vridi (Abidjan)');

    const destField = page.getByPlaceholder(/Bouaké|destination/i);
    await destField.fill('Station ETOF SARL, Yamoussoukro');

    // Renseigner la date d'acheminement souhaitée
    const dateInput = page.locator('input[type="date"]');
    await dateInput.fill('2026-12-20');

    // Renseigner les coordonnées de la société pétrolière
    await page.locator('input[autocomplete="name"]').fill('Sékou Bakayoko');
    await page.locator('input[autocomplete="organization"]').fill('Petro Distribution SARL');
    await page.locator('input[autocomplete="email"]').fill('sbakayoko@petrodistrib.ci');
    await page.locator('input[autocomplete="tel"]').fill('+2250506070809');

    // Consentement RGPD
    await page.locator('#consent-checkbox').check();

    // Envoi de la demande
    await page.locator('button[type="submit"]').click();

    // Vérification du succès et de la référence officielle
    await expect(page.locator('text=ETOF-')).toBeVisible({ timeout: 15000 });
  });
});
