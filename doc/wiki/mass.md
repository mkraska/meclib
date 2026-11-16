`[ "mass", "name", [x1, y1], r, off ] `



black filled circle with label
- `"name"` label, typeset in MathJax math mode (see [[Labels and names]])
- `[x1, y1]` center position 
- `r` (optional, default: 4 pixel) radius of the circle in pixel
- `off` (optional, default: 11 pixel) distance to text anchor of the label, in pixel

### Example

![image](https://user-images.githubusercontent.com/105876203/173603615-7c17e36a-c27f-482e-8981-9b5ef1c5682b.png)

```
[
  [ "grid", "x","y", -5,5,-4,5, 50, [10,10], [0,0] ],
  [ "mass", "name", [3, 2] ]
]
```