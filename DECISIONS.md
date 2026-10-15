# Decisions

| Date | Decision | Why |
|---|---|---|
| 2026-10-15 | Name stays **Open Farm**, even though the archived OpenFarm.cc (FarmBot) used it | That project was shut down on 2025-04-21 and its repo is archived. We accept some search overlap |
| 2026-10-15 | Audience: learners **and** would-be owners. The chicken MVP's reception decides whether Phase 2 (learning track) or Phase 4 (planner) comes next | We don't want to guess which group cares more before there is real data |
| 2026-10-15 | Lives on a **personal GitHub** account | Simplest option, with no company IP sign-off needed |
| 2026-10-15 | **English + Arabic from day one.** Every user-facing string has `en` and `ar` | Strong differentiator in the Gulf, and much cheaper than retrofitting later |
| 2026-10-15 | License: MIT for code, CC BY 4.0 for data and lessons | Same model as the data sources we rely on (Open-Meteo, SoilGrids) |
| 2026-10-15 | The LLM never invents numbers. Every flow in a scene must carry a `source` | Trust is the product. Enforced by `scripts/check_scene.py` |
| 2026-10-15 | Scene JSON is the contract between agent and viewer | Lets us swap the agent host or the 3D renderer without touching the other side |
