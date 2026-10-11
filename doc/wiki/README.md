# Wiki page updates (temporary)

Updated versions of meclib wiki pages, kept here until they are copied into the wiki
(https://github.com/mkraska/meclib/wiki). The file name is the page name without the quotes
(file names with quotes do not work on Windows): `fix1.md` -> wiki page `"fix1"`;
`fb_name().md` -> wiki page `fb_name()`.
Delete a file here once its content is in the wiki.

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
| Meclib Workbench.md | `Meclib Workbench` | PRT editor with graphs and undo/redo (PRTs were read only) |
| (none) | `"fix"` | delete the page: it is an orphaned overview from 2022 (no object "fix" exists, nothing links to it); the overview is the page "List of Objects" |
