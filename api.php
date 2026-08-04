<?php
// MineWeb — backend zapisów gry (login bez hasła, wiele nazwanych zapisów).
// Magazyn: pliki JSON POZA katalogiem deployu (rsync --delete ich nie usunie),
// bez bazy danych (serwer nie ma pdo_sqlite; unikamy też creds do MySQL).
// Router: /minecraft/api.php?action=login|list|save|load|delete
//
// Jednorazowy setup na serwerze (sudo):
//   sudo mkdir -p /var/www/mineweb-data && sudo chown www-data:www-data /var/www/mineweb-data

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

const DATA_DIR = '/var/www/mineweb-data';

function fail($msg, $code = 400) {
  http_response_code($code);
  echo json_encode(['ok' => false, 'error' => $msg]);
  exit;
}

function ensureData() {
  if (!is_dir(DATA_DIR)) fail('Katalog danych nie istnieje (' . DATA_DIR . '). Utwórz go i nadaj prawa www-data.', 500);
  if (!is_writable(DATA_DIR)) fail('Katalog danych nie jest zapisywalny dla serwera.', 500);
}

function cleanUser($u) {
  $u = trim((string)$u);
  if (!preg_match('/^[a-zA-Z0-9_]{3,20}$/', $u)) fail('Nieprawidłowy login (3–20 znaków: litery, cyfry, _).');
  return $u;
}
function cleanName($n) {
  $n = trim((string)$n);
  if ($n === '' || mb_strlen($n) > 40) fail('Nieprawidłowa nazwa zapisu (1–40 znaków).');
  return $n;
}

// Katalog danego gracza (tworzony przy potrzebie)
function userDir($user, $create = false) {
  $dir = DATA_DIR . '/' . $user;   // login już zwalidowany do [A-Za-z0-9_]
  if ($create && !is_dir($dir)) {
    if (!@mkdir($dir, 0775) && !is_dir($dir)) fail('Nie można utworzyć katalogu użytkownika.', 500);
  }
  return $dir;
}
// Ścieżka pliku zapisu (nazwa jako md5 → bezpieczna dla systemu plików)
function savePath($user, $name, $create = false) {
  return userDir($user, $create) . '/' . md5($name) . '.json';
}
// Preferowany tryb gry (creative/survival) danego użytkownika.
// Rozszerzenie ".pref" (nie ".json"), żeby nie trafiał do listy zapisów (glob *.json).
function modePath($user, $create = false) {
  return userDir($user, $create) . '/mode.pref';
}
function cleanMode($m) {
  $m = trim((string)$m);
  if ($m !== 'creative' && $m !== 'survival') fail('Nieprawidłowy tryb gry (creative|survival).');
  return $m;
}

// Odczyt parametru z GET/POST/JSON body
function param($key) {
  if (isset($_GET[$key]))  return $_GET[$key];
  if (isset($_POST[$key])) return $_POST[$key];
  static $json = null;
  if ($json === null) { $raw = file_get_contents('php://input'); $json = $raw ? (json_decode($raw, true) ?: []) : []; }
  return $json[$key] ?? null;
}

ensureData();
$action = $_GET['action'] ?? '';

switch ($action) {
  case 'login': {
    $user = cleanUser(param('user'));
    userDir($user, true);
    echo json_encode(['ok' => true, 'user' => $user]);
    break;
  }
  case 'getmode': {
    $user = cleanUser(param('user'));
    $path = modePath($user);
    $mode = 'survival';
    if (is_file($path)) {
      $m = trim((string)file_get_contents($path));
      if ($m === 'creative' || $m === 'survival') $mode = $m;
    }
    echo json_encode(['ok' => true, 'mode' => $mode]);
    break;
  }
  case 'setmode': {
    $user = cleanUser(param('user'));
    $mode = cleanMode(param('mode'));
    if (file_put_contents(modePath($user, true), $mode, LOCK_EX) === false) fail('Nie udało się zapisać trybu.', 500);
    echo json_encode(['ok' => true]);
    break;
  }
  case 'list': {
    $user = cleanUser(param('user'));
    $dir = userDir($user);
    $out = [];
    if (is_dir($dir)) {
      foreach (glob($dir . '/*.json') as $f) {
        $meta = json_decode(file_get_contents($f), true);
        if (!$meta) continue;
        $out[] = ['name' => $meta['name'] ?? '?', 'updated_at' => $meta['updated_at'] ?? filemtime($f), 'size' => strlen($meta['data'] ?? '')];
      }
      usort($out, fn($a, $b) => $b['updated_at'] <=> $a['updated_at']);
    }
    echo json_encode(['ok' => true, 'saves' => $out]);
    break;
  }
  case 'save': {
    $user = cleanUser(param('user'));
    $name = cleanName(param('name'));
    $data = param('data');
    if (!is_string($data) || $data === '') fail('Brak danych zapisu.');
    $payload = json_encode(['name' => $name, 'updated_at' => time(), 'data' => $data]);
    if (file_put_contents(savePath($user, $name, true), $payload, LOCK_EX) === false) fail('Nie udało się zapisać.', 500);
    echo json_encode(['ok' => true]);
    break;
  }
  case 'load': {
    $user = cleanUser(param('user'));
    $name = cleanName(param('name'));
    $path = savePath($user, $name);
    if (!is_file($path)) fail('Nie znaleziono zapisu.', 404);
    $meta = json_decode(file_get_contents($path), true);
    echo json_encode(['ok' => true, 'data' => $meta['data'] ?? '']);
    break;
  }
  case 'delete': {
    $user = cleanUser(param('user'));
    $name = cleanName(param('name'));
    $path = savePath($user, $name);
    if (is_file($path)) @unlink($path);
    echo json_encode(['ok' => true]);
    break;
  }
  default:
    fail('Nieznana akcja.');
}
