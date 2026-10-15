// Whole-farm loop diagram: Outside supplies -> Stores -> Farm parts -> Market,
// with outputs like manure flowing back into a store (the loop beginners should see).
import { routeFor } from '../engine/sim.js';
import { RES } from './copy.js';

const COLS = [4, 96, 222, 320], NW = 82, NH = 30, GAP = 10, LANE = 10; // wide store->part gutter for the arrows
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function renderLoop(el, scene, rec, lang, tx, labels, onPick) {
  // Stores that receive outputs (manure -> compost heap) go last, so return arrows can rise into them from below.
  const fed = new Set((scene.flows || []).filter((f) => f.direction === 'out').map((f) => routeFor(scene, f)));
  const stocks = [...(scene.stocks || [])].sort((a, b) => fed.has(a.id) - fed.has(b.id));
  const parts = (scene.entities || []).filter((e) => (scene.flows || []).some((f) => f.entity === e.id));
  const supplies = stocks.filter((s) => s.refill_per_day);
  const nBack = (scene.flows || []).filter((f) => f.direction === 'out' && routeFor(scene, f)).length;
  const HN = Math.max(parts.length, stocks.length + 1) * (NH + GAP) + 24, H = HN + (nBack ? nBack * LANE + 10 : 0);
  const col = (list, x) => Object.fromEntries(list.map((n, i) => {
    const top = (HN - list.length * (NH + GAP) + GAP) / 2;
    return [n.key, { ...n, x, y: top + i * (NH + GAP) }];
  }));
  const N = {
    ...col(supplies.map((s) => ({ key: 'sup:' + s.id, label: tx(s.supply), sub: rec && (rec.supplyOn?.[s.id] === false) ? labels.off : '' })), COLS[0]),
    ...col(stocks.map((s) => ({ key: 'st:' + s.id, label: tx(s.name), sub: rec ? labels.level(rec.stocks[s.id], s) : '', pick: s.zone })), COLS[1]),
    ...col(parts.map((e) => ({ key: 'p:' + e.id, label: tx(e.name), sub: rec?.dead?.[e.id] ? labels.dead : rec && (rec.factor[e.id] ?? 1) < 0.999 ? `${Math.round(rec.factor[e.id] * 100)}%` : '', pick: e.props?.zone || e.id, warn: rec && (rec.factor[e.id] ?? 1) < 0.999, dead: rec?.dead?.[e.id] })), COLS[2]),
    ...col([{ key: 'market', label: labels.market }], COLS[3]),
  };

  // Edges: [fromKey, toKey, resource, amount per day]
  const E = [];
  for (const s of supplies) E.push(['sup:' + s.id, 'st:' + s.id, s.unit === 'L' ? 'Water' : 'Feed', rec?.supplyOn?.[s.id] === false ? 0 : s.refill_per_day]);
  const toMarket = {};
  for (const f of scene.flows || []) {
    const st = routeFor(scene, f), k = 'p:' + f.entity, pace = rec ? rec.factor[f.entity] ?? 1 : 1;
    if (f.direction === 'in' && st) E.push(['st:' + st, k, f.resource.en, f.per_day * (rec ? rec.share[st] ?? 1 : 1)]);
    if (f.direction === 'out' && st) E.push([k, 'st:' + st, f.resource.en, f.per_day * pace]);
    if (f.direction === 'out' && !st) (toMarket[k] ??= []).push(f.resource.en);
  }
  for (const [k, res] of Object.entries(toMarket)) E.push([k, 'market', res[0], 1]);

  const maxBy = {};
  for (const [, , r, a] of E) maxBy[r] = Math.max(maxBy[r] || 0, a);
  const width = (r, a) => (a <= 0 ? 1 : 1.5 + 5 * Math.sqrt(a / (maxBy[r] || 1)));

  // Forward arrows are S-curves. Return arrows (outputs back into a store) leave a part on its left,
  // drop down their own lane in the gutter, run along the bottom under every node, and rise into the store.
  // Lanes nest (top part: outer gutter lane, highest bottom lane, rightmost rise) so they never cross.
  let back = 0;
  const path = (a, b) => {
    if (b.x >= a.x) {
      const x1 = a.x + NW, y1 = a.y + NH / 2, x2 = b.x, y2 = b.y + NH / 2, m = (x1 + x2) / 2;
      return `M${x1},${y1} C${m},${y1} ${m},${y2} ${x2},${y2}`;
    }
    const i = back++, r = 5, y1 = a.y + NH / 2, gx = a.x - 10 - (nBack - 1 - i) * 9, ly = HN + 4 + i * LANE;
    const x2 = b.x + NW / 2 + ((nBack - 1) / 2 - i) * 13, y2 = b.y + NH;
    return `M${a.x},${y1} H${gx + r} Q${gx},${y1} ${gx},${y1 + r} V${ly - r} Q${gx},${ly} ${gx - r},${ly} H${x2 + r} Q${x2},${ly} ${x2},${ly - r} V${y2}`;
  };

  const svg = [`<svg viewBox="0 0 406 ${H}" class="loop" role="img" aria-label="${esc(labels.aria)}">`,
    `<defs>${Object.entries(RES).map(([r, v]) => `<marker id="m-${r.replace(/\W/g, '')}" viewBox="0 0 6 6" refX="5" refY="3" markerUnits="userSpaceOnUse" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L6,3L0,6z" fill="${v.color === '#ffffff' ? '#b9c2b8' : v.color}"/></marker>`).join('')}</defs>`];
  for (const [a, b, r, amt] of E) {
    if (!N[a] || !N[b]) continue;
    const col = RES[r]?.color || '#999', stroke = col === '#ffffff' || col === '#f2dfa7' ? '#c9b98f' : col;
    svg.push(`<path d="${path(N[a], N[b])}" fill="none" stroke="${stroke}" stroke-width="${width(r, amt).toFixed(1)}" stroke-opacity="${amt > 0 ? 0.85 : 0.25}" ${amt > 0 ? '' : 'stroke-dasharray="3 3"'} marker-end="url(#m-${r.replace(/\W/g, '')})"><title>${esc((lang === 'ar' ? RES[r]?.ar : r) || r)}</title></path>`);
  }
  for (const n of Object.values(N)) {
    svg.push(`<g class="node${n.pick ? ' pick' : ''}${n.dead ? ' dead' : n.warn ? ' warn' : ''}" data-pick="${n.pick || ''}" transform="translate(${n.x},${n.y})">
      <rect width="${NW}" height="${NH}" rx="8"/>
      <text x="${NW / 2}" y="${n.sub ? 13 : 19}" text-anchor="middle" class="t">${esc(n.label)}</text>
      ${n.sub ? `<text x="${NW / 2}" y="24" text-anchor="middle" class="s">${esc(n.sub)}</text>` : ''}</g>`);
  }
  svg.push('</svg>');
  el.innerHTML = svg.join('');
  el.querySelectorAll('.node.pick').forEach((g) => g.addEventListener('click', () => onPick(g.dataset.pick)));
}
