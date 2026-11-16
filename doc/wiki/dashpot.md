`[ "dashpot", "name", [x1,y1], [x2,y2], r, offset ]` 


dashpot (for oscillators)
- `"name"` label, typeset in MathJax math mode (see [[Labels and names]])
- `[x1,y1], [x2,y2]` start and end point
- `r` (optional, default: equivalent to 6 pixels) radius of the symbol in grid units
- `offset` (optional, default: equivalent to r plus 8 pixels) lateral offset of the label


![image](https://user-images.githubusercontent.com/105876203/176697424-410351d2-522f-418f-acd0-f47c1fda0bf9.png)

```
[
  [ "grid", "x","y", -5,5,-4,5, 50, [1,1], [0,0] ],
  [ "dashpot", "d", [1,1], [3,1]],
  [ "point", "1", [1,1] ],
  [ "point", "2", [3,1] ]
]
```