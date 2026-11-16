`[ "momentGen", "name", [x,y] ]` 




Interactive moment generator. It consists of an input field for the label and a moment prototype, which can be dragged to produce new moments. Moments can be deleted by dragging one of their control points outside of the canvas.
- `"name"` initial value for the label input field. The name typed by the students is brought into the form base, accent, subscript (`M1` → `M_1`, `phi_ddot Theta` → `phiddot Theta`) and typeset as described in [[Labels and names]].
- `[x,y]` anchor point of the input field (left, vertically centered)

The input field automatically corrects non-valid names (in terms of STACK). Example: `Fax` -> `F_ax`. 

### Example

![image](https://user-images.githubusercontent.com/105876203/173604559-2bed31c4-a8a3-4dda-8e0f-e9a460c7dc75.png)

```
[
  [ "grid", "x","y", -5,5,-4,5, 50, [10,10], [0,0] ],
  [ "momentGen", "name", [2,2] ]
]
```