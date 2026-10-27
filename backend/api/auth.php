<?php
// Login, registration, logout, current user and profile updates
require_once __DIR__ . '/../lib.php';

switch (action()) {

case 'me':
    ok(['user' => current_user()]);

case 'register':
    require_method('POST');
    $name = input('name'); $email = strtolower(input('email', ''));
    $pass = input('password', ''); $role = input('role', 'consumer');
    $phone = input('phone', ''); $district = input('district', '');

    if (strlen($name) < 2) fail('Please enter your full name.');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) fail('Please enter a valid email address.');
    if (strlen($pass) < 6) fail('Password must be at least 6 characters.');
    if (!preg_match('/^[6-9]\d{9}$/', $phone)) fail('Please enter a valid 10-digit mobile number.');
    if (!in_array($role, ['consumer', 'farmer'], true)) fail('Please choose Farmer or Consumer.');
    if ($district === '') fail('Please select your district.');

    $st = db()->prepare('SELECT id FROM users WHERE email=?');
    $st->execute([$email]);
    if ($st->fetch()) fail('An account with this email already exists. Please log in.');

    $approved = $role === 'farmer' ? 0 : 1; // farmers need admin approval
    $st = db()->prepare('INSERT INTO users (name,email,password_hash,role,phone,district,village,address,farm_name,is_approved) VALUES (?,?,?,?,?,?,?,?,?,?)');
    $st->execute([$name, $email, password_hash($pass, PASSWORD_DEFAULT), $role, $phone, $district,
        input('village') ?: null, input('address') ?: null, input('farm_name') ?: null, $approved]);

    session_regenerate_id(true);
    $_SESSION['uid'] = (int) db()->lastInsertId();
    ok(['user' => current_user()], 201);

case 'login':
    require_method('POST');
    $st = db()->prepare('SELECT id,password_hash,is_active FROM users WHERE email=?');
    $st->execute([strtolower(input('email', ''))]);
    $row = $st->fetch();
    if (!$row || !password_verify(input('password', ''), $row['password_hash'])) fail('Incorrect email or password.', 401);
    if (!$row['is_active']) fail('This account has been blocked. Please contact support.', 403);
    session_regenerate_id(true);
    $_SESSION['uid'] = (int) $row['id'];
    ok(['user' => current_user()]);

case 'logout':
    $_SESSION = [];
    session_destroy();
    ok();

case 'update_profile':
    require_method('POST');
    $u = require_role();
    $name = input('name', $u['name']); $phone = input('phone', $u['phone']);
    if (strlen($name) < 2) fail('Please enter your full name.');
    if (!preg_match('/^[6-9]\d{9}$/', $phone)) fail('Please enter a valid 10-digit mobile number.');
    $st = db()->prepare('UPDATE users SET name=?, phone=?, district=?, village=?, address=?, farm_name=? WHERE id=?');
    $st->execute([$name, $phone, input('district', $u['district']), input('village') ?: null,
        input('address') ?: null, input('farm_name') ?: null, $u['id']]);
    $st = db()->prepare('SELECT id,name,email,role,phone,district,village,address,farm_name,is_approved,is_active,created_at FROM users WHERE id=?');
    $st->execute([$u['id']]);
    ok(['user' => $st->fetch()]);

case 'change_password':
    require_method('POST');
    $u = require_role();
    $st = db()->prepare('SELECT password_hash FROM users WHERE id=?');
    $st->execute([$u['id']]);
    if (!password_verify(input('current', ''), $st->fetchColumn())) fail('Your current password is incorrect.');
    if (strlen(input('new', '')) < 6) fail('New password must be at least 6 characters.');
    db()->prepare('UPDATE users SET password_hash=? WHERE id=?')->execute([password_hash(input('new'), PASSWORD_DEFAULT), $u['id']]);
    ok();

default:
    fail('Unknown action.', 404);
}
