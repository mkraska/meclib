# Open items and hand-over notes

Working notes for continuing meclib work with Claude in a new session. Not a wiki page:
this file lives in `doc/` and not in `doc/wiki/`, so the wiki sync does not publish it.
Last update: 2026-10-25.

## Getting back up to speed (for Claude)

Start a new session that is linked to Martin's computer. The meclib clone
(`C:\Users\kraska\Documents\GitHub\meclib`, branch `dev2026`) must be a connected folder,
plus the question folders (`Documents\STACK\TM1`, `TM3`, `Demo`) when questions are involved.
Then read the following, in this order. That is enough; do not scan the whole repo.

1. This file.
2. `doc/wiki/History.md`, the top section "Dev Branch". It lists what changed recently, in Martin's words.
3. `tools/workbench/README.md`, as far as the task needs it. The headings are an index:
   Questions, Evaluation, Tests, Configuration (offline, STACK API), Files, Planned.
4. For Maxima feedback functions: `Maxima/tests/README.md`. Run the offline tests with
   `Maxima/tests/run_tests.bat` (Windows). The result is written to `run_tests.log`.
5. `doc/wiki/Meclib Workbench.md` and `doc/wiki/Testing a new STACK version.md`, when the workbench or a STACK upgrade is the topic.

Further context:

- Martin's working rules, conventions and earlier decisions are in Claude's memory
  (`/areas/meclib-library-maintenance.md`). Claude reads it automatically when meclib comes up.
- The question-design rules are in the `meclib` skill.

Working rules, in short:

- Discuss the logic before coding. No code without explicit go-ahead.
- Write files directly into the clone. Martin reviews the diffs and commits himself with GitHub Desktop.
- Ask before bulk edits in ambiguous cases.
- New entries go at the top of `doc/wiki/History.md` (dated, wiki links in `[[...]]`).
- `doc/wiki/` is published to the wiki by the GitHub Action on push to `dev2026`.
- The git status shown inside the device shell is unreliable (CRLF artefacts). Never commit from there.

Environment facts:

- Moodle server: STACK 4.13.1 (library 2026080600), Maxima 5.45.1.
- Local Maxima: 5.48.1 (selectable in the workbench header).
- Optional STACK API in Docker Desktop: set `XDEBUG_MODE=off`, otherwise PHP is about three times slower.
- Workbench: `tools/workbench/start_workbench.bat`, then open http://localhost:8765/. Restart it after changes to the Python code.
- Offline: run `python fetch_vendor.py` once.

## Status (2026-10-25)

- Everything up to the changes of 2026-10-24 is committed and pushed, **except `doc/wiki/History.md`** (entries 2026-10-23 and 2026-10-24).
- STACK issue #1940 (quadratic step in `996_call_modification` filter): the PR from branch `iss1940` has been **merged** by the STACK developers. The fix will reach the Moodle server with the next STACK release. After that upgrade, measure the compile time of `fb_fbd.mac` again (before: 19 s, after the `fb_lang()` change: 8 s). The `iss1940` branch in Martin's fork of moodle-qtype_stack can be deleted.

## Open items

### Short term

- Commit `doc/wiki/History.md`.
- Review rule for verbatim copies of `meclib.js` in question texts (found in TM1 06 01 Aufgabe 2c, fixed by hand). Add the rule only if more such questions turn up.

### Performance and refactoring ideas (no decision yet)

- `meclib.js`: check whether a minified version helps the load time. Check first that the minifier does not break castext markers (`{@...@}`, `[[...]]`) or the version string at the top.
- If meclib is ever refactored:
  - First analyse what recent JSXGraph versions now offer, and which meclib workarounds and inconsistencies become unnecessary.
  - Review the coding style throughout.
  - Use named sets of options consistently. That alone should reduce the code size without loss of readability.

### Workbench

See "Planned" in `tools/workbench/README.md`: folder tree, review of a whole folder, templates, editor assistants, bulk edits, gitsync split files, and more.

- Importing into Moodle directly from the workbench is possible in two ways:
  - browser automation of "Import as new version"
  - `qbank_gitsync`, once the Moodle admin installs it
- Not started, waiting for the admin.

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
  - Not decided: whether the grey snap cross at the contact point follows the `hide` state of the referenced object.
  - Not decided: the extent of the grid-snap suppression.
  - Update the wiki pages for `fb_contact()` and `"contact"` (list references for several reference objects).
- Crosshair setup: unify by bulk edit once bulk editing exists.

### Questions

- TM3 01 T04: decide whether the origin-margin fix of T03 should be applied as well.
- "Walze über Stufe" (minimum pulling force over a step): design phase, no code yet.
