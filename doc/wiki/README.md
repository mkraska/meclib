# Wiki pages (drafts, published automatically)

Versions of meclib wiki pages (https://github.com/mkraska/meclib/wiki). The file name is the
page name without the quotes (file names with quotes do not work on Windows): `fix1.md` ->
wiki page `"fix1"`; `fb_name().md` -> wiki page `fb_name()`. `sync.json` maps each file to its
page.

A push to `dev2026` that changes this folder starts the GitHub Action "Wiki sync"
(`.github/workflows/wiki-sync.yml`, `tools/wiki_sync.py`): it writes every draft that differs
from its page into the wiki. A page that was edited on GitHub after its draft was made is not
overwritten: the run fails and names it, the edit is merged into the draft, and the draft's
`base` in `sync.json` is set to the edited page (`python tools/wiki_sync.py --hash <page file>`).
A new draft needs an entry in `sync.json` (`"base": null` for a new page). The files stay here.

Changes of the drafts (the table below lists them as they came):

| File | Wiki page | Change |
|---|---|---|
| fix1.md, fix12.md, fix123.md, fix13.md, wall.md, beam.md, circle.md | `"fix1"`, `"fix12"`, ... | default state is `"SHOW"` (was documented as `"locked"`); states show/hide/SHOW/HIDE; `"locked"` is legacy |
| line2p.md | `"line2p"` | object name in the signature: `"line2p"` (was `"line2P"`, which meclib does not recognise) |
| fb_name().md | `fb_name()` (replaces the outdated pages `fb_name()` and `fb_name`; delete `fb_name` or make it a link) | describes the current code: optional 4th argument `show`, first of several loads is checked, silent if no reaction |
| fb_reaction_name().md | `fb_reaction_name()` (new page) | new |
| fb_unit_matrix().md | `fb_unit_matrix()` (new page) | new |
| fb_vars_matrix().md | `fb_vars_matrix()` (new page) | new |
| Matrix input.md | `Matrix input` | `array{cc}` for two columns (was `{c}`); links to the new functions |
| Matrix Feedback.md | `Matrix Feedback` | rewritten for `fb_unit_matrix()` / `fb_vars_matrix()`; the `toList`/NumRelative construction kept as a note on older questions |
| Dynamic intersection of two line2p obbjects.md | `Dynamic intersection of two "line2p" obbjects` | explanation of the `targets` list corrected; note on the line2p fix of meclib 2026 10 11 |
| Feedback for contact.md | `Feedback for "contact"` | rough contact: optional arguments friction (static, kinetic with velocity or `disp` name) and accepted names |
| contact.md | `"contact"` | default `lineLength` 3 (was 1); smooth or rough is decided in the feedback; tip on dummy contacts |
| description.md | `"description"` (new page; add it to "List of Objects") | new object: label with leader line |
| Meclib Workbench.md | `Meclib Workbench` | syntax help, kept answers / Restart, MathJax choice, STACK versions, new section Planned |
| Testing a new STACK version.md | `Testing a new STACK version` (new page) | steps for testing meclib with a new STACK release |
| fb_unique_names().md | `fb_unique_names()` (new page) | new: reactions at several supports must have different names |
| fb_contact_reactions().md | `fb_contact_reactions()` (new page) | new: names of the normal and the friction force at a contact, for reference solutions with the student's names |
| fb_fbd().md | `fb_fbd()` (new page; link it from "Feedback for Free Body Diagrams") | new: generic checks of a free-body diagram (system boundaries, names, number of loads) |
| Sums of Forces and Moments.md | `Sums of Forces and Moments` | new `sumF()`, `sumM()` with options `contacts` (exact directions of contacts) and `at` (symbolic points of application); `sum_xyM()` legacy |
| fb_EE().md | `fb_EE()` (new page; link it from "Feedback for Free Body Diagrams") | new: feedback on one equation of equilibrium |
| fb_objects().md | `fb_objects()` (new page; link it from "Feedback for Free Body Diagrams" and the question templates) | new: fast replacement of `stackjson_parse(objects)` |
| angle1.md | `"angle1"` | signature named the object `"angle"` (copy of that page) |
| springt.md | `"springt"` | signature `r, lf, n, off` (was `r, lf, (n (, off))`, which the syntax help cannot read) |
| Feedback for Free Body Diagrams.md | `Feedback for Free Body Diagrams` | link to `fb_fbd()` at the top of the list; section Duplicate Names: the unfinished `fb_duplicates()` draft replaced by a link to `fb_unique_names()` |
| History.md | `History` | entries 2026 10 08 to 10 11; sections rearranged after the merges |
| (none) | `"fix"` | delete the page: it is an orphaned overview from 2022 (no object "fix" exists, nothing links to it); the overview is the page "List of Objects" |
