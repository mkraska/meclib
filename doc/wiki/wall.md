`[ "wall", "name", [x1, y1], [x2,y2] , angle, state]` 


Normal line with thin hatching at left side, specified by start and end point. 
- `"name"` not used
- `[x1, y1], [x2,y2]` start and end point
- `angle` angle in ° of the hatch lines from the base line (usually +45/-45). The range is limited to -90...90°.
- `state` (optional, default: `"SHOW"`) `"show"` or `"hide"` (can be switched by double click), or `"SHOW"` or `"HIDE"` (locked in that state). The legacy value `"locked"` is still accepted and looks like `"SHOW"`, but feedback functions such as `fb_system()` only count `"SHOW"`/`"show"` as shown; use `"SHOW"` instead.


### Example

![image](https://user-images.githubusercontent.com/12987918/176925613-379b000e-8ad5-456a-828d-3d966fc48e07.png)

```
[
  [ "grid", "x","y", -5,5,-4,5, 50, [10,10], [0,0] ],
  [ "wall", "name", [1, 2], [2,2] , 45],
  [ "angle1", "\\alpha", [2,2], [3,2], 0.6, 45],
  [ "label", "1", [1,1.8] ],
  [ "label", "2", [2,1.8] ]
]
```

If you want to use contact with a wall in a free body diagram, then use the [["contact"]] object.