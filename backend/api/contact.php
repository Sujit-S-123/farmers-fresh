<?php
// Contact form messages (read by the admin)
require_once __DIR__ . '/../lib.php';

if (action() !== 'send') fail('Unknown action.', 404);
require_method('POST');
$name = input('name', ''); $email = input('email', ''); $msg = input('message', '');
if (strlen($name) < 2) fail('Please enter your name.');
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) fail('Please enter a valid email address.');
if (strlen($msg) < 10) fail('Please write a slightly longer message.');
db()->prepare('INSERT INTO messages (name, email, message) VALUES (?,?,?)')->execute([$name, $email, mb_substr($msg, 0, 2000)]);
ok();
