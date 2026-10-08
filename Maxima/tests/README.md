# Offline Maxima Feedback Tests

Regression tests for meclib's Maxima-side feedback functions in
`../fb_fbd.mac` (free-body diagrams) and `../fb_value.mac` (symbolic and
numeric answers). Runs entirely offline - no Moodle, STACK server, or
network connection needed, only a local Maxima installation.

Purpose: before merging `dev2026` into `main`, changes to the feedback
functions can be checked without clicking through Moodle questions. Most
iteration loops on feedback functions come from small cosmetic slips - a
missing or doubled space, comma, period, or line break - so the tests compare
the rendered feedback text **exactly**, separately for German and English.

## Running

- Windows: double-click `run_tests.bat`. It looks for `maxima.bat` (on the
  PATH, then in the usual install locations; set `MAXIMA_OVERRIDE` at the
  top of the script if it isn't found), runs the suite and writes the output
  to `run_tests.log` in this folder. The log is a local by-product and should
  not be committed.
- Any platform with Maxima on the path: from this folder,
  `maxima --very-quiet -b run_tests.mac`

Output is one `FAIL [...]` block per mismatch - showing the exact got/expected
text for the flag, the German and the English feedback - followed by a final
`N passed, M failed` summary line.

## STACK's Maxima library (required)

The suite runs against STACK's own Maxima library (`stack/maxima/` from
moodle-qtype_stack), kept in the repository under
`../../config/stack/<version>/maxima/` (see
[`../../config/README.md`](../../config/README.md); currently `2026080600` =
STACK 4.13.1). `run_tests.mac` loads it first and stops with an error message
if it is missing. So `castext_concat()`, `stack_disp...()`, `real_numberp()`,
the answer tests and `ct2_latex()` are the real ones.

`ct2_latex()` matters for the expected texts: like compiled castext in STACK,
the harness renders every `{@expr@}` through it, so a CAS value appears as the
student sees it in Moodle, e.g. `{@S_10@}` as `\({{S}_{10}}\)` and
`{@5.0@}` as `\({5.0}\)`. (Strings stay plain: `{@"17"@}` gives `17`.)

## What's in this folder

- **`run_tests.bat`** - Windows launcher (see "Running" above).
- **`run_tests.mac`** - the test runner. Loads the real STACK library if
  present, then `harness.mac`, `../fb_fbd.mac`, `../fb_value.mac` and
  `fixtures/scenes.mac`, then every `test_*.mac` file explicitly listed at the
  bottom of the file, then prints the summary via `s_test_summary()`.
- **`harness.mac`** - the offline test harness:
  - `castext()` is a small template renderer (`fb_tmpl_render()`), since
    STACK's PHP compiler turns each `castext("...")` literal into Maxima code
    per question - there is no `castext()` in the library. It handles
    `{@expr@}` (evaluated in the calling function's scope and rendered with
    the library's `ct2_latex()`, as STACK does), `[[define]]`, `[[foreach]]`
    and `[[if]]/[[else]]`.
  - `[[lang code='...']]...[[/lang]]` selection is reimplemented in
    `resolve_lang()`, following STACK's own rule
    (<https://docs.stack-assessment.org/en/Authoring/Languages/>), so a test
    sees the exact text a student gets in each language.
  - `debug` defaults to `false`, as in a STACK question that doesn't set it.
  - Test entry points (see below) and `s_test_summary()`.
- **`test_<function>.mac`** - one file per feedback function or closely
  related family of functions (`test_fb_fix1.mac`, `test_fb_vars.mac`, ...).
- **`fixtures/scenes.mac`** - generated, do not edit: the objects and names
  meclib produced for the test scenes in `../../tests/scenes/` (see "Scene
  fixtures" below).

## Writing tests

Three check functions, depending on what the function under test returns:

| Function returns | Check with | Compares |
|---|---|---|
| `[text, ok]` (e.g. `fb_fix1()`, `fb_contact()`, `fb_coeffs()`) | `fb_check(result, expected_ok, expected_de, expected_en, label)` | flag and rendered text (de, en) |
| a feedback string (e.g. `fb_vars()`, `fb_unit()`) | `fb_check_str(result, expected_de, expected_en, label)` | rendered text (de, en); `""` means "nothing to say" |
| a CAS value (e.g. `fb_dim()`, `deg2rad()`) | `fb_check_val(actual, expected, label)` | algebraic equality (`ratsimp` of the difference) |

Example:

```
o_ok: [["fix1","A",[0,0],0,"hide"], ["force","R_A",[0,0],[0,1],"active"]];
n_ok: [[2], "R_A"];
fb_check(fb_fix1(o_ok, n_ok, 1, "A: "), true,
  "<br>A: Reaktion \\(R_A\\) gefunden.",
  "<br>A: Reaction \\(R_A\\) found.",
  "fb_fix1 ok");
```

Conventions:

- Expected texts are written exactly as the student sees them, after
  `[[lang]]` selection, including HTML entities such as `&nbsp;` and
  `&uuml;`.
- Where possible, take expected texts from a verified source, e.g. the
  "unit test" questions in `../../demo_questions/`, whose PRTs contain
  hand-checked feedback strings.
- For objects and names, prefer a scene fixture (below) over a hand-written
  list where the situation is more than a minimal one-object case.
- If a test documents current behaviour that is known to be unsatisfactory,
  say so in a comment next to it, so it isn't mistaken for the intended
  result.
- A new test file needs an explicit `load("test_<name>.mac")$` line near the
  bottom of `run_tests.mac` - files are not picked up automatically.

## Scene fixtures

Hand-written `o`/`n` lists can drift from what meclib actually produces (for
example meclib appends a state to a `beam`, or assigns a load to a target the
author didn't expect). For realistic cases, use the objects and names stored
with the test scenes in `../../tests/scenes/`:

```
o_unidir: scene_obj("fb_unidir", "init");
n_unidir: scene_names("fb_unidir", "init");
```

`fixtures/scenes.mac` is regenerated from the scenes by the tryout
(`tools/tryout`) on every save, or by hand with
`python tools/tryout/scenes_to_maxima.py`. Commit it together with the scene
files, so the suite runs with nothing but Maxima. A case is referenced by its
id; `scene_obj()`/`scene_names()` stop with an error naming the missing
scene/case if it doesn't exist. See `../../tests/scenes/README.md`.

## Formatting conventions checked by the tests

- Free-body-diagram functions (`fb_fbd.mac`) start their feedback with
  `<br>` and the description; a function producing several sentences on
  different topics starts each of them with `<br>`.
- `fb_vars()`, `fb_unit()` and `fb_coeffs()` (`fb_value.mac`) don't insert
  line breaks, since they are often placed directly behind an input and its
  validation; each message starts with `&nbsp;` instead. A description or
  label passed to them should not end with a space.
