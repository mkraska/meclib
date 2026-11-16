`[ "springc", "name", [x1, y1], [x2,y2], r, n, off ] `

Symbol for compression spring with label.
- `"name"` label text, typeset in MathJax math mode (see [[Labels and names]])
- `r` (optional, default: equivalent to 6 pixel) radius of the turns
- `n` (optional, default: smart value for nice appearance) number of turns
- `off` (optional, default: equivalent to 14 pixel) lateral offset of the label anchor point


### Example

![image](https://user-images.githubusercontent.com/105876203/176249535-c710edfd-1237-47e2-a694-7ad3fdeda2b1.png)

```
[
  [ "grid", "x","y", -5,5,-4,5, 50, [10,10], [0,0] ],
  ["springc", "name", [1,1],[3,1] ],
  [ "point", "1", [1,1],8 ],
  [ "point", "2", [3,1],8 ]
]
```
