`[ "node", "name", [x,y], off, color ]` 



Node (small white circle, typically indicates hinge point) with label. 
- `"name"` label text, typeset in MathJax math mode (see [[Labels and names]]).
- `[x,y]` center point
- `off` (optional, default: 10 pixel) offset of label text anchor from center point
- `color` (optional, default: fillcolor white, labelcolor black) set the color for label and fill

### Example

![image](https://user-images.githubusercontent.com/12987918/235324352-dd311bb6-fb0e-4b0b-b37d-a0fc972cb4f5.png)

```
[
  [ "grid", "x","y", -5,5,-4,5, 50, [10,10], [0,0] ],
  [ "node", "name", [2,2] ],
  [ "node", "S_2", [3,2], 1, "red"]
]
```