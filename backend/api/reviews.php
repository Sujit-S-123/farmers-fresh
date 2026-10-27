<?php
// Ratings and reviews (only for products the consumer has received)
require_once __DIR__ . '/../lib.php';

switch (action()) {
case 'add':
    require_method('POST');
    $u = require_role('consumer');
    $pid = (int) input('product_id'); $rating = (int) input('rating');
    $comment = mb_substr((string) input('comment', ''), 0, 500);
    if ($rating < 1 || $rating > 5) fail('Please choose a rating from 1 to 5 stars.');
    $st = db()->prepare("SELECT 1 FROM orders o JOIN order_items i ON i.order_id=o.id WHERE o.consumer_id=? AND i.product_id=? AND o.status='Delivered' LIMIT 1");
    $st->execute([$u['id'], $pid]);
    if (!$st->fetch()) fail('You can review a product after it has been delivered to you.', 403);
    // one review per person per product: a second one updates the first
    db()->prepare('INSERT INTO reviews (product_id, consumer_id, rating, comment) VALUES (?,?,?,?)
        ON DUPLICATE KEY UPDATE rating=VALUES(rating), comment=VALUES(comment), created_at=NOW()')
        ->execute([$pid, $u['id'], $rating, $comment ?: null]);
    ok();
default:
    fail('Unknown action.', 404);
}
