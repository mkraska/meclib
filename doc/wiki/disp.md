`[ "disp", "name", [x,y], angle, offset, length]` 


small red arrow with label (indication of displacement). Same as [[dir]], except for the color.
- `"name"` label, typeset in MathJax math mode (see [[Labels and names]])
- `[x,y]` start point
- `angle` arrow direction, counter-clockwise from x-axis, in °. 
- `offset` (optional, defaults to 10 pixels) distance from arrow to text anchor point in pixels. If `offset` < 0, then the label is placed at the tail of the arrow, otherwise at the head.
- `length` (optional, defaults to equivalent of 24 pixels), in standard grid units 


<img width="370" alt="Bildschirmfoto 2022-07-05 um 19 26 08" src="https://user-images.githubusercontent.com/105876203/177383232-ad7157f2-137c-44e5-8984-9d2dc7b31e60.png">

```
[
  [ "grid", "","", -5,5,-4,5, 50, [1,1], [0,0] ],
  [ "point", "start point", [2,1] ],
  [ "angle1", "\\alpha", [2, 1], [3,1], 0.7, 45 ],
  [ "angle1", "\\alpha", [-2, 1], [-1,1], 0.7, 45 ],
  [ "disp", "name", [2,1], 45, 10, 2],
  [ "disp", "name", [-2,1], 45, -10, 2]
]
```

