"""Check Open Farm scene files against the rules that matter.

Usage: python3 scripts/check_scene.py examples/*.json
       python3 scripts/check_scene.py --demo   (self-check)

ponytail: stdlib only, enforces the core rules (bilingual text, sourced flows,
valid refs). Swap for a full JSON Schema validator once a JS/TS toolchain exists.
"""
import json
import sys

KINDS = {"house", "plot", "pen", "pond", "storage", "coop", "rack", "tank", "panel", "crop", "hen", "cow", "goat", "sheep"}
WEATHER = {"sunny", "cloudy", "windy", "rain", "rainbow"}


def text_ok(t):
    return isinstance(t, dict) and set(t) == {"en", "ar"} and all(isinstance(v, str) and v for v in t.values())


def check(scene):
    errs = []
    if scene.get("version") != "0":
        errs.append("version must be '0'")
    if "title" in scene and not text_ok(scene["title"]):
        errs.append("title must have non-empty en + ar")
    day = scene.get("clock", {}).get("day")
    if not isinstance(day, int) or day < 0:
        errs.append("clock.day must be an integer >= 0")

    ids = set()
    for e in scene.get("entities", []):
        eid = e.get("id", "?")
        if eid in ids:
            errs.append(f"duplicate entity id: {eid}")
        ids.add(eid)
        if e.get("kind") not in KINDS:
            errs.append(f"{eid}: unknown kind {e.get('kind')!r}")
        if not text_ok(e.get("name")):
            errs.append(f"{eid}: name must have non-empty en + ar")
        pos = e.get("pos")
        if not (isinstance(pos, list) and len(pos) == 3):
            errs.append(f"{eid}: pos must be [x, y, z]")
        rect = (e.get("props") or {}).get("rect")
        if rect is not None and not (isinstance(rect, list) and len(rect) == 4 and all(isinstance(v, int) and v >= 0 for v in rect)):
            errs.append(f"{eid}: props.rect must be [x, y, w, h] tiles")

    zones = {e.get("id") for e in scene.get("entities", []) if (e.get("props") or {}).get("rect")}
    for e in scene.get("entities", []):
        z = (e.get("props") or {}).get("zone")
        if z is not None and z not in zones:
            errs.append(f"{e.get('id')}: props.zone {z!r} is not a zone (needs props.rect)")

    w = scene.get("weather")
    if w is not None:
        if w.get("condition") not in WEATHER:
            errs.append(f"weather.condition must be one of {sorted(WEATHER)}")
        if not isinstance(w.get("temp_c"), (int, float)):
            errs.append("weather.temp_c must be a number")
        if not str(w.get("source", "")).strip():
            errs.append("weather: missing source (rule #1: no invented numbers)")

    for i, f in enumerate(scene.get("flows", [])):
        tag = f"flows[{i}]"
        if f.get("entity") not in ids:
            errs.append(f"{tag}: entity {f.get('entity')!r} not in entities")
        if f.get("direction") not in ("in", "out"):
            errs.append(f"{tag}: direction must be in/out")
        if not text_ok(f.get("resource")):
            errs.append(f"{tag}: resource must have non-empty en + ar")
        if not isinstance(f.get("per_day"), (int, float)) or f["per_day"] < 0:
            errs.append(f"{tag}: per_day must be a number >= 0")
        if not str(f.get("source", "")).strip():
            errs.append(f"{tag}: missing source (rule #1: no invented numbers)")
    return errs


def demo():
    good = {"version": "0", "clock": {"day": 0},
            "entities": [{"id": "h", "kind": "hen", "name": {"en": "Hen", "ar": "دجاجة"}, "pos": [0, 0, 0]}],
            "flows": [{"entity": "h", "direction": "in", "resource": {"en": "Feed", "ar": "علف"},
                       "unit": "kg", "per_day": 0.1, "source": "test"}]}
    assert check(good) == []
    bad = json.loads(json.dumps(good))
    bad["flows"][0]["source"] = ""
    bad["entities"][0]["name"] = {"en": "Hen"}
    errs = check(bad)
    assert any("missing source" in e for e in errs) and any("name must" in e for e in errs), errs
    bad2 = json.loads(json.dumps(good))
    bad2["entities"][0]["props"] = {"zone": "nowhere"}
    bad2["weather"] = {"condition": "sunny", "temp_c": 28}
    errs = check(bad2)
    assert any("is not a zone" in e for e in errs) and any("weather: missing source" in e for e in errs), errs
    print("demo ok")


if __name__ == "__main__":
    if sys.argv[1:] == ["--demo"]:
        demo()
        sys.exit(0)
    failed = False
    for path in sys.argv[1:]:
        with open(path, encoding="utf-8") as fh:
            errs = check(json.load(fh))
        print(f"{'FAIL' if errs else 'ok  '} {path}")
        for e in errs:
            print(f"     - {e}")
        failed |= bool(errs)
    sys.exit(1 if failed else 0)
