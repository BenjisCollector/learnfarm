// Pixel-art badges (12x12, block-game style) for animals, crops and resources.
// Each sprite gets a dark 1px outline and is drawn once to a data URL; CSS scales it with hard pixels.
const PAL = {
  K: '#1f1f1f', W: '#f4f1ea', w: '#d9d4c8', R: '#d9372e', r: '#a8261f', O: '#f29a2e', Y: '#f6cf3c', y: '#d9a72e',
  G: '#4f9a3e', g: '#2f6e2a', L: '#9be07a', l: '#6cc04f', P: '#f2a7a0', p: '#c97a72', B: '#c9a27a', b: '#8f6b47',
  H: '#e8e1cf', E: '#ffffff', M: '#7a4f2c', m: '#9c6b3f', D: '#4a3020', d: '#6b4a2e', U: '#3b8fd6', u: '#8fd0f5',
  S: '#cdb88f', s: '#a8936a', T: '#7d8a92',
};

const SPR = {
  hen: [
    '....RRR.....',
    '...RRRR.....',
    '..WWWWWWWW..',
    '..WWWWWWWW..',
    '..WKWWWWKW..',
    '..WWWWWWWW..',
    '..WWOOOOWW..',
    '..WWOOOOWW..',
    '..WWWRRWWW..',
    '..WWWRRWWW..',
    '..wWWWWWWw..',
    '............'],
  cow: [
    'H..........H',
    'HH.KKKKKK.HH',
    '..KKWWKKKK..',
    '..KWWWKKWK..',
    '..EKKKKKEK..',
    '..KKKKKKKK..',
    '..KPPPPPPK..',
    '..PPKPPKPP..',
    '..PPPPPPPP..',
    '...pPPPPp...',
    '............',
    '............'],
  goat: [
    '..T......T..',
    '..TT....TT..',
    '...BBBBBB...',
    '..BBBBBBBB..',
    '..BKBBBBKB..',
    '..BBBBBBBB..',
    '...BBppBB...',
    '...BBppBB...',
    '....BbbB....',
    '....WWWW....',
    '.....WW.....',
    '............'],
  tomato: [
    '.....gG.....',
    '...GGGGGG...',
    '..RRGRRGRR..',
    '.RRRRRRRRRR.',
    '.RERRRRRRRR.',
    '.RERRRRRRRR.',
    '.RRRRRRRRRR.',
    '.RRRRRRRRRr.',
    '..RRRRRRrr..',
    '...RRRRRR...',
    '............',
    '............'],
  corn: [
    '.....YY.....',
    '....YYYY....',
    '...YyYYyY...',
    '..GYYyYYYG..',
    '..GYyYYyYG..',
    '..GGYYyYGG..',
    '..GGYyYYGG..',
    '...GGYYGG...',
    '...gGGGGg...',
    '....gGGg....',
    '.....gg.....',
    '............'],
  lettuce: [
    '............',
    '...LLLLLL...',
    '..LLlLLlLL..',
    '.LLLLllLLLL.',
    '.LlLLLLLLlL.',
    '.LLLlLLlLLL.',
    '.LLLLllLLLL.',
    '..LLLLLLLL..',
    '..lLLLLLLl..',
    '...GGGGGG...',
    '............',
    '............'],
  water: [
    '.....U......',
    '.....U......',
    '....UUU.....',
    '....UUU.....',
    '...UUUUU....',
    '..UUuUUUU...',
    '..UuUUUUU...',
    '..UuUUUUU...',
    '..UUUUUUU...',
    '...UUUUU....',
    '............',
    '............'],
  feed: [
    '....ssss....',
    '.....ss.....',
    '...SSSSSS...',
    '..SSSSSSSS..',
    '..SSYYYYSS..',
    '..SSYyyYSS..',
    '..SSYYYYSS..',
    '..SSSSSSSS..',
    '..sSSSSSSs..',
    '...ssssss...',
    '............',
    '............'],
  manure: [
    '............',
    '............',
    '.....MM.....',
    '....MMMM....',
    '...MMmMMM...',
    '..MMMMMMMM..',
    '.MMmMMMMmMM.',
    '.MMMMMMMMMM.',
    '............',
    '............',
    '............',
    '............'],
  compost: [
    '......G.....',
    '.....GG.....',
    '....dDGD....',
    '...DDDDDD...',
    '..DDdDDDdD..',
    '.DDDDDDDDDD.',
    '.DdDDDDDDdD.',
    '.DDDDDDDDDD.',
    '............',
    '............',
    '............',
    '............'],
  eggs: [
    '.....HH.....',
    '....HHHH....',
    '...HHHHHH...',
    '...HEHHHH...',
    '..HHEHHHHH..',
    '..HHHHHHHH..',
    '..HHHHHHwH..',
    '...HHHHww...',
    '....HHHH....',
    '............',
    '............',
    '............'],
  milk: [
    '....UUUU....',
    '.....WW.....',
    '....WWWW....',
    '...WWWWWW...',
    '...WUUUUW...',
    '...WUUUUW...',
    '...WWWWWW...',
    '...WWWWWW...',
    '...wWWWWw...',
    '....wwww....',
    '............',
    '............'],
  house: [
    '.....RR.....',
    '....RRRR....',
    '...RRRRRR...',
    '..RRRRRRRR..',
    '.RRRRRRRRRR.',
    '..WWWWWWWW..',
    '..WUUWWUUW..',
    '..WUUWmmWW..',
    '..WWWWmmWW..',
    '..wwwwmmww..',
    '............',
    '............'],
};

// Resource names used by scenes -> sprite. Zones and entity kinds map too.
const ALIAS = {
  Water: 'water', Feed: 'feed', 'Feed (dry matter)': 'feed', Manure: 'manure', Compost: 'compost', Eggs: 'eggs', Milk: 'milk',
  Tomatoes: 'tomato', Lettuce: 'lettuce', Corn: 'corn', hen: 'hen', cow: 'cow', goat: 'goat', sheep: 'goat',
  pond: 'water', storage: 'feed', compost: 'compost', house: 'house',
};

const cache = {};
function url(name) {
  if (cache[name]) return cache[name];
  const rows = SPR[name], c = document.createElement('canvas');
  c.width = c.height = 14;
  const x = c.getContext('2d'), on = (i, j) => rows[j]?.[i] && rows[j][i] !== '.';
  for (let j = -1; j <= 12; j++) for (let i = -1; i <= 12; i++) {
    if (on(i, j)) { x.fillStyle = PAL[rows[j][i]]; x.fillRect(i + 1, j + 1, 1, 1); }
    else if (on(i - 1, j) || on(i + 1, j) || on(i, j - 1) || on(i, j + 1)) { x.fillStyle = PAL.K; x.fillRect(i + 1, j + 1, 1, 1); }
  }
  return (cache[name] = c.toDataURL());
}

// <img> for a sprite name, a resource name ('Water'), or an entity kind ('hen'). Empty string if unknown.
export function sprite(key, size = 20) {
  const name = SPR[key] ? key : ALIAS[key];
  return name ? `<img class="spr" src="${url(name)}" width="${size}" height="${size}" alt="">` : '';
}

// The icon(s) for a zone: its crop, its animals, or its kind.
export function zoneSprites(zone, ents, size = 20) {
  if (zone.props?.crop) return sprite(zone.props.crop, size);
  const kinds = [...new Set(ents.filter((e) => e.props?.zone === zone.id).map((e) => e.kind))];
  if (kinds.length) return kinds.map((k) => sprite(k, size)).join('');
  return sprite(zone.kind, size);
}
