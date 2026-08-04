export const B = {
  AIR:0, GRASS:1, DIRT:2, STONE:3, SAND:4,
  WOOD:5, LEAVES:6, GLASS:7, BRICK:8, SNOW:9,
  WATER:10, BEDROCK:11, GRAVEL:12, PLANKS:13,
  COAL_ORE:14, IRON_ORE:15, GOLD_ORE:16, DIAMOND_ORE:17, OBSIDIAN:18,
  // gameplay additions
  LAVA:19, TORCH:20, FURNACE:21, FARMLAND:22, CROP:23, CROP_RIPE:24, COBBLE:25,
  CRAFTING_TABLE:26, CHEST:27, BED:28,
  // redstone
  REDSTONE_BLOCK:29, RS_LAMP:30, RS_LAMP_ON:31, RS_DUST:32, RS_DUST_ON:33,
  RS_TORCH:34, RS_TORCH_OFF:35, LEVER:36, BUTTON:37, REPEATER:38,
  PISTON:39, DOOR:40, DOOR_OPEN:41,
  // nowe bloki budowlane/dekoracyjne
  SANDSTONE:42, STONE_BRICKS:43, MOSSY_COBBLE:44, BOOKSHELF:45, PUMPKIN:46,
  MELON:47, CACTUS:48, CLAY:49, TERRACOTTA:50,
  WOOL_WHITE:51, WOOL_RED:52, WOOL_BLUE:53, WOOL_GREEN:54, WOOL_YELLOW:55, WOOL_BLACK:56,
  QUARTZ:57, ICE:58,
  // bloki magazynowe i rudy
  COAL_BLOCK:59, IRON_BLOCK:60, GOLD_BLOCK:61, DIAMOND_BLOCK:62,
  EMERALD_ORE:63, EMERALD_BLOCK:64, LAPIS_ORE:65, LAPIS_BLOCK:66, REDSTONE_ORE:67,
  // tory
  RAIL:68, POWERED_RAIL:69, DETECTOR_RAIL:70, ACTIVATOR_RAIL:71,
  // kolorowe szkło
  GLASS_WHITE:72, GLASS_RED:73, GLASS_BLUE:74, GLASS_GREEN:75, GLASS_YELLOW:76, GLASS_BLACK:77,
  // dywany
  CARPET_WHITE:78, CARPET_RED:79, CARPET_BLUE:80, CARPET_GREEN:81, CARPET_YELLOW:82, CARPET_BLACK:83,
  // warianty drewna
  DARK_WOOD:84, DARK_PLANKS:85, PALE_WOOD:86, PALE_PLANKS:87,
  // dekoracje kamienne
  POLISHED_STONE:88, GRANITE:89, MARBLE:90
};

// Zbiór ID torów (płaskie, przechodnie) + helper do renderowania/fizyki
export const RAIL_IDS = new Set([B.RAIL, B.POWERED_RAIL, B.DETECTOR_RAIL, B.ACTIVATOR_RAIL]);
export function isRailBlock(id) { return RAIL_IDS.has(id); }

// Zbiór ID/kluczy komponentów redstone (do palety i logiki)
export const REDSTONE_IDS = new Set([29,30,31,32,33,34,35,36,37,38,39,40,41]);
export function isRedstone(id) { return REDSTONE_IDS.has(id); }

// Bloki renderowane z prawdziwą przezroczystością alfa (szkło + lód) —
// w przeciwieństwie do np. liści, które używają alpha-test tylko na dziury.
export const GLASS_IDS = new Set([B.GLASS, B.ICE, B.GLASS_WHITE, B.GLASS_RED, B.GLASS_BLUE, B.GLASS_GREEN, B.GLASS_YELLOW, B.GLASS_BLACK]);
export function isGlassTex(id) { return GLASS_IDS.has(id); }

export const BLOCK_PROPS = {
  [B.AIR]:     { solid:false, transparent:true,  name:'Powietrze' },
  [B.GRASS]:   { solid:true,  transparent:false, name:'Trawa',    hardness:0.6 },
  [B.DIRT]:    { solid:true,  transparent:false, name:'Ziemia',   hardness:0.5 },
  [B.STONE]:   { solid:true,  transparent:false, name:'Kamień',   hardness:1.5 },
  [B.SAND]:    { solid:true,  transparent:false, name:'Piasek',   hardness:0.5 },
  [B.WOOD]:    { solid:true,  transparent:false, name:'Drewno',   hardness:2.0 },
  [B.LEAVES]:  { solid:true,  transparent:true,  name:'Liście',   hardness:0.2 },
  [B.GLASS]:   { solid:true,  transparent:true,  name:'Szkło',    hardness:0.3 },
  [B.BRICK]:   { solid:true,  transparent:false, name:'Cegła',    hardness:2.0 },
  [B.SNOW]:    { solid:true,  transparent:false, name:'Śnieg',    hardness:0.2 },
  [B.WATER]:   { solid:false, transparent:true,  name:'Woda',     hardness:100 },
  [B.BEDROCK]: { solid:true,  transparent:false, name:'Bazalt',   hardness:100 },
  [B.GRAVEL]:  { solid:true,  transparent:false, name:'Żwir',     hardness:0.6 },
  [B.PLANKS]:  { solid:true,  transparent:false, name:'Deski',    hardness:1.5 },
  [B.COAL_ORE]:    { solid:true, transparent:false, name:'Ruda węgla',    hardness:3.0 },
  [B.IRON_ORE]:    { solid:true, transparent:false, name:'Ruda żelaza',   hardness:3.0 },
  [B.GOLD_ORE]:    { solid:true, transparent:false, name:'Ruda złota',    hardness:3.0 },
  [B.DIAMOND_ORE]: { solid:true, transparent:false, name:'Ruda diamentu', hardness:3.0 },
  [B.OBSIDIAN]:    { solid:true, transparent:false, name:'Obsydian',      hardness:10 },
  [B.LAVA]:        { solid:false, transparent:true,  name:'Lawa',      hardness:100 },
  [B.TORCH]:       { solid:true,  transparent:true,  name:'Pochodnia', hardness:0.1, light:true },
  [B.FURNACE]:     { solid:true,  transparent:false, name:'Piec',      hardness:3.5 },
  [B.FARMLAND]:    { solid:true,  transparent:false, name:'Grządka',   hardness:0.5 },
  [B.CROP]:        { solid:true,  transparent:true,  name:'Sadzonka',  hardness:0.1 },
  [B.CROP_RIPE]:   { solid:true,  transparent:true,  name:'Zboże',     hardness:0.1 },
  [B.COBBLE]:      { solid:true,  transparent:false, name:'Bruk',      hardness:2.0 },
  [B.CRAFTING_TABLE]: { solid:true, transparent:false, name:'Stół rzemieślniczy', hardness:2.5 },
  [B.CHEST]:       { solid:true,  transparent:false, name:'Skrzynia', hardness:2.5 },
  [B.BED]:         { solid:true,  transparent:false, name:'Łóżko',    hardness:0.4 },
  // redstone
  [B.REDSTONE_BLOCK]: { solid:true,  transparent:false, name:'Blok redstone',    hardness:1.5 },
  [B.RS_LAMP]:     { solid:true,  transparent:false, name:'Lampa redstone',    hardness:0.5 },
  [B.RS_LAMP_ON]:  { solid:true,  transparent:false, name:'Lampa redstone',    hardness:0.5 },
  [B.RS_DUST]:     { solid:true,  transparent:true,  name:'Pył redstone',       hardness:0.1 },
  [B.RS_DUST_ON]:  { solid:true,  transparent:true,  name:'Pył redstone',       hardness:0.1 },
  [B.RS_TORCH]:    { solid:true,  transparent:true,  name:'Pochodnia redstone', hardness:0.1, light:true },
  [B.RS_TORCH_OFF]:{ solid:true,  transparent:true,  name:'Pochodnia redstone', hardness:0.1 },
  [B.LEVER]:       { solid:true,  transparent:true,  name:'Dźwignia',           hardness:0.3 },
  [B.BUTTON]:      { solid:true,  transparent:true,  name:'Przycisk',           hardness:0.3 },
  [B.REPEATER]:    { solid:true,  transparent:true,  name:'Przekaźnik',         hardness:0.3 },
  [B.PISTON]:      { solid:true,  transparent:false, name:'Tłok',               hardness:1.0 },
  [B.DOOR]:        { solid:true,  transparent:false, name:'Drzwi',              hardness:1.0 },
  [B.DOOR_OPEN]:   { solid:false, transparent:true,  name:'Drzwi',              hardness:1.0 },
  // ── nowe bloki budowlane/dekoracyjne ──
  [B.SANDSTONE]:    { solid:true, transparent:false, name:'Piaskowiec',       hardness:0.8 },
  [B.STONE_BRICKS]: { solid:true, transparent:false, name:'Kamienne cegły',   hardness:1.5 },
  [B.MOSSY_COBBLE]: { solid:true, transparent:false, name:'Omszały bruk',     hardness:2.0 },
  [B.BOOKSHELF]:    { solid:true, transparent:false, name:'Regał',            hardness:1.5 },
  [B.PUMPKIN]:      { solid:true, transparent:false, name:'Dynia',            hardness:1.0 },
  [B.MELON]:        { solid:true, transparent:false, name:'Arbuz',            hardness:1.0 },
  [B.CACTUS]:       { solid:true, transparent:false, name:'Kaktus',           hardness:0.4 },
  [B.CLAY]:         { solid:true, transparent:false, name:'Glina',            hardness:0.6 },
  [B.TERRACOTTA]:   { solid:true, transparent:false, name:'Terakota',         hardness:1.25 },
  [B.WOOL_WHITE]:   { solid:true, transparent:false, name:'Wełna biała',      hardness:0.8 },
  [B.WOOL_RED]:     { solid:true, transparent:false, name:'Wełna czerwona',   hardness:0.8 },
  [B.WOOL_BLUE]:    { solid:true, transparent:false, name:'Wełna niebieska',  hardness:0.8 },
  [B.WOOL_GREEN]:   { solid:true, transparent:false, name:'Wełna zielona',    hardness:0.8 },
  [B.WOOL_YELLOW]:  { solid:true, transparent:false, name:'Wełna żółta',      hardness:0.8 },
  [B.WOOL_BLACK]:   { solid:true, transparent:false, name:'Wełna czarna',     hardness:0.8 },
  [B.QUARTZ]:       { solid:true, transparent:false, name:'Blok kwarcu',      hardness:0.8 },
  [B.ICE]:          { solid:true, transparent:true,  name:'Lód',              hardness:0.5 },
  // ── bloki magazynowe i rudy ──
  [B.COAL_BLOCK]:    { solid:true, transparent:false, name:'Blok węgla',      hardness:5.0 },
  [B.IRON_BLOCK]:    { solid:true, transparent:false, name:'Blok żelaza',     hardness:5.0 },
  [B.GOLD_BLOCK]:    { solid:true, transparent:false, name:'Blok złota',      hardness:3.0 },
  [B.DIAMOND_BLOCK]: { solid:true, transparent:false, name:'Blok diamentu',   hardness:5.0 },
  [B.EMERALD_ORE]:   { solid:true, transparent:false, name:'Ruda szmaragdu',  hardness:3.0 },
  [B.EMERALD_BLOCK]: { solid:true, transparent:false, name:'Blok szmaragdu',  hardness:5.0 },
  [B.LAPIS_ORE]:     { solid:true, transparent:false, name:'Ruda lapisu',     hardness:3.0 },
  [B.LAPIS_BLOCK]:   { solid:true, transparent:false, name:'Blok lapisu',     hardness:3.0 },
  [B.REDSTONE_ORE]:  { solid:true, transparent:false, name:'Ruda redstone',   hardness:3.0 },
  // ── tory (płaskie, przechodnie) ──
  [B.RAIL]:           { solid:false, transparent:true, name:'Tory',            hardness:0.7 },
  [B.POWERED_RAIL]:   { solid:false, transparent:true, name:'Tory zasilane',   hardness:0.7 },
  [B.DETECTOR_RAIL]:  { solid:false, transparent:true, name:'Tory z czujnikiem', hardness:0.7 },
  [B.ACTIVATOR_RAIL]: { solid:false, transparent:true, name:'Tory aktywujące', hardness:0.7 },
  // ── kolorowe szkło (dekoracyjne, przezroczyste) ──
  [B.GLASS_WHITE]:  { solid:true, transparent:true, name:'Białe szkło',      hardness:0.3 },
  [B.GLASS_RED]:    { solid:true, transparent:true, name:'Czerwone szkło',   hardness:0.3 },
  [B.GLASS_BLUE]:   { solid:true, transparent:true, name:'Niebieskie szkło', hardness:0.3 },
  [B.GLASS_GREEN]:  { solid:true, transparent:true, name:'Zielone szkło',    hardness:0.3 },
  [B.GLASS_YELLOW]: { solid:true, transparent:true, name:'Żółte szkło',      hardness:0.3 },
  [B.GLASS_BLACK]:  { solid:true, transparent:true, name:'Czarne szkło',     hardness:0.3 },
  // ── dywany (dekoracyjne) ──
  [B.CARPET_WHITE]:  { solid:true, transparent:false, name:'Biały dywan',      hardness:0.1 },
  [B.CARPET_RED]:    { solid:true, transparent:false, name:'Czerwony dywan',   hardness:0.1 },
  [B.CARPET_BLUE]:   { solid:true, transparent:false, name:'Niebieski dywan',  hardness:0.1 },
  [B.CARPET_GREEN]:  { solid:true, transparent:false, name:'Zielony dywan',    hardness:0.1 },
  [B.CARPET_YELLOW]: { solid:true, transparent:false, name:'Żółty dywan',      hardness:0.1 },
  [B.CARPET_BLACK]:  { solid:true, transparent:false, name:'Czarny dywan',     hardness:0.1 },
  // ── warianty drewna ──
  [B.DARK_WOOD]:    { solid:true, transparent:false, name:'Ciemne drewno',   hardness:2.0 },
  [B.DARK_PLANKS]:  { solid:true, transparent:false, name:'Ciemne deski',    hardness:1.5 },
  [B.PALE_WOOD]:    { solid:true, transparent:false, name:'Jasne drewno',    hardness:2.0 },
  [B.PALE_PLANKS]:  { solid:true, transparent:false, name:'Jasne deski',     hardness:1.5 },
  // ── dekoracje kamienne ──
  [B.POLISHED_STONE]: { solid:true, transparent:false, name:'Polerowany kamień', hardness:1.5 },
  [B.GRANITE]:         { solid:true, transparent:false, name:'Granit',           hardness:1.5 },
  [B.MARBLE]:           { solid:true, transparent:false, name:'Marmur',           hardness:1.5 },
};

export const HOTBAR_BLOCKS = [B.GRASS, B.DIRT, B.STONE, B.SAND, B.WOOD, B.PLANKS, B.BRICK, B.GLASS, B.LEAVES];

// Per-block RGB colors [top, side, bottom] — each is [r,g,b] in 0..1 range
// Used as vertex colors so blocks are always visible even without atlas texture
export const BLOCK_COLORS = {
  [B.GRASS]:   { top:[0.30,0.68,0.12], side:[0.28,0.62,0.14], bot:[0.55,0.35,0.14] },
  [B.DIRT]:    { top:[0.55,0.35,0.14], side:[0.55,0.35,0.14], bot:[0.55,0.35,0.14] },
  [B.STONE]:   { top:[0.55,0.55,0.55], side:[0.55,0.55,0.55], bot:[0.55,0.55,0.55] },
  [B.SAND]:    { top:[0.85,0.76,0.42], side:[0.85,0.76,0.42], bot:[0.85,0.76,0.42] },
  [B.WOOD]:    { top:[0.45,0.28,0.10], side:[0.42,0.26,0.08], bot:[0.45,0.28,0.10] },
  [B.LEAVES]:  { top:[0.18,0.60,0.10], side:[0.18,0.60,0.10], bot:[0.18,0.60,0.10] },
  [B.GLASS]:   { top:[0.65,0.85,0.90], side:[0.65,0.85,0.90], bot:[0.65,0.85,0.90] },
  [B.BRICK]:   { top:[0.68,0.26,0.16], side:[0.68,0.26,0.16], bot:[0.68,0.26,0.16] },
  [B.SNOW]:    { top:[0.92,0.95,1.00], side:[0.88,0.92,0.98], bot:[0.55,0.35,0.14] },
  [B.WATER]:   { top:[0.10,0.32,0.82], side:[0.10,0.32,0.82], bot:[0.10,0.32,0.82] },
  [B.BEDROCK]: { top:[0.15,0.15,0.15], side:[0.15,0.15,0.15], bot:[0.15,0.15,0.15] },
  [B.GRAVEL]:  { top:[0.50,0.48,0.45], side:[0.50,0.48,0.45], bot:[0.50,0.48,0.45] },
  [B.PLANKS]:  { top:[0.78,0.58,0.28], side:[0.78,0.58,0.28], bot:[0.78,0.58,0.28] },
  [B.COAL_ORE]:    { top:[0.30,0.30,0.30], side:[0.32,0.32,0.32], bot:[0.30,0.30,0.30] },
  [B.IRON_ORE]:    { top:[0.72,0.58,0.46], side:[0.70,0.56,0.44], bot:[0.72,0.58,0.46] },
  [B.GOLD_ORE]:    { top:[0.82,0.72,0.30], side:[0.80,0.70,0.28], bot:[0.82,0.72,0.30] },
  [B.DIAMOND_ORE]: { top:[0.40,0.82,0.85], side:[0.38,0.80,0.83], bot:[0.40,0.82,0.85] },
  [B.OBSIDIAN]:    { top:[0.12,0.08,0.18], side:[0.11,0.07,0.16], bot:[0.12,0.08,0.18] },
  [B.LAVA]:        { top:[1.00,0.55,0.10], side:[0.95,0.40,0.06], bot:[0.80,0.30,0.04] },
  [B.TORCH]:       { top:[1.00,0.90,0.45], side:[0.95,0.78,0.30], bot:[0.50,0.35,0.12] },
  [B.FURNACE]:     { top:[0.40,0.40,0.42], side:[0.34,0.34,0.36], bot:[0.34,0.34,0.36] },
  [B.FARMLAND]:    { top:[0.34,0.22,0.10], side:[0.48,0.32,0.14], bot:[0.55,0.35,0.14] },
  [B.CROP]:        { top:[0.35,0.70,0.20], side:[0.35,0.70,0.20], bot:[0.30,0.55,0.16] },
  [B.CROP_RIPE]:   { top:[0.88,0.74,0.24], side:[0.82,0.68,0.20], bot:[0.55,0.45,0.14] },
  [B.COBBLE]:      { top:[0.46,0.46,0.48], side:[0.42,0.42,0.44], bot:[0.40,0.40,0.42] },
  [B.CRAFTING_TABLE]: { top:[0.55,0.40,0.20], side:[0.48,0.32,0.15], bot:[0.42,0.28,0.12] },
  [B.CHEST]:       { top:[0.66,0.48,0.24], side:[0.60,0.42,0.20], bot:[0.50,0.34,0.16] },
  [B.BED]:         { top:[0.82,0.20,0.24], side:[0.70,0.16,0.20], bot:[0.40,0.28,0.16] },
  // redstone
  [B.REDSTONE_BLOCK]: { top:[0.80,0.10,0.10], side:[0.72,0.08,0.08], bot:[0.62,0.06,0.06] },
  [B.RS_LAMP]:     { top:[0.42,0.34,0.20], side:[0.38,0.30,0.18], bot:[0.34,0.26,0.16] },
  [B.RS_LAMP_ON]:  { top:[1.00,0.86,0.50], side:[0.98,0.82,0.44], bot:[0.90,0.74,0.40] },
  [B.RS_DUST]:     { top:[0.42,0.05,0.05], side:[0.36,0.04,0.04], bot:[0.30,0.03,0.03] },
  [B.RS_DUST_ON]:  { top:[1.00,0.15,0.10], side:[0.90,0.12,0.08], bot:[0.80,0.10,0.06] },
  [B.RS_TORCH]:    { top:[1.00,0.25,0.20], side:[0.90,0.18,0.14], bot:[0.55,0.30,0.10] },
  [B.RS_TORCH_OFF]:{ top:[0.45,0.12,0.10], side:[0.40,0.10,0.08], bot:[0.45,0.28,0.10] },
  [B.LEVER]:       { top:[0.62,0.54,0.42], side:[0.50,0.44,0.34], bot:[0.42,0.38,0.30] },
  [B.BUTTON]:      { top:[0.60,0.52,0.40], side:[0.52,0.46,0.36], bot:[0.46,0.40,0.32] },
  [B.REPEATER]:    { top:[0.72,0.72,0.74], side:[0.60,0.60,0.62], bot:[0.50,0.50,0.52] },
  [B.PISTON]:      { top:[0.78,0.66,0.42], side:[0.62,0.52,0.34], bot:[0.48,0.40,0.28] },
  [B.DOOR]:        { top:[0.60,0.42,0.20], side:[0.56,0.38,0.18], bot:[0.48,0.32,0.15] },
  [B.DOOR_OPEN]:   { top:[0.60,0.42,0.20], side:[0.56,0.38,0.18], bot:[0.48,0.32,0.15] },
  // ── nowe bloki budowlane/dekoracyjne ──
  [B.SANDSTONE]:    { top:[0.90,0.82,0.58], side:[0.88,0.80,0.55], bot:[0.84,0.76,0.50] },
  [B.STONE_BRICKS]: { top:[0.52,0.52,0.54], side:[0.50,0.50,0.52], bot:[0.48,0.48,0.50] },
  [B.MOSSY_COBBLE]: { top:[0.40,0.48,0.36], side:[0.38,0.44,0.34], bot:[0.36,0.40,0.32] },
  [B.BOOKSHELF]:    { top:[0.55,0.40,0.20], side:[0.64,0.48,0.28], bot:[0.55,0.40,0.20] },
  [B.PUMPKIN]:      { top:[0.80,0.52,0.14], side:[0.88,0.56,0.12], bot:[0.72,0.48,0.14] },
  [B.MELON]:        { top:[0.30,0.58,0.20], side:[0.34,0.62,0.22], bot:[0.30,0.58,0.20] },
  [B.CACTUS]:       { top:[0.32,0.56,0.24], side:[0.24,0.50,0.18], bot:[0.28,0.44,0.18] },
  [B.CLAY]:         { top:[0.66,0.68,0.72], side:[0.66,0.68,0.72], bot:[0.66,0.68,0.72] },
  [B.TERRACOTTA]:   { top:[0.72,0.44,0.30], side:[0.70,0.42,0.28], bot:[0.66,0.40,0.26] },
  [B.WOOL_WHITE]:   { top:[0.95,0.95,0.95], side:[0.92,0.92,0.92], bot:[0.90,0.90,0.90] },
  [B.WOOL_RED]:     { top:[0.72,0.18,0.16], side:[0.68,0.16,0.14], bot:[0.62,0.14,0.12] },
  [B.WOOL_BLUE]:    { top:[0.20,0.30,0.70], side:[0.18,0.28,0.66], bot:[0.16,0.24,0.60] },
  [B.WOOL_GREEN]:   { top:[0.30,0.56,0.20], side:[0.28,0.52,0.18], bot:[0.24,0.46,0.16] },
  [B.WOOL_YELLOW]:  { top:[0.90,0.82,0.24], side:[0.86,0.78,0.22], bot:[0.80,0.72,0.20] },
  [B.WOOL_BLACK]:   { top:[0.16,0.16,0.18], side:[0.14,0.14,0.16], bot:[0.12,0.12,0.14] },
  [B.QUARTZ]:       { top:[0.94,0.92,0.88], side:[0.92,0.90,0.86], bot:[0.90,0.88,0.84] },
  [B.ICE]:          { top:[0.68,0.82,0.95], side:[0.66,0.80,0.94], bot:[0.64,0.78,0.92] },
  // ── bloki magazynowe i rudy ──
  [B.COAL_BLOCK]:    { top:[0.14,0.14,0.14], side:[0.12,0.12,0.12], bot:[0.10,0.10,0.10] },
  [B.IRON_BLOCK]:    { top:[0.88,0.88,0.88], side:[0.84,0.84,0.84], bot:[0.80,0.80,0.80] },
  [B.GOLD_BLOCK]:    { top:[0.96,0.82,0.28], side:[0.92,0.78,0.24], bot:[0.86,0.72,0.22] },
  [B.DIAMOND_BLOCK]: { top:[0.42,0.86,0.88], side:[0.38,0.82,0.85], bot:[0.34,0.78,0.82] },
  [B.EMERALD_ORE]:   { top:[0.48,0.60,0.48], side:[0.46,0.58,0.46], bot:[0.44,0.56,0.44] },
  [B.EMERALD_BLOCK]: { top:[0.18,0.78,0.42], side:[0.16,0.72,0.38], bot:[0.14,0.66,0.34] },
  [B.LAPIS_ORE]:     { top:[0.36,0.42,0.58], side:[0.34,0.40,0.56], bot:[0.32,0.38,0.54] },
  [B.LAPIS_BLOCK]:   { top:[0.16,0.28,0.66], side:[0.14,0.26,0.62], bot:[0.12,0.24,0.58] },
  [B.REDSTONE_ORE]:  { top:[0.52,0.34,0.32], side:[0.50,0.32,0.30], bot:[0.48,0.30,0.28] },
  // ── tory (kolor zapasowy; render idzie przez płaską teksturę) ──
  [B.RAIL]:           { top:[0.62,0.60,0.58], side:[0.42,0.34,0.24], bot:[0.38,0.30,0.20] },
  [B.POWERED_RAIL]:   { top:[0.86,0.62,0.28], side:[0.42,0.34,0.24], bot:[0.38,0.30,0.20] },
  [B.DETECTOR_RAIL]:  { top:[0.70,0.68,0.66], side:[0.42,0.34,0.24], bot:[0.38,0.30,0.20] },
  [B.ACTIVATOR_RAIL]: { top:[0.72,0.40,0.34], side:[0.42,0.34,0.24], bot:[0.38,0.30,0.20] },
  // ── kolorowe szkło ──
  [B.GLASS_WHITE]:  { top:[0.90,0.92,0.94], side:[0.90,0.92,0.94], bot:[0.90,0.92,0.94] },
  [B.GLASS_RED]:    { top:[0.80,0.30,0.28], side:[0.80,0.30,0.28], bot:[0.80,0.30,0.28] },
  [B.GLASS_BLUE]:   { top:[0.24,0.36,0.76], side:[0.24,0.36,0.76], bot:[0.24,0.36,0.76] },
  [B.GLASS_GREEN]:  { top:[0.32,0.62,0.28], side:[0.32,0.62,0.28], bot:[0.32,0.62,0.28] },
  [B.GLASS_YELLOW]: { top:[0.90,0.80,0.28], side:[0.90,0.80,0.28], bot:[0.90,0.80,0.28] },
  [B.GLASS_BLACK]:  { top:[0.18,0.18,0.20], side:[0.18,0.18,0.20], bot:[0.18,0.18,0.20] },
  // ── dywany ──
  [B.CARPET_WHITE]:  { top:[0.92,0.92,0.92], side:[0.92,0.92,0.92], bot:[0.85,0.85,0.85] },
  [B.CARPET_RED]:    { top:[0.70,0.18,0.16], side:[0.70,0.18,0.16], bot:[0.60,0.14,0.12] },
  [B.CARPET_BLUE]:   { top:[0.22,0.32,0.68], side:[0.22,0.32,0.68], bot:[0.18,0.26,0.58] },
  [B.CARPET_GREEN]:  { top:[0.30,0.54,0.20], side:[0.30,0.54,0.20], bot:[0.24,0.46,0.16] },
  [B.CARPET_YELLOW]: { top:[0.88,0.80,0.24], side:[0.88,0.80,0.24], bot:[0.80,0.72,0.20] },
  [B.CARPET_BLACK]:  { top:[0.16,0.16,0.18], side:[0.16,0.16,0.18], bot:[0.12,0.12,0.14] },
  // ── warianty drewna ──
  [B.DARK_WOOD]:   { top:[0.30,0.18,0.08], side:[0.26,0.15,0.06], bot:[0.30,0.18,0.08] },
  [B.DARK_PLANKS]: { top:[0.40,0.26,0.14], side:[0.40,0.26,0.14], bot:[0.40,0.26,0.14] },
  [B.PALE_WOOD]:   { top:[0.82,0.74,0.58], side:[0.78,0.70,0.54], bot:[0.82,0.74,0.58] },
  [B.PALE_PLANKS]: { top:[0.88,0.82,0.66], side:[0.88,0.82,0.66], bot:[0.88,0.82,0.66] },
  // ── dekoracje kamienne ──
  [B.POLISHED_STONE]: { top:[0.68,0.68,0.70], side:[0.68,0.68,0.70], bot:[0.68,0.68,0.70] },
  [B.GRANITE]:         { top:[0.62,0.42,0.38], side:[0.62,0.42,0.38], bot:[0.62,0.42,0.38] },
  [B.MARBLE]:           { top:[0.86,0.86,0.88], side:[0.86,0.86,0.88], bot:[0.86,0.86,0.88] },
};

// Kafelki tekstur nowych bloków — region 156+ (po torach 144–155), rysowane w
// buildTextureAtlas(). Jawne numery, by nie kolidować z auto-numeracją ikon.
export const BLOCK_TEX = {
  clay:156, terracotta:157, quartz:158, ice:159,
  coal_block:160, iron_block:161, gold_block:162, diamond_block:163,
  emerald_block:164, lapis_block:165,
  wool_white:166, wool_red:167, wool_blue:168, wool_green:169, wool_yellow:170, wool_black:171,
  stone_bricks:172, mossy_cobble:173,
  coal_ore:174, iron_ore:175, gold_ore:176, diamond_ore:177,
  emerald_ore:178, lapis_ore:179, redstone_ore:180,
  sandstone_top:181, sandstone_side:182, bookshelf_side:183,
  pumpkin_top:184, pumpkin_side:185, melon_top:186, melon_side:187,
  cactus_top:188, cactus_side:189,
  cobble:190, obsidian:191, redstone_block:192, rs_lamp:193,
  furnace_top:194, furnace_side:195, table_top:196, table_side:197,
  chest_top:198, chest_side:199, bed_top:200, bed_side:201,
  // ── kolorowe szkło (202+) ──
  glass_white:202, glass_red:203, glass_blue:204, glass_green:205, glass_yellow:206, glass_black:207,
  // ── dywany ──
  carpet_white:208, carpet_red:209, carpet_blue:210, carpet_green:211, carpet_yellow:212, carpet_black:213,
  // ── warianty drewna ──
  dark_wood_top:214, dark_wood_side:215, dark_planks:216,
  pale_wood_top:217, pale_wood_side:218, pale_planks:219,
  // ── dekoracje kamienne ──
  polished_stone:220, granite:221, marble:222,
  // ── uzupełnienie brakujących tekstur (dotąd płaski kolor) ──
  lava:223, torch:224, farmland_top:225, crop:226, crop_ripe:227,
  rs_lamp_on:228, rs_dust:229, rs_dust_on:230, rs_torch:231, rs_torch_off:232,
  lever:233, button:234, repeater:235, piston:236, door:237,
};

// [top_texId, bottom_texId, side_texId]
export const BLOCK_FACES = {
  [B.GRASS]:   [ 0,  2,  1],
  [B.DIRT]:    [ 2,  2,  2],
  [B.STONE]:   [ 3,  3,  3],
  [B.SAND]:    [ 4,  4,  4],
  [B.WOOD]:    [ 5,  5,  6],
  [B.LEAVES]:  [ 7,  7,  7],
  [B.GLASS]:   [ 8,  8,  8],
  [B.BRICK]:   [ 9,  9,  9],
  [B.SNOW]:    [10,  2, 11],
  [B.WATER]:   [12, 12, 12],
  [B.BEDROCK]: [13, 13, 13],
  [B.GRAVEL]:  [14, 14, 14],
  [B.PLANKS]:  [15, 15, 15],
  // ── nowe bloki (patrz BLOCK_TEX / buildTextureAtlas) ──
  [B.CLAY]:         u(BLOCK_TEX.clay),
  [B.TERRACOTTA]:   u(BLOCK_TEX.terracotta),
  [B.QUARTZ]:       u(BLOCK_TEX.quartz),
  [B.ICE]:          u(BLOCK_TEX.ice),
  [B.COAL_BLOCK]:   u(BLOCK_TEX.coal_block),
  [B.IRON_BLOCK]:   u(BLOCK_TEX.iron_block),
  [B.GOLD_BLOCK]:   u(BLOCK_TEX.gold_block),
  [B.DIAMOND_BLOCK]:u(BLOCK_TEX.diamond_block),
  [B.EMERALD_BLOCK]:u(BLOCK_TEX.emerald_block),
  [B.LAPIS_BLOCK]:  u(BLOCK_TEX.lapis_block),
  [B.WOOL_WHITE]:   u(BLOCK_TEX.wool_white),
  [B.WOOL_RED]:     u(BLOCK_TEX.wool_red),
  [B.WOOL_BLUE]:    u(BLOCK_TEX.wool_blue),
  [B.WOOL_GREEN]:   u(BLOCK_TEX.wool_green),
  [B.WOOL_YELLOW]:  u(BLOCK_TEX.wool_yellow),
  [B.WOOL_BLACK]:   u(BLOCK_TEX.wool_black),
  [B.STONE_BRICKS]: u(BLOCK_TEX.stone_bricks),
  [B.MOSSY_COBBLE]: u(BLOCK_TEX.mossy_cobble),
  [B.COAL_ORE]:     u(BLOCK_TEX.coal_ore),
  [B.IRON_ORE]:     u(BLOCK_TEX.iron_ore),
  [B.GOLD_ORE]:     u(BLOCK_TEX.gold_ore),
  [B.DIAMOND_ORE]:  u(BLOCK_TEX.diamond_ore),
  [B.EMERALD_ORE]:  u(BLOCK_TEX.emerald_ore),
  [B.LAPIS_ORE]:    u(BLOCK_TEX.lapis_ore),
  [B.REDSTONE_ORE]: u(BLOCK_TEX.redstone_ore),
  // wielościenne: [top, bottom, side]
  [B.SANDSTONE]: [BLOCK_TEX.sandstone_top, BLOCK_TEX.sandstone_top, BLOCK_TEX.sandstone_side],
  [B.BOOKSHELF]: [15, 15, BLOCK_TEX.bookshelf_side],
  [B.PUMPKIN]:   [BLOCK_TEX.pumpkin_top, BLOCK_TEX.pumpkin_top, BLOCK_TEX.pumpkin_side],
  [B.MELON]:     [BLOCK_TEX.melon_top, BLOCK_TEX.melon_top, BLOCK_TEX.melon_side],
  [B.CACTUS]:    [BLOCK_TEX.cactus_top, BLOCK_TEX.cactus_top, BLOCK_TEX.cactus_side],
  // ── klasyczne bloki dotąd renderowane płaskim kolorem ──
  [B.COBBLE]:         u(BLOCK_TEX.cobble),
  [B.OBSIDIAN]:       u(BLOCK_TEX.obsidian),
  [B.REDSTONE_BLOCK]: u(BLOCK_TEX.redstone_block),
  [B.RS_LAMP]:        u(BLOCK_TEX.rs_lamp),
  [B.FURNACE]: [BLOCK_TEX.furnace_top, BLOCK_TEX.furnace_top, BLOCK_TEX.furnace_side],
  [B.CRAFTING_TABLE]: [BLOCK_TEX.table_top, 15, BLOCK_TEX.table_side],
  [B.CHEST]:   [BLOCK_TEX.chest_top, BLOCK_TEX.chest_top, BLOCK_TEX.chest_side],
  [B.BED]:     [BLOCK_TEX.bed_top, 15, BLOCK_TEX.bed_side],
  // ── kolorowe szkło ──
  [B.GLASS_WHITE]:  u(BLOCK_TEX.glass_white),
  [B.GLASS_RED]:    u(BLOCK_TEX.glass_red),
  [B.GLASS_BLUE]:   u(BLOCK_TEX.glass_blue),
  [B.GLASS_GREEN]:  u(BLOCK_TEX.glass_green),
  [B.GLASS_YELLOW]: u(BLOCK_TEX.glass_yellow),
  [B.GLASS_BLACK]:  u(BLOCK_TEX.glass_black),
  // ── dywany ──
  [B.CARPET_WHITE]:  u(BLOCK_TEX.carpet_white),
  [B.CARPET_RED]:    u(BLOCK_TEX.carpet_red),
  [B.CARPET_BLUE]:   u(BLOCK_TEX.carpet_blue),
  [B.CARPET_GREEN]:  u(BLOCK_TEX.carpet_green),
  [B.CARPET_YELLOW]: u(BLOCK_TEX.carpet_yellow),
  [B.CARPET_BLACK]:  u(BLOCK_TEX.carpet_black),
  // ── warianty drewna (log: góra/dół = słoje, bok = kora) ──
  [B.DARK_WOOD]:   [BLOCK_TEX.dark_wood_top, BLOCK_TEX.dark_wood_top, BLOCK_TEX.dark_wood_side],
  [B.DARK_PLANKS]: u(BLOCK_TEX.dark_planks),
  [B.PALE_WOOD]:   [BLOCK_TEX.pale_wood_top, BLOCK_TEX.pale_wood_top, BLOCK_TEX.pale_wood_side],
  [B.PALE_PLANKS]: u(BLOCK_TEX.pale_planks),
  // ── dekoracje kamienne ──
  [B.POLISHED_STONE]: u(BLOCK_TEX.polished_stone),
  [B.GRANITE]:         u(BLOCK_TEX.granite),
  [B.MARBLE]:           u(BLOCK_TEX.marble),
  // ── uzupełnienie brakujących tekstur (dotąd płaski kolor) ──
  [B.LAVA]:          u(BLOCK_TEX.lava),
  [B.TORCH]:         u(BLOCK_TEX.torch),
  [B.FARMLAND]:      [BLOCK_TEX.farmland_top, 2, 2],   // spód/bok jak ziemia (kafelek 2)
  [B.CROP]:          u(BLOCK_TEX.crop),
  [B.CROP_RIPE]:     u(BLOCK_TEX.crop_ripe),
  [B.RS_LAMP_ON]:    u(BLOCK_TEX.rs_lamp_on),
  [B.RS_DUST]:       u(BLOCK_TEX.rs_dust),
  [B.RS_DUST_ON]:    u(BLOCK_TEX.rs_dust_on),
  [B.RS_TORCH]:      u(BLOCK_TEX.rs_torch),
  [B.RS_TORCH_OFF]:  u(BLOCK_TEX.rs_torch_off),
  [B.LEVER]:         u(BLOCK_TEX.lever),
  [B.BUTTON]:        u(BLOCK_TEX.button),
  [B.REPEATER]:      u(BLOCK_TEX.repeater),
  [B.PISTON]:        u(BLOCK_TEX.piston),
  [B.DOOR]:          u(BLOCK_TEX.door),
};
// skrót: ten sam kafelek na wszystkich ścianach
function u(t){ return [t, t, t]; }

// Atlas: 256×256 px, 16 cols × 16 rows, each tile 16×16 px
// With atlas.flipY = false:  UV v=0 → canvas y=0 (top),  UV v=1 → canvas y=256 (bottom)
const TILE = 16, COLS = 16, TOTAL_ROWS = 16;

export function faceUV(id) {
  const col = id % COLS;
  const row = Math.floor(id / COLS);
  return [
    col / COLS,       (col + 1) / COLS,   // u0, u1
    row / TOTAL_ROWS, (row + 1) / TOTAL_ROWS  // v0, v1
  ];
}

export const ATLAS_COLS = COLS;

// ── Kafelki tekstur torów (płaskie quady, jawne per orientacja) ───────────────
// Wolny wiersz atlasu (144–155; ikony sięgają ~100). Każda orientacja to osobny
// kafelek — w rendererze używamy tożsamościowego UV (bez obracania), więc łuki
// łączą się z sąsiadami deterministycznie.
export const RAIL_TEX = {
  straight_ns:144, straight_ew:145,
  curve_ne:146, curve_es:147, curve_sw:148, curve_wn:149,
  powered_ns:150,  powered_ew:151,
  detector_ns:152, detector_ew:153,
  activator_ns:154, activator_ew:155,
};
// Kafelek toru dla bloku, kształtu ('straight'|'curve') i orientacji.
export function railTexTile(id, shape, orient) {
  if (shape === 'curve') return RAIL_TEX['curve_' + orient];   // tylko zwykłe tory zakręcają
  const ax = (orient === 'ew') ? 'ew' : 'ns';
  if (id === B.POWERED_RAIL)   return RAIL_TEX['powered_' + ax];
  if (id === B.DETECTOR_RAIL)  return RAIL_TEX['detector_' + ax];
  if (id === B.ACTIVATOR_RAIL) return RAIL_TEX['activator_' + ax];
  return RAIL_TEX['straight_' + ax];
}

// ── Ikony przedmiotów/bloków w ekwipunku i dłoni (kafelki atlasu od 16) ────────
// Barwy tierów zdublowane tutaj, by nie tworzyć cyklicznego importu z inventory.js
const ICON_TOOL_KINDS  = ['pickaxe','axe','shovel','sword','hoe'];
const ICON_TOOL_TIERS  = { wood:'#a97c40', stone:'#9a9a9a', iron:'#d8d0c4', gold:'#f0d040', diamond:'#5ce0e6' };
const ICON_ARMOR_PARTS = ['helmet','chestplate','leggings','boots'];
const ICON_ARMOR_TIERS = { leather:'#8a5a30', gold:'#f0d040', iron:'#d8d8d8', diamond:'#5ce0e6' };

// [klucz, kształt, kolor] — proste przedmioty
const ICON_SIMPLE = [
  ['stick','stick','#9a6a30'], ['coal','blob','#2b2b2b'],
  ['raw_iron','nugget','#caa791'], ['raw_gold','nugget','#d8bf62'],
  ['iron_ingot','ingot','#e6e6e6'], ['gold_ingot','ingot','#f0d040'],
  ['diamond','gem','#5ce0e6'], ['seeds','seeds','#8db83a'],
  ['wheat','wheat','#e0c040'], ['bread','bread','#c88030'],
  ['leather','sheet','#9a6a3a'], ['string','string','#e8e8e8'],
  ['flint','shard','#43413f'], ['bow','bow','#a06a30'], ['arrow','arrow','#d0d0d0'],
  ['bucket','bucket','#c2c6cc'], ['water_bucket','bucketF','#3a6ad0'], ['lava_bucket','bucketF','#ff6a10'],
  ['Wełna 🧶','sheet','#eaeae2'], ['Kość 🦴','bone','#efe9da'], ['Pióro 🪶','feather','#f2f2f2'],
  ['Proch 💥','blob','#5a5a5a'], ['Wołowina 🥩','meat','#b0402c'],
  ['Wieprzowina 🥓','meat','#e08a90'], ['Zgniłe mięso 🍖','meat','#7a5a3a'],
  // wagoniki
  ['minecart','minecart','#9aa0aa'], ['chest_minecart','minecartChest','#9aa0aa'],
  ['furnace_minecart','minecartFurnace','#9aa0aa'], ['tnt_minecart','minecartTnt','#9aa0aa'],
  // ── nowe przedmioty ──
  // materiały
  ['emerald','gem','#20c060'], ['lapis','gem','#2848c0'], ['clay_ball','nugget','#9aa0ac'],
  ['brick_item','brick','#b05030'], ['paper','paper','#f0f0e8'], ['book','book','#a05028'],
  ['sugar','pile','#f4f4f8'],
  // jedzenie
  ['apple','apple','#d03028'], ['golden_apple','apple','#f0c030'],
  ['carrot','carrot','#e07820'], ['potato','tuber','#c8a860'], ['baked_potato','tuber','#c88840'],
  ['cookie','cookie','#b07838'], ['melon_slice','melonSlice','#e04840'],
  ['raw_chicken','drumstick','#e8b0a0'], ['cooked_chicken','drumstick','#c88850'],
  ['cooked_beef','meat','#8a4028'], ['cooked_porkchop','meat','#d09070'],
  // narzędzia / przedmioty użytkowe
  ['shears','shears','#c8ccd2'], ['flint_and_steel','flintsteel','#b0783a'],
  ['fishing_rod','rod','#a07838'], ['compass','compass','#c04040'], ['clock','clock','#e0c040'],
];
// ['b:'+id, kształt, kolor] — bloki bez tekstury w atlasie
const ICON_BLOCKS = [
  ['b:'+B.COAL_ORE,'ore','#2b2b2b'], ['b:'+B.IRON_ORE,'ore','#caa791'],
  ['b:'+B.GOLD_ORE,'ore','#e8c840'], ['b:'+B.DIAMOND_ORE,'ore','#5ce0e6'],
  ['b:'+B.COBBLE,'cobble','#8a8a8a'], ['b:'+B.OBSIDIAN,'solid','#1a1226'],
  ['b:'+B.TORCH,'torch','#ffcc44'], ['b:'+B.FURNACE,'furnace','#6a6a6a'],
  ['b:'+B.CRAFTING_TABLE,'table','#a06a30'], ['b:'+B.CHEST,'chest','#9a6a30'],
  ['b:'+B.BED,'bed','#c0303a'],
  // tory (widok z góry)
  ['b:'+B.RAIL,'rail','#c2c2cc'], ['b:'+B.POWERED_RAIL,'railPowered','#e89628'],
  ['b:'+B.DETECTOR_RAIL,'railDetector','#d0d0d8'], ['b:'+B.ACTIVATOR_RAIL,'railActivator','#c83828'],
];

// Mapa klucz → kafelek (od 16). Kolejność musi zgadzać się z rysowaniem.
export const ICON_TILE = {};
{
  let t = 16;
  for (const [k] of ICON_SIMPLE) ICON_TILE[k] = t++;
  for (const [k] of ICON_BLOCKS) ICON_TILE[k] = t++;
  for (const tier in ICON_TOOL_TIERS) for (const kind of ICON_TOOL_KINDS) ICON_TILE[`${tier}_${kind}`] = t++;
  for (const tier in ICON_ARMOR_TIERS) for (const part of ICON_ARMOR_PARTS) ICON_TILE[`${tier}_${part}`] = t++;
}

// Kafelek ikony danego klucza (przedmiot lub 'b:<id>'); -1 gdy brak
export function iconTile(key) {
  if (key in ICON_TILE) return ICON_TILE[key];
  if (key.startsWith('b:')) { const id = +key.slice(2); if (BLOCK_FACES[id]) return BLOCK_FACES[id][0]; }
  return -1;
}
// Kafelki ścian bloku [góra, dół, bok] dla trzymanej kostki
export function blockFaceTiles(id) {
  if (BLOCK_FACES[id]) return BLOCK_FACES[id];
  const k = 'b:' + id;
  if (k in ICON_TILE) { const t = ICON_TILE[k]; return [t, t, t]; }
  return null;
}
// Atlas jako dataURL (cache) — do teł slotów w ekwipunku
let _atlasURL = null;
export function atlasImageURL() {
  if (!_atlasURL) _atlasURL = buildTextureAtlas().toDataURL('image/png');
  return _atlasURL;
}

// Pomocnicze do rysowania ikon
function _hex(h){ const n=parseInt(h.slice(1),16); return [(n>>16)&255,(n>>8)&255,n&255]; }
function _darken(h,a){ const [r,g,b]=_hex(h); return `rgb(${Math.max(0,r-a)},${Math.max(0,g-a)},${Math.max(0,b-a)})`; }
function _lighten(h,a){ const [r,g,b]=_hex(h); return `rgb(${Math.min(255,r+a)},${Math.min(255,g+a)},${Math.min(255,b+a)})`; }
function _disc(c,cx,cy,rad,col){ c.fillStyle=col; for(let dy=-rad;dy<=rad;dy++)for(let dx=-rad;dx<=rad;dx++) if(dx*dx+dy*dy<=rad*rad) c.fillRect(cx+dx,cy+dy,1,1); }

function _drawSimpleIcon(c, x, y, shape, col) {
  const dk=_darken(col,50), lt=_lighten(col,50);
  switch (shape) {
    case 'stick': for(let i=0;i<11;i++){ c.fillStyle=(i%3===0)?dk:col; c.fillRect(x+3+i,y+12-i,2,2);} break;
    case 'blob': case 'nugget': { const r=shape==='nugget'?4:5; _disc(c,x+8,y+9,r,col); _disc(c,x+6,y+7,1,lt); c.fillStyle=dk; c.fillRect(x+8+r-2,y+9+r-3,2,2);} break;
    case 'ingot': c.fillStyle=col; c.fillRect(x+3,y+6,10,5); c.fillStyle=lt; c.fillRect(x+4,y+6,8,1); c.fillStyle=dk; c.fillRect(x+3,y+10,10,1); break;
    case 'gem': for(let i=0;i<=10;i++){ const half=5-Math.abs(5-i); c.fillStyle=(i<3)?lt:col; c.fillRect(x+8-half,y+3+i,2*half+1,1);} break;
    case 'seeds': c.fillStyle=col; [[5,6],[9,5],[7,9],[11,10],[4,11]].forEach(([a,b])=>c.fillRect(x+a,y+b,2,2)); break;
    case 'wheat': [4,8,11].forEach(sx=>{ c.fillStyle=col; c.fillRect(x+sx,y+3,1,10); c.fillStyle=dk; for(let k=0;k<4;k++) c.fillRect(x+sx-1,y+4+k*2,3,1);}); break;
    case 'bread': c.fillStyle=col; c.fillRect(x+3,y+6,10,6); _disc(c,x+3,y+9,3,col); _disc(c,x+13,y+9,3,col); c.fillStyle=lt; c.fillRect(x+4,y+6,8,1); c.fillStyle=dk; [[5,8],[8,9],[10,8]].forEach(([a,b])=>c.fillRect(x+a,y+b,1,1)); break;
    case 'sheet': c.fillStyle=col; c.fillRect(x+3,y+4,10,8); c.fillStyle=dk; c.strokeStyle=dk; c.fillRect(x+3,y+4,10,1); c.fillRect(x+3,y+11,10,1); c.fillStyle=lt; c.fillRect(x+4,y+5,8,1); break;
    case 'string': c.fillStyle=col; for(let i=0;i<12;i++) c.fillRect(x+7+Math.round(Math.sin(i/2)*2),y+2+i,2,1); break;
    case 'shard': c.fillStyle=col; for(let i=0;i<8;i++) c.fillRect(x+5,y+12-i,i+1,1); c.fillStyle=lt; c.fillRect(x+5,y+11,1,1); break;
    case 'bow': c.strokeStyle=col; c.lineWidth=1.6; c.beginPath(); c.arc(x+5,y+8,6,-1.3,1.3); c.stroke(); c.strokeStyle='#eeeeee'; c.lineWidth=1; c.beginPath(); c.moveTo(x+7,y+2); c.lineTo(x+7,y+14); c.stroke(); break;
    case 'arrow': for(let i=0;i<11;i++){ c.fillStyle='#8a6a3a'; c.fillRect(x+2+i,y+13-i,1,1);} c.fillStyle=col; c.fillRect(x+11,y+2,3,3); c.fillStyle='#dddddd'; c.fillRect(x+2,y+12,3,1); c.fillRect(x+2,y+11,1,3); break;
    case 'bone': _disc(c,x+4,y+11,2,col); _disc(c,x+5,y+10,2,col); _disc(c,x+12,y+5,2,col); _disc(c,x+11,y+6,2,col); c.fillStyle=col; for(let i=0;i<7;i++) c.fillRect(x+5+i,y+10-i,2,2); break;
    case 'feather': c.strokeStyle='#cfcfcf'; c.lineWidth=1; c.beginPath(); c.moveTo(x+9,y+2); c.lineTo(x+6,y+14); c.stroke(); c.fillStyle=col; for(let i=0;i<9;i++){ const w=Math.max(1,4-Math.abs(4-i)); c.fillRect(x+8-w-Math.floor(i*0.2),y+3+i,w,1);} break;
    case 'bucket': case 'bucketF': {
      if (shape==='bucketF'){ c.fillStyle=col; c.fillRect(x+4,y+5,8,3); }
      c.fillStyle='#c2c6cc'; for(let i=0;i<9;i++){ const w=10-Math.floor(i*0.35); c.fillRect(x+8-Math.floor(w/2),y+5+i,w,1);}
      c.fillStyle='#8f939a'; c.fillRect(x+3,y+5,10,1); c.strokeStyle='#9aa0a8'; c.lineWidth=1; c.beginPath(); c.arc(x+8,y+5,4,-Math.PI,0); c.stroke();
      break; }
    case 'meat': _disc(c,x+8,y+9,5,col); c.fillStyle=_lighten(col,40); _disc(c,x+6,y+7,2,_lighten(col,40)); c.fillStyle='#efe9da'; c.fillRect(x+11,y+12,3,2); break;
    case 'minecart': case 'minecartChest': case 'minecartFurnace': case 'minecartTnt': {
      // zawartość wariantu (nad misą)
      if (shape==='minecartChest'){ c.fillStyle='#9a6a30'; c.fillRect(x+5,y+2,6,5); c.fillStyle='#5a3410'; c.fillRect(x+5,y+4,6,1); c.fillStyle='#d8d8d8'; c.fillRect(x+7,y+4,2,2); }
      else if (shape==='minecartFurnace'){ c.fillStyle='#555'; c.fillRect(x+5,y+2,6,5); c.fillStyle='#2a2a2a'; c.fillRect(x+6,y+4,4,2); c.fillStyle='#ffb347'; c.fillRect(x+7,y+5,2,1); }
      else if (shape==='minecartTnt'){ c.fillStyle='#c03028'; c.fillRect(x+5,y+2,6,5); c.fillStyle='#f0f0f0'; c.fillRect(x+5,y+4,6,1); }
      // misa wagonika (metaliczny trapez)
      c.fillStyle=col; c.fillRect(x+2,y+7,12,4);
      c.fillStyle=_lighten(col,45); c.fillRect(x+2,y+7,12,1);
      c.fillStyle=_darken(col,55); c.fillRect(x+2,y+10,12,1);
      c.fillStyle=col; c.fillRect(x+2,y+6,2,5); c.fillRect(x+12,y+6,2,5);
      // koła
      _disc(c,x+5,y+13,2,'#2a2a2a'); _disc(c,x+11,y+13,2,'#2a2a2a');
      _disc(c,x+5,y+13,1,'#555'); _disc(c,x+11,y+13,1,'#555');
      break;
    }
    case 'brick': c.fillStyle=col; c.fillRect(x+3,y+5,10,6); c.fillStyle=lt; c.fillRect(x+3,y+5,10,1); c.fillStyle=dk; c.fillRect(x+3,y+10,10,1); c.fillRect(x+7,y+5,1,6); break;
    case 'paper': c.fillStyle='#f4f4ee'; c.fillRect(x+4,y+2,8,12); c.fillStyle='#d8d8cc'; c.fillRect(x+4,y+2,8,1); c.fillRect(x+11,y+2,1,12); c.fillStyle='#b8b8ac'; for(let k=0;k<4;k++) c.fillRect(x+5,y+4+k*2,6,1); break;
    case 'book': c.fillStyle=col; c.fillRect(x+3,y+2,10,12); c.fillStyle=dk; c.fillRect(x+3,y+2,2,12); c.fillStyle='#f0ead8'; c.fillRect(x+5,y+3,7,10); c.fillStyle=lt; c.fillRect(x+11,y+2,2,12); c.fillStyle='#c8a030'; c.fillRect(x+7,y+6,3,1); break;
    case 'pile': c.fillStyle=col; for(let i=0;i<6;i++) c.fillRect(x+4+i,y+11-Math.floor(Math.min(i,5-i)*1.5),1,3+Math.floor(Math.min(i,5-i)*1.5)); c.fillStyle=lt; c.fillRect(x+6,y+8,3,1); c.fillStyle=dk; c.fillRect(x+4,y+13,8,1); break;
    case 'apple': _disc(c,x+8,y+9,5,col); c.fillStyle=lt; _disc(c,x+6,y+7,2,lt); c.fillStyle='#5a3410'; c.fillRect(x+8,y+3,1,3); c.fillStyle='#2e8b2e'; c.fillRect(x+9,y+3,3,2); break;
    case 'carrot': c.fillStyle=col; for(let i=0;i<10;i++){ const w=Math.max(1,5-Math.floor(i*0.5)); c.fillRect(x+8-Math.floor(w/2),y+13-i,w,1);} c.fillStyle=_darken(col,40); c.fillRect(x+6,y+9,4,1); c.fillStyle='#2e8b2e'; c.fillRect(x+7,y+2,1,3); c.fillRect(x+9,y+2,1,3); c.fillRect(x+8,y+1,1,3); break;
    case 'tuber': _disc(c,x+8,y+9,5,col); c.fillStyle=lt; _disc(c,x+6,y+7,2,lt); c.fillStyle=dk; [[6,10],[10,7],[9,11]].forEach(([a,b])=>c.fillRect(x+a,y+b,1,1)); break;
    case 'cookie': _disc(c,x+8,y+8,6,col); c.fillStyle=lt; _disc(c,x+6,y+6,2,lt); c.fillStyle='#4a2810'; [[5,6],[9,5],[7,9],[10,10],[5,10]].forEach(([a,b])=>c.fillRect(x+a,y+b,2,2)); break;
    case 'melonSlice': c.fillStyle='#2e8b28'; for(let i=0;i<=12;i++){ const half=Math.floor((6-Math.abs(6-i))*0.9); c.fillRect(x+2,y+2+i,1,1); c.fillRect(x+2+half+3,y+2+i,1,1);} c.fillStyle='#e04840'; for(let i=1;i<12;i++){ const half=Math.floor((6-Math.abs(6-i))*0.9); c.fillRect(x+3,y+2+i,half+2,1);} c.fillStyle='#f4e8b0'; c.fillRect(x+3,y+2,2,13); c.fillStyle='#3a1010'; [[5,5],[7,8],[6,11]].forEach(([a,b])=>c.fillRect(x+a,y+b,1,1)); break;
    case 'drumstick': _disc(c,x+6,y+6,4,col); c.fillStyle=lt; _disc(c,x+5,y+5,1,lt); c.fillStyle=col; for(let i=0;i<6;i++) c.fillRect(x+7+i,y+7+i,2,2); c.fillStyle='#efe9da'; c.fillRect(x+12,y+12,3,3); break;
    case 'shears': c.strokeStyle=col; c.lineWidth=2; c.beginPath(); c.moveTo(x+4,y+3); c.lineTo(x+12,y+11); c.moveTo(x+12,y+3); c.lineTo(x+4,y+11); c.stroke(); c.fillStyle='#c8a030'; c.fillRect(x+7,y+6,2,2); c.strokeStyle='#8a8f96'; c.lineWidth=1; c.beginPath(); c.arc(x+4,y+12,2,0,Math.PI*2); c.arc(x+12,y+12,2,0,Math.PI*2); c.stroke(); break;
    case 'flintsteel': c.fillStyle='#7a7a80'; c.fillRect(x+3,y+4,3,8); c.fillStyle='#a0a0a8'; c.fillRect(x+3,y+4,3,1); c.fillStyle=col; c.fillRect(x+8,y+6,6,4); c.fillStyle=_darken(col,40); c.fillRect(x+8,y+9,6,1); c.fillStyle='#ffcc44'; c.fillRect(x+6,y+3,1,1); c.fillRect(x+7,y+2,1,1); break;
    case 'rod': for(let i=0;i<9;i++){ c.fillStyle=(i%3===0)?dk:col; c.fillRect(x+2+i,y+13-i,2,2);} c.strokeStyle='#eeeeee'; c.lineWidth=1; c.beginPath(); c.moveTo(x+11,y+3); c.lineTo(x+13,y+9); c.lineTo(x+7,y+13); c.stroke(); c.fillStyle='#5aa0e0'; c.fillRect(x+6,y+12,2,2); break;
    case 'compass': _disc(c,x+8,y+8,6,'#c8ccd2'); _disc(c,x+8,y+8,5,'#2a2f38'); c.fillStyle='#e02818'; c.fillRect(x+8,y+4,1,4); c.fillStyle='#f0f0f0'; c.fillRect(x+8,y+8,1,4); c.fillStyle='#ffffff'; c.fillRect(x+8,y+8,1,1); break;
    case 'clock': _disc(c,x+8,y+8,6,col); _disc(c,x+8,y+8,5,'#f4efe0'); c.fillStyle=dk; c.fillRect(x+8,y+4,1,5); c.fillRect(x+8,y+8,4,1); c.fillStyle='#333'; c.fillRect(x+7,y+7,2,2); break;
    default: c.fillStyle=col; c.fillRect(x+4,y+4,8,8);
  }
}

function _drawBlockIcon(c, x, y, shape, col) {
  const stone='#8a8a8a', dk=_darken(col,40), lt=_lighten(col,60);
  const fillBase=(base)=>{ c.fillStyle=base; c.fillRect(x,y,16,16); };
  switch (shape) {
    case 'ore': fillBase(stone); c.fillStyle='#767676'; [[2,3],[11,2],[5,12],[12,11]].forEach(([a,b])=>c.fillRect(x+a,y+b,3,2)); c.fillStyle=col; [[4,5],[9,7],[6,10],[11,5],[8,11]].forEach(([a,b])=>c.fillRect(x+a,y+b,2,2)); c.fillStyle=lt; c.fillRect(x+4,y+5,1,1); c.fillRect(x+9,y+7,1,1); break;
    case 'cobble': fillBase(stone); [['#767676',[2,2,5,4]],['#9c9c9c',[8,2,6,5]],['#6e6e6e',[2,8,6,5]],['#a0a0a0',[9,9,5,4]]].forEach(([cc,[a,b,w,h]])=>{ c.fillStyle=cc; c.fillRect(x+a,y+b,w,h);}); c.fillStyle='#5a5a5a'; c.fillRect(x,y+7,16,1); c.fillRect(x+7,y,1,16); break;
    case 'solid': fillBase(col); c.fillStyle=lt; [[3,4],[10,6],[6,11]].forEach(([a,b])=>c.fillRect(x+a,y+b,2,1)); c.fillStyle=dk; c.fillRect(x,y+14,16,2); break;
    case 'torch': { c.fillStyle='#7a4a1a'; c.fillRect(x+7,y+7,2,7); c.fillStyle='#5a3410'; c.fillRect(x+7,y+7,1,7); _disc(c,x+8,y+5,2,'#ffd24a'); _disc(c,x+8,y+4,1,'#ff8a1a'); break; }
    case 'furnace': fillBase('#6f6f6f'); c.fillStyle='#8a8a8a'; c.fillRect(x,y,16,2); c.fillStyle='#2a2a2a'; c.fillRect(x+4,y+7,8,6); c.fillStyle='#ffb347'; c.fillRect(x+6,y+10,1,1); c.fillRect(x+9,y+10,1,1); break;
    case 'table': fillBase('#a06a30'); c.fillStyle='#7a4a1a'; c.fillRect(x,y+8,16,1); c.fillRect(x+8,y,1,16); c.fillStyle='#c08850'; c.fillRect(x,y,16,1); c.fillStyle='#5a3410'; c.fillRect(x+2,y+2,4,4); c.fillRect(x+10,y+10,4,4); break;
    case 'chest': fillBase('#8a5a28'); c.fillStyle='#6a4418'; c.fillRect(x,y+6,16,1); c.fillStyle='#5a3410'; c.fillRect(x,y,16,1); c.fillRect(x,y+15,16,1); c.fillStyle='#d8d8d8'; c.fillRect(x+7,y+6,2,4); break;
    case 'bed': c.fillStyle=col; c.fillRect(x+1,y+3,14,6); c.fillStyle='#eeeeee'; c.fillRect(x+2,y+3,4,3); c.fillStyle='#7a4a1a'; c.fillRect(x+1,y+9,14,4); c.fillStyle='#5a3410'; c.fillRect(x+1,y+12,14,1); break;
    case 'rail': case 'railPowered': case 'railDetector': case 'railActivator': {
      // tło przezroczyste (już wyczyszczone) — widok z góry: poprzeczki + 2 szyny
      c.fillStyle='#7a5028'; for(let i=2;i<16;i+=4) c.fillRect(x+2,y+i,12,2);
      c.fillStyle='#c2c2cc'; c.fillRect(x+4,y,2,16); c.fillRect(x+10,y,2,16);
      const acc = shape==='railPowered'?'#e89628':shape==='railActivator'?'#c83828':shape==='railDetector'?'#d0d0d8':null;
      if (acc){ c.fillStyle=acc; c.fillRect(x+7,y,2,16); }
      break;
    }
    default: fillBase(col);
  }
}

function _drawTool(c, x, y, kind, head) {
  const wood='#7a4a1a', dk=_darken(head,50), lt=_lighten(head,40);
  const handle=()=>{ for(let i=0;i<9;i++){ c.fillStyle=(i%3===0)?'#5a3410':wood; c.fillRect(x+4+i,y+11-i,2,2);} };
  if (kind==='sword') {
    for(let i=0;i<9;i++){ c.fillStyle=(i<2)?lt:head; c.fillRect(x+4+i,y+11-i,2,2);}   // ostrze
    c.fillStyle='#c8a030'; c.fillRect(x+3,y+10,5,2); c.fillRect(x+5,y+8,2,5);          // jelec
    c.fillStyle=wood; c.fillRect(x+2,y+12,3,3);                                          // rękojeść
    return;
  }
  handle();
  c.fillStyle=head;
  if (kind==='pickaxe'){ c.fillRect(x+7,y+3,8,2); c.fillRect(x+7,y+3,2,2); c.fillRect(x+13,y+3,2,2); c.fillStyle=dk; c.fillRect(x+7,y+5,8,1); }
  else if (kind==='axe'){ c.fillRect(x+10,y+2,4,6); c.fillStyle=dk; c.fillRect(x+13,y+2,1,6); c.fillStyle=lt; c.fillRect(x+10,y+2,1,6); }
  else if (kind==='shovel'){ c.fillRect(x+10,y+2,4,4); c.fillStyle=dk; c.fillRect(x+10,y+5,4,1); }
  else if (kind==='hoe'){ c.fillRect(x+9,y+3,6,2); c.fillRect(x+13,y+3,2,4); c.fillStyle=dk; c.fillRect(x+9,y+4,6,1); }
}

function _drawArmor(c, x, y, part, col) {
  const dk=_darken(col,50), lt=_lighten(col,40);
  c.fillStyle=col;
  if (part==='helmet'){ c.fillRect(x+4,y+3,8,5); c.fillRect(x+3,y+8,10,2); c.fillStyle=dk; c.fillRect(x+3,y+8,10,1); c.fillStyle='#3a3a3a'; c.fillRect(x+5,y+5,6,2); }
  else if (part==='chestplate'){ c.fillRect(x+2,y+3,12,3); c.fillRect(x+4,y+6,8,7); c.fillStyle=lt; c.fillRect(x+4,y+6,8,1); c.fillStyle=dk; c.fillRect(x+4,y+12,8,1); }
  else if (part==='leggings'){ c.fillRect(x+4,y+2,8,4); c.fillRect(x+4,y+6,3,8); c.fillRect(x+9,y+6,3,8); c.fillStyle=dk; c.fillRect(x+7,y+6,2,6); }
  else if (part==='boots'){ c.fillRect(x+3,y+8,4,5); c.fillRect(x+9,y+8,4,5); c.fillRect(x+2,y+11,6,2); c.fillRect(x+8,y+11,6,2); c.fillStyle=dk; c.fillRect(x+2,y+12,12,1); }
}

// Seeded PRNG for deterministic texture noise
function mkRng(seed) {
  let s = seed >>> 0;
  return () => { s ^= s<<13; s ^= s>>17; s ^= s<<5; return (s>>>0)/0x100000000; };
}

export function buildTextureAtlas() {
  const W = TILE * COLS, H = TILE * TOTAL_ROWS;   // 256 × 256
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const c = cv.getContext('2d');

  // Background: magenta = clearly missing texture
  c.fillStyle = '#ff00ff';
  c.fillRect(0, 0, W, H);

  const tx = id => (id % COLS) * TILE;
  const ty = id => Math.floor(id / COLS) * TILE;

  // Helper: fill solid color
  const fill = (id, color) => {
    c.fillStyle = color;
    c.fillRect(tx(id), ty(id), TILE, TILE);
  };

  // Helper: draw noise over existing fill
  const noise = (id, colors, density, rng) => {
    const x = tx(id), y = ty(id);
    for (let py = 0; py < TILE; py++)
      for (let px = 0; px < TILE; px++)
        if (rng() < density) {
          c.fillStyle = colors[Math.floor(rng() * colors.length)];
          c.fillRect(x+px, y+py, 1, 1);
        }
  };

  // Helper: draw single pixel
  const px = (id, lx, ly, color) => {
    c.fillStyle = color;
    c.fillRect(tx(id)+lx, ty(id)+ly, 1, 1);
  };

  // ── 0: Grass Top ─────────────────────────────────────────────────────────
  { const r = mkRng(1);
    fill(0, '#2ecc11');
    noise(0, ['#27ae0e','#39d41a','#1fa808','#44e020','#23b80e'], 0.4, r);
  }

  // ── 1: Grass Side ────────────────────────────────────────────────────────
  { const r = mkRng(2);
    const x = tx(1), y = ty(1);
    // dirt body
    c.fillStyle = '#9a6840'; c.fillRect(x, y, TILE, TILE);
    noise(1, ['#7a5228','#b47840','#6a3c18'], 0.3, r);
    // green cap: top 4 rows
    c.fillStyle = '#2ecc11'; c.fillRect(x, y, TILE, 4);
    for (let row = 0; row < 4; row++)
      for (let col = 0; col < TILE; col++)
        if (r() < 0.35) { c.fillStyle = ['#27ae0e','#39d41a','#1fa808'][Math.floor(r()*3)]; c.fillRect(x+col,y+row,1,1); }
    // dirt noise for y>=4
    for (let row = 4; row < TILE; row++)
      for (let col = 0; col < TILE; col++)
        if (r() < 0.3) { c.fillStyle = ['#7a5228','#b47840','#6a3c18'][Math.floor(r()*3)]; c.fillRect(x+col,y+row,1,1); }
  }

  // ── 2: Dirt ───────────────────────────────────────────────────────────────
  { const r = mkRng(3);
    fill(2, '#9a6840');
    noise(2, ['#7a5228','#b47840','#6a3c18','#c08850'], 0.35, r);
  }

  // ── 3: Stone ──────────────────────────────────────────────────────────────
  { const r = mkRng(4);
    fill(3, '#8c8c8c');
    noise(3, ['#707070','#a8a8a8','#b8b8b8','#585858'], 0.35, r);
    // cracks
    const x=tx(3),y=ty(3);
    c.fillStyle='#505050';
    for(let i=0;i<4;i++){
      const lx=Math.floor(r()*12), ly=Math.floor(r()*12);
      c.fillRect(x+lx,y+ly,Math.floor(r()*4)+1,1);
    }
  }

  // ── 4: Sand ───────────────────────────────────────────────────────────────
  { const r = mkRng(5);
    fill(4, '#d4b46a');
    noise(4, ['#c8a050','#e0c880','#c0a040','#ead890'], 0.28, r);
  }

  // ── 5: Wood Top (rings) ───────────────────────────────────────────────────
  { const x=tx(5),y=ty(5);
    c.fillStyle='#7a4a18'; c.fillRect(x,y,TILE,TILE);
    const rings=[{r:1,c:'#5a3008'},{r:3,c:'#9a6020'},{r:5,c:'#5a3008'},{r:7,c:'#aa7030'}];
    rings.forEach(({r:rad,c:col})=>{
      c.strokeStyle=col; c.lineWidth=1.5;
      c.beginPath(); c.arc(x+8,y+8,rad,0,Math.PI*2); c.stroke();
    });
    c.fillStyle='#3a1c04'; c.fillRect(x+7,y+7,2,2);
  }

  // ── 6: Wood Side (bark) ───────────────────────────────────────────────────
  { const r=mkRng(6); const x=tx(6),y=ty(6);
    const stripes=['#6b3a10','#7d4a18','#8a5520','#723f12','#5e3408'];
    for(let col=0;col<TILE;col++){
      c.fillStyle=stripes[col%stripes.length];
      c.fillRect(x+col,y,1,TILE);
    }
    noise(6,['#4a2808','#5a3810'],0.12,r);
  }

  // ── 7: Leaves ─────────────────────────────────────────────────────────────
  { const r=mkRng(7);
    fill(7,'#1db010');
    noise(7,['#16980a','#24cc14','#12900c','#2edd18','#0e7808'],0.5,r);
    // punch holes (transparent gaps) using clearRect
    const x=tx(7),y=ty(7);
    for(let i=0;i<22;i++){
      const lx=Math.floor(r()*15),ly=Math.floor(r()*15);
      c.clearRect(x+lx,y+ly,r()<0.5?2:1,r()<0.5?2:1);
    }
  }

  // ── 8: Glass ──────────────────────────────────────────────────────────────
  { const x=tx(8),y=ty(8);
    c.clearRect(x,y,TILE,TILE);   // usuń nieprzezroczyste tło, inaczej alfa wychodzi 1.0
    // Mostly transparent with visible border
    c.fillStyle='rgba(180,230,255,0.15)'; c.fillRect(x,y,TILE,TILE);
    // border
    c.fillStyle='#90c8e0';
    c.fillRect(x,y,TILE,1); c.fillRect(x,y+TILE-1,TILE,1);
    c.fillRect(x,y,1,TILE); c.fillRect(x+TILE-1,y,1,TILE);
    // inner border lighter
    c.fillStyle='rgba(200,240,255,0.5)';
    c.fillRect(x+1,y+1,TILE-2,1); c.fillRect(x+1,y+1,1,TILE-2);
    // glint
    c.fillStyle='rgba(255,255,255,0.9)';
    for(let i=2;i<5;i++) c.fillRect(x+i,y+i,1,1);
  }

  // ── 9: Brick ──────────────────────────────────────────────────────────────
  { const x=tx(9),y=ty(9);
    // mortar
    c.fillStyle='#c0a090'; c.fillRect(x,y,TILE,TILE);
    // bricks  (2 rows of 2 bricks, offset)
    const drawBrick=(bx,by,bw,bh)=>{
      c.fillStyle='#b83020'; c.fillRect(bx,by,bw,bh);
      c.fillStyle='#c83828'; c.fillRect(bx+1,by+1,bw-2,bh-2);
    };
    // row 1 (y=1..5): two bricks
    drawBrick(x+1,y+1,7,4); drawBrick(x+9,y+1,7,4);
    // row 2 (y=6..10): offset by 4
    drawBrick(x-3+1,y+6,7,4); drawBrick(x+5,y+6,7,4); drawBrick(x+13,y+6,4,4);
    // row 3
    drawBrick(x+1,y+11,7,4); drawBrick(x+9,y+11,7,4);
  }

  // ── 10: Snow Top ──────────────────────────────────────────────────────────
  { const r=mkRng(10);
    fill(10,'#e8f0ff');
    noise(10,['#f8ffff','#d0e0f0','#ffffff','#c8d8ee'],0.2,r);
  }

  // ── 11: Snow Side ─────────────────────────────────────────────────────────
  { const r=mkRng(11); const x=tx(11),y=ty(11);
    c.fillStyle='#9a6840'; c.fillRect(x,y,TILE,TILE);
    for(let row=4;row<TILE;row++)
      for(let col=0;col<TILE;col++)
        if(r()<0.3){ c.fillStyle=['#7a5228','#b47840'][Math.floor(r()*2)]; c.fillRect(x+col,y+row,1,1); }
    // snow cap top 4
    c.fillStyle='#e8f0ff'; c.fillRect(x,y,TILE,5);
    for(let col=0;col<TILE;col++) if(r()<0.25){ c.fillStyle='#ffffff'; c.fillRect(x+col,y,1,3); }
  }

  // ── 12: Water ─────────────────────────────────────────────────────────────
  { const r=mkRng(12); const x=tx(12),y=ty(12);
    c.fillStyle='#1a6aaa'; c.fillRect(x,y,TILE,TILE);
    // ripples
    c.fillStyle='rgba(60,140,210,0.6)'; c.fillRect(x+1,y+3,13,2); c.fillRect(x+3,y+9,9,2);
    c.fillStyle='rgba(255,255,255,0.3)'; c.fillRect(x+2,y+2,5,1); c.fillRect(x+10,y+8,4,1);
    noise(12,['rgba(20,80,160,0.3)','rgba(40,100,180,0.3)'],0.15,r);
  }

  // ── 13: Bedrock ───────────────────────────────────────────────────────────
  { const r=mkRng(13);
    fill(13,'#1e1e1e');
    noise(13,['#111','#2a2a2a','#383838','#0a0a0a'],0.5,r);
  }

  // ── 14: Gravel ────────────────────────────────────────────────────────────
  { const r=mkRng(14);
    fill(14,'#7a7875');
    noise(14,['#5a5855','#9a9895','#6a6865','#aaaa8'],0.5,r);
    const x=tx(14),y=ty(14);
    for(let i=0;i<6;i++){
      const gx=x+1+Math.floor(r()*13),gy=y+1+Math.floor(r()*13);
      c.fillStyle='#9a9890'; c.fillRect(gx,gy,3,2);
      c.fillStyle='#5a5855'; c.fillRect(gx+1,gy+1,2,1);
    }
  }

  // ── 15: Planks ────────────────────────────────────────────────────────────
  { const r=mkRng(15); const x=tx(15),y=ty(15);
    c.fillStyle='#c09040'; c.fillRect(x,y,TILE,TILE);
    const grains=['#b08030','#c89040','#d8a850','#a07028'];
    for(let col=0;col<TILE;col++){
      c.fillStyle=grains[col%grains.length]; c.fillRect(x+col,y,1,TILE);
    }
    // plank gaps
    c.fillStyle='#7a5010';
    c.fillRect(x,y+7,TILE,1); // horizontal gap
    c.fillRect(x+8,y,1,7);   // vertical gap upper
    c.fillRect(x+4,y+8,1,TILE-8); // vertical gap lower (offset)
    noise(15,['rgba(0,0,0,0.08)'],0.12,r);
  }

  // ── Ikony przedmiotów/bloków (kafelki 16+) — tło każdego kafelka najpierw
  //    czyszczone do przezroczystości (inaczej zostałaby magenta z tła atlasu).
  const clr = (t) => c.clearRect(tx(t), ty(t), TILE, TILE);
  for (const [key, shape, color] of ICON_SIMPLE) { const t=ICON_TILE[key]; clr(t); _drawSimpleIcon(c, tx(t), ty(t), shape, color); }
  for (const [key, shape, color] of ICON_BLOCKS) { const t=ICON_TILE[key]; clr(t); _drawBlockIcon(c, tx(t), ty(t), shape, color); }
  for (const tier in ICON_TOOL_TIERS) for (const kind of ICON_TOOL_KINDS) { const t=ICON_TILE[`${tier}_${kind}`]; clr(t); _drawTool(c, tx(t), ty(t), kind, ICON_TOOL_TIERS[tier]); }
  for (const tier in ICON_ARMOR_TIERS) for (const part of ICON_ARMOR_PARTS) { const t=ICON_TILE[`${tier}_${part}`]; clr(t); _drawArmor(c, tx(t), ty(t), part, ICON_ARMOR_TIERS[tier]); }

  // ── Tekstury torów — płaskie szyny na przezroczystym tle (jawne per orientacja) ─
  {
    const rail='#c2c2cc', railDk='#7a7a84', tie='#7a5028', tieDk='#5a3a18';
    // Prosty tor. horizontal=false → szyny pionowe (oś Z, 'ns'); true → poziome ('ew').
    const drawStraight = (t, horizontal, accent) => {
      const x=tx(t), y=ty(t); c.clearRect(x,y,TILE,TILE);
      if (!horizontal) {
        for (let i=1;i<TILE;i+=4){ c.fillStyle=tie; c.fillRect(x+1,y+i,TILE-2,2); c.fillStyle=tieDk; c.fillRect(x+1,y+i+1,TILE-2,1); }
        for (const rx of [4,10]){ c.fillStyle=railDk; c.fillRect(x+rx,y,2,TILE); c.fillStyle=rail; c.fillRect(x+rx,y,1,TILE); }
        if (accent){ c.fillStyle=accent; c.fillRect(x+7,y,2,TILE); }
      } else {
        for (let i=1;i<TILE;i+=4){ c.fillStyle=tie; c.fillRect(x+i,y+1,2,TILE-2); c.fillStyle=tieDk; c.fillRect(x+i+1,y+1,1,TILE-2); }
        for (const ry of [4,10]){ c.fillStyle=railDk; c.fillRect(x,y+ry,TILE,2); c.fillStyle=rail; c.fillRect(x,y+ry,TILE,1); }
        if (accent){ c.fillStyle=accent; c.fillRect(x,y+7,TILE,2); }
      }
    };
    // Łuk łączący dwie sąsiednie krawędzie kafelka. corner: 'ne'|'es'|'sw'|'wn'.
    // Środek łuku = róg między łączonymi krawędziami; N=góra(v0), S=dół, W=lewo(u0), E=prawo.
    const CORNER = { ne:[TILE,0], es:[TILE,TILE], sw:[0,TILE], wn:[0,0] };
    const drawCurve = (t, corner) => {
      const x=tx(t), y=ty(t); c.clearRect(x,y,TILE,TILE);
      const [cxr,cyr] = CORNER[corner];
      const cx0=x+cxr, cy0=y+cyr;
      // ćwiartka łuku leżąca WEWNĄTRZ kafelka (łączy dwie krawędzie danego narożnika)
      const a0 = corner==='ne'?0.5*Math.PI : corner==='es'?Math.PI : corner==='sw'?1.5*Math.PI : 0;
      const a1 = a0 + 0.5*Math.PI;
      c.strokeStyle=tie;  c.lineWidth=2; for (const r of [4,8,12]){ c.beginPath(); c.arc(cx0,cy0,r,a0,a1); c.stroke(); }
      c.strokeStyle=rail; c.lineWidth=2; for (const r of [5,11]){ c.beginPath(); c.arc(cx0,cy0,r,a0,a1); c.stroke(); }
    };
    drawStraight(RAIL_TEX.straight_ns, false, null);
    drawStraight(RAIL_TEX.straight_ew, true,  null);
    drawStraight(RAIL_TEX.powered_ns,  false, 'rgba(232,150,40,0.9)');
    drawStraight(RAIL_TEX.powered_ew,  true,  'rgba(232,150,40,0.9)');
    drawStraight(RAIL_TEX.detector_ns, false, 'rgba(210,210,220,0.9)');
    drawStraight(RAIL_TEX.detector_ew, true,  'rgba(210,210,220,0.9)');
    drawStraight(RAIL_TEX.activator_ns,false, 'rgba(205,55,40,0.9)');
    drawStraight(RAIL_TEX.activator_ew,true,  'rgba(205,55,40,0.9)');
    drawCurve(RAIL_TEX.curve_ne, 'ne');
    drawCurve(RAIL_TEX.curve_es, 'es');
    drawCurve(RAIL_TEX.curve_sw, 'sw');
    drawCurve(RAIL_TEX.curve_wn, 'wn');
  }

  // ── Tekstury nowych bloków (kafelki 156+) ─────────────────────────────────
  {
    const T = BLOCK_TEX;
    // szumowe wypełnienie na całą kostkę
    const solid = (id, base, cols, dens, seed) => { fill(id, base); noise(id, cols, dens, mkRng(seed)); };
    // blok magazynowy: baza + fazowana ramka + błysk (metal/klejnot)
    const block = (id, base, lt, dk, seed) => {
      const r = mkRng(seed); fill(id, base); noise(id, [lt, dk], 0.16, r);
      const x = tx(id), y = ty(id);
      c.fillStyle = lt; c.fillRect(x, y, TILE, 1); c.fillRect(x, y, 1, TILE);
      c.fillStyle = dk; c.fillRect(x, y+TILE-1, TILE, 1); c.fillRect(x+TILE-1, y, 1, TILE);
      c.fillStyle = lt; c.fillRect(x+2, y+2, 3, 1); c.fillRect(x+2, y+2, 1, 3);
    };
    // ruda: kamienna baza + wtrącenia koloru rudy
    const ore = (id, speck, sdk, seed) => {
      const r = mkRng(seed); fill(id, '#8c8c8c'); noise(id, ['#707070','#a8a8a8','#585858'], 0.35, r);
      const x = tx(id), y = ty(id);
      const spots = [[3,3],[10,2],[6,10],[12,9],[8,6],[2,12],[13,4]];
      for (const [a,b] of spots) if (r() < 0.85) {
        c.fillStyle = speck; c.fillRect(x+a, y+b, 2, 2);
        c.fillStyle = sdk;   c.fillRect(x+a+1, y+b+1, 1, 1);
      }
    };
    // wełna: baza + delikatny szum + krzyżyk splotu
    const wool = (id, base, lt, dk, seed) => {
      const r = mkRng(seed); fill(id, base); noise(id, [lt, dk], 0.28, r);
      const x = tx(id), y = ty(id); c.fillStyle = dk;
      for (let i = 3; i < TILE; i += 4) { c.fillRect(x, y+i, TILE, 1); c.fillRect(x+i, y, 1, TILE); }
    };

    // — jednolite/szumowe —
    solid(T.clay,      '#a6adba', ['#9aa0ac','#b4bac6','#8f95a1'], 0.3, 101);
    solid(T.terracotta,'#b06a4a', ['#a05e40','#c07a56','#96543a'], 0.3, 102);
    solid(T.quartz,    '#eae7df', ['#f4f2ec','#dcd8cf','#ffffff'], 0.22, 103);
    // lód — półprzezroczysty, jaśniejsze rysy
    { const x = tx(T.ice), y = ty(T.ice), r = mkRng(104);
      c.clearRect(x, y, TILE, TILE);   // usuń nieprzezroczyste tło, inaczej alfa wychodzi 1.0
      c.fillStyle = 'rgba(150,200,235,0.55)'; c.fillRect(x, y, TILE, TILE);
      for (let i = 0; i < 5; i++) { c.fillStyle = 'rgba(230,245,255,0.7)';
        const lx = Math.floor(r()*13), ly = Math.floor(r()*13); c.fillRect(x+lx, y+ly, Math.floor(r()*5)+2, 1); }
      c.fillStyle = 'rgba(255,255,255,0.8)'; c.fillRect(x+2, y+2, 2, 1); }

    block(T.coal_block,   '#191919', '#333', '#0a0a0a', 105);
    block(T.iron_block,   '#dcdcdc', '#ffffff', '#a8a8a8', 106);
    block(T.gold_block,   '#f2ca3e', '#fff09a', '#c89a1e', 107);
    block(T.diamond_block,'#5ce0e6', '#c8fbff', '#2ea8ae', 108);
    block(T.emerald_block,'#22c060', '#7cf0a4', '#159040', 109);
    block(T.lapis_block,  '#22429e', '#5c7ce0', '#12246a', 110);

    wool(T.wool_white, '#eeeeee', '#ffffff', '#d0d0d0', 111);
    wool(T.wool_red,   '#b63028', '#d24a40', '#8a201a', 112);
    wool(T.wool_blue,  '#31489e', '#4a68c8', '#20305e', 113);
    wool(T.wool_green, '#4a8a34', '#64a848', '#356420', 114);
    wool(T.wool_yellow,'#e0c020', '#f4dc40', '#b09010', 115);
    wool(T.wool_black, '#232326', '#3a3a40', '#101012', 116);

    // — kamienne cegły —
    { const x = tx(T.stone_bricks), y = ty(T.stone_bricks), r = mkRng(117);
      fill(T.stone_bricks, '#7f7f82'); noise(T.stone_bricks, ['#6e6e72','#9a9aa0','#606064'], 0.3, r);
      c.fillStyle = '#54545a'; // spoiny
      c.fillRect(x, y+7, TILE, 1); c.fillRect(x, y+15, TILE, 1);
      c.fillRect(x+7, y, 1, 8); c.fillRect(x+3, y+8, 1, 8); c.fillRect(x+11, y+8, 1, 8);
      c.fillStyle = '#9a9aa0'; c.fillRect(x, y, TILE, 1); }

    // — omszały bruk —
    { const x = tx(T.mossy_cobble), y = ty(T.mossy_cobble), r = mkRng(118);
      fill(T.mossy_cobble, '#808080'); noise(T.mossy_cobble, ['#6a6a6a','#9a9a9a','#5a5a5a'], 0.4, r);
      // kamyki
      for (const [a,b,w,h] of [[1,1,6,5],[9,2,5,4],[2,8,5,6],[9,9,6,5]]) {
        c.fillStyle = '#5a5a5a'; c.fillRect(x+a, y+b, w, h);
        c.fillStyle = '#8c8c8c'; c.fillRect(x+a+1, y+b+1, w-2, h-2); }
      // mech
      for (let i = 0; i < 30; i++) if (r() < 0.5) {
        c.fillStyle = ['#3f6b2a','#4f7d34','#345a22'][Math.floor(r()*3)];
        c.fillRect(x+Math.floor(r()*16), y+Math.floor(r()*16), 1, 1); } }

    ore(T.coal_ore,    '#232323', '#000000', 119);
    ore(T.iron_ore,    '#caa080', '#8a6a4a', 120);
    ore(T.gold_ore,    '#f2cf40', '#b8901e', 121);
    ore(T.diamond_ore, '#5ce0e6', '#2ea8ae', 122);
    ore(T.emerald_ore, '#22c060', '#159040', 123);
    ore(T.lapis_ore,   '#2a52c0', '#16307a', 124);
    ore(T.redstone_ore,'#e02818', '#8a1008', 125);

    // — piaskowiec: góra gładka, bok w warstwach —
    solid(T.sandstone_top, '#e0cf94', ['#d8c688','#e8d8a4','#d0bc78'], 0.2, 126);
    { const x = tx(T.sandstone_side), y = ty(T.sandstone_side), r = mkRng(127);
      fill(T.sandstone_side, '#e0cf94'); noise(T.sandstone_side, ['#d8c688','#cbb672'], 0.18, r);
      c.fillStyle = '#c2ab66'; c.fillRect(x, y+2, TILE, 1); c.fillRect(x, y+13, TILE, 1);
      c.fillStyle = '#f0e2b0'; c.fillRect(x, y+3, TILE, 1); }

    // — regał: półka z grzbietami książek —
    { const x = tx(T.bookshelf_side), y = ty(T.bookshelf_side);
      // ramka z desek
      c.fillStyle = '#8a5a26'; c.fillRect(x, y, TILE, TILE);
      c.fillStyle = '#a06a30'; c.fillRect(x, y, TILE, 2); c.fillRect(x, y+7, TILE, 2); c.fillRect(x, y+14, TILE, 2);
      // książki w dwóch rzędach
      const books = ['#b23a2a','#2a5ab2','#2f8a3a','#c8a028','#8a3aa0','#c86a20','#3aa0a0'];
      const row = (ry) => { let bx = x+1; let i = 0;
        while (bx < x+15) { const w = 2 + (i%2); c.fillStyle = books[(i+ry)%books.length];
          c.fillRect(bx, y+ry, w, 5); c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(bx+w-1, y+ry, 1, 5);
          bx += w+1; i++; } };
      row(2); row(9); }

    // — dynia —
    { const x = tx(T.pumpkin_top), y = ty(T.pumpkin_top), r = mkRng(128);
      fill(T.pumpkin_top, '#c8802a'); noise(T.pumpkin_top, ['#b8721e','#d88c34'], 0.25, r);
      c.fillStyle = '#7a5a1a'; c.fillRect(x+6, y+6, 4, 4); c.fillStyle = '#5a3f10'; c.fillRect(x+7, y+7, 2, 2); }
    { const x = tx(T.pumpkin_side), y = ty(T.pumpkin_side), r = mkRng(129);
      fill(T.pumpkin_side, '#d0842a'); noise(T.pumpkin_side, ['#c07820','#dc9038'], 0.2, r);
      c.fillStyle = '#a8681c'; for (let cx = 2; cx < TILE; cx += 4) c.fillRect(x+cx, y, 1, TILE); }

    // — arbuz —
    { const x = tx(T.melon_top), y = ty(T.melon_top), r = mkRng(130);
      fill(T.melon_top, '#3c7a28'); noise(T.melon_top, ['#356e22','#468c30','#2d5c1c'], 0.4, r); }
    { const x = tx(T.melon_side), y = ty(T.melon_side), r = mkRng(131);
      fill(T.melon_side, '#3c7a28'); noise(T.melon_side, ['#468c30','#2d5c1c'], 0.25, r);
      c.fillStyle = '#7ac04a'; for (let cx = 1; cx < TILE; cx += 3) c.fillRect(x+cx, y, 2, TILE);
      c.fillStyle = '#2d5c1c'; for (let cx = 2; cx < TILE; cx += 3) c.fillRect(x+cx, y, 1, TILE); }

    // — kaktus —
    { const x = tx(T.cactus_top), y = ty(T.cactus_top), r = mkRng(132);
      fill(T.cactus_top, '#4f8a34'); noise(T.cactus_top, ['#5c9c3e','#417328'], 0.3, r);
      c.fillStyle = '#3a6522'; c.fillRect(x+6, y+6, 4, 4); c.fillStyle = '#e8e8c0'; c.fillRect(x+7, y+7, 1, 1); }
    { const x = tx(T.cactus_side), y = ty(T.cactus_side), r = mkRng(133);
      fill(T.cactus_side, '#3f7a2a'); noise(T.cactus_side, ['#356820','#4a8a34'], 0.22, r);
      c.fillStyle = '#2c5a1c'; c.fillRect(x+2, y, 1, TILE); c.fillRect(x+13, y, 1, TILE);
      c.fillStyle = '#5ca03e'; c.fillRect(x+3, y, 1, TILE);
      c.fillStyle = '#e8e8c0'; for (let cy = 2; cy < TILE; cy += 4) { c.fillRect(x+2, y+cy, 1, 1); c.fillRect(x+13, y+cy, 1, 1); } }

    // — bruk (kamyki + spoiny) —
    { const x = tx(T.cobble), y = ty(T.cobble), r = mkRng(134);
      fill(T.cobble, '#8a8a8a'); noise(T.cobble, ['#767676','#9c9c9c','#6a6a6a'], 0.4, r);
      for (const [a,b,w,h] of [[1,1,6,4],[9,1,6,5],[1,7,5,7],[8,8,6,6]]) {
        c.fillStyle = '#5a5a5a'; c.fillRect(x+a, y+b, w, h);
        c.fillStyle = '#9a9a9a'; c.fillRect(x+a+1, y+b+1, w-2, h-2);
        c.fillStyle = '#707070'; c.fillRect(x+a+1, y+b+h-2, w-2, 1); } }

    // — obsydian (ciemny fiolet z połyskiem) —
    { const x = tx(T.obsidian), y = ty(T.obsidian), r = mkRng(135);
      fill(T.obsidian, '#150e22'); noise(T.obsidian, ['#0e0818','#241838','#1a1030'], 0.4, r);
      c.fillStyle = '#5a3a8a'; [[3,4],[11,6],[6,11],[13,12]].forEach(([a,b])=>c.fillRect(x+a,y+b,1,1));
      c.fillStyle = '#7a5ab0'; c.fillRect(x+3, y+3, 1, 1); c.fillRect(x+10, y+5, 1, 1); }

    // — blok redstone —
    { const x = tx(T.redstone_block), y = ty(T.redstone_block), r = mkRng(136);
      fill(T.redstone_block, '#b01414'); noise(T.redstone_block, ['#8a0e0e','#d02020','#c81818'], 0.4, r);
      c.fillStyle = '#e85050'; for (let i=0;i<5;i++) c.fillRect(x+2+Math.floor(r()*12), y+2+Math.floor(r()*12), 2, 1);
      c.fillStyle = '#6a0808'; c.fillRect(x, y+TILE-1, TILE, 1); }

    // — lampa redstone (wygaszona): obudowa w kratkę z 4 wygaszonymi „żarówkami" —
    { const x = tx(T.rs_lamp), y = ty(T.rs_lamp), r = mkRng(137);
      fill(T.rs_lamp, '#7a6038'); noise(T.rs_lamp, ['#6a5028','#8a7048'], 0.25, r);
      c.fillStyle = '#4a3818';   // ciemna ramka + krzyż dzielący na 4 panele
      c.fillRect(x, y, TILE, 1); c.fillRect(x, y+TILE-1, TILE, 1);
      c.fillRect(x, y, 1, TILE); c.fillRect(x+TILE-1, y, 1, TILE);
      c.fillRect(x, y+7, TILE, 2); c.fillRect(x+7, y, 2, TILE);
      for (const [px,py] of [[3,3],[11,3],[3,11],[11,11]]) { _disc(c, x+px, y+py, 2, '#3a2c14'); _disc(c, x+px, y+py, 1, '#584222'); } }

    // — piec —
    { const x = tx(T.furnace_top), y = ty(T.furnace_top), r = mkRng(138);
      fill(T.furnace_top, '#787878'); noise(T.furnace_top, ['#6a6a6a','#8a8a8a','#5e5e5e'], 0.3, r);
      c.fillStyle = '#4a4a4a'; c.fillRect(x+4, y+4, 8, 8); c.fillStyle = '#5a5a5a'; c.fillRect(x+5, y+5, 6, 6); }
    { const x = tx(T.furnace_side), y = ty(T.furnace_side), r = mkRng(139);
      fill(T.furnace_side, '#767676'); noise(T.furnace_side, ['#686868','#888888','#5c5c5c'], 0.3, r);
      c.fillStyle = '#8a8a8a'; c.fillRect(x, y, TILE, 2);
      c.fillStyle = '#2a2a2a'; c.fillRect(x+4, y+6, 8, 7);        // otwór paleniska
      c.fillStyle = '#ff9a30'; c.fillRect(x+5, y+10, 6, 3);       // żar
      c.fillStyle = '#ffd050'; c.fillRect(x+6, y+11, 4, 1);
      c.fillStyle = '#5a5a5a'; c.fillRect(x+4, y+6, 8, 1); }

    // — stół rzemieślniczy —
    { const x = tx(T.table_top), y = ty(T.table_top);
      fill(T.table_top, '#b07838');
      c.fillStyle = '#7a4a1a'; c.fillRect(x, y+8, TILE, 1); c.fillRect(x+8, y, 1, TILE);
      c.fillStyle = '#c89050'; c.fillRect(x, y, TILE, 1); c.fillRect(x, y, 1, TILE);
      c.fillStyle = '#5a3410'; c.fillRect(x+2, y+2, 4, 4); c.fillRect(x+10, y+10, 4, 4);
      c.fillStyle = '#8a5a24'; c.fillRect(x+11, y+2, 3, 4); }
    { const x = tx(T.table_side), y = ty(T.table_side), r = mkRng(140);
      fill(T.table_side, '#9a6a30'); noise(T.table_side, ['#8a5a24','#a67a3c'], 0.2, r);
      c.fillStyle = '#5a3410'; c.fillRect(x+3, y+3, 4, 5); c.fillStyle = '#c8a030'; c.fillRect(x+9, y+4, 4, 1); c.fillRect(x+10, y+4, 1, 6); // narzędzia
      c.fillStyle = '#7a4a1a'; c.fillRect(x, y+9, TILE, 1); }

    // — skrzynia —
    { const x = tx(T.chest_top), y = ty(T.chest_top);
      fill(T.chest_top, '#9a6a30');
      c.fillStyle = '#7a4a1a'; c.fillRect(x, y, TILE, 1); c.fillRect(x, y+TILE-1, TILE, 1); c.fillRect(x, y, 1, TILE); c.fillRect(x+TILE-1, y, 1, TILE);
      c.fillStyle = '#6a4418'; c.fillRect(x, y+6, TILE, 2);
      c.fillStyle = '#d8d8d8'; c.fillRect(x+7, y+6, 2, 2); }
    { const x = tx(T.chest_side), y = ty(T.chest_side);
      fill(T.chest_side, '#9a6a30');
      c.fillStyle = '#7a4a1a'; c.fillRect(x, y, TILE, 2); c.fillRect(x, y+TILE-2, TILE, 2); c.fillRect(x, y, 2, TILE); c.fillRect(x+TILE-2, y, 2, TILE);
      c.fillStyle = '#6a4418'; c.fillRect(x, y+5, TILE, 1);
      c.fillStyle = '#3a2810'; c.fillRect(x+6, y+5, 4, 5);        // zamek
      c.fillStyle = '#d8d8d8'; c.fillRect(x+7, y+6, 2, 3); c.fillStyle = '#f0f0f0'; c.fillRect(x+7, y+6, 2, 1); }

    // — łóżko —
    { const x = tx(T.bed_top), y = ty(T.bed_top), r = mkRng(141);
      fill(T.bed_top, '#c03038'); noise(T.bed_top, ['#a82830','#d03840'], 0.15, r);
      c.fillStyle = '#eeeeee'; c.fillRect(x+2, y+2, 5, 5);       // poduszka
      c.fillStyle = '#ffffff'; c.fillRect(x+2, y+2, 5, 1);
      c.fillStyle = '#a82830'; c.fillRect(x+1, y+8, TILE-2, 1); } // szew kołdry
    { const x = tx(T.bed_side), y = ty(T.bed_side), r = mkRng(142);
      fill(T.bed_side, '#7a4a1a');                                // rama drewniana
      c.fillStyle = '#c03038'; c.fillRect(x, y, TILE, 9);         // materac
      noise(T.bed_side, ['#a82830','#d03840'], 0.12, mkRng(143));
      c.fillStyle = '#eeeeee'; c.fillRect(x, y+1, 4, 4);          // róg poduszki
      c.fillStyle = '#5a3410'; c.fillRect(x, y+TILE-2, TILE, 2); }

    // ── kolorowe szkło: jak zwykłe szkło, ale barwiona tafla + ramka w kolorze ──
    const stainedGlass = (id, tint, border, seed) => {
      const x = tx(id), y = ty(id);
      c.clearRect(x, y, TILE, TILE);   // usuń nieprzezroczyste tło, inaczej alfa wychodzi 1.0
      c.fillStyle = tint; c.fillRect(x, y, TILE, TILE);
      c.fillStyle = border;
      c.fillRect(x, y, TILE, 1); c.fillRect(x, y+TILE-1, TILE, 1);
      c.fillRect(x, y, 1, TILE); c.fillRect(x+TILE-1, y, 1, TILE);
      c.fillStyle = 'rgba(255,255,255,0.45)';
      c.fillRect(x+1, y+1, TILE-2, 1); c.fillRect(x+1, y+1, 1, TILE-2);
      c.fillStyle = 'rgba(255,255,255,0.85)';
      for (let i = 2; i < 5; i++) c.fillRect(x+i, y+i, 1, 1);
      noise(id, ['rgba(255,255,255,0.10)','rgba(0,0,0,0.08)'], 0.1, mkRng(seed));
    };
    stainedGlass(T.glass_white,  'rgba(235,238,242,0.35)', 'rgba(150,155,165,0.9)',  144);
    stainedGlass(T.glass_red,    'rgba(200,60,55,0.45)',   'rgba(120,25,20,0.9)',    145);
    stainedGlass(T.glass_blue,   'rgba(60,90,190,0.45)',   'rgba(20,35,110,0.9)',    146);
    stainedGlass(T.glass_green,  'rgba(70,150,60,0.45)',   'rgba(20,80,20,0.9)',     147);
    stainedGlass(T.glass_yellow, 'rgba(220,195,60,0.45)',  'rgba(140,115,15,0.9)',   148);
    stainedGlass(T.glass_black,  'rgba(50,50,55,0.55)',    'rgba(10,10,12,0.95)',    149);

    // ── dywany: baza tkaniny (jak wełna) + przeszyta ramka po obwodzie ──
    const carpet = (id, base, lt, dk, seed) => {
      const r = mkRng(seed); fill(id, base); noise(id, [lt, dk], 0.18, r);
      const x = tx(id), y = ty(id);
      c.fillStyle = dk;
      c.fillRect(x, y, TILE, 1); c.fillRect(x, y+TILE-1, TILE, 1);
      c.fillRect(x, y, 1, TILE); c.fillRect(x+TILE-1, y, 1, TILE);
      c.fillStyle = lt;
      c.fillRect(x+2, y+2, TILE-4, 1); c.fillRect(x+2, y+TILE-3, TILE-4, 1);
      c.fillRect(x+2, y+2, 1, TILE-4); c.fillRect(x+TILE-3, y+2, 1, TILE-4);
    };
    carpet(T.carpet_white, '#dedede', '#f4f4f4', '#b8b8b8', 150);
    carpet(T.carpet_red,   '#a02820', '#c04438', '#701c16', 151);
    carpet(T.carpet_blue,  '#2c3e8a', '#4258b0', '#1c2860', 152);
    carpet(T.carpet_green, '#3f7a2e', '#569840', '#295418', 153);
    carpet(T.carpet_yellow,'#c8a818', '#e0c430', '#96800e', 154);
    carpet(T.carpet_black, '#1e1e20', '#323234', '#0c0c0e', 155);

    // ── warianty drewna: słoje (góra) + pasy kory (bok), jak bazowe drewno #5/#6 ──
    const logTop = (id, base, rings) => {
      const x = tx(id), y = ty(id);
      c.fillStyle = base; c.fillRect(x, y, TILE, TILE);
      rings.forEach(({ r: rad, c: col }) => {
        c.strokeStyle = col; c.lineWidth = 1.5;
        c.beginPath(); c.arc(x+8, y+8, rad, 0, Math.PI*2); c.stroke();
      });
      c.fillStyle = rings[0].c; c.fillRect(x+7, y+7, 2, 2);
    };
    const logSide = (id, stripes, noiseCols, seed) => {
      const x = tx(id), y = ty(id);
      for (let col = 0; col < TILE; col++) { c.fillStyle = stripes[col % stripes.length]; c.fillRect(x+col, y, 1, TILE); }
      noise(id, noiseCols, 0.12, mkRng(seed));
    };
    const planks = (id, base, grains, gap, seed) => {
      const x = tx(id), y = ty(id);
      c.fillStyle = base; c.fillRect(x, y, TILE, TILE);
      for (let col = 0; col < TILE; col++) { c.fillStyle = grains[col % grains.length]; c.fillRect(x+col, y, 1, TILE); }
      c.fillStyle = gap;
      c.fillRect(x, y+7, TILE, 1);
      c.fillRect(x+8, y, 1, 7);
      c.fillRect(x+4, y+8, 1, TILE-8);
      noise(id, ['rgba(0,0,0,0.08)'], 0.12, mkRng(seed));
    };
    logTop(T.dark_wood_top, '#3a2410', [{r:1,c:'#20140a'},{r:3,c:'#4a3018'},{r:5,c:'#20140a'},{r:7,c:'#54381e'}]);
    logSide(T.dark_wood_side, ['#33200e','#3d2712','#472e16','#392410','#2c1c0c'], ['#1c1206','#26180a'], 156);
    planks(T.dark_planks, '#5a3a1e', ['#4e3018','#603c20','#6c4626','#442a14'], '#2c1a0a', 157);
    logTop(T.pale_wood_top, '#c8b890', [{r:1,c:'#a8946a'},{r:3,c:'#e0d4b0'},{r:5,c:'#a8946a'},{r:7,c:'#eee2c0'}]);
    logSide(T.pale_wood_side, ['#b8a476','#c2b082','#ccba90','#b09e6c','#a49264'], ['#907e50','#9c8a5a'], 158);
    planks(T.pale_planks, '#dccca2', ['#d0be92','#e0d0a8','#eaddb8','#c4b284'], '#a08e5e', 159);

    // ── dekoracje kamienne ──
    // polerowany kamień: gładki, jasny, delikatna pozioma smuga połysku
    { solid(T.polished_stone, '#a4a4a8', ['#9a9a9e','#aeaeb2','#929296'], 0.15, 160);
      const x = tx(T.polished_stone), y = ty(T.polished_stone);
      c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(x, y+3, TILE, 1); c.fillRect(x, y+11, TILE, 1);
    }
    // granit: różowawo-szara skała z ciemnymi i jasnymi drobinami
    { const r = mkRng(161);
      fill(T.granite, '#9a6a5c'); noise(T.granite, ['#875a4e','#ac7c6c','#7a4c40'], 0.35, r);
      const x = tx(T.granite), y = ty(T.granite);
      for (let i = 0; i < 10; i++) { c.fillStyle = r() < 0.5 ? '#3a2420' : '#e0c8a8';
        c.fillRect(x+Math.floor(r()*15), y+Math.floor(r()*15), 1, 1); }
    }
    // marmur: białe tło z cienkimi szarymi żyłkami
    { const r = mkRng(162);
      fill(T.marble, '#e8e6e2'); noise(T.marble, ['#f2f0ec','#dcdad6'], 0.15, r);
      const x = tx(T.marble), y = ty(T.marble);
      c.strokeStyle = '#a8a4a0'; c.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        c.beginPath();
        const sx = x + Math.floor(r()*16), sy = y + Math.floor(r()*16);
        c.moveTo(sx, sy);
        c.lineTo(sx + Math.floor(r()*8-4), sy + Math.floor(r()*8-4));
        c.lineTo(sx + Math.floor(r()*8-4), sy + Math.floor(r()*8-4));
        c.stroke();
      }
    }

    // ── Uzupełnienie brakujących tekstur (bloki renderowane dotąd jako płaski kolor) ──
    // lawa: jak woda (12), ale gorące barwy
    { const r = mkRng(163); const x = tx(T.lava), y = ty(T.lava);
      c.fillStyle = '#c23a10'; c.fillRect(x, y, TILE, TILE);
      c.fillStyle = 'rgba(255,180,40,0.7)'; c.fillRect(x+1, y+3, 13, 2); c.fillRect(x+3, y+9, 9, 2);
      c.fillStyle = 'rgba(255,230,120,0.6)'; c.fillRect(x+2, y+2, 5, 1); c.fillRect(x+10, y+8, 4, 1);
      noise(T.lava, ['rgba(120,20,4,0.4)','rgba(255,120,20,0.3)'], 0.18, r); }

    // pochodnia: kijek + płomień na przezroczystym tle (ta sama grafika co ikona)
    { c.clearRect(tx(T.torch), ty(T.torch), TILE, TILE);
      _drawBlockIcon(c, tx(T.torch), ty(T.torch), 'torch', '#ffcc44'); }

    // grządka: zaorana ziemia w bruzdy (bok/spód korzysta z gotowego kafelka ziemi)
    { const r = mkRng(164); const x = tx(T.farmland_top), y = ty(T.farmland_top);
      fill(T.farmland_top, '#4a3218'); noise(T.farmland_top, ['#3e2812','#5a4020'], 0.25, r);
      c.fillStyle = '#2e1e0e'; for (let row = 1; row < TILE; row += 4) c.fillRect(x, y+row, TILE, 1);
      c.fillStyle = '#664726'; for (let row = 2; row < TILE; row += 4) c.fillRect(x, y+row, TILE, 1); }

    // sadzonka: młode pędy na przezroczystym tle
    { const r = mkRng(165); c.clearRect(tx(T.crop), ty(T.crop), TILE, TILE);
      const x = tx(T.crop), y = ty(T.crop);
      for (let i = 0; i < 6; i++) { const bx = 2 + Math.floor(r()*12);
        c.fillStyle = '#4a9a28'; c.fillRect(x+bx, y+10, 1, 5); c.fillRect(x+bx-1, y+12, 1, 3); } }

    // zboże dojrzałe: złote kłosy na przezroczystym tle
    { const r = mkRng(166); c.clearRect(tx(T.crop_ripe), ty(T.crop_ripe), TILE, TILE);
      const x = tx(T.crop_ripe), y = ty(T.crop_ripe);
      for (let i = 0; i < 8; i++) { const bx = 1 + Math.floor(r()*14);
        c.fillStyle = '#c8a020'; c.fillRect(x+bx, y+4, 1, 11);
        c.fillStyle = '#e8c840'; c.fillRect(x+bx, y+3, 1, 3); } }

    // lampa redstone (zaświecona): ta sama obudowa w kratkę, ale jarzące się „żarówki"
    { const r = mkRng(167); const x = tx(T.rs_lamp_on), y = ty(T.rs_lamp_on);
      fill(T.rs_lamp_on, '#e8c868'); noise(T.rs_lamp_on, ['#f4d888','#dcb850'], 0.2, r);
      c.fillStyle = '#c89838';   // ramka + krzyż, w tonie obudowy (ciemniejszy niż żarówki)
      c.fillRect(x, y, TILE, 1); c.fillRect(x, y+TILE-1, TILE, 1);
      c.fillRect(x, y, 1, TILE); c.fillRect(x+TILE-1, y, 1, TILE);
      c.fillRect(x, y+7, TILE, 2); c.fillRect(x+7, y, 2, TILE);
      for (const [px,py] of [[3,3],[11,3],[3,11],[11,11]]) { _disc(c, x+px, y+py, 2, '#fff4c0'); _disc(c, x+px, y+py, 1, '#ffffff'); } }

    // pył redstone: kamienne tło + krzyżujący się przewód (nieaktywny ciemny / aktywny jarzący)
    const dustWire = (id, wireCol, glow) => {
      const r = mkRng(id); fill(id, '#8c8c8c'); noise(id, ['#787878','#989898'], 0.2, r);
      const x = tx(id), y = ty(id);
      c.fillStyle = wireCol; c.fillRect(x+7, y+1, 2, 14); c.fillRect(x+1, y+7, 14, 2);
      if (glow) { c.fillStyle = glow; c.fillRect(x+7, y+7, 2, 2); }
    };
    dustWire(T.rs_dust,    '#5a0808', null);
    dustWire(T.rs_dust_on, '#ff2010', '#ffb090');

    // pochodnia redstone: jak zwykła, ale płomień czerwony (aktywna) / wygaszony (nieaktywna)
    const rsTorch = (id, flameHi, flameLo) => {
      c.clearRect(tx(id), ty(id), TILE, TILE);
      const x = tx(id), y = ty(id);
      c.fillStyle='#7a4a1a'; c.fillRect(x+7,y+7,2,7); c.fillStyle='#5a3410'; c.fillRect(x+7,y+7,1,7);
      _disc(c,x+8,y+5,2,flameHi); _disc(c,x+8,y+4,1,flameLo);
    };
    rsTorch(T.rs_torch, '#ff4030', '#ff9020');
    rsTorch(T.rs_torch_off, '#6a4030', '#4a2818');

    // dźwignia: podstawa z bruku + ramię po przekątnej
    { const r = mkRng(168); const x = tx(T.lever), y = ty(T.lever);
      fill(T.lever, '#8a8a8a'); noise(T.lever, ['#767676','#9c9c9c'], 0.3, r);
      c.fillStyle = '#5a4020'; c.fillRect(x+5, y+9, 6, 4);
      c.fillStyle = '#7a5a30'; for (let i=0;i<7;i++) c.fillRect(x+4+i, y+9-i, 2, 2);
      c.fillStyle = '#2a2a2a'; c.fillRect(x+7, y+9, 2, 2); }

    // przycisk: mała płytka na tle bruku
    { const r = mkRng(169); const x = tx(T.button), y = ty(T.button);
      fill(T.button, '#8a8a8a'); noise(T.button, ['#767676','#9c9c9c'], 0.3, r);
      c.fillStyle = '#5a4020'; c.fillRect(x+5, y+6, 6, 4); c.fillStyle = '#7a5a30'; c.fillRect(x+5, y+6, 6, 1); }

    // przekaźnik: kamienna płyta + dwie pochodnie
    { const r = mkRng(170); const x = tx(T.repeater), y = ty(T.repeater);
      fill(T.repeater, '#9a9a9e'); noise(T.repeater, ['#868690','#aeaeb2'], 0.25, r);
      c.fillStyle = '#5a5a60'; c.fillRect(x+1, y+1, TILE-2, 1); c.fillRect(x+1, y+TILE-2, TILE-2, 1);
      for (const px of [4, 11]) { c.fillStyle='#7a4a1a'; c.fillRect(x+px, y+4, 1, 8); _disc(c,x+px,y+3,1,'#ff8a1a'); } }

    // tłok: rama + krzyż na twarzy tłoczyska
    { const r = mkRng(171); const x = tx(T.piston), y = ty(T.piston);
      fill(T.piston, '#8a7248'); noise(T.piston, ['#7a6440','#9a8258'], 0.2, r);
      c.fillStyle = '#5a4a2c'; c.fillRect(x, y, TILE, 2); c.fillRect(x, y+TILE-2, TILE, 2);
      c.fillRect(x, y, 2, TILE); c.fillRect(x+TILE-2, y, 2, TILE);
      c.fillStyle = '#c8b888'; c.fillRect(x+7, y+2, 2, TILE-4); c.fillRect(x+2, y+7, TILE-4, 2); }

    // drzwi: deski z ramą i klamką
    { const r = mkRng(172); const x = tx(T.door), y = ty(T.door);
      fill(T.door, '#8a5a28'); noise(T.door, ['#7a4c1e','#9a6a34'], 0.2, r);
      c.fillStyle = '#5a3410';
      c.fillRect(x, y, TILE, 1); c.fillRect(x, y+TILE-1, TILE, 1); c.fillRect(x, y, 1, TILE); c.fillRect(x+TILE-1, y, 1, TILE);
      c.fillRect(x+2, y+2, 12, 5); c.fillRect(x+2, y+9, 12, 5);
      c.fillStyle = '#c8a040'; c.fillRect(x+11, y+8, 2, 2); }
  }

  return cv;
}
