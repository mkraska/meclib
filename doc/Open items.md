# Open items and hand-over notes

Working notes for continuing meclib work with Claude in a new session. Not a wiki page:
this file lives in `doc/` and not in `doc/wiki/`, so the wiki sync does not publish it.
Last update: 2026-11-06.

## Getting back up to speed (for Claude)

Start a new session that is linked to Martin's computer. The meclib clone
(`C:\Users\kraska\Documents\GitHub\meclib`, branch `dev2026`) must be a connected folder,
plus the question folders (`Documents\STACK\TM1`, `TM3`, `Demo`) when questions are involved.
Then read the following, in this order. That is enough; do not scan the whole repo.

1. This file.
2. `doc/wiki/History.md`, the top section "Dev Branch". It lists what changed recently, in Martin's words.
3. `tools/workbench/README.md`, as far as the task needs it. The headings are an index:
   Questions, Evaluation, Tests, Configuration (offline, STACK API), Files, Planned.
4. For review rules and other workbench code: `tools/workbench/tests/` (Python `unittest`, no Maxima needed).
   Run `tools/workbench/tests/run_tests.bat` (or `python -m unittest discover -s tests -v` in `tools/workbench`)
   before handing over. A changed or new rule gets a test case first (it must fail with the old code).
5. For Maxima feedback functions: `Maxima/tests/README.md`. Run the offline tests with
   `Maxima/tests/run_tests.bat` (Windows). The result is written to `run_tests.log`.
6. `doc/wiki/Meclib Workbench.md` and `doc/wiki/Testing a new STACK version.md`, when the workbench or a STACK upgrade is the topic.

Further context:

- Martin's working rules, conventions and earlier decisions are in Claude's memory
  (`/areas/meclib-library-maintenance.md`). Claude reads it automatically when meclib comes up.
- The question-design rules are in the `meclib` skill.

Working rules, in short:

- Discuss the logic before coding. No code without explicit go-ahead.
- Write files directly into the clone. Martin reviews the diffs and commits himself with GitHub Desktop.
- Ask before bulk edits in ambiguous cases.
- New entries go at the top of `doc/wiki/History.md` (dated, wiki links in `[[...]]`).
- After changing review rules: `python build_rules_doc.py` (wiki page "Meclib Workbench Review Rules").
- Do not run `build_help.py` without a wiki clone: it then drops many entries from `syntax_help.json`.
- `doc/wiki/` is published to the wiki by the GitHub Action on push to `dev2026`.
- The git status shown inside the device shell is unreliable (CRLF artefacts). Never commit from there.

Environment facts:

- Moodle server: STACK 4.13.1 (library 2026080600), Maxima 5.45.1.
- Local Maxima: 5.48.1 (selectable in the workbench header).
- Optional STACK API in Docker Desktop: set `XDEBUG_MODE=off`, otherwise PHP is about three times slower.
- Workbench: `tools/workbench/start_workbench.bat`, then open http://localhost:8765/. Restart it after changes to the Python code.
- Offline: run `python fetch_vendor.py` once.

## Status (2026-11-06)

- Committed and pushed up to 2026-11-01. The changes of 2026-11-06 (review rules `include.unused` fix,
  `maxima.multsgn`, `prt.fb-floats`, `prt.fb-vars-label`, `qv.fb-dims`, `prt.feedbackformat` per PRT; editor: closing
  brackets before `@}`, one-line code editors for model answer and syntax hint; preview: Markdown feedback grey;
  `tools/workbench/tests/`) are in Martin's clone, not committed yet. Details in `doc/wiki/History.md`, 2026 11 06.
- To check by Martin: one question converted by `prt.fb-floats` in the workbench (Check with a wrong answer).
- STACK issue #1940: merged; after the next STACK release on the Moodle server, measure the compile time of
  `fb_fbd.mac` again (before: 19 s, after the `fb_lang()` change: 8 s). Branch `iss1940` in Martin's fork can go.

## Open items

### Short term

- Review rule for verbatim copies of `meclib.js` in question texts (found in TM1 06 01 Aufgabe 2c, fixed by hand). Add the rule only if more such questions turn up.

### Performance and refactoring ideas (no decision yet)

- `meclib.js`: check whether a minified version helps the load time. Check first that the minifier does not break castext markers (`{@...@}`, `[[...]]`) or the version string at the top.
- If meclib is ever refactored:
  - First analyse what recent JSXGraph versions now offer, and which meclib workarounds and inconsistencies become unnecessary.
  - Review the coding style throughout.
  - Use named sets of options consistently. That alone should reduce the code size without loss of readability.

### Workbench

See "Planned" in `tools/workbench/README.md`: folder tree, review of a whole folder, templates, editor assistants, bulk edits, gitsync split files, and more.

- Speed of Maxima on Windows (2026-11-12): the timing of a batch test run shows the time is spent computing in
  Maxima (TM1 09 04: about 0.12 s per PRT on Windows, 0.03 s on Linux). Next: a lean mode for batch runs (no TeX of
  SAns/TAns, no feedback castext), then Maxima in WSL (Ubuntu 22.04 has Maxima 5.45.1 as the Moodle server) or
  goemaxima in Docker.
- Way back to Moodle (2026-11-06): `qbank_gitsync` not before February 2027, and IT is still deciding whether to
  install it at all - do not depend on it.
  - Bulk changes only between two courses, on the whole course backup (.mbz: download, change, restore). To check:
    the questions are in Moodle's backup format there, not Moodle XML.
  - Single changes in between: browser automation of "Import as new version".
  - Export and import of a category only if "import as new version" works for a whole category (otherwise the
    quizzes keep pointing to the old questions).

### Feedback functions (from earlier sessions, still open)

- `fb_unit()`: the check uses `real_numberp()`, which exists only with the STACK library. Offline without it, the check falls through. This is harmless in STACK.
- `fb_coeffs()`: the convention "description without a trailing space" is to be documented on its own wiki page `fb_coeffs()`.
- `fb_name()`:
  - With several loads, only the first one is checked.
  - No `<br>` at the start.
  - A space before `\)`.
  - The optional 4th argument is undocumented.
- `fb_spline()`: will be reformatted anyway (GitHub issue).
- `contact`:
  - Done (code and wiki page `contact`): the grey cross is shown only while the referenced object is deactivated.
  - Not decided: the extent of the grid-snap suppression.
  - Update the wiki pages for `fb_contact()` and `"contact"` (list references for several reference objects).
- Crosshair setup: unify by bulk edit (course backup, see Workbench).

### Questions

- TM3 01 T04: decide whether the origin-margin fix of T03 should be applied as well.
- "Walze über Stufe" (minimum pulling force over a step): design phase, no code yet.
