`[ "angle2", "name", [xc, yc], [xs,ys], radius, angle ] `

angular dimension consisting of two radial lines, arc with two arrows and label. 

- `"name"` label text, typeset in MathJax math mode (see [[Labels and names]])
- `[xc, yc]` center point
- `[xs,ys]` end point of radial baseline 
- `radius` radius of the arc
- `angle` angle in °, counterclockwise from base line.

See also [["angle"]] and [["angle1"]] for versions with no or just one arrow.

### Example

![image](https://user-images.githubusercontent.com/12987918/184476841-163c2ba3-1960-4e14-b0f0-78f20ecbe3ff.png)

```
[  
  [ "grid", "x","y", -5,5,-4,5, 50, [10,10], [0,0] ],
  ["angle2", "\\alpha", [2,-2],[3,-2],0.6,45],
  ["point", "C", [2,-2], 15],
  ["point", "S", [3,-2]], 
  ["dim", "r", [2,-2],[2.6,-2],-0.6 ]
]
```



