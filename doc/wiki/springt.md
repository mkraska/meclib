`[ "springt", "name", [x1, y1], [x2,y2], r, lf, n, off ]` 

symbol for a tensile spring
- `"name"` label, typeset in MathJax math mode
- `[x1, y1], [x2,y2]` start and end point
- `r` (optional, default: 6 pixel) radius of the turns in pixel
- `lf` (optional, default 20) length of the terminal lines in % of the total length
- `n` (optional, default: smart value, making a nice appearance) number of turns
- `off` (optional, default: equivalent to 14 pixels), in standard grid units


### Example


![image](https://user-images.githubusercontent.com/105876203/176250314-6eb5cf44-61df-4d26-95b7-b9a359923c9a.png)

```
[
  [ "grid", "x","y", -5,5,-4,5, 50, [10,10], [0,0] ],
  ["springt", "name", [1,1],[3,1] ],
  [ "point", "1", [1,1],8 ],
  [ "point", "2", [3,1],7 ]
]
```