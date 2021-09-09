# iMecLib

iMeclib is the interactive version of MecLib.

It allows for graphical input in JSXGraph widgets.


[jsfiddle tryout](https://jsfiddle.net/vtmeq12x/33/)

[Spline demo question](spline-demo.xml)


[Diagram demo question with scaled axes and crosshair](diagram-demo.xml)

[Demo question with editor for free body diagrams](fbd-demo.xml)

![Spline Demo](FBD demo1.png?raw=true "Screenshot from the spline demo question")

## Reference

Kraska, Martin, & Schulz, Dennis. (2021). Automatic assessment of free body diagrams using STACK. Presented at the International Meeting of the STACK Community 2021, Zenodo. http://doi.org/10.5281/zenodo.4916138

## Objects

For documentation see the [Wiki](https://github.com/mkraska/meclib/wiki).


```
/* iMecLib objects */
initdata: [ 
  [ "bar", "1", [x1, y1], [x2, y2], "show"|"hide" ],
  [ "beam", "", [x1, y1], [x2,y2], r, "show"|"hide" ], /* even number of points for multiple segments */
  [ "beam", "red","green", [x1, y1], [x2,y2], r, "show"|"hide" ],
  [ "grid", "x", "y", -5,5, -2, 5, 50 [fx, fy]],
  [ "circle2p", "label1","label2", [x1,y1],[x2,y2], f ],
  [ "crosshair","", [x0, y0], [xref, yref], [fx, fy], [dpx, dpy] ],
  [ "dashpot", "name", [x1,y1], [x2,y2], r, offset ],
  [ "dir", "x",  [x,y], angle, labeloffset, length],
  [ "disp", "name", [x,y], angle, offset, length],
  [ "fix1", "", [x, y], angle, "show"|"hide" ],
  [ "fix12", "", [x, y], angle, "show"|"hide" ],
  [ "fix123", "", [x, y], angle, "show"|"hide" ],
  [ "fix13", "", [x, y], angle, "show"|"hide" ],
  [ "force", "F", [2,0], [2,1], "locked" ], 
  [ "forceGen", "name", [x,y] ], 
  [ "label", "A",  [x,y] ],
  [ "line", "name", [x1, x2,...], [y1, y2,...] ,dash, th ],
  [ "line2P", "label", [x1,y1],[x2,y2], f ],
  [ "mass", [x,y],r, off],
  [ "moment", "M_0", [0,0], [1,-1], [1,1], "locked" ], 
  [ "momentGen", "name", [x,y] ], 
  [ "q", "q1","q2", [x1, y1], [x2,y2], q1, q2, phi, "show"|"hide" ],
  [ "spline", "eqn", [X0, Y0], [x1, y1], [x2,y2], [xt1, yt1], [xt2,yt2], "", "active"],
  [ "springt", "name", [x1,y1], [x2,y2], r, proz, n, offset ],
  [ "wall", "name", [x1, y1], [x2,y2] , angle ]
];
init: stackjson_stringify(float(initdata));
```

## Functions for Feedback Generation

Functions to evaluate the state of the interactive graphics are discussed in the [Maxima Readme](../Maxima/Readme.md).