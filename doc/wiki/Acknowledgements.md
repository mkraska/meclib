The [[Meclib Workbench]] and meclib build on the work of others: software that the workbench uses or bundles, and projects whose ideas we took over. This page lists them; new entries are added when a component or an idea comes in.

## Software the workbench uses

- **STACK** ([moodle-qtype_stack](https://github.com/maths/moodle-qtype_stack)), the question type itself: the workbench evaluates questions with STACK's own Maxima library (copied to `config/stack/<version>/maxima/`), runs question tests in STACK through the **STACK API** (built from STACK's `api/docker`), and follows the authoring guidelines in [`agents/`](https://github.com/maths/moodle-qtype_stack/tree/dev/agents) (deployed variants, question tests for every PRT branch, full answer note routes).
- **[goemaxima](https://github.com/mathinstitut/goemaxima)**, the Maxima server of STACK installations, used for the STACK API containers.
- **[Maxima](https://maxima.sourceforge.io/)**, the computer algebra system, and **[gnuplot](http://www.gnuplot.info/)** for `plot()` in castext.
- **[JSXGraph](https://jsxgraph.org/)** (University of Bayreuth), the graphics library meclib is built on, in the versions STACK bundles.
- **[MathJax](https://www.mathjax.org/)** (2.7 and 3.2, as in Moodle) for formulas in the preview.
- **[marked](https://marked.js.org/)** for Markdown texts in the preview. Its behaviour is adjusted to Moodle's **[PHP Markdown Extra](https://michelf.ca/projects/php-markdown/extra/)** (Michel Fortin), which served as the reference for underscores next to backslash escapes.
- **[CodeMirror 5](https://codemirror.net/5/)** for the editors.
- **[jsDelivr](https://www.jsdelivr.com/)** and **[npm](https://www.npmjs.com/)**, from which the browser libraries are fetched (and cached in `vendor/` for working offline).
- **[Playwright](https://playwright.dev/)** (optional) for headless runs of the tests page.

## Ideas taken over

- **STACK's guidelines for AI agents** ([`agents/stack_essentials.md`](https://github.com/maths/moodle-qtype_stack/blob/dev/agents/stack_essentials.md) and companions): the Tests column (variants survey and deployment, coverage of the PRT branches, approval of tests), the review rules `variants.*` and `tests.none`.
- **moodle-stack-wysiwyg-editor** by Thomas Bock ([github.com/KerasBoth/moodle-stack-wysiwyg-edtior](https://github.com/KerasBoth/moodle-stack-wysiwyg-edtior), found via the STACK Zulip, 2026-11): renaming a variable, input or PRT everywhere in the question (Rename in the editor), the matrix of inputs and PRTs (Tests column), the review rules `inputs.no-prt` and `prt.no-input`.
- **Cairn for Stack** by Benoit Joly ([github.com/BenoitJOLY/cairn-for-stack](https://github.com/BenoitJOLY/cairn-for-stack), 2026-11): the review rules `text.html-comment` (castext inside HTML comments), `prt.unreachable`, `graphic.input-in-jsxgraph`, `graphic.castext-in-jsxgraph`, `prt.castext-in-maxima` and `qv.unused` (unused question variables), from its rule collection for STACK questions.
