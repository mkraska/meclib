`[ "force", "name", [x1, y1], [x2,y2], offset , state]` 





force vector (blue arrow with blue label). In the active version, the vector has two control point for interactive modification. Dragging the arrow translates the object, dragging the tail or head point changes direction and length. 

Doubleclick on the arrow deletes an active force vector. 
- `"name"` label, typeset in MathJax math mode (see [[Labels and names]]). For input to STACK, spaces are converted to stars.
- `[x1, y1], [x2,y2]` start and end point 
- `offset` (optional, default: 10 pixel) distance from start/end point to label text anchor in pixel. if `offset` is negative, the label is drawn at the tail, if positiv or not given the label is at the head of the arrow.
- `state` (optional, default: `"locked"`) can be set to 
   - `"active"`, then the force can be moved around interactively, or
   - `"silent"`, then the infobox with the coordinates is suppressed.
   - `"dotted"`, then the arrow is drawn with a dashed line (for alternative representations of existing loads like resultant forces or components)

Active force objects snap to the grid (10 steps per grid unit) or to target objects (in order to make alignment easy). Yet, occasionally there are glitches in that a force object visually snaps to the object but returns co-ordinates based on grid snap. 

In these cases, parallelity checks may fail due to supposed misalignment. A remedy might be to do the parallelity check in Meclib instead on the Maxima (STACK) side.

### Example

![image](https://github.com/mkraska/meclib/assets/12987918/a098830d-dd78-47d6-86e9-4a02f261cde1)
```
[
 [ "grid", "x","y", -4,6,-4,5, 50, [10,10], [0,0] ],
 [ "force", "F_1", [2, 1], [4,1], -20],
 [ "force", "F_3", [2, 2], [4,3], 10, "silent"],
 [ "force", "F_2", [2, 2], [3,2], 10, "active" ],
 [ "force", "F_4", [2, 2], [2,3], 10, "dotted" ]
]
```

### Relevant Feedback Functions

- [[fb_force()]] checks for name, direction and point of application
- [[fb_name()]]
