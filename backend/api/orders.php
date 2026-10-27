<?php
// Placing orders (consumer), tracking them, and updating status (farmer)
require_once __DIR__ . '/../lib.php';

// Attach the line items (with images) to a list of orders
function with_items(array $orders): array {
    if (!$orders) return [];
    $ids = array_column($orders, 'id');
    $in = implode(',', array_fill(0, count($ids), '?'));
    $st = db()->prepare("SELECT i.order_id, i.product_id, i.product_name, i.quantity, i.price, c.unit, " . IMAGE_SQL . " AS image
        FROM order_items i JOIN products p ON p.id=i.product_id JOIN catalog c ON c.id=p.catalog_id WHERE i.order_id IN ($in) ORDER BY i.id");
    $st->execute($ids);
    $items = [];
    foreach ($st->fetchAll() as $row) $items[$row['order_id']][] = $row;
    foreach ($orders as &$o) $o['items'] = $items[$o['id']] ?? [];
    return $orders;
}

// Put stock back when an order is rejected or cancelled
function restore_stock(int $orderId): void {
    db()->prepare('UPDATE products p JOIN order_items i ON i.product_id=p.id SET p.quantity = p.quantity + i.quantity WHERE i.order_id=?')
        ->execute([$orderId]);
}

switch (action()) {

case 'place':
    require_method('POST');
    $u = require_role('consumer');
    $items = input('items', []);
    $mode = input('payment_mode', 'COD');
    $address = input('address', ''); $phone = input('phone', '');
    if (!is_array($items) || !$items) fail('Your cart is empty.');
    if (!in_array($mode, ['COD', 'Pickup'], true)) fail('Please choose a payment option.');
    if ($mode === 'COD' && strlen($address) < 10) fail('Please enter your full delivery address.');
    if (!preg_match('/^[6-9]\d{9}$/', $phone)) fail('Please enter a valid 10-digit mobile number.');

    $pdo = db();
    $pdo->beginTransaction();
    try {
        $byFarmer = [];
        foreach ($items as $it) {
            $pid = (int) ($it['product_id'] ?? 0); $qty = (float) ($it['quantity'] ?? 0);
            if ($qty <= 0) throw new RuntimeException('Invalid quantity in cart.');
            // lock the row so two buyers cannot take the same stock
            $st = $pdo->prepare('SELECT p.id, p.farmer_id, p.price, p.quantity, p.is_active, p.is_deleted, c.name, u.is_approved, u.is_active AS farmer_active
                FROM products p JOIN catalog c ON c.id=p.catalog_id JOIN users u ON u.id=p.farmer_id WHERE p.id=? FOR UPDATE');
            $st->execute([$pid]);
            $p = $st->fetch();
            if (!$p || !$p['is_active'] || $p['is_deleted'] || !$p['is_approved'] || !$p['farmer_active']) throw new RuntimeException('An item in your cart is no longer available.');
            if ($p['quantity'] < $qty) throw new RuntimeException("Only " . (float) $p["quantity"] . " left of {$p["name"]}. Please update your cart.");
            $pdo->prepare('UPDATE products SET quantity = quantity - ? WHERE id=?')->execute([$qty, $pid]);
            $byFarmer[$p['farmer_id']][] = ['id' => $pid, 'name' => $p['name'], 'qty' => $qty, 'price' => $p['price']];
        }
        // one order per farmer, so each farmer only sees their own items
        $created = [];
        foreach ($byFarmer as $farmerId => $lines) {
            $total = array_sum(array_map(fn($l) => $l['qty'] * $l['price'], $lines));
            $pdo->prepare('INSERT INTO orders (consumer_id, farmer_id, total, payment_mode, delivery_address, phone) VALUES (?,?,?,?,?,?)')
                ->execute([$u['id'], $farmerId, $total, $mode, $address ?: null, $phone]);
            $oid = (int) $pdo->lastInsertId();
            $ins = $pdo->prepare('INSERT INTO order_items (order_id, product_id, product_name, quantity, price) VALUES (?,?,?,?,?)');
            foreach ($lines as $l) $ins->execute([$oid, $l['id'], $l['name'], $l['qty'], $l['price']]);
            $created[] = $oid;
        }
        $pdo->commit();
        ok(['order_ids' => $created], 201);
    } catch (RuntimeException $e) {
        $pdo->rollBack();
        fail($e instanceof PDOException ? 'Could not place the order. Please try again.' : $e->getMessage());
    }

case 'mine':
    $u = require_role('consumer');
    $st = db()->prepare("SELECT o.*, u.name AS farmer_name, u.farm_name, u.phone AS farmer_phone, u.village, u.district
        FROM orders o JOIN users u ON u.id=o.farmer_id WHERE o.consumer_id=? ORDER BY o.created_at DESC, o.id DESC");
    $st->execute([$u['id']]);
    ok(with_items($st->fetchAll()));

case 'cancel':
    require_method('POST');
    $u = require_role('consumer');
    $st = db()->prepare("UPDATE orders SET status='Cancelled' WHERE id=? AND consumer_id=? AND status='Placed'");
    $st->execute([(int) input('id'), $u['id']]);
    if (!$st->rowCount()) fail('This order can no longer be cancelled.');
    restore_stock((int) input('id'));
    ok();

case 'farmer':
    $u = require_role('farmer');
    $st = db()->prepare("SELECT o.*, u.name AS consumer_name FROM orders o JOIN users u ON u.id=o.consumer_id
        WHERE o.farmer_id=? ORDER BY FIELD(o.status,'Placed','Accepted','Packed','Delivered','Rejected','Cancelled'), o.created_at DESC");
    $st->execute([$u['id']]);
    ok(with_items($st->fetchAll()));

case 'update_status':
    require_method('POST');
    $u = require_role('farmer');
    $next = input('status');
    $allowed = ['Placed' => ['Accepted', 'Rejected'], 'Accepted' => ['Packed'], 'Packed' => ['Delivered']];
    $st = db()->prepare('SELECT id, status FROM orders WHERE id=? AND farmer_id=?');
    $st->execute([(int) input('id'), $u['id']]);
    $o = $st->fetch() ?: fail('Order not found.', 404);
    if (!in_array($next, $allowed[$o['status']] ?? [], true)) fail("An order that is {$o['status']} cannot be marked $next.");
    db()->prepare('UPDATE orders SET status=? WHERE id=?')->execute([$next, $o['id']]);
    if ($next === 'Rejected') restore_stock($o['id']);
    ok();

default:
    fail('Unknown action.', 404);
}
