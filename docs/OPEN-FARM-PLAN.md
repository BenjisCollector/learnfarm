# Open Farm: research, architecture, roadmap, LinkedIn plan

Drafted 2026-10-15. Research is from web searches on that date, and star counts are approximate.

---

## 1. Short version

- **No existing project does all three parts**: (a) a prompt/skill library you install in your coding agent, (b) a live 3D farm that reacts while you chat, (c) a planner that turns your location and budget into a farm plan. The pieces exist separately, and Open Farm would be the glue.
- **The name has history.** OpenFarm (openfarm.cc) was a crop-growing wiki that came out of FarmBot. Its servers were shut down on 2025-04-21 and the GitHub repo was archived. The name is free in practice, but search results and the old domain will collide. Options: keep "Open Farm" (two words, own domain), or pick something like `openfarm-sim` or "OpenAcre". **Your call.**
- **Build the agent as the teacher and the simulation engine as the source of truth.** The LLM narrates and asks questions. Every number (yield, water, cost) comes from a deterministic model and shows its source. That is what makes the project trustworthy and worth starring.

---

## 2. What already exists

### Farm simulation and agriculture software

| Project | What it is | What to use from it |
|---|---|---|
| [CropForge](https://cropforge.readthedocs.io/) | Python 3.12+ virtual farm experiments as code, with a **Three.js viewport** fed by Float32Array buffers | Closest technical match. Study its Python-to-Three.js data path |
| [PCSE / WOFOST](https://pypi.org/project/PCSE/) (Wageningen) | The standard crop growth models (phenology, photosynthesis, water), EUPL license, YAML agro-management | Field crop yield engine |
| [AquaCrop-OSPy](https://github.com/aquacropos/aquacrop) | Python version of FAO AquaCrop, `pip install aquacrop`, focused on water and irrigation | Water-limited yield. Ideal for arid regions like the Gulf |
| [farmOS](https://github.com/farmOS/farmOS) | Drupal-based farm records and planning, GPL | Data model for assets, logs, and plans. Possible export target |
| [OpenFarm (archived)](https://farm.bot/blogs/news/sunsetting-openfarm) | Crop "growing guides" wiki, Ruby, MIT | Seed crop data for crop cards (**check the data license**) |
| [WoTSimFarm](https://github.com/relu91/WoTSimFarm) | Small digital-farm simulation for Web of Things | Sensor-style simulation ideas |
| [nathaliejeans/verticalfarming](https://github.com/nathaliejeans/verticalfarming), [farmup](https://github.com/quentinguidee/farmup) | Small educational and vertical-farm games | Proof that the gap exists, since both are tiny |
| Waldron, Cardiff PhD 2021 ([ORCA](https://orca.cardiff.ac.uk/146198)) | Open-source vertical farm energy-balance model (lights, HVAC, humidity) | Method for the vertical-farm energy module |
| Shao et al., VFer ([Nottingham](https://eprints.nottingham.ac.uk/35019/)) | Vertical farm cost and ROI method | Method for the economics module (not open source) |

**Gap confirmed:** I found no mature open-source vertical-farm simulator or economics calculator. That module alone is a reason for people to care about the project.

### Prompt and skill libraries (how to structure it)

| Repo | Structure | Lesson for Open Farm |
|---|---|---|
| [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman) (~100K stars) | Several `skills/<name>/SKILL.md`, intensity levels (lite/full/ultra), one-line install `npx skills add`, works across about 30 agents | One memorable idea, levels, a one-line install, and multi-agent support. Copy all of that |
| [obra/superpowers](https://github.com/obra/superpowers) | `.claude-plugin/` manifest, skills, hooks (session start), commands, subagents | Use a session-start hook to load the "farm teacher" persona. Commands like `/farm-plan` |
| [anthropics/skills](https://github.com/anthropics/skills) | `skills/`, `spec/`, `template/`, one folder per skill with SKILL.md | Follow the Agent Skills spec so every host can load it |
| [danielmiessler/fabric](https://github.com/danielmiessler/fabric) (~40K stars) | `/patterns/<name>/system.md`, one Markdown file per task, plus a server | Lessons as plain Markdown that the community can PR |

### Agent drives a live canvas (the "simulation on the right" part)

| Project | Pattern |
|---|---|
| [Hello3DLLM](https://github.com/aidenlab/Hello3DLLM) | MCP server pushes scene changes over **WebSocket** to a Three.js page. The simplest template |
| [mcp_excalidraw](https://glama.ai/mcp/servers/yctimlin/mcp_excalidraw) | Separate canvas server and MCP server kept in sync. Proven agent-drives-canvas setup |
| maige-3d-mcp | MCP control of live Three.js, R3F, and Babylon scenes from Claude, Cursor, and Copilot |
| Three.js DevTools MCP | Agent inspects and mutates a live WebGL scene |
| [MCP Apps](https://workos.com/blog/2026-01-27-mcp-apps) (official extension, Jan 2026) | Tool returns a `ui://` resource that renders **inside** Claude and ChatGPT chats as a sandboxed iframe. Supported in Claude, ChatGPT, VS Code, Goose |

### Open data (location → climate → soil)

- **Open-Meteo**: free, no API key, 80 years of history, CC BY 4.0. The free tier is non-commercial, and attribution is required.
- **NASA POWER**: solar and climate baselines (coarse grid). Over 434M agriculture API requests since 2019.
- **SoilGrids (ISRIC)**: CC BY 4.0, **but the REST API is paused**. Use the WCS endpoint or GeoTIFF downloads instead.

---

## 3. Architecture

```
open-farm/
├── skills/                      # the "caveman layer": works in any coding agent
│   ├── open-farm/SKILL.md       # main persona: farm teacher, levels: kid / hobby / pro
│   ├── farm-learn/SKILL.md      # runs the curriculum track
│   ├── farm-plan/SKILL.md       # intake interview → plan
│   ├── farm-vertical/SKILL.md   # vertical farming deep dive
│   └── farm-animals/SKILL.md    # livestock input/output (starts with the chicken)
├── .claude-plugin/plugin.json   # + /farm-learn /farm-plan commands, session-start hook
├── mcp/                         # TypeScript MCP server: the bridge
│   └── tools: scene_set, scene_add, sim_step, sim_reset,
│              climate_lookup, crop_simulate, livestock_simulate,
│              vertical_simulate, econ_estimate, plan_export
├── engine/                      # Python, deterministic, tested: the truth
│   ├── crops/      (PCSE/WOFOST + AquaCrop wrappers)
│   ├── livestock/  (I/O tables: feed, water, eggs, manure...)
│   ├── vertical/   (DLI, photoperiod, kWh/kg, HVAC load)
│   └── econ/       (capex, opex, revenue, payback, sensitivity)
├── viewer/                      # React Three Fiber app (localhost:5173)
│   └── scene.json in → animated farm out, plus I/O counters and charts
├── data/                        # crop cards, animal cards, region packs (CC BY)
│   └── regions/kuwait.yaml ...
└── curriculum/                  # lessons as Markdown + scene scripts + quiz
```

**Conversation flow:**

```
You ⇄ coding agent (Claude Code / Codex / Cursor / Gemini CLI)
          │ loads skills/open-farm
          ▼
      MCP server ──calls──► engine (Python) ──numbers──┐
          │                                            │
          └── scene.json over WebSocket ──► viewer (side panel / browser tab)
                                          └─ or MCP Apps iframe inside Claude/ChatGPT chat
```

**Design rules**

1. **A Scene JSON schema is the contract.** The agent only edits scene state (add a coop, plant 40 m² of tomatoes, advance 30 days). The viewer only renders it. Each side can be swapped without touching the other.
2. **The LLM never invents numbers.** Any figure in the chat comes from an engine call and carries `source:` (WOFOST, AquaCrop, Open-Meteo, a published table).
3. **Time is a slider.** `sim_step(days)` lets learners watch a season pass in 20 seconds. That moment is where the "aha" happens.
4. **Three host modes, one server:** (a) browser tab next to the terminal, (b) VS Code Simple Browser panel, (c) MCP Apps inline in Claude and ChatGPT for non-coders. Mode (c) is how you reach people who will never open a terminal.

---

## 4. Roadmap (about 12 months, part time)

**Phase 0: Decisions (weeks 1–2)**
- Name and domain, license (MIT for code, CC BY 4.0 for data and lessons), Scene JSON v0.
- Exit: empty repo with README, schema, and a 30-second mock GIF.

**Phase 1: The Chicken MVP (weeks 3–6)**
- One skill, one MCP server, one viewer scene: a coop with a hen.
- Inputs and outputs animate as you chat: feed in, eggs out, manure out, day counter running. Uses the lifetime numbers from our chicken conversation (about 55 kg of feed in, about 330 eggs out).
- Works in Claude Code first.
- Exit: a demo video of you asking "what does one hen need for a lifetime?" while the coop runs. **This is the launch post.**

**Phase 2: Learning track v1 (weeks 7–12)**
- 8 lessons, each made of a skill section, a scene script, and a 3-question check: soil, water, sun and light (DLI), seeds and crops, animals, pests, vertical farming, money.
- Levels like caveman: `kid`, `hobby`, `pro`.
- Exit: someone with no farming background finishes the track in about 2 hours.

**Phase 3: Real models (months 4–5)**
- Location → Open-Meteo / NASA POWER climate.
- AquaCrop-OSPy for water-limited crops, PCSE/WOFOST for field crops.
- SoilGrids through WCS.
- Exit: the same tomato plot gives clearly different yields in Kuwait City and the Netherlands, with sources shown.

**Phase 4: Planner + vertical module (months 5–7)**
- Intake interview: location, budget, space (m² or "a balcony"), water access, hours per week, goal (feed my family / side income / business).
- Output: **three options** (for example, backyard hens + raised beds / a greenhouse / a container vertical farm), each with capex, monthly opex, expected output, payback period, and the top 3 risks.
- Vertical module: lighting kWh/kg, local electricity price, a crop shortlist (leafy greens, herbs, microgreens, strawberries).
- Includes a **"why vertical farms failed" section**: Bowery shut down in 2024, AeroFarms went bankrupt and then recovered, and Plenty fell from a $1.9B valuation to under $15M. Energy cost and commodity pricing caused most of it.
- Export: a PDF plan, and a farmOS-compatible JSON.
- Exit: 10 real people run the planner and say the plan is believable.

**Phase 5: Every agent + v1.0 launch (months 7–9)**
- Packaging for Codex, Cursor, and Gemini CLI. `npx skills add yourname/open-farm`.
- MCP Apps UI for Claude.ai and ChatGPT.
- Exit: v1.0 release, Product Hunt and Hacker News posts, a launch video.

**Phase 6: Community + regions (months 9–12)**
- Region packs as pull requests, the way Fabric takes patterns: **GCC/Kuwait first** (heat, desalinated water cost, imported feed).
- Arabic localization.
- School and university pilots.
- Exit: 10 or more external contributors and 3 region packs.

**Scope guard:** if something doesn't make the chicken MVP or the planner better, it waits. Multiplayer, VR, IoT sensors, and marketplaces are not on the roadmap.

**Risks**

| Risk | Mitigation |
|---|---|
| People treat the plan as financial advice | Clear disclaimer, ranges instead of single numbers, "talk to a local extension office" |
| Model accuracy | Cite every number, ship with tests against published model outputs |
| Name collision with archived OpenFarm | Decide in Phase 0 |
| 3D work eats the schedule | Low-poly kit assets, and ship 2D counters before pretty 3D |
| API terms (Open-Meteo is non-commercial on the free tier) | Self-host or pay before any commercial use |

---

## 5. LinkedIn series: "We need more farmers" + building Open Farm in public

Cadence: 2 posts a week for about 10 weeks. Mix: about 40% problem/awareness, 40% build-in-public, 20% lessons. Every number below is sourced. Check them again before posting.

**Awareness**

1. **Hook:** "The average American farmer is 58 years old. Only 9% are under 35." (USDA 2022 Census.) Who feeds us in 20 years? Close with: I'm building a free tool to make farming learnable.
2. **Hook:** "Kuwait imports about 95% of its food." In January 2022, shipping one ton of food to Kuwait went from $1,400 to $14,000. Food security is a supply-chain problem, not a wealth problem.
3. **Hook:** "The GCC imports up to 85% of its food." (WEF 2025.) What happens when a shipping lane closes? Domestic production, even small-scale, is resilience.
4. **Hook:** "One chicken. 55 kg of feed. 330 eggs." The input/output view of a hen's life. Carousel-style post built from the chicken breakdown. This is your most shareable post.
5. **Hook:** "Vertical farming burned billions. Here's what actually went wrong." Bowery, AeroFarms, Plenty. Energy plus commodity crops. Then what works: premium crops near the customer. Honest posts get more trust than hype.
6. **Hook:** "You don't need land to start farming. You need a balcony and 4 hours of sun." Small-start ladder: herbs → microgreens → hens → greenhouse.

**Build in public**

7. **Hook:** "I'm building Open Farm: learn farming by talking to an AI, and watch the farm move as you talk." Announcement with the mock GIF and a link to star the repo.
8. **Hook:** "Rule #1 of Open Farm: the AI is not allowed to make up numbers." Why the engine is separate from the LLM. Strong post for a tech audience, and it fits your Microsoft/Azure positioning.
9. **Hook:** "I asked my coding agent what a chicken needs for a lifetime. Then I watched it live." The MVP demo video. Native video does best.
10. **Hook:** "Same tomato, two cities: Kuwait vs. the Netherlands." Climate data → yield difference, shown side by side.
11. **Hook:** "Tell it your city and budget. It tells you which farm you can actually afford." Planner demo with a real Kuwait example.
12. **Hook:** "Open Farm v1.0 is live, free and open source." Launch post: what it does, who it's for, how to contribute a region pack.

**Lessons**

13. "What a Caveman prompt taught me about shipping AI tools": one idea, one-line install, levels.
14. "MCP Apps let an AI show you a farm inside the chat." A short explainer for the non-coder audience.
15. "3 things I got wrong building a farm simulator." Post this after Phase 3.

**Format tips:** first line under about 12 words, one idea per post, a visual every time (GIF, carousel, or video), and the link in the first comment rather than the post body.

---

## 6. Open questions for you

1. Keep the name "Open Farm" despite the archived OpenFarm.cc, or pick a fresh name?
2. Is the main audience learners (education first) or would-be farm owners (planner first)? This changes which of Phase 2 and Phase 4 comes first.
3. Is this personal (your GitHub), Mufeed, or DIYAR? This affects licensing and LinkedIn framing.
4. Which language comes first: English only, or Arabic from day one?

---

## Sources

- CropForge: https://cropforge.readthedocs.io/
- PCSE: https://pypi.org/project/PCSE/ · WOFOST: https://csdms.colorado.edu/wiki/Model:WOFOST
- AquaCrop-OSPy: https://github.com/orgs/aquacropos/repositories
- farmOS: https://github.com/farmOS/farmOS
- OpenFarm sunset: https://farm.bot/blogs/news/sunsetting-openfarm
- Vertical farming repos: https://github.com/nathaliejeans/verticalfarming · https://github.com/quentinguidee/farmup
- Waldron thesis: https://orca.cardiff.ac.uk/146198 · VFer: https://eprints.nottingham.ac.uk/35019/
- Caveman: https://claudeskills.info/skills/juliusbrussee/caveman/ · https://github.com/JuliusBrussee
- Superpowers: https://www.mintlify.com/obra/superpowers/development/architecture
- Anthropic skills: https://www.verdent.ai/guides/claude-skills-github-repository
- Fabric: https://www.star-history.com/danielmiessler/fabric
- Hello3DLLM: https://github.com/aidenlab/Hello3DLLM · mcp_excalidraw: https://glama.ai/mcp/servers/yctimlin/mcp_excalidraw
- Three.js DevTools MCP: https://lobehub.com/mcp/dmitriygolub-threejs-devtools-mcp
- MCP Apps: https://workos.com/blog/2026-01-27-mcp-apps · https://www.theregister.com/2026/01/26/claude_mcp_apps_arrives
- Open-Meteo: https://open-meteo.com/en/pricing · NASA POWER: https://power.larc.nasa.gov/article/data-fuels-resilient-farming-and-richer-harvests/ · SoilGrids: https://docs.isric.org/globaldata/soilgrids/
- Vertical farm failures: https://www.ucl.ac.uk/news/2025/jan/analysis-five-reasons-why-vertical-farming-still-future-despite-recent-business-failures · https://www.aerofarms.com/aerofarms-turned-itself-around-after-bankruptcy-is-it-a-sign-that-vertical-farming-can-succeed/
- GCC food imports: https://weforum.org/stories/2025/02/gulf-food-security-innovation · https://www.agbi.com/analysis/food-security-report-delivers-stark-warning-to-import-reliant-gulf/
- USDA farmer age: https://www.croplife.com/?p=98400
