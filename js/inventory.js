import { B, BLOCK_PROPS, BLOCK_COLORS, HOTBAR_BLOCKS, iconTile, atlasImageURL, ATLAS_COLS, isRedstone, REDSTONE_IDS } from './blocks.js?v=29';

// Ustaw tło elementu na ikonę z atlasu (albo kolor fallback, gdy brak kafelka).
function applyIcon(el, key) {
  if (el._iconKey === key) return;   // bez zbędnych podmian (dataURL bywa duży)
  el._iconKey = key;
  const tile = iconTile(key);
  if (tile >= 0) {
    const col = tile % ATLAS_COLS, row = Math.floor(tile / ATLAS_COLS), N = ATLAS_COLS;
    el.style.backgroundColor = 'transparent';
    el.style.backgroundImage = `url(${atlasImageURL()})`;
    el.style.backgroundRepeat = 'no-repeat';
    el.style.backgroundSize = `${N * 100}% ${N * 100}%`;
    el.style.backgroundPosition = `${(col / (N - 1)) * 100}% ${(row / (N - 1)) * 100}%`;
    el.style.imageRendering = 'pixelated';
  } else {
    el.style.backgroundImage = 'none';
    el.style.background = ITEMS[key]?.color || '#777';
  }
}

const hex = (c) => '#' + c.map(v => Math.round(v*255).toString(16).padStart(2,'0')).join('');

// ── Item registry ────────────────────────────────────────────────────────────
// key 'b:<id>' = placeable block; other keys = items/tools
export const ITEMS = {};
// Opisy bloków (dymek po najechaniu w ekwipunku)
const BLOCK_DESC = {
  [B.GRASS]:'Podstawowy blok terenu. Czasem daje nasiona.',
  [B.DIRT]:'Zwykła ziemia. Motyką zrobisz z niej grządkę.',
  [B.STONE]:'Twardy kamień. Materiał na piec i lepsze narzędzia.',
  [B.SAND]:'Sypki piasek. Wytop w piecu na szkło.',
  [B.WOOD]:'Kłoda drewna. Przerób na deski.',
  [B.LEAVES]:'Liście drzewa.',
  [B.GLASS]:'Przezroczyste szkło z wytopionego piasku.',
  [B.BRICK]:'Ozdobna cegła.',
  [B.SNOW]:'Śnieżny blok z zimnych biomów.',
  [B.BEDROCK]:'Niezniszczalne podłoże świata.',
  [B.GRAVEL]:'Żwir — opada pod wpływem grawitacji.',
  [B.PLANKS]:'Deski — podstawa craftingu narzędzi.',
  [B.COAL_ORE]:'Ruda węgla. Węgiel to paliwo i pochodnie.',
  [B.IRON_ORE]:'Ruda żelaza. Wytop, by uzyskać sztabkę.',
  [B.GOLD_ORE]:'Ruda złota. Wytop, by uzyskać sztabkę.',
  [B.DIAMOND_ORE]:'Ruda diamentu — najlepsze narzędzia.',
  [B.OBSIDIAN]:'Bardzo twardy obsydian (lawa + woda).',
  [B.TORCH]:'Pochodnia — oświetla ciemne jaskinie.',
  [B.FURNACE]:'Piec — wytapia rudy i piecze piasek. PPM otwiera.',
  [B.COBBLE]:'Bruk z wykopanego kamienia. Wytop, by odzyskać kamień.',
  [B.CRAFTING_TABLE]:'Stół rzemieślniczy — PPM otwiera pełny crafting 3×3.',
  [B.CHEST]:'Skrzynia — PPM otwiera schowek na przedmioty.',
  [B.BED]:'Łóżko — PPM w nocy przewija do świtu i ustawia respawn.',
  [B.REDSTONE_BLOCK]:'Stałe źródło zasilania redstone (moc 15).',
  [B.RS_LAMP]:'Lampa redstone — świeci, gdy zasilona.',
  [B.RS_DUST]:'Pył redstone — przewód przenoszący sygnał (0–15, zanika).',
  [B.RS_TORCH]:'Pochodnia redstone — źródło i inwerter (bramka NOT).',
  [B.LEVER]:'Dźwignia — PPM przełącza zasilanie (on/off).',
  [B.BUTTON]:'Przycisk — PPM daje krótki impuls (~1 s).',
  [B.REPEATER]:'Przekaźnik — kierunkowy, opóźnia i wzmacnia sygnał (PPM: 1–4).',
  [B.PISTON]:'Tłok — po zasileniu przesuwa blok przed sobą.',
  [B.DOOR]:'Drzwi — otwierają się (przejście) po zasileniu.',
  // ── nowe bloki dekoracyjne ──
  [B.GLASS_WHITE]:'Barwione szkło. Szkło + biała wełna.',
  [B.GLASS_RED]:'Barwione szkło. Szkło + czerwona wełna.',
  [B.GLASS_BLUE]:'Barwione szkło. Szkło + niebieska wełna.',
  [B.GLASS_GREEN]:'Barwione szkło. Szkło + zielona wełna.',
  [B.GLASS_YELLOW]:'Barwione szkło. Szkło + żółta wełna.',
  [B.GLASS_BLACK]:'Barwione szkło. Szkło + czarna wełna.',
  [B.CARPET_WHITE]:'Dekoracyjny dywan. Z białej wełny.',
  [B.CARPET_RED]:'Dekoracyjny dywan. Z czerwonej wełny.',
  [B.CARPET_BLUE]:'Dekoracyjny dywan. Z niebieskiej wełny.',
  [B.CARPET_GREEN]:'Dekoracyjny dywan. Z zielonej wełny.',
  [B.CARPET_YELLOW]:'Dekoracyjny dywan. Z żółtej wełny.',
  [B.CARPET_BLACK]:'Dekoracyjny dywan. Z czarnej wełny.',
  [B.DARK_WOOD]:'Ciemna kłoda — drewno okopcone węglem.',
  [B.DARK_PLANKS]:'Ciemne deski z ciemnego drewna.',
  [B.PALE_WOOD]:'Jasna kłoda — drewno wybielone kością.',
  [B.PALE_PLANKS]:'Jasne deski z jasnego drewna.',
  [B.POLISHED_STONE]:'Gładki, polerowany kamień budowlany.',
  [B.GRANITE]:'Różowoszara skała ze skrapleniami. Kamień + cegła.',
  [B.MARBLE]:'Biały kamień z szarymi żyłkami. Kamień + kwarc.',
};
// Bloki, które nie są normalnymi przedmiotami (nie da się ich mieć w ręce)
const NON_ITEM_BLOCKS = new Set([B.AIR, B.WATER, B.LAVA, B.CROP, B.CROP_RIPE, B.FARMLAND,
  // wewnętrzne warianty stanu redstone (nie do stawiania z ręki)
  B.RS_LAMP_ON, B.RS_DUST_ON, B.RS_TORCH_OFF, B.DOOR_OPEN]);
for (const idStr in BLOCK_PROPS) {
  const id = +idStr;
  if (NON_ITEM_BLOCKS.has(id)) continue;
  const col = BLOCK_COLORS[id] ? hex(BLOCK_COLORS[id].top) : '#888';
  ITEMS['b:'+id] = { name: BLOCK_PROPS[id].name, color: col, block: id, stack: 64,
                     desc: BLOCK_DESC[id] || 'Blok, który możesz postawić.' };
}
// raw items
const addItem = (k, name, color, extra={}) => ITEMS[k] = { name, color, stack:64, ...extra };
addItem('stick', 'Patyk', '#9a6a30', { desc:'Trzonek do narzędzi i pochodni.' });
addItem('coal', 'Węgiel', '#222', { desc:'Paliwo do pieca i składnik pochodni.' });
addItem('raw_iron', 'Surowe żelazo', '#c8a088', { desc:'Wytop w piecu na sztabkę żelaza.' });
addItem('raw_gold', 'Surowe złoto', '#d8c060', { desc:'Wytop w piecu na sztabkę złota.' });
addItem('iron_ingot', 'Sztabka żelaza', '#d8c8b8', { desc:'Materiał na wytrzymałe narzędzia.' });
addItem('gold_ingot', 'Sztabka złota', '#e8c840', { desc:'Szybkie, ale kruche narzędzia.' });
addItem('diamond', 'Diament', '#5ce0e6', { desc:'Najlepsze i najtrwalsze narzędzia.' });
addItem('seeds', 'Nasiona', '#c8d84a', { seed:true, desc:'Zasiej na grządce, by wyhodować zboże. Karmi kury.' });
addItem('wheat', 'Pszenica', '#e8d060', { desc:'Na chleb. Karmi krowy, owce i świnie.' });
addItem('bread', 'Chleb', '#c89048', { food:8, desc:'Sycące jedzenie (+8 głodu). PPM aby zjeść.' });
addItem('bucket', 'Wiadro', '#b8b8c0', { stack:1, desc:'PPM na wodzie/lawie, by nabrać.' });
addItem('water_bucket', 'Wiadro wody', '#3a6ad0', { stack:1, desc:'PPM aby wylać wodę. Woda + lawa = obsydian.' });
addItem('lava_bucket', 'Wiadro lawy', '#ff6a10', { stack:1, desc:'PPM aby wylać lawę. Uważaj — parzy!' });
// foods (also dropped by mobs, keyed by their loot label)
addItem('Wołowina 🥩', 'Wołowina', '#b0402c', { food: 7, desc:'Mięso z krowy (+7 głodu).' });
addItem('Wieprzowina 🥓', 'Wieprzowina', '#e08a90', { food: 6, desc:'Mięso ze świni (+6 głodu).' });
addItem('Zgniłe mięso 🍖', 'Zgniłe mięso', '#7a5a3a', { food: 3, desc:'Z zombie. Głód syci słabo (+3).' });
addItem('Wełna 🧶', 'Wełna', '#e8e8e0', { desc:'Miękka wełna z owcy.' });
addItem('Kość 🦴', 'Kość', '#eee8d8', { desc:'Upuszczana przez szkielety.' });
addItem('Pióro 🪶', 'Pióro', '#f0f0f0', { desc:'Lekkie pióro z kury.' });
addItem('Proch 💥', 'Proch', '#555', { desc:'Wybuchowy proch z creepera.' });
addItem('leather', 'Skóra', '#8a5a30', { desc:'Ze skóry krów. Na zbroję skórzaną.' });
addItem('string', 'Nić', '#e8e8e8', { desc:'Z pająków. Na łuk.' });
addItem('flint', 'Krzemień', '#3a3a3a', { desc:'Czasem ze żwiru. Na strzały.' });
addItem('bow', 'Łuk', '#a06a30', { stack:1, desc:'PPM aby strzelać (potrzebne strzały).' });
addItem('arrow', 'Strzała', '#c8c8c8', { desc:'Amunicja do łuku.' });

// ── Nowe surowce / materiały ──────────────────────────────────────────────────
addItem('emerald', 'Szmaragd', '#20c060', { desc:'Cenny klejnot. Blok szmaragdu z 9 sztuk.' });
addItem('lapis', 'Lapis lazuli', '#2848c0', { desc:'Niebieski barwnik i materiał ozdobny.' });
addItem('clay_ball', 'Grudka gliny', '#9aa0ac', { desc:'Wytop w piecu na cegłę.' });
addItem('brick_item', 'Cegła', '#b05030', { desc:'Wytopiona z gliny. 4 sztuki → blok cegieł.' });
addItem('paper', 'Papier', '#f0f0e8', { desc:'Do książek.' });
addItem('book', 'Książka', '#a05028', { desc:'Składnik regału.' });
addItem('sugar', 'Cukier', '#f4f4f8', { desc:'Słodki składnik do ciastek.' });

// ── Nowe jedzenie ─────────────────────────────────────────────────────────────
addItem('apple', 'Jabłko', '#d03028', { food:4, desc:'Chrupiące jabłko (+4 głodu). PPM aby zjeść.' });
addItem('golden_apple', 'Złote jabłko', '#f0c030', { food:8, desc:'Wyśmienite (+8 głodu). PPM aby zjeść.' });
addItem('carrot', 'Marchew', '#e07820', { food:3, desc:'Warzywo (+3 głodu). PPM aby zjeść.' });
addItem('potato', 'Ziemniak', '#c8a860', { food:2, desc:'Surowy ziemniak (+2). Upiecz w piecu.' });
addItem('baked_potato', 'Pieczony ziemniak', '#c88840', { food:5, desc:'Pieczony (+5 głodu). PPM aby zjeść.' });
addItem('cookie', 'Ciastko', '#b07838', { food:2, desc:'Słodkie ciastko (+2 głodu).' });
addItem('melon_slice', 'Kawałek arbuza', '#e04840', { food:2, desc:'Soczysty (+2 głodu). PPM aby zjeść.' });
addItem('raw_chicken', 'Surowy kurczak', '#e8b0a0', { food:2, desc:'Surowe mięso (+2). Upiecz w piecu.' });
addItem('cooked_chicken', 'Pieczony kurczak', '#c88850', { food:6, desc:'Pieczony kurczak (+6 głodu).' });
addItem('cooked_beef', 'Stek', '#8a4028', { food:8, desc:'Soczysty stek (+8 głodu).' });
addItem('cooked_porkchop', 'Pieczona wieprzowina', '#d09070', { food:8, desc:'Pieczona wieprzowina (+8 głodu).' });

// ── Nowe narzędzia / przedmioty użytkowe ──────────────────────────────────────
addItem('shears', 'Nożyce', '#c8ccd2', { stack:1, util:true, desc:'PPM na owcy → wełna; szybko ścina liście.' });
addItem('flint_and_steel', 'Krzesiwo', '#b0783a', { stack:1, util:true, desc:'PPM aby skrzesać ogień (podpala).' });
addItem('fishing_rod', 'Wędka', '#a07838', { stack:1, util:true, desc:'Wędka do łowienia ryb.' });
addItem('compass', 'Kompas', '#c04040', { stack:1, util:true, desc:'PPM pokazuje kierunek do punktu startu.' });
addItem('clock', 'Zegar', '#e0c040', { stack:1, util:true, desc:'PPM pokazuje porę dnia.' });
addItem('minecart', 'Wagonik', '#8a8a92', { stack:1, util:true, desc:'Postaw na torach i PPM, aby wsiąść.' });
addItem('chest_minecart', 'Wagonik ze skrzynią', '#8a5a28', { stack:1, util:true, desc:'Mobilny schowek. PPM otwiera skrzynię.' });
addItem('furnace_minecart', 'Wagonik z piecem', '#6a6a6a', { stack:1, util:true, desc:'PPM węglem, aby napędzić skład.' });
addItem('tnt_minecart', 'Wagonik z TNT', '#c0342a', { stack:1, util:true, desc:'Wybucha na torze aktywującym.' });

// ── Zbroja ────────────────────────────────────────────────────────────────────
// slot: head|chest|legs|feet, prot = punkty ochrony (redukcja obrażeń)
const ARMOR_TIERS = {
  leather: { mat:'leather',     col:'#8a5a30', prot:{head:1,chest:3,legs:2,feet:1} },
  gold:    { mat:'gold_ingot',  col:'#e8c840', prot:{head:2,chest:5,legs:3,feet:1} },
  iron:    { mat:'iron_ingot',  col:'#d8d8d8', prot:{head:2,chest:6,legs:5,feet:2} },
  diamond: { mat:'diamond',     col:'#5ce0e6', prot:{head:3,chest:8,legs:6,feet:3} },
};
const ARMOR_PARTS = { helmet:'head', chestplate:'chest', leggings:'legs', boots:'feet' };
const PART_PL = { helmet:'Hełm', chestplate:'Napierśnik', leggings:'Nogawice', boots:'Buty' };
for (const t in ARMOR_TIERS) for (const p in ARMOR_PARTS) {
  const slot = ARMOR_PARTS[p], prot = ARMOR_TIERS[t].prot[slot];
  ITEMS[`${t}_${p}`] = { name:`${PART_PL[p]} ${t}`, color:ARMOR_TIERS[t].col, stack:1,
                         armor:slot, prot, desc:`Zbroja na ${slot}, ochrona +${prot}` };
}

// tools: tier material -> { speed multiplier, durability }
const TIERS = {
  wood:    { mat:'b:'+B.PLANKS, mul:2,  dur:60,  col:'#b08040' },
  stone:   { mat:'b:'+B.COBBLE, mul:4,  dur:130, col:'#888' },
  iron:    { mat:'iron_ingot',  mul:6,  dur:250, col:'#d8c8b8' },
  gold:    { mat:'gold_ingot',  mul:12, dur:33,  col:'#e8c840' },
  diamond: { mat:'diamond',     mul:8,  dur:1560,col:'#5ce0e6' },
};
const TOOLKINDS = ['pickaxe','axe','shovel','sword','hoe'];
const KIND_PL = { pickaxe:'Kilof', axe:'Topór', shovel:'Łopata', sword:'Miecz', hoe:'Motyka' };
const TIER_PL = { wood:'drewniany', stone:'kamienny', iron:'żelazny', gold:'złoty', diamond:'diamentowy' };
const KIND_DESC = {
  pickaxe:'Szybciej kopie kamień, rudy i obsydian.',
  axe:'Szybciej ścina drewno i deski.',
  shovel:'Szybciej kopie ziemię, piasek i żwir.',
  sword:'Zadaje większe obrażenia potworom.',
  hoe:'PPM na ziemi/trawie tworzy grządkę pod uprawy.',
};
for (const t in TIERS) for (const k of TOOLKINDS) {
  ITEMS[`${t}_${k}`] = { name:`${KIND_PL[k]} ${t}`, color:TIERS[t].col, stack:1,
                         tool:k, tier:t, mul:TIERS[t].mul, maxDur:TIERS[t].dur,
                         desc:`${KIND_DESC[k]} (${TIER_PL[t]}, wytrzymałość ${TIERS[t].dur})` };
}

// ── Block → dropped item ─────────────────────────────────────────────────────
// Rudy dają teraz surowce (do wytopienia w piecu), nie gotowe sztabki.
const DROPS = {
  [B.GRASS]:'b:'+B.DIRT, [B.LEAVES]:null, [B.STONE]:'b:'+B.COBBLE,
  [B.COAL_ORE]:'coal', [B.IRON_ORE]:'raw_iron', [B.GOLD_ORE]:'raw_gold', [B.DIAMOND_ORE]:'diamond',
  [B.FARMLAND]:'b:'+B.DIRT, [B.LAVA]:null, [B.CROP]:null, [B.CROP_RIPE]:null,
  // nowe rudy i bloki — rudy dają surowiec, glina grudki, lód nic
  [B.EMERALD_ORE]:'emerald', [B.LAPIS_ORE]:'lapis', [B.REDSTONE_ORE]:'b:'+B.RS_DUST,
  [B.CLAY]:'clay_ball', [B.ICE]:null, [B.MOSSY_COBBLE]:'b:'+B.COBBLE,
  // warianty stanu redstone → upuszczają wersję bazową
  [B.RS_DUST_ON]:'b:'+B.RS_DUST, [B.RS_LAMP_ON]:'b:'+B.RS_LAMP,
  [B.RS_TORCH_OFF]:'b:'+B.RS_TORCH, [B.DOOR_OPEN]:'b:'+B.DOOR,
};
export function blockDrop(id) {
  if (id in DROPS) return DROPS[id];
  return 'b:'+id;   // most blocks drop themselves
}

// Dodatkowe (losowe) łupy poza głównym dropem — obsługiwane w main.js
export function bonusDrops(id) {
  if (id === B.GRASS) return Math.random() < 0.25 ? ['seeds'] : [];
  if (id === B.GRAVEL) return Math.random() < 0.18 ? ['flint'] : [];
  if (id === B.CROP) return ['seeds'];
  if (id === B.CROP_RIPE) return ['wheat', 'seeds', ...(Math.random()<0.5?['seeds']:[])];
  // rudy dające wiele sztuk (główny drop już liczy 1 — tu dodatkowe)
  if (id === B.LAPIS_ORE) { const n = 3 + (Math.random()*3|0); return Array(n).fill('lapis'); }
  if (id === B.REDSTONE_ORE) { const n = 3 + (Math.random()*2|0); return Array(n).fill('b:'+B.RS_DUST); }
  if (id === B.CLAY) return Array(3).fill('clay_ball');   // razem z głównym = 4
  return [];
}

// ── Wytapianie w piecu ───────────────────────────────────────────────────────
const SMELT = {
  'raw_iron':'iron_ingot', 'raw_gold':'gold_ingot',
  ['b:'+B.SAND]:'b:'+B.GLASS, ['b:'+B.COBBLE]:'b:'+B.STONE,
  ['b:'+B.WOOD]:'coal',   // węgiel drzewny (działa jak węgiel)
  // nowe: gotowanie mięsa, wypiek, terakota, cegła
  'raw_chicken':'cooked_chicken',
  'Wołowina 🥩':'cooked_beef',
  'Wieprzowina 🥓':'cooked_porkchop',
  'potato':'baked_potato',
  'clay_ball':'brick_item',
  ['b:'+B.CLAY]:'b:'+B.TERRACOTTA,   // glina → terakota
};
export function smeltResult(key) { return SMELT[key] || null; }
// Wartość opałowa = sekundy palenia danego przedmiotu
const FUEL = { 'coal':40, ['b:'+B.PLANKS]:5, ['b:'+B.WOOD]:15, 'stick':2 };
export function fuelValue(key) { return FUEL[key] || 0; }

// Which tool speeds a block, for mining-speed bonus
const PREF = {};
[B.STONE,B.COAL_ORE,B.IRON_ORE,B.GOLD_ORE,B.DIAMOND_ORE,B.OBSIDIAN,B.BRICK,
 B.SANDSTONE,B.STONE_BRICKS,B.MOSSY_COBBLE,B.TERRACOTTA,B.QUARTZ,B.ICE,
 B.COAL_BLOCK,B.IRON_BLOCK,B.GOLD_BLOCK,B.DIAMOND_BLOCK,
 B.EMERALD_ORE,B.EMERALD_BLOCK,B.LAPIS_ORE,B.LAPIS_BLOCK,B.REDSTONE_ORE,
 B.RAIL,B.POWERED_RAIL,B.DETECTOR_RAIL,B.ACTIVATOR_RAIL,
 B.POLISHED_STONE,B.GRANITE,B.MARBLE].forEach(b=>PREF[b]='pickaxe');
[B.WOOD,B.PLANKS,B.BOOKSHELF,B.DARK_WOOD,B.DARK_PLANKS,B.PALE_WOOD,B.PALE_PLANKS].forEach(b=>PREF[b]='axe');
[B.DIRT,B.GRASS,B.SAND,B.GRAVEL,B.SNOW,B.CLAY].forEach(b=>PREF[b]='shovel');

// ── Wymagane narzędzie, by uzyskać łup (jak w Minecrafcie) ────────────────────
const TIER_RANK = { wood:1, gold:1, stone:2, iron:3, diamond:4 };
const REQUIRE = {};
[B.STONE,B.COBBLE,B.COAL_ORE,B.BRICK,B.FURNACE,
 B.SANDSTONE,B.STONE_BRICKS,B.MOSSY_COBBLE,B.TERRACOTTA,B.COAL_BLOCK,
 B.RAIL,B.POWERED_RAIL,B.DETECTOR_RAIL,B.ACTIVATOR_RAIL,
 B.POLISHED_STONE,B.GRANITE,B.MARBLE].forEach(b=>REQUIRE[b]={tool:'pickaxe',min:1});
[B.IRON_ORE,B.GOLD_ORE,B.LAPIS_ORE,B.IRON_BLOCK,B.LAPIS_BLOCK].forEach(b=>REQUIRE[b]={tool:'pickaxe',min:2});   // kamienny+
[B.DIAMOND_ORE,B.EMERALD_ORE,B.REDSTONE_ORE,B.GOLD_BLOCK,B.DIAMOND_BLOCK,B.EMERALD_BLOCK]
  .forEach(b=>REQUIRE[b]={tool:'pickaxe',min:3});                       // żelazny+
REQUIRE[B.OBSIDIAN]={tool:'pickaxe',min:4};                            // diamentowy
// tool = obiekt z selectedTool() (ma .tool i .tier) albo null
export function canHarvest(block, tool) {
  const r = REQUIRE[block];
  if (!r) return true;                                  // brak wymogu → zawsze łup
  if (!tool || tool.tool !== r.tool) return false;      // zły typ narzędzia
  return (TIER_RANK[tool.tier] || 0) >= r.min;          // za słaby tier
}

// ── Recipes ──────────────────────────────────────────────────────────────────
// shaped: rows of arrays (keys or null); shapeless: list of keys
export const RECIPES = [];
// planks from any... we only have one wood type
RECIPES.push({ shapeless:['b:'+B.WOOD], out:'b:'+B.PLANKS, n:4 });
RECIPES.push({ shapeless:['b:'+B.PLANKS,'b:'+B.PLANKS], out:'stick', n:4 });
// tools per tier
for (const t in TIERS) {
  const M = TIERS[t].mat, S='stick';
  RECIPES.push({ shaped:[[M,M,M],[null,S,null],[null,S,null]], out:`${t}_pickaxe`, n:1 });
  RECIPES.push({ shaped:[[M,M,null],[M,S,null],[null,S,null]], out:`${t}_axe`, n:1 });
  RECIPES.push({ shaped:[[M],[S],[S]], out:`${t}_shovel`, n:1 });
  RECIPES.push({ shaped:[[M],[M],[S]], out:`${t}_sword`, n:1 });
  RECIPES.push({ shaped:[[M,M,null],[null,S,null],[null,S,null]], out:`${t}_hoe`, n:1 });
}
// pochodnie: węgiel na patyku → 4 pochodnie
RECIPES.push({ shaped:[['coal'],['stick']], out:'b:'+B.TORCH, n:4 });
// piec: 8 bruku w pierścieniu
RECIPES.push({ shaped:[['b:'+B.COBBLE,'b:'+B.COBBLE,'b:'+B.COBBLE],
                       ['b:'+B.COBBLE,null,'b:'+B.COBBLE],
                       ['b:'+B.COBBLE,'b:'+B.COBBLE,'b:'+B.COBBLE]], out:'b:'+B.FURNACE, n:1 });
// chleb: 3 pszenice w rzędzie
RECIPES.push({ shaped:[['wheat','wheat','wheat']], out:'bread', n:1 });
// wiadro: 3 sztabki żelaza w kształcie V
RECIPES.push({ shaped:[['iron_ingot',null,'iron_ingot'],[null,'iron_ingot',null]], out:'bucket', n:1 });
// stół rzemieślniczy: 4 deski 2×2
RECIPES.push({ shaped:[['b:'+B.PLANKS,'b:'+B.PLANKS],['b:'+B.PLANKS,'b:'+B.PLANKS]], out:'b:'+B.CRAFTING_TABLE, n:1 });
// skrzynia: 8 desek w pierścieniu
RECIPES.push({ shaped:[['b:'+B.PLANKS,'b:'+B.PLANKS,'b:'+B.PLANKS],
                       ['b:'+B.PLANKS,null,'b:'+B.PLANKS],
                       ['b:'+B.PLANKS,'b:'+B.PLANKS,'b:'+B.PLANKS]], out:'b:'+B.CHEST, n:1 });
// łóżko: 3 wełna + 3 deski
RECIPES.push({ shaped:[['Wełna 🧶','Wełna 🧶','Wełna 🧶'],
                       ['b:'+B.PLANKS,'b:'+B.PLANKS,'b:'+B.PLANKS]], out:'b:'+B.BED, n:1 });
// łuk: 3 patyki + 3 nici
RECIPES.push({ shaped:[[null,'stick','string'],['stick',null,'string'],[null,'stick','string']], out:'bow', n:1 });
// strzały: krzemień + patyk + pióro → 4
RECIPES.push({ shaped:[['flint'],['stick'],['Pióro 🪶']], out:'arrow', n:4 });
// zbroja: standardowe kształty dla każdego tieru
for (const t in ARMOR_TIERS) {
  const M = ARMOR_TIERS[t].mat;
  RECIPES.push({ shaped:[[M,M,M],[M,null,M]], out:`${t}_helmet`, n:1 });
  RECIPES.push({ shaped:[[M,null,M],[M,M,M],[M,M,M]], out:`${t}_chestplate`, n:1 });
  RECIPES.push({ shaped:[[M,M,M],[M,null,M],[M,null,M]], out:`${t}_leggings`, n:1 });
  RECIPES.push({ shaped:[[M,null,M],[M,null,M]], out:`${t}_boots`, n:1 });
}

// ── Nowe recepty ──────────────────────────────────────────────────────────────
// Bloki magazynowe: 9 surowca → blok oraz blok → 9 surowca
const STORAGE = [
  ['iron_ingot', B.IRON_BLOCK], ['gold_ingot', B.GOLD_BLOCK],
  ['diamond', B.DIAMOND_BLOCK], ['coal', B.COAL_BLOCK],
  ['emerald', B.EMERALD_BLOCK], ['lapis', B.LAPIS_BLOCK],
  ['b:'+B.RS_DUST, B.REDSTONE_BLOCK],
];
for (const [mat, block] of STORAGE) {
  RECIPES.push({ shaped:[[mat,mat,mat],[mat,mat,mat],[mat,mat,mat]], out:'b:'+block, n:1 });
  RECIPES.push({ shapeless:['b:'+block], out:mat, n:9 });
}
// Bloki budowlane
RECIPES.push({ shaped:[['b:'+B.STONE,'b:'+B.STONE],['b:'+B.STONE,'b:'+B.STONE]], out:'b:'+B.STONE_BRICKS, n:4 });
RECIPES.push({ shaped:[['b:'+B.SAND,'b:'+B.SAND],['b:'+B.SAND,'b:'+B.SAND]], out:'b:'+B.SANDSTONE, n:1 });
RECIPES.push({ shaped:[['brick_item','brick_item'],['brick_item','brick_item']], out:'b:'+B.BRICK, n:1 });
RECIPES.push({ shapeless:['b:'+B.COBBLE,'b:'+B.LEAVES], out:'b:'+B.MOSSY_COBBLE, n:1 });
// regał: deski + książki (3 książki w środku)
RECIPES.push({ shaped:[['b:'+B.PLANKS,'b:'+B.PLANKS,'b:'+B.PLANKS],
                       ['book','book','book'],
                       ['b:'+B.PLANKS,'b:'+B.PLANKS,'b:'+B.PLANKS]], out:'b:'+B.BOOKSHELF, n:1 });
// papier: 3 trzcina — brak trzciny, użyjemy nasion (uproszczenie); książka: 3 papier + skóra
RECIPES.push({ shaped:[['sugar','sugar','sugar']], out:'paper', n:1 });
RECIPES.push({ shapeless:['paper','paper','paper','leather'], out:'book', n:1 });
// jedzenie
RECIPES.push({ shaped:[['wheat','wheat','wheat'],['wheat','sugar','wheat']], out:'cookie', n:8 });
// narzędzia użytkowe
RECIPES.push({ shaped:[[null,'iron_ingot'],['iron_ingot',null]], out:'shears', n:1 });
RECIPES.push({ shaped:[['iron_ingot',null],[null,'flint']], out:'flint_and_steel', n:1 });
RECIPES.push({ shaped:[[null,null,'string'],[null,'stick','string'],['stick',null,'string']], out:'fishing_rod', n:1 });
RECIPES.push({ shaped:[[null,'iron_ingot',null],['iron_ingot','b:'+B.RS_DUST,'iron_ingot'],[null,'iron_ingot',null]], out:'compass', n:1 });
RECIPES.push({ shaped:[[null,'gold_ingot',null],['gold_ingot','b:'+B.RS_DUST,'gold_ingot'],[null,'gold_ingot',null]], out:'clock', n:1 });
// wagonik: 5 sztabek żelaza w kształcie U
RECIPES.push({ shaped:[['iron_ingot',null,'iron_ingot'],['iron_ingot','iron_ingot','iron_ingot']], out:'minecart', n:1 });
// tory: 6 sztabek + patyk (jak w MC, daje 16)
RECIPES.push({ shaped:[['iron_ingot',null,'iron_ingot'],['iron_ingot','stick','iron_ingot'],['iron_ingot',null,'iron_ingot']], out:'b:'+B.RAIL, n:16 });
RECIPES.push({ shaped:[['gold_ingot',null,'gold_ingot'],['gold_ingot','b:'+B.RS_DUST,'gold_ingot'],['gold_ingot',null,'gold_ingot']], out:'b:'+B.POWERED_RAIL, n:6 });
// tor z czujnikiem: 6 żelaza + płyta (kamień) + redstone
RECIPES.push({ shaped:[['iron_ingot',null,'iron_ingot'],['iron_ingot','b:'+B.STONE,'iron_ingot'],['iron_ingot','b:'+B.RS_DUST,'iron_ingot']], out:'b:'+B.DETECTOR_RAIL, n:6 });
// tor aktywujący: 6 żelaza + patyki + pochodnia redstone
RECIPES.push({ shaped:[['iron_ingot','stick','iron_ingot'],['iron_ingot','b:'+B.RS_TORCH,'iron_ingot'],['iron_ingot','stick','iron_ingot']], out:'b:'+B.ACTIVATOR_RAIL, n:6 });
// warianty wagonika: skrzynia / piec / TNT + wagonik
RECIPES.push({ shapeless:['b:'+B.CHEST,'minecart'], out:'chest_minecart', n:1 });
RECIPES.push({ shapeless:['b:'+B.FURNACE,'minecart'], out:'furnace_minecart', n:1 });
RECIPES.push({ shapeless:['Proch 💥','Proch 💥','Proch 💥','Proch 💥','minecart'], out:'tnt_minecart', n:1 });

// ── Bloki dekoracyjne: kolorowe szkło, dywany, warianty drewna, dekoracje kamienne ──
const WOOL_COLORS = [
  ['b:'+B.WOOL_WHITE,  B.GLASS_WHITE,  B.CARPET_WHITE],
  ['b:'+B.WOOL_RED,    B.GLASS_RED,    B.CARPET_RED],
  ['b:'+B.WOOL_BLUE,   B.GLASS_BLUE,   B.CARPET_BLUE],
  ['b:'+B.WOOL_GREEN,  B.GLASS_GREEN,  B.CARPET_GREEN],
  ['b:'+B.WOOL_YELLOW, B.GLASS_YELLOW, B.CARPET_YELLOW],
  ['b:'+B.WOOL_BLACK,  B.GLASS_BLACK,  B.CARPET_BLACK],
];
for (const [wool, glass, carpet] of WOOL_COLORS) {
  // szkło + wełna danego koloru → barwione szkło
  RECIPES.push({ shapeless:['b:'+B.GLASS, wool], out:'b:'+glass, n:1 });
  // 2× wełna danego koloru → 3 dywany
  RECIPES.push({ shapeless:[wool, wool], out:'b:'+carpet, n:3 });
}
// ciemne drewno: kłoda + węgiel (okopcenie) → deski jak zwykłe drewno
RECIPES.push({ shapeless:['b:'+B.WOOD,'coal'], out:'b:'+B.DARK_WOOD, n:1 });
RECIPES.push({ shapeless:['b:'+B.DARK_WOOD], out:'b:'+B.DARK_PLANKS, n:4 });
// jasne drewno: kłoda + kość (wybielenie) → deski jak zwykłe drewno
RECIPES.push({ shapeless:['b:'+B.WOOD,'Kość 🦴'], out:'b:'+B.PALE_WOOD, n:1 });
RECIPES.push({ shapeless:['b:'+B.PALE_WOOD], out:'b:'+B.PALE_PLANKS, n:4 });
// polerowany kamień: 4× bruk w kwadracie (inny układ niż kamienne cegły, by nie kolidować z tamtą receptą)
RECIPES.push({ shaped:[['b:'+B.COBBLE,'b:'+B.COBBLE],['b:'+B.COBBLE,'b:'+B.COBBLE]], out:'b:'+B.POLISHED_STONE, n:4 });
// granit: kamień + cegła (rdzawe skrapienia)
RECIPES.push({ shapeless:['b:'+B.STONE,'brick_item'], out:'b:'+B.GRANITE, n:1 });
// marmur: kamień + blok kwarcu (jasne żyłki)
RECIPES.push({ shapeless:['b:'+B.STONE,'b:'+B.QUARTZ], out:'b:'+B.MARBLE, n:1 });

function trim(grid) {
  // grid: 3x3 of keys/null -> trimmed 2D pattern
  let rows = grid.map(r=>r.slice());
  const empty = r => r.every(c=>!c);
  while (rows.length && empty(rows[0])) rows.shift();
  while (rows.length && empty(rows[rows.length-1])) rows.pop();
  if (!rows.length) return [];
  let minc=3, maxc=-1;
  rows.forEach(r=>r.forEach((c,i)=>{ if(c){ if(i<minc)minc=i; if(i>maxc)maxc=i; }}));
  return rows.map(r=>r.slice(minc,maxc+1));
}
function patEq(a,b) {
  if (a.length!==b.length) return false;
  for (let i=0;i<a.length;i++){ if(a[i].length!==b[i].length) return false;
    for (let j=0;j<a[i].length;j++) if((a[i][j]||null)!==(b[i][j]||null)) return false; }
  return true;
}
export function matchRecipe(craft3x3, maxSize = 3) {
  // craft3x3: array(9) of {key,n}|null. maxSize=2 → tylko crafting 2×2 (plecak).
  if (maxSize === 2 && [2,5,6,7,8].some(i => craft3x3[i])) return null;   // poza obszarem 2×2
  const grid = [0,1,2].map(r=>[0,1,2].map(c=>craft3x3[r*3+c]?.key||null));
  const present = craft3x3.filter(s=>s).map(s=>s.key).sort();
  for (const R of RECIPES) {
    if (R.shapeless) {
      const need = R.shapeless.slice().sort();
      if (need.length===present.length && need.every((k,i)=>k===present[i]))
        return { out:R.out, n:R.n };
    } else {
      if (patEq(trim(grid), trim(R.shaped))) return { out:R.out, n:R.n };
    }
  }
  return null;
}

// ── Karty (kategorie) palety kreatywnej ──────────────────────────────────────
// match(key) decyduje, czy przedmiot trafia do danej karty (może być w kilku).
const PALETTE_CATS = [
  { id:'all',       icon:'📦', label:'Wszystko',  match: () => true },
  { id:'build',     icon:'🧱', label:'Budowlane', match: k => ITEMS[k].block != null && !isRedstone(ITEMS[k].block) },
  { id:'tools',     icon:'⛏️', label:'Narzędzia', match: k => (ITEMS[k].tool && ITEMS[k].tool !== 'sword') || ITEMS[k].util || ['bucket','water_bucket','lava_bucket'].includes(k) },
  { id:'combat',    icon:'🗡️', label:'Walka',     match: k => ITEMS[k].armor || ITEMS[k].tool === 'sword' || k === 'bow' || k === 'arrow' },
  { id:'food',      icon:'🍖', label:'Jedzenie',  match: k => ITEMS[k].food != null },
  { id:'materials', icon:'💎', label:'Surowce',   match: k => { const it = ITEMS[k]; return it.block == null && !it.tool && !it.armor && !it.util && it.food == null && !['bow','arrow','bucket','water_bucket','lava_bucket'].includes(k); } },
  { id:'redstone',  icon:'🔴', label:'Redstone',  match: k => ITEMS[k].block != null && isRedstone(ITEMS[k].block) },
];

// ── Inventory (data + UI) ────────────────────────────────────────────────────
export class Inventory {
  constructor() {
    this.slots = new Array(36).fill(null);   // 0-8 hotbar, 9-35 backpack
    this.craft = new Array(9).fill(null);
    this.held = null;                         // cursor stack
    this.sel = 0;                             // selected hotbar index
    this.isOpen = false;
    this.mode = 'inv';                        // 'inv' | 'furnace' | 'chest' | 'table'
    this.furnace = null;                      // aktualnie otwarty stan pieca
    this.chest = null;                        // aktualnie otwarty stan skrzyni
    this.craftSize = 2;                       // 2 = plecak (2×2), 3 = stół (3×3)
    this.armor = { head:null, chest:null, legs:null, feet:null };
    this.creative = false;                    // tryb creative → pokaż paletę
    // Paleta creative: przedmioty bieżącej karty (kategorii)
    this.paletteCategory = 'all';
    this.paletteKeys = Object.keys(ITEMS);
    // starter kit (keeps building easy, mirrors old creative hotbar)
    HOTBAR_BLOCKS.forEach((b,i)=>{ this.slots[i] = { key:'b:'+b, n:64 }; });
    this._injectCSS();
    this._buildDOM();
    this.renderHotbar();
  }

  // add up to n of key; returns leftover
  add(key, n=1) {
    const max = ITEMS[key]?.stack || 64;
    for (let i=0;i<36 && n>0;i++){ const s=this.slots[i];
      if (s && s.key===key && s.n<max){ const add=Math.min(max-s.n,n); s.n+=add; n-=add; } }
    for (let i=0;i<36 && n>0;i++){ if(!this.slots[i]){ const add=Math.min(max,n); this.slots[i]={key,n:add}; n-=add; } }
    this.renderHotbar(); if(this.isOpen) this._render();
    return n;
  }

  selectedStack() { return this.slots[this.sel]; }
  selectedBlock() { const s=this.slots[this.sel]; const it=s&&ITEMS[s.key]; return (it&&it.block!=null)?it.block:null; }
  selectedTool()  { const s=this.slots[this.sel]; const it=s&&ITEMS[s.key]; return (it&&it.tool)?{...it, slot:this.sel}:null; }

  consumeSelected() {
    const s=this.slots[this.sel]; if(!s) return;
    s.n--; if(s.n<=0) this.slots[this.sel]=null;
    this.renderHotbar();
  }
  // mining speed multiplier vs a block + apply durability
  mineMul(blockId) {
    const t=this.selectedTool(); if(!t) return 1;
    return PREF[blockId]===t.tool ? t.mul : 1;
  }
  wearTool() {
    const s=this.slots[this.sel]; const it=s&&ITEMS[s.key];
    if (!it || !it.tool) return;
    s.dur = (s.dur ?? it.maxDur) - 1;
    if (s.dur <= 0) { this.slots[this.sel]=null; this.renderHotbar(); }
  }
  eatSelected(player) {
    const s=this.slots[this.sel]; const it=s&&ITEMS[s.key];
    if (!it || !it.food || player.hunger>=player.maxHunger) return null;
    player.hunger=Math.min(player.maxHunger, player.hunger+it.food);
    this.consumeSelected();
    return `Zjedzono ${it.name}`;
  }

  // ── UI ──────────────────────────────────────────────────────────────────────
  _injectCSS() {
    if (document.getElementById('inv-css')) return;
    const s=document.createElement('style'); s.id='inv-css';
    s.textContent = `
    #inv-screen{position:fixed;inset:0;display:none;align-items:center;justify-content:center;
      background:rgba(0,0,0,.55);z-index:50;font-family:monospace;color:#fff}
    #inv-screen.open{display:flex}
    .inv-panel{background:#3a3a3aee;border:4px solid #1a1a1a;padding:16px;border-radius:6px}
    .inv-row{display:flex;gap:4px;margin:4px 0}
    .inv-slot{width:42px;height:42px;background:#8b8b8b;border:2px solid #555;position:relative;cursor:pointer}
    .inv-slot:hover{border-color:#fff}
    .inv-blk{position:absolute;inset:5px;border-radius:2px;image-rendering:pixelated}
    .inv-cnt{position:absolute;right:2px;bottom:0;font-size:12px;text-shadow:1px 1px #000}
    .inv-title{font-size:13px;margin:8px 0 2px;opacity:.8}
    .inv-craft{display:flex;align-items:center;gap:12px}
    .inv-grid3{display:grid;grid-template-columns:repeat(3,42px);grid-gap:4px}
    .inv-arrow{font-size:26px}
    #inv-held{position:fixed;width:38px;height:38px;pointer-events:none;z-index:60;display:none}
    #inv-held .inv-blk{inset:0}
    #hotbar .hb-cnt{position:absolute;right:3px;bottom:1px;font:11px monospace;color:#fff;text-shadow:1px 1px #000}
    #hotbar .hb-slot{position:relative}
    #inv-tip{position:fixed;z-index:70;max-width:220px;pointer-events:none;display:none;
      background:#0d0d16f0;border:1px solid #6a6a8a;border-radius:4px;padding:6px 8px;
      font-family:monospace;color:#fff;text-shadow:1px 1px #000;line-height:1.35}
    #inv-tip .tip-name{color:#ffe58a;font-size:13px;margin-bottom:2px}
    #inv-tip .tip-desc{color:#c8c8d8;font-size:11px}
    #inv-palette{display:grid;grid-template-columns:repeat(9,42px);grid-gap:4px;
      max-height:180px;overflow-y:auto;padding-right:4px}
    #inv-palette-tabs{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px}
    .pal-tab{display:flex;align-items:center;gap:4px;background:#2a2a2a;border:2px solid #555;
      color:#ddd;border-radius:4px;padding:3px 7px;font-size:11px;cursor:pointer;font-family:monospace}
    .pal-tab:hover{border-color:#888}
    .pal-tab.active{background:#5a8a2a;border-color:#7bd23a;color:#fff}
    .palette-empty{opacity:.6;padding:14px;font-size:12px;grid-column:1/-1}
    .furn-col{display:flex;flex-direction:column;gap:8px;align-items:center}
    .furn-flame{width:20px;height:20px;background:#333;border-radius:3px;overflow:hidden;position:relative}
    #furn-burn{position:absolute;bottom:0;left:0;width:100%;height:0%;background:linear-gradient(#ffcc33,#ff5500)}
    .furn-arrow{position:relative;width:48px;height:20px;background:#222;border-radius:3px;overflow:hidden}
    #furn-prog{position:absolute;left:0;top:0;height:100%;width:0%;background:#c8a030}
    #inv-chest{display:grid;grid-template-columns:repeat(9,42px);grid-gap:4px}
    .inv-armor{display:flex;gap:6px;align-items:center;margin:2px 0}
    .inv-armor .inv-slot{background:#6b6b6b}
    .armor-lbl{font-size:11px;opacity:.7;margin-left:4px}`;
    document.head.appendChild(s);
  }

  _buildDOM() {
    document.getElementById('inv-screen')?.remove();
    document.getElementById('inv-held')?.remove();
    const scr=document.createElement('div'); scr.id='inv-screen';
    const panel=document.createElement('div'); panel.className='inv-panel';
    panel.innerHTML = `
      <div id="inv-craft-sec">
        <div class="inv-title" id="inv-craft-title">Crafting 2×2</div>
        <div class="inv-craft">
          <div class="inv-grid3" id="inv-craft"></div>
          <div class="inv-arrow">➜</div>
          <div class="inv-row" id="inv-out"></div>
        </div>
      </div>
      <div id="inv-furnace-sec" style="display:none">
        <div class="inv-title">🔥 Piec</div>
        <div class="inv-craft">
          <div class="furn-col">
            <div class="inv-row" id="furn-in"></div>
            <div class="furn-flame"><div id="furn-burn"></div></div>
            <div class="inv-row" id="furn-fuel"></div>
          </div>
          <div class="inv-arrow furn-arrow"><div id="furn-prog"></div></div>
          <div class="inv-row" id="furn-out"></div>
        </div>
      </div>
      <div id="inv-chest-sec" style="display:none">
        <div class="inv-title">📦 Skrzynia</div>
        <div id="inv-chest"></div>
      </div>
      <div id="inv-armor-sec">
        <div class="inv-title">🛡️ Zbroja</div>
        <div class="inv-armor" id="inv-armor"></div>
      </div>
      <div id="inv-palette-sec" style="display:none">
        <div class="inv-title">🎨 Kreatywny — kliknij, by wziąć pełny stos (upuść tu, by wyrzucić)</div>
        <div id="inv-palette-tabs"></div>
        <div id="inv-palette"></div>
      </div>
      <div class="inv-title">Plecak</div>
      <div id="inv-bag"></div>
      <div class="inv-title">Pasek</div>
      <div class="inv-row" id="inv-hot"></div>`;
    scr.appendChild(panel);
    document.body.appendChild(scr);
    this.scr=scr;
    const held=document.createElement('div'); held.id='inv-held'; held.innerHTML='<div class="inv-blk"></div>';
    document.body.appendChild(held); this.heldEl=held;
    document.addEventListener('mousemove', e=>{ if(this.held){ held.style.left=(e.clientX-19)+'px'; held.style.top=(e.clientY-19)+'px'; }});

    // dymek z opisem przedmiotu
    document.getElementById('inv-tip')?.remove();
    const tip=document.createElement('div'); tip.id='inv-tip';
    document.body.appendChild(tip); this.tipEl=tip;

    // build slot grids
    const mkSlot=(kind,i)=>{ const d=document.createElement('div'); d.className='inv-slot'; d.dataset.kind=kind; d.dataset.i=i;
      d.innerHTML='<div class="inv-blk"></div><span class="inv-cnt"></span>';
      d.addEventListener('mousedown', e=>{ e.preventDefault(); this._click(kind,i,e.button); this._hideTip(); });
      d.addEventListener('contextmenu', e=>e.preventDefault());
      d.addEventListener('mouseenter', e=>this._showTip(kind,i,e));
      d.addEventListener('mousemove',  e=>this._moveTip(e));
      d.addEventListener('mouseleave', ()=>this._hideTip());
      return d; };
    const cg=panel.querySelector('#inv-craft'); this.craftEls=[]; for(let i=0;i<9;i++){ const el=mkSlot('craft',i); this.craftEls.push(el); cg.appendChild(el); }
    const out=panel.querySelector('#inv-out'); out.appendChild(mkSlot('out',0));
    // furnace slots
    panel.querySelector('#furn-in').appendChild(mkSlot('fin',0));
    panel.querySelector('#furn-fuel').appendChild(mkSlot('ffuel',0));
    panel.querySelector('#furn-out').appendChild(mkSlot('fout',0));
    // armor slots (head/chest/legs/feet) + label
    const armorRow=panel.querySelector('#inv-armor');
    const ARMOR_ORDER=[['head','Hełm'],['chest','Napierśnik'],['legs','Nogawice'],['feet','Buty']];
    for(const [part] of ARMOR_ORDER) armorRow.appendChild(mkSlot('armor',part));
    // chest slots (27)
    const chestGrid=panel.querySelector('#inv-chest'); for(let i=0;i<27;i++) chestGrid.appendChild(mkSlot('chest',i));
    const bag=panel.querySelector('#inv-bag');
    for(let r=0;r<3;r++){ const row=document.createElement('div'); row.className='inv-row';
      for(let c=0;c<9;c++) row.appendChild(mkSlot('slot',9+r*9+c)); bag.appendChild(row); }
    const hot=panel.querySelector('#inv-hot'); for(let i=0;i<9;i++) hot.appendChild(mkSlot('slot',i));
    // paleta creative — fabryka slotów (przebudowywana przy zmianie karty)
    this._mkPaletteSlot = (i) => mkSlot('palette', i);
    // pasek zakładek (kart) kategorii
    const tabs = panel.querySelector('#inv-palette-tabs');
    for (const cat of PALETTE_CATS) {
      const b = document.createElement('button'); b.className = 'pal-tab'; b.dataset.cat = cat.id;
      b.textContent = `${cat.icon} ${cat.label}`;
      b.addEventListener('click', () => this._setPaletteCategory(cat.id));
      tabs.appendChild(b);
    }
  }

  // Przełącz kartę palety: przelicz przedmioty kategorii i przebuduj sloty.
  _setPaletteCategory(id) {
    const cat = PALETTE_CATS.find(c => c.id === id) || PALETTE_CATS[0];
    this.paletteCategory = cat.id;
    this.paletteKeys = Object.keys(ITEMS).filter(cat.match);
    const pal = this.scr.querySelector('#inv-palette');
    pal.innerHTML = '';
    if (this.paletteKeys.length === 0) {
      const e = document.createElement('div'); e.className = 'palette-empty';
      e.textContent = 'Wkrótce… (brak przedmiotów w tej kategorii)';
      pal.appendChild(e);
    } else {
      for (let i = 0; i < this.paletteKeys.length; i++) pal.appendChild(this._mkPaletteSlot(i));
    }
    this.scr.querySelectorAll('#inv-palette-tabs .pal-tab').forEach(t => t.classList.toggle('active', t.dataset.cat === cat.id));
    this._render();
  }

  // ── Dymek z opisem przedmiotu ─────────────────────────────────────────────
  _showTip(kind,i,e){
    if (this.held) { this._hideTip(); return; }   // nie pokazuj podczas przenoszenia
    const s = this._slotData(kind,i); const it = s && ITEMS[s.key];
    if (!it) { this._hideTip(); return; }
    let html = `<div class="tip-name">${it.name}</div>`;
    if (it.desc) html += `<div class="tip-desc">${it.desc}</div>`;
    if (it.tool) { const dur = s.dur ?? it.maxDur; html += `<div class="tip-desc">Wytrzymałość: ${dur}/${it.maxDur}</div>`; }
    this.tipEl.innerHTML = html;
    this.tipEl.style.display = 'block';
    this._moveTip(e);
  }
  _moveTip(e){
    if (this.tipEl.style.display !== 'block') return;
    const pad = 14, w = this.tipEl.offsetWidth, h = this.tipEl.offsetHeight;
    let x = e.clientX + pad, y = e.clientY + pad;
    if (x + w > innerWidth)  x = e.clientX - pad - w;
    if (y + h > innerHeight) y = e.clientY - pad - h;
    this.tipEl.style.left = Math.max(0,x) + 'px';
    this.tipEl.style.top  = Math.max(0,y) + 'px';
  }
  _hideTip(){ if (this.tipEl) this.tipEl.style.display = 'none'; }

  _slotData(kind,i){
    if(kind==='craft')return this.craft[i];
    if(kind==='out')return this._output;
    if(kind==='fin')  return this.furnace?.input  ?? null;
    if(kind==='ffuel')return this.furnace?.fuel   ?? null;
    if(kind==='fout') return this.furnace?.output ?? null;
    if(kind==='armor') return this.armor[i] ?? null;
    if(kind==='chest') return this.chest?.items[i] ?? null;
    if(kind==='palette'){ const k=this.paletteKeys[i]; return k?{key:k, n:ITEMS[k]?.stack||64}:null; }
    return this.slots[i];
  }
  _setSlot(kind,i,v){
    if(kind==='craft')this.craft[i]=v;
    else if(kind==='fin'){ if(this.furnace)this.furnace.input=v; }
    else if(kind==='ffuel'){ if(this.furnace)this.furnace.fuel=v; }
    else if(kind==='fout'){ if(this.furnace)this.furnace.output=v; }
    else if(kind==='armor'){ this.armor[i]=v; }
    else if(kind==='chest'){ if(this.chest)this.chest.items[i]=v; }
    else if(kind!=='out')this.slots[i]=v;
  }

  armorPoints(){ let p=0; for(const k in this.armor){ const s=this.armor[k]; const it=s&&ITEMS[s.key]; if(it&&it.prot) p+=it.prot; } return p; }

  _click(kind,i,button) {
    if (kind==='out') { this._takeOutput(button); this._render(); this.renderHotbar(); return; }
    if (kind==='palette') { // creative: weź pełny stos (lub wyrzuć trzymany)
      const src=this._slotData(kind,i);
      this.held = src ? { key:src.key, n:(button===2 ? 1 : src.n) } : null;
      this._render(); this.renderHotbar(); return;
    }
    if (kind==='armor') { // tylko pasujący element zbroi
      const cur=this.armor[i]||null;
      if (this.held) { const it=ITEMS[this.held.key]; if (it && it.armor===i) { this.armor[i]=this.held; this.held=cur; } }
      else if (cur) { this.held=cur; this.armor[i]=null; }
      this._render(); this.renderHotbar(); return;
    }
    if (kind==='fout') { // wynik pieca: tylko odbieranie
      const cur=this._slotData(kind,i);
      if (!this.held && cur) { this.held=cur; this._setSlot(kind,i,null); }
      else if (this.held && cur && this.held.key===cur.key) {
        const max=ITEMS[cur.key].stack||64; const mv=Math.min(max-this.held.n,cur.n);
        this.held.n+=mv; cur.n-=mv; if(cur.n<=0)this._setSlot(kind,i,null);
      }
      this._render(); this.renderHotbar(); return;
    }
    const cur=this._slotData(kind,i);
    if (button===2) { // right: place one / pick half
      if (this.held) {
        if (!cur) { this._setSlot(kind,i,{key:this.held.key,n:1}); this.held.n--; }
        else if (cur.key===this.held.key && cur.n<(ITEMS[cur.key].stack||64)) { cur.n++; this.held.n--; }
        if (this.held && this.held.n<=0) this.held=null;
      } else if (cur) { const half=Math.ceil(cur.n/2); this.held={key:cur.key,n:half}; cur.n-=half; if(cur.n<=0)this._setSlot(kind,i,null); }
    } else { // left: pick/drop whole / swap
      if (this.held) {
        if (!cur) { this._setSlot(kind,i,this.held); this.held=null; }
        else if (cur.key===this.held.key) { const max=ITEMS[cur.key].stack||64; const mv=Math.min(max-cur.n,this.held.n); cur.n+=mv; this.held.n-=mv; if(this.held.n<=0)this.held=null; }
        else { this._setSlot(kind,i,this.held); this.held=cur; }
      } else if (cur) { this.held=cur; this._setSlot(kind,i,null); }
    }
    if (kind==='craft' || kind==='out') this._updateOutput();
    this._render(); this.renderHotbar();
  }

  _updateOutput(){ const m=matchRecipe(this.craft, this.craftSize); this._output = m ? {key:m.out, n:m.n} : null; }
  _takeOutput(button){
    if (!this._output) return;
    const m=matchRecipe(this.craft, this.craftSize); if(!m) return;
    // if held compatible or empty, give result and consume one of each ingredient
    if (this.held && (this.held.key!==m.out)) return;
    if (this.held) this.held.n += m.n; else this.held={key:m.out,n:m.n};
    for (let i=0;i<9;i++){ const s=this.craft[i]; if(s){ s.n--; if(s.n<=0)this.craft[i]=null; } }
    this._updateOutput();
  }

  _render() {
    const fill=(el,stack)=>{ const blk=el.querySelector('.inv-blk'); const cnt=el.querySelector('.inv-cnt');
      if(stack){ applyIcon(blk, stack.key); blk.style.display='block';
        cnt.textContent=stack.n>1?stack.n:''; }
      else { blk.style.display='none'; cnt.textContent=''; blk._iconKey=undefined; } };
    this.scr.querySelectorAll('.inv-slot').forEach(el=>{
      const kind=el.dataset.kind; const i = kind==='armor' ? el.dataset.i : +el.dataset.i;
      fill(el, this._slotData(kind,i)); });
    // held
    if (this.held){ this.heldEl.style.display='block'; applyIcon(this.heldEl.querySelector('.inv-blk'), this.held.key); }
    else this.heldEl.style.display='none';
  }

  renderHotbar() {
    const hb=document.getElementById('hotbar'); if(!hb) return;
    if (hb.children.length!==9){ hb.innerHTML=''; for(let i=0;i<9;i++){ const d=document.createElement('div'); d.className='hb-slot';
      d.innerHTML=`<div class="hb-block"></div><span class="hb-num">${i+1}</span><span class="hb-cnt"></span>`; hb.appendChild(d); } }
    [...hb.children].forEach((el,i)=>{ const s=this.slots[i]; const blk=el.querySelector('.hb-block');
      let cnt=el.querySelector('.hb-cnt'); if(!cnt){ cnt=document.createElement('span'); cnt.className='hb-cnt'; el.appendChild(cnt);}
      if(s){ applyIcon(blk, s.key); cnt.textContent=s.n>1?s.n:''; el.title=ITEMS[s.key]?.name||''; }
      else { blk.style.backgroundImage='none'; blk.style.background='transparent'; blk._iconKey=undefined; cnt.textContent=''; el.title=''; }
      el.classList.toggle('active', i===this.sel); });
  }

  // Tryb plecaka/craftingu (klawisz E)
  toggle() { this.isOpen ? this._close() : this._openInv(); }

  // Pokaż tylko wybraną sekcję okna (reszta ukryta).
  _showSections({ craft=false, furnace=false, chest=false, palette=false, armor=false } = {}) {
    this.scr.querySelector('#inv-craft-sec').style.display   = craft ? '' : 'none';
    this.scr.querySelector('#inv-furnace-sec').style.display = furnace ? '' : 'none';
    this.scr.querySelector('#inv-chest-sec').style.display   = chest ? '' : 'none';
    this.scr.querySelector('#inv-armor-sec').style.display   = armor ? '' : 'none';
    this.scr.querySelector('#inv-palette-sec').style.display = palette ? '' : 'none';
  }

  // Ustaw rozmiar siatki craftingu (2×2 plecak / 3×3 stół).
  _applyCraftSize() {
    const two = this.craftSize === 2;
    this.scr.querySelector('#inv-craft').style.gridTemplateColumns = `repeat(${two?2:3},42px)`;
    [2,5,6,7,8].forEach(idx => { if (this.craftEls[idx]) this.craftEls[idx].style.display = two ? 'none' : ''; });
    const t = this.scr.querySelector('#inv-craft-title'); if (t) t.textContent = `Crafting ${two?'2×2':'3×3'}`;
  }

  _openInv() {
    this.mode = 'inv'; this.furnace = null; this.chest = null; this.craftSize = 2;
    this._applyCraftSize();
    this._showSections({ craft:true, armor:true, palette:this.creative });
    if (this.creative) this._setPaletteCategory(this.paletteCategory);   // wypełnij bieżącą kartę
    this.isOpen = true; this.scr.classList.add('open');
    this._render();
  }

  // Otwórz interfejs konkretnego pieca (obiekt stanu z main.js)
  openFurnace(state) {
    this.mode = 'furnace'; this.furnace = state; this.chest = null;
    this._showSections({ furnace:true });
    this.isOpen = true; this.scr.classList.add('open');
    this._render();
  }

  // Otwórz skrzynię (obiekt stanu z main.js: { items: Array(27) }).
  openChest(state) {
    this.mode = 'chest'; this.chest = state; this.furnace = null;
    this._showSections({ chest:true });
    this.isOpen = true; this.scr.classList.add('open');
    this._render();
  }

  // Otwórz stół rzemieślniczy (pełne 3×3).
  openTable() {
    this.mode = 'table'; this.furnace = null; this.chest = null; this.craftSize = 3;
    this._applyCraftSize();
    this._showSections({ craft:true, armor:true });
    this.isOpen = true; this.scr.classList.add('open');
    this._render();
  }

  _close() {
    this.isOpen = false;
    this.scr.classList.remove('open');
    // zwróć siatkę craftingu do plecaka (tylko tryby z craftem)
    if (this.mode === 'inv' || this.mode === 'table') {
      for (let i=0;i<9;i++){ if(this.craft[i]){ this.add(this.craft[i].key,this.craft[i].n); this.craft[i]=null; } }
    }
    if (this.held){ this.add(this.held.key,this.held.n); this.held=null; }
    this.heldEl.style.display='none';
    this._hideTip();
    this.furnace = null; this.chest = null;
    this.renderHotbar();
  }

  // Aktualizacja wskaźników postępu pieca (wywoływane z pętli gry)
  renderFurnaceProgress() {
    if (this.mode !== 'furnace' || !this.furnace) return;
    const f = this.furnace;
    const prog = this.scr.querySelector('#furn-prog');
    const burn = this.scr.querySelector('#furn-burn');
    if (prog) prog.style.width = Math.min(100, (f.prog / f.smeltTime) * 100) + '%';
    if (burn) burn.style.height = (f.burnMax > 0 ? Math.min(100, (f.burn / f.burnMax) * 100) : 0) + '%';
    this._render();
  }
}
