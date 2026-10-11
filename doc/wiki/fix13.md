`[ "fix13", "name", [x, y], angle, state ]`



axial and angular support, floats in vertical direction for angle = 0°

- `"name"` label, typeset in MathJax math mode.
- `[x, y]` pivot point
- `angle` angle counter-clockwise from horizontal direction, in °
- `state` (optional, default: `"SHOW"`) `"show"` or `"hide"` (can be switched by double click), or `"SHOW"` or `"HIDE"` (locked in that state). The legacy value `"locked"` is still accepted and looks like `"SHOW"`, but feedback functions such as `fb_system()` only count `"SHOW"`/`"show"` as shown; use `"SHOW"` instead.

![image](https://user-images.githubusercontent.com/105876203/177620270-8354677f-0fdd-40e2-a42d-9e1fb5ca65a7.png)

```
[
  [ "grid", "","", -5,5,-4,5, 50, [10,10], [0,0] ],
  [ "fix13", " ", [-2, 2], 0 ],
  [ "label", "A", [-2.4, 2] ],
  
  [ "fix13", " ", [0, 2], 45 ],
  [ "label", "B", [-0.3, 1.8] ],
  
  [ "fix13", " ", [2, 2], 90 ],
  [ "label", "C", [1.9, 1.7] ]
]
```