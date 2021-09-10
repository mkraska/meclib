# MecLib

MecLib is a code block to be used in STACK questions of the Moodle learning management system. STACK comes with integration of JSXGraph, a JavaScript library for interactive graphics. In STACK questions, this can be used to display parametrized/randomized geometry or as a graphical input channel. Usually, JSXGraph blocks in STACK question contain JavaScript code specific to that question. There are mechanisms for conveying variables from the CAS kernel of STACK (Maxima) to the widget and vice versa.

MecLib is a special JSXGraph block to be copied into the STACK question. It contains a number of geometric object definitions (classes), which can be instanciated by a properly formatted Maxima list of lists. Thus, no need to edit JavaScript code for the question author, as long as the set of objects is sufficient.

The set of objects is created with sketches of mechanical systems in mind (support and load symbols, bars, ropes, disks, annotations).

There are two versions: `MecLib` (non-interactive) and `iMecLib` (interactive input). The remainder of this page documents the non-interactive version. The interactive version is documented [here](iMecLib/Readme.md).


[Demo question](STACK%20MecLib%20Demo.xml)

[jsfiddle tryout](https://jsfiddle.net/gs6omdp0/)

![Demo](demo2.png?raw=true "Screenshot from the demo question")

## Reference

Kraska, Martin, & Schulz, Dennis. (2021). Automatic assessment of free body diagrams using STACK. Presented at the International Meeting of the STACK Community 2021, Zenodo. http://doi.org/10.5281/zenodo.4916138


## Code for Question Text

The following code is a complete [[jsxgraph]] block, which just is copied to the question text and displays the widget. It can be surrounded by whatever other question text.
Usually, there is no need to edit the block.

[meclib.txt](meclib.txt)

## Template for Question Variables

You have to define a Maxima list of lists and apply `stackjson_stringify()` to it. The name must be `init` unless you change that in the JSXGraph block.
Changing the name is required if you want to use more than one JSXGraph widget in a STACK question.

```
th: 0.13;
initdata: [ 
  [ "grid", "xlabel","ylabel", xmin, xmax, ymin, ymax, pix ],
  [ "angle", ".", [xc, yc], [xs,ys], radius, +/-90 ],
  [ "angle", "", [xc, yc], [xs,ys], radius, angle ],
  [ "angle1", "", [xc, yc], [xs,ys], radius, angle ],
  [ "angle2", "", [xc, yc], [xs,ys], radius, angle ],
  [ "bar", "", [x1, y1], [x2, y2] ],
  [ "beam", "", [x1, y1], [x2,y2], r ], /* even number of points for multiple segments */
  [ "beam", "","", [x1, y1], [x2,y2], r ],
  [ "circle", "", [xc, yc], [xp,yp] , angle],
  [ "circle", "", [xc, yc], radius , angle],
  [ "dashpot", "", [x1, y1], [x2,y2], r, off],
  [ "dim", "", [x1, y1], [x2,y2], d ],
  [ "dir", "", [x1, y1], angle, offset, length ],
  [ "disp", "", [x1, y1], angle, offset, length ],
  [ "fix1", "", [x, y], angle ],
  [ "fix12", "", [x, y], angle ],
  [ "fix123", "", [x, y], angle ],
  [ "fix13", "", [x, y], angle ],
  [ "force", "", [x1, y1], [x2,y2], 10 ],
  [ "label", "", [x, y] ],
  [ "line", "", [x1, x2, x3], [y1, y2, y3] ,(dash), (thickness)],
  [ "mass", "", [x, y], r, off ],
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
