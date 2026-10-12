`[ "angle1", "name", [xc, yc], [xs,ys], radius, angle ] `

angular dimension consisting of two radial lines, arc with a single arrow and label. 

- `"name"` label text, typeset in MathJax math mode
- `[xc, yc]` center point
- `[xs,ys]` end point of radial baseline 
- `radius` radius of the arc
- `angle` angle in °, counterclockwise from base line.

See also [["angle"]] and [["angle2"]] for versions with no or two arrows.

### Example

![image](https://user-images.githubusercontent.com/12987918/176371956-c7b4a6bb-52d9-4fc9-b1b0-a6c77682fafd.png)

```
[  
  [ "grid", "x","y", -5,5,-4,5, 50, [10,10], [0,0] ],
  ["angle1", "\\alpha", [2,-2],[3,-2],0.6,45],
  ["point", "C", [2,-2]],
  ["point", "S", [3,-2]], 
  ["dim", "r", [2,-2],[2.6,-2],-0.6 ]
]
```

