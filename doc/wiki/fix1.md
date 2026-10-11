`[ "fix1", "name", [x, y], angle, state ]`


floating bearing with label, horizontal base line for angle = 0

- `"name"` label, typeset in MathJax math mode.
- `[x, y]` pivot point
- `angle `angle counter-clockwise from horizontal direction, in °
- `state` (optional, default: `"SHOW"`) `"show"` or `"hide"` (can be switched by double click), or `"SHOW"` or `"HIDE"` (locked in that state). The legacy value `"locked"` is still accepted and looks like `"SHOW"`, but feedback functions such as `fb_system()` only count `"SHOW"`/`"show"` as shown; use `"SHOW"` instead.

See [[Feedback for "fix1"]] for feedback functions in free body diagrams.

![image](https://user-images.githubusercontent.com/105876203/177612850-fa677a9d-ff77-46fa-b379-4f13131b57a5.png)

```
[
  [ "grid", "","", -5,5,-4,5, 50, [10,10], [0,0] ],
  [ "fix1", "A", [-2, 2], 0 ],
  [ "label", "pivot point", [-2.5,2.3] ],
  
  [ "fix1", "B", [0, 2], -45 ],
  [ "label", "pivot point", [-0.5,2.3] ],
  
  [ "fix1", "C", [2, 2], -90 ],
  [ "label", "pivot point", [2,2.3] ]
]
```