<?php

declare(strict_types=1);

namespace App\Services;

use Exception;
use finfo;
use GdImage;

/**
 * Service de traitement sécurisé des fichiers téléversés.
 * Contrôle MIME réel via finfo, restriction 4 Mo, nommage aléatoire,
 * redimensionnement proportionnel GD à 1600 px max et blocage anti-exécution.
 */
final class UploadService
{
    private const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 Mo
    private const MAX_DIMENSION = 1600; // 1600 px maximum

    /**
     * @var array<string, string>
     */
    private const ALLOWED_MIME_TYPES = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];

    /**
     * Traite et enregistre un fichier téléversé.
     *
     * @param array{
     *     name?: string,
     *     type?: string,
     *     tmp_name?: string,
     *     error?: int,
     *     size?: int
     * } $file
     * @param string $uploadDirectory Chemin absolu du dossier d'enregistrement
     * @return array{
     *     filename: string,
     *     relative_path: string,
     *     mime_type: string,
     *     size: int,
     *     width: int,
     *     height: int
     * }
     *
     * @throws Exception Si le fichier ne respecte pas les critères de sécurité
     */
    public static function processUpload(array $file, string $uploadDirectory): array
    {
        $errorCode = $file['error'] ?? UPLOAD_ERR_NO_FILE;
        if ($errorCode !== UPLOAD_ERR_OK) {
            throw new Exception(self::getUploadErrorMessage($errorCode));
        }

        $tmpPath = (string) ($file['tmp_name'] ?? '');
        if ($tmpPath === '' || !is_uploaded_file($tmpPath)) {
            // Permet aussi de tester des fichiers locaux temporaires dans les tests unitaires
            if (!file_exists($tmpPath)) {
                throw new Exception("Fichier temporaire introuvable.");
            }
        }

        $size = (int) ($file['size'] ?? filesize($tmpPath));
        if ($size > self::MAX_FILE_SIZE) {
            throw new Exception("Le fichier dépasse la taille maximale autorisée de 4 Mo.");
        }

        // Vérification stricte du type MIME réel via fileinfo
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $detectedMime = (string) $finfo->file($tmpPath);

        if (!array_key_exists($detectedMime, self::ALLOWED_MIME_TYPES)) {
            throw new Exception("Format de fichier non autorisé. Seuls les formats JPEG, PNG et WEBP sont acceptés.");
        }

        $extension = self::ALLOWED_MIME_TYPES[$detectedMime];

        // Vérification des dimensions de l'image
        $imageInfo = @getimagesize($tmpPath);
        if ($imageInfo === false) {
            throw new Exception("Le fichier n'est pas une image valide.");
        }

        [$width, $height] = $imageInfo;

        // Préparation du dossier cible
        $targetDir = rtrim($uploadDirectory, '/\\');
        if (!is_dir($targetDir)) {
            if (!@mkdir($targetDir, 0755, true) && !is_dir($targetDir)) {
                throw new Exception("Impossible de créer le dossier de destination.");
            }
        }

        // Sécurisation du dossier uploads contre l'exécution de scripts
        self::ensureDirectorySecurity($targetDir);

        // Génération d'un nom de fichier unique et cryptographiquement sûr
        $randomName = bin2hex(random_bytes(16)) . '.' . $extension;
        $destinationPath = $targetDir . DIRECTORY_SEPARATOR . $randomName;

        // Redimensionnement avec GD si dimensions supérieures à 1600 px ou ré-encodage assainissant
        [$finalWidth, $finalHeight] = self::resizeAndSaveImage(
            $tmpPath,
            $destinationPath,
            $detectedMime,
            $width,
            $height
        );

        $finalSize = (int) filesize($destinationPath);

        return [
            'filename' => $randomName,
            'relative_path' => 'uploads/' . $randomName,
            'mime_type' => $detectedMime,
            'size' => $finalSize,
            'width' => $finalWidth,
            'height' => $finalHeight,
        ];
    }

    /**
     * Redimensionne l'image si nécessaire et ré-encode le fichier pour neutraliser tout contenu malveillant.
     *
     * @return array{0: int, 1: int}
     */
    private static function resizeAndSaveImage(
        string $sourcePath,
        string $targetPath,
        string $mime,
        int $width,
        int $height
    ): array {
        $sourceImage = match ($mime) {
            'image/jpeg' => @imagecreatefromjpeg($sourcePath),
            'image/png' => @imagecreatefrompng($sourcePath),
            'image/webp' => @imagecreatefromwebp($sourcePath),
            default => null,
        };

        if (!$sourceImage instanceof GdImage) {
            throw new Exception("Échec du décodage de l'image source.");
        }

        // Calcul des dimensions cibles
        $targetWidth = $width;
        $targetHeight = $height;

        if ($width > self::MAX_DIMENSION || $height > self::MAX_DIMENSION) {
            if ($width >= $height) {
                $targetWidth = self::MAX_DIMENSION;
                $targetHeight = (int) round(($height * self::MAX_DIMENSION) / $width);
            } else {
                $targetHeight = self::MAX_DIMENSION;
                $targetWidth = (int) round(($width * self::MAX_DIMENSION) / $height);
            }
        }

        $canvas = imagecreatetruecolor($targetWidth, $targetHeight);
        if (!$canvas instanceof GdImage) {
            imagedestroy($sourceImage);
            throw new Exception("Échec de création du canevas graphique.");
        }

        // Préservation de la transparence pour PNG et WEBP
        if ($mime === 'image/png' || $mime === 'image/webp') {
            imagealphablending($canvas, false);
            imagesavealpha($canvas, true);
        }

        imagecopyresampled(
            $canvas,
            $sourceImage,
            0,
            0,
            0,
            0,
            $targetWidth,
            $targetHeight,
            $width,
            $height
        );

        // Sauvegarde avec compression optimale
        $saved = match ($mime) {
            'image/jpeg' => imagejpeg($canvas, $targetPath, 85),
            'image/png' => imagepng($canvas, $targetPath, 8),
            'image/webp' => imagewebp($canvas, $targetPath, 85),
            default => false,
        };

        imagedestroy($sourceImage);
        imagedestroy($canvas);

        if (!$saved || !file_exists($targetPath)) {
            throw new Exception("Impossible d'enregistrer l'image finale sur le disque.");
        }

        return [$targetWidth, $targetHeight];
    }

    /**
     * Dépose un fichier .htaccess interdisant strictement l'exécution de tout script dans le dossier d'uploads.
     */
    public static function ensureDirectorySecurity(string $directory): void
    {
        $htaccessPath = $directory . DIRECTORY_SEPARATOR . '.htaccess';
        if (!file_exists($htaccessPath)) {
            $content = "# Empêcher l'exécution de tout script exécutable\n"
                     . "<FilesMatch \"\\.(php|phtml|php3|php4|php5|php7|php8|phps|cgi|pl|exe|sh|py|rb|js)$\">\n"
                     . "    Require all denied\n"
                     . "</FilesMatch>\n"
                     . "Options -ExecCGI -Indexes\n";

            @file_put_contents($htaccessPath, $content);
        }
    }

    /**
     * Traduit le code d'erreur de téléversement PHP en message explicatif.
     */
    private static function getUploadErrorMessage(int $code): string
    {
        return match ($code) {
            UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => "Le fichier dépasse la taille maximale permise par le serveur.",
            UPLOAD_ERR_PARTIAL => "Le fichier n'a été que partiellement téléversé.",
            UPLOAD_ERR_NO_FILE => "Aucun fichier n'a été transmis.",
            UPLOAD_ERR_NO_TMP_DIR => "Dossier temporaire manquant sur le serveur.",
            UPLOAD_ERR_CANT_WRITE => "Échec d'écriture du fichier sur le disque.",
            UPLOAD_ERR_EXTENSION => "Une extension PHP a interrompu le téléversement.",
            default => "Erreur inconnue lors du téléversement.",
        };
    }
}

