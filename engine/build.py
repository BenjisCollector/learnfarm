"""Recompute every flow in a scene from data/, never by hand.

Usage: python3 -m engine.build examples/farm.scene.json [more.json ...]
       python3 -m engine.build --check examples/*.json   (exit 1 if any flow is stale)
       python3 -m engine.build --demo                     (self-check)

Animals: data/animals.json per-head rate x props.count (default 1).
Crops:   data/crops.json per-m2 season figure x props.area_m2 / season_days.
Flows for entities the engine has no data for are kept as written (they still
need a source, see scripts/check_scene.py).

ponytail: flat rates at the midpoint of the cited range, no temperature or
age curve. Heat-adjusted water and lay curves arrive with Phase 3 climate data.
"""
import json
import re
import sys
from functools import cache
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
RAW = ROOT / "docs" / "research" / "raw"


def load_data():
    animals = json.loads((DATA / "animals.json").read_text(encoding="utf-8"))
    crops = json.loads((DATA / "crops.json").read_text(encoding="utf-8"))
    return animals, crops


def survival_for(scene):
    """How long each part survives without an input, from data/survival.json (sourced)."""
    path = DATA / "survival.json"
    if not path.exists():
        return []
    lim = json.loads(path.read_text(encoding="utf-8"))
    out = []
    for e in scene.get("entities", []):
        key = (e.get("props") or {}).get("crop") or e.get("kind")
        for l in lim.get(key, []):
            item = {"entity": e["id"], "resource": l["resource"], "days": l["days"], "source": l["source"]}
            for k in ("range", "basis"):
                if k in l:
                    item[k] = l[k]
            if l.get("urls"):
                item["links"] = [{"title": u, "url": u} for u in l["urls"]]
            out.append(item)
    return out


@cache
def _research():
    """Map (topic, citation number) -> {title, url} from the raw NotebookLM answers."""
    srcs = json.loads((RAW / "sources.json").read_text(encoding="utf-8"))["sources"]
    by_id = {s["id"]: s for s in srcs}
    out = {}
    for f in RAW.glob("[A-Z][0-9].json"):
        for r in json.loads(f.read_text(encoding="utf-8")).get("references") or []:
            s = by_id.get(r["source_id"], {})
            if (s.get("url") or "").startswith("http"):
                out[(f.stem, r["citation_number"])] = {"title": s.get("title") or s["url"], "url": s["url"]}
    return out


def links(source):
    """'docs/research A1 [3] ... [14]' -> list of {title, url} for every cited web page."""
    m = re.search(r"docs/research ([A-Z][0-9])", source)
    if not m:
        return []
    seen, out = set(), []
    for group in re.findall(r"\[([\d,\s-]+)\]", source):
        for n in re.findall(r"\d+", group):
            hit = _research().get((m.group(1), int(n)))
            if hit and hit["url"] not in seen:
                seen.add(hit["url"]); out.append(hit)
    return out


def flow(entity, rate, per_day, how, scale):
    f = {"entity": entity, "direction": rate["direction"], "resource": rate["resource"],
         "unit": rate["unit"], "per_day": round(per_day, 3), "source": f"{rate['source']}; {how}"}
    if "range" in rate:
        f["range"] = [round(v * scale, 3) for v in rate["range"]]
    if "trust" in rate:
        f["trust"] = rate["trust"]
    # rate["urls"] (primary sources, checked by hand) win over NotebookLM citations
    if ls := [{"title": u, "url": u} for u in rate.get("urls", [])] or links(rate["source"]):
        f["links"] = ls
    return f


def compute(scene, animals, crops):
    """Return (new flows, ids the engine computed, warnings)."""
    flows, covered, warns = [], set(), []
    for e in scene.get("entities", []):
        props = e.get("props") or {}
        if e.get("kind") in animals:
            n = props.get("count", 1)
            covered.add(e["id"])
            flows += [flow(e["id"], r, r["per_head_day"] * n, f"x {n} head", n) for r in animals[e["kind"]]]
        elif props.get("crop") in crops:
            area = props.get("area_m2")
            if not area:
                warns.append(f"{e['id']}: crop {props['crop']!r} has data but no props.area_m2, flows left as written")
                continue
            c = crops[props["crop"]]
            covered.add(e["id"])
            days = c["season_days"]
            flows += [flow(e["id"], r, r["per_m2_season"] * area / days, f"x {area} m2 / {days} days", area / days)
                      for r in c["rates"]]
    kept = [f for f in scene.get("flows", []) if f.get("entity") not in covered]
    return flows + kept, covered, warns


def build(path, check_only=False):
    p = Path(path)
    scene = json.loads(p.read_text(encoding="utf-8"))
    flows, covered, warns = compute(scene, *load_data())
    for w in warns:
        print(f"warn {path}: {w}")
    survival = survival_for(scene)
    stale = flows != scene.get("flows", []) or survival != scene.get("survival", [])
    if stale and not check_only:
        scene["flows"] = flows
        if survival:
            scene["survival"] = survival
        p.write_text(json.dumps(scene, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    state = ("STALE" if check_only else "updated") if stale else "ok   "
    print(f"{state} {path} ({len(covered)} entities computed, {len(flows)} flows)")
    return stale


def demo():
    animals, crops = load_data()
    scene = {"entities": [
        {"id": "hens", "kind": "hen", "props": {"count": 24}},
        {"id": "toms", "kind": "plot", "props": {"crop": "tomato", "area_m2": 600}},
        {"id": "pond", "kind": "pond"}],
        "flows": [{"entity": "pond", "direction": "out", "resource": {"en": "Fish", "ar": "سمك"},
                   "unit": "kg", "per_day": 1, "source": "hand"},
                  {"entity": "hens", "direction": "in", "resource": {"en": "Feed", "ar": "علف"},
                   "unit": "kg", "per_day": 999, "source": "stale"}]}
    flows, _, _ = compute(scene, animals, crops)
    feed = lambda fs: next(f["per_day"] for f in fs if f["entity"] == "hens" and f["resource"]["en"] == "Feed")
    assert feed(flows) == round(0.113 * 24, 3), flows
    scene["entities"][0]["props"]["count"] = 40  # the bug: 24 -> 40 must rescale
    flows, _, _ = compute(scene, animals, crops)
    assert feed(flows) == round(0.113 * 40, 3) and "x 40 head" in flows[0]["source"]
    assert not any(f["source"] == "stale" for f in flows)
    assert any(f["source"] == "hand" for f in flows), "flows without engine data must be kept"
    tom = next(f for f in flows if f["entity"] == "toms" and f["direction"] == "in")
    assert tom["per_day"] == 3000.0, tom  # 600 mm x 600 m2 / 120 days
    assert tom["range"] == [2000.0, 4000.0], tom["range"]  # 400-800 mm, same scaling
    hen_feed = next(f for f in flows if f["entity"] == "hens" and f["resource"]["en"] == "Feed")
    assert hen_feed["range"] == [4.364, 4.676] and hen_feed["trust"] == "web"
    assert hen_feed["links"][0]["url"].startswith("https://www.hyline.com/"), hen_feed  # urls beat NotebookLM
    assert links("docs/research A2 [1]")[0]["url"].startswith("http")  # fallback still resolves
    print("demo ok")


if __name__ == "__main__":
    args = sys.argv[1:]
    if args == ["--demo"]:
        demo()
        sys.exit(0)
    check = "--check" in args
    paths = [a for a in args if a != "--check"]
    if not paths:
        sys.exit(__doc__)
    sys.exit(1 if any([build(a, check) for a in paths]) and check else 0)
