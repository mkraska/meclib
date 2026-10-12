`[ "description", "label", [x1, y1], [x2, y2], gap, startgap ]`

Label with a leader line, e.g. a friction coefficient pointing at a rough surface.

- `"label"` text, typeset in MathJax math mode (e.g. `"\\mu_0=0.3"`; spaces become small math spaces, as in all meclib labels)
- `[x1, y1]` start point of the line, e.g. on the surface
- `[x2, y2]` center of the label
- `gap` (optional, default `4`) space in pixels between the end of the line and the label's bounding box
- `startgap` (optional, default `0`) space in pixels between `[x1, y1]` and the start of the line

The line runs from the start point towards the label center and stops `gap` pixels before the label, so it never touches the text. Its end point is computed from the label's size: first estimated from the TeX source, then measured once MathJax has typeset the label. If the label covers the whole distance, no line is drawn.

```
[
  ["grid", "", "", -1, 9, -1, 6, 50],
  ["wall", "", [0, 1], [8, 1], -45],
  ["description", "\\mu_0=0.3", [1, 1], [2, 2.5]],
  ["description", "\\mu", [3, 1], [3, 2.5]],
  ["description", "\\mu=\\frac{1}{2}", [7, 1], [6.5, 3.5]],
  ["description", "\\text{rough}", [2, 4], [4, 4.5], 4, 6],
  ["point", "P", [2, 4]]
]
```

The object is not interactive and has no state. The test scene `tests/scenes/obj_description.json` contains this example.
