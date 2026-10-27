<?php
// The master list of products a farmer can sell (with image + description)
require_once __DIR__ . '/../lib.php';

switch (action()) {
case 'list':
    ok(db()->query('SELECT * FROM catalog ORDER BY FIELD(category,"Vegetables","Fruits","Grains & Pulses","Dairy & More"), name')->fetchAll());
default:
    fail('Unknown action.', 404);
}
