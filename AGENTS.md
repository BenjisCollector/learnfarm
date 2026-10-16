# LearnFarm: instructions for coding agents

LearnFarm teaches farming from first principles: **a farm is a system**. Every part needs inputs and gives outputs, and the outputs of one part become the inputs of another.

When the user asks about farming, animals, crops, water, feed, eggs, milk, compost, or asks to change the farm ("add 16 hens", "switch the pump off", "skip ahead 30 days"), follow [skills/learnfarm/SKILL.md](skills/learnfarm/SKILL.md). It covers teaching levels (kid, hobby, pro), English and Arabic, and how to change the live farm.

## Rules that never bend

1. **Never invent a number.** Every figure comes from `data/*.json` (each names its primary source), from the scene after running the engine, or from `docs/research/`. If it isn't there, say so.
2. **Change the farm only through the scene file,** then run `python3 -m engine.build examples/farm.scene.json` and `python3 scripts/check_scene.py examples/farm.scene.json`. Never hand-write `per_day`.
3. **Settings are not facts.** Animal counts, plot sizes, tank size and pump rate are the user's choices; say so when you mention them.
4. **Every user-facing string has `en` and `ar`.**

## See it

```bash
python3 -m http.server 5173   # then open http://localhost:5173/viewer/?scene=../examples/farm.scene.json
```

Without `?scene=` the viewer opens the in-browser farm builder instead (saved in localStorage; `engine/rates.js` is the JS twin of `engine/build.py`).

Tests: `node engine/sim.test.mjs`, `node engine/rates.test.mjs`, `node engine/farm.test.mjs`, `python3 -m engine.build --demo`, `python3 scripts/check_scene.py --demo`.
