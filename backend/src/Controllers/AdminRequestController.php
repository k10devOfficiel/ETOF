<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use App\Services\MailService;
use PDO;

/**
 * Contrôleur d'administration pour la gestion des demandes clients (suivi, validation, export CSV et statistiques).
 */
final class AdminRequestController
{
    /**
     * Liste paginée des demandes avec filtres multiples et recherche (GET /api/admin/requests).
     */
    public function index(Request $request): Response
    {
        $pdo = Database::getConnection();

        $page = max(1, (int) $request->getQuery('page', 1));
        $perPage = min(100, max(1, (int) $request->getQuery('per_page', 12)));
        $offset = ($page - 1) * $perPage;

        $typeParam = $request->getQuery('type');
        $activityParam = $request->getQuery('activity');
        $statusParam = $request->getQuery('status');
        $dateFrom = $request->getQuery('date_from');
        $dateTo = $request->getQuery('date_to');
        $searchParam = $request->getQuery('q');

        $sortBy = strtolower((string) $request->getQuery('sort_by', 'created_at'));
        $order = strtolower((string) $request->getQuery('order', 'desc')) === 'asc' ? 'ASC' : 'DESC';

        $allowedSorts = [
            'created_at' => 'r.created_at',
            'reference' => 'r.reference',
            'status' => 'r.status',
            'type' => 'r.type',
            'id' => 'r.id',
        ];
        $sortColumn = $allowedSorts[$sortBy] ?? 'r.created_at';

        [$whereSql, $params] = $this->buildFilterConditions(
            $typeParam,
            $activityParam,
            $statusParam,
            $dateFrom,
            $dateTo,
            $searchParam
        );

        $countSql = "SELECT COUNT(*) FROM requests r WHERE {$whereSql}";
        $countStmt = $pdo->prepare($countSql);
        foreach ($params as $k => $v) {
            $countStmt->bindValue($k, $v, PDO::PARAM_STR);
        }
        $countStmt->execute();
        $total = (int) $countStmt->fetchColumn();

        $sql = "SELECT r.*, 
                       v.brand AS vehicle_brand, v.model AS vehicle_model,
                       (SELECT COUNT(*) FROM request_items ri WHERE ri.request_id = r.id) AS items_count
                FROM requests r
                LEFT JOIN vehicles v ON r.vehicle_id = v.id
                WHERE {$whereSql}
                ORDER BY {$sortColumn} {$order}, r.id ASC
                LIMIT :limit OFFSET :offset";

        $stmt = $pdo->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v, PDO::PARAM_STR);
        }
        $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $rows = $stmt->fetchAll();
        $items = array_map([$this, 'formatRequestRow'], $rows);

        return Response::success([
            'items' => $items,
            'pagination' => [
                'page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'total_pages' => (int) ceil($total / $perPage),
            ],
        ]);
    }

    /**
     * Consultation détaillée d'une demande avec articles et véhicule lié (GET /api/admin/requests/{id}).
     *
     * @param array<string, string> $params
     */
    public function show(Request $request, array $params): Response
    {
        $pdo = Database::getConnection();
        $id = (int) ($params['id'] ?? 0);

        $stmt = $pdo->prepare("SELECT r.*, v.brand AS vehicle_brand, v.model AS vehicle_model, v.year AS vehicle_year, v.status AS vehicle_status
                               FROM requests r
                               LEFT JOIN vehicles v ON r.vehicle_id = v.id
                               WHERE r.id = :id LIMIT 1");
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        $row = $stmt->fetch();

        if ($row === false) {
            return Response::error('NOT_FOUND', 'Demande introuvable.', 404);
        }

        // Récupération des articles associés
        $itemsStmt = $pdo->prepare("SELECT id, product_id, label_snapshot, quantity, unit_price_snapshot 
                                    FROM request_items 
                                    WHERE request_id = :id 
                                    ORDER BY id ASC");
        $itemsStmt->bindValue(':id', $id, PDO::PARAM_INT);
        $itemsStmt->execute();
        $items = $itemsStmt->fetchAll();

        $formatted = $this->formatRequestRow($row);
        $formatted['items'] = array_map(function (array $it): array {
            return [
                'id' => (int) $it['id'],
                'product_id' => $it['product_id'] !== null ? (int) $it['product_id'] : null,
                'label' => (string) $it['label_snapshot'],
                'quantity' => (int) $it['quantity'],
                'unit_price' => $it['unit_price_snapshot'] !== null ? (int) $it['unit_price_snapshot'] : null,
            ];
        }, $items);

        if ($row['vehicle_id'] !== null) {
            $formatted['vehicle'] = [
                'id' => (int) $row['vehicle_id'],
                'brand' => (string) ($row['vehicle_brand'] ?? ''),
                'model' => (string) ($row['vehicle_model'] ?? ''),
                'year' => isset($row['vehicle_year']) ? (int) $row['vehicle_year'] : null,
                'status' => (string) ($row['vehicle_status'] ?? ''),
            ];
        }

        return Response::success($formatted);
    }

    /**
     * Mise à jour du statut et de la note interne (PATCH /api/admin/requests/{id}).
     *
     * @param array<string, string> $params
     */
    public function update(Request $request, array $params): Response
    {
        $pdo = Database::getConnection();
        $id = (int) ($params['id'] ?? 0);
        $body = $request->getBody();

        $stmt = $pdo->prepare("SELECT * FROM requests WHERE id = :id LIMIT 1");
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        $current = $stmt->fetch();

        if ($current === false) {
            return Response::error('NOT_FOUND', 'Demande introuvable.', 404);
        }

        $oldStatus = (string) $current['status'];
        $newStatus = isset($body['status']) ? strtolower(trim((string) $body['status'])) : $oldStatus;

        $allowedStatuses = ['new', 'in_progress', 'confirmed', 'rejected', 'closed'];
        if (!in_array($newStatus, $allowedStatuses, true)) {
            return Response::error('VALIDATION_FAILED', 'Statut non autorisé.', 422, [
                'status' => ["Le statut doit être parmi : " . implode(', ', $allowedStatuses)],
            ]);
        }

        $internalNote = array_key_exists('internal_note', $body)
            ? (trim((string) $body['internal_note']) !== '' ? trim((string) $body['internal_note']) : null)
            : $current['internal_note'];

        // Mise à jour explicite du véhicule liée à la confirmation d'une réservation
        $updateVehicle = ($body['update_vehicle'] ?? false) === true
            || ($body['update_vehicle'] ?? '') === '1'
            || ($body['update_vehicle'] ?? '') === 'true';

        $vehicleUpdated = false;
        if ($newStatus === 'confirmed' && $current['type'] === 'reservation' && !empty($current['vehicle_id'])) {
            if ($updateVehicle) {
                $vehStmt = $pdo->prepare("UPDATE vehicles SET status = 'reserved', updated_at = NOW() WHERE id = :vehicle_id");
                $vehStmt->bindValue(':vehicle_id', (int) $current['vehicle_id'], PDO::PARAM_INT);
                $vehStmt->execute();
                $vehicleUpdated = true;
            }
        }

        // Mise à jour de la demande
        $upSql = "UPDATE requests SET status = :status, internal_note = :internal_note, updated_at = NOW() WHERE id = :id";
        $upStmt = $pdo->prepare($upSql);
        $upStmt->bindValue(':status', $newStatus, PDO::PARAM_STR);
        $upStmt->bindValue(':internal_note', $internalNote, PDO::PARAM_STR);
        $upStmt->bindValue(':id', $id, PDO::PARAM_INT);
        $upStmt->execute();

        // Envoi d'un e-mail neutre au client en cas de confirmation ou de refus
        if ($newStatus !== $oldStatus && in_array($newStatus, ['confirmed', 'rejected'], true)) {
            MailService::sendStatusChangeEmail($current, $newStatus);
        }

        return Response::success([
            'id' => $id,
            'reference' => (string) $current['reference'],
            'previous_status' => $oldStatus,
            'current_status' => $newStatus,
            'vehicle_status_updated' => $vehicleUpdated,
            'message' => 'Demande mise à jour avec succès.',
        ]);
    }

    /**
     * Export CSV conforme avec UTF-8 BOM pour Excel et séparateur point-virgule (GET /api/admin/requests/export).
     */
    public function export(Request $request): void
    {
        $pdo = Database::getConnection();

        $typeParam = $request->getQuery('type');
        $activityParam = $request->getQuery('activity');
        $statusParam = $request->getQuery('status');
        $dateFrom = $request->getQuery('date_from');
        $dateTo = $request->getQuery('date_to');
        $searchParam = $request->getQuery('q');

        [$whereSql, $params] = $this->buildFilterConditions(
            $typeParam,
            $activityParam,
            $statusParam,
            $dateFrom,
            $dateTo,
            $searchParam
        );

        $sql = "SELECT r.*, 
                       v.brand AS vehicle_brand, v.model AS vehicle_model,
                       (SELECT COUNT(*) FROM request_items ri WHERE ri.request_id = r.id) AS items_count
                FROM requests r
                LEFT JOIN vehicles v ON r.vehicle_id = v.id
                WHERE {$whereSql}
                ORDER BY r.created_at DESC, r.id DESC";

        $stmt = $pdo->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v, PDO::PARAM_STR);
        }
        $stmt->execute();
        $rows = $stmt->fetchAll();

        $filename = 'export-demandes-' . date('Y-m-d') . '.csv';

        if (!headers_sent()) {
            header('Content-Type: text/csv; charset=utf-8');
            header("Content-Disposition: attachment; filename=\"{$filename}\"");
            header('Pragma: no-cache');
            header('Expires: 0');
        }

        // BOM UTF-8 indispensable pour qu'Excel ouvre le fichier sans altérer les accents
        echo "\xEF\xBB\xBF";

        $out = fopen('php://output', 'w');
        if ($out === false) {
            exit;
        }

        // Entêtes du tableau CSV (séparateur point-virgule)
        $headers = [
            'Référence',
            'Type',
            'Activité',
            'Statut',
            'Langue',
            'Nom complet',
            'Société',
            'Email',
            'Téléphone',
            'Véhicule',
            'Date début',
            'Date fin',
            'Nombre articles',
            'Date création',
            'Note interne',
        ];

        fputcsv($out, $headers, ';');

        foreach ($rows as $row) {
            $vehicleText = !empty($row['vehicle_brand'])
                ? "{$row['vehicle_brand']} {$row['vehicle_model']}"
                : '';

            $line = [
                (string) $row['reference'],
                (string) $row['type'],
                (string) $row['activity'],
                (string) $row['status'],
                (string) $row['lang'],
                (string) $row['full_name'],
                (string) ($row['company'] ?? ''),
                (string) $row['email'],
                (string) $row['phone'],
                $vehicleText,
                (string) ($row['start_date'] ?? ''),
                (string) ($row['end_date'] ?? ''),
                (string) ($row['items_count'] ?? '0'),
                (string) $row['created_at'],
                (string) ($row['internal_note'] ?? ''),
            ];

            fputcsv($out, $line, ';');
        }

        fclose($out);
        exit;
    }

    /**
     * Statistiques globales des demandes par statut et par activité (GET /api/admin/stats).
     */
    public function stats(Request $request): Response
    {
        $pdo = Database::getConnection();

        // Répartition par statut
        $statusStmt = $pdo->query("SELECT status, COUNT(*) as count FROM requests GROUP BY status");
        $statusRows = $statusStmt !== false ? $statusStmt->fetchAll() : [];

        $allStatuses = ['new', 'in_progress', 'confirmed', 'rejected', 'closed'];
        $byStatus = array_fill_keys($allStatuses, 0);
        $total = 0;

        foreach ($statusRows as $r) {
            $st = (string) $r['status'];
            $cnt = (int) $r['count'];
            $byStatus[$st] = $cnt;
            $total += $cnt;
        }

        // Répartition par activité
        $actStmt = $pdo->query("SELECT activity, COUNT(*) as count FROM requests GROUP BY activity");
        $actRows = $actStmt !== false ? $actStmt->fetchAll() : [];

        $allActivities = ['farm', 'vehicle', 'office', 'fuel', 'general'];
        $byActivity = array_fill_keys($allActivities, 0);

        foreach ($actRows as $r) {
            $ac = (string) $r['activity'];
            $byActivity[$ac] = (int) $r['count'];
        }

        return Response::success([
            'total' => $total,
            'by_status' => $byStatus,
            'by_activity' => $byActivity,
            'timestamp' => date('c'),
        ]);
    }

    /**
     * Construit les clauses WHERE et le tableau de paramètres préparés pour le filtrage.
     *
     * @return array{0: string, 1: array<string, string>}
     */
    private function buildFilterConditions(
        mixed $type,
        mixed $activity,
        mixed $status,
        mixed $dateFrom,
        mixed $dateTo,
        mixed $search
    ): array {
        $conditions = ['1=1'];
        $params = [];

        if (is_string($type) && trim($type) !== '') {
            $conditions[] = 'r.type = :type';
            $params[':type'] = strtolower(trim($type));
        }

        if (is_string($activity) && trim($activity) !== '') {
            $conditions[] = 'r.activity = :activity';
            $params[':activity'] = strtolower(trim($activity));
        }

        if (is_string($status) && trim($status) !== '') {
            $conditions[] = 'r.status = :status';
            $params[':status'] = strtolower(trim($status));
        }

        if (is_string($dateFrom) && trim($dateFrom) !== '') {
            $conditions[] = 'DATE(r.created_at) >= :date_from';
            $params[':date_from'] = trim($dateFrom);
        }

        if (is_string($dateTo) && trim($dateTo) !== '') {
            $conditions[] = 'DATE(r.created_at) <= :date_to';
            $params[':date_to'] = trim($dateTo);
        }

        if (is_string($search) && trim($search) !== '') {
            $term = '%' . trim($search) . '%';
            $conditions[] = '(r.full_name LIKE :q OR r.email LIKE :q OR r.reference LIKE :q OR r.phone LIKE :q OR r.company LIKE :q)';
            $params[':q'] = $term;
        }

        return [implode(' AND ', $conditions), $params];
    }

    /**
     * Formate un enregistrement de demande pour la réponse API.
     *
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function formatRequestRow(array $row): array
    {
        $details = null;
        if (!empty($row['details'])) {
            $decoded = json_decode((string) $row['details'], true);
            if (is_array($decoded)) {
                $details = $decoded;
            }
        }

        return [
            'id' => (int) $row['id'],
            'reference' => (string) $row['reference'],
            'type' => (string) $row['type'],
            'activity' => (string) $row['activity'],
            'status' => (string) $row['status'],
            'lang' => (string) $row['lang'],
            'full_name' => (string) $row['full_name'],
            'company' => $row['company'] !== null ? (string) $row['company'] : null,
            'email' => (string) $row['email'],
            'phone' => (string) $row['phone'],
            'message' => $row['message'] !== null ? (string) $row['message'] : null,
            'details' => $details,
            'vehicle_id' => $row['vehicle_id'] !== null ? (int) $row['vehicle_id'] : null,
            'vehicle_name' => !empty($row['vehicle_brand']) ? "{$row['vehicle_brand']} {$row['vehicle_model']}" : null,
            'start_date' => $row['start_date'] !== null ? (string) $row['start_date'] : null,
            'end_date' => $row['end_date'] !== null ? (string) $row['end_date'] : null,
            'items_count' => isset($row['items_count']) ? (int) $row['items_count'] : 0,
            'internal_note' => $row['internal_note'] !== null ? (string) $row['internal_note'] : null,
            'created_at' => (string) $row['created_at'],
            'updated_at' => (string) $row['updated_at'],
        ];
    }
}

