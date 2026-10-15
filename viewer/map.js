// Top-down pixel farm map. Zones come from scene entities with props.rect (tiles);
// animal groups (props.zone + props.count) wander inside their zone.
import { C, rect, rrect, px, disc, ellipse, line, sprite, hash, SPR } from './pixel.js';

const T = 8; // pixels per tile
const ANIMALS = { hen: 'henTop', cow: 'cowTop', goat: 'goatTop', sheep: 'goatTop' };
const SIZE = { hen: [4, 4], cow: [9, 5], goat: [7, 4], sheep: [7, 4] };

export function createMap(canvas) {
  const c = canvas.getContext('2d');
  let zones = [], herds = [], selected = null, W = 192, H = 248;

  function setScene(scene) {
    const ents = scene.entities || [];
    zones = ents.filter(e => e.props?.rect).map(e => {
      const [x, y, w, h] = e.props.rect;
      return { e, x: x * T, y: y * T, w: w * T, h: h * T };
    });
    W = Math.max(...zones.map(z => z.x + z.w), 8 * T) + T;
    H = Math.max(...zones.map(z => z.y + z.h), 8 * T) + T;
    if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }

    // Keep existing animals where possible so a scene update doesn't teleport them.
    const old = new Map(herds.map(h => [h.id, h]));
    herds = ents.filter(e => ANIMALS[e.kind] && e.props?.zone).map(e => {
      const z = zones.find(z => z.e.id === e.props.zone);
      if (!z) return null;
      const n = Math.min(e.props.count || 1, 40); // ponytail: draw cap 40 per group, counts still exact in UI
      const prev = old.get(e.id);
      const list = Array.from({ length: n }, (_, i) => prev?.list[i] || spawn(z, e.kind));
      return { id: e.id, kind: e.kind, z, list };
    }).filter(Boolean);
  }

  function spawn(z, kind) {
    const [w, h] = SIZE[kind];
    const free = (p) => z.e.kind !== 'pen' || p.x > z.x + 28 || p.y > z.y + 27; // keep off the barn + hay
    const r = () => { for (;;) { const p = { x: z.x + 4 + Math.random() * (z.w - 8 - w), y: z.y + 6 + Math.random() * (z.h - 10 - h) }; if (free(p)) return p; } };
    const p = r();
    return { ...p, tx: p.x, ty: p.y, flip: false, wait: Math.random() * 30, pick: r, peck: 0 };
  }

  function step(a, kind) {
    if (a.wait > 0) { a.wait--; a.peck = kind === 'hen' && a.wait % 6 < 2 ? 1 : 0; return; }
    const dx = a.tx - a.x, dy = a.ty - a.y;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
      const t = a.pick(); a.tx = t.x; a.ty = t.y; a.wait = 10 + Math.random() * 40; return;
    }
    const sp = kind === 'hen' ? 0.9 : 0.45;
    a.x += Math.sign(dx) * Math.min(sp, Math.abs(dx));
    a.y += Math.sign(dy) * Math.min(sp * 0.7, Math.abs(dy));
    if (Math.abs(dx) > 0.5) a.flip = dx < 0;
  }

  function background() {
    rect(c, 0, 0, W, H, C.path);
    for (let y = 0; y < H; y += 2)
      for (let x = 0; x < W; x += 2)
        if (hash(x, y) > 0.93) px(c, x, y, C.pathD);
  }

  function grassBase(z, col = C.grass) {
    rrect(c, z.x, z.y, z.w, z.h, C.grassD);
    rrect(c, z.x + 1, z.y + 1, z.w - 2, z.h - 2, col);
    for (let y = z.y + 3; y < z.y + z.h - 3; y += 3)
      for (let x = z.x + 3; x < z.x + z.w - 3; x += 3)
        if (hash(x, y) > 0.86) px(c, x, y, C.grassL);
  }

  function dirtBase(z) {
    rrect(c, z.x, z.y, z.w, z.h, C.grassD);
    rrect(c, z.x + 1, z.y + 1, z.w - 2, z.h - 2, C.grass);
    rrect(c, z.x + 3, z.y + 3, z.w - 6, z.h - 6, C.dirtD);
    rrect(c, z.x + 4, z.y + 4, z.w - 8, z.h - 8, C.dirt);
  }

  function fence(z) {
    for (let x = z.x + 2; x < z.x + z.w - 2; x++) {
      const post = (x - z.x) % 5 === 0;
      px(c, x, z.y + 2, post ? C.fenceD : C.fence);
      px(c, x, z.y + z.h - 3, post ? C.fenceD : C.fence);
    }
    for (let y = z.y + 2; y < z.y + z.h - 2; y++) {
      const post = (y - z.y) % 5 === 0;
      px(c, z.x + 2, y, post ? C.fenceD : C.fence);
      px(c, z.x + z.w - 3, y, post ? C.fenceD : C.fence);
    }
  }

  function tree(x, y, t, sway = 0) {
    ellipse(c, x + 3, y + 7, 3, 1, C.grassD);
    sprite(c, SPR.tree, SPR.treePal, x + sway, y);
  }

  const draw = {
    house(z, t) {
      grassBase(z, C.grassL);
      fence(z);
      const hx = z.x + Math.round(z.w / 2) - 14, hy = z.y + Math.round(z.h / 2) - 13;
      rect(c, hx + 2, hy + 3, 28, 22, C.grassD); // shadow
      rect(c, hx, hy, 28, 22, C.redD);
      rect(c, hx + 1, hy + 1, 26, 10, C.redL);
      rect(c, hx + 1, hy + 11, 26, 10, C.red);
      rect(c, hx, hy + 10, 28, 1, C.redD);
      for (let x = hx + 2; x < hx + 26; x += 3) { px(c, x, hy + 4, C.red); px(c, x + 1, hy + 15, C.redD); }
      rect(c, hx + 20, hy - 2, 4, 5, C.greyD); rect(c, hx + 21, hy - 1, 2, 2, C.grey);
      const s = Math.floor(t / 3) % 6; // chimney smoke
      px(c, hx + 22, hy - 4 - s, C.greyL); px(c, hx + 23 + (s % 2), hy - 6 - s, C.white);
      rect(c, hx + 12, hy + 22, 4, z.y + z.h - hy - 25, C.pathD); // front path
      for (let x = z.x + 4; x < z.x + z.w - 10; x += 9) tree(x, z.y + 4, t);
      for (let y = z.y + 13; y < z.y + z.h - 12; y += 9) tree(z.x + 4, y, t);
      tree(z.x + 4, z.y + z.h - 12, t);
      rect(c, z.x + z.w - 14, z.y + z.h - 12, 9, 7, C.dirtD); // flower bed
      for (let i = 0; i < 6; i++) px(c, z.x + z.w - 13 + (i * 3) % 8, z.y + z.h - 11 + (i % 3) * 2, [C.red, C.yellow, C.white][i % 3]);
      rect(c, z.x + z.w - 9, z.y + 22, 5, 9, C.waterD); rect(c, z.x + z.w - 8, z.y + 23, 3, 3, C.waterL); // little car
      for (let i = 0; i < 4; i++) rect(c, z.x + 14 + i * 4, z.y + z.h - 11, 2, 2, [C.red, C.yellow, C.white, C.orange][i]); // flower pots
    },
    plot(z, t) {
      dirtBase(z);
      const crop = z.e.props.crop;
      if (crop === 'tomato') {
        for (let y = z.y + 6, row = 0; y < z.y + z.h - 9; y += 7, row++) {
          rect(c, z.x + 5, y + 5, z.w - 10, 1, C.dirtD);
          for (let x = z.x + 6, i = 0; x < z.x + z.w - 10; x += 6, i++)
            sprite(c, (i + row + (t >> 3)) % 2 ? SPR.tomato : SPR.tomato2, SPR.tomatoPal, x, y);
        }
      } else if (crop === 'corn') {
        for (let y = z.y + 7; y < z.y + z.h - 8; y += 8)
          for (let x = z.x + 6; x < z.x + z.w - 6; x += 3) {
            const sway = ((x + (t >> 2)) % 6) < 3 ? 0 : 1;
            line(c, x, y + 6, x + sway, y, C.leaf);
            px(c, x - 1, y + 3, C.leafL); px(c, x + 1, y + 2, C.leafL);
            if (hash(x, y) > 0.5) px(c, x + sway, y + 1, C.yellow);
          }
        if (Math.floor(t / 40) % 2 === 0) { // tractor crossing
          const tx = z.x + 4 + ((t * 0.5) % (z.w - 12));
          rect(c, tx, z.y + 2, 7, 4, C.red); rect(c, tx + 4, z.y + 1, 2, 2, C.ink); rect(c, tx, z.y + 5, 2, 2, C.ink); rect(c, tx + 5, z.y + 5, 2, 2, C.ink);
        }
      } else {
        const mid = z.y + Math.round(z.h / 2);
        for (let y = z.y + 6; y < mid - 3; y += 6)
          for (let x = z.x + 6; x < z.x + z.w - 8; x += 6) sprite(c, SPR.lettuce, SPR.lettucePal, x, y);
        rect(c, z.x + 4, mid, z.w - 8, z.h - (mid - z.y) - 4, C.dirtD);
        for (let y = mid + 3; y < z.y + z.h - 5; y += 3)
          for (let x = z.x + 6; x < z.x + z.w - 6; x += 2)
            px(c, x, y, hash(x, y) > 0.7 ? [C.yellow, C.red, C.orange][Math.floor(hash(y, x) * 3)] : C.leafL);
      }
    },
    pen(z, t) {
      grassBase(z);
      fence(z);
      const bx = z.x + 5, by = z.y + 6; // barn, top-down
      rect(c, bx + 2, by + 2, 20, 14, C.grassD);
      rect(c, bx, by, 20, 14, C.redD); rect(c, bx + 1, by + 1, 18, 6, C.redL); rect(c, bx + 1, by + 7, 18, 6, C.red);
      rect(c, bx, by + 6, 20, 1, C.white);
      line(c, bx + 7, by + 2, bx + 12, by + 5, C.white); line(c, bx + 12, by + 2, bx + 7, by + 5, C.white);
      for (let i = 0; i < 3; i++) { rect(c, bx + 2 + i * 6, by + 18, 5, 4, C.hay); rect(c, bx + 2 + i * 6, by + 19, 5, 1, C.hayD); }
      rect(c, z.x + z.w - 22, z.y + z.h - 9, 16, 4, C.woodD); rect(c, z.x + z.w - 21, z.y + z.h - 8, 14, 2, C.water); // trough
      rect(c, bx, z.y + z.h - 16, 10, 9, C.wood); rect(c, bx + 1, z.y + z.h - 15, 8, 3, C.woodD); // coop
    },
    pond(z, t) {
      grassBase(z);
      const cx = z.x + z.w - 18, cy = z.y + Math.round(z.h / 2);
      ellipse(c, cx, cy + 1, 14, 9, C.grassD);
      ellipse(c, cx, cy, 14, 9, C.waterD);
      ellipse(c, cx, cy, 12, 7, C.water);
      for (let i = 0; i < 5; i++) { // shimmer
        const sx = cx - 9 + ((i * 7 + (t >> 1)) % 18), sy = cy - 4 + ((i * 3) % 8);
        rect(c, sx, sy, 3, 1, C.waterL);
      }
      for (let i = 0; i < 4; i++) line(c, cx + 11 + i, cy - 7, cx + 10 + i, cy - 2, C.leaf);
      disc(c, z.x + 11, cy, 8, C.steelD); disc(c, z.x + 11, cy, 6, C.steelL); disc(c, z.x + 10, cy - 1, 2, C.white);
      rect(c, z.x + 19, cy, cx - z.x - 32, 2, C.greyD); // pipe
    },
    storage(z, t) {
      grassBase(z, C.grassL);
      const bx = z.x + 5, by = z.y + 5;
      rect(c, bx + 2, by + 2, 30, z.h - 10, C.grassD);
      rect(c, bx, by, 30, z.h - 10, C.steelD);
      for (let x = bx + 1; x < bx + 29; x += 2) rect(c, x, by + 1, 1, z.h - 12, C.steel);
      rect(c, bx + 12, by + z.h - 16, 6, 6, C.ink);
      disc(c, z.x + z.w - 22, z.y + Math.round(z.h / 2), 7, C.greyD); disc(c, z.x + z.w - 22, z.y + Math.round(z.h / 2), 5, C.greyL);
      disc(c, z.x + z.w - 9, z.y + Math.round(z.h / 2), 5, C.greyD); disc(c, z.x + z.w - 9, z.y + Math.round(z.h / 2), 3, C.greyL);
    },
  };

  function frame(t) {
    background();
    for (const z of zones) (draw[z.e.kind] || ((z) => grassBase(z)))(z, t);
    for (const h of herds) {
      for (const a of h.list) {
        step(a, h.kind);
        const [w] = SIZE[h.kind];
        ellipse(c, a.x + w / 2, a.y + SIZE[h.kind][1], Math.ceil(w / 2), 1, C.grassD);
        sprite(c, SPR[ANIMALS[h.kind]], SPR[ANIMALS[h.kind] + 'Pal'], a.x, a.y + a.peck, a.flip);
      }
    }
    if (selected) {
      const z = zones.find(z => z.e.id === selected);
      if (z) {
        const col = (t >> 2) % 2 ? C.white : C.sun;
        for (let x = z.x; x < z.x + z.w; x++) { px(c, x, z.y, col); px(c, x, z.y + z.h - 1, col); }
        for (let y = z.y; y < z.y + z.h; y++) { px(c, z.x, y, col); px(c, z.x + z.w - 1, y, col); }
      }
    }
  }

  return {
    setScene,
    frame,
    select(id) { selected = id; },
    hit(x, y) { return zones.find(z => x >= z.x && x < z.x + z.w && y >= z.y && y < z.y + z.h)?.e.id || null; },
    labels() { return zones.map(z => ({ id: z.e.id, name: z.e.name, left: (z.x + z.w / 2) / W * 100, top: (z.y + 1) / H * 100 })); },
    size() { return [W, H]; },
  };
}
