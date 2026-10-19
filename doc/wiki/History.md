### Dev Branch

2026 10 19
- [[Meclib Workbench]], Questions page, "Input ...": types "choice: dropdown list" and "choice: radio buttons" (model answer `X_mcq`, a list of choices added as a template at the beginning of the question variables; PRT `S_X` = `mcq_correct(X_mcq)[1]`); the messages report a choice list that is not a list or has no correct choice
- [[Meclib Workbench]], Questions page: choice inputs (dropdown, radio, checkbox) in the preview, with the entries of the evaluated model answer `[[value, correct, display], ...]`; "TAns" picks the correct entries, "Check" passes the chosen value (checkbox: the list of the ticked values) to the PRTs
- [[Meclib Workbench]], Questions page: the note on a missing `;` in the question variables names the line where it is missing ("no ; at the end of this line"); a click puts the cursor right where the `;` belongs

2026 10 18
- [[fb_floats()]]: the deviating numbers and extra summands are underlined instead of red (`\color` needs a MathJax extension that Moodle's MathJax 3 may fail to load; the whole formula was replaced by an error message)
- [[fb_floats()]]: no feedback on the numbers when a summand has a wrong unit (with `fb_dims`)
- [[Meclib Workbench]], Questions page: "Graphic: interactive ⇄ static" switches the `[[jsxgraph]]` block at the cursor (inputs `objects`/`names` deleted or added, `input-ref-...` and `var stateRef;` adjusted; refused while a PRT uses the inputs); new review rules for graphics bound to missing inputs, interactive graphics in the feedback and left-over graphic inputs

2026 10 17
- New feedback function [[fb_floats()]] in `fb_value.mac`: symbolic answers with rounded coefficients of any structure (products, powers, roots); both answers are normalised with `expand(float(...))`, the expressions without their numbers must agree, and the numbers are compared one by one with a relative tolerance (feedback per deviating number, via [[fb_unit]])
  - the evaluated form of the answer is shown with the deviating numbers underlined, if the answer differs from it
  - the summands are compared one by one: an extra summand is underlined, with the [[fb_vars]] feedback for it ("Check the marked term." otherwise); a missing summand is reported ("right except for a missing term")
  - optional unit check: with `fb_dims: [a = "m", c = "N/m", ...]` (units as strings, no clash with variables such as `m`) a marked summand or the whole answer is checked for its unit (wrong unit, sum of different units, function of a quantity with a unit); `fb_dimension(sans, tans)` for the whole answer alone
- [[Meclib Workbench]], Questions page: a change of the open file on disk is noticed when the page gets the focus again; without unsaved edits the file is reloaded, otherwise the conflict box ("Reload from disk" / "Apply my edits") appears; a renamed or deleted file is reported
- `fb_floats()`: no `concat()` any more (forbidden in STACK questions; the decimal numbers are hidden behind `%_P[i]` instead)
- offline tests (`Maxima/tests`): new test `test_security.mac` - no function of the meclib files may call a function or use a variable that STACK forbids in every question (from STACK's security map)
- [[Meclib Workbench]], syntax help: about 90 more Maxima functions (lists such as `copylist`, `member`, `delete`, `assoc`, `sort`, `lsum`, `apply`; strings; `sqrt`, `atan2` and the other elementary functions; algebra such as `expand`, `coeff`, `rhs`, `linsolve`; vectors and matrices; predicates), with short examples for working with `initdata`

2026 10 16
- [[Meclib Workbench]], Graphic page:
  - "Edit points": a red handle on each point argument of the objects (taken from the object signatures of the syntax help); dragging one changes initdata and redraws the graphic, snapping to 1, 0.5 or 0.1 grid units or free
  - shelf of object types (supports, bodies, loads, kinematics, annotation): drag one onto the graphic, or click it and then into the graphic; it is added to initdata at that point with default arguments (signature and description as tooltip)
  - the initdata field is a code editor with the syntax help of the Questions page (signature box, autocomplete of object names after `["`)
  - the help box of a code field no longer disappears when another field had the focus before
- [[Meclib Workbench]], Graphic page: the shelf buttons show icons of the objects (`shelf_icons.json`, made by `tools/workbench/build_shelf_icons.py` with the workbench server and Playwright; run it again after a change of the shelf or of the drawing of an object)
- [[Meclib Workbench]], code editors: the help box can be dragged out of the way (it stays there, double click: it follows the cursor again); F2 switches it off and on (Questions page: also in the editor settings)
- [[Meclib Workbench]], Tests page: timing summary next to the pass count (sum and median of the initialisation times, slowest case, wall time) and a table of the runs of the session, to compare JSXGraph or meclib versions

2026 10 15
- [[Meclib Workbench]]: the variables table of the preview lists names assigned by a list assignment such as `[aa, bb]: rand([[1,4], [2,3]])` (they were missing)
- Wiki sync (`tools/wiki_sync.py`): a page last changed by the sync itself is no longer taken for an edit on GitHub (the run of 2026 10 15 failed on History for this reason)

2026 10 13
- [[fb_EE()]]: the feedback for an equation with wrong terms ("Prüfen Sie den Term mit ...") showed as raw castext (`["%root", ...]`) in Moodle; fixed
- [[Meclib Workbench]]:
  - Maxima times in the preview header (variables, texts, answers, PRTs) and per PRT below its feedback (feedback variables, nodes); the first run after a Maxima start is marked, since it includes Maxima's warm-up
  - PRT trees run left to right when they fit the column, with the description of each node
  - meclib scenes (`[[jsxgraph]]`) in PRT feedback are shown in the preview; the specific feedback is evaluated with the answers and shown below the question
  - review rule "Multilingual syntax hint" adds `stack_include` of `fb_value.mac` when the question lacks it
- Wiki pages are published from the drafts in `doc/wiki` by a GitHub Action on every push to `dev2026` (`tools/wiki_sync.py`); pages edited on GitHub since are not overwritten but reported
- Top level `.gitignore` (workbench history and backups, logs, Python caches)

2026 10 12
- [[Meclib Workbench]]: 
  - MathJax 3.2.2 (default of Moodle 5) can be chosen for the graphics
  - syntax help in the code editors (signatures, argument descriptions, wiki/STACK documentation links, autocomplete, castext snippets, closing brackets), built by `build_help.py` from code, wiki and STACK documentation
  - the preview keeps the answers after an edit and checks again, **Restart** clears them
  - each PRT sees only its own feedback variables (as in STACK)
  - profiling: The messages show where Maxima spends the time
  - side bars beside editor and preview with the buttons of the column and its sections (side set in the bar's `⋯` menu, which also holds the editor settings)
- [["contact"]]: default length of the gray cross is 3 grid units (was 1)
- [[Feedback for "contact"]]: forces at the contact with other names are commented as probable reactions (normal, tangential, or with their angle), unless listed in the new optional argument `ignoreNames`; wrong directions are reported with their angle
- [["forceGen"]], [["momentGen"]]: no load is created while the name field is empty; the field is outlined in red instead
- New function [[fb_objects()]]: reads the objects input like `stackjson_parse(objects)`, about 60 times faster (0.02 s instead of 1.2 s for 25 objects, in every PRT)
- New feedback function [[fb_EE()]]: one equation of equilibrium against the sums of the student's free-body diagram (sign of the sum, names, terms; empty if right)
- [[Sums of Forces and Moments]]: new `sumF()` (sum of forces in a direction, also of a [["dir"]] object) and `sumM()` (moments about a point) with the options `contacts` (forces at contacts with the exact direction of the contact and the contact point) and `at` (symbolic point of application, e.g. a centre of gravity); `sum_xyM()` uses them and is kept for existing questions
- New feedback function [[fb_fbd()]]: the checks of a free-body diagram that do not depend on a single support (system boundaries, names: missing, taken by given loads or reserved symbols, the same at several supports, form; number of drawn forces and moments)
- New function [[fb_contact_reactions()]]: names of the normal and the friction force the student drew at a contact, to build reference equations with the student's names
- New feedback function [[fb_unique_names()]]: reactions at several supports must have different names (replaces the unfinished draft `fb_duplicates()` on [[Feedback for Free Body Diagrams]])
- Offline Maxima tests use the newest STACK version in `config/stack/`, as the workbench does; new wiki page [[Testing a new STACK version]]


### Main Branch

2026 10 11
- [["line2p"]]: control points no longer stick to intersections that depend on the line itself (questions that add such intersections to `targets`, see [[Dynamic intersection of two "line2p" obbjects]]); while a control point is dragged, those elements are neither attractors nor snap points
- Regression test scenes can simulate drags (`drags` field in `tests/scenes`), new scene `line2p_intersections` 
- New matrix feedback functions [[fb_unit_matrix()]] and [[fb_vars_matrix()]] in `fb_value.mac`: element-wise check of vector and matrix answers, feedback only for wrong elements, with labels (x-component, Row 1 column 2, or own labels like `['x_A, 'y_A]`); see [[Matrix Feedback]] and [[Matrix input]] (question text as a table row with label, input, unit and validation)
- `fb_system()`: system elements must be shown and environment elements must not be shown; feedback text starts with `<br>` like the other feedback functions
- [["q"]]: missing angle (`phi`) in the state data defaults to 0
- [[Meclib Workbench]]:
  - input dialog for vector/matrix inputs (numbers or expressions) creating input, PRT and table row
  - PRT editor (nodes, feedback variables, add/delete nodes and PRTs) with the node tree in the preview column, taken branches highlighted after Check
  - Undo/Redo, kept in `.workbench-history` next to the question file
  - inputs and PRTs sorted by their position in the question text
  - new review rules: math delimiters in Markdown (`\\\(` recommended), old matrix feedback, unused embedded files (shown with the option to delete them)
  - embedded images in the preview, section navigation buttons, split of multi-question files into one file per question in category folders
  - review rule for missing `;` at line ends of Maxima code
  - split files contain no category entry, so they can be imported as a new version
- Offline tests for `fb_name()`, `fb_spline()`, `fb_system()` and the matrix functions ([[Offline Maxima Tests]]); object scenes for supports, loads, bodies and annotations

2026 10 07
- `fb_fix13_names()`: removed a dead check on an unassigned variable (no H/V/x/y naming check for fix13, which has exactly one reaction force); wording of the "single letter" message aligned with `fb_fix1_name()`
- `fb_unit()`: added the missing `&nbsp;` to four English messages (too large, too small, sign, mantissa)
- `fb_coeffs()`: removed a double gap between the variable name and the coefficient feedback; new wiki page [[fb_coeffs()]]
- `fb_q()`: relative magnitude check now uses the absolute relative error, so too large values are detected as well
- `fb_fix1()`, `fb_fix12()`, `fb_fix123()`, `fb_fix13()`: removed a double space in the "not deactivated" message
- Offline regression tests for the Maxima feedback functions (`Maxima/tests/`), see `Maxima/tests/README.md`



2026 10 06
- Internationalization (`[[lang]]`) completed for the remaining Group-2 feedback functions (`fb_fix13`, `fb_fix13_names`, `fb_force_hvxy`)
- Restructured all internationalized free-body-diagram feedback functions (`fb_name`, `fb_force`, `fb_force_hvxy`, `fb_fix1`, `fb_fix12`, `fb_fix12_name`, `fb_fix123`, `fb_fix123_name`, `fb_fix13`, `fb_fix13_names`, `fb_unidir`, `fb_contact`) to a "split-parts" architecture: every language-specific text fragment is a named local variable declared once at block entry; dynamic values are plain-concatenated at the point of use instead of being rebuilt per call
- Settled convention: developer-facing diagnostic messages (question-authoring errors, not student mistakes) stay English, inline, unhoisted
- Fixed inconsistency in `fb_contact()`'s unresolved-`targetRef` message (was German/unwrapped, now English, matching the above)

2026 10 05
- `fb_force()`: signature extended for a unit-tagged `toldist` (grid-scaled distance tolerance)
- `fb_name()`: made more robust — new optional `[opt]` parameter to silence the "no match" message; name comparison now normalizes CAS symbols vs. strings before comparing
- `fb_contact()`: add a compression/tension sign check (a contact can only push, never pull)

2026 10 04
- `fb_force()`: added a line-of-action distance tolerance (plain number or unit-tagged `[tol,"unit"]`); multi-name LaTeX rendering and `castext()` formatting fixes
- Add `fb_force()`: general-purpose check for a single active force not tied to a support/contact index (direction + line-of-action-through-a-point check)

2026 10 03
- `fb_contact()` / `fb_resolve_ref()`: `targetRef` may now be a list, so one contact can cut away several environment objects at once (e.g. two wall segments meeting at a corner)

2026 09 30
- Adjust the formatting of result strings in `fb_system()` and `fb_reactions()`
- Fix the error handling in `fb_unit()`
- Avoid unintended units activation in `fb_unit()`
- Fixed problem in `fb_coeffs()` and make it bilingual
- Extend `fb_dir()` and add `fb_reaction_name()`
- Adjust the signature of `fb_varsOK()` to match `fb_vars()`

2026 09 29
- Adjust a feedback string in `fb_contact()`

2026 09 29
- Add `active` option to [["dir"]] object for choosing a coordinate direction; new `sum_dir()`, `contributor()`,
  and [[Feedback for "dir"]] (`fb_dir()`)
- `fb_coeffs()`/`fb_vars()` gained a coefficient tolerance parameter, filtering out numerically
  negligible terms before checking for missing/spurious variables
- New `deg2rad()` in `fb_value.mac` for grading answers that use the `deg` unit symbolically
- [[Feedback for "contact"]]: dropped the quotes around the referenced object's name in the
  "not deactivated" message

2026 09 26
- Add [["contact"]] object for free body diagrams

2026 09 22
- Fix [#63](https://github.com/mkraska/meclib/issues/63), Infobox not displayed for points with children, due to a temporary regression in JSXGraph 1.12.1 and 1.12.2

2026 04 09
- Fix [#57](https://github.com/mkraska/meclib/issues/57), was due to buggy version comparison

2026 04 08
- Update jsfiddle link in wiki (still with limitations)
- Fix [#58](https://github.com/mkraska/meclib/issues/58) (text field size in [["momentGen"]] and [["forceGen"]])

2026 03 07
- Make multilingual string constants in feedback functions local (for `fb_value.mac`)
- Add constants for multilingual syntax hints [[Multilingual questions]]

2025 05 13
- Bilingual and separator-aware version of `fb_spline()` [[Values and Slope of Splines]]

2025 03 30
- Fix grid spacing for JSXGraph 1.10.1

2025 03 28
- Fix the decimal separator in the feedback provided by [[fb_unit]]

2025 03 04
- Bilingual version of [[fb_unit]] with updated unit test question

2025 03 02
- Bilingual version of [[fb_vars]] with updated interactive and unit test questions

2025 02 18
- Handle missing decsep attribute if fbd_names object is available (as in ONYX)

2025 02 17
- Implemented [#51](https://github.com/mkraska/meclib/issues/51) (decimal separator synchronized with STACK)
- Adjust placement of version info

2024 11 26
- `cleanupName()` in `meclib.js` modified to avoid spurious spaces 

2024 11 25
- `fb_reactions()` corrected
- `sums_xyM()` created 

2024 11 24 
- Add snap parameter to [["crosshair"]], adjust layer 

2024 11 21
- Fix problem with [[fb_bar]]

2024 11 16
- Re-implementation of [["rope"]] (only in meclib.js, not in imeclib.js)

2024 10 24
- Fix [["polygon"]] (only in meclib.js, not in imeclib.js)

2024 10 14
- Adjust color and layer of axes defined by [["grid"]]

2024 09 24
- Takeover of dynamic objects
- Fix default of drawZero option for grid 

2024 04 02
- Fix serialization of [["circle"]] (method `data()`)

2024 03 08
- Fix of #47, detection of resultants of [["q"]]
- Fix tick label digits in [["grid"]]

2024 03 04 
- Add [[MatchByParallel()]]
- Add [[fb_system()]]
- Fix `fb_fix1()`

2024 03 02
- Fix snap behaviour of [["force"]]
- Add [[fb_reactions()]]

2024 02 23
- Fix label offset for [["rope"]]

2024 02 21
- Enforce snaptogrid of [["force"]] objects when dragging the vector

2024 02 19
- Fix #46, update of input fields by [["force"]] object

2024 02 17
- Modify behaviour of [[fb_vars]] (nonzero numeric `tans` values now aren't ignored).
- Add unit test for [[fb_vars]].

2023 12 05 
- Implement #32 (avoid zero length of force vectors)

2023 12 02 
- Takeover of https://github.com/aaronamran/meclib_fork/blob/main/meclibchanges.js as imeclib.js. In this version most objects can be moved by JS scripts. See [[Moving objects by scripts]]

2023 10 06 
- Enforce grid distance of one axis unit (sometimes sub-gridlines were drawn)

2023 08 03
- Switch off automatic point names (relevant for script-generated points)

2023 07 08
- Auto-correction of input in [["momentGen"]] and [["forceGen"]] to avoid complaints by STACK about forbidden names (with more then one character before the first underscore).

2023 06 28
- Add object [["frame"]]

2023 06 09
- Fix issue #33 in [["grid"]] (formatting of axes tick labels in JSXGraph 1.5) 

2023 05 12
- Add option `"dotted"` to [["force"]]

2023 05 08 
- Fix issue #38 in [[fb_unit]] 

2023 05 04
- Adjust container sizing logics in [["grid"]] to upcoming new STACK version
- Add "Change" event in the update() function for notification of changed input in new STACK version

2023 04 30
- Change layer of [["grid"]] to 8. This puts axes and grid to the foreground. Grid should be in the background. See issue [#37](../issues/37)

2023 04 29
- Extend [["polygon"]], can have multiple holes now.
- Color of [["line"]] objects can be specified via "name" argument
- Color of [["node"]] objects can be specified via optional argument 

2023 04 16
- Add English version of [[fb_vars]] and [[fb_unit]]

2023 04 09
- Add unit test for [[fb_vars]]

2023 04 08 
- Change the test concept for [[fb_unit]]. Test is split into an interactive one (quiz mode adaptive) and a non-interactive one (quiz mode direct). This was enforced by the non-interactive test suite failing by timeout in adaptive quiz mode, which is better for interactive tests.
- Add interactive test question for [[fb_vars]].
- Add unit test question for [[Feedback for unidirectional supports]].

2023 04 07 
- Add [[fb_name]] to `fb_fbd.mac`

2023 02 07
- Add tests T03a and T03b to unit test QA 01 for [[fb_unit]]. They adress cases with zero tolerance.

2023 01 23
- Implementation and unit test (QA 05) for [[fb_bar]]
- Fix unit test (QA 04a) for [[Feedback for line loads]]
- Fix unit test (QA 03) for [[Feedback for unidirectional supports]]

2023 01 21
- Complete conversion of [[Feedback for line loads]] to use of `castext()`. Closes #27.

2023 01 17
- Fix [[Feedback for line loads]] formatting of feedback for resultant value

2023 01 16
- Fix [[fb_unit]] feedback for correct results

2023 01 13
- Deactivate `snaptopoint` for inactive forces to prevent unintended misplacement.

2022 12 16
- Create function [[fb_bar_name]] and corresponding unit test (QA 02 in the [[Demo Moodle Course]])
- Improve function `toTEX()` in meclib. Better display of multi-character indices.

2022 12 11
- Improvements of unitless value handling in [[fb_unit]]

2022 12 09 
- Add diagnostic message to init() function (for unknown object specifications)

2022 12 02
- Improvements of zero value input handling in [[fb_unit]]
- Streamlining of the test question for [[fb_unit]] (QA 01 in the [[Demo Moodle Course]])

2022 11 25
- [["crosshair"]] writes scaled coordinates to `names`.

2022 11 23
- [["grid"]] Support for inverted axes directions
- Avoid empty names in `names` input field by converting empty names to `NONAME`.

2022 11 05
- Version info string modified. Now JSXGraph version and Meclib version are displayed.

2022 10 30 
- [["spline"]] with option `pure` has no grid snap of the control points. This ensures that the control points are set as specified.

2022 10 16 
- Refactoring of [[fb_unit]] More reliable handling of zero values.
- Test question for [[fb_unit]].

2022 10 02
- Add check for units mismatch to [[fb_unit]]. The default feedback of the answer test can be switched off.

2022 10 01 
- Introduction of boolean versions of the feedback functions for values (`fb_numberOK()`, `fb_varsOK()`, `fb_unitOK()`), see e.g. [[fb_vars]]
- Implementation of [[fb_dim]], dimensional check of expressions with physical quantities.
- Handle student's answer = 0 in [[fb_number]] and [[fb_unit]].

2022 09 22
- Consistent naming and signature of feedback functions for free body diagrams to `fb_xxx_name(obj, names, index)`

2022 08 15
- Adjustment of [["circle2p"]] to newer JSXGraph (modified signature of intersection object)

2022 08 09
- [["line2p"]] got an optional perpendicular line (thus enabling of setting the normal to a line)

2022 08 02
- [[fb_vars]] upgraded to STACK 4.4

2022 08 02
- Move source of feedback functions for free body diagrams from the wiki to the [source file](https://raw.githubusercontent.com/mkraska/meclib/main/Maxima/fb_fbd.mac)
- Successful test of include mechanism in question variables and question text (new in STACK 4.4)

2022 07 31
- Adjustment to JSXGraph 1.4.5 (there were problems with text input fields)

2022 07 22
- Add state option `"silent"` to [["force"]], suppresses the infobox at the point
- Make `phi` argument of [["q"]] optional (resolves #16)

2022 07 19
- Improvement of the precision feedback in [[fb_unit]] and [[fb_number]]. The percent deviation is given with just one significant figure. "Deviation is at least xxx%".

2022 05 13
- Add options for scale and decimal precision of the coordinate display of [["spline"]] objects
- Improve the feedback function `fb_spline()`, see [[Values and Slope of Splines]]

2022 05 11
- Make update of [["spline"]] more robust

2022 05 09
- Introduction of the constant `loadColor`
- Enforce consistent appearance of [["force"]], [["moment"]] and [["q"]] objects
- Change was required due to modified default colors in JSXGraph 1.4.3

2022 04 25
 - Reorganization of [[Dynamic display of coordinates]].
 - Default scale and decimal precision can be set by [["grid"]].
 - [["force"]] control points have decimal precision increased by one over the default value.
 - Scaling parameter of [["circle2p"]] and [["line2p"]] is obsolete 

2021 06 15
- Initial commit, project started