// node engine/rates.test.mjs: the JS engine must rebuild the checked-in examples exactly as build.py did.
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { build } from './rates.js';
const j = p => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const d = { animals: j('../data/animals.json'), crops: j('../data/crops.json'), survival: j('../data/survival.json') };
for (const f of ['../examples/farm.scene.json', '../examples/chicken.scene.json']) {
  const s = j(f), b = build(s, d);
  assert.deepEqual(b.flows, s.flows, f + ' flows');
  if (s.survival) assert.deepEqual(b.survival, s.survival, f + ' survival');
}
console.log('rates ok');
