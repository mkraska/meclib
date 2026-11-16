`[ "dir", "name", [x,y], angle, offset, length, state]`


small arrow with label (indication of coordinate axes). 
- `"name"` label, typeset in MathJax math mode (see [[Labels and names]])
- `[x,y]` start point
- `angle` arrow direction, counter-clockwise from x-axis, in °. 
- `offset` (optional, defaults to 10 pixels) distance from arrow to text anchor point in pixels. If `offset` < 0, then the label is placed at the tail of the arrow, otherwise at the head.
- `length` (optional, defaults to equivalent of 24 pixels), in standard grid units 
- `state` (optional, default: `"locked"`) can be set to `"active"`, then the tip point becomes
  movable (the base point stays fixed) so the student can drag out a direction interactively.
  The live angle is written back into the object's own `angle` field, so it can be read via
  `direction()` on the Maxima side. Not meant to be toggled after creation.

You can give [[Feedback for "dir"]] to give feedback on what forces have components along the specified direction.

See [[Sums of Forces and Moments]] to extract the sum of forces along the direction indicated by `"dir"`.

![image](https://user-images.githubusercontent.com/12987918/183075589-04e2787b-2124-471c-9a0c-59e2b0de138d.png)

```
[
  [ "grid", "","", -5,5,-4,5, 50, [1,1], [0,0] ],
  [ "point", "P", [2,1] ],
  [ "angle1", "\\alpha", [2, 1], [3,1], 0.7, 45 ],
  [ "dir", "a", [2,1], 45, 10, 1],
  [ "dim", "\\ell", [2,1], [2.707,1.707], 0.5],
  [ "dir", "v", [-2,1], 45, -10, 1],
  [ "dir", "a_n", [-0.8,1], 45, 10, 1],
  [ "label", "offset &lt; 0", [-2,2.2]],
  [ "label", "offset &gt; 0", [-0.5,2.2]]
]
```

