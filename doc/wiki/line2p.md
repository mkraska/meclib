`[ "line2p", "label", [x1,y1], [x2,y2], "nlabel" ]`

line with two draggable points, meant for [[Mohr's circle]] construction or as helper for finding the center of rotation. 

The object returns a list of scaled co-ordinates `[ [x1,y1], [x2,y2] ]` to the `names` input field.

- `label` label for the line
- `[x1,y1]`, `[x2,y2]` initial locations of the control points (in scaled units)
- `nlabel` (optional, default: none) label for an optional perpendicular line through the first point. This argument earlier was a scaling factor, which is obsolete. The infobox uses the settings of the [["grid"]] object.

Objects:
- `p1, p2` (point) control points of the line
- `g` (line) line
- `n` (line) optional normal line


See also [["circle2p"]] for draggable circle and [["grid"]] and [[Dynamic display of coordinates]] for grid scaling.

[[Dynamic intersection of two "line2p" obbjects]]

### Demo Questions

[[Demo Moodle Course]]

- TM2 03 T02 Interactive construction of Mohr's circle
- TM2 10 01 Interactive input of the zero stress line in a non-symmetric bending problem
- TM3 06 T06 Interactive construction of the center of rotation in a mechanism

### Example


![image](https://user-images.githubusercontent.com/12987918/182340289-985f6b24-4aa2-4ef6-ac85-77a281d20762.png)


```
[
  [ "grid", "x","y", -2,3,-1,2, 50, [10,10], [0,0] ],
  ["line2p", "label", [10,5], [20,10] ]
]
```

![image](https://user-images.githubusercontent.com/12987918/189066321-8ed36442-576f-41f1-93bc-4a780c6e643f.png)

```
[
  [ "grid", "x","y", -2,3,-1,2, 50, [10,10], [0,0] ],
  ["line2p", "g", [10,5], [20,10], "n" ]
]
```