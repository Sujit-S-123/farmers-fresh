<?php
// Shared helpers for every API file: database, JSON responses, sessions and role checks.
require_once __DIR__ . '/config.php';

// Allow the React dev server to call the API directly (when not using the Vite proxy)
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('#^http://(localhost|127\.0\.0\.1)(:\d+)?$#', $origin)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
}
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(204); exit; }

header('Content-Type: application/json; charset=utf-8');

session_set_cookie_params(['httponly' => true, 'samesite' => 'Lax', 'path' => '/']);
session_name('FFSESSID');
session_start();

function db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $pdo = new PDO('mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4', DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
        } catch (PDOException $e) {
            fail('Could not connect to the database. Check backend/config.php and that MySQL is running.', 500);
        }
    }
    return $pdo;
}

function ok($data = [], int $code = 200): never {
    http_response_code($code);
    echo json_encode(['ok' => true, 'data' => $data], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function fail(string $message, int $code = 400): never {
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $message]);
    exit;
}

// JSON body of a POST request (falls back to form fields)
function body(): array {
    static $data = null;
    if ($data === null) {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw ?: '[]', true);
        if (!is_array($data)) $data = $_POST;
    }
    return $data;
}

function input(string $key, $default = null) {
    $b = body();
    $v = $b[$key] ?? $_GET[$key] ?? $default;
    return is_string($v) ? trim($v) : $v;
}

function action(): string { return $_GET['action'] ?? ''; }

function require_method(string $method): void {
    if ($_SERVER['REQUEST_METHOD'] !== $method) fail("Use $method for this request.", 405);
}

function current_user(): ?array {
    if (empty($_SESSION['uid'])) return null;
    static $user = false;
    if ($user === false) {
        $st = db()->prepare('SELECT id,name,email,role,phone,district,village,address,farm_name,is_approved,is_active,created_at FROM users WHERE id=?');
        $st->execute([$_SESSION['uid']]);
        $user = $st->fetch() ?: null;
        if ($user && !$user['is_active']) { $_SESSION = []; $user = null; }
    }
    return $user;
}

function require_role(string ...$roles): array {
    $u = current_user();
    if (!$u) fail('Please log in to continue.', 401);
    if ($roles && !in_array($u['role'], $roles, true)) fail('You do not have access to this page.', 403);
    if ($u['role'] === 'farmer' && !$u['is_approved'] && in_array('farmer', $roles, true)) {
        fail('Your farmer account is waiting for admin approval.', 403);
    }
    return $u;
}

// SQL snippet that resolves the picture shown for a product
const IMAGE_SQL = 'COALESCE(p.custom_image, c.image_url)';
