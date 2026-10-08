# Test scenes

Regression scenes for meclib. A scene is a meclib graphic (`initdata`) with one
or more **cases**: situations whose expected `objects` and `names` - exactly
what meclib writes into the two STACK inputs - are stored after rendering. So
the scenes check meclib itself (rendering, snapping, load-to-target
assignment), and the same objects and names feed the offline Maxima tests of
the feedback functions.

Create, view, run and edit the scenes with the tryout in `tools/tryout/`
(page "Test cases"); see [its README](../../tools/tryout/README.md).

## File format

One JSON file per scene, `<scene>.json`:

```
{
  "title": "...",
  "notes": "...",                 optional
  "decsep": ",",                  optional, default "."
  "block": "[[jsxgraph ...]]...", optional, default: interactive header from
                                  the wiki page "MecLib Question Setup"
  "initdata": [ ["grid", ...], ... ],
  "cases": [
    {
      "id": "init",               short key, unique within the scene
      "label": "...",
      "notes": "...",             optional
      "state": [ ... ],           optional: objects input the graphic starts
                                  from (e.g. after an interaction); without
                                  it, the case tests initdata itself
      "expected": { "names": "...", "objects": [ ... ] },
      "recorded": { "meclib": "...", "jsxgraph": "..." }
    }
  ]
}
```

`initdata` always includes a `grid` object, so a scene renders exactly as it
will be checked. The files are written with a fixed key order and one meclib
object per line, so git diffs show which object of which case changed.

## Use in the Maxima tests

Every save in the tryout regenerates `Maxima/tests/fixtures/scenes.mac`
(also by hand: `python tools/tryout/scenes_to_maxima.py`). `run_tests.mac`
loads it, so a test file can use the real meclib output instead of
hand-written lists:

```
o: scene_obj("fb_unidir", "init");     /* objects, as stackjson_parse(objects) yields them */
n: scene_names("fb_unidir", "init");   /* names */
fb_check(fb_unidir(o, n, 9, "bar 9: "), false, "...", "...", "label");
```

`scene_init("fb_unidir")` returns the initdata. The test page in the tryout
shows for each case which Maxima test files use it. Since the case id is the
reference, renumbering or reordering cases does not break the tests; deleting
or renaming a case that is in use does.

## Scenes

| Scene | Origin | Used by |
|---|---|---|
| `example_beam` | example for the workflow; includes a force stored off the grid that meclib snaps onto the support | - |
| `fb_unidir` | demo question "fb_unidir() unit test" | `test_fb_unidir.mac` |
| `fb_bar_name` | demo question "fb_bar_name() unit test" | `test_fb_bar_name.mac` |
| `fb_bar` | demo question "QA 05 fb_bar" (objects 14-17: work in progress on the two-sided bar cut) | `test_fb_bar.mac` |
| `fb_q` | demo question "QA 04a fb_q unit test part 1" (initdata evaluated once with Maxima) | `test_fb_q.mac` |
