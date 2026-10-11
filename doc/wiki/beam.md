`[ "beam", "", [x1, y1], [x2,y2], r, state ]` 

`[ "beam", "<color1>","<color2>", [x1, y1], [x2,y2], r , state ]`

Rectangle with black border and light gray filling. The rectangle essentially is a thick line connecting two points. r is the radius (half width). More than two points (must be an even number of points) can be handled, in this case multiple rectangles are generated and merged into a single contour if they overlap. For non-merged overlapping beams use separate beam objects. 
- `""` or `"<color1>","<color2>"` colors for the gradient filling. If empty, the default light gray filling is used. The gradient is tried to be in lateral direction if possible (only horizontal or vertical gradients are possible)
- `[x1, y1], [x2, y2]` start and end point. Multiple pairs of start and end points can be specified.
- `r` radius (half width) of the beam
- `state` (optional, default: `"SHOW"`) `"show"` or `"hide"` (can be switched by double click), or `"SHOW"` or `"HIDE"` (locked in that state). The legacy value `"locked"` is still accepted and looks like `"SHOW"`, but feedback functions such as `fb_system()` only count `"SHOW"`/`"show"` as shown; use `"SHOW"` instead.

### Examples

Beam with gradient fill

![image](https://user-images.githubusercontent.com/12987918/189065019-ae25e362-dac3-4df4-b8b6-e0a142098c47.png)

```
[
  [ "grid", "","", -1,6,-2,2, 50 ],
  [ "beam", "white", "gray", [0,0], [0.5, 0], 0.2 ],
  [ "beam", "white", "gray", [0.5,0], [1.5, 0], 0.4 ],
  [ "beam", "white", "gray", [1.5,0], [2, 0], 1 ],
  [ "beam", "white", "gray", [2,0], [4.5, 0], 0.4 ],
  [ "beam", "white", "gray", [4.5,0], [5, 0], 0.2]
]
```

Compound beam, overlapping beam, hidden beam

![image](https://user-images.githubusercontent.com/105876203/176695416-d480da8d-370d-4ee4-9648-fa73d3d62eda.png)

```
[
   [ "grid", "","", -5,5,-4,5, 50, [10,10], [0,0] ],
   ["beam","",[0,3],[2,4],[0,4],[2,3], 0.15],
   ["beam","",[2,4],[3,4.5], 0.08],
   ["beam","",[1,4],[1,2], 0.1, "hide"]
]
```
