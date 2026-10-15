"""Turn nlm/*.json answers into one markdown file with every citation mapped to a real URL or flagged."""
import json, sys
from pathlib import Path

D = Path(__file__).resolve().parents[2] / "docs/research/raw"
src = json.loads((D / "sources.json").read_text())
src = src.get("sources", src) if isinstance(src, dict) else src
by_id = {s["id"]: s for s in src}

TITLES = {
 "A1": "Poultry: laying hens and broilers", "A2": "Goats, sheep, dairy cattle",
 "A3": "Rabbits and tilapia", "C1": "Vegetables", "C2": "Dates, fodder, grains, herbs, strawberry",
 "I1": "Farm infrastructure and costs", "I2": "Kuwait and GCC farmer support",
 "V1": "Vertical farming and hydroponics: numbers", "V2": "Vertical farming: failures and lessons",
}
out = [f"Generated from NotebookLM notebook \"Open Farm Research\" ({len(src)} sources). "
       "`[web]` = a real external page. `[AI report]` = NotebookLM's own deep-research summary, "
       "**not a primary source**: re-verify those numbers before relying on them.\n"]
stats = {"web": 0, "report": 0}
for key, title in TITLES.items():
    f = D / f"{key}.json"
    if not f.exists() or not f.read_text().strip():
        out.append(f"\n## {key}. {title}\n\n_Not answered (query failed)._\n")
        continue
    d = json.loads(f.read_text())
    out.append(f"\n## {key}. {title}\n\n{d['answer'].strip()}\n\n**Citations**\n")
    seen = {}
    for r in d.get("references") or []:
        seen.setdefault(r["citation_number"], r["source_id"])
    for n in sorted(seen):
        s = by_id.get(seen[n], {})
        url = s.get("url") or ""
        tag = "web" if url.startswith("http") else "report"
        stats[tag] += 1
        label = (s.get("title") or "unknown")[:110]
        out.append(f"- [{n}] `[{'web' if tag == 'web' else 'AI report'}]` {f'[{label}]({url})' if url else label}")
out.insert(1, f"Citation mix: {stats['web']} web, {stats['report']} AI-report.\n")
Path(sys.argv[1]).write_text(("\n".join(out) + "\n").replace(" — ", ", ").replace("—", "-"))  # house style: no em dashes
print(stats)
