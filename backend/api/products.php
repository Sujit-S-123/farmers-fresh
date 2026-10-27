<?php
// Product listings: public browsing + farmer management
require_once __DIR__ . '/../lib.php';

const PRODUCT_SELECT = "SELECT p.id, p.farmer_id, p.catalog_id, p.price, p.quantity, p.is_organic, p.is_active, p.notes, p.created_at,
    c.name, c.slug, c.category, c.unit, c.season, c.description, c.benefits, c.typical_price,
    " . IMAGE_SQL . " AS image,
    u.name AS farmer_name, u.farm_name, u.village, u.district,
    (SELECT ROUND(AVG(r.rating),1) FROM reviews r WHERE r.product_id = p.id) AS rating,
    (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id) AS review_count
  FROM products p
  JOIN catalog c ON c.id = p.catalog_id
  JOIN users u ON u.id = p.farmer_id";

// Only listings that buyers may see
const VISIBLE = "p.is_active = 1 AND p.is_deleted = 0 AND u.is_active = 1 AND u.is_approved = 1";

function owned_product(int $id, int $farmerId): array {
    $st = db()->prepare('SELECT * FROM products WHERE id=? AND farmer_id=? AND is_deleted=0');
    $st->execute([$id, $farmerId]);
    return $st->fetch() ?: fail('Product not found.', 404);
}

switch (action()) {

case 'list': // public shop with filters
    $where = [VISIBLE]; $args = [];
    if ($q = input('q'))            { $where[] = '(c.name LIKE ? OR c.description LIKE ? OR u.farm_name LIKE ?)'; array_push($args, "%$q%", "%$q%", "%$q%"); }
    if ($cat = input('category'))   { $where[] = 'c.category = ?'; $args[] = $cat; }
    if ($d = input('district'))     { $where[] = 'u.district = ?'; $args[] = $d; }
    if (is_numeric(input('min')))   { $where[] = 'p.price >= ?'; $args[] = input('min'); }
    if (is_numeric(input('max')))   { $where[] = 'p.price <= ?'; $args[] = input('max'); }
    if (input('organic') === '1')   { $where[] = 'p.is_organic = 1'; }
    if (input('in_stock') === '1')  { $where[] = 'p.quantity > 0'; }
    if ($f = (int) input('farmer')) { $where[] = 'p.farmer_id = ?'; $args[] = $f; }
    $order = match (input('sort', 'new')) {
        'price_asc' => 'p.price ASC', 'price_desc' => 'p.price DESC',
        'name' => 'c.name ASC', 'rating' => 'rating DESC, review_count DESC',
        default => 'p.created_at DESC, p.id DESC',
    };
    $limit = min(100, max(1, (int) input('limit', 100)));
    $st = db()->prepare(PRODUCT_SELECT . ' WHERE ' . implode(' AND ', $where) . " ORDER BY $order LIMIT $limit");
    $st->execute($args);
    ok($st->fetchAll());

case 'get': // product details page
    $st = db()->prepare(PRODUCT_SELECT . ' WHERE p.id = ? AND p.is_deleted = 0');
    $st->execute([(int) input('id')]);
    $p = $st->fetch() ?: fail('This product is no longer available.', 404);
    $st = db()->prepare('SELECT r.id, r.rating, r.comment, r.created_at, u.name FROM reviews r JOIN users u ON u.id=r.consumer_id WHERE r.product_id=? ORDER BY r.created_at DESC');
    $st->execute([$p['id']]);
    $p['reviews'] = $st->fetchAll();
    $st = db()->prepare(PRODUCT_SELECT . ' WHERE ' . VISIBLE . ' AND p.farmer_id = ? AND p.id <> ? LIMIT 4');
    $st->execute([$p['farmer_id'], $p['id']]);
    $p['more_from_farmer'] = $st->fetchAll();
    // Can the logged-in consumer review this? (must have a delivered order containing it)
    $u = current_user(); $p['can_review'] = false;
    if ($u && $u['role'] === 'consumer') {
        $st = db()->prepare("SELECT 1 FROM orders o JOIN order_items i ON i.order_id=o.id WHERE o.consumer_id=? AND i.product_id=? AND o.status='Delivered' LIMIT 1");
        $st->execute([$u['id'], $p['id']]);
        $p['can_review'] = (bool) $st->fetch();
    }
    ok($p);

case 'meta': // filter options + home page numbers
    $d = db();
    ok([
        'categories' => ['Vegetables', 'Fruits', 'Grains & Pulses', 'Dairy & More'],
        'districts' => $d->query("SELECT DISTINCT u.district FROM users u JOIN products p ON p.farmer_id=u.id WHERE " . VISIBLE . " ORDER BY u.district")->fetchAll(PDO::FETCH_COLUMN),
        'stats' => [
            'farmers' => (int) $d->query("SELECT COUNT(*) FROM users WHERE role='farmer' AND is_approved=1 AND is_active=1")->fetchColumn(),
            'products' => (int) $d->query("SELECT COUNT(*) FROM products p JOIN users u ON u.id=p.farmer_id WHERE " . VISIBLE)->fetchColumn(),
            'customers' => (int) $d->query("SELECT COUNT(*) FROM users WHERE role='consumer'")->fetchColumn(),
            'delivered' => (int) $d->query("SELECT COUNT(*) FROM orders WHERE status='Delivered'")->fetchColumn(),
        ],
        'farmers' => $d->query("SELECT u.id, u.name, u.farm_name, u.village, u.district,
                (SELECT COUNT(*) FROM products p WHERE p.farmer_id=u.id AND p.is_active=1 AND p.is_deleted=0) AS products
              FROM users u WHERE u.role='farmer' AND u.is_approved=1 AND u.is_active=1 ORDER BY u.id")->fetchAll(),
    ]);

case 'mine': // farmer's own listings
    $u = require_role('farmer');
    $st = db()->prepare(PRODUCT_SELECT . ' WHERE p.farmer_id = ? AND p.is_deleted = 0 ORDER BY p.created_at DESC, p.id DESC');
    $st->execute([$u['id']]);
    ok($st->fetchAll());

case 'save': // create or update a listing
    require_method('POST');
    $u = require_role('farmer');
    $id = (int) input('id', 0);
    $catalogId = (int) input('catalog_id');
    $price = input('price'); $qty = input('quantity');
    if (!is_numeric($price) || $price <= 0 || $price > 100000) fail('Please enter a valid price.');
    if (!is_numeric($qty) || $qty < 0 || $qty > 100000) fail('Please enter a valid quantity.');
    $st = db()->prepare('SELECT id FROM catalog WHERE id=?');
    $st->execute([$catalogId]);
    if (!$st->fetch()) fail('Please choose a product from the list.');
    $image = input('custom_image') ?: null;
    if ($image && !str_starts_with($image, UPLOAD_URL)) fail('Invalid image.');
    $fields = [$catalogId, $price, $qty, $image, mb_substr((string) input('notes', ''), 0, 255) ?: null, input('is_organic') ? 1 : 0, input('is_active', 1) ? 1 : 0];
    if ($id) {
        owned_product($id, $u['id']);
        $st = db()->prepare('UPDATE products SET catalog_id=?, price=?, quantity=?, custom_image=?, notes=?, is_organic=?, is_active=? WHERE id=? AND farmer_id=?');
        $st->execute([...$fields, $id, $u['id']]);
    } else {
        $st = db()->prepare('INSERT INTO products (catalog_id, price, quantity, custom_image, notes, is_organic, is_active, farmer_id) VALUES (?,?,?,?,?,?,?,?)');
        $st->execute([...$fields, $u['id']]);
        $id = (int) db()->lastInsertId();
    }
    ok(['id' => $id]);

case 'toggle': // show / hide a listing
    require_method('POST');
    $u = require_role('farmer');
    $p = owned_product((int) input('id'), $u['id']);
    db()->prepare('UPDATE products SET is_active = 1 - is_active WHERE id=?')->execute([$p['id']]);
    ok();

case 'delete':
    require_method('POST');
    $u = require_role('farmer');
    $p = owned_product((int) input('id'), $u['id']);
    // keep the row if it appears in past orders, so order history stays intact
    db()->prepare('UPDATE products SET is_deleted = 1, is_active = 0 WHERE id=?')->execute([$p['id']]);
    ok();

case 'upload': // farmer photo upload (multipart/form-data, field "image")
    require_method('POST');
    require_role('farmer');
    $f = $_FILES['image'] ?? null;
    if (!$f || $f['error'] !== UPLOAD_ERR_OK) fail('Please choose an image to upload.');
    if ($f['size'] > MAX_UPLOAD_BYTES) fail('Image must be smaller than 2 MB.');
    $types = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']);
    if (!isset($types[$mime])) fail('Only JPG, PNG or WEBP images are allowed.');
    if (!is_dir(UPLOAD_DIR)) mkdir(UPLOAD_DIR, 0755, true);
    $name = bin2hex(random_bytes(10)) . '.' . $types[$mime];
    if (!move_uploaded_file($f['tmp_name'], UPLOAD_DIR . $name)) fail('Upload failed. Please try again.', 500);
    ok(['url' => UPLOAD_URL . $name]);

default:
    fail('Unknown action.', 404);
}
