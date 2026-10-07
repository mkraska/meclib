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

`../Maxima/tests/run_tests.mac` looks here automatically: if any
`stack/<version>/maxima/stackmaxima.mac` exists, it loads that library and
gets STACK's real `castext_concat()` (and everything else the library
provides) instead of `harness.mac`'s lightweight stand-in. If nothing is
here yet, the test harness falls back to that stand-in and still works with
nothing but a bare Maxima install.

Two things that library load does NOT give you, so `harness.mac` keeps
providing them regardless of whether a sandbox is configured here:

- `castext()` itself - it is generated per-question by STACK's PHP compiler
  and is deliberately never part of the redistributable library.
- `[[lang code='...']]...[[/lang]]` selection - resolved by STACK's PHP
  rendering layer, never by Maxima, in either setup.

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
