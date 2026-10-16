# Research base

Source-grounded farming facts for the LearnFarm engine. Generated 2026-10-15.

- **[notebooklm-facts.md](notebooklm-facts.md)**: answers to 9 topic questions, with every citation mapped to its source.
- **[raw/](raw/)**: the raw NotebookLM JSON (answers, cited passages, source list). Use it to trace any number back to the exact passage.
- **Regenerate:** run `python3 scripts/research/nlm_ask.py`, then `python3 scripts/research/nlm_format.py docs/research/notebooklm-facts.md`. This needs `notebooklm-py` ≥ 0.8.5 and a NotebookLM login.

## How it was made

1. Created the NotebookLM notebook "LearnFarm Research".
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

## Primary sources behind data/ (audit, 2026-10-15)

Every rate in `data/animals.json` and `data/crops.json` now carries a `urls` list pointing at a primary source, and `engine/build.py` shows those links before any NotebookLM citation. Each range was read from the page itself.

- **Hens:** [Hy-Line Brown Commercial Layers guide, Dec 2025](https://www.hyline.com/filesimages/Hy-Line-Products/Hy-Line-Product-PDFs/Brown/BRN%20STD%20ENG.pdf) for feed, water and eggs. Manure from [USDA NRCS AWMFH ch. 4](https://directives.nrcs.usda.gov/sites/default/files2/1712930943/17165.pdf) and [Utah State Extension](https://extension.usu.edu/agwastemanagement/files/How_Much_Manure_Revised_Red.pdf).
- **Dairy cows:** [NMSU Guide D-107](https://pubs.nmsu.edu/_d/D107/index.html) for feed, water and milk. Manure from USDA NRCS Table 4-5.
- **Dairy goats:** [Alabama Extension ANR-2457](https://www.aces.edu/blog/topics/sheep-goats/dairy-goat-and-sheep-nutrition-and-forages/) for feed and water, [Penn State Extension, Dairy Goat Production](https://wpcdn.web.wsu.edu/wp-extension/uploads/sites/2056/2023/05/Dairy-Goat-Production.pdf) for milk, Utah State Extension for manure.
- **Sheep:** [Oregon State Extension](https://extension.oregonstate.edu/es/node/200226/printable/print) for feed, [SDSU Extension](https://extension.sdstate.edu/sheep-water-requirements-and-quality-testing) for water, Utah State Extension and USDA NRCS for manure.
- **Tomato:** [FAO Irrigation and Drainage Paper 66](https://fao.org/4/i2800e/i2800e.pdf) for water, yield and season.
- **Lettuce:** [Arizona Extension AZ2144](https://extension.arizona.edu/sites/default/files/2025-08/az2144-2025_Estimating-Crop-Evapotranspiration-Using-Lettuce-Crop-Coefficients-for-Irrigation-Scheduling-in-Yuma-Arizona.pdf) for water, [UC Cooperative Extension Imperial County](https://ccfruitandnuts.ucanr.edu/sites/default/files/2011-06/108156.pdf) for yield and season.

**Lesson from the audit:** NotebookLM tagged the cow, goat and sheep numbers `[web]` and cited an MDPI paper, but the cited passages contain none of those numbers. A `[web]` tag only means the citation points at a web page. It does not mean the page holds the number. Check the passage before trusting it.

The headlines above are NotebookLM's summary. Where they differ from `data/`, `data/` wins.

## Still unverified

None. All 19 rates in `data/` have a primary source.
