// MineWeb — klient API zapisów na serwerze (login bez hasła, wiele zapisów).
const API = '/minecraft/api.php';

async function call(action, method, payload) {
  const url = `${API}?action=${action}`;
  const opts = { method };
  if (method === 'POST') {
    opts.headers = { 'Content-Type': 'application/json' };
    opts.body = JSON.stringify(payload || {});
  }
  const res = await fetch(url, opts);
  let json;
  try { json = await res.json(); }
  catch { throw new Error('Serwer zwrócił nieprawidłową odpowiedź'); }
  if (!res.ok || !json.ok) throw new Error(json.error || `Błąd serwera (${res.status})`);
  return json;
}

// Zapamiętany login (by po odświeżeniu użytkownik był zalogowany)
export function savedUser() { try { return localStorage.getItem('mc_user') || null; } catch { return null; } }
export function setSavedUser(u) { try { u ? localStorage.setItem('mc_user', u) : localStorage.removeItem('mc_user'); } catch {} }

export async function login(user) {
  const r = await call('login', 'POST', { user });
  setSavedUser(r.user);
  return r.user;
}

export function isValidMode(m) { return m === 'creative' || m === 'survival'; }

export async function getMode(user) {
  const res = await fetch(`${API}?action=getmode&user=${encodeURIComponent(user)}`);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'Błąd odczytu trybu gry');
  return isValidMode(json.mode) ? json.mode : 'survival';
}

export async function setMode(user, mode) {
  if (!isValidMode(mode)) throw new Error('Nieprawidłowy tryb gry.');
  await call('setmode', 'POST', { user, mode });
}

export async function listSaves(user) {
  const res = await fetch(`${API}?action=list&user=${encodeURIComponent(user)}`);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'Błąd listy zapisów');
  return json.saves;
}

export async function saveGame(user, name, dataObj) {
  const data = typeof dataObj === 'string' ? dataObj : JSON.stringify(dataObj);
  await call('save', 'POST', { user, name, data });
}

export async function loadGame(user, name) {
  const res = await fetch(`${API}?action=load&user=${encodeURIComponent(user)}&name=${encodeURIComponent(name)}`);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'Nie udało się wczytać zapisu');
  return JSON.parse(json.data);
}

export async function deleteGame(user, name) {
  await call('delete', 'POST', { user, name });
}
