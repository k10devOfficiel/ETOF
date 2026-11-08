<?php

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use App\Core\Config;
use App\Core\ErrorHandler;

// Configuration de l'environnement de test
Config::load(__DIR__ . '/..');
ErrorHandler::register(__DIR__ . '/../storage/logs');
