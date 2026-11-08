<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\Database;
use App\Core\Validator;
use Exception;
use PDO;

/**
 * Service métier de traitement des demandes (devis, commandes, réservations, achats, contacts).
 */
final class RequestService
{
    /**
     * Traite et enregistre une nouvelle demande client.
     *
     * @param array<string, mixed> $data Données brutes soumises par le client
     * @param string $ip Adresse IP du client
     * @return array{
     *     reference: string,
     *     type: string,
     *     created_at: string
     * }
     *
     * @throws ValidationException En cas de validation invalide
     * @throws Exception En cas d'erreur système
     */
    public static function createRequest(array $data, string $ip): array
    {
        $validator = new Validator();
        $lang = in_array(strtolower((string) ($data['lang'] ?? '')), ['fr', 'en'], true)
            ? strtolower((string) $data['lang'])
            : 'fr';

        // 1. Validation de base
        $baseRules = [
            'type' => 'required|in:quote,order,reservation,purchase,contact',
            'activity' => 'required|in:farm,vehicle,office,fuel,general',
            'full_name' => 'required|min:2|max:150',
            'email' => 'required|email|max:191',
            'phone' => 'required|phone|max:50',
            'company' => 'max:150',
            'message' => 'max:5000',
        ];

        $validator->validate($data, $baseRules);
        $errors = $validator->getErrors();

        // Vérification obligatoire du consentement
        $consent = $data['consent'] ?? null;
        $isConsentAccepted = ($consent === true || $consent === 1 || $consent === '1' || $consent === 'true');
        if (!$isConsentAccepted) {
            $errors['consent'] = ["Vous devez obligatoirement accepter la politique de traitement des données."];
        }

        $type = (string) ($data['type'] ?? '');
        $activity = (string) ($data['activity'] ?? '');
        $pdo = Database::getConnection();

        $processedItems = [];
        $vehicleData = null;

        // 2. Règles spécifiques aux commandes et devis avec articles
        if ($type === 'order' || ($type === 'quote' && !empty($data['items']))) {
            $rawItems = $data['items'] ?? null;
            if ($type === 'order' && (!is_array($rawItems) || empty($rawItems))) {
                $errors['items'] = ["La liste des articles est obligatoire pour une commande."];
            } elseif (is_array($rawItems) && !empty($rawItems)) {
                $productIds = [];
                foreach ($rawItems as $idx => $it) {
                    if (!is_array($it) || empty($it['product_id']) || empty($it['quantity'])) {
                        $errors["items.{$idx}"] = ["Chaque article doit comporter un product_id et une quantity valide."];
                        continue;
                    }
                    $pId = (int) $it['product_id'];
                    $qty = (int) $it['quantity'];

                    if ($qty < 1) {
                        $errors["items.{$idx}.quantity"] = ["La quantité doit être supérieure ou égale à 1."];
                    }
                    $productIds[$pId] = ($productIds[$pId] ?? 0) + $qty;
                }

                if (empty($errors)) {
                    foreach ($productIds as $pId => $qty) {
                        $stmt = $pdo->prepare("SELECT id, name_fr, name_en, price, min_quantity, is_orderable, is_available, is_active 
                                              FROM products WHERE id = :id LIMIT 1");
                        $stmt->bindValue(':id', $pId, PDO::PARAM_INT);
                        $stmt->execute();
                        $product = $stmt->fetch();

                        if ($product === false || (int) $product['is_active'] !== 1) {
                            $errors['items'] = ["Le produit #{$pId} est introuvable ou n'est plus actif."];
                            break;
                        }

                        if ($type === 'order') {
                            if ((int) $product['is_orderable'] !== 1) {
                                $errors['items'] = ["Le produit '{$product['name_fr']}' ne permet pas la commande directe."];
                                break;
                            }
                            if ((int) $product['is_available'] !== 1) {
                                $errors['items'] = ["Le produit '{$product['name_fr']}' est actuellement indisponible."];
                                break;
                            }
                        }

                        $minQty = (int) $product['min_quantity'];
                        if ($qty < $minQty) {
                            $errors['items'] = ["La quantité minimale pour '{$product['name_fr']}' est de {$minQty}."];
                            break;
                        }

                        // Détermination du snapshot de désignation et de prix (le prix client est strictement ignoré)
                        $labelSnapshot = ($lang === 'en' && !empty($product['name_en']))
                            ? (string) $product['name_en']
                            : (string) $product['name_fr'];

                        $unitPriceSnapshot = $product['price'] !== null ? (int) $product['price'] : null;

                        $processedItems[] = [
                            'product_id' => $pId,
                            'label_snapshot' => $labelSnapshot,
                            'quantity' => $qty,
                            'unit_price_snapshot' => $unitPriceSnapshot,
                        ];
                    }
                }
            }
        }

        // 3. Règles spécifiques aux réservations et achats de véhicules
        if ($type === 'reservation' || $type === 'purchase') {
            $vehicleId = $data['vehicle_id'] ?? null;
            if (empty($vehicleId) || !is_numeric($vehicleId)) {
                $errors['vehicle_id'] = ["Le champ vehicle_id est obligatoire pour une " . ($type === 'reservation' ? "réservation." : "demande d'achat.")];
            } else {
                $vStmt = $pdo->prepare("SELECT id, brand, model, year, status, is_active FROM vehicles WHERE id = :id LIMIT 1");
                $vStmt->bindValue(':id', (int) $vehicleId, PDO::PARAM_INT);
                $vStmt->execute();
                $vehicle = $vStmt->fetch();

                if ($vehicle === false || (int) $vehicle['is_active'] !== 1) {
                    $errors['vehicle_id'] = ["Le véhicule sélectionné est introuvable ou inactif."];
                } elseif (in_array((string) $vehicle['status'], ['sold', 'unavailable'], true)) {
                    $errors['vehicle_id'] = ["Ce véhicule est actuellement vendu ou indisponible."];
                } else {
                    $vehicleData = $vehicle;
                }
            }

            // Pour une réservation : dates obligatoires et cohérentes
            if ($type === 'reservation') {
                $startDate = (string) ($data['start_date'] ?? '');
                $endDate = (string) ($data['end_date'] ?? '');

                if ($startDate === '') {
                    $errors['start_date'] = ["La date de début de réservation est obligatoire."];
                } elseif (!self::isValidDate($startDate)) {
                    $errors['start_date'] = ["La date de début doit être au format YYYY-MM-DD."];
                }

                if ($endDate === '') {
                    $errors['end_date'] = ["La date de fin de réservation est obligatoire."];
                } elseif (!self::isValidDate($endDate)) {
                    $errors['end_date'] = ["La date de fin doit être au format YYYY-MM-DD."];
                }

                // Vérification chronologique des dates
                if (empty($errors['start_date']) && empty($errors['end_date'])) {
                    $today = date('Y-m-d');
                    if ($startDate < $today) {
                        $errors['start_date'] = ["La date de début ne peut pas être dans le passé."];
                    }
                    if ($endDate <= $startDate) {
                        $errors['end_date'] = ["La date de fin doit être postérieure à la date de début."];
                    }

                    // Contrôle d'absence de chevauchement sur une période déjà confirmée
                    if (empty($errors['start_date']) && empty($errors['end_date'])) {
                        $overlapStmt = $pdo->prepare(
                            "SELECT id, start_date, end_date FROM requests 
                             WHERE vehicle_id = :vId 
                               AND status = 'confirmed'
                               AND start_date IS NOT NULL 
                               AND end_date IS NOT NULL
                               AND NOT (end_date < :startDate OR start_date > :endDate)
                             LIMIT 1"
                        );
                        $overlapStmt->bindValue(':vId', (int) $vehicleId, PDO::PARAM_INT);
                        $overlapStmt->bindValue(':startDate', $startDate, PDO::PARAM_STR);
                        $overlapStmt->bindValue(':endDate', $endDate, PDO::PARAM_STR);
                        $overlapStmt->execute();
                        $overlap = $overlapStmt->fetch();

                        if ($overlap !== false) {
                            $errors['start_date'] = [
                                sprintf("Ce véhicule est déjà réservé sur la période demandée (du %s au %s).", $overlap['start_date'], $overlap['end_date'])
                            ];
                        }
                    }
                }
            }
        }

        // 4. Détails spécifiques selon le type ou l'activité
        $details = $data['details'] ?? null;
        if ($type === 'purchase' && is_array($details)) {
            $details = [
                'payment_method' => (string) ($details['payment_method'] ?? 'cash'),
                'trade_in' => !empty($details['trade_in']) ? 'yes' : 'no',
                'trade_in_details' => (string) ($details['trade_in_details'] ?? ''),
            ];
        } elseif ($type === 'reservation' && is_array($details)) {
            $details = [
                'pickup_location' => (string) ($details['pickup_location'] ?? 'Abidjan'),
                'with_driver' => !empty($details['with_driver']) ? 'yes' : 'no',
                'has_valid_license' => !empty($details['has_valid_license']) ? 'yes' : 'no',
            ];
        } elseif ($activity === 'fuel' && is_array($details)) {
            // Assainissement des informations de transport
            $details = [
                'service_type' => (string) ($details['service_type'] ?? 'transport'),
                'estimated_volume' => (string) ($details['estimated_volume'] ?? ''),
                'origin' => (string) ($details['origin'] ?? ''),
                'destination' => (string) ($details['destination'] ?? ''),
                'desired_date' => (string) ($details['desired_date'] ?? ''),
            ];
        }

        // Si des erreurs de validation sont survenues, lever une exception avec structure de champs
        if (!empty($errors)) {
            throw new ValidationException("Les données transmises sont incomplètes ou invalides.", $errors);
        }

        // 5. Enregistrement transactionnel en base de données
        $pdo->beginTransaction();
        try {
            $reference = self::generateNextReference($pdo);
            $ipHash = RateLimiter::hashIp($ip);

            $insertSql = "INSERT INTO requests (
                reference, type, activity, status, lang,
                full_name, company, email, phone, message,
                details, vehicle_id, start_date, end_date,
                consent, ip_hash, internal_note, created_at, updated_at
            ) VALUES (
                :reference, :type, :activity, 'new', :lang,
                :full_name, :company, :email, :phone, :message,
                :details, :vehicle_id, :start_date, :end_date,
                1, :ip_hash, NULL, NOW(), NOW()
            )";

            $stmt = $pdo->prepare($insertSql);
            $stmt->bindValue(':reference', $reference, PDO::PARAM_STR);
            $stmt->bindValue(':type', $type, PDO::PARAM_STR);
            $stmt->bindValue(':activity', $activity, PDO::PARAM_STR);
            $stmt->bindValue(':lang', $lang, PDO::PARAM_STR);
            $stmt->bindValue(':full_name', trim((string) $data['full_name']), PDO::PARAM_STR);
            $stmt->bindValue(':company', !empty($data['company']) ? trim((string) $data['company']) : null, PDO::PARAM_STR);
            $stmt->bindValue(':email', strtolower(trim((string) $data['email'])), PDO::PARAM_STR);
            $stmt->bindValue(':phone', trim((string) $data['phone']), PDO::PARAM_STR);
            $stmt->bindValue(':message', !empty($data['message']) ? trim((string) $data['message']) : null, PDO::PARAM_STR);
            $stmt->bindValue(':details', $details !== null ? json_encode($details, JSON_UNESCAPED_UNICODE) : null, PDO::PARAM_STR);
            $stmt->bindValue(':vehicle_id', !empty($data['vehicle_id']) ? (int) $data['vehicle_id'] : null, PDO::PARAM_INT);
            $stmt->bindValue(':start_date', !empty($data['start_date']) ? (string) $data['start_date'] : null, PDO::PARAM_STR);
            $stmt->bindValue(':end_date', !empty($data['end_date']) ? (string) $data['end_date'] : null, PDO::PARAM_STR);
            $stmt->bindValue(':ip_hash', $ipHash, PDO::PARAM_STR);

            $stmt->execute();
            $requestId = (int) $pdo->lastInsertId();

            // Insertion des articles liés
            if (!empty($processedItems)) {
                $itemSql = "INSERT INTO request_items (request_id, product_id, label_snapshot, quantity, unit_price_snapshot) 
                            VALUES (:request_id, :product_id, :label_snapshot, :quantity, :unit_price_snapshot)";
                $itemStmt = $pdo->prepare($itemSql);

                foreach ($processedItems as $it) {
                    $itemStmt->bindValue(':request_id', $requestId, PDO::PARAM_INT);
                    $itemStmt->bindValue(':product_id', $it['product_id'], PDO::PARAM_INT);
                    $itemStmt->bindValue(':label_snapshot', $it['label_snapshot'], PDO::PARAM_STR);
                    $itemStmt->bindValue(':quantity', $it['quantity'], PDO::PARAM_INT);
                    $itemStmt->bindValue(':unit_price_snapshot', $it['unit_price_snapshot'], PDO::PARAM_INT);
                    $itemStmt->execute();
                }
            }

            $pdo->commit();
        } catch (Exception $e) {
            $pdo->rollBack();
            throw $e;
        }

        // 6. Expédition des e-mails en tâche de fond immédiate (tolérance totale aux pannes SMTP)
        $emailPayload = [
            'reference' => $reference,
            'type' => $type,
            'activity' => $activity,
            'lang' => $lang,
            'full_name' => (string) $data['full_name'],
            'company' => (string) ($data['company'] ?? ''),
            'email' => (string) $data['email'],
            'phone' => (string) $data['phone'],
            'message' => (string) ($data['message'] ?? ''),
            'start_date' => $data['start_date'] ?? null,
            'end_date' => $data['end_date'] ?? null,
            'details' => $details,
            'ip_hash' => $ipHash,
        ];

        MailService::sendRequestEmails($emailPayload, $processedItems, $vehicleData);

        return [
            'reference' => $reference,
            'type' => $type,
            'created_at' => date('c'),
        ];
    }

    /**
     * Génère la prochaine référence séquentielle au format ETOF-AAAA-00001 avec verrouillage transactionnel.
     */
    private static function generateNextReference(PDO $pdo): string
    {
        $year = date('Y');
        $prefix = "ETOF-{$year}-";

        $sql = "SELECT reference FROM requests 
                WHERE reference LIKE :prefix 
                ORDER BY id DESC LIMIT 1 FOR UPDATE";

        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(':prefix', $prefix . '%', PDO::PARAM_STR);
        $stmt->execute();

        $lastRef = $stmt->fetchColumn();
        $nextNumber = 1;

        if ($lastRef !== false && is_string($lastRef)) {
            $parts = explode('-', $lastRef);
            $lastSeq = end($parts);
            if (is_numeric($lastSeq)) {
                $nextNumber = ((int) $lastSeq) + 1;
            }
        }

        return sprintf('ETOF-%s-%05d', $year, $nextNumber);
    }

    /**
     * Valide le format de date YYYY-MM-DD.
     */
    private static function isValidDate(string $date): bool
    {
        $d = \DateTimeImmutable::createFromFormat('Y-m-d', $date);
        return $d !== false && $d->format('Y-m-d') === $date;
    }
}

