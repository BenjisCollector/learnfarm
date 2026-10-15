# Roadmap

Open Farm teaches one idea from first principles: **a farm is a system**. Every part needs inputs and gives outputs, and the outputs of one part become the inputs of another. Each phase below makes that idea more visible, more truthful, or more personal. Each one ends in something you can see.

Status: ✅ done · 🔨 in progress · ⏳ next · 📋 planned

| Phase | What ships | Done when | Status |
|---|---|---|---|
| **0. Foundations** | Name, licenses, scene format, research base (156 sources, primary-source audit) | Every rate cites a primary source | ✅ |
| **1. First viewer** | 2D pixel map, sourced rate engine, farm-teacher skill, website | Agent edits the farm and the view updates live | ✅ |
| **A. System engine** | Stocks (feed store, water tank, compost heap), links between parts (manure → compost → fields), shortages, plot sizes and capacities | Cut the water and egg output drops the next day, with the reason shown | ✅ |
| **B. 3D diorama** | Three.js farm diorama (toon shading, outlines, isometric camera that turns in 90° steps), free CC0 models, block-style pixel icons for every animal, crop and resource, flow beads between parts, tap any part to see its own flows and inputs → process → outputs. Tester findings and next fixes: [docs/PHASE-B-REVIEW.md](docs/PHASE-B-REVIEW.md) | Someone with zero farming knowledge can point at the screen and explain the loop | ✅ |
| **C. Learning path** | Concept map (sunlight, water balance, feed conversion, nutrient loop, energy, money), saved progress the agent reads and updates, adaptive lessons and checks played on the diorama | Two learners who start differently get different next lessons | 📋 |
| **D. Farm Challenge** | Decision game: situations with multiple-choice answers, the farm plays out each choice, scored recap with sources | A 15-minute run teaches at least 3 things | 📋 |
| **E. Real world** | Live weather (Open-Meteo), crop models (AquaCrop, WOFOST), heat effects on animals, refreshed Kuwait data | The same farm behaves differently in Kuwait and the Netherlands | 📋 |
| **F. Planner** | Your city, budget and space give three options (backyard, greenhouse, vertical farm) with costs, output, payback and risks. **Your own plot:** draw its outline on a satellite map (the area is measured for you) or describe it to the AI ("20 by 30 m, sandy, a well on the north side"), and the farm is laid out on your real land | 10 real people find their plan believable | 📋 |
| **G. Launch** | In-chat UI (MCP Apps) for Claude and ChatGPT, Arabic polish, Gulf region packs, community scenarios | v1.0 public | 📋 |

## Principles that don't change

1. **The AI never makes up numbers.** Facts come from primary sources and the open engine. Choices you make (how many hens, how big the tank) are labelled as your settings, never as facts.
2. **Beginners first.** Plain words, one idea per screen, every term explained where it appears.
3. **The system is the lesson.** Nothing is shown alone. Every input says where it comes from and every output says where it goes.
4. **English and Arabic, phone and desktop,** from day one.

This replaces the phase list in [docs/OPEN-FARM-PLAN.md](docs/OPEN-FARM-PLAN.md), which stays as the original research and reasoning.
