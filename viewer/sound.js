// Quiet sound effects, synthesised with Web Audio (no files). Off switch saved in this browser.
let ac, master, on = true;
try { on = localStorage.getItem('lf-sound') !== 'off'; } catch {}

function tone(freq, dur, { type = 'sine', vol = 0.5, at = 0, to } = {}) {
  if (!on) return;
  try {
    ac ||= new AudioContext();
    if (!master) { master = ac.createGain(); master.gain.value = 0.06; master.connect(ac.destination); } // quiet on purpose
    if (ac.state === 'suspended') ac.resume();
    const t = ac.currentTime + at, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.02);
  } catch { /* no audio, no problem */ }
}

export const sfx = {
  tap: () => tone(700, 0.05, { type: 'triangle', vol: 0.35 }),
  page: () => tone(520, 0.06, { vol: 0.3 }),
  good: () => { tone(523, 0.1); tone(784, 0.16, { at: 0.08 }); },
  soft: () => tone(392, 0.18, { vol: 0.35, to: 330 }),
  warn: () => { tone(440, 0.12, { type: 'triangle', vol: 0.3 }); tone(370, 0.16, { type: 'triangle', vol: 0.3, at: 0.12 }); },
  die: () => tone(220, 0.5, { vol: 0.45, to: 110 }),
  build: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.14, { type: 'triangle', vol: 0.35, at: i * 0.09 })),
  msg: () => tone(880, 0.07, { vol: 0.25 }),
};
export const soundOn = () => on;
export function setSound(v) { on = v; try { localStorage.setItem('lf-sound', v ? 'on' : 'off'); } catch {} if (v) sfx.tap(); }
