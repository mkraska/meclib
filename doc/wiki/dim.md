`[ "dim", "name", [x1, y1], [x2,y2], off ]` 


Linear dimension with label
- `"name"` label text, typeset in MathJax math mode (see [[Labels and names]])
- `[x1, y1], [x2,y2]` reference points
- `off` offset of the actual annotation from the baseline defined by the reference points. Offset counts positive to the left side seen from point 1 to point 2. If zero, short end lines are drawn.

![image](https://user-images.githubusercontent.com/105876203/175359538-fb365433-2a71-4417-86b9-f1534fe349c7.png)

```
[
  [ "grid", "x","y", -5,5,-4,5, 50, [1,1], [0,0] ],
  [ "dim", "name", [1, 2], [3,2], -1 ],
  [ "point", "1", [1,2] ],
  [ "point", "2", [3,2] ]
]
```

![image](https://user-images.githubusercontent.com/12987918/176380383-0f2a298e-5f0a-4f4a-8a63-57ade49d5c3f.png)
```
[
  [ "grid", "x","y", -1,9,-4,5, 50, [1,1], [0,0] ],
  [ "dim", "2*a", [1, 2], [3,2], -0.5 ],
  [ "dim", "2*b", [1, 2], [3,2], 0.5 ],
  [ "point", "1", [1,2] ],
  [ "point", "2", [3,2] ],
  [ "dim", "c", [5, 2], [4,2], -0.5 ],
  [ "dim", "d", [5, 2], [4,2], 0.5 ],
  [ "point", "1", [5,2] ],
  [ "point", "2", [4,2] ],
  [ "dim", "\\ell", [6, 2], [7,2], 0 ],
  [ "dim", "\\ell", [6, 1.5], [7,1.5], 0 ],
  [ "point", "1", [6,2] ],
  [ "point", "2", [7,2] ]
]
```