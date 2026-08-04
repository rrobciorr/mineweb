# Wdrożenie MineWeb na robcior.pl

## Pliki gry
Pliki są już skopiowane do: `/var/www/Sklep2D/minecraft/`

## Dodanie lokacji do nginx (raz, wymaga sudo)

Edytuj `/etc/nginx/sites-available/sklep2d` i dodaj blok **przed** `location /rpg/`:

```nginx
location /minecraft/ {
    alias /var/www/Sklep2D/minecraft/;
    index index.html;
    location ~* \.js$ {
        add_header Content-Type "application/javascript; charset=utf-8";
        expires 1d;
    }
}
```

Potem:
```bash
sudo nginx -t && sudo systemctl reload nginx
```

## Aktualizacja plików gry (bez sudo)

**Używaj zawsze skryptu deployu** — robi kopiowanie + automatyczny cache-busting
(`?v=<build>` na wszystkich .js/.css) + purge cache Cloudflare jednym poleceniem,
więc nie da się zapomnieć o żadnym kroku (to był powód błędu w #1/#2):

```bash
~/deploy/deploy.sh minecraft
```

Skrót `minecraft` jest zdefiniowany w `~/deploy/deploy.sh` (mapowanie
`~/minecraft-web → /var/www/Sklep2D/minecraft`). Można też wprost:

```bash
~/deploy/deploy.sh ~/minecraft-web /var/www/Sklep2D/minecraft
```

> Ręczne `cp` jest odradzane — pomija cache-busting i purge. Patrz `~/deploy/`
> oraz `~/.cloudflare.env` (konfiguracja purge Cloudflare).

## URL gry
https://robcior.pl/minecraft/

## Sterowanie
| Klawisz | Akcja |
|---------|-------|
| WASD | Ruch |
| Mysz | Obrót kamery |
| LPM (przytrzymaj) | Niszczenie bloku |
| PPM | Stawianie bloku |
| Spacja | Skok |
| 2× Spacja | Tryb latania |
| 1-9 / Scroll | Hotbar |
| Shift | Sprint |
| Esc | Pauza / Menu |
| F | Przyśpiesz czas (debug) |

## Technologia
- Three.js r128 (CDN, bez npm)
- Simplex Noise (własna implementacja)
- Vanilla ES6 modules (importmap)
- localStorage do zapisu świata
- Web Audio API (proceduralne dźwięki)
- Zero backendu, zero bazy danych
