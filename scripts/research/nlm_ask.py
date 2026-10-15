"""Ask the Open Farm Research notebook each question, save answer + references (JSON)."""
import json, subprocess, sys
from pathlib import Path

NB = "7b5c1c86"
OUT = Path(__file__).resolve().parents[2] / "docs/research/raw"
RULE = (" Use ONLY what the sources confirm and cite every number. If a value is not in the "
        "sources, write 'not in sources'. Answer as a markdown table plus short notes.")
Q = {
 "A2": "For DAIRY GOATS, MEAT GOATS, SHEEP and DAIRY CATTLE: daily dry-matter feed (kg or % body weight), daily water (L) in normal and hot weather, shelter space per head (m2), heat stress threshold (THI or temperature), lifespan / productive years, gestation length, offspring per birth, milk yield per day or lactation, slaughter age and weight, manure per head per day.",
 "A3": "For meat RABBITS and TILAPIA aquaculture: daily feed, water needs (or water quality for tilapia: temperature, dissolved oxygen, stocking density per m3), space per animal, time to market and market weight, feed conversion ratio, breeding/reproduction rate, ideal and lethal temperatures, and any aquaponics data.",
 "C1": "For TOMATO, CUCUMBER, LETTUCE, SWEET PEPPER, EGGPLANT, OKRA, ONION and POTATO: seasonal water requirement (mm), optimal and maximum temperature, light needs (DLI or hours), soil type and pH, days to harvest, typical yield per m2 or per hectare (open field vs greenhouse), and salinity tolerance. Note anything specific to hot arid climates like Kuwait.",
 "C2": "For DATE PALM, ALFALFA, WHEAT, BARLEY, and common HERBS (basil, mint, parsley) and STRAWBERRY: water requirement, temperature range, salinity tolerance, days to harvest or years to first yield, typical yield per hectare or per tree, and suitability for Kuwait and the Gulf.",
 "I1": "Small farm infrastructure: costs and specifications for greenhouses, shade houses and net houses, drip irrigation, evaporative (fan and pad) cooling, poultry housing, water sources (groundwater salinity, desalinated water cost, treated wastewater) and energy needs in hot climates. Give cost ranges with currency and year where stated.",
 "I2": "Kuwait and GCC support for farmers: what PAAF (Public Authority for Agriculture Affairs and Fish Resources) and other bodies provide (land plots, subsidies, loans, fodder support, water), eligibility, regulations, food import dependence figures, and current agriculture production numbers in Kuwait.",
 "V1": "Vertical farming and hydroponics: energy use per kg of produce (kWh/kg), LED efficacy (umol/J), yields per m2 per year vs open field and greenhouse, water use per kg, capital cost per m2, operating cost breakdown (energy, labor, rent), which crops are economically viable, and typical selling price needed to break even.",
 "V2": "Why did AeroFarms, Bowery, Plenty, Infarm, AppHarvest and other vertical farming companies fail or restructure? Give dates, amounts raised, causes, and the lessons for a small new grower, plus examples of vertical or controlled-environment farms in the Gulf.",
}
for key, q in Q.items():
    if (OUT / f"{key}.json").exists():
        continue
    r = subprocess.run([sys.executable, "-m", "notebooklm", "ask", "-n", NB, "--json", q + RULE],
                       capture_output=True, text=True, timeout=600)
    (OUT / f"{key}.json").write_text(r.stdout)
    print(key, "ok" if r.returncode == 0 else f"FAIL {r.stderr[-300:]}", flush=True)
