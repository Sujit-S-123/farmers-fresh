<?php
// Admin panel: overview, farmer approval, users, products, orders, messages
require_once __DIR__ . '/../lib.php';

$admin = require_role('admin');
$d = db();

switch (action()) {

case 'stats':
    $n = fn($sql) => $d->query($sql)->fetchColumn();
    ok([
        'farmers' => (int) $n("SELECT COUNT(*) FROM users WHERE role='farmer' AND is_approved=1"),
        'pending_farmers' => (int) $n("SELECT COUNT(*) FROM users WHERE role='farmer' AND is_approved=0"),
        'consumers' => (int) $n("SELECT COUNT(*) FROM users WHERE role='consumer'"),
        'products' => (int) $n("SELECT COUNT(*) FROM products WHERE is_deleted=0"),
        'orders' => (int) $n("SELECT COUNT(*) FROM orders"),
        'revenue' => (float) $n("SELECT COALESCE(SUM(total),0) FROM orders WHERE status='Delivered'"),
        'messages' => (int) $n("SELECT COUNT(*) FROM messages"),
        'by_status' => $d->query("SELECT status, COUNT(*) AS count FROM orders GROUP BY status")->fetchAll(),
        'by_category' => $d->query("SELECT c.category, COUNT(*) AS count FROM products p JOIN catalog c ON c.id=p.catalog_id WHERE p.is_deleted=0 GROUP BY c.category")->fetchAll(),
        'last7' => $d->query("SELECT DATE(created_at) AS day, COUNT(*) AS orders, SUM(total) AS total FROM orders
            WHERE created_at >= CURDATE() - INTERVAL 6 DAY GROUP BY DATE(created_at)")->fetchAll(),
        'recent' => $d->query("SELECT o.id, o.total, o.status, o.created_at, c.name AS consumer_name, f.farm_name
            FROM orders o JOIN users c ON c.id=o.consumer_id JOIN users f ON f.id=o.farmer_id ORDER BY o.created_at DESC, o.id DESC LIMIT 6")->fetchAll(),
    ]);

case 'users': // ?role=farmer|consumer
    $role = input('role');
    $sql = "SELECT u.id, u.name, u.email, u.role, u.phone, u.district, u.village, u.farm_name, u.is_approved, u.is_active, u.created_at,
        (SELECT COUNT(*) FROM products p WHERE p.farmer_id=u.id AND p.is_deleted=0) AS products,
        (SELECT COUNT(*) FROM orders o WHERE o.consumer_id=u.id OR o.farmer_id=u.id) AS orders
        FROM users u WHERE u.role <> 'admin'";
    $args = [];
    if (in_array($role, ['farmer', 'consumer'], true)) { $sql .= ' AND u.role=?'; $args[] = $role; }
    $st = $d->prepare($sql . ' ORDER BY u.is_approved ASC, u.created_at DESC');
    $st->execute($args);
    ok($st->fetchAll());

case 'approve': // approve (1) or put back on hold (0) a farmer
    require_method('POST');
    $st = $d->prepare("UPDATE users SET is_approved=? WHERE id=? AND role='farmer'");
    $st->execute([input('approved', 1) ? 1 : 0, (int) input('id')]);
    ok();

case 'toggle_user': // block / unblock
    require_method('POST');
    $st = $d->prepare("UPDATE users SET is_active = 1 - is_active WHERE id=? AND role <> 'admin'");
    $st->execute([(int) input('id')]);
    ok();

case 'products':
    ok($d->query("SELECT p.id, p.price, p.quantity, p.is_active, p.is_organic, p.created_at, c.name, c.category, c.unit, " . IMAGE_SQL . " AS image,
        u.name AS farmer_name, u.farm_name, u.district
        FROM products p JOIN catalog c ON c.id=p.catalog_id JOIN users u ON u.id=p.farmer_id WHERE p.is_deleted=0 ORDER BY p.created_at DESC, p.id DESC")->fetchAll());

case 'remove_product': // take down a fake / bad listing
    require_method('POST');
    $d->prepare('UPDATE products SET is_deleted=1, is_active=0 WHERE id=?')->execute([(int) input('id')]);
    ok();

case 'orders':
    $rows = $d->query("SELECT o.*, c.name AS consumer_name, f.name AS farmer_name, f.farm_name,
        (SELECT GROUP_CONCAT(CONCAT(i.product_name,' × ',TRIM(TRAILING '.' FROM TRIM(TRAILING '0' FROM i.quantity))) SEPARATOR ', ') FROM order_items i WHERE i.order_id=o.id) AS summary
        FROM orders o JOIN users c ON c.id=o.consumer_id JOIN users f ON f.id=o.farmer_id ORDER BY o.created_at DESC, o.id DESC")->fetchAll();
    ok($rows);

case 'messages':
    ok($d->query('SELECT * FROM messages ORDER BY created_at DESC')->fetchAll());

case 'delete_message':
    require_method('POST');
    $d->prepare('DELETE FROM messages WHERE id=?')->execute([(int) input('id')]);
    ok();

default:
    fail('Unknown action.', 404);
}
