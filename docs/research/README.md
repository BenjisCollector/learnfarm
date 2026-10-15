# Research base

Source-grounded farming facts for the Open Farm engine. Generated 2026-10-15.

- **[notebooklm-facts.md](notebooklm-facts.md)**: answers to 9 topic questions, with every citation mapped to its source.
- **[raw/](raw/)**: the raw NotebookLM JSON (answers, cited passages, source list). Use it to trace any number back to the exact passage.
- **Regenerate:** run `python3 scripts/research/nlm_ask.py`, then `python3 scripts/research/nlm_format.py docs/research/notebooklm-facts.md`. This needs `notebooklm-py` ≥ 0.8.5 and a NotebookLM login.

## How it was made

1. Created the NotebookLM notebook "Open Farm Research".
2. Ran 4 deep web-research passes, importing only cited sources: livestock, crops, infrastructure plus Kuwait/GCC support, and vertical farming. Result: 156 sources, 133 readable, 23 failed to load (mostly Scribd).
3. Asked 9 questions (below), each restricted to "only what the sources confirm, cite every number, say 'not in sources' otherwise."

| Key | Topic |
|---|---|
| A1 | Laying hens, broilers |
| A2 | Goats, sheep, dairy cattle |
| A3 | Rabbits, tilapia |
| C1 | Vegetables (tomato, cucumber, lettuce, pepper, eggplant, okra, onion, potato) |
| C2 | Date palm, alfalfa, wheat, barley, herbs, strawberry |
| I1 | Infrastructure and costs |
| I2 | Kuwait / GCC farmer support |
| V1 | Vertical farming numbers |
| V2 | Vertical farming failures |

## Trust levels (read before using a number)

- `[web]`: an external page. 393 of 466 citations (84%).
- `[AI report]`: NotebookLM's own deep-research summary, which is **not a primary source**. 73 citations (16%). Re-verify these numbers before they go into the engine.
- **Web sources are not all equal.** The best are FAO, MDPI, PMC/NIH, Frontiers, and breed management guides. Weaker ones (blogs, `ideaproof.io`, ResearchGate uploads) need a second source.
- **Some figures are old.** Several Kuwait numbers come from 2012–2016 (for example, subsidies and fish imports). Label the year in the engine, and refresh them before using them in the planner.
- **Rule for the engine:** a number goes into `data/` only with a `[web]` citation from a strong source, or with two independent `[web]` citations.

## Headlines worth knowing

- **Hens in Kuwait heat:** water use rises from 180–240 ml/day at 21 °C to over 600 ml/day at 38 °C. Hy-Line Brown lays 354 eggs to 80 weeks.
- **Kuwait:** about 2,880 farms on about 14,100 ha. Vegetable self-sufficiency is about 51%, but onions are 7%, carrots 2%, and red meat 15%. On-farm brackish-water reverse osmosis (BWRO) desalination costs about $0.33–0.48/m³. Treated wastewater for irrigation costs about $0.28/m³. **New landholding applications were reported suspended.** Confirm the current status with PAAF before the planner assumes anyone can get a plot.
- **Financing:** the Kuwait SME Fund finances up to 80% of capital cost with a 1–3 year grace period.
- **Vertical farming:** a well-run farm uses 10–18 kWh/kg (the industry has averaged about 39). It builds out at $1,000–2,500 per grow m², and energy is 30–40% of operating cost. Viable crops are microgreens, herbs, mushrooms, and specialty strawberries. Lettuce is marginal, and staple crops are impossible.
- **Failures:** Bowery closed in Nov 2024. Plenty went through Chapter 11 in 2025. AeroFarms emerged from Chapter 11 in 2023, then sources report a wind-down in Dec 2025–Jan 2026. 80 Acres filed for Chapter 7 in Aug 2026. Verify the last two directly, because they are recent and come from news sources.
