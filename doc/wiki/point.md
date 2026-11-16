`[ "point", "name", [x,y], off ] `



Small black dot with label, to indicate and label particular locations in the sketch
- `"name"` label text, typeset in MathJax math mode (see [[Labels and names]])
- `[x,y]` location
- `off` (optional, default: 10 pixel) offset of label text from center point (location)

### Example

![image](https://user-images.githubusercontent.com/105876203/173605507-1b9d3bfc-33e4-495e-b8b0-be960e717eb0.png)

```
[
  [ "grid", "x","y", -5,5,-4,5, 50, [10,10], [0,0] ],
  [ "point", "name", [2,2], 10 ]
]
```