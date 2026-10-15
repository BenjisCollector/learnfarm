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
| 2026-10-15 | Viewer is **pixel art on a 2D canvas**, not Three.js. Style follows a top-down farm map + animated weather scene reference | Flat pixel art doesn't need a 3D engine. Canvas is smaller, faster, and needs no build step. Three.js can return for an isometric view later |
| 2026-10-15 | Added **Phase 2.5 Farm Challenge**: a multiple-choice decision game where the sim plays out each choice | Testing knowledge through consequences sticks better than quizzes, and it reuses the same scene and viewer |
| 2026-10-15 | Target look is **3D pixel art** (Three.js low-res render + cel shading), built in Phase 3.5. The 2D canvas stays until then | Yousef wants a look that's taken seriously. 3D pixel art reads premium and distinctive, and the Scene JSON contract means only the renderer changes |
| 2026-10-15 | **New roadmap (ROADMAP.md)**: A system engine, B 3D diorama, C learning path, then challenge, real world, planner, launch | The app showed numbers next to a picture but didn't teach that a farm is a system. Stocks, links and shortages come first because the diorama and lessons depend on them |
| 2026-10-15 | Python engine computes per-part daily rates (facts). A JS simulator runs time, stocks and links in the browser | Beginners need to press play and see a shortage happen without an agent, and the facts stay in one place |
