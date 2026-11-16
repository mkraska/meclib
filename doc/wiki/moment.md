`[ "moment", "name", [x1, y1], [x2,y2], [x3,y3], state ]`



Moment arrow specified by center point, tail point (defines start angle and radius) and label point (defines end angle and radial label position. Orientation is such that the angle is less then 180° (shortest arc from start angle to end angle). 

In the active version, these control points can be dragged interactively. Dragging the centerpoint translates the symbol, dragging the other points changes the shape. Doubleclick on the arrow deletes an active moment symbol.
- `"name"` label, typeset in MathJax math mode (see [[Labels and names]]). For input to STACK, spaces are converted to stars.
- `[x1, y1], [x2,y2], [x3,y3]` center point, tail point, label point
- `state` (optional, default: `"locked"`), can be set to `"active"`, then the object can be moved around interactively.

### Example

![image](https://user-images.githubusercontent.com/105876203/173604071-933badb0-39fb-4a1c-bc30-7b995a508cdc.png)

```
[
  [ "grid", "x","y", -5,5,-4,5, 50, [10,10], [0,0] ],
  [ "moment", "name", [2, 2], [1,2], [3.2,2] ]
]
```