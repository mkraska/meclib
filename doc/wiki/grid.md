`[ "grid", "xlabel","ylabel", xmin, xmax, ymin, ymax, pix, [fx, fy], [dpx, dpy] ]`

 Grid specification (range of user co-ordinates and user unit in pixels). Must be the first object in the list, otherwise scaling of the other objects might be wrong. Scaling factors and decimal precision can be set for [[Dynamic display of coordinates]]. 

- `"xlabel"`, `"ylabel"` axis labels, typeset in MathJax (see [[Labels and names]]). If empty, no axes (arrows with tick labels) are drawn. If you want axes without labels, then specify space characters `" "` as labels.
- `xmin, xmax, ymin, ymax` co-ordinate values of the left, right, lower, upper edge of the window respectively. If max < min, then axis direction is reversed. This, however, is unstable (problems with gridsnap). Use negative scaling factors instead.
- `pix` distance between grid lines in pixels
- `[fx, fy]` (optional, defaults to `[1, 1]`) scaling factors for the tick values of the axes (if displayed at all) and of the dynamic coordinate display of points. 
- `[dpx, dpy]` (optional, defaults to `[1, 1]`) decimal precision of the dynamic coordinate display of points (Added in 2022 04 25). As the grid snap is 0.1 grid unit, the grid tick values are displayed with one digit less than `dpx` or `dpy`.


**Hint:** If the default label placement doesn't fit your needs, then use a space as axis label (`" "`) and place the actual label using the [["label"]] object.

### Examples

Default scaling and decimal precision:

![image](https://user-images.githubusercontent.com/12987918/182408921-1585da59-02ef-4321-8820-8d6fff913502.png)

```
[
  [ "grid", "x","y", -2,3,-1,2, 40 ],
  [ "fix12", "A", [1,1], 0]
]
```
The same, with axes suppressed by empty label strings

![image](https://user-images.githubusercontent.com/12987918/182411203-a6d4d235-e51c-4ef6-ba4c-5e00c0ffe701.png)
```
[
    [ "grid", "","", -2,3,-1,2, 40 ],
    [ "fix12", "A", [1,1], 0]
]
```

Inverted axes (by specifying min > max)

![image](https://user-images.githubusercontent.com/12987918/203585350-cd450dcb-c0db-428d-a727-754fb17e2fd6.png)
```
[
  [ "grid", "x","y", 3,-2, 2,-1, 40 ],
  [ "fix12", "A", [1.5,1.5], 0]
]
```

Scale factor 10 and zero fractional decimal digits

![image](https://user-images.githubusercontent.com/12987918/182409366-8f15bb80-9558-4c93-920b-623fcf2f7088.png)
```
[
  [ "grid", "x","y", -2,3,-1,2, 40, [10,10], [0,0] ],
  [ "fix12", "A", [1,1], 0]
]
```