<?php
// Farmer dashboard numbers
require_once __DIR__ . '/../lib.php';

if (action() !== 'stats') fail('Unknown action.', 404);
$u = require_role('farmer');
$d = db(); $id = $u['id'];

$one = function (string $sql) use ($d, $id) { $st = $d->prepare($sql); $st->execute([$id]); return $st->fetchColumn(); };
$all = function (string $sql) use ($d, $id) { $st = $d->prepare($sql); $st->execute([$id]); return $st->fetchAll(); };

ok([
    'earnings' => (float) $one("SELECT COALESCE(SUM(total),0) FROM orders WHERE farmer_id=? AND status='Delivered'"),
    'pending_value' => (float) $one("SELECT COALESCE(SUM(total),0) FROM orders WHERE farmer_id=? AND status IN ('Placed','Accepted','Packed')"),
    'new_orders' => (int) $one("SELECT COUNT(*) FROM orders WHERE farmer_id=? AND status='Placed'"),
    'active_orders' => (int) $one("SELECT COUNT(*) FROM orders WHERE farmer_id=? AND status IN ('Accepted','Packed')"),
    'delivered' => (int) $one("SELECT COUNT(*) FROM orders WHERE farmer_id=? AND status='Delivered'"),
    'products' => (int) $one("SELECT COUNT(*) FROM products WHERE farmer_id=? AND is_deleted=0"),
    'rating' => $one("SELECT ROUND(AVG(r.rating),1) FROM reviews r JOIN products p ON p.id=r.product_id WHERE p.farmer_id=?"),
    'low_stock' => $all("SELECT p.id, c.name, c.unit, p.quantity, " . IMAGE_SQL . " AS image FROM products p JOIN catalog c ON c.id=p.catalog_id
        WHERE p.farmer_id=? AND p.is_deleted=0 AND p.is_active=1 AND p.quantity < 30 ORDER BY p.quantity LIMIT 6"),
    'last7' => $all("SELECT DATE(created_at) AS day, SUM(total) AS total FROM orders WHERE farmer_id=? AND status NOT IN ('Rejected','Cancelled')
        AND created_at >= CURDATE() - INTERVAL 6 DAY GROUP BY DATE(created_at)"),
    'top' => $all("SELECT i.product_name AS name, SUM(i.quantity) AS qty, SUM(i.quantity*i.price) AS revenue FROM order_items i JOIN orders o ON o.id=i.order_id
        WHERE o.farmer_id=? AND o.status NOT IN ('Rejected','Cancelled') GROUP BY i.product_name ORDER BY revenue DESC LIMIT 5"),
]);
