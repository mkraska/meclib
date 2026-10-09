# meclib workbench

A local web application for working on meclib and on STACK questions that
use it, without Moodle. Three pages, linked in the header:

- **Graphic** - try out a meclib graphic (replacement for jsfiddle): the
  graphic runs as in STACK 4.13, and the contents of the `objects` and
  `names` inputs are shown live
- **Questions** - develop STACK questions: open Moodle XML files from your
  own folders, edit them (saved back into the file automatically), evaluate
  them with Maxima and STACK's Maxima library, preview them with working
  graphics
- **Tests** - the regression test cases of meclib (`tests/scenes/` in this
  repository): run, review, accept

The two kinds of data are kept apart on purpose: the **tests** live in this
repository, are only changed deliberately and must reproduce exactly; the
**questions** live in your own folders (any folder, under version control or
not) and are saved continuously while you work.

## Starting

- Windows: double-click `start_workbench.bat`. It starts a small local server
  and opens <http://localhost:8765/> in the browser. The console window is the
  server; closing it stops the server. Starting again while a workbench
  server is running stops the old one first (its window closes), so a new
  start always runs the current code, e.g. after an update.
- Any platform: `python server.py` in this folder (`--port N` for another
  port, `--no-browser` to skip opening the browser).

Requirements: Python 3 (standard library only), an internet connection for
GitHub sources, JSXGraph and MathJax, and Maxima for the Questions page (see
below).

## Graphic

1. Paste the object list into **initdata**. Expected is the JSON list that
   `stackjson_stringify(initdata)` produces. A constant Maxima list can be
   pasted as is: a leading `initdata:` and a trailing `;` or `$` are ignored.
   Expressions such as `pA+[0,0.3]` are not evaluated here; for those, work
   on a question (Questions page) and use its "Graphic ↗" button.
2. Choose the **meclib.js** version: your local working copy (the branch
   currently checked out is shown), or GitHub `dev` / `main`, always fetched
   fresh.
3. Press **Render** (or Ctrl+Enter).

Below the graphic:
- **names** and **objects** show what meclib writes into the two STACK
  inputs, updated on every interaction. "Use as start state" copies the
  current objects into the start state field.
- **Save as question** writes a new question file (template, see below) with
  the initdata and the [[jsxgraph]] block of this page, optionally with the
  current objects as model answer `tans`; "Open on Questions page" continues
  there.
- **Save as test case** adds the current situation to the regression tests
  (see Tests).
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

The page keeps its fields in the browser, so the last graphic is there again
after a restart. To keep a graphic for later, save it as a question.

## Questions

**Files** (left column)
- Question folders: the folders in `"question_dirs"` of
  `workbench_config.local.json`, folders added with **Add folder ...** (the
  system's folder dialog; it may open behind the browser window) or by
  pasting a path into the field below (kept until removed), and the
  workbench inbox (`.cache/questions/`).
  Each folder lists its `.xml` files, including subfolders.
- Dropping a Moodle XML file onto the page (or clicking the drop area) copies
  it into the folder last chosen in the list (the browser does not tell the
  page where a dropped file came from, so the copy is what you edit).
- **New file** in a folder creates a file with one new question from the
  template. "Recently opened" lists the last files and questions.

**Questions** of the open file: all questions with their categories (only
STACK questions can be opened). **New question** appends a question from the
template, **Duplicate** inserts a copy (name + " (copy)", idnumber cleared)
right after the selected one, **Save as ...** writes the selected question
into a new file in a folder chosen in the folder dialog, **Split file**
writes one file per STACK question into a folder named like the file (one
question per file, as qbank_gitsync keeps them).

**Layout**: on wide screens (from 1400 px) the editor and the preview stand
side by side, equally wide, each column scrolling by itself; Messages, inputs
and question variables are below the preview. On narrower screens the header
has Edit / Preview tabs (Ctrl+Shift+Enter switches). "Files ◂" in the header
hides the files column.

**Editor**: name, question variables, question text, inputs (type, model
answer, size, verification, validation; more under "more"), general and
specific feedback, question note, each text with its format. PRTs are shown
read only in this version.

**Input ...** (next to the question text) creates an input together with its
PRT: give a name `X` and a type; this adds the input `S_X`, the PRT `X` (one
node, value 1, compact feedback) and, at the cursor in the question text,
`[[input:S_X]] [[validation:S_X]] [[feedback:X]]`. The model answer is the
question variable `X` (another expression can be given). Types and defaults
(meclib wiki: fb_unit, fb_vars):

| Type | Input | PRT node | Feedback false / true |
|---|---|---|---|
| number with unit | units, size 8, syntax hint `{@meclib_h_unit@}`, insert stars 3 | UnitsRelative, rel. tolerance 0.005, simplify off | `fb_unit(S_X, X, tol)` / `fb_unit(S_X, X, 0)` |
| number without unit | numerical, size 8, syntax hint `{@meclib_h_number@}` | NumRelative, rel. tolerance 0.005 | `fb_unit(S_X, X, tol)` / `fb_unit(S_X, X, 0)` |
| expression | algebraic, size 15, syntax hint `{@meclib_h_alg@}`, insert stars 3, forbid float | AlgEquiv | `fb_vars(S_X, X)` |

The syntax hints are the multilingual ones from `fb_value.mac` (wiki page
"Multilingual questions"); the preview shows them in the language chosen.
All inputs: students must verify, compact validation; all nodes quiet. For
"number with unit" `X` must include the unit, e.g. `FA: 720*N;`. A question
with mark 0 (the template) gets mark 1 with its first PRT.

**✕** in the input table deletes an input with its `[[input:..]]` and
`[[validation:..]]` placeholders and its test inputs; the PRT of the same
name without `S_` (with `[[feedback:..]]` and expected test results) on
request.

The text fields are code editors (CodeMirror 5) with line numbers, line
wrapping, matching brackets, search (Ctrl+F, replace Shift+Ctrl+F, go to
line Alt+G) and syntax highlighting:
- question variables as Maxima: comments, strings, numbers, keywords,
  assignments `name:` and definitions `f(x):=`, function calls, `;` and `$`
- question text and feedback as castext: `{@...@}` / `{#...#}` (Maxima
  inside), `[[...]]` blocks (input, validation and feedback slots stand
  out; the content of `[[jsxgraph]]` as JavaScript), HTML tags, LaTeX math
  between `\(`/`\)`, `\[`/`\]` with one to three backslashes

Tab inserts two spaces. Messages about a line of the question variables
(errors, assumed semicolons) jump to that line when clicked. Without the
editor library (no network, see Configuration) the fields are plain text
fields.

**Question options** (below the inputs): decimal separator, multiplication
sign, simplify, scientific notation, assume positive/real, surd, sqrt(-1),
inverse trig, logic symbols, matrix parentheses, default mark, penalty, ID
number - as in STACK's question form. The preview header has buttons for
the most used ones: language (de/en, display only), decimal separator
(`0.5` / `0,5`) and simplify; the latter two change the question option and
evaluate again.

**Check** (Alt+Enter, in the preview header) evaluates the PRTs with the
current answers - typed into the input fields or produced by the graphic -
as STACK does: the answers are set with simplification off, then each PRT
whose inputs are all answered runs its feedback variables and its nodes from
the first one along the true/false branches with STACK's own answer test
functions (`ATAlgEquiv`, `ATUnitsRelative`, ...), score mode, score and
penalty per branch. The feedback of the branches taken appears in place of
`[[feedback:...]]`, in the language chosen, with score, mark, penalty and
the answer notes below it; errors in feedback variables, answer tests or
feedback texts are listed there too. Next to the inputs the answer is shown
typeset (or "invalid input" if it does not parse).

**Model answers** fills in the model answers of all inputs; the graphic
starts from the model answer of its objects input. Then "Check" should give
full marks.

Approximations: STACK's input validation is not reproduced. The workbench
converts a decimal comma to a point (and `;` to `,`), inserts `*` for spaces
and implied products according to "insert stars", and accepts whatever then
parses in Maxima (no forbidden words, no syntax checks). Answer test feedback
appears as STACK's message keys (e.g. `ATAlgEquiv_SA_not_logic`), not
translated. A `[[jsxgraph]]` block inside PRT feedback is not rendered.

**Forbidden identifiers**: STACK refuses to save a question that uses an
identifier its security map forbids everywhere (variables such as `values`,
`linel`, functions such as `concat`, `eval_string`, `define`; the map of the
STACK version is in `config/stack/<version>/security-map.json`). The
workbench checks all Maxima code of a question for them: question and
feedback variables (statement by statement, the statement is not
evaluated), the CAS parts of every castext - `{@...@}`, `{#...#}`, the
attributes of `[[if]]`, `[[elif]]`, `[[define]]`, `[[foreach]]` - in the
question text, general and specific feedback, question note, syntax hints
and PRT feedback, model answers of inputs and SAns/TAns/test options of
PRT nodes. Findings appear in the messages under the preview; a question
text or model answer with a finding is not evaluated (as Moodle would not
accept it), PRT parts are still checked.

**Review** (top of the editor) checks the question against the conventions
for meclib questions in `rules.py` (style guide, wiki pages of the feedback
functions) whenever a question is opened or saved. Each finding has a level
(required / recommended / hint), an explanation, a wiki link and, where
possible, an automatic fix with a preview of the changed XML lines.
"Apply selected" applies the checked fixes (only the affected elements of the
file change, `.bak` as for edits); "Apply selected, reject the rest" also
records the unchecked proposals as rejected. Rejected proposals are listed
greyed and stay unchecked. The record is kept in the question description
(an internal field, not shown to students) as readable lines:
`Generated by Meclib Workbench <date>` (new questions),
`Revised by Meclib Workbench <date>`, `Review rejected: <rule[target]>, ...`;
other text in that field is kept.

Current rules: forbidden identifiers; broken `style=style="..."` attributes;
margin of right/left floating blocks (graphic); empty `[[lang]]` declaration when meclib feedback is used;
obsolete `fb_*_EN.mac`; settings of the graphic's inputs (objects, names);
input settings (insert stars: spaces only, none for numbers; placeholder hint;
validation compact; students must verify); multilingual syntax hints; PRT
feedback style compact, feedback format html (Markdown suppresses the yellow
feedback background), quiet answer test with meclib
feedback, simplification off with `fb_unit`; relative tolerance other than
0.005 (hint); default mark 0 with PRTs; object indices written as numbers
(hint: use variables like `i_A`); model answer of the graphic equal to its
initial state (hint); legacy state `"locked"`, replaced by `"SHOW"` (`fb_system()` counts only
SHOW/show as shown) for object types with a regression test, i.e. types that
appear with `"SHOW"` in a scene of `tests/scenes/` (`state_show.json`: beam,
q, fix1, fix12, fix123, bar, force, moment); other types get a hint.

**Snippet ...** inserts a text snippet at the cursor of the field last
edited: the interactive and the fixed [[jsxgraph]] block, the empty
`[[lang]]` declaration, the hints for the free body diagram input (de/en).
The snippets are text files in `templates/snippets/` - add or change them
there (see its README).

**Preview**: the question as the student sees it, with working meclib
graphics; the inputs follow the graphic live. **Graphic ↗** opens the
question's graphic (first [[jsxgraph]] block, initdata as evaluated) on the
Graphic page.

The right column shows messages (Maxima errors with the line of the question
variables, assumed missing semicolons, where `stack_include` files came
from), the inputs with model answer and current value, and all question
variables (typeset and as Maxima expression).

**Variant (seed)** and **de / en** choose the random variant and the language
of `[[lang]]` blocks (chosen as STACK does). **Evaluate** (Ctrl+Enter) saves
and evaluates.

### Saving

- Changes are written into the file automatically, 1.5 s after the last
  keystroke (Ctrl+S saves at once). The status next to the tabs shows
  "unsaved changes" / "saved 21:40".
- The first save after opening a file in the page keeps the previous version
  as `<file>.xml.bak` next to it. If your question folder is a git
  repository, add `*.bak` to its `.gitignore`.
- Only the edited fields are replaced in the file text; everything else -
  order, indentation, CDATA sections, line endings, fields the workbench does
  not show - stays exactly as it is, so a diff shows just your edits, and a
  re-import into Moodle ("import as new version") gets the question as
  exported plus your edits.
- If the file was changed by something else since it was opened (an editor,
  a git checkout, Claude), the workbench does not overwrite it: it offers to
  reload the file or to apply your edits to the version on disk.

### Template

`templates/meclib_question.xml`: an interactive meclib question as in the
wiki page "MecLib Question Setup" - hidden inputs `objects` (string, model
answer `tans`) and `names` (algebraic, `[]`), the [[jsxgraph]] block with the
meclib.js include in a right-floating div with some space to the text,
`tansdata: initdata;` and `tans: stackjson_stringify(tansdata);` (so the model
answer is modified on the Maxima level), `stack_include` of `fb_fbd.mac` and
`fb_value.mac`, an
empty `[[lang]]` declaration (so that the feedback functions' texts get a
language), Markdown format. It has no PRT yet and therefore default mark 0.

### Evaluation

Maxima is found on the PATH or in the usual Windows install locations
(`C:\maxima-*`, `Program Files`); otherwise set `"maxima"` in
`workbench_config.local.json` to the full path of `maxima.bat`. The first
evaluation starts Maxima and loads the library (a few seconds); later ones
take a fraction of a second.

`stack_include` of meclib's Maxima files on GitHub follows the meclib source
selector: "local working copy" takes `Maxima/*.mac` from your working copy,
`dev`/`main` the files of that branch.

Rendering follows STACK where it matters for checking a question: the
question options (decimal separator, multiplication sign, ...), castext
(`{@...@}`, `{#...#}`, `[[if]]`, `[[foreach]]`, `[[define]]`, `[[comment]]`,
`[[lang]]`), math mode detection for `{@...@}`, and Markdown texts including
Markdown's backslash escapes. In Markdown, write math as `\\\( ... \\\)`:
STACK detects math mode for `{@...@}` only after three backslashes (with
`\\( {@x@} \\)` it puts extra delimiters around `x`, which breaks the
formula). HTML blocks inside Markdown (lines starting with `<p>`, `<div>`,
...) keep single backslashes. Other castext blocks are shown as text. Input
validation and the exact Moodle layout are not reproduced.

## Tests

The regression scenes live in `tests/scenes/` at the repository root; see
[`tests/scenes/README.md`](../../tests/scenes/README.md) for the file format
and how the Maxima tests use them.

**Creating cases** (Graphic page, "Save as test case"): set up and interact
with the graphic, choose an existing scene or "new scene", give the case a
label and an id (suggested from the label) and save. The case stores the
current objects as its state (or the start state, if you haven't interacted
since rendering), renders it once more the way the test runner will, and
stores that result as expected. Saving into an existing scene is refused if
initdata, decimal separator or block differ from the scene's. Every save also
regenerates `Maxima/tests/fixtures/scenes.mac`.

**Reviewing and running** (Tests page): all scenes with their cases, each
with a live thumbnail, expected and actual names, status, initialisation
time, and on failure the differences (names, and objects one by one) plus
console errors. Warnings are listed collapsed. Each case shows which Maxima
test files use it. "Run all" or "Run scene" runs against the meclib.js
version selected in the header, so the same cases can be run against the
local copy, dev and main. Per case:
- **Open on Graphic page** loads the scene and the case's state for
  inspection
- **Accept actual** stores the actual result as expected, after a deliberate
  change in meclib (look at the thumbnail first)
- **Delete** removes the case (with a warning if Maxima tests use it)

Numbers in objects are compared with a relative tolerance of 1e-9 (floating
point noise), everything else exactly.

## How closely the graphic matches STACK

The pages build the graphic the way STACK 4.13.1 does for a `[[jsxgraph]]`
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

`workbench_config.json` holds the GitHub branches, JSXGraph and MathJax
choices, the URLs the server may proxy, the Markdown renderer and the code
editor (`"codemirror"`: base URL of CodeMirror 5 as published on npm). Settings
for one machine only go into `workbench_config.local.json` (not committed);
its entries are merged over the defaults, e.g.

```
{
  "question_dirs": ["C:/Users/me/Documents/STACK-Fragen"],
  "maxima": "C:/maxima-5.47.0/bin/maxima.bat",
  "mathjax": { "MathJax 2.7.9 (local)": "/vendor/mathjax/MathJax.js?config=TeX-AMS-MML_HTMLorMML" },
  "codemirror": "/vendor/codemirror/"
}
```

(the last two entries: local copies of MathJax and CodeMirror for working
offline, unpacked into `vendor/`, also not committed; for CodeMirror the
content of the npm package `codemirror@5.65.16`).

## Files

- `index.html`, `questions.html`, `tests.html` - the three pages
- `editor.js` - code editor of the Questions page: loads CodeMirror, Maxima
  and castext highlighting
- `frame.js` - builds and runs a graphic in a STACK-like frame (shared by the
  pages)
- `style.css` - shared styles
- `server.py` - local server (listens on this computer only; writing
  requests need the header `X-Workbench: 1`, which other web sites cannot
  send): serves the pages; shows the folder dialog; reads and writes the
  scenes in `tests/scenes/` and the question files in your folders; evaluates
  questions with Maxima; delivers meclib.js from the working copy or GitHub;
  proxies whitelisted GitHub files with the correct content type (GitHub's
  raw files are served as plain text, which browsers refuse to run as
  scripts)
- `qfile.py` - question files: reading, writing back only the edited fields,
  new questions from the template
- `stack_question.py` - evaluates question variables and castext with Maxima
- `maxima_session.py` - a persistent Maxima process with STACK's library
- `scenes_to_maxima.py` - writes `Maxima/tests/fixtures/scenes.mac` from the
  scenes (run by the server; can also be run by hand)
- `templates/meclib_question.xml` - template for new questions
- `templates/snippets/` - text snippets for the editor
- `workbench_config.json` - configuration (see above)
- `start_workbench.bat` - Windows launcher
- `.cache/` - downloaded versioned files, the workbench inbox, the list of
  added folders and recent files (created automatically, not committed)

## Planned

- editing PRTs (nodes, feedback variables, feedback texts)
- templates for inputs and PRTs from the wiki
- a tree of folders, files and questions with context menus for their actions
- automatic multilingual castext: de/en versions of the texts kept together
  in `[[lang]]` blocks (not urgent)
- expected feedback per test case
- reference images of test cases (headless run), e.g. for wiki pages
