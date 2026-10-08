"""
Generates Maxima/tests/fixtures/scenes.mac from the test scenes in tests/scenes/*.json,
so that the offline Maxima tests can use exactly the objects and names that meclib
produced for a scene (instead of hand-written lists).

Run by tools/tryout/server.py at start-up and whenever a scene is saved. Can also be run
by hand, e.g. after editing a scene file or pulling changes:
    python scenes_to_maxima.py

In a test file (Maxima/tests/test_*.mac):
    o: scene_obj("fb_unidir", "init");     objects input after rendering, i.e. what
                                           stackjson_parse(objects) yields in STACK
    n: scene_names("fb_unidir", "init");   names input after rendering
    i: scene_init("fb_unidir");            the scene's initdata
"""

import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent
SCENES = REPO / "tests" / "scenes"
TARGET = REPO / "Maxima" / "tests" / "fixtures" / "scenes.mac"


class ConversionError(ValueError):
    pass


def to_maxima(value):
    """JSON value -> Maxima expression text, matching what STACK's stackjson_parse() returns:
    lists stay lists, strings stay strings, numbers stay integers or floats."""
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, int):
        return str(value)
    if isinstance(value, float):
        text = repr(value)
        return text if any(c in text for c in ".e") else text + ".0"
    if isinstance(value, str):
        return '"' + value.replace("\\", "\\\\").replace('"', '\\"') + '"'
    if isinstance(value, list):
        return "[" + ",".join(to_maxima(v) for v in value) + "]"
    raise ConversionError("cannot convert %r to Maxima" % (value,))


def comment_safe(text):
    """Maxima comments nest, so neither '/*' nor '*/' may appear inside one."""
    return str(text).replace("/*", "/ *").replace("*/", "* /")


def scene_lines(name, scene):
    lines = ["", "/* ---- scene %s: %s ---- */" % (name, comment_safe(scene.get("title", "")))]
    lines.append('meclib_scene_init["%s"]: %s$' % (name, to_maxima(scene["initdata"])))
    decsep = scene.get("decsep", ".")
    for number, case in enumerate(scene.get("cases", []), start=1):
        cid = case.get("id") or str(number)
        expected = case.get("expected") or {}
        if expected.get("objects") is not None:
            lines.append('meclib_scene_obj["%s","%s"]: %s$' % (name, cid, to_maxima(expected["objects"])))
        names = expected.get("names")
        if names is not None:
            if decsep != ".":
                lines.append('/* case "%s": names not converted (decimal separator "%s") */' % (cid, decsep))
            else:
                # meclib writes the names input in Maxima syntax already (that is what STACK parses)
                lines.append('meclib_scene_names["%s","%s"]: %s$' % (name, cid, names))
    return lines


HEADER = """/* ============================================================================
   GENERATED FILE - do not edit by hand.
   Written by tools/tryout/scenes_to_maxima.py from the JSON files in tests/scenes/
   (automatically whenever a scene is saved in the tryout, or by running the
   script). Edit the scenes instead, in the tryout (tools/tryout) or in the
   JSON files, and regenerate.

   scene_obj(scene, case)    objects input after rendering, as stackjson_parse()
                             returns it in STACK
   scene_names(scene, case)  names input after rendering
   scene_init(scene)         initdata of the scene
   ============================================================================ */

scene_lookup(arr, key, what) := block([v: arrayapply(arr, key)],
  if subvarp(v) then
    error(sconcat("no ", what, " for ", string(key), " in fixtures/scenes.mac - regenerate it or check the scene/case id")),
  v)$
scene_obj(scene, case) := scene_lookup('meclib_scene_obj, [scene, case], "objects")$
scene_names(scene, case) := scene_lookup('meclib_scene_names, [scene, case], "names")$
scene_init(scene) := scene_lookup('meclib_scene_init, [scene], "initdata")$
"""


def generate(scenes_dir=SCENES, target=TARGET):
    """Writes the fixture file. Returns a list of problems (empty if all scenes converted)."""
    lines = [HEADER.rstrip("\n")]
    problems = []
    for path in sorted(Path(scenes_dir).glob("*.json")):
        try:
            scene = json.loads(path.read_text(encoding="utf-8"))
            lines.extend(scene_lines(path.stem, scene))
        except (OSError, ValueError, KeyError) as err:
            problems.append("%s: %s" % (path.name, err))
            lines.append("/* scene %s skipped: %s */" % (path.stem, comment_safe(err)))
    target = Path(target)
    target.parent.mkdir(parents=True, exist_ok=True)
    text = "\n".join(lines) + "\n"
    if not target.exists() or target.read_text(encoding="utf-8") != text:
        target.write_text(text, encoding="utf-8", newline="\n")
    return problems


if __name__ == "__main__":
    issues = generate()
    print("written: %s" % TARGET)
    for issue in issues:
        print("problem: " + issue)
    sys.exit(1 if issues else 0)
