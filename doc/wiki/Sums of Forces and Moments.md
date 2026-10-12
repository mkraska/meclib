### Sum of of forces and moments along the standard coordinate axes

`[fx,fy,m]: sum_xyM(obj,names,rp,lu)` Returns the sums of forces `fx`, `fy` and moments `m` about reference point `rp` using length unit `lu`.
- `objects` Input field with object list
- `names` Input field with object names
- `rp` coordinates of the reference point in grid units `[x,y]`
- `lu` symbolic length unit

### `sumF(obj, names, d, options)` and `sumM(obj, names, rp, lu, options)`

- `sumF` sum of all forces projected onto the direction `d`: a vector such as `[1,0]`, or the index of a [["dir"]] object whose direction is taken
- `sumM` sum of the moments of all forces and moments about the point `rp` (sketch coordinates, e.g. `names[i_P]` of a [["crosshair"]]), counterclockwise positive, with the length unit `lu`
- `options` (optional) list of options `name = value`:
  - `contacts` indices of [["contact"]] objects. A force found at one of them (normal or tangential, with the tolerance of [[Feedback for "contact"]]) gets the exact normal or tangent direction of the contact, with the sense of the drawn arrow, and the contact point as point of application. Drawn arrows snap to 0.1 grid units and are only roughly along the contact, so without this option a correct equation such as `N_B*sin(alpha)` may not match `7/sqrt(149)*N_B`. Give the direction of the contact with exact numbers, e.g. `[-2, -3]`.
  - `at` (`sumM`) list of `[k, r]`: load `k` acts at point `r`, given in length units (like `rp*lu`), e.g. a centre of gravity that depends on symbols of the problem: `at = [[i_G, pA*a + rS]]`.

Without options the directions of the arrows (rounded to 0.1) and the points of the sketch are used. `sum_xyM()` returns `[sumF(..., [1,0]), sumF(..., [0,1]), sumM(...)]` and takes the same options; it is kept for existing questions.

The sums are the references for [[fb_EE()]]:

```
obj: stackjson_parse(objects);
[textGGx, okGGx]: fb_EE(S_GGx, sumF(obj, names, [1,0], [contacts = [i_A, i_B]]), [subst = [alpha = atan(yB/xA)], kind = "x"]);
```

### Sum of forces along a custom direction

Use the [["dir"]] object to let the user specify custom coordinate directions for sums of forces.

### `sum_dir(o, n, d)`
- `o` list of objects
- `n` names field
- `d` direction vector, e.g. `direction(o[i_dir])`

Returns the sum of all [["force"]] objects in `o`, projected onto direction `d`, as a symbolic
linear combination of their names `n[i]` — this is the grading target for an equation of equilibrium
in a student-chosen direction. 

### Question Variables

Make sure that `fb_fbd.mac` is included. It contains the relevant functions. 

### Feedback Variables

This is a typical use if the reference point is obtained from the position of object `i_P`, which could be a [["crosshair"]]

```
obj: stackjson_parse(objects);
[fx,fy,m]: sum_xyM(obj,names,names[i_P],a);
```

### PRT Node

Display of the sum of forces and moment (formative feedback).

```
<p>\( \displaystyle \Sigma F_x={@fx@}\) </p>
<p>\( \displaystyle \Sigma F_y={@fx@}\) </p>
<p>\( \displaystyle \Sigma M_0={@m@}\) </p>
```
