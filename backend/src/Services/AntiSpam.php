<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\Config;
use App\Core\Response;

/**
 * Service de protection anti-spam : piège Honeypot et validation Cloudflare Turnstile.
 */
final class AntiSpam
{
    /**
     * Vérifie si le champ piège Honeypot a été renseigné.
     * Si rempli, le formulaire doit être rejeté silencieusement pour leurrer les robots spammeurs.
     *
     * @param array<string, mixed> $data
     */
    public static function isHoneypotTriggered(array $data, string $fieldName = 'website'): bool
    {
        if (!array_key_exists($fieldName, $data)) {
            return false;
        }

        $value = $data[$fieldName];
        if (is_string($value)) {
            return trim($value) !== '';
        }

        return !empty($value);
    }

    /**
     * Valide le jeton Cloudflare Turnstile auprès des serveurs Cloudflare.
     * Désactivé automatiquement et transparent si TURNSTILE_SECRET est vide.
     */
    public static function verifyTurnstile(?string $token, ?string $clientIp = null): bool
    {
        $secret = (string) Config::get('TURNSTILE_SECRET', '');
        if (trim($secret) === '') {
            // Clé vide : vérification désactivée
            return true;
        }

        if ($token === null || trim($token) === '') {
            return false;
        }

        $postData = [
            'secret' => $secret,
            'response' => $token,
        ];

        if ($clientIp !== null && filter_var($clientIp, FILTER_VALIDATE_IP)) {
            $postData['remoteip'] = $clientIp;
        }

        $ch = curl_init('https://challenges.cloudflare.com/turnstile/v0/siteverify');
        if ($ch === false) {
            return false;
        }

        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => http_build_query($postData),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 5,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);

        $rawResponse = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($rawResponse === false || $httpCode !== 200) {
            return false;
        }

        $result = json_decode((string) $rawResponse, true);

        return is_array($result) && !empty($result['success']);
    }

    /**
     * Retourne une réponse positive factice pour tromper les robots détectés par Honeypot.
     */
    public static function fakeSuccessResponse(string $message = 'Votre demande a bien été prise en compte.'): Response
    {
        return Response::success([
            'message' => $message,
            'processed' => true,
        ]);
    }
}

