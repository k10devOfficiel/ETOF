<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\Config;
use App\Core\ErrorHandler;
use PHPMailer\PHPMailer\PHPMailer;
use Throwable;

/**
 * Service d'expédition d'e-mails HTML transactionnels bilingues via PHPMailer.
 */
final class MailService
{
    /**
     * Envoie l'accusé de réception au client et l'alerte à l'administrateur.
     * En cas d'échec SMTP, l'erreur est journalisée sans interrompre le traitement.
     *
     * @param array<string, mixed> $requestData
     * @param list<array<string, mixed>> $items
     * @param array<string, mixed>|null $vehicle
     */
    public static function sendRequestEmails(array $requestData, array $items = [], ?array $vehicle = null): void
    {
        $lang = (string) ($requestData['lang'] ?? 'fr');
        $reference = (string) ($requestData['reference'] ?? '');
        $clientEmail = (string) ($requestData['email'] ?? '');
        $clientName = (string) ($requestData['full_name'] ?? '');
        $adminEmail = (string) Config::get('MAIL_TO', 'contact@etofsarl.com');

        // 1. Accusé de réception envoyé au client
        try {
            $clientMailer = self::createMailer();
            $clientMailer->addAddress($clientEmail, $clientName);

            $subject = ($lang === 'en')
                ? "[ETOF SARL] Acknowledgment of receipt - Request {$reference}"
                : "[ETOF SARL] Accusé de réception - Demande {$reference}";

            $bodyHtml = self::buildClientEmailHtml($requestData, $items, $vehicle, $lang);

            $clientMailer->Subject = $subject;
            $clientMailer->Body = $bodyHtml;
            $clientMailer->AltBody = strip_tags(str_replace(['<br>', '</p>'], ["\n", "\n\n"], $bodyHtml));

            $clientMailer->send();
        } catch (Throwable $e) {
            ErrorHandler::logThrowable(new \Exception("Échec d'envoi de l'accusé client pour la demande {$reference}: " . $e->getMessage(), 0, $e));
        }

        // 2. Notification complète transmise à l'administrateur
        try {
            $adminMailer = self::createMailer();
            $adminMailer->addAddress($adminEmail, 'ETOF SARL Direction Commerciale');

            $type = strtoupper((string) ($requestData['type'] ?? ''));
            $activity = ucfirst((string) ($requestData['activity'] ?? ''));

            $adminMailer->Subject = "[Nouvelle Demande] {$reference} - {$type} ({$activity}) - {$clientName}";
            $adminBodyHtml = self::buildAdminEmailHtml($requestData, $items, $vehicle);

            $adminMailer->Body = $adminBodyHtml;
            $adminMailer->AltBody = strip_tags(str_replace(['<br>', '</p>'], ["\n", "\n\n"], $adminBodyHtml));

            $adminMailer->send();
        } catch (Throwable $e) {
            ErrorHandler::logThrowable(new \Exception("Échec d'envoi de l'alerte administrateur pour la demande {$reference}: " . $e->getMessage(), 0, $e));
        }
    }

    /**
     * Envoie un e-mail au client lors d'un changement de statut (confirmation ou refus) dans sa langue avec un texte neutre.
     *
     * @param array<string, mixed> $requestData
     */
    public static function sendStatusChangeEmail(array $requestData, string $newStatus): void
    {
        if (!in_array($newStatus, ['confirmed', 'rejected'], true)) {
            return;
        }

        $lang = (string) ($requestData['lang'] ?? 'fr');
        $reference = (string) ($requestData['reference'] ?? '');
        $clientEmail = (string) ($requestData['email'] ?? '');
        $clientName = (string) ($requestData['full_name'] ?? '');

        if ($clientEmail === '') {
            return;
        }

        $isEn = ($lang === 'en');

        if ($newStatus === 'confirmed') {
            $subject = $isEn
                ? "[ETOF SARL] Confirmation of your request {$reference}"
                : "[ETOF SARL] Confirmation de votre demande {$reference}";

            $title = $isEn ? "Request Confirmed" : "Demande Confirmée";
            $message = $isEn
                ? "Hello {$clientName},<br><br>We are pleased to inform you that your request with reference <strong>{$reference}</strong> has been <strong>confirmed</strong> by our commercial team.<br>A representative will contact you shortly with practical details."
                : "Bonjour {$clientName},<br><br>Nous vous informons que votre demande portant la référence <strong>{$reference}</strong> a été <strong>confirmée</strong> par notre équipe commerciale.<br>Un conseiller prendra contact avec vous dans les plus brefs délais pour les modalités pratiques.";
        } else {
            $subject = $isEn
                ? "[ETOF SARL] Update regarding your request {$reference}"
                : "[ETOF SARL] Mise à jour concernant votre demande {$reference}";

            $title = $isEn ? "Status Update" : "Mise à jour de votre demande";
            $message = $isEn
                ? "Hello {$clientName},<br><br>We regret to inform you that your request with reference <strong>{$reference}</strong> could not be accepted at this time.<br>We remain entirely at your disposal for any other inquiry or future requirements."
                : "Bonjour {$clientName},<br><br>Nous vous informons que votre demande portant la référence <strong>{$reference}</strong> n'a pas pu être retenue pour le moment.<br>Notre équipe reste à votre entière disposition pour tout renseignement complémentaire.";
        }

        $html = <<<HTML
<!DOCTYPE html>
<html lang="{$lang}">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333333; margin: 0; padding: 20px; background-color: #f7f9fa; }
        .card { max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 8px; border: 1px solid #e0e0e0; }
        .header { border-bottom: 2px solid #005a36; padding-bottom: 15px; margin-bottom: 20px; }
        .logo { font-size: 24px; font-weight: bold; color: #005a36; }
        .slogan { font-size: 13px; color: #666666; font-style: italic; }
        .footer { font-size: 12px; color: #777777; margin-top: 30px; border-top: 1px solid #eeeeee; padding-top: 15px; }
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <div class="logo">ETOF SARL</div>
            <div class="slogan">« Une nouvelle vision du monde des affaires »</div>
        </div>
        <h2>{$title} &bull; {$reference}</h2>
        <p>{$message}</p>
        <div class="footer">
            ETOF SARL &bull; Abidjan, Cocody, Angré Oscars &bull; Côte d’Ivoire<br>
            Ceci est un message officiel lié au suivi de votre dossier.
        </div>
    </div>
</body>
</html>
HTML;

        try {
            $mailer = self::createMailer();
            $mailer->addAddress($clientEmail, $clientName);
            $mailer->Subject = $subject;
            $mailer->Body = $html;
            $mailer->AltBody = strip_tags(str_replace(['<br>', '</p>'], ["\n", "\n\n"], $html));
            $mailer->send();
        } catch (Throwable $e) {
            ErrorHandler::logThrowable(new \Exception("Échec d'envoi de la notification de statut ({$newStatus}) pour la demande {$reference}: " . $e->getMessage(), 0, $e));
        }
    }

    /**
     * Initialise et configure une instance PHPMailer selon les variables d'environnement.
     */
    private static function createMailer(): PHPMailer
    {
        $mailer = new PHPMailer(true);
        $mailer->CharSet = 'UTF-8';

        $host = (string) Config::get('MAIL_HOST', '');
        if ($host !== '' && $host !== 'smtp.example.com') {
            $mailer->isSMTP();
            $mailer->Host = $host;
            $mailer->Port = (int) Config::get('MAIL_PORT', 587);

            $user = (string) Config::get('MAIL_USER', '');
            $pass = (string) Config::get('MAIL_PASS', '');

            if ($user !== '') {
                $mailer->SMTPAuth = true;
                $mailer->Username = $user;
                $mailer->Password = $pass;
            }

            if ($mailer->Port === 465) {
                $mailer->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
            } else {
                $mailer->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            }

            $mailer->Timeout = 5;
        }

        $fromAddress = (string) Config::get('MAIL_FROM', 'no-reply@etofsarl.com');
        $mailer->setFrom($fromAddress, 'ETOF SARL');

        $mailer->isHTML(true);

        return $mailer;
    }

    /**
     * Construit le corps HTML bilingue de l'accusé de réception client.
     *
     * @param array<string, mixed> $data
     * @param list<array<string, mixed>> $items
     * @param array<string, mixed>|null $vehicle
     */
    private static function buildClientEmailHtml(array $data, array $items, ?array $vehicle, string $lang): string
    {
        $isEn = ($lang === 'en');
        $reference = htmlspecialchars((string) $data['reference'], ENT_QUOTES, 'UTF-8');
        $fullName = htmlspecialchars((string) $data['full_name'], ENT_QUOTES, 'UTF-8');

        $title = $isEn ? "Acknowledgment of Receipt" : "Accusé de Réception de votre demande";
        $intro = $isEn
            ? "Dear <strong>{$fullName}</strong>,<br>We have successfully received your request under reference <strong>{$reference}</strong>."
            : "Cher(ère) <strong>{$fullName}</strong>,<br>Nous accusons bonne réception de votre demande enregistrée sous la référence <strong>{$reference}</strong>.";

        $disclaimer = $isEn
            ? "<strong>Important:</strong> Please note that your request must be confirmed by the ETOF SARL sales team before any final validation. An advisor will contact you promptly."
            : "<strong>Important :</strong> Veuillez noter que votre demande doit être confirmée par l'équipe commerciale d'ETOF SARL avant toute validation définitive. Un conseiller prendra contact avec vous dans les plus brefs délais.";

        $summaryHtml = self::renderSummaryTable($data, $items, $vehicle, $lang);

        return <<<HTML
<!DOCTYPE html>
<html lang="{$lang}">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333333; margin: 0; padding: 20px; background-color: #f7f9fa; }
        .card { max-width: 650px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 8px; border: 1px solid #e0e0e0; }
        .header { border-bottom: 2px solid #005a36; padding-bottom: 15px; margin-bottom: 20px; }
        .logo { font-size: 24px; font-weight: bold; color: #005a36; }
        .slogan { font-size: 13px; color: #666666; font-style: italic; }
        .alert-box { background-color: #fff8e1; border-left: 4px solid #ffb300; padding: 15px; margin: 20px 0; border-radius: 4px; font-size: 14px; color: #856404; }
        .footer { font-size: 12px; color: #777777; margin-top: 30px; border-top: 1px solid #eeeeee; padding-top: 15px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { border: 1px solid #dddddd; padding: 8px 12px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <div class="logo">ETOF SARL</div>
            <div class="slogan">« Une nouvelle vision du monde des affaires »</div>
        </div>
        <h2>{$title}</h2>
        <p>{$intro}</p>
        <div class="alert-box">
            {$disclaimer}
        </div>
        <h3>{$summaryHtml['title']}</h3>
        {$summaryHtml['content']}
        <div class="footer">
            ETOF SARL &bull; Abidjan, Cocody, Angré Oscars &bull; Côte d’Ivoire<br>
            Ceci est un message automatique, merci de ne pas y répondre directement.
        </div>
    </div>
</body>
</html>
HTML;
    }

    /**
     * Construit le corps HTML complet de l'e-mail de notification pour l'administrateur.
     *
     * @param array<string, mixed> $data
     * @param list<array<string, mixed>> $items
     * @param array<string, mixed>|null $vehicle
     */
    private static function buildAdminEmailHtml(array $data, array $items, ?array $vehicle): string
    {
        $reference = htmlspecialchars((string) $data['reference'], ENT_QUOTES, 'UTF-8');
        $fullName = htmlspecialchars((string) $data['full_name'], ENT_QUOTES, 'UTF-8');
        $company = htmlspecialchars((string) ($data['company'] ?? 'Non renseignée'), ENT_QUOTES, 'UTF-8');
        $email = htmlspecialchars((string) $data['email'], ENT_QUOTES, 'UTF-8');
        $phone = htmlspecialchars((string) $data['phone'], ENT_QUOTES, 'UTF-8');
        $type = htmlspecialchars((string) $data['type'], ENT_QUOTES, 'UTF-8');
        $activity = htmlspecialchars((string) $data['activity'], ENT_QUOTES, 'UTF-8');
        $message = nl2br(htmlspecialchars((string) ($data['message'] ?? 'Aucun message'), ENT_QUOTES, 'UTF-8'));
        $ipHash = htmlspecialchars((string) ($data['ip_hash'] ?? 'N/A'), ENT_QUOTES, 'UTF-8');
        $date = date('d/m/Y H:i:s');

        $summaryHtml = self::renderSummaryTable($data, $items, $vehicle, 'fr');

        return <<<HTML
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.5; color: #333333; margin: 0; padding: 20px; background-color: #f7f9fa; }
        .card { max-width: 700px; margin: 0 auto; background: #ffffff; padding: 25px; border-radius: 8px; border: 1px solid #d0d7de; }
        .header { background: #005a36; color: #ffffff; padding: 15px; border-radius: 6px; margin-bottom: 20px; }
        .header h2 { margin: 0; font-size: 18px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { border: 1px solid #dddddd; padding: 8px 12px; font-size: 14px; text-align: left; }
        th { background-color: #f6f8fa; width: 30%; }
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <h2>Nouvelle Demande Client &bull; {$reference}</h2>
        </div>
        <table>
            <tr><th>Référence</th><td><strong>{$reference}</strong></td></tr>
            <tr><th>Type</th><td>{$type}</td></tr>
            <tr><th>Activité</th><td>{$activity}</td></tr>
            <tr><th>Client</th><td>{$fullName}</td></tr>
            <tr><th>Société</th><td>{$company}</td></tr>
            <tr><th>Email</th><td><a href="mailto:{$email}">{$email}</a></td></tr>
            <tr><th>Téléphone</th><td><a href="tel:{$phone}">{$phone}</a></td></tr>
            <tr><th>Date de réception</th><td>{$date}</td></tr>
            <tr><th>Empreinte IP (SHA-256)</th><td><code>{$ipHash}</code></td></tr>
        </table>

        <h3>Contenu & Spécifications de la demande</h3>
        {$summaryHtml['content']}

        <h3>Message du client</h3>
        <div style="background: #fdfdfd; border: 1px solid #e1e4e8; padding: 15px; border-radius: 4px;">
            {$message}
        </div>
    </div>
</body>
</html>
HTML;
    }

    /**
     * Génère un tableau récapitulatif HTML des articles ou du véhicule concerné.
     *
     * @param array<string, mixed> $data
     * @param list<array<string, mixed>> $items
     * @param array<string, mixed>|null $vehicle
     * @return array{title: string, content: string}
     */
    private static function renderSummaryTable(array $data, array $items, ?array $vehicle, string $lang): array
    {
        $isEn = ($lang === 'en');

        if (!empty($items)) {
            $title = $isEn ? "Requested Items" : "Articles demandés";
            $html = "<table><thead><tr><th>" . ($isEn ? "Article" : "Désignation") . "</th><th>" . ($isEn ? "Quantity" : "Quantité") . "</th><th>" . ($isEn ? "Unit Price" : "Prix unitaire") . "</th></tr></thead><tbody>";
            foreach ($items as $item) {
                $label = htmlspecialchars((string) $item['label_snapshot'], ENT_QUOTES, 'UTF-8');
                $qty = (int) $item['quantity'];
                $price = $item['unit_price_snapshot'] !== null
                    ? number_format((float) $item['unit_price_snapshot'], 0, ',', ' ') . ' FCFA'
                    : ($isEn ? 'On request' : 'Sur demande');
                $html .= "<tr><td>{$label}</td><td>{$qty}</td><td>{$price}</td></tr>";
            }
            $html .= "</tbody></table>";
            return ['title' => $title, 'content' => $html];
        }

        if ($vehicle !== null) {
            $title = $isEn ? "Selected Vehicle" : "Véhicule sélectionné";
            $brandModel = htmlspecialchars($vehicle['brand'] . ' ' . $vehicle['model'], ENT_QUOTES, 'UTF-8');
            $year = (int) $vehicle['year'];
            $startDate = !empty($data['start_date']) ? htmlspecialchars((string) $data['start_date'], ENT_QUOTES, 'UTF-8') : null;
            $endDate = !empty($data['end_date']) ? htmlspecialchars((string) $data['end_date'], ENT_QUOTES, 'UTF-8') : null;

            $html = "<table>";
            $html .= "<tr><th>" . ($isEn ? "Vehicle" : "Véhicule") . "</th><td>{$brandModel} ({$year})</td></tr>";
            if ($startDate !== null) {
                $html .= "<tr><th>" . ($isEn ? "Start Date" : "Date de début") . "</th><td>{$startDate}</td></tr>";
            }
            if ($endDate !== null) {
                $html .= "<tr><th>" . ($isEn ? "End Date" : "Date de fin") . "</th><td>{$endDate}</td></tr>";
            }
            $html .= "</table>";
            return ['title' => $title, 'content' => $html];
        }

        if (!empty($data['details'])) {
            $title = $isEn ? "Request Details" : "Détails de la demande";
            $details = is_string($data['details']) ? (json_decode($data['details'], true) ?? []) : $data['details'];
            $html = "<table>";
            foreach ($details as $k => $v) {
                $label = htmlspecialchars((string) $k, ENT_QUOTES, 'UTF-8');
                $val = htmlspecialchars(is_array($v) ? json_encode($v) : (string) $v, ENT_QUOTES, 'UTF-8');
                $html .= "<tr><th>{$label}</th><td>{$val}</td></tr>";
            }
            $html .= "</table>";
            return ['title' => $title, 'content' => $html];
        }

        return [
            'title' => $isEn ? "Message Information" : "Informations du message",
            'content' => "<p>" . ($isEn ? "General contact inquiry." : "Prise de contact générale.") . "</p>",
        ];
    }
}
