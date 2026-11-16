`[ "q", "q1","q2", [x1, y1], [x2,y2], q1, q2, phi, state ]` 


Line load.
- `"q1","q2"` labels, in latex math mode (see [[Labels and names]]).
- `[x1, y1]` start point
- `[x2, y2]` end point
- `q1, q2` height values
- `phi` (optional, default: `0`) angle of force direction from vertical to baseline, in °
- `state` (optional, default: `"locked"`) `"locked"`, `"hide"` or `"show"`. If missing, object can't be switched interactively.

### Example

![image](https://user-images.githubusercontent.com/12987918/167251790-e9169553-6de5-4fbf-a978-247f2d946d26.png)

![image](https://user-images.githubusercontent.com/12987918/180441793-d57a95c2-84e7-4442-910d-c20bf7043499.png)

```
[
  [ "grid", "x","y", 0,10,-4,5, 50 ],
  [ "q", "q0","", [8,2], [9,1], 1, 1, 45 ],
  [ "q", "q1","q2", [1, 1], [4,1], 1, 2 ],
  [ "q", "q0","", [5, 1], [8,1], 1, 0, 0, "hide" ],
  [ "force", "R", [6,2],[6,1.2], 10, "active"]
]
```

How to generate [[Feedback for line loads]]