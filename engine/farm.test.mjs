// node engine/farm.test.mjs: farms built in the browser wizard are valid and, left alone, run without shortages.
import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { makeScene, levelFrom, QUIZ } from '../viewer/setup.js';
import { simulate } from './sim.js';
const j = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const data = { animals: j('../data/animals.json'), crops: j('../data/crops.json'), survival: j('../data/survival.json') };
const cases = [
  { name: 'Small', plot: 100, crops: ['tomato'], animals: { hen: 0, goat: 0, cow: 0 } },
  { name: 'Big', plot: 500, crops: ['tomato', 'lettuce', 'corn'], animals: { hen: 24, goat: 4, cow: 2 } },
  { name: 'Hens', plot: 100, crops: ['lettuce', 'corn'], animals: { hen: 6, goat: 0, cow: 0 } },
];
for (const c of cases) {
  const s = makeScene(c, data), r = simulate(s, { days: 365 });
  assert.equal(s.entities.filter((e) => e.props?.crop).reduce((a, e) => a + e.props.area_m2, 0), c.plot, c.name + ' area');
  assert.deepEqual(r.events, [], c.name + ' should run a year with no shortage: ' + JSON.stringify(r.events.slice(0, 3)));
  const off = simulate(s, { days: 60, changes: [{ day: 0, stock: 'tank', supply: false }] });
  assert.ok(off.events.some((e) => e.dead), c.name + ': with the pump off something dies');
  writeFileSync(`/tmp/lf-${c.name}.json`, JSON.stringify(s));
}
assert.equal(levelFrom(QUIZ.answer), 'pro');
assert.equal(levelFrom([3, 3, 3, 3, 3]), 'kid');
assert.equal(levelFrom([0, 1, 3, 3, 3]), 'hobby');
console.log('farm ok');
