<?php
// ------------------------------------------------------------
// Farmer's Fresh — database settings
// XAMPP defaults: user "root" with an empty password.
// ------------------------------------------------------------
define('DB_HOST', getenv('FF_DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('FF_DB_NAME') ?: 'farmers_fresh');
define('DB_USER', getenv('FF_DB_USER') ?: 'root');
define('DB_PASS', getenv('FF_DB_PASS') !== false ? getenv('FF_DB_PASS') : '');

// Folder where farmer photo uploads are saved
define('UPLOAD_DIR', __DIR__ . '/uploads/');
define('UPLOAD_URL', '/uploads/');
define('MAX_UPLOAD_BYTES', 2 * 1024 * 1024); // 2 MB
