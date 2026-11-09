<?php

declare(strict_types=1);

namespace App\Services;

/**
 * Service d'authentification à deux facteurs (TOTP - Time-Based One-Time Password).
 * Conforme à la RFC 6238 / RFC 4226 avec algorithme HMAC-SHA1 et fenêtre temporelle de 30 secondes.
 * Fonctionne en pur PHP natif (zéro dépendance externe).
 */
final class TotpService
{
    private const TIME_STEP = 30; // Fenêtre de 30 secondes
    private const CODE_LENGTH = 6;

    /**
     * Valide un code TOTP à 6 chiffres pour un secret Base32 donné avec tolérance de +/- 1 pas (90s).
     */
    public static function verify(string $secret, string $code, int $discrepancy = 1): bool
    {
        $code = trim($code);
        if (strlen($code) !== self::CODE_LENGTH || !ctype_digit($code)) {
            return false;
        }

        $currentTimeSlice = (int) floor(time() / self::TIME_STEP);

        for ($i = -$discrepancy; $i <= $discrepancy; $i++) {
            $calculatedCode = self::generateCode($secret, $currentTimeSlice + $i);
            if (hash_equals($calculatedCode, $code)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Génère le code TOTP pour un pas de temps donné.
     */
    public static function generateCode(string $secret, ?int $timeSlice = null): string
    {
        if ($timeSlice === null) {
            $timeSlice = (int) floor(time() / self::TIME_STEP);
        }

        $secretKey = self::base32Decode($secret);
        if ($secretKey === '') {
            return '';
        }

        // Pack timeSlice en binaire 64-bit big-endian
        $time = chr(0) . chr(0) . chr(0) . chr(0) . pack('N*', $timeSlice);

        // Calcul HMAC-SHA1
        $hmac = hash_hmac('sha1', $time, $secretKey, true);

        // Dérivation dynamique (Dynamic Truncation - RFC 4226)
        $offset = ord(substr($hmac, -1)) & 0x0F;
        $hashPart = substr($hmac, $offset, 4);
        $value = unpack('N', $hashPart)[1] & 0x7FFFFFFF;

        $modulo = 10 ** self::CODE_LENGTH;
        return str_pad((string) ($value % $modulo), self::CODE_LENGTH, '0', STR_PAD_LEFT);
    }

    /**
     * Décode une chaîne Base32 en binaire.
     */
    private static function base32Decode(string $base32): string
    {
        $base32 = strtoupper(trim($base32));
        $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $buffer = 0;
        $bitsLeft = 0;
        $output = '';

        for ($i = 0, $len = strlen($base32); $i < $len; $i++) {
            $char = $base32[$i];
            if ($char === '=') {
                break;
            }
            $val = strpos($alphabet, $char);
            if ($val === false) {
                continue;
            }

            $buffer = ($buffer << 5) | $val;
            $bitsLeft += 5;

            if ($bitsLeft >= 8) {
                $bitsLeft -= 8;
                $output .= chr(($buffer >> $bitsLeft) & 0xFF);
            }
        }

        return $output;
    }
}

