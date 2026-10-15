// Self-check for engine/sim.js. Run: node engine/sim.test.mjs
import assert from 'node:assert/strict';
import { simulate, totalsUpTo, routeFor } from './sim.js';

const scene = {
  stocks: [
    { id: 'tank', unit: 'L', level: 100, capacity: 1000, refill_per_day: 50 },
    { id: 'heap', unit: 'kg', level: 0, capacity: 1000, convert: 0.5 },
  ],
  routes: [
    { resource: 'Water', direction: 'in', stock: 'tank' },
    { resource: 'Manure', direction: 'out', stock: 'heap' },
  ],
  flows: [
    { entity: 'hens', direction: 'in', resource: { en: 'Water' }, unit: 'L', per_day: 50 },
    { entity: 'hens', direction: 'out', resource: { en: 'Eggs' }, unit: 'eggs', per_day: 10 },
    { entity: 'hens', direction: 'out', resource: { en: 'Manure' }, unit: 'kg', per_day: 4 },
  ],
};

assert.equal(routeFor(scene, scene.flows[0]), 'tank');
assert.equal(routeFor(scene, scene.flows[1]), null, 'eggs leave the farm');

// Supply equals demand: steady state, full output, manure becomes compost at 50%.
let r = simulate(scene, { days: 10 });
assert.equal(r.days[10].factor.hens, 1);
assert.equal(r.days[10].stocks.tank, 100);
assert.equal(r.days[10].stocks.heap, 4 * 0.5 * 11);
assert.equal(r.events.length, 0);

// Pump off from day 3: the tank's 100 L lasts 2 days, then the hens get nothing.
r = simulate(scene, { days: 10, changes: [{ day: 3, stock: 'tank', supply: false }] });
assert.equal(r.days[4].factor.hens, 1);
assert.equal(r.days[5].factor.hens, 0, 'no water, no eggs');
assert.deepEqual(r.events[0], { day: 5, entity: 'hens', stock: 'tank', factor: 0 });

// Pump back on at day 8: half the need arrives each day.
r = simulate(scene, { days: 10, changes: [{ day: 3, stock: 'tank', supply: false }, { day: 8, stock: 'tank', supply: true }] });
assert.equal(r.days[8].factor.hens, 1, 'refill (50) covers the day');
assert.equal(r.events.at(-1).factor, 1, 'recovery is reported');

const t = totalsUpTo(scene, r, 10);
assert.equal(t.hens.Eggs, 10 * (11 - 3), '3 dry days produced nothing');
// Death: hens survive 2 days without water. Pump off from day 3, tank dry from day 5.
const mortal = { ...scene, survival: [{ entity: 'hens', resource: 'Water', days: 2, source: 'test' }] };
r = simulate(mortal, { days: 10, changes: [{ day: 3, stock: 'tank', supply: false }, { day: 8, stock: 'tank', supply: true }] });
assert.equal(r.days[5].dead.hens, undefined, 'one dry day: still alive');
assert.equal(r.days[6].dead.hens, true, 'two dry days: dead');
assert.ok(r.events.some((e) => e.dead && e.day === 6));
assert.equal(r.days[9].factor.hens, 0, 'water returns, but the dead stay dead');
assert.equal(r.days[9].stocks.tank, 50 * 2, 'the dead stop drinking, so the tank fills');
// A short drought within the limit is survived, and the deficit pays back.
r = simulate({ ...scene, survival: [{ entity: 'hens', resource: 'Water', days: 5, source: 'test' }] }, { days: 10, changes: [{ day: 3, stock: 'tank', supply: false }, { day: 8, stock: 'tank', supply: true }] });
assert.equal(Object.keys(r.days[10].dead).length, 0);
assert.equal(r.days[10].without.hens, 0);
console.log('sim ok');
