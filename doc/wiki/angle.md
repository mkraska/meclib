
`[ "angle", "name", [xc, yc], [xs,ys], radius, angle ] `

angular dimension consisting of two radial lines, arc and label

- `"name"` label text, typeset in MathJax math mode (see [[Labels and names]])
- `[xc, yc]` center point
- `[xs,ys]` end point of radial base line 
- `radius` radius of the arc
- `angle` angle in °, counterclockwise from base line.

### Angular Dimensions

See also [["angle1"]] and [["angle2"]].

![image](https://user-images.githubusercontent.com/12987918/184476523-5faacce8-426d-4106-b78c-27237d8cb49d.png)
```
[  
  [ "grid", "x","y", -1,9,-1,9, 40],
  ["angle", "\\alpha", [2,1],[3,1],0.8,60],
  ["angle", ".", [1,1],[2,1],0.6,90],
  ["label", "angle", [1.5,0.5]],
  ["angle1", "\\beta", [3,1],[4,1],0.8,60],
  ["label", "angle1", [3,0.5]],
  ["angle2", "\\gamma", [4,1],[5,1],0.8,60],
  ["label", "angle2", [4,0.5]]
]
```

### Right Angle

`[ "angle", ".", [xc, yc], [xs,ys], radius, (-)90 ] `

symbol for right angle (dot inside arc)


![image](https://user-images.githubusercontent.com/105876203/174659026-3c2fa9a5-f734-47e9-9e55-83923fa9dca4.png)

```     
[  
  [ "grid", "x","y", -5,5,-4,5, 50, [10,10], [0,0] ],
  ["angle", ".", [2,-2],[3,-2],0.4,90],
  ["point", "C", [2,-2]],
  ["point", "S", [3,-2]]
]
``` 


### Two Arrows Angle

`[ "angle2", "name", [xc, yc], [xs,ys], radius, angle ]` 

version with two arrows

![image](https://user-images.githubusercontent.com/105876203/174659932-45555f93-0f85-40d9-9615-6a05a094e9a3.png)

```
[  
  [ "grid", "x","y", -5,5,-4,5, 50, [10,10], [0,0] ],
  ["angle2", ".", [2,-2],[3,-2],0.4,60],
  ["point", "C", [2,-2]],
  ["point", "S", [3,-2]],
  ["point", "R", [2.4,-2]]
]
```
