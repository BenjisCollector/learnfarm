// Pixel primitives. Everything is drawn at low resolution and scaled up with
// image-rendering: pixelated, so every shape is real pixels.

export const C = {
  grass: '#8fd16a', grassL: '#a6df7f', grassD: '#6db552', grassDD: '#4f9a3e',
  path: '#ecdcae', pathD: '#dcc590',
  dirt: '#b27a48', dirtD: '#8f5d35', dirtL: '#c48d58',
  leaf: '#3f9e3a', leafL: '#6cc04f', leafLL: '#9be07a',
  red: '#d9483b', redD: '#a8322a', redL: '#ee6a55',
  tomato: '#e2463c', yellow: '#f2c94c', yellowD: '#d9a72e', orange: '#f39c3d',
  white: '#ffffff', cream: '#f6efdc', fence: '#f3ead2', fenceD: '#c9b98f',
  ink: '#2b2b2b', grey: '#9aa5b1', greyD: '#6b7682', greyL: '#c9d1d9',
  water: '#4aa3df', waterL: '#8fd0f5', waterD: '#2f7fb8',
  steel: '#7b8fa6', steelD: '#5a6d84', steelL: '#a9b8c9',
  wood: '#9c6b3f', woodD: '#7a4f2c', hay: '#e9c766', hayD: '#c9a23f',
  pink: '#f4a6a6', sun: '#ffd54a', sunL: '#ffe993',
};

export function rect(c, x, y, w, h, col) {
  c.fillStyle = col;
  c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

export function px(c, x, y, col) { rect(c, x, y, 1, 1, col); }

// Rectangle with 2-step pixel corners.
export function rrect(c, x, y, w, h, col) {
  rect(c, x + 2, y, w - 4, h, col);
  rect(c, x + 1, y + 1, w - 2, h - 2, col);
  rect(c, x, y + 2, w, h - 4, col);
}

export function disc(c, cx, cy, r, col) {
  for (let y = -r; y <= r; y++)
    for (let x = -r; x <= r; x++)
      if (x * x + y * y <= r * r + r * 0.6) px(c, cx + x, cy + y, col);
}

export function ellipse(c, cx, cy, rx, ry, col) {
  for (let y = -ry; y <= ry; y++)
    for (let x = -rx; x <= rx; x++)
      if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1) px(c, cx + x, cy + y, col);
}

export function line(c, x0, y0, x1, y1, col) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    px(c, x0, y0, col);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

// rows: array of strings; '.' is transparent, other chars look up pal.
export function sprite(c, rows, pal, x, y, flip = false) {
  const w = rows[0].length;
  for (let r = 0; r < rows.length; r++)
    for (let i = 0; i < w; i++) {
      const col = pal[rows[r][i]];
      if (col) px(c, Math.round(x) + (flip ? w - 1 - i : i), Math.round(y) + r, col);
    }
}

// Deterministic noise so static texture doesn't flicker between frames.
export function hash(x, y) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

export const SPR = {
  tree: ['..ggg..', '.gGGGg.', 'gGGlGGg', 'gGlGGGg', 'gGGGGGg', '.gGGGg.', '..ggg..'],
  treePal: { g: C.grassDD, G: C.leafL, l: C.leafLL },
  cowTop: ['.wwkwww..', 'wwkkwwwhh', 'wwwwwkkhp', 'wkwwwwwhh', '.wwwkww..'],
  cowTopPal: { w: C.white, k: C.ink, h: '#e9e2d6', p: C.pink },
  goatTop: ['.bbbb..', 'bbbbbhh', 'bbbbbhk', '.bbbb..'],
  goatTopPal: { b: '#d8c3a0', h: '#efe3cc', k: C.ink },
  henTop: ['.rr.', 'wwwy', 'wwww', '.ww.'],
  henTopPal: { r: '#e53935', w: C.white, y: '#f9a825' },
  tomato: ['.lGl.', 'lGrGl', 'GrGGG', 'lGGrl', '.lGl.'],
  tomato2: ['.lGl.', 'lGGrl', 'GGrGr', 'lrGGl', '.lGl.'],
  tomatoPal: { l: C.leafL, G: C.leaf, r: C.tomato },
  lettuce: ['.ll.', 'lLLl', 'lLLl', '.ll.'],
  lettucePal: { l: C.leaf, L: C.leafLL },
  cowSide: ['.k.........', 'kkk.wwkwww.', 'kpkwwwkkwwt', '.kwwkwwwwwt', '..wwwwkwww.', '..k.k..k.k.', '..k.k..k.k.'],
  cowSidePal: { k: C.ink, w: C.white, p: C.pink, t: C.ink },
};

// UI icons, 9x9, 'x' = ink.
export const ICON = {
  sunny: ['....x....', '.x.....x.', '...xxx...', '..xxxxx..', 'x.xxxxx.x', '..xxxxx..', '...xxx...', '.x.....x.', '....x....'],
  cloudy: ['.........', '.........', '...xxx...', '..xxxxx..', '.xxxxxxx.', 'xxxxxxxxx', 'xxxxxxxxx', '.xxxxxxx.', '.........'],
  windy: ['.........', 'xxxxxx...', '......x..', 'xxxxxxx..', '.........', 'xxxxxxxx.', '........x', 'xxxxxxxx.', '.........'],
  rain: ['...xxx...', '..xxxxx..', '.xxxxxxx.', 'xxxxxxxxx', '.........', '.x..x..x.', 'x..x..x..', '.........', '.x..x..x.'],
  rainbow: ['.........', '..xxxxx..', '.x.....x.', 'x..xxx..x', 'x.x...x.x', 'xx.....xx', 'x.......x', '.........', '.........'],
  farm: ['.........', '.xx...xx.', 'xxxx.xxxx', '.xxx.xxx.', '...xxx...', '....x....', '....x....', '..xxxxx..', '.........'],
  flows: ['..x...x..', '.xxx..x..', 'x.x.x.x..', '..x...x..', '..x.x.x.x', '..x..xxx.', '..x...x..', '.........', '.........'],
  pin: ['..xxx....', '.xx.xx...', '.x...x...', '.xx.xx...', '..xxx....', '...x.....', '.........', '.........', '.........'],
  play: ['.........', '.xx......', '.xxxx....', '.xxxxxx..', '.xxxxxxx.', '.xxxxxx..', '.xxxx....', '.xx......', '.........'],
  pause: ['.........', '.xx..xx..', '.xx..xx..', '.xx..xx..', '.xx..xx..', '.xx..xx..', '.xx..xx..', '.xx..xx..', '.........'],
  hand: ['...x.....', '...x.....', '...xxxx..', '...xxxxx.', 'x..xxxxx.', 'xx.xxxxx.', '.xxxxxxx.', '..xxxxx..', '...xxx...'],
};

export function icon(rows, color, scale = 2) {
  const cv = document.createElement('canvas');
  cv.width = rows[0].length; cv.height = rows.length;
  sprite(cv.getContext('2d'), rows, { x: color }, 0, 0);
  cv.className = 'picon';
  cv.style.width = cv.width * scale + 'px';
  cv.style.height = cv.height * scale + 'px';
  return cv;
}
