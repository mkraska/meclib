# meclib/config

Central, repo-wide configuration and locally-stored reference files for
meclib's development/test tooling. This directory is meant to grow with the
tooling described in the meclib wiki's "test environment" page - today it
backs the offline Maxima test harness (`../Maxima/tests/`); a planned local
website for question-variable/jsxgraph/feedback testing will use the same
layout for its own configuration.

## stack/

`stack/<plugin version>/maxima/` holds a verbatim copy of STACK's own
`stack/maxima/` directory (from https://github.com/maths/moodle-qtype_stack,
GPL-licensed) for that STACK plugin version - the same subtree the official
"STACK Maxima sandbox" (https://docs.stack-assessment.org/en/CAS/STACK-Maxima_sandbox)
points `stacklocation` at. `<plugin version>` is the numeric version string
from that release's `version.php` (e.g. `2026080600`, which is STACK
4.13.1), not the human release number, since that's what's unambiguous
across releases.

`../Maxima/tests/run_tests.mac` requires this library and loads the first
`stack/<version>/maxima/stackmaxima.mac` it finds here, so the offline tests
use STACK's real `castext_concat()`, `ct2_latex()`, `stack_disp...()`,
answer tests etc. It stops with an error message if nothing is here.

`stack/<plugin version>/security-map.json` is STACK's `stack/cas/security-map.json`
from the same release: the list of identifiers STACK refuses in questions
(e.g. the Maxima system variable `values`, or `eval_string`). The workbench
(`tools/workbench/`) uses it to report such statements as STACK would,
instead of evaluating them.

What the library does NOT contain, so `harness.mac` provides it:

- `castext()` itself - STACK's PHP compiler turns each `castext("...")`
  literal into Maxima code per question; there is no `castext()` function in
  the library. The harness renders the castext blocks the feedback functions
  use, with `{@...@}` going through the library's `ct2_latex()` as in STACK.
- the per-question language setting for `[[lang code='...']]` blocks
  (compiled castext checks it via `is_lang()`); the harness renders both
  languages and selects with `resolve_lang()`.

STACK's own compatibility table
(https://docs.stack-assessment.org/en/Installation/STACK_versions/) maps
each STACK release to a RANGE of supported Maxima versions, not a single
pinned one - e.g. 4.13.1 supports Maxima 5.40.0 through 5.49.0. So the
"right" version to keep here is whichever STACK release your target Moodle
actually runs, not necessarily the newest upstream release; check your
installed Maxima version against that release's supported range.

**Filled manually for now.** There's no fetch-it-yourself script yet - a
version is just a plain copy of that GitHub subtree, placed by hand (or by
Claude, on request). A setup script/website that lets you pick a target
STACK version and populates this automatically is a planned enhancement,
not yet built.

## jsxgraph/

Placeholder for the planned local website's jsxgraph configuration
(matching jsxgraph version to a target STACK release, local rendering
tests, etc.) - empty until that tool needs it. Unlike the Maxima version
range above, STACK's bundled jsxgraph version isn't documented anywhere
centrally; the most reliable signal found so far is the version banner
embedded in `corsscripts/jsxgraphcore.min.js`'s own minified header in the
moodle-qtype_stack repo.
