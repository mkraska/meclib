[[jsxgraph width='250px' height='250px' ]] 
// Version 2021 08 09 https://jsfiddle.net/248wo69c/4/
var state = JSON.parse({#init#});
//## start of chunk 1
JXG.Options.point.fixed = true; // this is for static objects
JXG.Options.text.useMathJax = true;
JXG.Options.label.useMathJax = true;
JXG.Options.label.offset = [0,0];
JXG.Options.label.anchorY = 'middle';
JXG.Options.line.fixed = true;
// Style for nodes (supports, bars)
const nodeStyle = {fillcolor:'white',strokeColor:'black',size:2, strokeWidth:1.5};
const pointStyle = {fillcolor:'black',strokeColor:'black',size:1, strokeWidth:1};
// Style for bars
const barStyle = {strokewidth:4,strokecolor:"black"};
// Set some linestyles
const normalStyle = {strokeWidth:2,strokeColor:'black', lineCap:'round'};
const thinStyle = {strokeWidth:1,strokeColor:'black', lineCap:'round'};
const defaultMecLayer = 6;//## End of chunk 1
//## End of chunk 1
const board = JXG.JSXGraph.initBoard(divid, {
 boundingbox: [-5, 5, 5, -5], //default values, use "grid" to customize
 axis: false, grid:true, showNavigation:false, showCopyright:true
});
//##start of chunk 2
var a = 16/40; // default value, use "grid" to customize
var pxunit = 1/40;
var labelshift = 0.2*a;
// angular dimension with a single or double arrow (handles arrow and arrow2)
// angular dimension with a single or double arrow (handles arrow and arrow2)
class angle {
 constructor(data) {
   this.d = data.slice(0); //copy
   this.name = data[1];
   // base line
   this.p1 = board.create('point',data[2],{withlabel:false,visible:false});
   this.p2 = board.create('point',data[3],{withlabel:false,visible:false});
   this.line = board.create('segment', [this.p1, this.p2], {withlabel:false}); 
   this.line.setAttribute(thinStyle);
   // second line
   const a0 = this.line.getAngle();
   const le = this.line.L();
   const a1 = a0+Math.PI/180*data[5];
   this.p3 = board.create('point',
     [this.p1.X()+le*Math.cos(a1), this.p1.Y()+le*Math.sin(a1)],
     {withlabel:false,visible:false});
   this.l2 = board.create('segment', [this.p1, this.p3], {withlabel:false});
   this.l2.setAttribute(thinStyle);
   // arc with arrows
   this.p4 = board.create('point',
     [this.p1.X()+data[4]*Math.cos(a0), this.p1.Y()+data[4]*Math.sin(a0)],
     {withlabel:false,visible:false});
   this.arc = board.create('minorArc', [this.p1, this.p4, this.p3] );
   this.arc.setAttribute(thinStyle);
   if (data[0] == "angle" && this.name != "." )
     {  this.arc.setAttribute({lastArrow: true} ) } 
   if (data[0] == "angle2" && this.name != "."  )
     {  this.arc.setAttribute({firstArrow: true} );
        this.arc.setAttribute({lastArrow: true} ) } 
   // label
   const al = (a0+a1)/2;
   if (this.name == ".") {
     const rl = data[4]*0.6;
     this.p5 = board.create('point',
       [this.p1.X()+rl*Math.cos(al), this.p1.Y()+rl*Math.sin(al)],
       {name:"" ,fillcolor:'black',strokeColor:'black',size:0.5, strokeWidth:0}); 
   }
   else {
     const rl = data[4]+10*pxunit;
     this.p5 = board.create('point',
       [this.p1.X()+rl*Math.cos(al), this.p1.Y()+rl*Math.sin(al)],
       {name:"\\("+this.name+"\\)" ,size:0, label:{offset:[-6,0]}}); 
   }
 }
 data() { return this.d }
}
// Fachwerkstab
class bar {
 constructor(data) {
   this.name = data[1];
   // line
   this.p1 = board.create('point',data[2],{withlabel:false});
   this.p1.setAttribute(nodeStyle);
   this.p2 = board.create('point',data[3],{withlabel:false});
   this.p2.setAttribute(nodeStyle);
   this.line = board.create('segment', [this.p1, this.p2], {withlabel:false});     this.line.setAttribute(barStyle);
   // label
   const alpha = this.line.getAngle()+Math.PI/2;
   this.label = board.create('text', [
     0.5*(this.p1.X()+this.p2.X())+Math.cos(alpha)*0.5*a, 
     0.5*(this.p1.Y()+this.p2.Y())+Math.sin(alpha)*0.5*a, this.name], {
     anchorX:'middle', anchorY:'middle'
   });
 }
 data() { return ["bar", this.name, [this.p1.X(), this.p1.Y()], [this.p2.X(), this.p2.Y()] ] }
}
// Rectangle with centerline given by pair of points. Even number of points generates multiple rectangles which are merged if they overlap.
class beam {
 constructor(data){
   this.d = data.slice(0); //make a copy
   data.shift(); // drop the type string
   if (typeof data[1] === 'string') {
     this.col = [data.shift(),data.shift()]; //droping the attributes for fillcolor and gradientcolor into an array
   } else {
     this.col = [ 'lightgrey', 'lightgrey']; data.shift(); // drop the name and use default uniform color
   }
   this.r = data.pop(); // radius
   this.b = board.create('curve', [[],[]], normalStyle); // init the result
   this.p = data; // end points of center line
   // loop over pairs of points
   this.angle = -Math.atan2(this.p[1][1]-this.p[0][1],this.p[1][0]-this.p[0][0])+Math.PI/2;
   this.attr = {
       opacity: true, layer: defaultMecLayer, fillcolor:this.col[0],
               gradient: 'linear', gradientSecondColor: this.col[1], gradientAngle: this.angle, 
               strokeWidth: normalStyle.strokeWidth, strokeColor: normalStyle.strokeColor
               };
   while (this.p.length > 0) {
     var x = this.p[0][0];
     var y =  this.p[0][1];
     var dx = (this.p[1][0]-x);
     var dy = (this.p[1][1]-y);
     var l = Math.sqrt(dx**2+dy**2);
     var c = this.r/l;
     var bneu = board.create('curve',[
       [x+dy*c,x+dx+dy*c,x+dx-dy*c,x-dy*c,x+dy*c], 
       [y-dx*c,y+dy-dx*c,y+dy+dx*c,y+dx*c,y-dx*c] ], 
       { strokeWidth:0 }
     );
     if ((typeof JXG.Math.Clip === 'undefined') || (this.b.dataX.length == 0)) {
        this.b = bneu;
        this.b.setAttribute(this.attr);
     }
     else {
       this.b = board.create('curve', JXG.Math.Clip.union( bneu, this.b, board), 
         this.attr);
     }
     this.p.shift(); // remove 2 points
     this.p.shift();
   } 
 this.b.rendNode.setAttributeNS(null, 'fill-rule', 'evenodd');  //Workaround for correct fill, see https://github.com/jsxgraph/jsxgraph/issues/362
 }
 data(){
   return this.d;
 } 
}
// Circle with centerpoint, point on perimeter, optional: use name as radius indicator
class circle {
 constructor(data){
   this.d = data.slice(0); //make a copy
   data.shift(); // drop the type string
   this.name = data.shift(); // drop the name string
   this.angle = data.pop()*Math.PI/180; // pop the angle for the label
   // circle
   this.c = board.create('circle', data, {opacity: true, fillcolor:'lightgray', 
         strokeWidth: normalStyle.strokeWidth, 
         strokeColor: normalStyle.strokeColor});
   // arrow and label if name is not empty
   if (this.name != '') {
     const dx = Math.cos(this.angle);
     const dy = Math.sin(this.angle);
     var dir = 1;
     if (this.angle < 0) {dir = -1};
     const xc = data[0][0];
     const yc = data[0][1];
     const r = this.c.Radius();
     //      console.log(dir);
     this.a = board.create('arrow',
       [[xc+dx*(r+dir*a), yc+dy*(r+dir*a)],[xc+dx*(r), yc+dy*(r)]],
       thinStyle);
     // label
     this.p = board.create('point',
     [xc+dx*(r+dir*1.5*a), yc+dy*(r+dir*1.5*a)],
     {name:"\\("+this.name+"\\)" ,size:0, label:{offset:[-6,0]}}); 
   }
   }
 data(){
   return this.d;
 } 
}

// damper 
// [ "dashpot", "name", [x1,y1], [x2,y2], r, offset ]
class dashpot {
  constructor(data){
    // Parameter handling
    this.d = data.slice(0); //make a copy
    var x = this.d[2][0];
    var y =  this.d[2][1];
    var dx = (this.d[3][0]-x);
    var dy = (this.d[3][1]-y);
    var l = Math.sqrt(dx**2+dy**2);
    var r;
    if (data.length >4 ) {r = data[4] } else {r = 6*pxunit}
    if (data.length >5 ) {this.off = data[7]} else {this.off = r+8*pxunit}
    var c = r/l;
    // start point
    var xc = x+0.5*dx, yc = y+0.5*dy;
    var dlx = c*dx, dly = c*dy, dqx = -c*dy, dqy = c*dx;    
    var px = [x, xc, NaN, xc+dqx, xc-dqx, NaN,
      xc+dqx-dlx, xc+dqx+dlx, xc-dqx+dlx, xc-dqx-dlx, NaN,
      xc+dlx, x+dx];
    var py = [y, yc, NaN, yc+dqy, yc-dqy, NaN,
      yc+dqy-dly, yc+dqy+dly, yc-dqy+dly, yc-dqy-dly, NaN,
      yc+dly, y+dy];
    px.push(x+dx);
    py.push(y+dy);
     board.create('curve',[ px, py ], normalStyle );
    // label
    board.create('point',[xc-dy/l*this.off, yc+dx/l*this.off], {    
      name: "\\("+data[1]+"\\)" ,size:0, label:{offset:[0,0]}});
    // logging
    console.log("dasphot", data[1], data[2], data[3], r, this.off);   
  }
  data(){
    return this.d;
  } 
}


// linear dimension ["dim", "name", [x1,y1], [x2,y2], d]
class dim {
 constructor(data) {
   this.d = data;  
   this.name = data[1];
   const dx = data[3][0]-data[2][0];
   const dy = data[3][1]-data[2][1];
   const a0 = Math.atan2(dy,dx);
   const le = Math.sqrt(dx**2+dy**2);
   const d = data[4];
   const x1 = data[2][0]-d*dy/le;
   const y1 = data[2][1]+d*dx/le;
   const x2 = x1+dx; 
   const y2 = y1+dy;
   const nx = -dy/le;
   const ny = dx/le;
   //console.log(nx,ny);
   // baseline
   this.bl = board.create('arrow', [ [x1,y1 ], [x2,y2 ]], {name: '', firstArrow: { type: 1, size: 6 }, lastArrow: { type: 1, size: 6 }});
   this.bl.setAttribute(thinStyle);
   // perpendicular lines
   var da = 0.3*a;
   var di = da;
   if (d !=0  ) {di=d};
   if (d<0) {di=d;da=-da};
   this.hl1 = board.create('segment', 
     [ [x1-nx*di,y1-ny*di ], [x1+nx*da,y1+ny*da ]], {name: ''});
   this.hl1.setAttribute(thinStyle);
   this.hl2 = board.create('segment', 
     [ [x2-nx*di,y2-ny*di ], [x2+nx*da,y2+ny*da ]], {name: ''});
   this.hl2.setAttribute(thinStyle);
   // label
   this.p = board.create('point',
     [x1+0.5*dx+nx*a*0.5, y1+0.5*dy+ny*a*0.5],
     {name:"\\("+this.name+"\\)" ,size:0, label:{offset:[-6,0]}});   
 }
 data() { return this.d }
}
// co-ordinate arrow with arrow with label 
// ["dir", "name", [x1,y1], angle]
// ["dir", "name", [x1,y1], angle, offset]
// ["dir", "name", [x1,y1], angle, offset, length]
class dir {
 constructor(data) {
   this.name = data[1];
   this.d =data;
   var le = 1.5*a;
   if (data.length >=5 ) {this.dist = data[4] } else {this.dist = 10};
   if (data.length >=6 ) { le = data[5] }
   if (this.dist >= 0) {this.name1 = ""; this.name2 = "\\("+this.name+"\\)" } else
     {this.name2 = ""; this.name1 = "\\("+this.name+"\\)" }
   // Arrow
   const a0 = data[3]*Math.PI/180;
   const off = data[4];
   const nx = Math.cos(a0);
   const ny = Math.sin(a0);
   const x2 = data[2][0]+le*nx;
   const y2 = data[2][1]+le*ny;
   this.p1 = board.create('point', data[2], { size: 0, name: this.name1, 
     label:{offset:[-6,this.dist], autoPosition:true}});
   this.p2 = board.create('point', [x2, y2], { size: 0, name: this.name2,
     label:{offset:[-6,this.dist], autoPosition:true}});
   this.vec = board.create('arrow', [this.p1, this.p2], { lastArrow: { type: 1, size: 6 } });
   this.vec.setAttribute(thinStyle);
}
 data() { return this.data } 
}
//co-ordinate arrow with red arrow with label ["disp", "name", [x1,y1], angle, offset]
class disp {
   constructor(data) {
    this.name = data[1];
    var le = 1.5*a;
    if (data.length >=5 ) {this.dist = data[4] } else {this.dist = 10};
    if (data.length >=6 ) { le = data[5] }
    if (this.dist >= 0) {this.name1 = ""; this.name2 = "\\("+this.name+"\\)" } else
      {this.name2 = ""; this.name1 = "\\("+this.name+"\\)" }
    // Arrow
    const a0 = data[3]*Math.PI/180;
    const off = data[4];
    const nx = Math.cos(a0);
    const ny = Math.sin(a0);
    const x2 = data[2][0]+le*nx;
    const y2 = data[2][1]+le*ny;
    this.p1 = board.create('point', data[2], { size: 0, name: this.name1, 
      label:{offset:[-6,this.dist], autoPosition:true, color:"red"} });
    this.p2 = board.create('point', [x2, y2], { size: 0, name: this.name2,
      label:{offset:[-6,this.dist], autoPosition:true, color:"red" }});
    this.vec = board.create('arrow', [this.p1, this.p2], { lastArrow: { type: 1, size: 6 } });
    this.vec.setAttribute(thinStyle);
    this.vec.setAttribute({color:"red"});
  }
  data() { return this.data } 
}
//  Loslager
class fix1 {
 constructor(data) {
   this.angle = data[3];
   this.name = data[1];
   // base points
   const coords = [
     [0, 0],
     [-a / 2, -0.8*a],
     [+a / 2, -0.8*a],
     [ - 0.8 * a, -0.8*a],
     [ + 0.8 * a, -0.8*a],
     [ - 0.8 * a, - 1*a],
     [ + 0.8 * a, - 1*a],
     [ 0, - 1.7*a]
   ];
   var p = [];
   var c;
   for (c of coords) {
     p.push(board.create('point', c, {visible: false}));
   };
   const t1 = board.create('transform', [data[3] * Math.PI / 180], { type: 'rotate' });
   t1.applyOnce(p);
   const t2 = board.create('transform', data[2], { type: 'translate' });
   t2.applyOnce(p);
   // dependent objects
   // pivot 
   this.p1 = board.create('point', [p[0].X(), p[0].Y()],{ name: '' });
   this.p1.setAttribute(nodeStyle);
   // label
   this.label=board.create('point', [p[7].X(), p[7].Y()], {name:"\\("+this.name+"\\)" ,size:0, label:{offset:[-6,-2]}});
   // body
   this.t = board.create('polygon', [p[0], p[1], p[2]], {name: '',fillColor: "white", Opacity: true, layer: 7,
     borders: {layer:8,strokeColor:normalStyle.strokeColor, strokeWidth:normalStyle.strokeWidth, lineCap:normalStyle.lineCap},
     vertices: { fixed: true, size: 0 }
   });
   // baseline with hatch
   this.bl = board.create('segment', [p[5],p[6]], {name: ''});
   this.bl.setAttribute(normalStyle);
   this.c = board.create("comb", [p[6],p[5]], { width: 0.25*a, frequency: 0.25*a, angle: 1 * Math.PI / 4, layer:8})
 }
 data() { return ["fix1", this.name, [this.p1.X(), this.p1.Y()], this.angle ] }
}
//  Festlager
class fix12 {
 constructor(data) {
   this.angle = data[3];
   this.name = data[1];
   // base points
   const coords = [
     [0, 0],
     [-a / 2, -a],
     [+a / 2, -a],
     [ - 0.8 * a, - a],
     [ + 0.8 * a, - a],
     [ 0, - 1.7*a] // label
   ];
   var p = [];
   var c;
   for (c of coords) {
     p.push(board.create('point', c, {visible: false}));
   };
   const t1 = board.create('transform', [data[3] * Math.PI / 180], { type: 'rotate' });
   t1.applyOnce(p);
   const t2 = board.create('transform', data[2], { type: 'translate' });
   t2.applyOnce(p);
   // dependent objects
   // pivot 
   this.p1 = board.create('point', [p[0].X(), p[0].Y()],{ name: "" });
   this.p1.setAttribute(nodeStyle);
   // label
   this.label=board.create('point', [p[5].X(), p[5].Y()], {name:"\\("+this.name+"\\)" ,size:0, label:{offset:[-6,-2]}});
   // body
   this.t = board.create('polygon', [p[0], p[1], p[2]], {name: '',fillColor: "white", Opacity: true, layer: 7,
     borders: {layer:8,strokeColor:normalStyle.strokeColor, strokeWidth:normalStyle.strokeWidth, lineCap:normalStyle.lineCap},
     vertices: { fixed: true, size: 0 }
   });
   // baseline with hatch
   this.bl = board.create('segment', [p[3],p[4]], {name: ''});
   this.bl.setAttribute(normalStyle);
   this.c = board.create("comb", [p[4],p[3]], {fixed: true, width: 0.25*a, frequency: 0.25*a, angle: 1 * Math.PI / 4, layer:8 })
 }
 data() { return ["fix12", this.name, [this.p1.X(), this.p1.Y()], this.angle ] }
}
//  Einspannung
class fix123 {
 constructor(data) {
   this.angle = data[3];
   this.name = data[1];
   // base points
   const coords = [
     [0,0],       // base point
     [0, -0.8*a], // p
     [0, +0.8*a], // p
     [-0.7*a,0]   // label
   ];
   var p = [];
   var c;
   for (c of coords) {
     p.push(board.create('point', c, {visible: false}));
   };
   const t1 = board.create('transform', [data[3] * Math.PI / 180], { type: 'rotate' });
   t1.applyOnce(p);
   const t2 = board.create('transform', data[2], { type: 'translate' });
   t2.applyOnce(p);
   // dependent objects
   // base point
   this.p1 = board.create('point', [p[0].X(), p[0].Y()],{visible:false, name: '' });
   // label
   this.label=board.create('point', [p[3].X(), p[3].Y()], {name:"\\("+this.name+"\\)" ,size:0, label:{offset:[-6,-2]}});
   // baseline with hatch
   this.bl = board.create('segment', [p[1],p[2]], {name: ''});
   this.bl.setAttribute(normalStyle);
   this.c = board.create("comb", [p[2],p[1]], { width: 0.25*a, frequency: 0.25*a, angle: -1 * Math.PI / 4, layer:8 })
 }
 data() { return ["fix123", this.name, [this.p1.X(), this.p1.Y()], this.angle ] }
}
//  Slider 
class fix13 {
 constructor(data) {
   this.angle = data[3];
   this.name = data[1];
   // base points
   const coords = [
     [0,0],       // base point
     [0, -0.5*a], // p
     [0, +0.5*a], // p
     [-0.2*a, -0.8*a], // p
     [-0.2*a, +0.8*a], // p
     [-0.9*a,0]   // label
   ];
   var p = [];
   var c;
   for (c of coords) {
     p.push(board.create('point', c, {visible: false}));
   };
   const t1 = board.create('transform', [data[3] * Math.PI / 180], { type: 'rotate' });
   t1.applyOnce(p);
   const t2 = board.create('transform', data[2], { type: 'translate' });
   t2.applyOnce(p);
   // dependent objects
   // base point
   this.p1 = board.create('point', [p[0].X(), p[0].Y()],{visible:false, name: '' });
   // label
   this.label=board.create('point', [p[5].X(), p[5].Y()], {name:"\\("+this.name+"\\)" ,size:0, label:{offset:[-6,-2]}});
   this.l = board.create('segment', [p[1],p[2]], {name: ''});
   this.l.setAttribute(normalStyle);
   this.bl = board.create('segment', [p[3],p[4]], {name: ''});
   this.bl.setAttribute(normalStyle);
   this.c = board.create("comb", [p[4],p[3]], { width: 0.25*a, frequency: 0.25*a, angle: -1 * Math.PI / 4, layer:8 })
 }
 data() { return ["fix13", this.name, [this.p1.X(), this.p1.Y()], this.angle ] }
}
// force vector
class force {
 constructor(data) {
   this.name = data[1];
   this.d = data;
   if (data.length ==5 ) {this.dist = data[4]} else {this.dist = 10};
   if (this.dist >= 0) {this.name1 = ""; this.name2 = "\\("+this.name+"\\)" } else
     {this.name2 = ""; this.name1 = "\\("+this.name+"\\)" }
   // Arrow
   this.p1 = board.create('point', data[2], {size: 0, name: this.name1,
     label:{offset:[-6,this.dist],color:'blue', autoPosition:true}});
   this.p2 = board.create('point', data[3], {size: 0, name: this.name2,
     label:{offset:[-6,this.dist],color:'blue', autoPosition:true} } );
   this.vec = board.create('arrow', [this.p1, this.p2], { touchLastPoint: true });
}
 data() { return this.d } 
}
// grid control object: [ "grid", "xlabel", "ylabel",  xmin, xmax, ymin, ymax, pix ]
class grid {
 constructor(data) {
   this.d = data;
   const xmin = data[3];
   const xmax = data[4];
   const ymin = data [5];
   const ymax = data [6];
   const pix = data [7];
   board.setBoundingBox([xmin, ymax, xmax, ymin ]);
   board.resizeContainer(pix*(xmax-xmin), pix*(ymax-ymin)); 
   a = 16/pix; 
   pxunit = 1/pix;
   labelshift = 0.2*a;
   
  
   if (data[1]) {  
   		var xaxis = board.create('axis', [[0, 0], [1,0]], 
		  	{name:'\\('+data[1]+'\\)', withLabel: true,
				label: {position: 'rt', offset: [-25, 20]} });
      }
   if (data[2]) {  
   		var yaxis = board.create('axis', [[0, 0], [0,1]], 
		  	{name:'\\('+data[2]+'\\)', withLabel: true,
				label: {position: 'rt', offset: [-20, 0]} });
      }
   }
 data(){
   return this.d;
 } 
}

// Text label
class label {
 constructor(data){
   this.name = data[1];
   if (data.length>3) {this.c = data[3]} else {this.c = "black"}
   this.p = board.create('point', data[2], {    
     name:this.name ,size:0, label:{offset:[0,0], color:this.c}} );
   this.d=data;
 }
 data(){ return this.d}
}
// line between along x and y data vectors with optional dash style and thickness
class line {
 constructor(data) {
   this.d = data;
   if (data.length<5) {this.dash = "-"} else {this.dash = data[4]}
   if (data.length<6) {this.th = 0.8 } else {this.th = data[5]}
   var d;
   switch (this.dash) {
     case "-": d = 0; break;
     case ".": d = 1; break;
     case "--": d = 2; break;
     case "-.": d = 6; break;
   }
   this.p = board.create('curve',[this.d[2],this.d[3]],
     { dash:d, strokeColor:'black', strokeWidth:this.th, layer:8}); 
 }
 data(){
   return this.d;
 } 
}
//  point mass [ "mass", [x,y],r, off]
class mass {
 constructor(data) {
   this.d = data;
   var r, off;
   if (data.length > 3) {r = data[3]} else {r = 4}
   if (data.length > 4) {off = data[4 ]} else {off = 11}
   // node
   this.p1 = board.create('point', data[2],  { 
     name: "\\("+data[1]+"\\)", 
     label:{autoPosition:true, offset:[off,0]}, 
     color:'black', size: r } );
 }
 data() { return this.d }
}
// Momentenpfeil
class moment {
 constructor(data) {
 this.name = data[1];
   this.p1 = board.create('point', data[2], { fixed:true, size:0 , name: '' });
   this.p2 = board.create('point', data[3], { fixed:true, size:0 , name: '' });
   this.p3 = board.create('point', data[4], {    
     name:"\\("+this.name+"\\)" ,size:0, label:{offset:[-6,0],color:'blue'}});
   this.arc = board.create('minorArc', [this.p1, this.p2, this.p3], {
     fixed: true, strokeWidth: 2, lastArrow: { type: 1, size: 5 } });
 }
 data() { return ["moment", this.p3.name, [this.p1.X(), this.p1.Y()], [this.p2.X(), this.p2.Y()], [this.p3.X(), this.p3.Y()] ] }
}
//  node with label
class node {
 constructor(data) {
   this.d = data;
   if (data.length > 3) {this.dist = data[3]} else {this.dist = 10};
   this.name = data[1];
   // node
   this.p1 = board.create('point', data[2],  {name: "\\("+this.name+"\\)", label:{autoPosition:true, offset:[0,this.dist]}} );
   this.p1.setAttribute(nodeStyle);
   // label
 }
 data() { return this.d }
}
//  point with label
class point {
 constructor(data) {
   this.d = data;
   if (data.length > 3) {this.dist = data[3]} else {this.dist = 10};
   this.name = data[1];
   // node
   this.p1 = board.create('point', data[2],  {name: "\\("+this.name+"\\)", label:{autoPosition:true, offset:[0,this.dist]}} );
   this.p1.setAttribute(pointStyle);
   // label
 }
 data() { return this.d }
}
// grau gefülltes Polygon mit schwarzem Rand. Z.B. für Scheiben oder Balken
class polygon {
 constructor(data){
   this.v = data.slice(2);
   data.shift();
   this.name = data.shift();
   this.p = board.create('polygon',this.v, {opacity: true, fillcolor:'lightgray', vertices:{size:0, fixed: true} ,borders: normalStyle } );
  }
 data(){
   return ['polygon', this.name, this.v];
 } 
}
// line load 
// line load perpendicular to the line
class q {
   constructor(data){
    this.c = data.slice(0,8); //Kopie der Punkte und q-Werte
    data.shift(); //"q" wird ausgeblendet
      this.name1 = data.shift();  this.name2 = data.shift(); 
    this.alpha = Math.atan2(data[1][1]-data[0][1],data[1][0]-data[0][0]); //Balkenneigung
    this.phi = data.pop()*Math.PI/180 //Abweichung zur Normalen
    this.width = Math.sqrt(Math.pow(data[0][1]-data[1][1],2)+Math.pow(data[0][0]-data[1][0],2)); //Länge der unteren Kante
    this.n = data[2];
    this.m = (data[3]-data[2])/this.width
    this.sin = [Math.sin(this.alpha+this.phi), Math.sin(this.alpha)]; 
    this.cos = [Math.cos(this.alpha+this.phi), Math.cos(this.alpha)];
    this.arrow = []; this.p = []; this.label = [];
     for (this.i=0;this.i<=(this.width/a);this.i++)
        {
        this.p.push([
                    0 /*this.i*this.width/Math.floor(this.width/a)*/,
                    this.m*((this.i)*this.width/Math.floor(this.width/a))+this.n
                    ]);
        this.p.push([0, 0]);
        for (this.j=0;this.j<=1;this.j++)
            {
             this.p[2*this.i+this.j] = [
                              this.p[2*this.i+this.j][0]*this.cos[this.j]-this.p[2*this.i+this.j][1]*this.sin[this.j]+data[0][0]+this.cos[1]*(this.i*this.width/Math.floor(this.width/a)),
                              this.p[2*this.i+this.j][0]*this.sin[this.j]+this.p[2*this.i+this.j][1]*this.cos[this.j]+data[0][1]+this.sin[1]*(this.i*this.width/Math.floor(this.width/a))
                             ]
            }
        this.arrow.push(board.create('arrow',
                    [
                     this.p[2*this.i], this.p[2*this.i+1]
                    ],
                    {lastarrow:{size:5}, fixed:true, strokewidth:1}));      
        }
    this.polygon = board.create('polygon',
        [
         this.p[0],this.p[1],this.p[this.p.length-1],this.p[this.p.length-2]
        ],{
                fillcolor:'blue', strokecolor:'blue', fixed:true,
                borders:{fixed:true},
              vertices:{visible:false} 
            });
    this.label.push(board.create('point',this.p[0],
        {
         name:'\\('+this.name1+'\\)', size:0, fixed:true,
         label:{autoPosition:true,offset:[10,10],color:'blue'}
        }));
    this.label.push(board.create('point',this.p[this.p.length-2],
        {
         name:'\\('+this.name2+'\\)', size:0, fixed:true,
         label:{autoPosition:true, offset:[10,10], color:'blue'}
        }));
   } 
   data(){ return this.c }
}
// rope, tangent line to two circles ["rope", "name",[x1,y1], r1, [x2,y2],r2 ]
// negative r values select the tangent point on the left side from the line p1-p2
class rope {
 constructor(data) {
   this.d = data;
   const dx = data[4][0]-data[2][0];
   const dy = data[4][1]-data[2][1];
   const a0 = Math.atan2(dy,dx);
   const le = Math.sqrt(dx**2+dy**2);
   const r1 = data[3];
   const r2 = data[5];
   const a1 = Math.acos((r1-r2)/le);
   this.l = board.create('segment', [
     [data[2][0]+Math.cos(a0-a1)*r1,data[2][1]+Math.sin(a0-a1)*r1 ],
     [data[4][0]+Math.cos(a0-a1)*r2,data[4][1]+Math.sin(a0-a1)*r2 ]], {name: data[1],
      layer: defaultMecLayer, withLabel:true, label:{offset:[0,8],autoPosition:true}});
   this.l.setAttribute(normalStyle);    
 }
 data() { return this.d }
}
//rot
class rot {
  constructor(data) {
  this.name = data[1];
    this.p1 = board.create('point', data[2], { fixed:true, size:0 , name: '' });
    this.p2 = board.create('point', data[3], { fixed:true, size:0 , name: '' }); 
    // label
    this.p3 = board.create('point', data[4], {    
      name:"\\("+this.name+"\\)" ,size:0, label:{offset:[0,0],color:'red'}});
    this.arc = board.create('minorArc', [this.p1, this.p2, this.p3], {
      fixed: true, strokeWidth: 1, lastArrow: { type: 1, size: 6 }, strokeColor:"red" });
    //this.arc.setAttribute({strokeColor:"red"});
  }
  data() { return ["rot", this.p3.name, [this.p1.X(), this.p1.Y()], [this.p2.X(), this.p2.Y()], [this.p3.X(), this.p3.Y()] ] }
}
// compressive spring, ["springc", "k", [x1,y1], [x2,y2], r, n, off]
class springc {
  constructor(data){
    this.d = data.slice(0); //make a copy
    var r;
    var x = this.d[2][0];
    var y =  this.d[2][1];
    var dx = (this.d[3][0]-x);
    var dy = (this.d[3][1]-y);
    var l = Math.sqrt(dx**2+dy**2);
    if (data.length >4 ) {r = data[4]} else {r = 6*pxunit};
    if (data.length >5 ) {this.n = data[5]*2+1} else {this.n = Math.ceil(l/(5*pxunit))};
    if (data.length >6 ) {this.off = data[6]} else {this.off = 14*pxunit};
    var c = r/l;
    // start point
    var px = [x-dy*c];
    var py = [y+dx*c];
    // intermediate points
    var j;
    for (j = 0; j < this.n+1; j++) {
      px.push(x+dx*j/this.n+dy*c*(-1)**j);
      py.push(y+dy*j/this.n-dx*c*(-1)**j);
    }
    // last point
    px.push(x+dx+dy*c,x+dx-dy*c);
    py.push(y+dy-dx*c,y+dy+dx*c);
    board.create('curve',[ px, py ], normalStyle );
    // label
    board.create('point',[x+dx/2-dy/l*this.off, y+dy/2+dx/l*this.off], {    
      name: "\\("+data[1]+"\\)" ,size:0, label:{offset:[0,0]}});
	// logging
    console.log("springc", data[1], data[2], data[3], r,  Math.floor(this.n/2), this.off);
  }
  data(){
    return this.d;
  } 
}
//tensile spring
// [ "springt", "name", [x1,y1], [x2,y2], r, proz, n, offset ]
class springt {
  constructor(data){
    // Parameter handling
    this.d = data.slice(0); //make a copy
    var x = this.d[2][0];
    var y =  this.d[2][1];
    var dx = (this.d[3][0]-x);
    var dy = (this.d[3][1]-y);
    var l = Math.sqrt(dx**2+dy**2);
    var r,pr;
    if (data.length >4 ) {r = data[4] } else {r = 6*pxunit}
    if (data.length >5 ) {pr = data[5] } else {pr = 20}
    if (data.length >6 ) {this.n = data[6]*2+1} else {this.n = Math.ceil(l*(1-pr/50)/(5*pxunit))}
    if (data.length >7 ) {this.off = data[7]} else {this.off = 14*pxunit}
    var c = r/l;
    // start point
    var xf=x+pr/100*dx;
    var yf=y+pr/100*dy;
    var dxf= dx - 2*pr/100*dx;
    var dyf= dy - 2*pr/100*dy;
    var cf=r/(l*(1-pr/50));
    var px = [x, xf];
    var py = [y, yf];
    // intermediate points
    var j;
    for (j = 1; j < this.n+1; j++) {
      px.push(xf+dxf*(j-0.5)/this.n+dyf*cf*(-1)**j);
      py.push(yf+dyf*(j-0.5)/this.n-dxf*cf*(-1)**j);
    }
    // last point
    px.push(xf+dxf, x+dx);
    py.push(yf+dyf, y+dy);
    board.create('curve',[ px, py ], normalStyle );
    // label
    board.create('point',[x+dx/2-dy/l*this.off, y+dy/2+dx/l*this.off], {    
      name: "\\("+data[1]+"\\)" ,size:0, label:{offset:[0,0]}});
	// logging
    console.log("springt", data[1], data[2], data[3], r, pr,  Math.floor(this.n/2), this.off);
  }
  data(){
    return this.d;
  } 
}

//  Wand
class wall {
 constructor(data) {
   this.d = data;
   // dependent objects
   this.bl = board.create('segment', [data[2],data[3]], {name: ''});
   this.bl.setAttribute(normalStyle);
   this.c = board.create("comb", [data[2],data[3]], { width: 0.25*a, frequency: 0.25*a, angle: data[4]* Math.PI / 180 })
 }
 data() { return this.d }
}
// initialization
var objects = [];
init();
function init() { 
 var m;
 for (m of state) {
   console.log(m);
   switch (m[0]) {
     case "angle": objects.push(new angle(m)); break;
     case "angle2": objects.push(new angle(m)); break;
     case "bar": objects.push(new bar(m)); break;
     case "beam": objects.push(new beam(m)); break;
     case "circle": objects.push(new circle(m)); break;
     case "dashpot": objects.push(new dashpot(m)); break;
     case "dim": objects.push(new dim(m)); break;
     case "dir": objects.push(new dir(m)); break;
     case "disp": objects.push(new disp(m)); break;
     case "fix1": objects.push(new fix1(m)); break;
     case "fix12": objects.push(new fix12(m)); break;
     case "fix123": objects.push(new fix123(m)); break;
     case "fix13": objects.push(new fix13(m)); break;
     case "force": objects.push(new force(m)); break
     case "grid": objects.push(new grid(m)); break
     case "label": objects.push(new label(m)); break
     case "line": objects.push(new line(m)); break
     case "mass": objects.push(new mass(m)); break;
     case "moment": objects.push(new moment(m)); break;
     case "node": objects.push(new node(m)); break;
     case "point": objects.push(new point(m)); break;
     case "polygon": objects.push(new polygon(m)); break;
     case "q": objects.push(new q(m)); break;      
     case "rope": objects.push(new rope(m)); break;
     case "rot": objects.push(new rot(m)); break;
     case "springc": objects.push(new springc(m)); break;
     case "springt": objects.push(new springt(m)); break;
     case "wall": objects.push(new wall(m)); break;
   }
 }
}
//## end of chunk 2
[[/jsxgraph]]