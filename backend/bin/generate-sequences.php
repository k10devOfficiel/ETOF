<?php

declare(strict_types=1);

/**
 * Générateur de séquences 3D multi-angles (36 images par activité) pour l'effet de rotation au scroll.
 */

$activities = ['vehicle', 'farm', 'office', 'fuel'];
$outBase = __DIR__ . '/../../frontend/public/sequences';
$frameCount = 36;
$width = 400;
$height = 400;

foreach ($activities as $act) {
    $dir = "{$outBase}/{$act}";
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }

    echo "Génération de la séquence 3D pour [{$act}]...\n";

    for ($i = 1; $i <= $frameCount; $i++) {
        $angle = ($i - 1) * (360 / $frameCount);
        $rad = deg2rad($angle);

        $im = imagecreatetruecolor($width, $height);
        imagealphablending($im, false);
        imagesavealpha($im, true);
        $transparent = imagecolorallocatealpha($im, 0, 0, 0, 127);
        imagefilledrectangle($im, 0, 0, $width, $height, $transparent);
        imagealphablending($im, true);

        // Ombre portée au sol
        $shadowColor = imagecolorallocatealpha($im, 24, 20, 17, 105);
        imagefilledellipse($im, (int) ($width / 2), (int) ($height * 0.82), 220, 48, $shadowColor);

        // Couleurs de la palette ETOF SARL
        $colPrimary = imagecolorallocate($im, 232, 67, 26);     // #E8431A
        $colSecondary = imagecolorallocate($im, 183, 42, 11);   // #B72A0B
        $colAccent = imagecolorallocate($im, 255, 176, 32);     // #FFB020
        $colWhite = imagecolorallocate($im, 255, 255, 255);
        $colDark = imagecolorallocate($im, 24, 20, 17);
        $colGlass = imagecolorallocatealpha($im, 220, 240, 255, 60);

        $cx = $width / 2;
        $cy = $height / 2 + 10;

        if ($act === 'vehicle') {
            // Rendu 3D rotatif d'une silhouette de SUV moderne
            $cos = cos($rad);
            $sin = sin($rad);

            // Châssis principal
            $bodyWidth = 140;
            $bodyLength = 220;
            $carX = $cx + ($sin * 12);
            $carY = $cy;

            // Forme carrosserie
            $carColor = ($cos > 0) ? $colPrimary : $colSecondary;
            imagefilledellipse($im, (int) $carX, (int) $carY, (int) (160 + abs($cos) * 60), (int) (60 + abs($sin) * 30), $carColor);
            imagefilledellipse($im, (int) $carX, (int) ($carY - 26), (int) (110 + abs($cos) * 40), (int) (45 + abs($sin) * 20), $colGlass);

            // Phares avant / arrière
            $lightColor = ($cos >= 0) ? $colAccent : $colSecondary;
            $lx = $carX + ($sin * 70);
            $ly = $carY + ($cos * 20);
            imagefilledellipse($im, (int) $lx, (int) $ly, 16, 12, $lightColor);

            // Roues stylisées en rotation
            $wheelX1 = $carX - (60 * $cos);
            $wheelX2 = $carX + (60 * $cos);
            imagefilledellipse($im, (int) $wheelX1, (int) ($carY + 22), 34, 34, $colDark);
            imagefilledellipse($im, (int) $wheelX2, (int) ($carY + 22), 34, 34, $colDark);
            imagefilledellipse($im, (int) $wheelX1, (int) ($carY + 22), 16, 16, $colAccent);
            imagefilledellipse($im, (int) $wheelX2, (int) ($carY + 22), 16, 16, $colAccent);

        } elseif ($act === 'farm') {
            // Modélisation 3D d'une volaille noble stylisée / panier fermier
            $cos = cos($rad);
            $sin = sin($rad);

            // Corps
            imagefilledellipse($im, (int) $cx, (int) $cy, (int) (110 + abs($cos) * 30), (int) (90 + abs($sin) * 20), $colPrimary);
            // Tête & crête
            $headX = $cx + ($sin * 35);
            $headY = $cy - 50 + ($cos * 10);
            imagefilledellipse($im, (int) $headX, (int) $headY, 44, 44, $colSecondary);
            imagefilledellipse($im, (int) ($headX + 4), (int) ($headY - 22), 20, 24, $colAccent);
            // Aile stylisée
            $wingX = $cx - ($sin * 15);
            imagefilledellipse($im, (int) $wingX, (int) ($cy + 5), (int) (60 + abs($sin) * 20), 40, $colAccent);

        } elseif ($act === 'office') {
            // Modélisation 3D d'un fauteuil de direction ergonomique
            $cos = cos($rad);
            $sin = sin($rad);

            // Dossier haut rotatif
            $backX = $cx + ($sin * 20);
            $backY = $cy - 50;
            imagefilledellipse($im, (int) $backX, (int) $backY, (int) (70 + abs($cos) * 30), 100, $colDark);
            // Assise
            imagefilledellipse($im, (int) $cx, (int) ($cy + 10), 100, 45, $colPrimary);
            // Pied à roulettes chrome / accent
            imagefilledellipse($im, (int) $cx, (int) ($cy + 60), (int) (90 + abs($sin) * 20), 20, $colAccent);

        } elseif ($act === 'fuel') {
            // Modélisation 3D d'une citerne hydrocarbures étalonnée
            $cos = cos($rad);
            $sin = sin($rad);

            // Cylindre de citerne rotatif
            $tankW = (int) (150 + abs($cos) * 60);
            $tankH = (int) (65 + abs($sin) * 25);
            imagefilledellipse($im, (int) $cx, (int) ($cy - 10), $tankW, $tankH, $colPrimary);
            imagefilledellipse($im, (int) ($cx + $sin * 30), (int) ($cy - 10), (int) ($tankW * 0.85), (int) ($tankH * 0.85), $colSecondary);

            // Cabine motrice
            $cabX = $cx + ($sin * 75);
            $cabY = $cy - 5;
            imagefilledrectangle($im, (int) ($cabX - 25), (int) ($cabY - 25), (int) ($cabX + 25), (int) ($cabY + 25), $colAccent);
            imagefilledellipse($im, (int) $cabX, (int) ($cabY - 12), 24, 18, $colGlass);

            // Train de roulement citerne
            imagefilledellipse($im, (int) ($cx - 40), (int) ($cy + 30), 30, 30, $colDark);
            imagefilledellipse($im, (int) ($cx + 40), (int) ($cy + 30), 30, 30, $colDark);
        }

        $outFile = sprintf('%s/%02d.webp', $dir, $i);
        imagewebp($im, $outFile, 85);
        imagedestroy($im);
    }
}

echo "Toutes les séquences 3D multi-angles ont été générées avec succès (4 x 36 = 144 images WebP).\n";

