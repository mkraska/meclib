`[ "forceGen", "name", [x,y] ]` Interactive force generator. It consists of an input field for the label and a force prototype, which can be dragged to produce new forces. Forces can be deleted by dragging them outside of the canvas.



- `"name"` initial value for the label input field. The name typed by the students is brought into the form base, accent, subscript (`F1` → `F_1`, `F_hat` → `Fhat`, `x_ddot m` → `xddot m`) and typeset as described in [[Labels and names]].
- `[x,y]` position of the upper left border of the label input field.

see also: [["force"]]

The input field automatically corrects non-valid names (in terms of STACK). Example: `MAx` -> `M_Ax`. 


### Example

![image](https://user-images.githubusercontent.com/105876203/173600959-89c2ba96-c319-491e-af47-111ffddd336a.png)

```
[
  [ "grid", "x","y", -5,5,-4,5, 50, [10,10], [0,0] ],
[ "forceGen", "name", [2,2] ]
]
```