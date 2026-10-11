`[ "fix12", "name", [x, y], angle, state ]`


fixed bearing with label, horizontal base line for angle = 0

- `"name"` label, typeset in MathJax math mode.
- `[x, y]` pivot point
- `angle `angle counter-clockwise from horizontal direction, in °
- `state` (optional, default: `"SHOW"`) `"show"` or `"hide"` (can be switched by double click), or `"SHOW"` or `"HIDE"` (locked in that state). The legacy value `"locked"` is still accepted and looks like `"SHOW"`, but feedback functions such as `fb_system()` only count `"SHOW"`/`"show"` as shown; use `"SHOW"` instead.

See [[Feedback for "fix12"]] for feedback functions in free body diagrams.

![image](https://user-images.githubusercontent.com/105876203/177613309-9177ac40-8835-4fcd-a011-2f325d53bf7d.png)

```
[
  [ "grid", "","", -5,5,-4,5, 50, [10,10], [0,0] ],
  [ "fix12", "A", [-2, 2], 0 ],
  [ "label", "pivot point", [-2.5,2.3] ],
  
  [ "fix12", "B", [0, 2], -45 ],
  [ "label", "pivot point", [-0.5,2.3] ],
  
  [ "fix12", "C", [2, 2], -90 ],
  [ "label", "pivot point", [2,2.3] ]
]
```

![image](https://user-images.githubusercontent.com/105876203/177613744-e642937c-9aa7-4487-a040-7a076b21d6ab.png)

```
[
  [ "grid", "","", -5,5,-4,5, 50, [10,10], [0,0] ],
  [ "fix12", "A", [-2, 2], 0, "hide" ],
  [ "label", "pivot point", [-2.5,2.3] ]
]
```