// Browser mirror of engine/build.py: flows and survival limits from data/, never by hand.
// Same math: animals = per-head rate x count; crops = per-m2 season figure x area / season_days.
// ponytail: links come only from each rate's urls (all data rates carry them); the NotebookLM
// citation fallback in build.py needs docs/research/raw and stays Python-only.

// Python round(x, 3): correct digits, exact ties go to even (0.8125 -> 0.812)
function r3(x) {
  const t = x.toFixed(20).match(/^(-?\d+\.\d{3})50*$/);
  if (!t) return Number(x.toFixed(3));
  const lo = Number(t[1]);
  return +t[1].slice(-1) % 2 ? Number((lo + Math.sign(x) * 0.001).toFixed(3)) : lo;
}

function flow(entity, rate, perDay, how, scale) {
  const f = { entity, direction: rate.direction, resource: rate.resource, unit: rate.unit,
    per_day: r3(perDay), source: `${rate.source}; ${how}` };
  if (rate.range) f.range = rate.range.map(v => r3(v * scale));
  if (rate.trust) f.trust = rate.trust;
  if (rate.urls?.length) f.links = rate.urls.map(u => ({ title: u, url: u }));
  return f;
}

export function computeFlows(scene, animals, crops) {
  const flows = [], covered = new Set();
  for (const e of scene.entities || []) {
    const p = e.props || {};
    if (animals[e.kind]) {
      const n = p.count ?? 1;
      covered.add(e.id);
      for (const r of animals[e.kind]) flows.push(flow(e.id, r, r.per_head_day * n, `x ${n} head`, n));
    } else if (crops[p.crop] && p.area_m2) {
      const c = crops[p.crop], days = c.season_days, a = p.area_m2;
      covered.add(e.id);
      for (const r of c.rates) flows.push(flow(e.id, r, r.per_m2_season * a / days, `x ${a} m2 / ${days} days`, a / days));
    }
  }
  return [...flows, ...(scene.flows || []).filter(f => !covered.has(f.entity))];
}

export function survivalFor(scene, lim) {
  const out = [];
  for (const e of scene.entities || []) {
    for (const l of lim[e.props?.crop || e.kind] || []) {
      const it = { entity: e.id, resource: l.resource, days: l.days, source: l.source };
      if (l.range) it.range = l.range;
      if (l.basis) it.basis = l.basis;
      if (l.urls?.length) it.links = l.urls.map(u => ({ title: u, url: u }));
      out.push(it);
    }
  }
  return out;
}

export async function loadData(base) {
  const get = f => fetch(new URL(f, base)).then(r => r.json());
  const [animals, crops, survival] = await Promise.all(['animals.json', 'crops.json', 'survival.json'].map(get));
  return { animals, crops, survival };
}

// Fill a scene's flows and survival from the data, like `python3 -m engine.build`.
export function build(scene, d) {
  return { ...scene, flows: computeFlows(scene, d.animals, d.crops), survival: survivalFor(scene, d.survival) };
}
