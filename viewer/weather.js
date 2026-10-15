// Side-view pixel weather scene: sky, sun, clouds, windmills, barn, cows, field with sprinklers.
import { C, rect, px, disc, ellipse, line, sprite, hash, SPR } from './pixel.js';

const W = 192, H = 196, OFF = 46; // OFF: extra sky above the ground scene
const SKY = {
  sunny: ['#6fbff5', '#86caf7', '#9dd5f9', '#b5e0fa', '#cdeafb', '#e2f4fc'],
  cloudy: ['#9fb4c4', '#aebfcd', '#bccad5', '#cad5de', '#d7e0e7', '#e3e9ee'],
  windy: ['#7fc0e8', '#94cbee', '#a9d6f2', '#bee0f5', '#d2eaf8', '#e5f3fb'],
  rain: ['#6f8494', '#7b8f9e', '#8899a7', '#95a4b0', '#a2afba', '#aebac3'],
  rainbow: ['#7cc6f6', '#94d2f8', '#acdcfa', '#c5e7fb', '#dcf1fc', '#eef8fd'],
};

export function createWeather(canvas) {
  canvas.width = W; canvas.height = H;
  const c = canvas.getContext('2d');
  let mode = 'sunny', wind = 10;
  const clouds = Array.from({ length: 6 }, (_, i) => ({ x: i * 38 + hash(i, 1) * 20, y: 10 + hash(i, 2) * 50, s: 1 + Math.round(hash(i, 3) * 2) }));
  const drops = Array.from({ length: 90 }, (_, i) => ({ x: hash(i, 9) * (W + 40), y: hash(9, i) * H }));

  function cloud(x, y, s, dark) {
    const top = dark ? '#c3ccd4' : C.white, under = dark ? '#98a6b2' : '#dbe8f2';
    ellipse(c, x + 6 * s, y + 4 * s + 1, 7 * s, 2 * s, under);
    ellipse(c, x + 6 * s, y + 4 * s, 7 * s, 2 * s, top);
    disc(c, x + 4 * s, y + 3 * s, 2 * s, top);
    disc(c, x + 8 * s, y + 2 * s, 3 * s, top);
  }

  function windmill(x, y, a) {
    line(c, x, y, x, y + 22, C.white);
    line(c, x + 1, y + 6, x + 1, y + 22, C.greyL);
    for (let k = 0; k < 3; k++) {
      const ang = a + k * 2.094;
      line(c, x, y, x + Math.cos(ang) * 9, y + Math.sin(ang) * 9, C.white);
    }
    px(c, x, y, C.greyD);
  }

  function tree(x, y, sway) {
    rect(c, x + 2, y + 7, 2, 5, C.woodD);
    disc(c, x + 3 + sway, y + 4, 5, C.grassDD);
    disc(c, x + 3 + sway, y + 3, 4, C.leafL);
    px(c, x + 2 + sway, y + 1, C.leafLL); px(c, x + 1 + sway, y + 2, C.leafLL);
  }

  function barn(x, y) {
    rect(c, x, y, 28, 18, C.red);
    for (let i = 0; i < 28; i += 3) rect(c, x + i, y, 1, 18, C.redD);
    for (let i = 0; i < 9; i++) rect(c, x - 2 + i, y - i, 32 - 2 * i, 1, C.redD); // roof
    rect(c, x + 6, y - 9, 16, 1, C.white);
    rect(c, x + 10, y + 6, 9, 12, C.white); rect(c, x + 11, y + 7, 7, 11, C.red);
    line(c, x + 11, y + 7, x + 17, y + 17, C.white); line(c, x + 17, y + 7, x + 11, y + 17, C.white);
    rect(c, x + 12, y - 5, 5, 4, C.white); rect(c, x + 13, y - 4, 3, 2, C.ink);
    rect(c, x + 30, y - 10, 8, 28, C.greyL); rect(c, x + 36, y - 10, 2, 28, C.grey); // silo
    ellipse(c, x + 34, y - 10, 4, 3, C.grey);
  }

  function waterTower(x, y) {
    line(c, x + 1, y + 10, x - 1, y + 30, C.woodD); line(c, x + 8, y + 10, x + 10, y + 30, C.woodD);
    rect(c, x, y, 10, 11, C.greyL); rect(c, x + 1, y + 4, 8, 6, C.water); rect(c, x + 1, y + 4, 8, 1, C.waterL);
    line(c, x + 5, y + 11, x + 5, y + 36, C.greyD);
  }

  function frame(t) {
    const sky = SKY[mode];
    for (let i = 0; i < sky.length; i++) rect(c, 0, i * 21, W, 21, sky[i]);
    if (mode === 'rainbow')
      ['#e74c3c', '#f39c12', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6'].forEach((col, i) => {
        for (let a = Math.PI; a <= 2 * Math.PI; a += 0.01) px(c, 96 + Math.cos(a) * (80 - i), 96 + OFF + Math.sin(a) * (80 - i), col);
      });
    if (mode !== 'rain') {
      const sx = 150, sy = 34, ray = (t >> 2) % 2;
      if (mode !== 'cloudy') for (let k = 0; k < 8; k++) {
        const a = k * Math.PI / 4;
        line(c, sx + Math.cos(a) * 12, sy + Math.sin(a) * 12, sx + Math.cos(a) * (14 + ray), sy + Math.sin(a) * (14 + ray), C.sun);
      }
      disc(c, sx, sy, 10, C.sun); disc(c, sx - 1, sy - 1, 7, C.sunL);
    }
    const speed = { sunny: 0.15, rainbow: 0.15, cloudy: 0.25, windy: 1.2, rain: 0.35 }[mode];
    const nClouds = { sunny: 2, rainbow: 2, windy: 4, cloudy: 6, rain: 6 }[mode];
    for (let i = 0; i < nClouds; i++) {
      const cl = clouds[i];
      cl.x -= speed;
      if (cl.x < -30 * cl.s) cl.x = W + 10;
      cloud(cl.x, cl.y, cl.s, mode === 'rain');
    }
    if (mode === 'sunny' || mode === 'rainbow') {
      const bx = (t * 0.8) % (W + 40) - 20, flap = (t >> 2) % 2;
      for (const [ox, oy] of [[0, 0], [9, 4]]) {
        px(c, bx + ox - 2, 50 + oy + flap, C.ink); px(c, bx + ox - 1, 51 + oy, C.ink);
        px(c, bx + ox, 50 + oy + 1, C.ink); px(c, bx + ox + 1, 51 + oy, C.ink); px(c, bx + ox + 2, 50 + oy + flap, C.ink);
      }
    }
    if (mode === 'windy')
      for (let i = 0; i < 6; i++) rect(c, (i * 53 - t * 4) % (W + 30) + W - 10 - W, 20 + i * 11, 10, 1, '#ffffffaa');

    c.save(); c.translate(0, OFF);
    for (let x = 0; x < W; x++) { // hills
      const h1 = 72 + Math.round(Math.sin(x / 23) * 4 + Math.sin(x / 9) * 1.5);
      rect(c, x, h1, 1, H, '#a3d57e');
      const h2 = 84 + Math.round(Math.sin(x / 31 + 2) * 3);
      rect(c, x, h2, 1, H, C.grass);
    }
    const spin = t * (0.05 + wind / 120) * (mode === 'windy' ? 3 : 1);
    windmill(118, 52, spin); windmill(140, 58, spin + 1); windmill(60, 60, spin + 2);
    const sway = mode === 'windy' ? ((t >> 2) % 2) : 0;
    tree(8, 70, sway); tree(22, 74, sway); tree(170, 70, sway); tree(182, 74, sway);
    waterTower(76, 54);
    barn(100, 78);
    for (let x = 0; x < W; x += 6) { rect(c, x, 92, 1, 6, C.fenceD); } // fence
    rect(c, 0, 93, W, 1, C.fence); rect(c, 0, 96, W, 1, C.fence);
    const graze = (t >> 4) % 2;
    sprite(c, SPR.cowSide, SPR.cowSidePal, 14, 90 + graze);
    sprite(c, SPR.cowSide, SPR.cowSidePal, 36, 93, true);
    ellipse(c, 26, 118, 22, 7, C.waterD); ellipse(c, 26, 117, 20, 6, C.water); // pond
    for (let i = 0; i < 3; i++) rect(c, 12 + ((i * 11 + (t >> 1)) % 26), 115 + i * 2, 4, 1, C.waterL);
    for (let i = 0; i < 4; i++) line(c, 44 + i, 108, 45 + i, 116, C.leaf);

    for (let r = 0; r < 9; r++) { // field rows, wider near the viewer
      const y = 100 + r * 6, x0 = 70 - r * 4;
      rect(c, x0, y, W - x0, 6, r % 2 ? C.dirtD : C.dirt);
      for (let x = x0 + 4; x < W; x += 8 + (r >> 2)) {
        const s = 1 + (r >> 2);
        disc(c, x, y + 2, s, C.leaf);
        if (hash(x, r) > 0.4) px(c, x + 1, y + 1, C.tomato);
      }
    }
    rect(c, 50, 121, W - 50, 1, C.greyD); // irrigation line
    rect(c, 0, 154, W, H, C.dirtD);
    if (mode !== 'rain')
      for (const sx of [86, 118, 150, 182]) {
        rect(c, sx, 116, 1, 5, C.greyD);
        for (let k = 0; k < 6; k++) {
          const p = ((t + k * 3) % 18) / 18;
          for (const dir of [-1, 1]) px(c, sx + dir * p * 12, 116 - Math.sin(p * Math.PI) * 9, '#c7ecff');
        }
      }
    c.restore();
    if (mode === 'rain')
      for (const d of drops) {
        d.y += 4; d.x -= 1.2;
        if (d.y > H) { d.y = -4; d.x = hash(d.x | 0, t) * (W + 40); }
        rect(c, d.x, d.y, 1, 3, '#d6ecff');
      }
  }

  return { frame, setMode(m) { mode = SKY[m] ? m : 'sunny'; }, setWind(k) { wind = k || 0; }, get mode() { return mode; } };
}
