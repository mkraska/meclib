# meclib

Meclib is a code block to be used in STACK questions of the Moodle learning management system. STACK comes with integration of JSXGraph, a JavaScript library for interactive graphics. In STACK questions, this can be used to display parametrized/randomized geometry or as a graphical input channel. Usually, JSXGraph blocks in STACK question contain JavaScript code specific to that question. There are mechanisms for conveying variables from the CAS kernel of STACK (Maxima) to the widget and vice versa.

Meclib is a special JSXGraph block to be copied into the STACK question. It contains a number of geometric object definitions (classes), which can be instanciated by a properly formatted Maxima list of lists. Thus, no need to edit JavaScript code for the question author, as long as the set of objects is sufficient.

The set of objects is created with sketches of mechanical systems in mind (support and load symbols, bars, ropes, disks, annotations).



[Demo question](quiz-MMM-MecLib%20Demo%20Github-20210615-1446.xml)

![Demo](demo2.png?raw=true "Screenshot from the demo question")

## Reference

Kraska, Martin, & Schulz, Dennis. (2021). Automatic assessment of free body diagrams using STACK. Presented at the International Meeting of the STACK Community 2021, Zenodo. http://doi.org/10.5281/zenodo.4916138

## Implemented Objects

All co-ordinates and lengths are in user units as specified with `"grid"`, angles are in °, if not specified otherwise.

<ul><li><code>[ "angle", "&lt;name&gt;", [xc, yc], [xs,ys], radius, angle ]</code> Angle with one arrow, centerpoint, endpoint of start line, radius of arc, angle.</li>
<li><code>[ "angle", ".", [xc, yc], [xs,ys], radius, (-)90 ]</code> Right angle without arrows and label but with a dot inside.</li>
<li><code>[ "angle2", "&lt;name&gt;", [xc, yc], [xs,ys], radius, angle ]</code> Angle with two arrows, centerpoint, endpoint of start line, radius of arc, angle.</li>
<li><code>[ "bar", "&lt;name&gt;", [x1, y1], [x2, y2] ]</code>  bar, thick black line with hinge points (nodes) at the ends. The label is placed next to the center of the line on the left side if seen from point 1 to point 2. </li>
<li><code>[ "beam", "", [x1, y1], [x2,y2], r ]</code> Rectangle with black border and light gray filling. The rectangle essentially is a thick line connecting two points. r is the radius (half width). More than two points (must be an even number of points) can be handled, in this case multiple rectangles are generated and merged into a single contour if they overlap. For non-merged overlapping beams use multiple beam objects.</li>
<li><code>[ "beam", "&lt;color1&gt;","&lt;color2&gt;", [x1, y1], [x2,y2], r ]</code> Rectangle with black border and gradient filling using two colors. The gradient is tried to be in lateral direction if possible (only horizontal or vertical gradients are possible). The rectangle essentially is a thick line connecting two points. r is the radius (half width).  More than two points (must be an even number of points) can be handled, in this case multiple rectangles are generated and merged into a single contour if they overlap.  For non-merged overlapping beams use multiple beam objects.</li>
<li><code>[ "circle", "&lt;name&gt;", [xc, yc], [xp,yp] , angle]</code> Circle with centerpoint, point on perimeter, angle for dimension.  The annotation for the radius is only drawn if name is not empty. If the angle is negative, the dimension is inside the circle, otherwise it is outside.</li>
<li><code>[ "circle", "&lt;name&gt;", [xc, yc], radius , angle]</code> Circle with centerpoint and radius, angle for dimension (options same as above)</li>
<li><code>[ "dim", "&lt;name&gt;", [x1, y1], [x2,y2], d ]</code> linear dimension with name used as label, d is distance from line between points, counts positive to the left side seen from point 1 to point 2. If zero, short end lines are drawn.</li>
<li><code>[ "dir", "&lt;name&gt;", [x,y], angle, offset, length]</code> small arrow with label (indication of coordinate axes). Offset (defaults to 10 pix) and length (defaults to grid-independent smart value) are optional. If offset is negative, the label is placed at the tail instead of the head.</li>
<li><code>[ "disp", "&lt;name&gt;", [x,y], angle, offset, length]</code> small red arrow with label (indication of displacement). Offset (defaults to 10 pix) and length (1) are optional. If offset is negative, the label is placed at the tail instead of the head.</li>
<li><code>[ "fix1", "&lt;name&gt;", [x, y], angle ]</code> floating bearing with label, support in vertical direction for angle = 0</li>
<li><code>[ "fix12", "&lt;name&gt;", [x, y], angle ]</code> fixed bearing, support in x and y direction, angular position is irrelevant for function</li>
<li><code>[ "fix123", "&lt;name&gt;", [x, y], angle ]</code> built-in support, prevents translation and rotation.</li>
<li><code>[ "fix13", "&lt;name&gt;", [x, y], angle ]</code> axial and angular support, floats in vertical direction for angle = 0</li>
<li><code>[ "force", "&lt;name&gt;", [x1, y1], [x2,y2], d ]</code> force vector. d (in pix) controls the distance of the label. If d is negative, the label is drawn at the tail, if positiv or d is not given the label is at the head of the arrow.</li>
<li><code>[ "grid", "xlabel","ylabel", xmin, xmax, ymin, ymax, pix ]</code> Grid specification (range of user co-ordinates and user unit in pixels). Must be the first object in the list, otherwise scaling of the other objects might be wrong. xlabel and ylabel are axis labels. Currently no axes are drawn and the labels are ignored.</li>
<li><code>[ "label", "&lt;name&gt;", [x, y] ]</code> label, text anchor is center left, default: no Latex, use <code>\<span class="nolink">\(   \\)</span></code> to enforce Latex mode for text.</li>
<li><code>[ "line", "&lt;name&gt;", [x1, x2,...], [y1, y2,...] ,dash, th ]</code>  polyline with optional dash style ( "--", ".", "-."..defaults to solid line) and thickness (defaults to 0.8)</li>
<li><code>[ "moment", "&lt;name&gt;", [x1, y1], [x2,y2], [x3,y3] ]</code>Moment arrow specified by center point, tail point (defines start angle and radius) and label point (defines end angle and radial label position. Orientation is such that the angle is less then 180° (shortest arc from start angle to end angle).</li>
<li><code>[ "node", "&lt;name&gt;", [x,y],d ]</code> Node (small white circle, typically indicates hinge point) with label. d (in pix) is an optional distance of the label</li>
<li><code>[ "point", "&lt;name&gt;", [x,y],d ]</code> Small black point with label. d (in pix) is an optional distance of the label</li>
<li><code>[ "polygon", "&lt;name&gt;", [x1, y1], [x2,y2],... ]</code> polygon with gray fill</li>
<li><code>[ "q", "&lt;q1&gt;","&lt;q2&gt;", [x1, y1], [x2,y2], q1, q2, phi ]</code> Line load inclined by phi degrees from perpendicular to line between point 1 and point 2. Names are displayed as labels, q1 and q2 give the height.</li>
<li><code>[ "rope", "&lt;name&gt;", [x1, y1], r1, [x2,y2], r2 ]</code> tangent line to two circles with center and radius given. Negative r values select the tangent point on the left side from the line C1-C2.</li>
<li><code>[ "moment", "&lt;name&gt;", [x1, y1], [x2,y2], [x3,y3] ]</code> Red moment arrow specified by center point, tail point (defines start angle and radius) and label point (defines end angle and radial label position. Orientation is such that the angle is less then 180° (shortest arc from start angle to end angle).</li>
<li><code>[ "springc", "", [x1, y1], [x2,y2], r, n, off ]</code>  compression spring, normal line with n turns of radius r and label offset off</li>
<li><code>[ "springt", "", [x1, y1], [x2,y2], r, lf, (n (, off)) ] </code>  tensile spring, normal line with n turns of radius r and label offset off, lf length of terminal lines in percent of total length.</li>
<li><code>[ "wall", "&lt;name&gt;", [x1, y1], [x2,y2] , angle ]</code> Normal line with thin hatching at left side, specified by start and end point. Angle controls the direction of the hatch lines (usually +45/-45).</li>
</ul>

## Objects Specified for Implementation

<ul>
<li><code>[ "mass", "&lt;name&gt;", [x1, y1] ]</code> black filled circle with name</li>
<li><code>[ "dashpot", "&lt;name&gt;", [x1, y1], [x2,y2], r ]</code> dashpot (for oscillators)</li>
<li><code>[ "forceGen", "&lt;label&gt;", [x,y] ]</code> Interactive force generator</li>
<li><code>[ "momentGen", "&lt;label&gt;", [x,y] ]</code> Interactive moment generator</li>
<li><code>[ "spline", "&lt;label&gt;", [x1, y1], dx, f1, f2, [xt1, yt1], [xt2, yt2], style]</code> cubic spline for interactive function graphing, [x1,y1] is the start point of the x axis interval, dx is the length of the interval, f1 and f2 are the function values at the borders of the interval, [xt1, yt1], [xt2, yt2] are points to define the respective tangent directions. If they coincide with the boundary points, no tangent condition is assumed and a quadratic or linear spline is drawn.</li>
<li><code>[ "waste", "&lt;label&gt;", [x,y ]</code> waste bucket, drag objects there to delete them</li>
<li><code>[ "circle2P", "&lt;label1&gt;","&lt;label2&gt;", [x1,y1],[x2,y2], style ]</code> circle with two draggable perimeter points, meant for Mohr's circle construction</li>
<li><code>[ "line2P", "&lt;label&gt;", [x1,y1],[x2,y2], style ]</code> line with two draggable perimeter points, meant for Mohr's circle construction</li>
</ul>

## Code for Question Text

The following code is a complete [[jsxgraph]] block, which just is copied to the question text and displays the widget. It can be surrounded by whatever other question text.
Usually, there is no need to edit the block.

[meclib.txt](meclib.txt)

## Template for Question Variables

You have to define a Maxima list of lists and apply `stackjson_stringify()` to it. The name must be `init` unless you change that in the JSXGraph block.
Changing the name is required if you want to use more than one JSXGraph widget in a STACK question. Values in round brackets () are optional. Vertical lines delimit alternatives.

```
th: 0.13;
initdata: [ 
  [ "grid", "xlabel","ylabel", xmin, xmax, ymin, ymax, pix ],
  [ "angle", ".", [xc, yc], [xs,ys], radius, (-)90 ],
  [ "angle", "", [xc, yc], [xs,ys], radius, angle ],
  [ "angle2", "", [xc, yc], [xs,ys], radius, angle ],
  [ "bar", "", [x1, y1], [x2, y2] ],
  [ "beam", "", [x1, y1], [x2,y2], r ], /* even number of points for multiple segments */
  [ "beam", "","", [x1, y1], [x2,y2], r ],
  [ "circle", "", [xc, yc], [xp,yp] , angle],
  [ "circle", "", [xc, yc], radius , angle],
  [ "dim", "", [x1, y1], [x2,y2], d ],
  [ "dir", "", [x1, y1], angle(, offset(, length)) ],
  [ "disp", "", [x1, y1], angle(, offset(, length)) ],
  [ "fix1", "", [x, y], angle ],
  [ "fix12", "", [x, y], angle ],
  [ "fix123", "", [x, y], angle ],
  [ "fix13", "", [x, y], angle ],
  [ "force", "", [x1, y1], [x2,y2], 10 ],
  [ "label", "", [x, y] ],
  [ "line", "", [x1, x2, x3], [y1, y2, y3] ,(dash), (thickness)],
  [ "moment", "", [x1, y1], [x2,y2], [x3,y3] ],
  [ "node", "", [x,y],d ],
  [ "point", "", [x,y],d ],
  [ "polygon", "", [x1, y1], [x2,y2], , [x3,y3]],
  [ "q", "q1","q2", [x1, y1], [x2,y2], q1, q2, phi ],
  [ "rope", "", [x1, y1], r1, [x2,y2], r2 ],
  [ "rot", "", [x1, y1], [x2,y2], [x3,y3] ],
  [ "springc", "k", [x1, y1], [x2, y2], r, n, off],
  [ "springt", "c", [x1,y1],[x2, y2], r, lf, n, off],
  [ "wall", "", [x1, y1], [x2,y2] , angle ]
];
init: stackjson_stringify(float(initdata));
```
