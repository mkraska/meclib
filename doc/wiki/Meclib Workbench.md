The **meclib workbench** is a local web application for developing STACK questions with meclib and for testing meclib itself — without Moodle. It runs on your own computer, renders meclib graphics exactly as STACK 4.13 does and evaluates question variables, texts and potential response trees with Maxima and STACK's own Maxima library.

> The workbench is part of the `dev2026` branch of the repository. Links below point to that branch.

## What it is for

- **Developing questions locally.** Open Moodle XML files from your own folders, edit question variables, texts, inputs and options, see the preview with working graphics, and check answers against the PRTs. Changes are saved back into the XML file automatically, so the file is always ready for import into Moodle.
- **Trying out graphics.** A replacement for jsfiddle: paste `initdata`, render, interact, and watch what meclib writes into the `objects` and `names` inputs.
- **Regression testing meclib.** Test scenes with stored expected results, checked before changes are merged from `dev2026` into `main`.

Questions (your folders, saved continuously) and tests (in the repository, changed only on purpose) are kept strictly apart.

## Getting started

1. Clone or download the meclib repository (branch `dev2026`).
2. Install the requirements:
   - Python 3 (standard library only)
   - Maxima (for the Questions page; found on the PATH or in the usual Windows install locations)
   - an internet connection (JSXGraph, MathJax and meclib files from GitHub)
3. Start the workbench:
   - Windows: double-click `tools/workbench/start_workbench.bat`
   - any platform: `python server.py` in `tools/workbench/`
4. The browser opens <http://localhost:8765/>. The console window is the server; closing it stops the workbench. Starting it again replaces a running instance.

## The three pages

### Graphic

Paste an object list (`initdata`), choose the meclib.js version (local working copy, GitHub `dev` or `main`) and render. Below the graphic you see `names` and `objects` live, the console output of the graphic, and buttons to save the situation as a new question or as a test case.

### Questions

- **Files:** add your question folders (folder dialog or pasted path), drop Moodle XML files onto the page, create new files and questions from the meclib template, duplicate questions, save single questions as new files, split multi-question files.
- **Editor:** question variables and texts with syntax highlighting (Maxima, castext, JSXGraph), inputs table, question options, potential response trees (with a graph of each tree and undo/redo of all changes), text snippets (e.g. the `[[jsxgraph]]` block, operating hints for free-body diagrams), and a dialog that creates an input together with a matching PRT (number with unit, number, expression) using the meclib feedback functions.
- **Preview:** the question as students see it, with working graphics, German/English, decimal point or comma, and simplification on/off. **Model answers** fills in the model answers, **Check** evaluates the PRTs with the current answers and shows feedback, score, penalty and answer notes.
- **Review:** checks the question against the conventions for meclib questions (style guide, wiki pages of the feedback functions) and offers fixes with a preview, to be accepted or rejected per item — useful when updating older questions. Rejected proposals are recorded in the internal question description.
- **Saving:** every change is written into the XML file after a short pause (with a `.bak` copy of the file as it was when opened). Import the file into Moodle with *Import → Moodle XML* or *Import as new version*.

### Tests

The regression scenes of meclib (`tests/scenes/`): run all cases, compare the actual `objects`/`names` with the expected ones, review differences and accept new results deliberately. The same scenes feed the [[Offline Maxima Tests]] of the feedback functions.

## Documentation

| Topic | README |
|---|---|
| Workbench: all pages, configuration, limitations | [tools/workbench/README.md](https://github.com/mkraska/meclib/blob/dev2026/tools/workbench/README.md) |
| Text snippets of the Questions page | [tools/workbench/templates/snippets/README.md](https://github.com/mkraska/meclib/blob/dev2026/tools/workbench/templates/snippets/README.md) |
| Test scenes: file format, workflow | [tests/scenes/README.md](https://github.com/mkraska/meclib/blob/dev2026/tests/scenes/README.md) |
| Offline Maxima tests of the feedback functions | [Maxima/tests/README.md](https://github.com/mkraska/meclib/blob/dev2026/Maxima/tests/README.md) |
| Configuration (STACK version, Maxima library, security map) | [config/README.md](https://github.com/mkraska/meclib/blob/dev2026/config/README.md) |

## Limitations

The workbench approximates STACK closely, but not completely: STACK's input validation is not reproduced, answer test messages appear as message keys, and `[[jsxgraph]]` blocks inside PRT feedback are not rendered. Check the final question in Moodle before using it with students.
