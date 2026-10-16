// LearnFarm viewer. Polls a scene file, simulates it over time, and teaches the
// farm as a system: every area needs inputs, gives outputs, and is linked to others.
import { svg, FLAG } from './icons.js';
import { sprite, zoneSprites } from './sprites.js';
import { createMap } from './map.js';
import { simulate, totalsUpTo, routeFor } from '../engine/sim.js';
import { renderLoop } from './system.js';
import { UI, KIND, GLOSSARY, TOUR, RES, METHOD } from './copy.js';
import { loadData } from '../engine/rates.js';
import { wizard, makeScene, LEVEL_NAME } from './setup.js';
import { tip, initTips } from './tips.js';
import { sfx, soundOn, setSound } from './sound.js';
import { createTeacher } from './teacher.js';

// Two modes. ?scene=file: an agent edits that file and this view follows it (polls every second).
// No ?scene: you build your own farm in the browser, and it is saved here (localStorage 'lf-farm').
const SCENE_URL = new URLSearchParams(location.search).get('scene');
const ANIMALS = new Set(['hen', 'cow', 'goat', 'sheep']);
const MAX_DAY = 730, TENNIS_M2 = 260.9; // ITF doubles court, 23.77 m x 10.97 m
const SPEEDS = [1, 7, 30];

const $ = (id) => document.getElementById(id);
const st = { setup: null, data: null, scene: null, raw: '', lang: 'en', tab: 'explore', sel: null, day: 0, playing: false, speed: 7, changes: [], links: true, tour: null, sim: null };
const map = createMap($('map'), { onView: () => st.scene && updateMap() });

const t = () => UI[st.lang];
const tx = (o) => (o && (o[st.lang] || o.en)) || '';
const fmt = (n, d) => new Intl.NumberFormat(st.lang === 'ar' ? 'ar-KW' : 'en', { maximumFractionDigits: d ?? (n < 10 ? 1 : 0) }).format(n);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ents = () => st.scene?.entities || [];
const ent = (id) => ents().find((e) => e.id === id);
const stockById = (id) => (st.scene.stocks || []).find((s) => s.id === id);
const zoneOf = (e) => e?.props?.zone || e?.id;
const rec = () => st.sim?.days[Math.min(st.day, MAX_DAY)];
const resName = (en) => (st.lang === 'ar' ? RES[en]?.ar || en : en === 'Feed (dry matter)' ? 'Feed' : en);
const resColor = (en) => RES[en]?.color || '#999';
const UNITS = { kg: ['kg', 'كغ'], L: ['L', 'لتر'], eggs: ['eggs', 'بيضة'], g: ['g', 'غ'], mL: ['mL', 'مل'] };
const unit = (u) => (UNITS[u] ? UNITS[u][st.lang === 'ar' ? 1 : 0] : u);
// Per-animal amounts read better small: 0.113 kg -> 113 g.
const perHead = (amt, u) => (amt < 1 && (u === 'kg' || u === 'L') ? [amt * 1000, u === 'kg' ? 'g' : 'mL'] : [amt, u]);
// What a store holds, as a word for sentences: "short of water", "without feed".
const stockWord = (stock) => {
  const r = (st.scene.routes || []).find((x) => x.stock === stock && x.direction === 'in');
  const w = r ? resName(r.resource) : tx(stockById(stock)?.name);
  return st.lang === 'ar' ? w : w.toLowerCase();
};
const supplyOn = (id, day = st.day) => { let on = true; for (const c of st.changes) if (c.stock === id && c.day <= day) on = c.supply; return on; };

const level = () => st.setup?.level || 'hobby';
const SAVE = 'lf-farm';
const load = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const store = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const saveFarm = () => st.setup && store(SAVE, { v: 1, setup: st.setup, changes: st.changes, day: st.day, sel: st.sel });

// Build (or rebuild) the scene from the setup, keeping only supply changes for stores that still exist.
function rebuild() {
  st.scene = makeScene(st.setup, st.data);
  st.changes = st.changes.filter((c) => st.scene.stocks.some((s) => s.id === c.stock));
  if (st.sel && !ent(st.sel)) st.sel = null;
  map.setScene(st.scene); mapDeadKey = '';
  runSim(); render(); saveFarm();
}

function runSim() {
  st.sim = simulate(st.scene, { days: MAX_DAY, changes: st.changes });
  for (const d of st.sim.days) d.supplyOn = Object.fromEntries((st.scene.stocks || []).map((s) => [s.id, supplyOn(s.id, d.day)]));
}

async function poll() {
  try {
    const r = await fetch(SCENE_URL + '?t=' + Date.now(), { cache: 'no-store' });
    const raw = await r.text();
    if (r.ok && raw !== st.raw) {
      st.raw = raw;
      st.scene = JSON.parse(raw);
      if (!st.sim) st.day = st.scene.clock?.day ?? 0;
      map.setScene(st.scene);
      runSim();
      render();
    }
  } catch { /* keep showing the last good scene */ }
}

// ---------- map: labels with sizes, links, shortage status ----------
const isDead = (id) => !!rec()?.dead?.[id];
function zoneDead(zid) {
  const members = ents().filter((e) => zoneOf(e) === zid && rec()?.factor[e.id] != null);
  return { any: members.some((e) => isDead(e.id)), all: members.length > 0 && members.every((e) => isDead(e.id)) };
}
function zoneFactor(zid) {
  const r = rec();
  if (zoneDead(zid).all) return -1;
  let f = 1;
  for (const e of ents()) if (zoneOf(e) === zid && r?.factor[e.id] != null && !isDead(e.id)) f = Math.min(f, r.factor[e.id]);
  for (const s of st.scene.stocks || []) if (s.zone === zid && r && r.stocks[s.id] <= 0.5) f = Math.min(f, 0);
  return f;
}

function sizeText(z) {
  const p = z.props || {};
  if (p.area_m2) return `${fmt(p.area_m2)} ${t().m2}`;
  const n = ents().filter((e) => ANIMALS.has(e.kind) && e.props?.zone === z.id).reduce((a, e) => a + (e.props.count || 1), 0);
  if (n) return `${fmt(n)} ${t().head}`;
  const s = (st.scene.stocks || []).find((s) => s.zone === z.id);
  if (s) return `${fmt(s.capacity)} ${unit(s.unit)}`;
  return '';
}

let mapDeadKey = '';
function updateMap() {
  const r = rec(), links = [], seen = new Set();
  const deadKey = Object.keys(r?.dead || {}).sort().join(',');
  if (deadKey !== mapDeadKey) { // dead animal groups leave the map
    mapDeadKey = deadKey;
    map.setScene({ ...st.scene, entities: ents().filter((e) => !(r?.dead?.[e.id] && ANIMALS.has(e.kind))) });
  }
  const add = (from, to, res, on) => { const k = from + '>' + to + '>' + res; if (!seen.has(k)) { seen.add(k); links.push({ from, to, color: resColor(res), on }); } };
  for (const s of st.scene.stocks || []) if (s.refill_per_day && s.zone) add('outside', s.zone, (st.scene.routes || []).find((x) => x.stock === s.id && x.direction === 'in')?.resource || 'Water', supplyOn(s.id));
  for (const f of st.scene.flows || []) {
    const e = ent(f.entity), stock = routeFor(st.scene, f), s = stock && stockById(stock), on = (r?.factor[f.entity] ?? 1) > 0;
    if (!e) continue;
    if (s?.zone && f.direction === 'in') add(s.zone, zoneOf(e), f.resource.en, on && (r?.share[stock] ?? 1) > 0);
    if (s?.zone && f.direction === 'out') add(zoneOf(e), s.zone, f.resource.en, on);
    if (!stock && f.direction === 'out') add(zoneOf(e), 'market', f.resource.en, on);
  }
  map.setLinks(links);
  map.showLinks(st.links);
  const zones = ents().filter((e) => e.props?.rect);
  map.setStatus(Object.fromEntries(zones.map((z) => [z.id, zoneFactor(z.id)])));
  $('labels').innerHTML = map.labels().map((l) => {
    const z = ent(l.id), dz = zoneDead(l.id), warn = zoneFactor(l.id) < 0.999;
    const mark = dz.all ? '✕ ' : warn || dz.any ? '! ' : '', on = st.sel === l.id;
    // Small badge: pixel icon + name. Size and state words only on the selected or troubled zone.
    const more = on ? esc(sizeText(z)) : dz.all ? t().dead : '';
    return `<span class="label ${on ? 'on' : ''} ${dz.all ? 'dead' : warn || dz.any ? 'warn' : ''}" style="left:${l.left}%;top:${l.top}%">${zoneSprites(z, ents(), 18)}<span class="nm">${mark}${esc(tx(l.name))}${more ? `<small class="num">${more}</small>` : ''}</span></span>`;
  }).join('');
}

// ---------- explore: overview + area cards ----------
function overview() {
  const zones = ents().filter((e) => e.props?.rect);
  return `<div class="card soft"><h2>${t().startTitle}</h2>
    <div class="steps3"><div><b class="n">1</b><span>${t().start1}</span></div><div><b class="n">2</b><span>${t().start2}</span></div><div><b class="n">3</b><span>${t().start3}</span></div></div></div>
    <div class="card"><h3>${t().areas}</h3><p class="meta">${t().tapHint}</p><div class="arealist">
    ${zones.map((z) => `<button class="area" data-zone="${z.id}"><span class="sprs">${zoneSprites(z, ents(), 22)}</span><span class="stat ${zoneDead(z.id).all ? 'dead' : zoneFactor(z.id) < 0.999 || zoneDead(z.id).any ? 'warn' : ''}"></span><b>${esc(tx(z.name))}</b><span class="num">${esc(sizeText(z))}</span></button>`).join('')}
    </div></div>`;
}

function whereText(f) {
  const stock = routeFor(st.scene, f), s = stock && stockById(stock);
  if (f.direction === 'in') {
    if (s) return `${t().from} <button data-zone="${s.zone}">${esc(tx(s.name))}</button>`;
    return t().outside;
  }
  if (s) return `${t().to} <button data-zone="${s.zone}">${esc(tx(s.name))}</button>${s.convert ? ` <span class="pill">${fmt(s.convert * 100)}% → ${resName('Compost')}</span>` : ''}`;
  return t().market;
}

function flowItem(f, pace) {
  const amt = f.per_day * pace, n = ent(f.entity)?.props?.count;
  const [ph, pu] = n > 1 ? perHead(amt / n, f.unit) : [];
  const one = n > 1 ? `<div class="w num">${st.lang === 'ar' ? 'لكل رأس' : 'each animal'}: ${fmt(ph)} ${unit(pu)}</div>` : '';
  return `<div class="item"><div class="r">${sprite(f.resource.en, 18) || `<i style="background:${resColor(f.resource.en)}"></i>`}<span class="tipword"${tip(f.resource.en)}>${esc(tx(f.resource))}</span><span class="amt">${fmt(amt)} ${unit(f.unit)}</span></div>
    ${one}<div class="w">${whereText(f)}</div></div>`;
}

function sourcesBlock(flows) {
  const rows = flows.map((f) => {
    const urls = (f.links || []).map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(new URL(l.url).hostname.replace(/^www\./, ''))}${svg('external', 11)}</a>`).join('');
    return `<div class="src"><b>${esc(tx(f.resource))}</b>: <span class="num"${tip('range')}>${f.range ? `${t().range} ${fmt(f.range[0])}–${fmt(f.range[1])} ${unit(f.unit)} ${t().perDay}` : ''}</span>
      ${f.trust ? `<span class="trust ${f.trust}">${f.trust === 'web' ? t().trustWeb : t().trustAi}</span>` : ''}<br>${esc(f.source)}<br>${urls}</div>`;
  }).join('');
  return rows ? `<details><summary>${t().sources}</summary>${rows}</details>` : '';
}

function terms(text) {
  const g = GLOSSARY[st.lang], keys = Object.keys(GLOSSARY.en).filter((k) => text.toLowerCase().includes(k));
  if (!keys.length) return '';
  return `<div class="terms">${keys.map((k) => `<details><summary>${st.lang === 'ar' ? g[k].split(':')[0] : k}?</summary><p>${g[k]}</p></details>`).join('')}</div>`;
}

function stockBlock(s) {
  const r = rec(), level = r?.stocks[s.id] ?? s.level, pct = s.capacity ? Math.min(100, level / s.capacity * 100) : 100;
  let need = 0;
  for (const f of st.scene.flows || []) if (f.direction === 'in' && routeFor(st.scene, f) === s.id) need += f.per_day;
  let gain = 0;
  for (const f of st.scene.flows || []) if (f.direction === 'out' && routeFor(st.scene, f) === s.id) gain += f.per_day * (s.convert ?? 1);
  const net = (s.refill_per_day && supplyOn(s.id) ? s.refill_per_day : 0) + gain - need;
  const days = net >= 0 ? Infinity : Math.floor(level / -net);
  return `<div class="stock"><div class="top"><b class="tipword"${tip('stock')}>${esc(tx(s.name))}</b>${s.refill_per_day ? `<label class="switch">${esc(tx(s.supply))}: <input type="checkbox" data-supply="${s.id}" ${supplyOn(s.id) ? 'checked' : ''}><span>${supplyOn(s.id) ? t().supplyOn : t().supplyOff}</span></label>` : ''}</div>
    <div class="bar ${pct < 15 ? 'low' : ''}"><i style="width:${pct.toFixed(1)}%"></i></div>
    <div class="meta num">${level <= 0.5 ? `<b style="color:var(--red)">${t().empty}</b>` : `${fmt(level)} / ${fmt(s.capacity)} ${unit(s.unit)} · ${t().daysLeft(days)}`} <span class="pill"${tip('setting')}>${t().setting}</span></div></div>`;
}

function areaCard(zid) {
  const z = ent(zid);
  if (!z) return overview();
  const [what, why] = KIND[st.lang][z.kind] || ['', ''];
  const members = ents().filter((e) => zoneOf(e) === zid && (st.scene.flows || []).some((f) => f.entity === e.id));
  const stocks = (st.scene.stocks || []).filter((s) => s.zone === zid);
  const r = rec(), allFlows = [];
  const groups = members.map((e) => {
    const pace = r?.factor[e.id] ?? 1, flows = (st.scene.flows || []).filter((f) => f.entity === e.id);
    allFlows.push(...flows);
    const ins = flows.filter((f) => f.direction === 'in'), outs = flows.filter((f) => f.direction === 'out');
    const limit = st.sim?.events.filter((ev) => ev.entity === e.id && ev.day <= st.day).at(-1);
    const deadEv = st.sim?.events.find((ev) => ev.entity === e.id && ev.dead && ev.day <= st.day);
    const without = r?.without?.[e.id] || 0;
    const status = deadEv
      ? `<div class="status dead">${t().died(fmt(deadEv.day), stockWord(deadEv.stock), e.kind === 'plot')}</div><p class="meta">${t().diedWhy}</p>`
      : pace < 0.999
      ? `<div class="status warn"${tip('short')}>${t().shortOf(stockWord(limit?.stock), fmt(pace * 100, 0))}${without >= 0.5 ? `<br>${t().without(fmt(without, 0), stockWord(limit?.stock))}` : ''}</div>`
      : `<div class="status">${t().working}</div>`;
    const lims = (st.scene.survival || []).filter((l) => l.entity === e.id);
    const lasts = lims.length ? `<details class="lasts"><summary><span class="tipword"${tip('lasts')}>${t().lasts}</span></summary>${lims.map((l) => `<div class="src"><b>${t().lastsLine(esc(resName(l.resource)), fmt(l.days))}</b> <span class="num">(${t().range} ${fmt(l.range?.[0] ?? l.days)}–${fmt(l.range?.[1] ?? l.days)})</span><br><span class="trust ${l.basis === 'lethal' ? 'web' : 'ai_report'}">${t().basis[l.basis] || ''}</span><br>${esc(l.source)}<br>${(l.links || []).map((k) => `<a href="${esc(k.url)}" target="_blank" rel="noopener">${esc(new URL(k.url).hostname.replace(/^www\./, ''))}${svg('external', 11)}</a>`).join('')}</div>`).join('')}</details>` : '';
    const title = members.length > 1 || ANIMALS.has(e.kind) ? `<h3>${esc(tx(e.name))}${e.props?.count ? ` <span class="meta num">· ${fmt(e.props.count)}</span>` : ''}</h3>` : '';
    return `<div class="group">${title}${status}<div class="proc">
      <div class="col"><h4>${t().needs}</h4>${ins.map((f) => flowItem(f, r && routeFor(st.scene, f) ? r.share[routeFor(st.scene, f)] ?? 1 : 1)).join('')}</div>
      <div class="machine"><span class="arrow">→</span><div>${esc(tx(e.name))}</div><span class="arrow">→</span></div>
      <div class="col"><h4>${t().gives}</h4>${outs.map((f) => flowItem(f, pace)).join('')}</div></div>${lasts}</div>`;
  }).join('');
  const area = z.props?.area_m2;
  const size = area ? `${fmt(area)} ${t().m2} · ${t().tennis(fmt(area / TENNIS_M2, 1))} <span class="pill"${tip('setting')}>${t().setting}</span>` : sizeText(z) ? `${esc(sizeText(z))} <span class="pill"${tip('setting')}>${t().setting}</span>` : '';
  return `<div class="card"><div class="zhead"><div class="t"><h2>${zoneSprites(z, ents(), 26)} ${esc(tx(z.name))}</h2><div class="size num">${size}</div></div>
      <button class="xbtn" id="close" aria-label="Close">${svg('close', 16)}</button></div>
    <p class="lead"><b>${what}</b> ${why}</p>
    ${stocks.map(stockBlock).join('')}
    ${groups || (stocks.length ? '' : `<p class="meta">${t().notModelled}</p>`)}
    ${sourcesBlock(allFlows)}
    ${terms(allFlows.map((f) => f.resource.en).join(' ') + ' ' + why + ' ' + stocks.map((s) => s.id).join(' '))}</div>`;
}

// ---------- system: loop diagram, stocks, what happened, market ----------
function eventLines() {
  const groups = new Map();
  for (const ev of st.sim.events) {
    if (ev.day > st.day) break;
    const k = ev.day + '|' + ev.stock + '|' + (ev.dead ? 'dead' : ev.factor < 0.999 ? Math.round(ev.factor * 100) : 'ok');
    if (!groups.has(k)) groups.set(k, { ...ev, parts: [] });
    groups.get(k).parts.push(tx(ent(ev.entity)?.name));
  }
  const sep = st.lang === 'ar' ? '، ' : ', ';
  const lines = [...groups.values()].slice(-8).reverse().map((g) => g.dead
    ? `<div class="ev dead">${t().evDied(fmt(g.day), g.parts.join(sep), stockWord(g.stock), ent(g.entity)?.kind === 'plot')}</div>`
    : g.factor < 0.999
    ? `<div class="ev bad">${t().evShort(fmt(g.day), g.parts.join(sep), stockWord(g.stock), fmt(g.factor * 100, 0))}</div>`
    : `<div class="ev good">${t().evOk(fmt(g.day), g.parts.join(sep))}</div>`);
  return lines.join('') || `<p class="meta">${t().noEvents}</p>`;
}

function systemPanel() {
  const totals = totalsUpTo(st.scene, st.sim, st.day), byRes = {};
  for (const f of st.scene.flows || []) if (f.direction === 'out' && !routeFor(st.scene, f)) {
    const k = f.resource.en;
    byRes[k] = byRes[k] || { amt: 0, unit: f.unit, name: tx(f.resource) };
    byRes[k].amt += totals[f.entity]?.[k] || 0;
  }
  return `<div class="card"><h2 class="tipword"${tip('loop')}>${t().loopTitle}</h2><p class="meta">${t().loopSub}</p><div class="loopwrap" id="loop"></div></div>
    <div class="card"><h2>${t().stocksTitle}</h2><p class="meta" style="margin-bottom:10px">${t().stocksSub}</p>${(st.scene.stocks || []).map(stockBlock).join('')}</div>
    <div class="card"><h2>${t().eventsTitle}</h2>${eventLines()}</div>
    <div class="card"><h2>${t().marketTitle}</h2><div class="market">${Object.values(byRes).map((v) => `<div><b class="num">${fmt(v.amt)}</b><span>${unit(v.unit)} · ${esc(v.name)}</span></div>`).join('')}</div></div>`;
}

// ---------- shell ----------
function renderTime() {
  $('day').value = st.day;
  $('play').innerHTML = svg(st.playing ? 'pause' : 'play', 18);
  $('play').title = st.playing ? t().pause : t().play;
  $('daylbl').innerHTML = `${t().day} ${fmt(st.day)}<small>${t().year} ${fmt(Math.floor(st.day / 365) + 1)}</small>`;
  $('speeds').innerHTML = SPEEDS.map((s) => `<button data-speed="${s}" class="${st.speed === s ? 'on' : ''}" title="${t().speed}">${fmt(s)}×</button>`).join('');
  $('timehint').textContent = t().timeHint;
}

function renderPanel() {
  $('tabs').innerHTML = [['explore', t().explore], ['system', t().system], ['method', t().method]]
    .map(([k, l]) => `<button data-tab="${k}" class="${st.tab === k ? 'on' : ''}">${l}</button>`).join('');
  const p = $('panel');
  if (st.tab === 'explore') p.innerHTML = st.sel ? areaCard(st.sel) : overview();
  if (st.tab === 'system') {
    p.innerHTML = systemPanel();
    renderLoop($('loop'), st.scene, rec(), st.lang, tx, {
      market: st.lang === 'ar' ? 'السوق' : 'Market', off: t().supplyOff, aria: t().loopTitle, dead: t().dead,
      level: (v, s) => (s.capacity ? `${fmt(v / s.capacity * 100, 0)}%` : ''),
    }, (zid) => select(zid));
  }
  if (st.tab === 'method') p.innerHTML = METHOD[st.lang];
}

function render() {
  if (!st.scene) return;
  document.documentElement.lang = st.lang;
  document.documentElement.dir = st.lang === 'ar' ? 'rtl' : 'ltr';
  $('title').textContent = tx(st.scene.title) || 'LearnFarm';
  $('sub').innerHTML = st.setup ? `<span class="num">${fmt(st.setup.plot)} ${t().m2} · ${LEVEL_NAME[st.lang][level()]}</span>` : `${svg('pin', 15)}<span>${esc(tx(st.scene.location?.name))}</span>`;
  $('soundbtn').innerHTML = svg(soundOn() ? 'sound' : 'mute', 18);
  $('soundbtn').title = st.lang === 'ar' ? 'الصوت' : 'Sound';
  $('teachbtn').innerHTML = `${svg('method', 16)}<span>${st.lang === 'ar' ? 'المعلّم' : 'Teacher'}</span>`;
  $('menubtn').title = st.lang === 'ar' ? 'مزرعتي' : 'My farm';
  $('menubtn').hidden = !st.setup;
  renderMenu();
  teacher.draw();
  $('lang').innerHTML = st.lang === 'en' ? `<span>عربي</span>${FLAG.ar}` : `<span>English</span>${FLAG.en}`;
  $('tourbtn').innerHTML = `${svg('hand', 16)}${t().tour}`;
  $('linkslbl').textContent = t().connections;
  const used = [...new Set((st.scene.flows || []).map((f) => f.resource.en).filter((r) => r !== 'Feed (dry matter)'))];
  $('legend').innerHTML = used.map((r) => `<span class="dot">${sprite(r, 16) || `<i style="background:${resColor(r)}"></i>`}${esc(resName(r))}</span>`).join('');
  updateMap();
  renderTime();
  renderPanel();
  renderTour();
}

function select(zid) { if (zid) sfx.tap(); st.sel = zid; st.tab = 'explore'; saveFarm(); map.select(zid); render(); if (innerWidth < 1000) $('tabs').scrollIntoView({ behavior: 'smooth', block: 'start' }); }

function renderTour() {
  const el = $('tour');
  if (st.tour == null) { el.hidden = true; return; }
  const steps = TOUR[st.lang], [h, p] = steps[st.tour], last = st.tour === steps.length - 1;
  el.hidden = false;
  el.innerHTML = `<h3>${h}</h3><p>${p}</p><div class="row"><span class="num">${fmt(st.tour + 1)} / ${fmt(steps.length)}</span>
    <button class="btn skip" data-tour="skip">${st.lang === 'ar' ? 'تخطَّ' : 'Skip'}</button><button class="btn" data-tour="next">${last ? t().tourDone : t().tourNext}</button></div>`;
}

// ---------- events ----------
document.addEventListener('click', (e) => {
  const z = e.target.closest('[data-zone]'); if (z) return select(z.dataset.zone);
  const tb = e.target.closest('[data-tab]'); if (tb) { st.tab = tb.dataset.tab; sfx.page(); return render(); }
  const sp = e.target.closest('[data-speed]'); if (sp) { st.speed = +sp.dataset.speed; sfx.tap(); return renderTime(); }
  const mi = e.target.closest('[data-menu]'); if (mi) return menuAction(mi.dataset.menu);
  if (!e.target.closest('#menu,#menubtn')) $('menu').hidden = true;
  const to = e.target.closest('[data-tour]');
  if (to) {
    if (to.dataset.tour === 'next' && st.tour < TOUR.en.length - 1) st.tour++;
    else { st.tour = null; try { localStorage.setItem('of-tour', 'done'); } catch {} }
    return renderTour();
  }
  if (e.target.closest('#close')) return select(null);
});
document.addEventListener('change', (e) => {
  const s = e.target.closest('[data-supply]');
  if (!s) return;
  st.changes = st.changes.filter((c) => !(c.stock === s.dataset.supply && c.day === st.day));
  st.changes.push({ day: st.day, stock: s.dataset.supply, supply: s.checked });
  st.changes.sort((a, b) => a.day - b.day);
  s.checked ? sfx.tap() : sfx.warn();
  runSim(); render(); saveFarm();
});
$('map').onclick = (e) => {
  const r = e.target.getBoundingClientRect(), [W, H] = map.size();
  const zid = map.hit((e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H);
  if (zid) select(zid);
};
$('links').onchange = (e) => { st.links = e.target.checked; updateMap(); };
$('lang').onclick = () => { st.lang = st.lang === 'en' ? 'ar' : 'en'; try { localStorage.setItem('of-lang', st.lang); } catch {} render(); };
$('tourbtn').onclick = () => { st.tour = 0; renderTour(); };
$('day').oninput = (e) => { st.day = +e.target.value; st.playing = false; render(); saveFarm(); };
$('play').onclick = () => { st.playing = !st.playing; if (st.playing && st.day >= MAX_DAY) st.day = 0; sfx.tap(); renderTime(); };
$('soundbtn').onclick = () => { setSound(!soundOn()); render(); };
$('teachbtn').onclick = () => { sfx.tap(); teacher.toggle(); };
$('menubtn').onclick = () => { sfx.tap(); $('menu').hidden = !$('menu').hidden; };
$('importfile').onchange = async (e) => {
  const f = e.target.files[0]; e.target.value = '';
  try {
    const j = JSON.parse(await f.text());
    if (!j.setup?.plot || !Array.isArray(j.setup.crops)) throw 0;
    st.setup = j.setup; st.changes = j.changes || []; st.day = Math.min(MAX_DAY, j.day || 0); st.sel = null;
    sfx.build(); rebuild();
  } catch { alert(st.lang === 'ar' ? 'هذا ليس ملف مزرعة من ليرن فارم.' : 'That is not a LearnFarm farm file.'); }
};

// ---------- my farm menu: start over, export, import ----------
function renderMenu() {
  const ar = st.lang === 'ar';
  $('menu').innerHTML = [['new', ar ? 'ابدأ مزرعة جديدة' : 'Start a new farm'], ['export', ar ? 'نزّل ملف المزرعة' : 'Download farm file'], ['import', ar ? 'افتح ملف مزرعة' : 'Open a farm file']]
    .map(([k, l]) => `<button data-menu="${k}">${l}</button>`).join('') + `<p class="meta">${ar ? 'مزرعتك محفوظة في هذا المتصفح. الملف يحمل مزرعتك إلى جهاز آخر أو إلى وكيل ذكاء اصطناعي.' : 'Your farm is saved in this browser. The file takes it to another device, or to an AI agent.'}</p>`;
}
function menuAction(k) {
  $('menu').hidden = true; sfx.tap();
  if (k === 'new') startWizard(true);
  if (k === 'import') $('importfile').click();
  if (k === 'export') {
    const blob = new Blob([JSON.stringify({ learnfarm: 1, setup: st.setup, changes: st.changes, day: st.day, scene: st.scene }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = (st.setup.name || 'farm').replace(/[^\p{L}\p{N}]+/gu, '-') + '.learnfarm.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
}

// ---------- the setup wizard ----------
let wiz;
function startWizard(canResume) {
  const el = $('wizard');
  el.hidden = false; document.body.classList.add('wiz');
  wiz = wizard(el, { lang: () => st.lang, toggleLang: () => $('lang').click(), data: st.data, fmt, unit, sfx, saved: canResume && !!st.setup, onDone(setup) {
    el.hidden = true; document.body.classList.remove('wiz'); wiz = null;
    if (setup) { st.setup = setup; st.changes = []; st.day = 0; st.sel = null; st.tour = setup.level === 'pro' ? null : 0; rebuild(); }
  } });
  wiz.draw();
}

// ---------- the farm teacher (LLM) ----------
function farmFacts() {
  const r = rec(), lines = [];
  if (st.setup) lines.push(`farm: ${st.setup.name}; plot ${st.setup.plot} m2 (setting); crops ${ents().filter((e) => e.props?.crop).map((e) => `${e.props.crop} ${e.props.area_m2} m2`).join(', ')} (setting); animals ${Object.entries(st.setup.animals).map(([k, n]) => `${k} ${n}`).join(', ')} (setting)`);
  lines.push(`day: ${st.day} of ${MAX_DAY}`);
  lines.push('zones: ' + ents().filter((e) => e.props?.rect).map((e) => `${e.id} (${e.name.en})`).join(', '));
  lines.push('stocks (all sizes are settings):');
  for (const s of st.scene.stocks || []) lines.push(`- ${s.id}: ${fmtN(r?.stocks[s.id] ?? s.level)} of ${s.capacity} ${s.unit}${s.refill_per_day ? `, refilled ${s.refill_per_day}/day by ${s.supply.en} (${supplyOn(s.id) ? 'on' : 'off'})` : ''}${s.convert ? `, turns manure into compost at ${s.convert} (${s.convert_source})` : ''}`);
  lines.push('daily flows, computed from cited sources:');
  for (const f of st.scene.flows || []) lines.push(`- ${f.entity} ${f.direction} ${f.resource.en}: ${f.per_day} ${f.unit}/day${f.range ? ` (range ${f.range[0]}-${f.range[1]})` : ''}; source: ${f.source}`);
  if (st.scene.survival?.length) { lines.push('how long each part lasts without an input:'); for (const l of st.scene.survival) lines.push(`- ${l.entity} without ${l.resource}: ${l.days} days (${l.basis}); source: ${l.source}`); }
  const now = ents().filter((e) => r?.factor[e.id] != null).map((e) => `${e.id}: ${r.dead?.[e.id] ? 'dead' : `working at ${Math.round(r.factor[e.id] * 100)}%`}`);
  lines.push('today: ' + now.join(', '));
  const evs = st.sim.events.filter((ev) => ev.day <= st.day).slice(-6).map((ev) => `day ${ev.day} ${ev.entity} ${ev.dead ? 'died, no ' + ev.stock : ev.factor < 0.999 ? `short of ${ev.stock}, ${Math.round(ev.factor * 100)}%` : 'back to normal'}`);
  if (evs.length) lines.push('recent events: ' + evs.join('; '));
  return { text: lines.join('\n'), stocks: (st.scene.stocks || []).map((s) => s.id), zones: ents().filter((e) => e.props?.rect).map((e) => e.id) };
}
const fmtN = (n) => Math.round(n * 10) / 10;
function applyAction(a) {
  const needSetup = () => { if (!st.setup) throw new Error('error: this farm comes from a scene file; edit the file to change animals or crops'); };
  try {
    if (a.type === 'set_animals') { needSetup(); st.setup.animals = { ...st.setup.animals, [a.kind]: a.count }; rebuild(); return `${a.kind}: ${a.count}`; }
    if (a.type === 'set_crops') { needSetup(); st.setup.crops = a.crops; rebuild(); return `crops: ${a.crops.join(', ')}`; }
    if (a.type === 'set_supply') {
      st.changes = st.changes.filter((c) => !(c.stock === a.stock && c.day === st.day));
      st.changes.push({ day: st.day, stock: a.stock, supply: a.on }); st.changes.sort((x, y) => x.day - y.day);
      runSim(); render(); saveFarm(); return `${a.stock} supply ${a.on ? 'on' : 'off'} from day ${st.day}`;
    }
    if (a.type === 'go_to_day') { st.day = a.day; st.playing = false; render(); saveFarm(); return `day ${a.day}`; }
    if (a.type === 'show_area') { select(a.zone); return `showing ${a.zone}`; }
  } catch (e) { return e.message; }
  return 'error: unknown action';
}
const teacher = createTeacher({ el: $('teacher'), lang: () => st.lang, level, facts: farmFacts, apply: applyAction, sfx,
  store: { get: () => load('lf-chat') || {}, set: (v) => store('lf-chat', v) } });
initTips({ lang: () => st.lang, level, sfx });

{ // ?lang= wins (the website passes its language), then the saved choice
  const q = new URLSearchParams(location.search).get('lang');
  let saved = null; try { saved = localStorage.getItem('of-lang'); } catch {}
  st.lang = (q || saved) === 'ar' ? 'ar' : 'en';
}
try { if (localStorage.getItem('of-tour') !== 'done') st.tour = 0; } catch { st.tour = 0; }

// The diorama renders every frame; the clock ticks at 12 fps. Play advances `speed` days per second.
let tick = 0, last = 0;
function loop(now) {
  map.frame();
  if (now - last >= 1000 / 12) {
    last = now; tick++;
    if (st.playing && tick % Math.max(1, Math.round(12 / Math.min(st.speed, 12))) === 0) {
      const was = st.day;
      st.day = Math.min(MAX_DAY, st.day + Math.max(1, Math.round(st.speed / 12)));
      const evs = st.sim.events.filter((ev) => ev.day > was && ev.day <= st.day);
      if (evs.some((ev) => ev.dead)) sfx.die(); else if (evs.some((ev) => ev.factor < 0.999)) sfx.warn();
      if (tick % 24 === 0 || !st.playing) saveFarm();
      if (st.day >= MAX_DAY) st.playing = false;
      updateMap(); renderTime();
      if (tick % 6 === 0 || !st.playing) renderPanel();
    }
  }
  requestAnimationFrame(loop);
}

if (SCENE_URL) {
  poll();
  setInterval(poll, 1000); // file polling: any agent that edits the scene drives this view
} else {
  loadData(new URL('../data/', location.href)).then((d) => {
    st.data = d;
    const saved = load(SAVE);
    if (saved?.setup) { // pick up exactly where you left off
      st.setup = saved.setup; st.changes = saved.changes || []; st.day = saved.day || 0; st.sel = saved.sel || null; st.tour = null;
      rebuild(); if (st.sel) map.select(st.sel);
    } else startWizard(false);
  });
}
requestAnimationFrame(loop);
