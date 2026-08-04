# MineWeb

Voxelowa gra 3D typu Minecraft, działająca w przeglądarce — bez instalacji, bez pluginów.

**Gra na żywo:** [robcior.pl/minecraft](https://robcior.pl/minecraft/)

## Opis

MineWeb to napisany od zera, w pełni przeglądarkowy klon Minecrafta. Generowanie terenu (szum
Simplex), fizyka gracza, budowanie/niszczenie bloków, crafting, walka z mobami, redstone i zapisy
gry — wszystko po stronie klienta w czystym JavaScripcie, renderowane przez Three.js.

Funkcje:
- **Generowanie świata** — trzy tryby: świat normalny (teren proceduralny), miasto (budynki,
  ulice, wnętrza) i stacja kosmiczna (zerowa grawitacja).
- **Budowanie i crafting** — pełny system bloków/przedmiotów, stół rzemieślniczy 3×3, piec,
  zbroja i narzędzia w kilku tierach (drewno → kamień → żelazo → złoto → diament).
- **Redstone** — dźwignie, przyciski, przekaźniki, tłoki, pył i pochodnie redstone z własną
  symulacją logiczną.
- **Moby** — zwierzęta pasywne i wrogie z prostym AI, dropy, doświadczenie.
- **Tory i wagoniki** — sieć kolejowa z zakrętami, torami zasilanymi/z czujnikiem/aktywującymi.
- **Konta i zapisy** — logowanie samym nickiem (bez haseł), wiele nazwanych zapisów na konto,
  zapamiętywany tryb gry (creative/survival) między sesjami. Bez logowania gra działa lokalnie
  (zapis w `localStorage` przeglądarki).
- **Ustawienia** — FOV, czułość myszy, jasność, zasięg renderowania, limit FPS, dźwięk.

## Sterowanie

| Klawisz | Akcja |
|---------|-------|
| WASD | Ruch |
| Mysz | Obrót kamery |
| LPM (przytrzymaj) | Niszczenie bloku |
| PPM | Stawianie bloku |
| Spacja | Skok |
| 2× Spacja | Tryb latania |
| Shift | Sprint / skradanie |
| 1–9 / scroll | Hotbar |
| E | Plecak / crafting |
| Esc | Pauza / menu |
| T lub / | Czat / komendy |

## Stack technologiczny

- **Vanilla JavaScript** (moduły ES6) — brak frameworka.
- **[Three.js r128](https://threejs.org/)** ładowany z CDN przez `importmap` — tylko do renderowania WebGL.
- **Web Audio API** — dźwięki syntezowane proceduralnie (bez plików audio).
- **PHP** (`api.php`) — lekki backend zapisów: bez bazy danych, bez haseł, dane jako pliki JSON.
- **Zero builda** — brak npm/webpacka/kroku kompilacji; pliki serwowane bezpośrednio.

Szczegóły architektury i konwencji kodu: [CLAUDE.md](CLAUDE.md).

## Struktura projektu

```
index.html      # punkt wejścia: canvas, ekrany (login/loading/pauza), HUD
api.php         # backend PHP: login/list/save/load/delete zapisów
css/style.css   # retro pixel UI
js/             # cała logika gry (moduły ES6) — patrz CLAUDE.md po szczegóły
tests/          # testy jednostkowe (node --test)
```

## Uruchomienie lokalne

Gra nie wymaga builda ani zależności npm — potrzebny jest tylko lokalny serwer HTTP z obsługą PHP
(moduły ES6 nie wczytają się z pliku `file://`).

```bash
git clone https://github.com/rrobciorr/mineweb.git
cd mineweb
php -S localhost:8000
```

Następnie otwórz [http://localhost:8000/](http://localhost:8000/) w przeglądarce.

- **Gra bez logowania** działa od razu — świat zapisuje się lokalnie w `localStorage`.
- **Logowanie i zapisy na serwerze** wymagają, by `DATA_DIR` w `api.php` wskazywał na istniejący,
  zapisywalny katalog (domyślnie ustawiony na ścieżkę produkcyjną `/var/www/mineweb-data` — do
  pracy lokalnej zmień ją tymczasowo na katalog na swoim dysku).

## Testy

Testy jednostkowe (`node --test`, bez zależności) pokrywają logikę niezależną od przeglądarki:
generację świata, bloki, ekwipunek/crafting, redstone, tory.

```bash
npm test
# albo bezpośrednio:
./run-tests.sh
```

## Wdrożenie

Projekt jest wdrażany na `robcior.pl/minecraft` przez dedykowany skrypt, który uruchamia testy,
kopiuje pliki, robi cache-busting i czyści cache Cloudflare jednym poleceniem. Szczegóły:
[DEPLOY.md](DEPLOY.md).
