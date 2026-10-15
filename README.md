# Open Farm 🌱

**English** · [العربية](README.ar.md)

**Learn farming by talking to your coding agent, and watch the farm come alive as you talk.**

Open Farm is a free, open-source skill pack plus a live 3D simulation. Ask your agent (Claude Code, Codex, Cursor, Gemini CLI) *"what does one chicken need for its whole life?"* and a coop appears beside your chat. Feed goes in, eggs come out, and the days tick by.

When you're ready, tell it your city, budget, and space. It gives you three realistic ways to start your own farm, including vertical farming, with costs, output, payback, and risks.

> **Status: Phase 1 (chicken MVP).** The pixel viewer, the flow engine, and the Claude Code skill run today. Follow along or open an issue.

## How it works

```
You ⇄ your coding agent ── loads the Open Farm skills
              │
              ▼
        Open Farm MCP server ──► simulation engine (real crop + climate models)
              │
              └── scene.json ──► 3D viewer (side panel, browser tab, or inside Claude/ChatGPT)
```

## Rule #1: the AI never makes up numbers

Every figure (yield, water, cost) comes from a deterministic model or published data, and it carries its `source`. The agent explains. The engine calculates.

## Bilingual from day one

Every name and label in a scene has English and Arabic (`{"en": "...", "ar": "..."}`).

## Roadmap

| Phase | What ships |
|---|---|
| 0 | Name, licenses, Scene JSON v0 |
| 1 | **Chicken MVP**: one hen, live input/output counters, in Claude Code ← **you are here** |
| 2 | Learning track: 8 lessons (soil, water, light, crops, animals, pests, vertical, money) |
| 2.5 | **Farm Challenge**: a decision game. Multiple-choice situations, and the farm plays out the consequences |
| 3 | Real models: Open-Meteo / NASA POWER climate, AquaCrop + WOFOST yields |
| 3.5 | **3D pixel-art renderer**: Three.js at low resolution with cel shading. Same scene, premium look |
| 4 | Planner + vertical farming module (capex, opex, payback, risks), with a map of who already farms indoors in Kuwait and Riyadh |
| 5 | Every agent + MCP Apps (in-chat UI) → v1.0 |
| 6 | Region packs (GCC first) + community |

The full research and plan are in [docs/OPEN-FARM-PLAN.md](docs/OPEN-FARM-PLAN.md). Decisions are logged in [DECISIONS.md](DECISIONS.md).

## See it run

```bash
python3 -m http.server 5173
```

Open http://localhost:5173/viewer/ next to Claude Code, opened in this repo. The viewer re-reads `examples/farm.scene.json` every second. Say "add 16 more hens and make it rain": the `open-farm` skill ([skills/open-farm/SKILL.md](skills/open-farm/SKILL.md), linked into `.claude/skills/`) edits the scene, runs the engine, and the pixel farm updates within about a second. Load a different scene with `?scene=../examples/chicken.scene.json`.

## The engine

Flows are never typed by hand. `data/animals.json` and `data/crops.json` hold per-head and per-m² rates, each citing [docs/research](docs/research/README.md). The engine multiplies them by `props.count` or `props.area_m2`:

```bash
python3 -m engine.build examples/farm.scene.json
```

`--check` exits 1 if any flow is stale, and `--demo` runs the self-check.

Three screens: **Farm** (a top-down map you can tap), **Weather** (an animated sky with 5 modes), and **Flows** (inputs and outputs with a play button that runs the days forward). English and Arabic come with RTL.

## The scene contract

- Schema: [`schema/scene.v0.schema.json`](schema/scene.v0.schema.json)
- Example: [`examples/chicken.scene.json`](examples/chicken.scene.json)
- Check: `python3 scripts/check_scene.py examples/*.json` and `python3 -m engine.build --check examples/*.json`

## License

Code is [MIT](LICENSE). Data and lessons are [CC BY 4.0](DATA-LICENSE.md).

*Not related to the archived OpenFarm.cc project by FarmBot (shut down April 2025).*
