# CLAUDE.md — MineWeb

Wskazówki dla Claude Code przy pracy nad grą **MineWeb** — voxelowa gra 3D typu Minecraft,
działająca w przeglądarce. UI po polsku, kod po angielsku.

Serwowana pod **robcior.pl/minecraft**.

## Tech stack
- **Vanilla JavaScript** (moduły ES6, `import`/`export`) — brak frameworka.
- **Three.js r128** ładowany przez `importmap` z CDN (cloudflare) — używany tylko do renderowania WebGL.
- **Web Audio API** — syntezowane dźwięki (bez plików audio).
- **PHP** (`api.php`) — backend zapisów.
- **Brak buildu / bundlera** — pliki serwowane bezpośrednio. Nie ma npm, webpacka, kroku kompilacji.

## Struktura plików
```
index.html          # entry point: canvas, ekrany (login/loading/pauza), HUD, importmap Three.js
api.php             # backend PHP: zapisy graczy (login/list/save/load/delete)
css/style.css       # retro pixel UI (font Press Start 2P)
js/
  main.js           # orkiestrator: pętla gry, input, komendy, save/load, stan globalny
  world.js          # World + Chunk: generacja terenu (Simplex noise), ładowanie chunków
  player.js         # Player: fizyka, kolizje AABB, raycast, input
  renderer.js       # Renderer: scena Three.js, meshowanie chunków, kamera, cząsteczki, atlas tekstur
  blocks.js         # rejestr bloków: enum B, BLOCK_PROPS, BLOCK_COLORS, BLOCK_FACES
  inventory.js      # Inventory: ITEMS, crafting, wytapianie, zbroja, GUI
  entities.js       # MobManager + Mob: moby pasywne/wrogie, AI, dropy, wagoniki, strzały
  redstone.js       # RedstoneSim: bramki logiczne (repeater, lever, lamp, piston…)
  audio.js          # AudioManager: dźwięki przez Web Audio API
  ui.js             # UI: paski HUD (serca, głód, XP, zbroja)
  net.js            # klient API: login/listSaves/saveGame/loadGame/deleteGame
  settings.js       # singleton ustawień (localStorage + callbacki zmian)
  noise.js          # SimplexNoise: seedowany szum 2D do terenu
```

## Uruchomienie i deploy
- **Źródło (praca deweloperska):** `~/minecraft-web` — TU wprowadzaj zmiany. Patrz też `DEPLOY.md`.
- **Wdrożenie:** `~/deploy/deploy.sh minecraft` → kopiuje do `/var/www/Sklep2D/minecraft`.
- Deploy używa `rsync -a --delete --exclude='.git' --exclude='*.md' --exclude='nginx.conf'`.
  - **Pliki `.md` NIE są deployowane** — ten CLAUDE.md żyje osobno w źródle i w deployu.
  - `--delete` kasuje w celu pliki nieobecne w źródle (oprócz wykluczeń).
- **Wymagany PHP** na serwerze.
- **Dane zapisów:** `/var/www/mineweb-data/` — POZA katalogiem deploya, więc `rsync --delete`
  ich nie usuwa. Katalog musi istnieć i być zapisywalny dla `www-data`:
  `sudo mkdir -p /var/www/mineweb-data && sudo chown www-data:www-data /var/www/mineweb-data`

## Cache-busting (WAŻNE po każdej zmianie JS)
`robcior.pl` jest za Cloudflare — statyczny JS jest cache'owany na edge (~4h). Po zmianie plików
`js/*` zbij cache przez podbicie wersji w `index.html` (import głównego skryptu, obecnie
`js/main.js?v=23`). Bez tego użytkownicy dostaną starą wersję.

## Backend — api.php
- Routing: `api.php?action=login|list|save|load|delete`.
- **Bez bazy i bez haseł.** Login waliduje nick do `[A-Za-z0-9_]` (3–20 znaków) i tworzy katalog
  użytkownika w `DATA_DIR` (`/var/www/mineweb-data`).
- Zapisy to pliki JSON per użytkownik; nazwa pliku = `md5(nazwa_zapisu)` (bezpieczna dla FS).
- Format odpowiedzi: `{ok: bool, error|data}`.
- Struktura zapisu:
  ```json
  { "name": "...", "updated_at": 1626234567, "data": "{base64 stanu świata}" }
  ```
- Serializowany stan świata (z `main.serializeState()`): `v`, `world.seed`, `world.chunks`
  (`"cx,cz": base64`), `player` (poz./rot./health/hunger/creative/flying), `inv` (slots/armor/sel),
  `furnaces`, `chests`, `redstone`, `dayTime`.

## Architektura i konwencje
- **main.js** trzyma stan globalny (player, world, inventory, running…) i wywołuje pozostałe moduły.
- Klasy: `PascalCase`. Funkcje/zmienne: `snake_case`/camelCase jak w otoczeniu.
- Bloki: enum `B.*` (WIELKIE litery). Itemy: `ITEMS[...]`, klucze bloków w postaci `b:id`.
- Chunki oznaczane `dirty` i przebudowywane w kolejnej klatce; geometria nieindeksowana
  (6 wierzchołków/ściana), kolory per-ściana z cieniowaniem.
- Stringi UI po polsku, kod i komentarze po angielsku (mieszane — trzymaj się istniejącego stylu w pliku).

## Zanim edytujesz
1. Zmiany rób w `~/minecraft-web`, nie bezpośrednio w `/var/www/Sklep2D/minecraft`.
2. Po zmianie JS podbij `?v=` w `index.html`.
3. Wdróż przez `~/deploy/deploy.sh minecraft`.

## OBOWIĄZKOWO przy nowej funkcjonalności — testy jednostkowe
Wprowadzając **nowy element / funkcjonalność**, napisz do niego **odpowiedni test jednostkowy**,
który sprawdza działanie tej nowej funkcji:
1. Dodaj test w `tests/` (konwencja: `<obszar>.test.js`, runner `node --test`, `assert/strict`).
   Testuj logikę importowalną bez przeglądarki (np. `blocks`, `inventory`, `world`, `redstone`).
2. Uruchom testy po zmianie: `./run-tests.sh` (lub `npm test`).
3. Testy muszą zakończyć się **sukcesem** (kod wyjścia 0, `# fail 0`).
   **Jeśli któryś test nie przechodzi — popraw błędy** (w kodzie lub w teście) i uruchom ponownie,
   aż wszystkie będą zielone. Nie wdrażaj z czerwonymi testami.
   `deploy.sh` i tak odpala testy przed wdrożeniem i **przerywa deploy przy niepowodzeniu**.

## OBOWIĄZKOWO po KAŻDEJ zmianie
Po każdej zmianie **zrób deploy i sprawdź, czy serwer wysyła najnowszą wersję**:
1. Wdróż: `~/deploy/deploy.sh minecraft`.
2. Sprawdź, że serwer serwuje aktualne pliki (pamiętaj o cache Cloudflare, ~4h):
   - Potwierdź nowy numer `?v=` w serwowanym `index.html`:
     `curl -s https://robcior.pl/minecraft/ | grep -o 'main.js?v=[0-9]*'`
   - Pobierz świeżo zmieniony plik JS i zweryfikuj, że zawiera Twoją zmianę:
     `curl -s "https://robcior.pl/minecraft/js/main.js?v=<nowa_wersja>" | grep <fragment_zmiany>`
   - Jeśli serwer wciąż zwraca starą wersję → podbij `?v=` i wdróż ponownie (patrz
     sekcja *Cache-busting*).
3. **Zrób commit i push na GitHub** (kontrola wersji): `~/minecraft-web` jest repozytorium git
   (remote `origin` → [github.com/rrobciorr/mineweb](https://github.com/rrobciorr/mineweb)):
   ```bash
   cd ~/minecraft-web
   git add -A
   git commit -m "<krótki opis zmiany>"
   git push
   ```
   Rób to za **każdym razem**, gdy zmieniasz coś w `~/minecraft-web` — także dla zmian,
   które same w sobie nie wymagają deployu (np. tylko `CLAUDE.md`/`DEPLOY.md`, które i tak
   nie są deployowane, patrz sekcja *Uruchomienie i deploy*). Bez tego historia zmian w GitHub
   będzie niekompletna.
