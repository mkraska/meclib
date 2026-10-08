# meclib tryout

A local web page for trying out meclib graphics without Moodle, as a
replacement for jsfiddle. It runs the graphic the same way STACK 4.13 does
and shows the contents of the `objects` and `names` inputs live while you
interact with it.

## Starting

- Windows: double-click `start_tryout.bat`. It starts a small local server
  and opens <http://localhost:8765/> in the browser. Closing the console
  window stops the server.
- Any platform: `python server.py` in this folder (`--port N` for another
  port, `--no-browser` to skip opening the browser).

Requirements: Python 3 (standard library only) and an internet connection
for GitHub sources, JSXGraph and MathJax.

## Using it

1. Paste the object list into **initdata**. Expected is the JSON list that
   `stackjson_stringify(initdata)` produces. A constant Maxima list can be
   pasted as is: a leading `initdata:` and a trailing `;` or `$` are ignored.
   Expressions such as `pA+[0,0.3]` are not evaluated at this stage; that
   will come with Maxima support (question variables).
2. Choose the **meclib.js** version: your local working copy (the branch
   currently checked out is shown), or GitHub `dev` / `main`, always fetched
   fresh.
3. Press **Render** (or Ctrl+Enter).

Below the graphic:
- **names** and **objects** show what meclib writes into the two STACK
  inputs, updated on every interaction. "Use as start state" copies the
  current objects into the start state field.
- **Console** shows errors and warnings from the graphic; log messages from
  meclib can be switched on.

**Start state**: if filled, meclib starts from this state instead of
initdata, exactly as when a student revisits an answered question.

**STACK [[jsxgraph]] block**: the block as it appears in the question text.
Presets for the interactive and the non-interactive header are taken from
the wiki page "MecLib Question Setup". `{#init#}` and `{#stackfltsep#}` are
filled in, the `[[include ...meclib.js"/]]` line is replaced by the selected
meclib.js, and width, height and `input-ref-...` attributes are taken from
the opening tag.

## Test cases

The regression scenes live outside this tool, in `tests/scenes/` at the
repository root; see [`tests/scenes/README.md`](../../tests/scenes/README.md)
for the file format and how the Maxima tests use them. The tryout is the
editor and runner for them:

**Creating cases** (tryout page, "Save as test case"): set up and interact
with the graphic, choose an existing scene or "new scene", give the case a
label and an id (suggested from the label) and save. The case stores the
current objects as its state (or the start state, if you haven't interacted
since rendering), renders it once more the way the test runner will, and
stores that result as expected. Saving into an existing scene is refused if
initdata, decimal separator or block differ from the scene's. Every save also
regenerates `Maxima/tests/fixtures/scenes.mac`.

**Reviewing and running** (`cases.html`, link "Test cases" in the header):
all scenes with their cases, each with a live thumbnail, expected and actual
names, status, initialisation time, and on failure the differences (names, and
objects one by one) plus console errors. Warnings are listed collapsed. Each
case shows which Maxima test files use it. "Run all" or "Run scene" runs
against the meclib.js version selected in the header, so the same cases can be
run against the local copy, dev and main. Per case:
- **Open in tryout** loads the scene and the case's state for inspection
- **Accept actual** stores the actual result as expected, after a deliberate
  change in meclib (look at the thumbnail first)
- **Delete** removes the case (with a warning if Maxima tests use it)

Numbers in objects are compared with a relative tolerance of 1e-9 (floating
point noise), everything else exactly.

## How closely it matches STACK

The page builds the graphic the way STACK 4.13.1 does for a `[[jsxgraph]]`
block (see `stack/cas/castext2/blocks/jsxgraph.block.php` in
moodle-qtype_stack):

- a sandboxed frame with MathJax 2 (configured as in STACK), JSXGraph and a
  `div#jxgbox`
- the block content inside `<script type="module">` (strict mode), wrapped in
  `Promise.all([stack_js.request_access_to_input(...)]).then(...)`
- hidden proxy inputs with the input names as ids and the
  `data-stack-input-decimal-separator` / `-list-separator` attributes
- `stack_js.resize_containing_frame()`, which meclib's `grid` object uses to
  size the frame

`stack_js` is replaced by a small local stand-in with the same behaviour for
these functions; it is not STACK's own code.

The default JSXGraph is the copy bundled with STACK 4.13.1 (1.12.2), loaded
from the moodle-qtype_stack repository at tag `v4.13.1`.

## Configuration

`tryout_config.json` holds the GitHub branches, JSXGraph and MathJax
choices, and the URLs the server may proxy. Settings for one machine only go
into `tryout_config.local.json` (not committed); its entries are merged over
the defaults, e.g. a local MathJax copy for working offline:

```
{ "mathjax": { "MathJax 2.7.9 (local)": "/vendor/mathjax/MathJax.js?config=TeX-AMS-MML_HTMLorMML" } }
```

with MathJax unpacked into `vendor/mathjax/` (also not committed).

## Files

- `index.html` - the tryout page
- `cases.html` - test case review and runner
- `frame.js` - builds and runs the graphic in a STACK-like frame (shared by
  both pages)
- `style.css` - shared styles
- `server.py` - local server: serves the pages, reads and writes the scenes
  in `tests/scenes/`, delivers meclib.js from the working copy or GitHub, and
  proxies whitelisted GitHub files with the correct content type (GitHub's raw
  files are served as plain text, which browsers refuse to run as scripts)
- `scenes_to_maxima.py` - writes `Maxima/tests/fixtures/scenes.mac` from the
  scenes (run by the server; can also be run by hand)
- `tryout_config.json` - configuration (see above)
- `start_tryout.bat` - Windows launcher
- `.cache/` - downloaded versioned files (created automatically, not committed)

## Planned

- question variables evaluated by Maxima with the STACK library from
  `config/stack/`
- feedback variables and feedback text, rendered in German and English;
  expected feedback per test case
- reference images of test cases (headless run), e.g. for wiki pages
