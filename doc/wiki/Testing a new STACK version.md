What to do when meclib is to be tested with a new STACK release (e.g. before the Moodle server is updated). The [[Meclib Workbench]] and the [[Offline Maxima Tests]] use local copies of STACK's files, kept per STACK version in the repository.

## What is kept per STACK version

| What | Where | Used by |
|---|---|---|
| STACK's Maxima library (`stack/maxima/` of the release) | `config/stack/<version>/maxima/` | offline Maxima tests, workbench evaluation, syntax help (signatures) |
| STACK's security map (`stack/cas/security-map.json`) | `config/stack/<version>/security-map.json` | workbench: forbidden functions are reported as in STACK |
| JSXGraph bundled with STACK | entry in `tools/workbench/workbench_config.json` (`"jsxgraph"`), loaded from the release tag on GitHub | workbench graphics |
| STACK documentation (`doc/en` of the release tag) | `tools/workbench/.cache/stack-docs/<tag>/` (downloaded, not committed) | syntax help (texts) |

`<version>` is the numeric plugin version from the release's `version.php` (e.g. `2026080600` for STACK 4.13.1), not the release number. When several versions are present, the workbench and the Maxima tests use the **newest** one. The syntax help (`syntax_help.json`) exists once; it records the STACK version it was built from.

## Steps

1. **Find the release.** On <https://github.com/maths/moodle-qtype_stack/tags> pick the tag (e.g. `v4.14.0`) and read `$plugin->version` in its `version.php`. Check the supported Maxima versions on <https://docs.stack-assessment.org/en/Installation/STACK_versions/> against your local Maxima.

2. **Copy the Maxima library and the security map** (in the repository folder, with the tag and version filled in):

   ```
   git clone --depth 1 --branch v4.14.0 --filter=blob:none --sparse https://github.com/maths/moodle-qtype_stack.git stack-tmp
   git -C stack-tmp sparse-checkout set stack/maxima stack/cas
   mkdir config/stack/2026xxxxxx
   cp -r stack-tmp/stack/maxima config/stack/2026xxxxxx/maxima
   cp stack-tmp/stack/cas/security-map.json config/stack/2026xxxxxx/
   ```

   Delete `stack-tmp` afterwards. On Windows, copy the two items with the Explorer instead of `cp`.

3. **Run the offline Maxima tests** (`Maxima/tests/run_tests.bat`). The first line of the log names the library in use; it must be the new folder. Differences in the feedback texts usually come from changed STACK functions (`castext_concat()`, `ct2_latex()`, answer tests).

4. **JSXGraph.** Look up the JSXGraph version the release bundles: the first lines of `corsscripts/jsxgraphcore.min.js` name it (`JSXGraph 1.12.2`; `thirdpartylibs.xml` is not reliable, it still says 1.5.0 in STACK 4.13.1). If it changed, add an entry to `"jsxgraph"` in `tools/workbench/workbench_config.json` (copy the existing one, replace the tag and the version in the name) and select it on the workbench pages.

5. **MathJax.** STACK loads the MathJax URL of Moodle's MathJax filter (Moodle 5: 3.2.2). The workbench offers 2.7.9 and 3.2.2 in the MathJax selector; add a version to `"mathjax"` in the configuration if needed.

6. **Graphic block.** Compare `stack/cas/castext2/blocks/jsxgraph.block.php` between the old and the new tag (GitHub: *Compare* `v4.13.1...v4.14.0`). If the frame STACK builds for `[[jsxgraph]]` changed (scripts, input binding, sandbox), `tools/workbench/frame.js` has to follow.

7. **Test scenes.** Open the Tests page of the workbench, choose the new JSXGraph entry, run all scenes. Differences show changed behaviour of JSXGraph or meclib.

8. **Questions.** Open a few typical questions on the Questions page, check them with the model answers and look at the review messages (e.g. functions newly forbidden by the security map).

9. **STACK API** (if set up for STACK ▶): build it for the new version, with the Maxima version the server will run:

   ```
   cd tools/workbench
   python stackapi.py build --stack 2026xxxxxx --maxima 5.45.1
   ```

   and run the question tests of a few questions with STACK ▶.

10. **Syntax help.** Add the version and tag to `STACK_TAGS` at the top of `tools/workbench/build_help.py` (or give `--stack-tag`) and run

   ```
   python build_help.py --wiki <path of the meclib wiki clone>
   ```

11. **Record it.** Mention the version in `config/README.md`, `Maxima/tests/README.md` (the "currently ..." line) and the [[History]]. Keep the old version folder as long as the Moodle server still runs it; to test the old one again, move the newer folder out temporarily (the tools always take the newest).
