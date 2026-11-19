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

- `toTEX()` in `meclib.js` (Martin, 2026-11-16, TM3 08 07): names that stand for Greek letters (`alpha`, `Delta`,
  also with subscript or factor such as `Delta_p`, `Delta*p`) get a backslash in labels (`\\alpha`, `\\Delta\\;p`).
  Reason: object names go into the `names` input, which must hold valid Maxima (no backslash, and `NONAME` is not
  allowed either), so a TeX name such as `"\\Delta p"` on a force or angle makes the input invalid in Moodle.
  Questions load `meclib.js` from `main`, so this takes effect only after the merge.
  Done in `dev2026` (2026-11-16, test `tests/js/test_toTEX.js`; `phi`/`epsilon` as \\varphi/\\varepsilon like STACK,
  `alpha1` → `\\alpha_{1}`; no gap after Delta/delta; accents `hat`, `dot`, `ddot`, `bar` as suffix, e.g. `Fhat`,
  `x_ddot`, `phi_ddot`); open: Martin's test, merge to `main` (TM3 08 07 already uses `Fhat` and `alpha`).
  Documented on the new wiki page "Labels and names" (draft in `doc/wiki`, linked from all object pages with labels).
- Done in `dev2026` (2026-11-16): `cleanupName()` (forceGen, momentGen) keeps Greek names and accents (base, accent,
  subscript: `x_ddot m` → `xddot m`, `F_hat_A` → `Fhat_A`), name field grows with the name; test `tests/js/test_cleanupName.js`.
- Idea (Martin and Claude, 2026-11-16, to be tested): Maxima function that writes the `texput` entries for a list of names
  by the rules of `toTEX()`, e.g. `meclib_texput([Fhat, Ahat, xddot, phiddot])`, so sketch and STACK show the same.
  Maybe also an issue/pull request for STACK (accent suffixes in the display of names, like Greek names).

### Performance and refactoring ideas (no decision yet)

- `meclib.js`: check whether a minified version helps the load time. Check first that the minifier does not break castext markers (`{@...@}`, `[[...]]`) or the version string at the top.
- If meclib is ever refactored:
  - First analyse what recent JSXGraph versions now offer, and which meclib workarounds and inconsistencies become unnecessary.
  - Review the coding style throughout.
  - Use named sets of options consistently. That alone should reduce the code size without loss of readability.

### Workbench

See "Planned" in `tools/workbench/README.md`: folder tree, review of a whole folder, templates, editor assistants, bulk edits, gitsync split files, and more.

- Rule `prt.fb-floats` sets tolerance 0.005 for exactly graded algebraic answers (2026-11-18, TM3 09 02 a1, a2, Ep;
  fixed there by hand to 0): `_grading_tol()` matches SAns/TAns of the nodes literally, so `rat(S_a1)` vs `rat(a1)` or
  `trigexpand(S_a1)` vs `a1` is not found and `r_fb_floats` falls back to `"0.005"`; `prt.fb-floats-tol` has the same
  blind spot (only the weak hint "cannot be checked"). To do: recognise value-preserving wrappers (`rat`, `ratsimp`,
  `expand`, `trigexpand`, `trigsimp`, `fullratsimp`) on both sides, also in the fb_floats call itself; for algebraic
  inputs without a recognised grading node use 0, not 0.005 (0.005 is the standard for numbers); same matching in
  `prt.fb-floats-tol`; test cases in `test_rules.py` first. Then search all questions in `Documents\STACK` for
  `fb_floats(..., 0.005)` at exactly graded nodes (the rule has already been applied to them).
- Done (2026-11-18): a syntax error in a test input or model answer no longer kills the evaluation (`cas_expr()`:
  `eval_string()` inside `errcatch()`, test `SyntaxErrorsCaught`); a failed Maxima session is dropped from the pool and
  started again on the next run (`SessionPool.drop()`), on Windows killed with its process tree (tests
  `PoolDropsFailedSession`, `CloseKillsTree`). To check by Martin on Windows: TM3 09 02 test 4 shows NULL/invalid.
- Done (2026-11-18): Check hung with Maxima 5.48.1 on Windows (TM3 09 02): `kill(simp)` before the run (the question
  variables assign `simp`); now `meclib_kill()` in `meclib_kill.lisp` skips Maxima's option variables (test
  `KillKeepsOptionVariables`). Diagnosis script: `KI\meclib-STACK\diag\diag_hang.bat`. Confirmed by Martin on
  Windows with 5.48.1 (all tests of TM3 09 02 run).
- Done (2026-11-18): validation checks the names of answers as STACK does for students (forbidden and allowed words,
  question variables, the two-character rule, function calls; `student_word_errors()`, tests in `test_stack_question.py`);
  placeholders like `[[BASIC-ALGEBRA]]` are reported by the review hint `inputs.word-lists`, not resolved.
- Idea, not discussed (2026-11-18): review rule for assigned question variables whose name has an `s` entry in STACK's
  `security-map.json` (all Greek names, `e`, `i`): students can type the name and read the value (STACK agents guide, 2026-11-16).
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
- Review rule `prt.simp` (2026-11-16, TM3 08 07): no hint when no unit can be lost, i.e. when the first argument of
  `fb_unit()` is a feedback variable (e.g. an angle shifted by 360° in the feedback variables) or the input is of type
  `numerical`. Martin: unnecessary hints reduce the attention for hints in general. Discuss before implementing
  (test case in `test_rules.py` first).
- Done (2026-11-18): Check of the preview in STACK itself (switch Maxima | API, `/api/q/stackcheck`, test
  `test_stackcheck.py`). Still to check: a question with a meclib graphic in the PRT feedback (do STACK's
  frames draw in the workbench page?); TM3 09 02 has none.

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
