`[ "circle", "name", [xc, yc], [xp,yp] , angle, state ]` 


`[ "circle", "name", [xc, yc], radius , angle, state ] `


Circle with centerpoint, point on perimeter or radius, angle for dimension. The annotation for the radius is only drawn if name is not empty. If the angle is negative, the dimension is inside the circle, otherwise it is outside.
- `"name"` label text for the radial dimension
- `[xc, yc]` center point
- `[xp,yp]` point on perimeter (alternative to specification of radius)
- `radius` radius
- `angle` (optional, default: `0` ) angular position of the radial dimension glyph (arrow with label). If negative, the arrow is inside the circle, otherwise it is outside.
- `state` (optional, default: `"SHOW"`; the legacy value `"locked"` looks like `"SHOW"` but is not counted as shown by `fb_system()`), can be set to 
  - `"show"` initally activated, can be deactivated by doubleclick
  - `"hide"` initally deactivated, can be activated by doubleclick
  - `"HIDE"` locked in deactivated state
  - `"SHOW"` locked in activated state


![image](https://user-images.githubusercontent.com/12987918/180446108-4db7108b-58b8-4deb-a8b9-2d66d88a0f91.png)

```
[
    [ "grid", "","", -5,6,-5,5, 50 ],
    [ "circle", "", [-2, 2], [-1.5, 1.5] , 45],
    [ "circle", "r", [0, 2], 0.8 , -45, "hide" ],
    [ "circle", "r_0", [2, 2], 0.4 ],
    [ "circle", "", [4, 2], 0.4 ],
    [ "point", "C", [0,2]],
    [ "point", "C", [-2,2]],
    [ "point", "P", [-1.5, 1.5], 15]
]
```

### Objects

- `c.center` the center point of the circle 
