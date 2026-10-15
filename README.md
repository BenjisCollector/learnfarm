# Open Farm 🌱

**English** · [العربية](README.ar.md)

**Learn farming by talking to your coding agent, and watch the farm come alive as you talk.**

Open Farm is a free, open-source skill pack plus a live 3D simulation. Ask your agent (Claude Code, Codex, Cursor, Gemini CLI) *"what does one chicken need for its whole life?"* and a coop appears beside your chat. Feed goes in, eggs come out, and the days tick by.

When you're ready, tell it your city, budget, and space. It gives you three realistic ways to start your own farm, including vertical farming, with costs, output, payback, and risks.

> **Status: Phase 0 (foundations).** Nothing runs yet. This repo holds the plan, the decisions, and the Scene JSON contract. Follow along or open an issue.

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
| 0 | Name, licenses, Scene JSON v0 ← **you are here** |
| 1 | **Chicken MVP**: one hen, live input/output counters, in Claude Code |
| 2 | Learning track: 8 lessons (soil, water, light, crops, animals, pests, vertical, money) |
| 3 | Real models: Open-Meteo / NASA POWER climate, AquaCrop + WOFOST yields |
| 4 | Planner + vertical farming module (capex, opex, payback, risks) |
| 5 | Every agent + MCP Apps (in-chat UI) → v1.0 |
| 6 | Region packs (GCC first) + community |

The full research and plan are in [docs/OPEN-FARM-PLAN.md](docs/OPEN-FARM-PLAN.md). Decisions are logged in [DECISIONS.md](DECISIONS.md).

## The scene contract

- Schema: [`schema/scene.v0.schema.json`](schema/scene.v0.schema.json)
- Example: [`examples/chicken.scene.json`](examples/chicken.scene.json)
- Check: `python3 scripts/check_scene.py examples/*.json`

## License

Code is [MIT](LICENSE). Data and lessons are [CC BY 4.0](DATA-LICENSE.md).

*Not related to the archived OpenFarm.cc project by FarmBot (shut down April 2025).*
