`[ "rot", "name", [x1, y1], [x2,y2], [x3,y3] ]` 


Red thin arc with arrow (to indicate rotational kinematic quantities) specified by center point, tail point (defines start angle and radius) and label point (defines end angle and radial label position. Orientation is such that the angle is less then 180° (shortest arc from start angle to end angle).

If the label placement is not good, suppress it using "" as name and use a [["label"]] object with "red" color.
- `"name"` label text, typeset in MathJax math mode (see [[Labels and names]])
- `[x1, y1], [x2,y2], [x3,y3]` center point, radius point, label point, respectively.

### Example

![image](https://user-images.githubusercontent.com/105876203/176247043-a8659de0-c052-42bd-9250-55dfb1f06a47.png)

```
[
  [ "grid", "x","y", -5,5,-4,5, 50, [10,10], [0,0] ],
  [ "rot", "name", [2, 2], [1,2], [3.2,2] ],
  [ "point", "1", [2,2] ],
  [ "point", "2", [1,2] ],
  [ "point", "3", [3.2,2] ]
]
```

