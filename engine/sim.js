// LearnFarm system simulator. Runs in the browser (viewer) and in Node (agent).
//
// The Python build (engine/build.py) answers "how much does each part need and
// give per day?" from sourced data. This file answers "what happens over time
// when the parts are connected?":
//   - stocks hold things (water tank, feed store, compost heap)
//   - routes connect a flow to a stock (hen manure -> compost heap -> fields)
//   - a part that gets only part of an input produces only that share
//     (Liebig's law of the minimum: the scarcest input sets the pace)
//   - outputs that aren't routed leave the farm (sold at market)
//
//   - a part that goes without an input for too long dies (scene.survival,
//     sourced): a shortfall builds up a deficit in "days without", a full day
//     pays one day back, and when the deficit reaches the limit the part dies
//     for good. Dead parts stop asking and stop producing.
//
// ponytail: daily steps, flat rates, proportional sharing of a short stock, a
// whole group dies at once. No growth curves, harvests or gradual losses yet;
// those arrive with crop models (Phase E).

/** Find the stock a flow is routed to (entity-specific route wins). */
export function routeFor(scene, flow) {
  const routes = scene.routes || [];
  const match = (r) => r.direction === flow.direction && r.resource === flow.resource.en;
  return (routes.find((r) => match(r) && r.entity === flow.entity) || routes.find((r) => match(r) && !r.entity))?.stock || null;
}

/** Settings in force on a given day. changes: [{day, stock, supply: bool}] */
function supplyOn(changes, stock, day) {
  let on = true;
  for (const c of changes) if (c.stock === stock && c.day <= day) on = c.supply;
  return on;
}

/**
 * simulate(scene, {days, changes}) ->
 *   { days: [{day, stocks: {id: level}, share: {stock: 0..1}, factor: {entity: 0..1}, dead: {entity: true}, without: {entity: days}}],
 *     events: [{day, entity, stock, factor}] }  (factor 1 = shortage over; dead: true = died)
 */
export function simulate(scene, { days = 365, changes = [] } = {}) {
  const stocks = Object.fromEntries((scene.stocks || []).map((s) => [s.id, { ...s, level: s.level }]));
  const flows = (scene.flows || []).map((f) => ({ ...f, stock: routeFor(scene, f) }));
  const entities = [...new Set(flows.map((f) => f.entity))];
  const events = [], out = [];
  const short = {}; // entity -> stock it's currently short of (for event de-duplication)
  const limits = (scene.survival || []).map((l) => ({ ...l, stock: routeFor(scene, { entity: l.entity, direction: 'in', resource: { en: l.resource } }) }));
  const deficit = {}, dead = {};

  for (let day = 0; day <= days; day++) {
    // 1. Supplies refill their stocks (well pump, feed deliveries), capped at capacity.
    for (const s of Object.values(stocks))
      if (s.refill_per_day && supplyOn(changes, s.id, day)) s.level = Math.min(s.capacity ?? Infinity, s.level + s.refill_per_day);

    // 2. Everyone asks for what they need; a short stock is shared proportionally.
    const asked = {};
    for (const f of flows) if (f.direction === 'in' && f.stock && !dead[f.entity]) asked[f.stock] = (asked[f.stock] || 0) + f.per_day;
    const share = {};
    for (const [id, need] of Object.entries(asked)) share[id] = need > 0 ? Math.min(1, stocks[id].level / need) : 1;
    for (const [id, need] of Object.entries(asked)) stocks[id].level = Math.max(0, stocks[id].level - need * share[id]);

    // 3. Going without builds a deficit; past the sourced limit, the part dies.
    for (const l of limits) {
      if (dead[l.entity] || !l.stock) continue;
      const k = l.entity + '|' + l.resource, got = share[l.stock] ?? 1;
      deficit[k] = got >= 0.999 ? Math.max(0, (deficit[k] || 0) - 1) : (deficit[k] || 0) + (1 - got);
      if (deficit[k] >= l.days) { dead[l.entity] = true; events.push({ day, entity: l.entity, stock: l.stock, factor: 0, dead: true }); }
    }

    // 4. Each part works at the pace of its scarcest input.
    const factor = {}, limit = {};
    for (const e of entities) {
      factor[e] = 1;
      if (dead[e]) { factor[e] = 0; continue; }
      for (const f of flows) if (f.entity === e && f.direction === 'in' && f.stock && share[f.stock] < factor[e]) {
        factor[e] = share[f.stock]; limit[e] = f.stock;
      }
      if (factor[e] < 0.999 && short[e] !== limit[e]) events.push({ day, entity: e, stock: limit[e], factor: factor[e] });
      if (factor[e] >= 0.999 && short[e]) events.push({ day, entity: e, stock: short[e], factor: 1 });
      short[e] = factor[e] < 0.999 ? limit[e] : null;
    }

    // 5. Outputs: routed ones fill a stock (with an optional conversion), the rest leave the farm.
    for (const f of flows) {
      if (f.direction !== 'out') continue;
      const made = f.per_day * factor[f.entity];
      if (f.stock) {
        const s = stocks[f.stock];
        s.level = Math.min(s.capacity ?? Infinity, s.level + made * (s.convert ?? 1));
      }
    }

    const without = {};
    for (const [k, v] of Object.entries(deficit)) { const e = k.split('|')[0]; without[e] = Math.max(without[e] || 0, v); }
    out.push({ day, stocks: Object.fromEntries(Object.values(stocks).map((s) => [s.id, s.level])), share, factor, dead: { ...dead }, without });
  }
  return { days: out, events };
}

/** Totals up to and including `day` (recomputed cheaply from the daily record). */
export function totalsUpTo(scene, result, day) {
  const flows = scene.flows || [];
  const t = {};
  for (const d of result.days) {
    if (d.day > day) break;
    for (const f of flows) {
      const k = (f.direction === 'in' ? 'in:' : '') + f.resource.en;
      const stock = f.direction === 'in' ? routeFor(scene, f) : null;
      // outputs follow the part's pace; inputs follow how much their stock could give
      const amt = d.dead?.[f.entity] ? 0 : f.per_day * (f.direction === 'out' ? d.factor[f.entity] ?? 1 : stock ? d.share[stock] ?? 1 : 1);
      (t[f.entity] ??= {})[k] = (t[f.entity][k] || 0) + amt;
    }
  }
  return t;
}
