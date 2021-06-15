# meclib

Meclib is a code block to be used in STACK questions of the Moodle learning management system. STACK comes with integration of JSXGraph, a JavaScript library for interactive graphics. In STACK questions, this can be used to display parametrized/randomized geometry or as a graphical input channel. Usually, JSXGraph blocks in STACK question contain JavaScript code specific to that question. There are mechanisms for conveying variables from the CAS kernel of STACK (Maxima) to the widget and vice versa.

Meclib is a special JSXGraph block to be copied into the STACK question. It contains a number of geometric object definitions (classes), which can be instanciated by a properly formatted Maxima list of lists. Thus, no need to edit JavaScript code for the question author, as long as the set of objects is sufficient.

The set of objects is created with sketches of mechanical systems in mind (support and load symbols, bars, ropes, disks, annotations).

##Implemented Objects

<ul><li><code>[ "angle", "&lt;name&gt;", [xc, yc], [xs,ys], radius, angle ]</code> Angle with one arrow, centerpoint, point on start line, radius of arc, angle</li>
<li><code>[ "angle", ".", [xc, yc], [xs,ys], radius, +-90 ]</code> Right angle without arrows and label but with a dot inside.</li>
<li><code>[ "angle2", "&lt;name&gt;", [xc, yc], [xs,ys], radius, angle ]</code> Angle with two  arrows, centerpoint, point on start line, radius of arc, angle</li>
<li><code>[ "bar", "&lt;name&gt;", [x1, y1], [x2, y2] ]</code>  Stab, dicker schwarzer Strich mit Gelenk-Endpunkten</li>
<li><code>[ "beam", "", [x1, y1], [x2,y2], r ]</code> Rectangle with black border and light gray filling. The rectangle essentially is a thick line connecting two points. r is the radius (half width). More than two points (must be an even number of points) can be handled, in this case multiple rectangles are generated and merged into a single contour if they overlap. For non-merged overlapping beams use multiple beam objects.</li>
<li><code>[ "beam", "&lt;color1&gt;","&lt;color2&gt;", [x1, y1], [x2,y2], r ]</code> Rectangle with black border and gradient filling using two colors. The rectangle essentially is a thick line connecting two points. r is the radius (half width).  More than two points (must be an even number of points) can be handled, in this case multiple rectangles are generated and merged into a single contour if they overlap.  For non-merged overlapping beams use multiple beam objects.</li>
<li><code>[ "circle", "&lt;name&gt;", [xc, yc], [xp,yp] , angle]</code> Circle with centerpoint, point on perimeter, angle for dimension.  The annotation for the radius is only drawn if name is not empty If the angle is negative, the dimension is inside the circle, otherwise it is outside.</li>
<li><code>[ "circle", "&lt;name&gt;", [xc, yc], radius , angle]</code> Circle with centerpoint and radius, angle for dimension (options same as above)</li>
<li><code>[ "dim", "&lt;name&gt;", [x1, y1], [x2,y2], d ]</code> linear dimension with name used as label, d is distance from line between points. If zero, short end lines are drawn. Setting d negative, changes the side of the label.</li>
<li><code>[ "dir", "&lt;name&gt;", [x,y], angle, offset, length]</code> axis arrow with label (indication of coordinate axes). Offset (defaults to 10 pix) and length are optional. If offset is negative, the label is placed at the tail instead of the head.</li>
<li><code>[ "fix1", "&lt;name&gt;", [x, y], angle ]</code> floating bearing, support in vertical direction for angle = 0</li>
<li><code>[ "fix12", "&lt;name&gt;", [x, y], angle ]</code> fixed bearing, support in x and y direction, angular position is irrelevant for function</li>
<li><code>[ "fix123", "&lt;name&gt;", [x, y], angle ]</code> built-in support, prevents translation and rotation.</li>
<li><code>[ "fix13", "&lt;name&gt;", [x, y], angle ]</code> axial and angular support, floats in vertical direction for angle = 0</li>
<li><code>[ "force", "&lt;name&gt;", [x1, y1], [x2,y2], d ]</code> force vector. d controls the distance of the label. If d is negative, the label is drawn at the tail, if positiv or d is not given the label is at the head of the arrow.</li>
<li><code>[ "grid", "xlabel","ylabel", xmin, xmax, ymin, ymax, pix ]</code> Grid specification (range of user co-ordinates and user unit in pixels). Must be the first object in the list, otherwise scaling of the other objects might be wrong.</li>
<li><code>[ "label", "&lt;name&gt;", [x, y] ]</code> label, text anchor is center left, default: no Latex, use <code>\<span class="nolink">\(   \\)</span></code> to enforce Latex mode for text.</li>
<li><code>[ "line", "&lt;name&gt;", [x1, x2,...], [y1, y2,...] ,dash, th ]</code>  polyline with optional dash style ( "--", ".", "-.".) and thickness (defaults to 0.8)</li>
<li><code>[ "moment", "&lt;name&gt;", [x1, y1], [x2,y2], [x3,y3] ]</code></li>
<li><code>[ "node", "&lt;name&gt;", [x,y],d ]</code> Node (small white circle) with label. d is an optional distance of the label</li>
<li><code>[ "point", "&lt;name&gt;", [x,y],d ]</code> Small black point with label. d is an optional distance of the label</li>
<li><code>[ "polygon", "&lt;name&gt;", [x1, y1], [x2,y2],... ]</code> polygon with gray fill</li>
<li><code>[ "q", "&lt;q1&gt;","&lt;q2&gt;", [x1, y1], [x2,y2], q1, q2, phi ]</code> Line load inclined by phi degrees from perpendicular to line between point 1 and point 2. Names are displayed as labels, q1 and q2 give the height in user units.</li>
<li><code>[ "rope", "&lt;name&gt;", [x1, y1], r1, [x2,y2], r2 ]</code>  tangent line to two circles with center and radius given. Negative r values select the tangent point on the left side from the line C1-C2.</li>
<li><code>[ "springc", "", [x1, y1], [x2,y2], r, n, off ]</code>  compression spring, normal line with n turns of radius r and label offset off (in user units)</li><li><code>[ "wall", "&lt;name&gt;", [x1, y1], [x2,y2] , angle ]</code> Normal line with thin hatching at left side, specified by start and end point. Angle controls the direction of the hatch lines (usually +45/-45).</li>
</ul>

##Objects Specified for Implementation

<ul><li><code>[ "tspring", "", [x1, y1], [x2,y2], r, n ] tension spring, normal line with n turns of radius r</code></li>
<li><code>[ "mass", "&lt;name&gt;", [x1, y1] ]</code> black filled circle with name</li>
<li><code>[ "dashpot", "&lt;name&gt;", [x1, y1], [x2,y2], r ]</code> dashpot (for oscillators)</li>
<li><code>[ "forceGen", "&lt;label&gt;", [x,y] ]</code> Interactive force generator</li>
<li><code>[ "momentGen", "&lt;label&gt;", [x,y] ]</code> Interactive moment generator</li>
<li><code>[ "spline", "&lt;label&gt;", [x1, y1], dx, f1, f2, [xt1, yt1], [xt2, yt2], style]</code> cubic spline for interactive function graphing, [x1,y1] is the start point of the x axis interval, dx is the length of the interval, f1 and f2 are the function values at the borders of the interval, [xt1, yt1], [xt2, yt2] are points to define the respective tangent directions. If they coincide with the boundary points, no tangent condition is assumed and a quadratic or linear spline is drawn.</li>
<li><code>[ "waste", "&lt;label&gt;", [x,y ]</code> waste bucket, drag objects there to delete them</li>
</ul>
