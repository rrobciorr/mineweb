import { World } from './world.js?v=29';
import { Player } from './player.js?v=29';
import { Renderer } from './renderer.js?v=29';
import { UI } from './ui.js?v=29';
import { AudioManager } from './audio.js?v=29';
import { MobManager } from './entities.js?v=29';
import { Inventory, blockDrop, bonusDrops, smeltResult, fuelValue, canHarvest, ITEMS } from './inventory.js?v=29';
import { HOTBAR_BLOCKS, BLOCK_PROPS, B, isRedstone, isRailBlock } from './blocks.js?v=29';
import { settings } from './settings.js?v=29';
import * as net from './net.js?v=29';
import { RedstoneSim } from './redstone.js?v=29';

let RENDER_RADIUS = settings.get('renderDistance');
const BREAK_TIME_BASE = 1.5; // seconds

// Apply render-distance changes live: world.update (called each frame) and the
// renderer fog use RENDER_RADIUS, so the next frame picks up the new value.
settings.onChange('renderDistance', v => {
  RENDER_RADIUS = v;
  if (renderer) renderer.setRenderDistance(v);
});
settings.onChange('fov',        v => { if (renderer) renderer.setFov(v); });
settings.onChange('brightness', v => { if (renderer) renderer.setBrightness(v); });
settings.onChange('hideHud',    v => applyHideHud(v));

// Ukrycie HUD: chowa cały interfejs gry (paski, hotbar, celownik, FPS).
function applyHideHud(v) {
  const hud = document.getElementById('hud');
  if (hud) hud.style.visibility = v ? 'hidden' : 'visible';
}

let world, player, renderer, ui, audio, mobs, inv, rs;
let invOpen = false;
let chatOpen = false;
let running = false;
let paused = false;
let settingsOpen = false;
let lastTime = 0;
let breakTarget = null;
let breakProgress = 0;
let mouseLeft = false;
const CREATIVE_BREAK_DELAY = 0.2;   // s między kolejnymi blokami przy trzymaniu (tryb creative)
let creativeBreakTimer = 0;
let mouseRight = false;
let stepTimer = 0;
let prevHealth = 20;   // do wykrywania obrażeń (czerwony błysk)
let currentUser = null;   // zalogowany login (null = gra lokalna)
let currentSave = null;   // nazwa aktywnego zapisu na serwerze
let currentMode = 'survival';   // domyślny tryb gry zalogowanego konta (creative/survival)
let autosaveAcc = 0;      // akumulator czasu do autozapisu (s)
const AUTOSAVE_EVERY = 45; // co ile sekund autozapis na serwer

// ─── PIECE (stan wg pozycji bloku) ─────────────────────────────────────────────
const furnaces = new Map();      // "x,y,z" -> { input, fuel, output, burn, burnMax, prog, smeltTime }
const SMELT_TIME = 5;            // sekundy na wytopienie 1 sztuki
function getFurnace(x, y, z) {
  const k = `${x},${y},${z}`;
  let f = furnaces.get(k);
  if (!f) { f = { input:null, fuel:null, output:null, burn:0, burnMax:0, prog:0, smeltTime:SMELT_TIME }; furnaces.set(k, f); }
  return f;
}
// Wytapianie działa w tle dla wszystkich pieców, nawet zamkniętych.
function tickFurnaces(dt) {
  for (const f of furnaces.values()) {
    const res = f.input ? smeltResult(f.input.key) : null;
    const outFull = f.output && (f.output.key !== res || f.output.n >= (ITEMS[res]?.stack || 64));
    const canSmelt = !!res && !outFull;
    // rozpal, jeśli trzeba i jest paliwo
    if (f.burn <= 0 && canSmelt && f.fuel && fuelValue(f.fuel.key) > 0) {
      f.burnMax = fuelValue(f.fuel.key); f.burn = f.burnMax;
      f.fuel.n--; if (f.fuel.n <= 0) f.fuel = null;
    }
    if (f.burn > 0) {
      f.burn -= dt;
      if (canSmelt) {
        f.prog += dt;
        if (f.prog >= f.smeltTime) {
          f.prog = 0;
          f.input.n--; if (f.input.n <= 0) f.input = null;
          if (f.output) f.output.n++; else f.output = { key:res, n:1 };
        }
      } else f.prog = 0;
      if (f.burn < 0) f.burn = 0;
    } else {
      f.prog = Math.max(0, f.prog - dt);
    }
  }
}

// ─── SKRZYNIE (stan wg pozycji bloku) ──────────────────────────────────────────
const chests = new Map();       // "x,y,z" -> { items: Array(27) }
function getChest(x, y, z) {
  const k = `${x},${y},${z}`;
  let c = chests.get(k);
  if (!c) { c = { items: new Array(27).fill(null) }; chests.set(k, c); }
  return c;
}
// Rozbicie skrzyni: zwróć zawartość do plecaka.
function dropChestContents(x, y, z) {
  const k = `${x},${y},${z}`;
  const c = chests.get(k);
  if (!c) return;
  for (const s of c.items) if (s) inv.add(s.key, s.n);
  chests.delete(k);
}

// Zabierz n sztuk danego przedmiotu z plecaka (np. strzała). Zwraca true jeśli było dość.
function takeItem(key, n = 1) {
  let have = 0; for (const s of inv.slots) if (s && s.key === key) have += s.n;
  if (have < n) return false;
  for (let i = 0; i < inv.slots.length && n > 0; i++) {
    const s = inv.slots[i];
    if (s && s.key === key) { const t = Math.min(s.n, n); s.n -= t; n -= t; if (s.n <= 0) inv.slots[i] = null; }
  }
  inv.renderHotbar();
  return true;
}

// ─── POINTER LOCK ─────────────────────────────────────────────────────────────
let pointerLocked = false;
document.addEventListener('pointerlockchange', () => {
  pointerLocked = !!document.pointerLockElement;
  if (!pointerLocked && running && !paused && !invOpen) showPause();
});

let mouseSens = settings.get('sensitivity') * 0.01;   // setting 0.2 → 0.002 rad/px
settings.onChange('sensitivity', v => { mouseSens = v * 0.01; });
document.addEventListener('mousemove', e => {
  if (!pointerLocked || paused) return;
  player.yaw   -= e.movementX * mouseSens;
  player.pitch  = Math.max(-Math.PI/2 + 0.01, Math.min(Math.PI/2 - 0.01, player.pitch - e.movementY * mouseSens));
});

// FPS limit: 0 = bez limitu, inaczej minimalny odstęp między klatkami (ms)
let frameMinMs = settings.get('fpsLimit') ? 1000 / settings.get('fpsLimit') : 0;
settings.onChange('fpsLimit', v => { frameMinMs = v ? 1000 / v : 0; });
let lastFrame = 0;

// ─── MOUSE BUTTONS ────────────────────────────────────────────────────────────
document.addEventListener('mousedown', e => {
  if (!running || paused || invOpen || chatOpen) return;
  if (e.button === 0) {
    renderer.swingHand();
    // rozbij celowany wagonik (odzyskaj przedmiot)
    if (!player.riding) { const cart = mobs?.pickCart?.(); if (cart) { breakCart(cart); mouseLeft = false; return; } }
    // attack a mob if one is in front, otherwise begin breaking
    if (mobs && mobs.tryPlayerAttack()) { mouseLeft = false; return; }
    if (player.creative) { creativeBreak(); mouseLeft = true; creativeBreakTimer = CREATIVE_BREAK_DELAY; return; }   // creative: natychmiastowe niszczenie (trzymanie = ciągłe)
    mouseLeft = true; breakProgress = 0; breakTarget = null;
  }
  if (e.button === 2) { mouseRight = true; renderer.swingHand(); doPlace(); }
});
document.addEventListener('mouseup', e => {
  if (e.button === 0) { mouseLeft = false; breakProgress = 0; breakTarget = null; renderer?.updateBreakOverlay(null, 0); }
  if (e.button === 2) mouseRight = false;
});
document.addEventListener('contextmenu', e => e.preventDefault());

// ─── UI BUTTONS ───────────────────────────────────────────────────────────────
document.getElementById('playBtn').addEventListener('click', () => newGame());
document.getElementById('seedInput').addEventListener('keydown', e => { if (e.key === 'Enter') newGame(); });
document.getElementById('loginBtn').addEventListener('click', doLogin);
document.getElementById('loginInput').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
document.getElementById('logoutBtn').addEventListener('click', doLogout);
document.getElementById('gameModeSelect').addEventListener('change', onGameModeChange);
document.getElementById('resumeBtn').addEventListener('click', resume);
document.getElementById('saveBtn').addEventListener('click', saveCurrent);
document.getElementById('exitBtn').addEventListener('click', exitToMenu);
// Zapis „na wyjście": zamknięcie karty lub przełączenie w tło (np. na telefonie).
window.addEventListener('pagehide', saveBeacon);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveBeacon(); });
document.getElementById('settingsBtn').addEventListener('click', openSettings);
document.getElementById('settingsBackBtn').addEventListener('click', closeSettings);
setupSettingsControls();
// Przywróć zapamiętany login (bez hasła) i pokaż listę zapisów.
{ const u = net.savedUser(); if (u) { currentUser = u; refreshAccountUI(); } }
document.addEventListener('keydown', e => {
  if (chatOpen) return;   // czat ma własną obsługę klawiszy (patrz #chat-input)
  if (e.code === 'Escape') {
    if (!running) return;
    if (settingsOpen) { closeSettings(); return; }
    if (invOpen) { toggleInv(); return; }
    paused ? resume() : showPause();
  }
  if (e.code === 'KeyE') { if (running && !paused) toggleInv(); return; }
  if (!running || paused || invOpen) return;
  // Otwórz czat: T (pusty) lub / (komenda)
  if (e.code === 'KeyT' || e.code === 'Slash') { openChat(e.code === 'Slash' ? '/' : ''); e.preventDefault(); return; }
  if (e.code === 'KeyF') doPlace();
  if (e.code === 'KeyC') doBreak();
});

function toggleInv() {
  if (player) inv.creative = player.creative;   // paleta creative w zgodzie z trybem
  inv.toggle();
  invOpen = inv.isOpen;
  if (player) player.inputLocked = invOpen;
  if (invOpen) { if (document.pointerLockElement) document.exitPointerLock(); }
  else { document.getElementById('gameCanvas').requestPointerLock(); }
}

// ─── CZAT I KOMENDY ─────────────────────────────────────────────────────────────
const chatInputEl = document.getElementById('chat-input');
chatInputEl.addEventListener('keydown', e => {
  e.stopPropagation();
  if (e.code === 'Enter') { submitChat(); }
  else if (e.code === 'Escape') { e.preventDefault(); closeChat(); }
});

function openChat(prefill) {
  chatOpen = true;
  if (player) player.inputLocked = true;
  if (document.pointerLockElement) document.exitPointerLock();
  chatInputEl.value = prefill;
  chatInputEl.style.display = 'block';
  chatInputEl.focus();
  chatInputEl.setSelectionRange(prefill.length, prefill.length);
}

function closeChat() {
  chatOpen = false;
  chatInputEl.value = '';
  chatInputEl.style.display = 'none';
  chatInputEl.blur();
  if (player) player.inputLocked = false;
  if (running && !paused && !invOpen) document.getElementById('gameCanvas').requestPointerLock();
}

function submitChat() {
  const text = chatInputEl.value.trim();
  if (text) {
    if (text.startsWith('/')) runCommand(text);
    else chatLog(`<Gracz> ${text}`);
  }
  closeChat();
}

// Dodaj linię do logu czatu; znika po ~7 s, trzyma ostatnie 8 linii.
function chatLog(msg) {
  const log = document.getElementById('chat-log');
  if (!log) return;
  const line = document.createElement('div');
  line.className = 'chat-line';
  line.textContent = msg;
  log.appendChild(line);
  while (log.children.length > 8) log.removeChild(log.firstChild);
  setTimeout(() => { line.style.opacity = '0'; setTimeout(() => line.remove(), 600); }, 7000);
}

function setGameMode(creative) {
  player.creative = creative;
  inv.creative = creative;
  if (!creative) player.flying = false;
  chatLog(creative ? '🟩 Tryb: KREATYWNY' : '🟫 Tryb: SURVIVAL');
}

// Zniszcz blok natychmiast (tryb creative): bez łupów i zużycia narzędzia.
function creativeBreak() {
  const hit = player.raycast();
  if (!hit) return;
  const b = world.getBlock(hit.wx, hit.wy, hit.wz);
  audio.playBreak(b);
  if (b === B.FURNACE) dropFurnaceContents(hit.wx, hit.wy, hit.wz);
  if (b === B.CHEST) dropChestContents(hit.wx, hit.wy, hit.wz);
  if (isRedstone(b)) rs.onBreak(hit.wx, hit.wy, hit.wz);
  renderer.spawnBlockParticles(hit.wx, hit.wy, hit.wz, ITEMS['b:'+b]?.color || '#888');
  world.setBlock(hit.wx, hit.wy, hit.wz, B.AIR);
  world.collapseAbove(hit.wx, hit.wy, hit.wz);
  rebuildAround(hit.wx, hit.wy, hit.wz);
}

// Zamień nazwę/klucz na klucz przedmiotu z rejestru ITEMS.
function resolveItem(name) {
  if (ITEMS[name]) return name;                       // dokładny klucz, np. 'diamond' / 'b:3'
  const q = name.toLowerCase();
  for (const k in ITEMS) {                            // dopasowanie po nazwie wyświetlanej
    if ((ITEMS[k].name || '').toLowerCase() === q) return k;
  }
  for (const k in ITEMS) {                            // dopasowanie częściowe
    if ((ITEMS[k].name || '').toLowerCase().includes(q) || k.toLowerCase() === q) return k;
  }
  return null;
}

const CMD_HELP = [
  '/gamemode creative|survival  (/creative, /survival)',
  '/time set day|night|noon|midnight',
  '/weather clear|rain|snow',
  '/tp <x> <y> <z>   /give <przedmiot> [ile]',
  '/heal   /kill   /seed   /help',
];

function runCommand(raw) {
  const parts = raw.slice(1).trim().split(/\s+/);
  const cmd = (parts.shift() || '').toLowerCase();
  const arg = i => (parts[i] || '').toLowerCase();

  switch (cmd) {
    case 'help':
      CMD_HELP.forEach(l => chatLog(l));
      break;
    case 'creative': setGameMode(true); break;
    case 'survival': setGameMode(false); break;
    case 'gamemode': {
      const g = arg(0);
      if (g === 'creative' || g === 'c' || g === '1') setGameMode(true);
      else if (g === 'survival' || g === 's' || g === '0') setGameMode(false);
      else chatLog('Użycie: /gamemode creative|survival');
      break;
    }
    case 'time': {
      if (arg(0) !== 'set') { chatLog('Użycie: /time set day|night'); break; }
      const t = arg(1);
      const map = { day: 0.5, noon: 0.5, night: 0.0, midnight: 0.0, dawn: 0.25, dusk: 0.75 };
      let v = map[t];
      if (v === undefined) { const f = parseFloat(t); if (!Number.isNaN(f)) v = ((f % 1) + 1) % 1; }
      if (v === undefined) { chatLog('Nieznany czas: ' + t); break; }
      renderer.dayTime = v;
      chatLog('⏰ Ustawiono czas: ' + t);
      break;
    }
    case 'weather': {
      const w = arg(0);
      if (!['clear', 'rain', 'snow'].includes(w)) { chatLog('Użycie: /weather clear|rain|snow'); break; }
      renderer.setWeather(w);
      chatLog('🌦️ Pogoda: ' + w);
      break;
    }
    case 'tp': {
      const x = parseFloat(parts[0]), y = parseFloat(parts[1]), z = parseFloat(parts[2]);
      if ([x, y, z].some(Number.isNaN)) { chatLog('Użycie: /tp <x> <y> <z>'); break; }
      player.x = x + 0.5; player.y = y; player.z = z + 0.5;
      player.vx = player.vy = player.vz = 0;
      chatLog(`🧭 Teleportacja do ${Math.floor(x)}, ${Math.floor(y)}, ${Math.floor(z)}`);
      break;
    }
    case 'give': {
      const key = resolveItem(parts[0] || '');
      if (!key) { chatLog('Nieznany przedmiot: ' + (parts[0] || '')); break; }
      const n = Math.max(1, parseInt(parts[1], 10) || (ITEMS[key].stack || 64));
      inv.add(key, n);
      chatLog(`🎁 Otrzymano ${n}× ${ITEMS[key].name}`);
      break;
    }
    case 'heal':
      player.health = player.maxHealth; player.hunger = player.maxHunger; player.air = player.maxAir;
      chatLog('❤️ Wyleczono');
      break;
    case 'kill':
      player.health = 0;
      chatLog('💀 Zabito gracza');
      break;
    case 'seed':
      chatLog('🌱 Ziarno świata: ' + world.seed);
      break;
    default:
      chatLog('Nieznana komenda: /' + cmd + '  (wpisz /help)');
  }
}

// ─── LOGOWANIE I ZAPISY NA SERWERZE ─────────────────────────────────────────────
function newGame() {
  if (currentUser) {
    const nm = document.getElementById('saveNameInput').value.trim();
    currentSave = nm || ('Świat ' + new Date().toLocaleDateString('pl-PL'));
  } else currentSave = null;
  startGame(null);
}

async function doLogin() {
  const v = document.getElementById('loginInput').value.trim();
  if (!v) return;
  try { currentUser = await net.login(v); await refreshAccountUI(); showMsg('Zalogowano: ' + currentUser); }
  catch (e) { alert('Logowanie nieudane: ' + e.message); }
}

function doLogout() { net.setSavedUser(null); currentUser = null; currentSave = null; refreshAccountUI(); }

async function refreshAccountUI() {
  const logged = !!currentUser;
  document.getElementById('loginRow').classList.toggle('hidden', logged);
  document.getElementById('accountBox').classList.toggle('hidden', !logged);
  document.getElementById('saveNameInput').classList.toggle('hidden', !logged);
  if (logged) {
    document.getElementById('accName').textContent = currentUser;
    document.getElementById('loginInput').value = '';
    await loadSavesList();
    try { currentMode = await net.getMode(currentUser); }
    catch (e) { currentMode = 'survival'; }
    document.getElementById('gameModeSelect').value = currentMode;
  }
}

// Zmiana trybu gry w oknie logowania — zapisywana od razu na koncie, żeby przy
// kolejnym logowaniu była pamiętana (patrz getMode/setMode w net.js).
async function onGameModeChange() {
  const mode = document.getElementById('gameModeSelect').value;
  currentMode = mode;
  if (!currentUser) return;
  try { await net.setMode(currentUser, mode); }
  catch (e) { showMsg('Błąd zapisu trybu gry: ' + e.message); }
}

async function loadSavesList() {
  const list = document.getElementById('savesList');
  list.innerHTML = '<div class="saves-empty">Ładowanie…</div>';
  try {
    const saves = await net.listSaves(currentUser);
    if (!saves.length) { list.innerHTML = '<div class="saves-empty">Brak zapisów — rozpocznij nową grę.</div>'; return; }
    list.innerHTML = '';
    for (const s of saves) {
      const row = document.createElement('div'); row.className = 'save-item';
      const date = new Date(s.updated_at * 1000).toLocaleString('pl-PL');
      row.innerHTML = `<div class="save-meta"><div class="save-name"></div><div class="save-date">${date} · ${(s.size/1024)|0} KB</div></div>`;
      row.querySelector('.save-name').textContent = s.name;
      const loadB = document.createElement('button'); loadB.className = 'save-load'; loadB.textContent = 'Wczytaj';
      loadB.addEventListener('click', () => loadSave(s.name));
      const delB = document.createElement('button'); delB.className = 'save-del'; delB.textContent = '✕';
      delB.addEventListener('click', () => deleteSave(s.name));
      row.appendChild(loadB); row.appendChild(delB);
      list.appendChild(row);
    }
  } catch (e) { list.innerHTML = '<div class="saves-empty">Błąd: ' + e.message + '</div>'; }
}

async function loadSave(name) {
  try {
    const state = await net.loadGame(currentUser, name);
    currentSave = name;
    startGame(state);
  } catch (e) { alert('Nie udało się wczytać: ' + e.message); }
}

async function deleteSave(name) {
  if (!confirm('Usunąć zapis „' + name + '”?')) return;
  try { await net.deleteGame(currentUser, name); loadSavesList(); }
  catch (e) { alert('Błąd usuwania: ' + e.message); }
}

// Komunikat o zapisie widoczny na ekranie pauzy (HUD jest zasłonięty przez menu).
function setSaveStatus(txt, cls) {
  const el = document.getElementById('saveStatus');
  if (!el) return;
  el.textContent = txt;
  el.className = cls || '';
}

async function saveCurrent() {
  if (currentUser) {
    let name = currentSave;
    if (!name) { name = (prompt('Nazwa zapisu:', 'Mój świat') || '').trim(); if (!name) return; currentSave = name; }
    setSaveStatus('⏳ Zapisywanie…', 'saving');
    try {
      await net.saveGame(currentUser, name, serializeState());
      const t = new Date().toLocaleTimeString('pl-PL', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
      setSaveStatus(`✅ Zapisano „${name}" o ${t}`, 'ok');
      showMsg('💾 Zapisano na serwerze: ' + name);
    } catch (e) {
      setSaveStatus('❌ Błąd zapisu: ' + e.message, 'err');
      showMsg('Błąd zapisu: ' + e.message);
    }
  } else {
    world.save();
    setSaveStatus('💾 Zapisano lokalnie (bez konta)', 'ok');
    showMsg('💾 Zapisano lokalnie');
  }
}

// Autozapis w tle (bez komunikatu): tylko dla zalogowanych z aktywnym slotem.
async function autosave() {
  if (!(currentUser && currentSave && world && running)) return;
  try { await net.saveGame(currentUser, currentSave, serializeState()); } catch (e) { /* cisza */ }
}

// Zapis „na wyjście" (zamknięcie/ukrycie karty) — sendBeacon jest niezawodny
// nawet gdy strona się zamyka (zwykły fetch bywa anulowany).
function saveBeacon() {
  if (!(currentUser && currentSave && world && running)) return;
  try {
    const payload = JSON.stringify({ user: currentUser, name: currentSave, data: JSON.stringify(serializeState()) });
    const blob = new Blob([payload], { type: 'application/json' });
    navigator.sendBeacon('/minecraft/api.php?action=save', blob);
  } catch (e) { /* cisza */ }
}

// ─── LOAD INDICATOR ───────────────────────────────────────────────────────────
function setLoading(msg, pct) {
  document.getElementById('loadStatus').textContent = msg;
  document.getElementById('loadProgress').style.width = pct + '%';
}

// ─── START GAME (savedState=null → nowa gra; obiekt → wczytanie) ───────────────
async function startGame(savedState = null) {
  document.getElementById('startScreen').classList.add('hidden');
  document.getElementById('loadingScreen').classList.remove('hidden');
  setLoading('Tworzenie świata...', 10);
  await tick();

  const canvas = document.getElementById('gameCanvas');
  renderer = new Renderer(canvas);
  renderer.setRenderDistance(RENDER_RADIUS);
  renderer.setFov(settings.get('fov'));
  renderer.setBrightness(settings.get('brightness'));
  audio = new AudioManager();

  // Ziarno: z zapisu albo z pola seed. Tryb świata: normalny / miasto.
  let seed, worldMode;
  if (savedState) { seed = savedState.world.seed; worldMode = savedState.world.mode || 'normal'; }
  else {
    const wt = document.getElementById('worldType').value;
    worldMode = (wt === 'city' || wt === 'space') ? wt : 'normal';
    const seedStr = document.getElementById('seedInput').value.trim() || String(Date.now());
    seed = seedStr.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 0);
  }
  world = new World(seed, worldMode);
  if (savedState) world.importState(savedState.world);   // wczytaj zmienione chunki
  renderer.setSpaceMode(worldMode === 'space');           // scena kosmiczna: gwiazdy/Słońce/Ziemia

  // Pozycja startowa gracza (zapis; stacja — wnętrze; miasto — ulica; inaczej losowy ląd)
  let px, py, pz;
  if (savedState) { px = savedState.player.x; py = savedState.player.y; pz = savedState.player.z; }
  else if (worldMode === 'space') { px = 0.5; py = 52; pz = 0.5; }   // środek centralnego hubu stacji
  else { const sp = worldMode === 'city' ? world.findLandSpawn(1, 1) : world.findLandSpawn(8, 8); px = sp.x; py = sp.y; pz = sp.z; }

  setLoading('Generowanie terenu...', 30);
  await tick();

  // Chunki wokół pozycji gracza
  const ccx = Math.floor(px / 16), ccz = Math.floor(pz / 16);
  let cnt = 0;
  const total = (RENDER_RADIUS * 2 + 1) ** 2;
  for (let dx = -RENDER_RADIUS; dx <= RENDER_RADIUS; dx++) {
    for (let dz = -RENDER_RADIUS; dz <= RENDER_RADIUS; dz++) {
      world.getOrCreateChunk(ccx + dx, ccz + dz);
      cnt++;
      if (cnt % 3 === 0) { setLoading(`Generowanie chunków... ${cnt}/${total}`, 30 + (cnt/total)*50); await tick(); }
    }
  }

  setLoading('Budowanie geometrii...', 80);
  await tick();
  for (const chunk of world.chunks.values()) renderer.buildChunkMesh(chunk, world);
  setLoading('Gotowe!', 100);
  await tick();

  player = new Player(world);
  player.x = px; player.y = py; player.z = pz;
  player.spawnX = px; player.spawnY = py; player.spawnZ = pz;

  inv = new Inventory();
  inv.creative = player.creative;
  invOpen = false;

  mobs = new MobManager(world, renderer.scene, player, audio);
  mobs.onMessage = showMsg;
  mobs.onLoot = (name) => inv.add(name, 1);
  mobs.onXP = (amt) => { player.xp += amt; };
  mobs.onExplosion = (x,y,z) => {
    const cx=Math.floor(x/16), cz=Math.floor(z/16);
    for (let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){ const c=world.getChunk(cx+dx,cz+dz); if(c)c.dirty=true; }
  };

  rs = new RedstoneSim(world);              // symulacja redstone

  if (savedState) applyState(savedState);   // gracz/ekwipunek/piece/skrzynie/czas/redstone

  // Zapamiętany tryb gry zalogowanego konta (okno logowania) ma pierwszeństwo nad
  // trybem zapisanym w konkretnym świecie — obowiązuje też przy wczytywaniu zapisu.
  if (currentUser) {
    player.creative = (currentMode === 'creative');
    if (!player.creative) player.flying = false;
    inv.creative = player.creative;
  }

  ui = new UI(player);
  ui.show();
  applyHideHud(settings.get('hideHud'));

  running = true;
  paused  = false;
  autosaveAcc = 0;
  if (savedState) showMsg(player.creative ? '🟩 Wczytano w trybie: KREATYWNY' : '🟫 Wczytano w trybie: SURVIVAL');
  else if (currentUser) showMsg(player.creative ? '🟩 Nowa gra w trybie: KREATYWNY' : '🟫 Nowa gra w trybie: SURVIVAL');
  document.getElementById('loadingScreen').classList.add('hidden');

  canvas.requestPointerLock();
  lastTime = performance.now();
  requestAnimationFrame(loop);
}

// ─── SERIALIZACJA STANU GRY ─────────────────────────────────────────────────────
function serializeState() {
  return {
    v: 1,
    world: world.exportState(),
    player: {
      x: player.x, y: player.y, z: player.z, yaw: player.yaw, pitch: player.pitch,
      health: player.health, hunger: player.hunger, air: player.air, xp: player.xp,
      creative: player.creative, flying: player.flying,
      spawnX: player.spawnX, spawnY: player.spawnY, spawnZ: player.spawnZ,
      hotbarSlot: player.hotbarSlot,
    },
    inv: { slots: inv.slots, armor: inv.armor, sel: inv.sel },
    furnaces: [...furnaces].map(([k, f]) => ({ k, f: { input:f.input, fuel:f.fuel, output:f.output, burn:f.burn, burnMax:f.burnMax, prog:f.prog } })),
    chests: [...chests].map(([k, c]) => ({ k, items: c.items })),
    redstone: rs.export(),
    dayTime: renderer.dayTime, weather: renderer.weather,
  };
}

function applyState(s) {
  const p = s.player || {};
  player.yaw = p.yaw||0; player.pitch = p.pitch||0;
  player.health = p.health ?? 20; player.hunger = p.hunger ?? 20; player.air = p.air ?? player.maxAir;
  player.xp = p.xp || 0; player.creative = !!p.creative; player.flying = !!p.flying;
  if (p.spawnX != null) { player.spawnX = p.spawnX; player.spawnY = p.spawnY; player.spawnZ = p.spawnZ; }
  player.hotbarSlot = p.hotbarSlot || 0;
  if (s.inv) {
    inv.slots = (s.inv.slots || []).map(x => x ? { ...x } : null);
    while (inv.slots.length < 36) inv.slots.push(null);
    if (s.inv.armor) inv.armor = { head:null, chest:null, legs:null, feet:null, ...s.inv.armor };
    inv.sel = s.inv.sel || 0;
    inv.creative = player.creative;
    inv.renderHotbar();
  }
  furnaces.clear();
  for (const { k, f } of (s.furnaces || [])) furnaces.set(k, { input:f.input, fuel:f.fuel, output:f.output, burn:f.burn||0, burnMax:f.burnMax||0, prog:f.prog||0, smeltTime:SMELT_TIME });
  chests.clear();
  for (const { k, items } of (s.chests || [])) chests.set(k, { items });
  if (rs) rs.import(s.redstone);
  if (typeof s.dayTime === 'number') renderer.dayTime = s.dayTime;
  if (s.weather) renderer.setWeather(s.weather === 'sun' ? 'clear' : s.weather);
  prevHealth = player.health;
}

function tick() { return new Promise(r => setTimeout(r, 0)); }

// ─── GAME LOOP ────────────────────────────────────────────────────────────────
function loop(now) {
  if (!running) return;
  requestAnimationFrame(loop);

  // FPS limit: pomiń klatkę, jeśli od ostatniej minęło za mało czasu.
  if (frameMinMs && now - lastFrame < frameMinMs) return;
  lastFrame = now;

  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  // Autozapis na serwer co AUTOSAVE_EVERY sekund (m.in. utrwala tryb gry i ekwipunek).
  autosaveAcc += dt;
  if (autosaveAcc >= AUTOSAVE_EVERY) { autosaveAcc = 0; autosave(); }

  if (paused || invOpen || chatOpen) {
    // Piece i uprawy działają dalej, gdy otwarty jest ekwipunek/piec/czat (ale nie na pauzie)
    if (!paused) {
      world.tickCrops(dt);
      tickFurnaces(dt);
      rs.tick(dt);
      if (invOpen && inv.mode === 'furnace') inv.renderFurnaceProgress();
      renderer.updateDayNight(dt, player);   // czas/pogoda płyną też podczas pisania
    }
    renderer.render();
    return;
  }

  // sync selected hotbar slot from player input
  if (inv.sel !== player.hotbarSlot) { inv.sel = player.hotbarSlot; inv.renderHotbar(); }

  player.update(dt);
  player.armorPoints = inv.armorPoints();   // zbroja pochłania obrażenia

  // Jazda wagonikiem: napędź wagonik i przyklej do niego kamerę gracza
  if (player.riding) {
    if (player.keys['ShiftLeft'] || player.keys['ShiftRight']) { exitCart(); }
    else {
      mobs.driveCart(player.riding, dt, player.keys, player.yaw);
      player.x = player.riding.x; player.y = player.riding.y; player.z = player.riding.z;
    }
  }

  // Step sound
  if (player.onGround && (player.vx !== 0 || player.vz !== 0)) {
    stepTimer += dt;
    if (stepTimer > 0.4) { audio.playStep(); stepTimer = 0; }
  } else stepTimer = 0;

  // Block breaking
  const hit = player.raycast();
  renderer.updateSelection(hit);

  if (player.creative && mouseLeft) {
    // creative: trzymanie przycisku niszczy kolejne bloki w odstępach czasu
    creativeBreakTimer -= dt;
    if (hit && creativeBreakTimer <= 0) { creativeBreak(); creativeBreakTimer = CREATIVE_BREAK_DELAY; }
  } else if (mouseLeft && hit) {
    const same = breakTarget && breakTarget.wx===hit.wx && breakTarget.wy===hit.wy && breakTarget.wz===hit.wz;
    if (!same) { breakTarget = hit; breakProgress = 0; }
    const b = world.getBlock(hit.wx, hit.wy, hit.wz);
    const hard = BLOCK_PROPS[b]?.hardness ?? 1.0;
    breakProgress += dt * inv.mineMul(b) / (BREAK_TIME_BASE * hard);
    renderer.updateBreakOverlay(hit, breakProgress);
    if (breakProgress >= 1) {
      breakBlockAt(b, hit.wx, hit.wy, hit.wz);
      breakProgress = 0; breakTarget = null;
      renderer.updateBreakOverlay(null, 0);
    }
  } else if (!mouseLeft) {
    breakProgress = 0; breakTarget = null;
  }

  // Chunk updates
  const { added, removed } = world.update(player.x, player.z, RENDER_RADIUS);
  for (const ch of removed) renderer.removeChunk(ch);
  for (const ch of added)   renderer.buildChunkMesh(ch, world);

  // Re-mesh dirty chunks
  for (const chunk of world.chunks.values()) {
    if (chunk.dirty) renderer.buildChunkMesh(chunk, world);
  }

  // Mobs (hostiles only spawn at night)
  mobs.isNight = renderer.isNight;
  mobs.update(dt);

  // Uprawy rosną, piece wytapiają w tle, redstone symuluje
  world.tickCrops(dt);
  tickFurnaces(dt);
  rs.tick(dt);
  if (invOpen && inv.mode === 'furnace') inv.renderFurnaceProgress();

  // Czerwony błysk przy otrzymaniu obrażeń
  if (player.health < prevHealth - 0.01) flashHurt();
  prevHealth = player.health;

  // Death / respawn
  if (player.health <= 0) {
    showMsg('💀 Zginąłeś! Odrodzenie...');
    player.x = player.spawnX; player.y = player.spawnY; player.z = player.spawnZ;
    player.vx = player.vy = player.vz = 0;
    player.health = 20; player.hunger = 20; player.air = player.maxAir;
    prevHealth = 20;
    mobs.clear();
  }

  renderer.updateDayNight(dt, player);
  // Światło pochodni: rozjaśnij, gdy gracz jest blisko którejś z nich
  renderer.applyTorchGlow(torchNear(player.x, player.y, player.z));
  renderer.setFovBoost(player.sprinting ? 8 : 0);   // rozszerz FOV przy sprincie
  renderer.updateCamera(player);
  // Trzymany przedmiot w 1. osobie + machnięcie + cząsteczki
  const selStack = inv.selectedStack(); const selIt = selStack && ITEMS[selStack.key];
  renderer.setHeldItem(selIt ? selStack.key : null, selIt ? (selIt.color || '#999') : null, selIt ? selIt.block != null : false);
  renderer.updateViewmodel(dt);
  renderer.updateParticles(dt);
  ui.update(0, hit);
  renderer.render();
}

// Czy gracz jest w zasięgu światła jakiejś pochodni (promień 7 bloków)?
function torchNear(px, py, pz) {
  const R2 = 7 * 7;
  for (const key of world.torches) {
    const [x, y, z] = key.split(',').map(Number);
    const dx = x + 0.5 - px, dy = y + 0.5 - py, dz = z + 0.5 - pz;
    if (dx*dx + dy*dy + dz*dz <= R2) return true;
  }
  return false;
}

function rebuildAround(wx, wy, wz) {
  const { CHUNK_SIZE } = { CHUNK_SIZE: 16 };
  const cx = Math.floor(wx/16), cz = Math.floor(wz/16);
  const lx = ((wx%16)+16)%16, lz = ((wz%16)+16)%16;
  if (lx===0)  { const c=world.getChunk(cx-1,cz); if(c) c.dirty=true; }
  if (lx===15) { const c=world.getChunk(cx+1,cz); if(c) c.dirty=true; }
  if (lz===0)  { const c=world.getChunk(cx,cz-1); if(c) c.dirty=true; }
  if (lz===15) { const c=world.getChunk(cx,cz+1); if(c) c.dirty=true; }
}

function doPlace() {
  if (!player) return;
  const hit = player.raycast();
  const sel = inv.selectedStack();
  const key = sel?.key;
  const tool = inv.selectedTool();

  // 0) Wagonik: wysiądź, jeśli jedziesz; wsiądź, jeśli patrzysz na wagonik
  if (player.riding) { exitCart(); return; }
  const aimedCart = mobs.pickCart();
  if (aimedCart) { enterCart(aimedCart); return; }

  // 1) Interaktywne bloki: piec / stół / skrzynia / łóżko
  const aimed = hit ? world.getBlock(hit.wx, hit.wy, hit.wz) : B.AIR;
  if (hit && aimed === B.FURNACE)  { openWindow(() => inv.openFurnace(getFurnace(hit.wx, hit.wy, hit.wz))); return; }
  if (hit && aimed === B.CRAFTING_TABLE) { openWindow(() => { inv.creative = player.creative; inv.openTable(); }); return; }
  if (hit && aimed === B.CHEST)    { openWindow(() => inv.openChest(getChest(hit.wx, hit.wy, hit.wz))); return; }
  if (hit && aimed === B.BED)      { sleepInBed(); return; }
  // Interakcja redstone: dźwignia/przycisk/przekaźnik
  if (hit && isRedstone(aimed) && rs.interact(hit.wx, hit.wy, hit.wz)) { audio.playPlace(); return; }

  // 1b) Wiadro: nabieranie / wylewanie wody i lawy
  if (key === 'bucket' || key === 'water_bucket' || key === 'lava_bucket') {
    handleBucket(key);
    return;
  }

  // 1c) Łuk: wystrzel strzałę
  if (key === 'bow') { shootBow(); return; }

  // 1d) Wagonik (dowolny wariant): postaw na torach
  const CART_VARIANT = { minecart:'rideable', chest_minecart:'chest', furnace_minecart:'furnace', tnt_minecart:'tnt' };
  if (key in CART_VARIANT) {
    if (hit && isRailBlock(aimed)) {
      mobs.spawnCart(hit.wx, hit.wy, hit.wz, CART_VARIANT[key]);
      if (!player.creative) inv.consumeSelected();
      audio.playPlace();
    } else showMsg('🛒 Postaw wagonik na torach');
    return;
  }

  // 1e) Narzędzia użytkowe (nożyce / krzesiwo / kompas / zegar)
  if (ITEMS[key]?.util) { useUtilItem(key, hit, aimed); return; }

  // 2) Nakarm zwierzę (pszenica / nasiona), gdy na nie patrzysz
  if ((key === 'wheat' || key === 'seeds') && mobs.tryFeed(key)) {
    inv.consumeSelected();
    showMsg('❤️ Nakarmiono zwierzę');
    return;
  }

  // 3) Motyka: spulchnij ziemię/trawę w grządkę
  if (hit && tool && tool.tool === 'hoe') {
    const b = world.getBlock(hit.wx, hit.wy, hit.wz);
    if ((b === B.DIRT || b === B.GRASS) && world.getBlock(hit.wx, hit.wy+1, hit.wz) === B.AIR) {
      world.setBlock(hit.wx, hit.wy, hit.wz, B.FARMLAND);
      if (!player.creative) inv.wearTool();
      audio.playPlace();
      rebuildAround(hit.wx, hit.wy, hit.wz);
      return;
    }
  }

  // 4) Zasiej nasiona na grządce
  if (hit && key === 'seeds' && world.getBlock(hit.wx, hit.wy, hit.wz) === B.FARMLAND
      && world.getBlock(hit.wx, hit.wy+1, hit.wz) === B.AIR) {
    world.plantCrop(hit.wx, hit.wy+1, hit.wz);
    inv.consumeSelected();
    audio.playPlace();
    rebuildAround(hit.wx, hit.wy+1, hit.wz);
    return;
  }

  // 5) Jedzenie (chleb itp.)
  const eatMsg = inv.eatSelected(player);
  if (eatMsg) { showMsg(eatMsg); return; }

  // 6) Postaw blok
  const block = inv.selectedBlock();
  if (block == null) return;
  if (player.placeBlock(block)) {
    audio.playPlace();
    if (!player.creative) inv.consumeSelected();   // creative = nieskończone bloki
    if (hit) {
      const bx = hit.wx+hit.nx, by = hit.wy+hit.ny, bz = hit.wz+hit.nz;
      world.dropLoose(bx, by, bz); rebuildAround(bx, by, bz);
      if (isRedstone(block)) rs.onPlace(bx, by, bz, block, facingDir());   // rejestruj komponent
    }
    const cx = Math.floor(player.x/16), cz2 = Math.floor(player.z/16);
    const chunk = world.getChunk(cx, cz2);
    if (chunk) chunk.dirty = true;
  }
}

function doBreak() {
  if (!player) return;
  if (player.creative) { creativeBreak(); return; }
  const hit = player.raycast();
  if (!hit) return;
  breakBlockAt(world.getBlock(hit.wx, hit.wy, hit.wz), hit.wx, hit.wy, hit.wz);
}

// Wspólne niszczenie bloku (survival): łup zależny od narzędzia, XP, cząsteczki.
function breakBlockAt(b, x, y, z) {
  audio.playBreak(b);
  if (canHarvest(b, inv.selectedTool())) spawnBlockDrops(b, x, y, z);
  if (b === B.FURNACE) dropFurnaceContents(x, y, z);
  if (b === B.CHEST) dropChestContents(x, y, z);
  const xp = oreXP(b); if (xp) mobs.spawnXP(x, y, z, xp);
  renderer.spawnBlockParticles(x, y, z, ITEMS['b:'+b]?.color || '#888');
  inv.wearTool();
  if (isRedstone(b)) rs.onBreak(x, y, z);
  world.setBlock(x, y, z, B.AIR);
  world.collapseAbove(x, y, z);
  rebuildAround(x, y, z);
}

// Kierunek poziomy gracza jako indeks 0..3 (x+, x-, z+, z-) dla repeatera/tłoka.
function facingDir() {
  const sx = Math.sin(player.yaw), cz = Math.cos(player.yaw);
  return Math.abs(sx) > Math.abs(cz) ? (sx > 0 ? 0 : 1) : (cz > 0 ? 2 : 3);
}
function oreXP(b) {
  if (b === B.COAL_ORE || b === B.IRON_ORE || b === B.GOLD_ORE) return 1;
  if (b === B.DIAMOND_ORE) return 5;
  return 0;
}

// Otwórz okno ekwipunku (piec/stół/skrzynia) i zwolnij pointer lock.
function openWindow(openFn) {
  if (inv.isOpen) return;
  openFn();
  invOpen = true;
  player.inputLocked = true;
  if (document.pointerLockElement) document.exitPointerLock();
}

// Spanie w łóżku: tylko w nocy — przewija do świtu i ustawia respawn.
function sleepInBed() {
  if (!renderer.isNight) { showMsg('⛅ Spać można tylko w nocy'); return; }
  renderer.dayTime = 0.25;   // świt
  player.spawnX = player.x; player.spawnY = player.y; player.spawnZ = player.z;
  showMsg('💤 Dobranoc! Ustawiono punkt odrodzenia.');
}

// ── Wagonik: wsiadanie / wysiadanie / warianty ────────────────────────────────
function enterCart(cart) {
  // Wagonik ze skrzynią → otwórz schowek zamiast jazdy
  if (cart.variant === 'chest') { openWindow(() => inv.openChest(cart.storage)); return; }
  // Wagonik z piecem → PPM węglem dokłada paliwo (napęd)
  if (cart.variant === 'furnace') {
    const sel = inv.selectedStack();
    if (sel && sel.key === 'coal') { cart.fuel += 30; if (!player.creative) inv.consumeSelected(); audio.playPlace(); showMsg('🔥 Wagonik zasilony węglem'); }
    else showMsg('🔥 Zasil węglem (PPM z węglem w ręce)');
    return;
  }
  // Zwykły / TNT wagonik → wsiadanie
  cart.rider = true;
  player.riding = cart;
  player.flying = false;
  player.x = cart.x; player.y = cart.y; player.z = cart.z;
  showMsg('🛒 Wsiadłeś do wagonika — W/S jazda, Shift wysiądź');
}
function exitCart() {
  const cart = player.riding;
  if (cart) { cart.rider = false; cart.speed = 0; }
  player.riding = null;
  player.y = (cart ? cart.y : player.y) + 0.1;
  showMsg('🚶 Wysiadłeś z wagonika');
}
// Rozbij postawiony wagonik — oddaj przedmiot(y) i usuń encję.
function breakCart(cart) {
  const key = { rideable:'minecart', chest:'chest_minecart', furnace:'furnace_minecart', tnt:'tnt_minecart' }[cart.variant] || 'minecart';
  audio.playBreak(B.PLANKS);
  mobs.spawnItem(Math.floor(cart.x), Math.floor(cart.y), Math.floor(cart.z), key, 1);
  // wysyp zawartość skrzyni
  if (cart.variant === 'chest' && cart.storage) {
    for (const it of cart.storage.items) if (it) mobs.spawnItem(Math.floor(cart.x), Math.floor(cart.y), Math.floor(cart.z), it.key, it.n || 1);
  }
  mobs.removeCart(cart);
}

// ── Narzędzia użytkowe (nożyce / krzesiwo / wędka / kompas / zegar) ────────────
function useUtilItem(key, hit, aimed) {
  if (key === 'shears') {
    // owca → wełna
    if (mobs.tryShear()) { if (!player.creative) inv.wearTool(); showMsg('✂️ Ostrzyżono owcę'); return; }
    // liście → upuść blok liści (normalnie się nie zbierają)
    if (hit && aimed === B.LEAVES) {
      audio.playBreak(aimed);
      mobs.spawnItem(hit.wx, hit.wy, hit.wz, 'b:'+B.LEAVES, 1);
      renderer.spawnBlockParticles(hit.wx, hit.wy, hit.wz, ITEMS['b:'+B.LEAVES]?.color || '#3a3');
      world.setBlock(hit.wx, hit.wy, hit.wz, B.AIR);
      rebuildAround(hit.wx, hit.wy, hit.wz);
      return;
    }
    showMsg('✂️ Wyceluj w owcę lub liście');
    return;
  }
  if (key === 'flint_and_steel') {
    audio.playPlace();
    if (hit) renderer.spawnBlockParticles(hit.wx, hit.wy+1, hit.wz, '#ff8020');
    showMsg('🔥 Krzesiwo skrzesało iskry');
    return;
  }
  if (key === 'fishing_rod') { audio.playPlace(); showMsg('🎣 Zarzucono wędkę'); return; }
  if (key === 'compass') {
    const sx = player.spawnX ?? 0, sz = player.spawnZ ?? 0;
    const ang = Math.atan2(sx - player.x, sz - player.z) * 180/Math.PI;
    const dirs = ['płn','płn-wsch','wsch','płd-wsch','płd','płd-zach','zach','płn-zach'];
    const idx = ((Math.round(ang/45) % 8) + 8) % 8;
    showMsg(`🧭 Do startu: ${dirs[idx]}`);
    return;
  }
  if (key === 'clock') {
    const t = renderer.dayTime ?? 0;
    showMsg(renderer.isNight ? `🕛 Noc (${(t*24|0)}:00)` : `🕛 Dzień (${(t*24|0)}:00)`);
    return;
  }
}

// Wystrzel strzałę z łuku (w creative bez zużycia strzał).
function shootBow() {
  if (!player.creative && !takeItem('arrow', 1)) { showMsg('🏹 Brak strzał'); return; }
  const eye = player.getEyePosition();
  const dx = Math.cos(player.pitch)*Math.sin(player.yaw);
  const dy = Math.sin(player.pitch);
  const dz = Math.cos(player.pitch)*Math.cos(player.yaw);
  mobs.shootArrow(eye.x + dx*0.6, eye.y + dy*0.6, eye.z + dz*0.6, dx, dy, dz, true);
  renderer.swingHand();
}

// Obsługa wiadra: nabieranie źródła i wylewanie płynu.
function handleBucket(key) {
  if (key === 'bucket') {
    const h = player.raycast(5.5, true);   // celuj też w płyny
    if (!h) return;
    const b = world.getBlock(h.wx, h.wy, h.wz);
    if (b !== B.WATER && b !== B.LAVA) return;
    world.setBlock(h.wx, h.wy, h.wz, B.AIR);
    rebuildAround(h.wx, h.wy, h.wz);
    inv.consumeSelected();
    inv.add(b === B.WATER ? 'water_bucket' : 'lava_bucket', 1);
    audio.playPlace();
  } else {
    const h = player.raycast();
    if (!h) return;
    const px = h.wx + h.nx, py = h.wy + h.ny, pz = h.wz + h.nz;
    if (world.getBlock(px, py, pz) !== B.AIR) return;
    world.setBlock(px, py, pz, key === 'water_bucket' ? B.WATER : B.LAVA);   // reakcja lawa+woda w setBlock
    rebuildAround(px, py, pz);
    inv.consumeSelected();
    inv.add('bucket', 1);
    audio.playPlace();
  }
}

// Wyrzuć łupy zniszczonego bloku jako fruwające przedmioty do podniesienia.
function spawnBlockDrops(b, x, y, z) {
  const drop = blockDrop(b);
  if (drop) mobs.spawnItem(x, y, z, drop, 1);
  for (const extra of bonusDrops(b)) mobs.spawnItem(x, y, z, extra, 1);
}

// Zwróć zawartość rozbijanego pieca do plecaka i usuń jego stan.
function dropFurnaceContents(x, y, z) {
  const k = `${x},${y},${z}`;
  const f = furnaces.get(k);
  if (!f) return;
  for (const s of [f.input, f.fuel, f.output]) if (s) inv.add(s.key, s.n);
  furnaces.delete(k);
}

// ─── PAUSE / RESUME ───────────────────────────────────────────────────────────
function showPause() {
  paused = true;
  setSaveStatus('', '');   // wyczyść stary komunikat o zapisie
  document.getElementById('pauseScreen').classList.remove('hidden');
  if (document.pointerLockElement) document.exitPointerLock();
}

function resume() {
  paused = false;
  document.getElementById('pauseScreen').classList.add('hidden');
  document.getElementById('gameCanvas').requestPointerLock();
}

// ─── SETTINGS SCREEN ──────────────────────────────────────────────────────────
function openSettings() {
  settingsOpen = true;
  document.getElementById('pauseScreen').classList.add('hidden');
  document.getElementById('settingsScreen').classList.remove('hidden');
}

function closeSettings() {
  settingsOpen = false;
  document.getElementById('settingsScreen').classList.add('hidden');
  document.getElementById('pauseScreen').classList.remove('hidden');
}

// Bind each slider to a setting; changes apply live via settings.onChange.
function setupSettingsControls() {
  const bind = (id, key, fmt) => {
    const slider = document.getElementById(id);
    const label  = document.getElementById(id + 'Val');
    const r = settings.range(key);
    slider.min = r.min; slider.max = r.max; slider.step = r.step;
    const sync = v => { slider.value = v; label.textContent = fmt(v); };
    sync(settings.get(key));
    slider.addEventListener('input', () => {
      const v = parseFloat(slider.value);
      settings.set(key, v);
      label.textContent = fmt(v);
    });
  };
  bind('fovSlider', 'fov', v => `${v}°`);
  bind('sensSlider', 'sensitivity', v => `${Math.round(v * 100)}%`);
  bind('brightSlider', 'brightness', v => `${Math.round(v * 100)}%`);
  bind('renderDistSlider', 'renderDistance', v => `${v} chunk${v === 1 ? '' : 'ów'}`);
  bind('volumeSlider', 'volume', v => `${Math.round(v * 100)}%`);

  // Limit FPS — select (wartości dyskretne)
  const fps = document.getElementById('fpsSelect');
  const fpsLbl = document.getElementById('fpsSelectVal');
  const fpsFmt = v => (v ? `${v} FPS` : 'bez limitu');
  fps.value = String(settings.get('fpsLimit'));
  fpsLbl.textContent = fpsFmt(settings.get('fpsLimit'));
  fps.addEventListener('change', () => {
    const v = parseInt(fps.value, 10);
    settings.set('fpsLimit', v);
    fpsLbl.textContent = fpsFmt(v);
  });

  // Ukryj HUD — przełącznik
  const hud = document.getElementById('hudToggle');
  hud.checked = !!settings.get('hideHud');
  hud.addEventListener('change', () => settings.set('hideHud', hud.checked ? 1 : 0));
}

function exitToMenu() {
  running = false; paused = false; settingsOpen = false;
  // Zrób migawkę stanu TERAZ (świat/gracz zaraz zostaną wyzerowane), a zapis na
  // serwer wykonaj w tle — inaczej przejście do menu czeka na odpowiedź sieci.
  const saveUser = currentUser, saveName = currentSave;
  const payload = (saveUser && saveName && world) ? serializeState() : null;
  if (payload) {
    net.saveGame(saveUser, saveName, payload)
      .then(() => { if (!running && currentUser) refreshAccountUI(); })   // odśwież listę już z aktualnym czasem
      .catch(() => {});
  } else { world?.save(); }
  // Przełącz ekrany natychmiast
  document.getElementById('settingsScreen').classList.add('hidden');
  document.getElementById('pauseScreen').classList.add('hidden');
  document.getElementById('startScreen').classList.remove('hidden');
  ui?.hide();
  if (document.pointerLockElement) document.exitPointerLock();
  // clean up renderer
  if (mobs) { mobs.clear(); mobs = null; }
  if (renderer) { renderer.renderer.dispose(); renderer = null; }
  world = null; player = null; ui = null;
  if (currentUser) refreshAccountUI();   // odśwież listę zapisów w menu
}

// Czerwony błysk na krawędziach ekranu przy obrażeniach.
function flashHurt() {
  const el = document.getElementById('hurt-overlay');
  if (!el) return;
  el.style.transition = 'none';
  el.style.opacity = '0.55';
  requestAnimationFrame(() => { el.style.transition = 'opacity .45s'; el.style.opacity = '0'; });
}

let _msgTimeout;
function showMsg(txt) {
  let el = document.getElementById('game-msg');
  if (!el) { el = document.createElement('div'); el.id='game-msg'; document.getElementById('hud').appendChild(el); }
  el.textContent = txt; el.style.opacity = '1';
  clearTimeout(_msgTimeout);
  _msgTimeout = setTimeout(() => { el.style.opacity = '0'; }, 2000);
}
