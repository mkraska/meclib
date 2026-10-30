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
  and opens <http://localhost:8765/> in the browser, on the page used last
  (Graphic, Questions or Tests). The console window is the
  server; closing it stops the server. Starting again while a workbench
  server is running stops the old one first (its window closes), so a new
  start always runs the current code, e.g. after an update.
- Any platform: `python server.py` in this folder (`--port N` for another
  port, `--no-browser` to skip opening the browser).

Requirements: Python 3 (standard library only), an internet connection for
GitHub sources, JSXGraph and MathJax (or local copies, see "Working offline"
under Configuration), and Maxima for the Questions page (see below).

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
after a restart. To keep a graphic for later, save it as a graphic file (or as
a question).

**Graphic file** (top of the left column): a graphic can be kept as a file of
its own, without making a question or a test case of it.
- **New** starts an empty graphic (a grid only), with an empty start state,
  the decimal point and the interactive [[jsxgraph]] preset.
- The list opens a graphic file. It shows the files `*.graphic.json` of all
  question folders (and their subfolders), grouped by folder; ↻ lists them
  again.
- **Save** (Ctrl+S) writes `<Name>.graphic.json` into the chosen folder ("..."
  chooses another one, which is then added to the question folders). The file
  that is open is saved again without asking; another existing file is
  overwritten only after asking.
- **PNG** writes the graphic as it is shown now (with the changes made in the
  graphic, else the start state) as `<Name>.png` into the chosen folder, at
  twice the resolution, without the border of the board and without the
  version text; an existing PNG of that name is replaced. The server draws it
  in a headless browser, so it needs Playwright (`pip install playwright`,
  `python -m playwright install chromium`), as `build_shelf_icons.py`.
- The badge in the heading shows the name of the open file and "changed" if
  the fields differ from the file. New and opening a file ask before
  discarding such changes. A graphic taken over from a question or a test
  case is not connected to a file.

A graphic file has the format of a test scene without cases (`title`,
`initdata`, and if they differ from the defaults `decsep` and `block`), plus
the start state as `state`.

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
writes one file per STACK question (one question per file, as qbank_gitsync
keeps them), named after the question, into a folder per category next to the
file: the category path below "top" (`$module$/top/06 Kinematik` ->
`06 Kinematik/`, subcategories as subfolders). The files contain no category
entry ("import as new version" accepts exactly one `<question>` element, and a
category entry counts as one); for a plain import choose the category in
Moodle's import form. The original file is renamed to
`<name>.xml.orig` (kept as a backup, no longer listed), and the question that
was open is opened from its new file. The files column shows folders by
their last name (full path as tooltip) and files in subfolders under the
subfolder name.

**Layout**: on wide screens (from 1400 px) the editor and the preview stand
side by side, equally wide, each column scrolling by itself; Messages, inputs
and question variables are below the preview. On narrower screens the header
has Edit / Preview tabs (Ctrl+Shift+Enter switches). "Files ◂" in the header
hides the files column.

**Side bars**: each column has a narrow bar beside it with its buttons and
its sections, always in reach while the column scrolls.

- Editor bar: ↶ / ↷ (undo, redo), Snippet, Graphic ↗, then the sections Review,
  Variables, Text, Inputs, Options, General FB, Specific FB, Note, PRTs and
  each PRT by name.
- Preview bar: Restart, Update (save and evaluate, Ctrl+Enter), TAns (model answers), Check, the question tests, de / en, `0.5` / `0,5`,
  simp, then the sections Question, General FB, Note, Messages, Inputs, PRT
  graphs, Variables.
- `⋯` at the top of a bar: the side of the bar (left or right of its column;
  default: both between the columns) and, in the editor bar, the settings of
  the code editors.

A section button scrolls the column to it and opens it if it is collapsed;
the section at the top of the column is highlighted. On narrow screens (one
column) the bar of the visible column is shown.

**Editor**: name, question variables, question text, inputs (type, model
answer, size, verification, validation; more under "more"), general and
specific feedback, question note, each text with its format, and the PRTs.

**PRTs** ("Potential response trees", below the texts): per PRT value,
simplification, feedback style and feedback variables; per node description,
answer test, SAns, TAns, test options, quiet, and per branch (true/false)
score mode and score, penalty, next node, answer note and feedback with its
format. The answer tests are STACK's (names as stored in the file, e.g.
`Units` for the units test with significant figures): each entry of the list,
the list itself and the options field have a tooltip with what the test does
and what its option is (the options field also as grey placeholder; Firefox
shows the tooltips of the entries in the open list, Chrome and Edge only that
of the list); "?" opens the page of the STACK documentation for the chosen
test, "examples" STACK's own test cases of it (Answer_Tests/Results).
Changes are saved like the other fields. "+ node" in a branch adds a
node that this branch leads to, "+ Node" below the nodes an unlinked one; ✕
deletes a node (branches leading to it then end the PRT; the first node - the
one no branch leads to, as in STACK - cannot be deleted) or the whole PRT
(with its `[[feedback:..]]` and expected test results). "+ PRT ..." adds a PRT
without an input (e.g. a further check of a graphic) and puts its
`[[feedback:..]]` at the cursor in the question text. New nodes are numbered
after the highest node; nodes are never renumbered, so answer notes and test
expectations stay valid.

**PRT graphs** (right column): each PRT as a tree, nodes in layers from the
first node; green the true, red the false branch, a branch that ends the PRT
with its score. The layers run from left to right (true branches leave
upwards, false ones downwards) when they fit the width of the column, else from
top to bottom; the layout follows when the column is resized. Each node shows
its answer test and its description (shortened to the space available; full
text and the test's arguments in the tooltip). After "Check" the branches taken
(by their answer notes) are drawn bold. Warnings: branches to missing nodes, loops (STACK refuses them),
nodes not reachable from the first one. A click on a node shows it in the
editor.

**Undo / Redo** (↶ / ↷ in the editor bar): every change of the question - typing (one
step per field within a minute), review fixes, new or deleted inputs, PRT and
node operations - is kept in a history next to the question file
(`.workbench-history/<file>.json`, the last 50 steps, only the changed part
of the question). It survives closing the workbench and belongs to the
question edited last: the first change to another question of the file starts
a new history. Undo and redo refuse if the question was changed outside the
workbench in the meantime. Text fields also have their own undo (Ctrl+Z in
the field). Do not commit `.workbench-history` folders.

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
| expression with rounded numbers | algebraic, size 15, syntax hint `{@meclib_h_alg@}`, insert stars 3, floats allowed | feedback variables `[txt, isOK]: fb_floats(S_X, X, tol);`, AlgEquiv `isOK` = `true` | `txt` |
| vector / matrix of numbers | matrix, size 4, insert stars 3 | feedback variables `[txt, isOK]: fb_unit_matrix(S_X, X, tol, labels);`, AlgEquiv `isOK` = `true` | `txt` |
| vector / matrix of expressions | matrix, size 8, insert stars 3, forbid float | feedback variables `txt: fb_vars_matrix(S_X, X, [], labels);`, AlgEquiv `S_X` = `X` | `txt` |
| choice: dropdown list / radio buttons | dropdown / radio, model answer `X_mcq`, not verified, no validation | AlgEquiv `S_X` = `mcq_correct(X_mcq)[1]` | none |

The syntax hints are the multilingual ones from `fb_value.mac` (wiki page
"Multilingual questions"); the preview shows them in the language chosen.
All inputs: students must verify, compact validation; all nodes quiet. For
"number with unit" `X` must include the unit, e.g. `FA: 720*N;`. A question
with mark 0 (the template) gets mark 1 with its first PRT.

The two matrix types insert a table row instead of the placeholders, since a
matrix input is a block of its own (wiki "Matrix input"): label | matrix |
unit | validation, with `[[feedback:X]]` in a paragraph below the table.
Further fields of the dialog: **Label** (LaTeX left of the matrix, default
`X`), **Unit** (optional, plain text right of the matrix; matrix inputs have
no units), **Components** (labels of the elements in the feedback: empty =
x-, y-, z-component, `index` = Element 1, 2, ..., or a list such as
`x_A, y_A`, written as `['x_A, 'y_A]`). If the model answer is not yet a
question variable, a placeholder `X: matrix([0],[0]);` of the size given in
the dialog is added to the question variables; the size of the model answer
sets the size of the input. See the wiki drafts `doc/wiki/fb_unit_matrix().md`
and `doc/wiki/fb_vars_matrix().md`.

The two choice types take a list of choices `[[value, true/false, display], ...]`
as model answer (wiki "Multiple Choice Questions"), by default the question
variable `X_mcq`. If it does not exist yet, a template with three choices is
added at the beginning of the question variables (the cursor is usually in
the question text). The preview shows the choices with the current seed and
reports a model answer that is not such a list or has no choice marked true
(STACK refuses to save such an input). Checkboxes are not offered: their
answer is a list of values and needs another test.

The dialog is not modal: the editor stays usable while it is open (e.g. to
look up a variable); the model answer field suggests the question variables.
A name that is already used by an input `S_X` or a PRT `X` is reported in the
dialog and "Create" stays disabled. Esc closes it.

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
number - as in STACK's question form. The preview bar has buttons for
the most used ones: language (de/en, display only), decimal separator
(`0.5` / `0,5`) and simplify; the latter two change the question option and
evaluate again.

**Check** (Alt+Enter, in the preview bar) evaluates the PRTs with the
current answers - typed into the input fields or produced by the graphic -
as STACK does: the answers are set with simplification off, then each PRT
whose inputs are all answered runs its feedback variables and its nodes from
the first one along the true/false branches with STACK's own answer test
functions (`ATAlgEquiv`, `ATUnitsRelative`, ...), score mode, score and
penalty per branch. The feedback of the branches taken appears in place of
`[[feedback:...]]`, in the language chosen (including `[[jsxgraph]]` scenes
in the feedback, e.g. a meclib sketch of the student's answer). The specific
feedback is shown below the question; as in STACK its CAS parts know only the
question variables, not the answers (the review warns about an input used
there) - what depends on the answers comes from PRTs whose `[[feedback:...]]`
stands in it, e.g. a formative PRT drawing a sketch. An input with the extra
option `allowempty` counts as answered when blank (value `EMPTYANSWER`), and a
PRT whose feedback variables set `%stack_prt_stop_p: true` bails out (no
score, no penalty, no feedback, note `<name>-bail`), both as in STACK. The
feedback looks as in Moodle, by the PRT's feedback style: compact = symbol (✔ green,
✖ red, half circle orange, by the PRT's score) in front of the text in a light
yellow box, inline (after the validation when there is room), standard = the question's standard feedback ("Richtig." ...) above the
text, symbolic = symbol only, formative = text only; so a feedback text that starts
with a line break or a paragraph shows as in Moodle. Score,
mark, penalty and the answer notes are below it, in small grey print; errors in feedback variables, answer tests or
feedback texts are listed there too, with Maxima's message (e.g. "feedback
variables, line 4: apply: subscript must be an integer; found: i_beam").
Next to the inputs the answer is shown typeset (or "invalid input" if it
does not parse).

**PRTs on their own**: as in STACK, each PRT sees the question variables and
the inputs, but not the feedback variables of the other PRTs (they are deleted
before each PRT); a PRT that uses `obj` without computing it fails here as in
Moodle.

**Time**: where Maxima spent the time of the last Update or Check. The
preview's header line sums it up in the order the parts ran (`Maxima 0.46 s:
variables 0.11 · texts 0.03 · answers 0.00 · PRTs 0.32`; variables = question
variables, model answers and syntax hints); the same line is in the messages,
followed by the lines of the question variables that took 0.05 s or more (click
to go to the line). Each PRT's info line under its feedback shows the time of
its feedback variables and of its nodes (`Variables 0.02 s · Nodes 0.01 s`).
The first Update and the first Check after a Maxima start are marked "first run
after start": they include Maxima's warm-up (about 0.2 s, mostly in the first
PRT), so run again before comparing. A typical cost is
`stackjson_parse(objects)` in every PRT; `fb_objects()` reads the objects much
faster.

**Feedback variables**: after a Check, the Variables section has a tab for
each PRT (also as sub-buttons under "Variables" in the preview bar) with the
values of its feedback variables as they are before the nodes run, including
names assigned inside a statement (e.g. in `if ... then (ok: false, ...)`).

**Matrix inputs** (STACK input type "matrix") are shown as a grid of fields
in brackets (question option "matrix parentheses"), as in Moodle; the grid has
the size of the model answer. "Check" builds `matrix([..],[..])` from the
cells, each cell processed like a single input; only some cells filled counts
as invalid (incomplete), as in STACK.

**TAns** fills in the model answers of all inputs; the graphic
starts from the model answer of its objects input. Then "Check" should give
full marks. A model answer shown with STACK's display functions (`dispdp`,
`dispsf`, `scientific_notation`) is filled in as the number it shows.

**Question tests** (below TAns/Check): STACK's own question tests
(`<qtest>` in the file, so Moodle imports them with the question), one button
per test case with its description, inputs and expected results as tooltip.
A click fills the inputs with the test's values (CAS expressions such as
`NN`, evaluated with the question variables of the current variant) and
checks; the button turns green or red, a failed test lists the reasons below
the buttons. The comparison follows STACK: per PRT the score (-1: not
compared), the penalty (empty: the question's penalty; -1: not compared; 0
when the score is 1) and the answer note - the expected note is the last one
of the PRT, or a pattern as in STACK (`[` anchors the first note, `)` frees
the last one, `a | b` lists notes in order; `NULL`: the PRT does not run).
The answer notes of the fast check are those of the nodes (STACK also lists
the notes of the answer tests, which a pattern rarely names).
"+" (new test) and "✎" (edit the selected test) put the preview into **test
mode** (red instead of blue, with a bar above the question): the inputs take
CAS expressions in Maxima syntax that may use question variables, e.g. a
typical error prepared as `J_err1`, which holds for every variant of a
randomised question. Check evaluates the expressions for the current variant
(as STACK evaluates test inputs) and grades their values; the validation shows
the value ("→ ..."). Another seed keeps the expressions, so other variants can
be checked before saving. For a new test the inputs keep their current
answers, an input with the model answer becomes the name of its variable
(e.g. `NN`, as STACK's default test); "✎" fills in the stored expressions.
Choice, matrix and string inputs are entered as usual and stored with their
value. "Add test" / "Replace test" store the expressions (not their values)
and the result of their check as expected result, "Save description only"
changes just the description; saving or "Cancel" ends the test mode and brings
back the answers from before. "✕" (click twice) deletes the selected test,
"▶" runs all.
STACK stores a test input value in a database column of 255 characters; a
longer value (typically the `objects` state of a graphic) would make the import
into Moodle fail ("error writing to the database"). Such a value goes into a
question variable `qt<test>_<input>` at the end of the question variables
(under a comment line), and the test input holds its name - STACK evaluates
test input values with the question variables, so the test is the same.
Replacing or deleting the test updates or removes the variable. The review
reports older test cases with too long values (`tests.value-length`,
required) and moves them the same way.
The check is the workbench's fast one in Maxima. **STACK ▶** runs all tests in
STACK itself (below): the buttons get a green or red line for that result,
failures are listed under them.

**STACK itself (STACK API in Docker)**: STACK's own PHP code without Moodle,
with STACK's input validation, compilation and PRTs - for the question tests
("STACK ▶") and for timing. It runs in Docker Desktop, in two containers built
once on this machine for the STACK version of the Moodle server
(`config/stack/<version>/`) and its Maxima version, plus a small web server
that offers the Maxima files of the working copy to `stack_include` (meclib
source "local working copy"; with dev or main the includes come from GitHub).
Set-up: see "STACK API (optional)" under Configuration.

    cd tools\workbench
    python stackapi.py build --maxima 5.45.1      (once: 10-20 minutes)

`build` clones STACK (the release tag from `profile.json`) and goemaxima (the
Maxima server of STACK's own images) into `.cache/stackapi/`, builds the
images `meclib-stackapi:<version>` (STACK's `api/docker/Dockerfile`, PHP 8.4)
and `meclib-goemaxima:<version>-<maxima>` (Maxima compiled from source) and
writes `.cache/stackapi/docker-compose.yml`. The workbench starts the
containers on the first "STACK ▶" (Docker Desktop must be running); `python
stackapi.py down` stops them, `status` reports. The API is
`http://localhost:3080` (STACK's routes render, validate, grade, test).
STACK compiles the question on every call (the API has no cache): a test takes
seconds, with large includes up to a minute. The tests are graded with the
route "grade" (the route "test" refuses questions for which STACK reports
language warnings, e.g. PRT feedback without `[[lang]]` blocks next to
multilingual feedback functions). `MECLIB_STACKAPI_URL` (environment variable
of the workbench server) uses another STACK API instead, e.g. a manual
installation with PHP (then without the includes container: meclib source dev
or main).

The answers stay when the question is evaluated again after an edit (save,
PRT or input changes, Undo/Redo, review fixes), including the state of the
graphic, unless the sketch itself (the `[[jsxgraph]]` block with its initial
objects) has changed. If feedback was shown, "Check" runs again with the same
answers, so a PRT edit shows its effect at once. A new variant (seed) or
another question starts empty; **Restart** clears the answers and the
feedback by hand (as "Start again" in Moodle's preview).

Approximations: STACK's input validation is not reproduced. The workbench
converts a decimal comma to a point (and `;` to `,`), inserts `*` for spaces
and implied products according to "insert stars", and accepts whatever then
parses in Maxima (no forbidden words, no syntax checks). One rule of STACK's
validation is reproduced: an answer that uses the name of a question variable
as a variable is invalid ("Forbidden variable or constant: v."), unless the
name is among the input's allowed words; the PRTs that need that input do not
run. Answer test feedback
appears as STACK's message keys (e.g. `ATAlgEquiv_SA_not_logic`), not
translated.

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
validation compact; students must verify); multilingual syntax hints (the fix
adds `stack_include` of `fb_value.mac` if the question lacks it); PRT
feedback style compact, feedback format html (Markdown suppresses the yellow
feedback background), quiet answer test with meclib
feedback, simplification off with `fb_unit`; relative tolerance other than
0.005 (hint); default mark 0 with PRTs; object indices written as numbers
(hint: use variables like `i_A`); model answer of the graphic equal to its
initial state (hint); legacy state `"locked"`, replaced by `"SHOW"` (`fb_system()` counts only
SHOW/show as shown) for object types with a regression test, i.e. types that
appear with `"SHOW"` in a scene of `tests/scenes/` (`state_show.json`: beam,
q, fix1, fix12, fix123, bar, force, moment); other types get a hint.

Math delimiters (`text.math-delimiters`): in HTML texts `\( ... \)`; in
Markdown texts the strict form `\\\( ... \\\)` (backslash and bracket both
escaped, so Markdown never takes the bracket for part of a link), except
inside block-level HTML (a line starting with `<p>`, `<table>`, `<div>` ...
up to its closing tag), which Markdown passes through unchanged: there
`\( ... \)` as in HTML. Checked: question text, general and specific
feedback, question note, PRT node feedback, each by its own format; only
complete pairs, not in `[[jsxgraph]]` blocks or `{@...@}`/`{#...#}`.

Includes of meclib's Maxima files (`include.unused`, recommended;
`include.missing`, required): an included file of which the question uses no
function and no variable is reported, the fix removes its `stack_include`
(loading it only costs compile time, which shows as CAS timeouts in Moodle).
A meclib function or variable used without its file is reported, the fix adds
the include (same branch as the question's other meclib includes). Uses are
searched in all Maxima code: question variables, feedback variables, CAS parts
of the texts and of the syntax hints, model answers, PRT nodes (SAns, TAns,
test options); a function counts only when called (`angle(`), so that a
variable of the same name does not count. Files needed by a needed file count
as needed; `*_EN.mac` files are never proposed.

Raw values in formulas (`text.raw-in-math`, required): `{#...#}` inside
`\( ... \)` or `\[ ... \]` becomes `{@...@}`. Where Moodle shows the castext
unevaluated (question bank, import), MathJax fails on `#`, and Moodle does not
save such a question; `{@...@}` inside a formula gives the LaTeX of the value
without delimiters. Same texts as above; `[[jsxgraph]]` blocks (e.g.
`{#init#}`) are not touched.

Matrix inputs (`matrix.layout`, `matrix.feedback`, wiki "Matrix input" and
"Matrix Feedback"): a paragraph `<p>label [[input:S_X]] [[validation:S_X]]
[[feedback:X]]</p>` becomes a table row label | input | validation with the
feedback below; PRT `X` gets the feedback variable
`[txt, isOK]: fb_unit_matrix(S_X, T, tol)` (numeric: a numeric answer test,
`fb_unit` or the old `toList` pattern; the answer test becomes AlgEquiv
`isOK` = `true`, `toList` is removed) or `txt: fb_vars_matrix(S_X, T, vars)`
(otherwise; AlgEquiv on the matrix stays), feedback `{@txt@}` in both
branches, quiet. `T` is the input's model answer; tolerance and `vars` are
taken from the old PRT, simple symbol labels of the old per-component
feedback (`<br>\(N\): {@fb_unit(...)@}`) become the label list. PRTs with
several nodes or other feedback text get a hint only.

Unused embedded files (`files.unused`): files stored in the question (`<file>`
elements of its texts) that no text shows as `@@PLUGINFILE@@/name` - usually
leftovers of earlier versions edited in Moodle (an image replaced in the editor
keeps the old file). The message names where the file is stored and which
text shows another file of the same type instead (probably its newer
version). The review shows the image;
the fix removes all copies of that file from the question.

meclib from a branch other than main (`include.branch`, a hint): a
`stack_include` of `mkraska/meclib/<branch>/...` with a branch other than
`main` (e.g. while a feature exists only on the dev branch). The fix switches
the URL to main - only after the branch is merged, as main may lack the
functions the question uses.

Includes of the removed compact copies (`include.dist`, required): a
`stack_include` of `.../Maxima/dist/<file>`. The folder `Maxima/dist/` no
longer exists (STACK drops comments when it reads the code, so the copies did
not make the compilation faster); STACK refuses such a question as soon as it
compiles it again ("stack_include ... could not retrieve"). The fix includes
`.../Maxima/<file>` instead.

Local copies of meclib functions (`functions.legacy`): a function defined in
the question variables that a meclib Maxima file defines too (older questions
carried their own copies of the feedback functions). Reported when that file
is included (the local copy hides the current version) or the name starts
with `fb_`. The fix deletes the definition and adds the include if missing.

Missing `;` in Maxima code (`maxima.semicolon`): where a line ends a complete
statement and the next line starts an assignment or call, STACK assumes a
missing `;` (the preview reports it in the messages). The fix writes the `;`
into the question variables or the PRT's feedback variables, right after the
statement (before a trailing comment).

**Snippet ...** inserts a text snippet at the cursor of the field last
edited: the interactive and the fixed [[jsxgraph]] block, the empty
`[[lang]]` declaration, the hints for the free body diagram input (de/en).
The snippets are text files in `templates/snippets/` - add or change them
there (see its README).

**Preview**: the question as the student sees it, with working meclib
graphics and the images embedded in the file (`@@PLUGINFILE@@/...`); the inputs follow the graphic live. **Graphic ↗** opens the
question's graphic (first [[jsxgraph]] block, initdata as evaluated) on the
Graphic page.

**Conditional text** (`[[if]]` / `[[elif]]` / `[[else]]` in the question text):
every branch is shown, with a label giving its test and the test's value
(`if F1>F2 → true`); the branch STACK shows in this variant has a green
background, the others a grey one and greyed text (paragraphs and other blocks
also a line on the left, so the extent of a branch is visible). A branch that cannot be rendered in this variant (e.g.
an expression the `[[if]]` guards) or that contains `[[define]]` (rendering it
could change variables used later) is shown greyed as its source. The button
"⇄" at a label switches to what Moodle shows (only the active branches, the
small button stays) and back; the choice is kept. Not marked: `[[if]]`
inside `[[jsxgraph]]` blocks, HTML tags and math, and in other texts than the
question text.

The right column shows messages (Maxima errors with the line of the question
variables, assumed missing semicolons, where `stack_include` files came
from), the inputs with model answer and current value, and all question
variables (typeset and as Maxima expression).

**Variant (seed)** and **de / en** choose the random variant and the language
of `[[lang]]` blocks (chosen as STACK does). **Update** (preview bar, Ctrl+Enter) saves
and evaluates.

### Syntax help in the editors

The code editors (question variables, the texts, and the feedback variables
and branch feedback of the PRT editor) help with meclib's and STACK's
functions:

- **Signature box**: when the cursor is inside a call such as `fb_contact(`
  or a meclib object list such as `["force",`, a box above the line shows the
  signature with the current argument in bold (optional arguments in gray with a trailing `?`, taken from "(optional ..." in the wiki),
  the description of that argument and a short text, with a link to the meclib
  wiki, the STACK documentation or the Maxima manual. The link and **F1** open
  the page in a small separate window (always the same one). For a function
  with offline Maxima tests, "tests (n)" opens the Tests page at its first
  case (`tests.html#mtest=<file>&case=<n>`): examples of what it returns.
  Esc closes the box. Settings variables of meclib (entries of kind
  `variable` in `syntax_help_extra.json`, so far `fb_dims`) have the box
  anywhere in their assignment, e.g. `fb_dims: [a = "m", ...]`.
- **Autocomplete**: after two characters of a name, a list of matching
  functions with their signatures (meclib first, then STACK and Maxima);
  a settings variable is inserted as an assignment (`fb_dims: [ ]`);
  after `["` the meclib object types. **Ctrl+Space** opens the list at any time.
- **Castext snippets** (outside `{@ @}` and `[[jsxgraph]]`): `\` offers
  `\( \)` and `\[ \]` with the delimiters the format needs (Markdown:
  `\\\(`, except in a block of HTML), `{` offers `{@ @}` and `{# #}`, `[[`
  offers the blocks and `[[input:...]] [[validation:...]]` and
  `[[feedback:...]]` for the question's inputs and PRTs.
- **Closing brackets** (in Maxima, inside `{@ @}` and in `[[jsxgraph]]`): the
  closing bracket or quote is added only before a space, the end of the line
  or a closing bracket, as a separate undo step (Ctrl+Z right after removes
  just it). A closing bracket you type skips over an added one, otherwise it
  is inserted. Backspace between an added pair removes both.
- **Comments**: `/*` gets `*/` after the cursor (Maxima, and JavaScript in
  `[[jsxgraph]]`; not in strings or comments), in the same way: typing `*/`
  there skips it, Backspace right after `/*` removes it. Switched with the
  closing brackets.
- **`;` after `:`** (question and feedback variables): a `:` that ends what
  you typed so far of a statement (outside brackets, strings and comments,
  nothing after it on the line) gets a `;` after the cursor, in the same way
  as a closing bracket: `:=` and `::` keep it at the end, `;` typed there skips
  it, `$` replaces it, Backspace right after the `:` removes both. Inside
  brackets (`block([a:1], ...)`, `lambda`, lists) nothing is added.

`⋯` in the editor bar switches autocomplete while typing, the closing
brackets and the `;` after `:` off.

The help comes from `syntax_help.json`, which `build_help.py` builds from

- meclib's Maxima files (definitions and the comments above them, the wiki
  link in the comment) and `meclib.js` (the object types),
- the meclib wiki: a local clone (`git clone https://github.com/mkraska/meclib.wiki.git`),
  given with `--wiki` or as `"wiki_dir"` in `workbench_config.local.json`;
  updated pages in `doc/wiki/` are used instead of the wiki's version,
- STACK's Maxima library in `config/stack/<version>/maxima/` (signatures) and
  the documentation of the same release (`doc/en` of the git tag, fetched into
  `.cache/`; only functions the documentation mentions),
- `syntax_help_extra.json`: entries written by hand (common Maxima functions,
  STACK functions not found automatically); they win over generated ones.

```
python build_help.py --wiki C:/Users/me/Documents/GitHub/meclib.wiki
```

It also lists where code and wiki disagree: functions without a wiki link or
page, different numbers of arguments. Reload the page after a new build.

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

Each question is evaluated in its own Maxima session (Maxima with STACK's
library loaded, kept for further updates and checks; at most three, the least
recently used is closed). Starting a session takes several seconds, so the
server keeps one more session started in the background: a question evaluated
for the first time takes it at once (status line: "Maxima session started in
advance"), and the next one starts. A change of the Maxima or STACK version
closes all sessions and starts the spare one with the new version.

Maxima is found on the PATH or in the usual Windows install locations
(every `C:\maxima-*`, `Program Files`, `LOCALAPPDATA`); otherwise set
`"maxima"` in `workbench_config.local.json` to the full path of `maxima.bat`.
**STACK version** (STACK select in the header of the Questions and Tests
pages, one entry per `config/stack/<plugin version>/`, see
`config/README.md`): its Maxima library and security map produce the preview
and the test results. The choice holds for all pages (kept in
`.cache/workbench_state.json`) and starts new Maxima sessions. If the
version's `profile.json` names the JSXGraph bundled with it, a panel below
the header offers to set JSXGraph to "STACK <release> bundled (JSXGraph
<version>)" (Apply / Keep); such entries are added to the JSXGraph list for
every installed STACK version. A JSXGraph choice other than the bundled one,
and a Maxima outside the versions the STACK release supports, get a ⚠ with
a tooltip. Maxima and MathJax are not changed by a STACK switch. The tooltip
of the STACK item tells how to add a version. Logos in `vendor/logos/` of
the repository (file names containing stack, jsxgraph, mathjax or maxima;
svg or png) replace the labels of the header selects.

With several versions installed, the "Maxima" select in the header of the
Questions and Tests pages chooses one (newest first, labelled with the version
from the folder name or `maxima --version`). The choice holds for all pages,
is kept in `.cache/workbench_state.json` and closes the running sessions, so
the next evaluation or test run starts with the chosen version. The Tests page
shows STACK and Maxima of each run (and the JSXGraph of the graphics) in the
title row of a file. The first
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
test files use it. The Run button or "Run scene" runs against the meclib.js
version selected in the header, so the same cases can be run against the
local copy, dev and main. Per case:
- **Open on Graphic page** loads the scene and the case's state for
  inspection
- **Accept actual** stores the actual result as expected, after a deliberate
  change in meclib (look at the thumbnail first)
- **Delete** removes the case (with a warning if Maxima tests use it)

Numbers in objects are compared with a relative tolerance of 1e-9 (floating
point noise), everything else exactly.

**Tree of the test cases** (left column of the Tests page): the scenes with
their cases, and the offline Maxima tests (`Maxima/tests/test_*.mac`), grouped
into feedback on free-body diagrams (files with object lists or scene
fixtures), feedback on answers (sans against tans: fb_unit, fb_vars,
fb_floats, ...) and other functions, each file with its cases in the order of
`run_tests.mac`. The filter field shows the cases whose label or function
contains the text. A click on a scene or a case scrolls to it; a click on a
Maxima test file or case shows the file: its header comment, the functions it
tests, the set-up shared by several cases (e.g. an object list), and per
case the label (line as tooltip), the call, its own set-up, and the expected
result as the question preview shows it: the flag as a symbol, the feedback
in STACK's yellow box (de/en in the title row, which stays at the top while
scrolling). For answer feedback, sans and tans are typeset as the validation
shows them (parsed, not evaluated: GET `/api/mtests/tex`, one Maxima call per
file, no test run).

**The Run button** in the header acts on what is marked in the tree and names
it with the number of cases: all scenes, one scene or one scene case; all
Maxima tests, a group, a file. A marked Maxima case runs its whole file (the
cases build on its earlier statements) and then shows the case. Nothing
marked: the scenes and all Maxima tests. The title row of a file has its own
Run button. A click on a group or on "Maxima tests" shows the first file of
it, so the results of a run are in view (the file shown is refreshed as soon
as it has run).

**Decimal separator** (0.5 / 0,5 in the title row of a file): with the comma,
the run sets `stackfltsep: ","` and `texput_decimal(",")` as a question with
the decimal comma does, sans and tans are typeset with it, and the expected
feedback (written with the point in the test files) is shown with the comma.
The actual texts are compared after `{,}` -> `.`, so the expected texts serve
both separators. A case whose actual text still has a number with a decimal
point is marked "point" (orange, also in the tree): the function is not
separator-aware; the actual text is shown with the number marked. Results of
a run with the other separator are not shown (Run again).

**Expected values that refer to the set-up** (e.g. `GG_sx[1]`, a result of an
earlier statement): before a run marked "(value after Run)", after a run shown
as `GG_sx[1] = <value>`.

**Running the Maxima tests** (Run button, see above): the file runs in a Maxima session of the server
(POST `/api/mtests/run`) with the meclib files and scene fixtures of the
working copy, loaded fresh for each run, so a change in `fb_value.mac` shows
at once. The checks are redefined to record the actual result instead of
printing it; each statement runs on its own, so an error stops only its case
(the Maxima message is shown). Each case gets passed/failed; a failed case
shows the actual result below the expected one, the raw text with the part
from the first difference on marked. The tree marks files and cases green or
red. For the diagram feedback, the objects list of the call (its first
argument) is drawn as a thumbnail by meclib - as input of the test, not
compared with anything; a list without a grid gets one around all its points,
optional parameters left out before the state (label offset of a force, the
points of a moment) are completed for the drawing; the names list is the
tooltip. The drawing area follows the points of the objects (plus one unit),
also for a grid of the list (its range and pixels are replaced, display only):
at most 40 pixels per unit and about 400 x 300 pixels, drawn unscaled. Each case draws its objects in its own row, with the name of the set-up
variable below (if the list is one). Object lists of the set-up that no case
draws (e.g. `o_sx`, which `sum_xyM()` reads before the checks) are shown at
the top of the file. Not covered: checks inside loops or blocks of a
test file, and `test_security.mac` (no single checks) - run `run_tests.mac`
for the complete suite. The files are read, not run (GET `/api/mtests`, `mtests.py`): a
check is a call of `fb_check`, `fb_check_str`, `fb_check_val` or of a helper
of the file that calls `fb_check` (e.g. `cr_check`). "used by" links of a
scene case open the Maxima test file. The tree (`tree.js`) is a component of
its own, meant for the question folders of the Questions page, too.

## How closely the graphic matches STACK

The pages build the graphic the way STACK 4.13.1 does for a `[[jsxgraph]]`
block (see `stack/cas/castext2/blocks/jsxgraph.block.php` in
moodle-qtype_stack):

- a sandboxed frame with MathJax (loaded and configured as in STACK; the MathJax
  selector offers 2.7.9 and 3.2.2, the default of Moodle 5), JSXGraph and a
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
  "maxima": "C:/maxima-5.47.0/bin/maxima.bat"
}
```

### Working offline

Once prepared, the workbench runs without internet. While online, run once

    cd tools\workbench
    python fetch_vendor.py

It downloads the configured versions of JSXGraph, MathJax 2.7.9 and 3.2.2,
CodeMirror and the Markdown renderer (marked) from the npm registry into
`vendor/npm/<package>@<version>/` (about 90 MB, mostly MathJax; not committed)
and the JSXGraph files bundled with the STACK versions in `config/stack/` into
`.cache/`. From then on the server hands the pages these local copies instead of
the CDN URLs - the same entries in the selectors, nothing to configure. Run it
again after adding a version to `workbench_config.json` (`--force` downloads
everything again). Entries without an exact version ("CDN latest") stay online
only.

Further without internet:

- meclib.js and the `stack_include` files: with the meclib source "local
  working copy" they come from the repository. With dev or main the workbench
  fetches them from GitHub; without a connection it uses the copy of the last
  successful fetch and says so (message on the Questions page, source info of
  the graphic); without any earlier copy it reports the error.
- Maxima evaluation, the Tests page, the offline Maxima tests and STACK ▶ in
  Docker (with the meclib source "local working copy") need no internet.
- The syntax help uses STACK's documentation from `.cache/` once
  `build_help.py` has downloaded it.

Older local copies configured by hand (`"mathjax": {"... (local)":
"/vendor/mathjax/..."}`, `"codemirror": "/vendor/codemirror/"` in
`workbench_config.local.json`) keep working.

### STACK API (optional)

Only needed for **STACK ▶** on the Questions page (question tests run by STACK
itself, with STACK's input validation); everything else works without it.
Set up once per computer:

1. **Docker Desktop**: install it from <https://www.docker.com/products/docker-desktop/>
   (Windows: accept the WSL 2 backend it proposes, restart if asked), start
   it and wait until it reports "Engine running". Check in a console:

       docker run hello-world

   It prints "Hello from Docker!". Docker Desktop must be running whenever
   STACK ▶ is used (it can start with Windows: Settings → General).
2. **Versions of the Moodle server**: put this line into the text of any
   question (a test question in your course is enough) and preview it:

       Maxima: {#MAXIMA_VERSION_STR#}, STACK library: {#stackmaximaversion#}

   It shows e.g. `Maxima: "5.45.1", STACK library: 2026080600`. The
   STACK library number must exist as `config/stack/<number>/` with a
   `profile.json` naming the release tag (see `config/README.md`; for a new
   version: wiki page "Testing a new STACK version").
3. **Build the images** (internet needed - GitHub and Docker Hub; git is not
   needed; takes 10-20 minutes, mainly compiling Maxima, and some GB of disk):

       cd tools\workbench
       python stackapi.py build --maxima 5.45.1

   `--stack <number>` chooses the STACK version (default: the newest folder in
   `config/stack/`), `--maxima` the Maxima version of the server (default: the
   one goemaxima names for that STACK version). The images are
   `meclib-stackapi:<number>` and `meclib-goemaxima:<number>-<maxima>`.
4. **Check**:

       python stackapi.py up

   starts the containers and ends with `"running": true`. Then open a
   question with test cases and press STACK ▶. The workbench also starts the
   containers itself on the first STACK ▶. `python stackapi.py down` stops
   them (they use memory while running), `python stackapi.py status` reports.

When the Moodle server gets a new STACK or Maxima version, add the
`config/stack/<number>/` folder if needed and run `build` again with the new
versions; the compose file then uses the new images. Old images stay until
deleted in Docker Desktop (Images) or with `docker image rm <name>`.

The build writes the path of the working copy's `Maxima` folder into
`.cache/stackapi/docker-compose.yml` (for `stack_include` with the meclib
source "local working copy"): after moving the repository, run `build` again
(fast, the images are reused from Docker's cache) or edit that path.

If STACK ▶ reports that the STACK API does not answer: is Docker Desktop
running? `python stackapi.py up` shows Docker's messages;
`docker compose -f .cache/stackapi/docker-compose.yml logs stack` shows those
of the API. Port 3080 must be free. `MECLIB_STACKAPI_URL` (environment
variable of the workbench server) points the workbench to another STACK API
instead.

## Files

- `index.html`, `questions.html`, `tests.html` - the three pages
- `editor.js` - code editor of the Questions page: loads CodeMirror, Maxima
  and castext highlighting, syntax help, autocomplete, closing brackets
- `fetch_vendor.py` - downloads local copies of the CDN libraries for working
  offline (see Configuration)
- `build_help.py` - builds `syntax_help.json` (syntax help) from the code,
  the wiki, STACK's library and documentation and `syntax_help_extra.json`
- `frame.js` - builds and runs a graphic in a STACK-like frame (shared by the
  pages)
- `style.css` - shared styles
- `tree.js` - collapsible tree of the side column (Tests page)
- `mtests.py` - reads the Maxima test files for the Tests page
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

- a tree of folders, files and questions with context menus for their actions
- review of all questions in a folder at once
- templates for inputs and PRTs from the wiki
- editor assistants, e.g. `tansdata: copy(initdata)` with index variables,
  repeated points as variables
- bulk edits across questions (e.g. unifying the crosshair setup)
- keeping review rules, syntax help and wiki pages in step (`build_help.py`
  already lists differences)
- choosing the STACK version on the pages instead of always the newest one
- split files compatible with STACK's gitsync (category files, YAML)
- automatic multilingual castext: de/en versions of the texts kept together
  in `[[lang]]` blocks (not urgent)
- expected feedback per test case
- reference images of test cases (headless run), e.g. for wiki pages
- converting pixel graphics (hand sketches) into meclib objects on the
  Graphic page, possibly with AI support (low priority)
