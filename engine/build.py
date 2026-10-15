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
import sys
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"


def load_data():
    animals = json.loads((DATA / "animals.json").read_text(encoding="utf-8"))
    crops = json.loads((DATA / "crops.json").read_text(encoding="utf-8"))
    return animals, crops


def flow(entity, rate, per_day, how):
    return {"entity": entity, "direction": rate["direction"], "resource": rate["resource"],
            "unit": rate["unit"], "per_day": round(per_day, 3), "source": f"{rate['source']}; {how}"}


def compute(scene, animals, crops):
    """Return (new flows, ids the engine computed, warnings)."""
    flows, covered, warns = [], set(), []
    for e in scene.get("entities", []):
        props = e.get("props") or {}
        if e.get("kind") in animals:
            n = props.get("count", 1)
            covered.add(e["id"])
            flows += [flow(e["id"], r, r["per_head_day"] * n, f"x {n} head") for r in animals[e["kind"]]]
        elif props.get("crop") in crops:
            area = props.get("area_m2")
            if not area:
                warns.append(f"{e['id']}: crop {props['crop']!r} has data but no props.area_m2, flows left as written")
                continue
            c = crops[props["crop"]]
            covered.add(e["id"])
            days = c["season_days"]
            flows += [flow(e["id"], r, r["per_m2_season"] * area / days, f"x {area} m2 / {days} days")
                      for r in c["rates"]]
    kept = [f for f in scene.get("flows", []) if f.get("entity") not in covered]
    return flows + kept, covered, warns


def build(path, check_only=False):
    p = Path(path)
    scene = json.loads(p.read_text(encoding="utf-8"))
    flows, covered, warns = compute(scene, *load_data())
    for w in warns:
        print(f"warn {path}: {w}")
    stale = flows != scene.get("flows", [])
    if stale and not check_only:
        scene["flows"] = flows
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
    assert feed(flows) == round(0.1185 * 24, 3), flows
    scene["entities"][0]["props"]["count"] = 40  # the bug: 24 -> 40 must rescale
    flows, _, _ = compute(scene, animals, crops)
    assert feed(flows) == round(0.1185 * 40, 3) and "x 40 head" in flows[0]["source"]
    assert not any(f["source"] == "stale" for f in flows)
    assert any(f["source"] == "hand" for f in flows), "flows without engine data must be kept"
    tom = next(f for f in flows if f["entity"] == "toms" and f["direction"] == "in")
    assert tom["per_day"] == 3125.0, tom  # 625 mm x 600 m2 / 120 days
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
