# Offline Maxima Feedback Tests

Regression tests for meclib's Maxima-side feedback functions (currently
`../fb_fbd.mac`; more `fb_*.mac` files are expected to grow their own
`test_*.mac` files here over time). Runs entirely offline - no Moodle,
STACK, or network connection needed.

## Running

- Windows: double-click `run_tests.bat`. It finds a local Maxima install,
  relaunches itself so the console output survives even after
  `maxima.bat` closes its window, and also writes a `run_tests.log`
  transcript alongside it.
- Any platform with Maxima on the path: from this folder,
  `maxima --very-quiet -b run_tests.mac`

Output is one `FAIL [...]` line per mismatch - showing the exact got/expected
text - followed by a final `N passed, M failed` summary line.

## What's in this folder

- **`run_tests.bat`** - Windows launcher (see "Running" above).
- **`run_tests.mac`** - the test runner. Loads `harness.mac`, then
  `../fb_fbd.mac`, then every `test_*.mac` file explicitly listed at the
  bottom of the file, then prints the pass/fail summary via
  `s_test_summary()`. Also looks for a local STACK-Maxima sandbox under
  `../../config/stack/` (see below) before loading anything else.
- **`harness.mac`** - the offline test harness:
  - stubs `castext()` unconditionally, and `castext_concat()` only when no
    real STACK library was loaded (see below) - both are plain-identity /
    plain-concatenation stand-ins
  - reimplements STACK's `[[lang code='...']]...[[/lang]]` selection rule
    (see <https://docs.stack-assessment.org/en/Authoring/Languages/>), so a
    test can check the *exact* rendered text per language, not just a
    true/false flag
  - exposes `fb_check(result, expected_ok, expected_de, expected_en, label)`
    as the test entry point and `s_test_summary()` to print the running
    totals
- **`test_fb_contact.mac`, `test_fb_force.mac`, ...** - one file per
  feedback function (or closely related family of functions), following
  the `test_<function>.mac` naming convention. A new test file needs an
  explicit `load("test_<name>.mac")` line added near the bottom of
  `run_tests.mac` - it is not picked up automatically by folder scanning.

## Why exact string comparisons

Most iteration loops on feedback functions come from small cosmetic
formatting slips - a missing space, comma, period, or line break - not
logic errors. `fb_check()` therefore compares rendered text with exact
string equality and prints a precise got/expected diff per mismatched
field, rather than something to eyeball away.

## Optional: testing against the real STACK-Maxima library

By default `castext_concat()` is `harness.mac`'s plain-concatenation
stand-in. If a copy of STACK's own `stack/maxima/` library is placed under
`../../config/stack/<version>/maxima/`, `run_tests.mac` loads the real
library instead, so the suite also exercises castext2's actual internal
merging behaviour rather than the stand-in.

See [`../../config/README.md`](../../config/README.md) for how to set that
up (filled by hand for now) and for why `castext()` itself and `[[lang]]`
resolution stay stubbed here regardless of whether that sandbox is
configured - both are resolved by STACK's PHP layer, never by Maxima, so
there is no "real" version of them to load.
