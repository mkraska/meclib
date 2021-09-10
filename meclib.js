// Meclib version 2021 09 10 https://jsfiddle.net/Lotbzdv9/4/

JXG.Options.point.snapToGrid = false; // grid snap spoils rotated static objects
JXG.Options.point.snapSizeX = 0.1;
JXG.Options.point.snapSizeY = 0.1;
JXG.Options.point.fixed = true; // this is for static objects
JXG.Options.text.useMathJax = true;
JXG.Options.label.useMathJax = true;
JXG.Options.label.offset = [0, 0];
JXG.Options.label.anchorY = 'middle';
JXG.Options.curve.highlight = false;
JXG.Options.label.highlight = false;
JXG.Options.circle.highlight = false;
JXG.Options.line.highlight = false;
JXG.Options.polygon.highlight = false;
JXG.Options.polygon.borders.highlight = false;
JXG.Options.point.highlight = false;
var a = 0.4; //compute this to match font size (grid-independent)
var pxunit = 1/40;
var labelshift = 0.2 * a;
// Style for nodes (supports, bars)
const nodeStyle = { fillcolor: 'white', strokeColor: 'black', size: 2, strokeWidth: 1.5 }; 
const pointStyle = { fillcolor: 'black', strokeColor: 'black', size: 1, strokeWidth: 1 };
// Style for bars
const barStyle = { strokewidth: 4, strokecolor: "black" };
// Set some linestyles
const normalStyle = { strokeWidth: 2, strokeColor: 'black', lineCap: 'round' };
const thinStyle = { strokeWidth: 1, strokeColor: 'black', lineCap: 'round' };
const defaultMecLayer = 6;
const inactiveColor = "gray";

const board = JXG.JSXGraph.initBoard(divid, {
  boundingbox: [-5, 5, 5, -5], //default values, use "grid" to customize
  axis: false, grid:true, showNavigation:false, showCopyright:true
});

var state;
var stateInput;
// make infobox optionally relative to a given point (define p.ref to [xref, yref])
board.highlightInfobox = function(x, y , el) {
    var ref = [0,0];
    var scale = [1,1];
    var dp = [1,1];
    var lbl = '';
    if (typeof (el.ref) == 'function') {ref = el.ref()} 
    else if (typeof(el.ref) != 'undefined') {ref = el.ref()}
    if (typeof (el.scale) != 'undefined') {scale = el.scale}
    if (typeof (el.dp) != 'undefined') {dp = el.dp}
    if (typeof (el.infoboxlabel) == 'string') {lbl = el.infoboxlabel}
    this.infobox.setText( 
        lbl+'('+((parseFloat(x)-ref[0])*scale[0]).toFixed(dp[0]) + ', ' + ((parseFloat(y)-ref[1])*scale[1]).toFixed(dp[1])+ ')')
};
// angular dimension with a single or double arrow (handles arrow, arrow1 and arrow2)
class angle {
 constructor(data) {
   this.d = data.slice(0); //copy
   // base line
   this.p1 = board.create('point',data[2],{withlabel:false,visible:false});
   this.p2 = board.create('point',data[3],{withlabel:false,visible:false});
   this.line = board.create('segment', [this.p1, this.p2], {withlabel:false}); 
   this.line.setAttribute(thinStyle);
   // second line
   const a0 = this.line.getAngle();
   const le = this.line.L();
   const a1 = a0+Math.PI/180*data[5];
   //console.log(a0*180/Math.PI, a1*180/Math.PI);
   this.p3 = board.create('point',
     [this.p1.X()+le*Math.cos(a1), this.p1.Y()+le*Math.sin(a1)],
     {withlabel:false,visible:false});
   this.l2 = board.create('segment', [this.p1, this.p3], {withlabel:false});
   this.l2.setAttribute(thinStyle);
   // arc with arrows
   this.p4 = board.create('point',
     [this.p1.X()+data[4]*Math.cos(a0), this.p1.Y()+data[4]*Math.sin(a0)],
     {withlabel:false,visible:false});
   this.arc = board.create('minorArc', [this.p1, this.p4, this.p3], 
     {firstArrow: {type: 7, size: 5}, lastArrow: {type: 7, size: 5} ,firstArrow:false, lastArrow:false} );
   this.arc.setAttribute(thinStyle);
   if (data[0] == "angle1" )
     {  this.arc.setAttribute({lastArrow:true})}
   if (data[0] == "angle2" )
     {  this.arc.setAttribute({firstArrow:true} );
        this.arc.setAttribute({lastArrow:true} )
 } 
   // label
   const al = (a0+a1)/2; // angular position of label
   if (data[1] == ".") {
     const rl = data[4]*0.6;
     this.p5 = board.create('point',
       [this.p1.X()+rl*Math.cos(al), this.p1.Y()+rl*Math.sin(al)],
       {name:"" ,fillcolor:'black',strokeColor:'black',size:0.5, strokeWidth:0}); 
   }
   else {
     const rl = data[4]+10*pxunit;
     this.p5 = board.create('point',
       [this.p1.X()+rl*Math.cos(al), this.p1.Y()+rl*Math.sin(al)],
       {name:"\\("+data[1]+"\\)" ,size:0, label:{offset:[-6,0]}}); 
   }
 }
 data() { return this.d }
 name() { return '"'+this.d[1]+'"' }
}
// Fachwerkstab
class bar {
 constructor(data) {
   if (typeof(data[data.length-1]) == 'string') {this.state = data.pop()}
     else {this.state = "locked"}
   this.d = data.slice(0);
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
     0.5*(this.p1.Y()+this.p2.Y())+Math.sin(alpha)*0.5*a, data[1] ], {
     anchorX:'middle', anchorY:'middle', highlight:false
   });
    // implement state switching
    this.obj = [ this.p1, this.p2, this.line, this.label ];
    // state init
    if (this.state == "show") { show(this) }
    if (this.state == "hide") { hide(this) }
    if (this.state == "locked") { lock(this) }
    //switch by doubleclick
    this.line.parent = this;
    this.line.lastclick = Date.now();    
    this.line.on('up', function() {
      if (Date.now()-this.lastclick < 500) { Switch(this.parent) }
      else {this.lastclick = Date.now() }})
  }
  data(){ var a = this.d.slice(0); a.push(this.state); return a}
  name(){ return '"'+this.state+'"' } 
}

// Rectangle with centerline given by pair of points. Even number of points generates multiple rectangles which are merged if they overlap.
// [ "beam", "color", [x1,y1], [x2,y2] ..., radius, state ]
class beam {
 constructor(data){
   if (typeof(data[data.length-1]) == 'string') {this.state = data.pop()}
     else {this.state = "locked"}
   this.d = data.slice(0); //make a copy
   this.r = data.pop(); // radius
   data.shift(); // drop the type string
   if (typeof data[1] === 'string') {
     this.col = [data.shift(),data.shift()]; //droping the attributes for fillcolor and gradientcolor into an array
   } else {
     this.col = [ 'lightgrey', 'lightgrey']; data.shift(); // drop the name and use default uniform color
   }
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
    // implement state switching
    this.obj = [ this.b ];
    // state init
    if (this.state == "show") { show(this) }
    if (this.state == "hide") { hide(this) }
    if (this.state == "locked") { lock(this) }
        //switch by doubleclick
    this.b.parent = this;
    this.b.lastclick = Date.now();    
    this.b.on('up', function() {
      if (Date.now()-this.lastclick < 500) { Switch(this.parent) }
      else {this.lastclick = Date.now() }})

  }
  data(){ var a = this.d.slice(0); a.push(this.state); return a}
  name(){ return '"'+this.state+'"' } 
}
// Circle with centerpoint, point on perimeter, optional: use name as radius indicator
class circle {
  constructor(data){
    this.d = data.slice(0); //make a copy
    data.shift(); // drop the type string
    data.shift(); // drop the name string
    this.angle = data.pop()*Math.PI/180; // pop the angle for the label
    // circle
    this.c = board.create('circle', data, {opacity: true, fillcolor:'lightgray', 
         strokeWidth: normalStyle.strokeWidth, 
         strokeColor: normalStyle.strokeColor});
    // arrow and label if name is not empty
    if (data[1] != '') {
      const dx = Math.cos(this.angle);
      const dy = Math.sin(this.angle);
      var dir = 1;
      if (this.angle < 0) {dir = -1}
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
      {name:"\\("+data[1]+"\\)" ,size:0, label:{offset:[-6,0]}}); 
    }
  }
  data(){ return this.d } 
  name(){ return '"'+this.d[1]+'"' } 
}

//[ "circle2P", "<label1>","<label2>", [x1,y1],[x2,y2], f ]//
class circle2p {
  constructor(data){
    this.d = data.slice(0); //make a copy
    this.f = data[5];
    console.log([data[3][0]/this.f,data[3][1]/this.f]);
    // x-axis for intersection points
    this.xaxis = board.create('line', [ [0, 0], [1, 0] ], { visible: false }); 
    // circle
    this.A = board.create('point', [data[3][0]/this.f,data[3][1]/this.f], { name: data[1], fixed:false, label:{offset:[5,5]}}); 
	  this.AS = board.create('point', [data[4][0]/this.f,data[4][1]/this.f], { name: data[2], fixed:false, label:{offset:[5,5]} }); 
    this.MSK1 = board.create('semicircle', [this.A, this.AS]); 
    this.MSK2 = board.create('semicircle', [this.AS, this.A]); 
    this.int1 = board.create('intersection', [this.MSK1, this.xaxis], { visible: true, size: 0 , label:{visible:false} });
	  this.int2 = board.create('intersection', [this.MSK2, this.xaxis], { visible: true, size: 0 , label:{visible:false} }); 
    for (var pt of [this.A, this.AS, this.int1, this.int2]) {
    	pt.scale = [this.f,this.f] }
  }
  data(){ return [this.d[0], this.d[1], this.d[2], [this.A.X()*this.f,this.A.Y()*this.f],[this.AS.X()*this.f,this.AS.Y()*this.f], this.f] } 
  name(){ return "[["+this.data()[3].toString() + "],[" + this.data()[4].toString() + "]]" } 
}
// crosshair for reading off co-ordinates from graphs
// [ "crosshair", "", [x0, y0], [xref, yref], [xscale, yscale], [dpx, dpy] ]
class crosshair {
  constructor(data) {
    this.d = data;
    const f = 2, r = 7;
    const pp =  {size:0, name:'', fixed:false, snapToGrid:false, showInfobox:false};
    this.p = board.create('point', data[2], {
      name: '', fixed:false, size:r, fillOpacity:0, highlightFillOpacity:0, strokeWidth:1, color:"blue", snapToGrid:false
    });
    // set properties of infobox
    if (data[3]) { this.p.ref = data[3] }
    if (data[4]) { this.p.scale = data[4] }
    if (data[5]) { this.p.dp = data[5] }
    console.log(this.p.dp);
    
    this.p1 = board.create('point', plus(data[2],[-f*r*pxunit,0]),pp);
    this.p2 = board.create('point', plus(data[2],[+f*r*pxunit,0]), pp);   
    this.h = board.create('segment',  [this.p1, this.p2], {strokeWidth:1});
    this.p3 = board.create('point', plus(data[2],[0,-f*r*pxunit]), pp);
    this.p4 = board.create('point', plus(data[2],[0,+f*r*pxunit]), pp);   
    this.v = board.create('segment',  [this.p3, this.p4], {strokeWidth:1});
    board.create('group', [this.p, this.p1, this.p2, this.h, this.p3, this.p4, this.v] );
  }
  data() { var d = this.d; d[2] = [this.p.X(), this.p.Y()]; return d } 
  name() { return "0" }
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
  name() { '"'+this.d[1]+'"' }
  data() { return this.d } 
}
// linear dimension ["dim", "name", [x1,y1], [x2,y2], d]
class dim {
 constructor(data) {
   this.d = data;  
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
     {name:"\\("+data[1]+"\\)" ,size:0, label:{offset:[-6,0]}});   
 }
 data() { return this.d }
 name() { return '"'+this.d[1]+'"' }
}

// co-ordinate arrow with arrow with label 
// ["dir", "name", [x1,y1], angle]
// ["dir", "name", [x1,y1], angle, offset]
// ["dir", "name", [x1,y1], angle, offset, length]
class dir {
 constructor(data) {
   this.label = data[1];
   this.d =data;
   var le = 24*pxunit;
   if (data.length >=5 ) {this.dist = data[4] } else {this.dist = 10}
   if (data.length >=6 ) { le = data[5] }
   if (this.dist >= 0) {this.name1 = ""; this.name2 = "\\("+this.label+"\\)" } else
     {this.name2 = ""; this.name1 = "\\("+this.label+"\\)" }
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
 };
 data() { return this.d }; 
 name() { return '"'+this.d[1]+'"' };
}
//co-ordinate arrow with red arrow with label 
// [ "disp", "name", [x,y], angle, offset, length]
class disp {
  constructor(data) {
    this.d = data.slice(9);
    var le = 24*pxunit;
    if (data.length >=5 ) {this.dist = data[4] } else {this.dist = 10};
    if (data.length >=6 ) { le = data[5] }
    if (this.dist >= 0) {this.name1 = ""; this.name2 = "\\("+data[1]+"\\)" } else
      {this.name2 = ""; this.name1 = "\\("+data[1]+"\\)" }
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
  data() { return this.d } 
  name() { return '"'+this.d[1]+'"' }
}
//  Loslager
class fix1 {
  constructor(data) {
    if (typeof(data[data.length-1]) == 'string') {this.state = data.pop()}
      else {this.state = "locked"}
    this.d = data.slice(0);
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
      p.push(board.create('point', c, {visible: false, snapToGrid:false}));
    };
    const t1 = board.create('transform', [data[3] * Math.PI / 180], { type: 'rotate' });
    t1.applyOnce(p);
    const t2 = board.create('transform', data[2], { type: 'translate' });
    t2.applyOnce(p);
    // dependent objects
    // pivot 
    this.p1 = board.create('point', [p[0].X(), p[0].Y()],{ name: '', highlight:false });
    this.p1.setAttribute(nodeStyle);
    // label
    this.label=board.create('point', [p[7].X(), p[7].Y()], {name:"\\("+data[1]+"\\)" ,size:0, label:{offset:[-6,-2], highlight:false}});
    // body
    this.t = board.create('polygon', [p[0], p[1], p[2]], {name: '',fillColor: "white", Opacity: true, layer: 7,
      borders: {visible: false}, vertices: { fixed: true, size: 0 } });
    this.tb = board.create('curve', [[p[0].X(), p[1].X(), p[2].X(), p[0].X()], 
      [p[0].Y(), p[1].Y(), p[2].Y(), p[0].Y()]],{layer:8,strokeColor:normalStyle.strokeColor, strokeWidth:normalStyle.strokeWidth, lineCap:normalStyle.lineCap} )
    // baseline with hatch
    this.bl = board.create('segment', [p[5],p[6]], {name: '', highlight:false});
    this.bl.setAttribute(normalStyle);
    this.c = board.create("comb", [p[6],p[5]], { width: 0.25*a, frequency: 0.25*a, angle: 1 * Math.PI / 4, layer:8, highlight:false})
    // implement state switching
    this.obj = [ this.p1, this.t, this.bl, this.c, this.label, this.label.label, this.tb ];
    // state init
    if (this.state == "show") { show(this) }
    if (this.state == "hide") { hide(this) }
    //switch by doubleclick
    this.t.parent = this;
    this.t.lastclick = Date.now();    
    this.t.on('up', function() {
      if (Date.now()-this.lastclick < 500) { Switch(this.parent) }
      else {this.lastclick = Date.now() }})
  }
  data(){ var a = this.d.slice(0); a.push(this.state); return a}
  name(){ return '"'+this.state+'"' } 
}
//  Festlager
class fix12 {
  constructor(data) {    
    if (typeof(data[data.length-1]) == 'string') {this.state = data.pop()}
      else {this.state = "locked"}
    this.d = data.slice(0);
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
    for (c of coords) { p.push(board.create('point', c, {visible: false, snapToGrid:false})) }
    const t1 = board.create('transform', [data[3] * Math.PI / 180], { type: 'rotate' });
    t1.applyOnce(p);
    const t2 = board.create('transform', data[2], { type: 'translate' });
    t2.applyOnce(p);
    // dependent objects
    // pivot 
    this.p1 = board.create('point', [p[0].X(), p[0].Y()],{ name: "", highlight:false });
    this.p1.setAttribute(nodeStyle);
    // label
    this.label=board.create('point', [p[5].X(), p[5].Y()], 
      {name:"\\("+data[1]+"\\)", highlight:false ,size:0, 
      label:{offset:[-6,-2], highlight:false}});
    // body
    this.t = board.create('polygon', [p[0], p[1], p[2]], {name: '',fillColor: "white", Opacity: true, layer: 7, borders:{visible:false},
      vertices: { fixed: true, size: 0 } });
    this.tb = board.create('curve', [[p[0].X(), p[1].X(), p[2].X(), p[0].X()], 
      [p[0].Y(), p[1].Y(), p[2].Y(), p[0].Y()]],
      {layer:8,strokeColor:normalStyle.strokeColor, highlight:false, 
      strokeWidth:normalStyle.strokeWidth, lineCap:normalStyle.lineCap} )
    // baseline with hatch
    this.bl = board.create('segment', [p[3],p[4]], {name: '', highlight:false});
    this.bl.setAttribute(normalStyle);
    this.c = board.create("comb", [p[4],p[3]], {fixed: true, width: 0.25*a, frequency: 0.25*a, angle: 1 * Math.PI / 4, layer:8, highlight:false })
    // implement state switching
    this.obj = [ this.p1, this.t, this.bl, this.c, this.label, this.label.label, this.tb ];
    // state init
    if (this.state == "show") { show(this) }
    if (this.state == "hide") { hide(this) }
    //switch by doubleclick
    this.t.parent = this;
    this.t.lastclick = Date.now();    
    this.t.on('up', function() {
      if (Date.now()-this.lastclick < 500) { Switch(this.parent) }
      else {this.lastclick = Date.now() }})
  }
  data(){ var a = this.d.slice(0); a.push(this.state); return a}
  name(){ return '"'+this.state+'"' } 
}
//  Einspannung
class fix123 {
  constructor(data) {    
    if (typeof(data[data.length-1]) == 'string') {this.state = data.pop()}
      else {this.state = "locked"}
    this.d = data.slice(0);
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
      p.push(board.create('point', c, {visible: false, snapToGrid:false}));
    }
    const t1 = board.create('transform', [data[3] * Math.PI / 180], { type: 'rotate' });
    t1.applyOnce(p);
    const t2 = board.create('transform', data[2], { type: 'translate' });
    t2.applyOnce(p);
    // dependent objects
    // base point
    this.p1 = board.create('point', [p[0].X(), p[0].Y()],{size:0, name: '', highlight:false });
    // label
    this.label=board.create('point', [p[3].X(), p[3].Y()], {name:"\\("+data[1]+"\\)" ,size:0,highlight:false, label:{offset:[-6,-2], highlight:false}});
    // baseline with hatch
    this.bl = board.create('segment', [p[1],p[2]], {name: ''});
    this.bl.setAttribute(normalStyle);
    this.c = board.create("comb", [p[2],p[1]], { width: 0.25*a, frequency: 0.25*a, angle: -1 * Math.PI / 4, layer:8, highlight:false })
    // implement state switching
    this.obj = [ this.p1, this.bl, this.c, this.label, this.label.label ];
    // state init
    if (this.state == "show") { show(this) }
    if (this.state == "hide") { hide(this) }
    //switch by doubleclick
    this.bl.parent = this;
    this.bl.lastclick = Date.now();    
    this.bl.on('up', function() {
      if (Date.now()-this.lastclick < 500) { Switch(this.parent) }
      else {this.lastclick = Date.now() }})
  }
  data(){ var a = this.d.slice(0); a.push(this.state); return a}
  name(){ return '"'+this.state+'"' } 
}
//  Slider 
class fix13 {
 constructor(data) {
    if (typeof(data[data.length-1]) == 'string') {this.state = data.pop()}
      else {this.state = "locked"}
    this.d = data.slice(0);
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
      p.push(board.create('point', c, {visible: false, snapToGrid:false}));
    };
    const t1 = board.create('transform', [data[3] * Math.PI / 180], { type: 'rotate' });
    t1.applyOnce(p);
    const t2 = board.create('transform', data[2], { type: 'translate' });
    t2.applyOnce(p);
    // dependent objects
    // base point
    this.p1 = board.create('point', [p[0].X(), p[0].Y()],{size:0, name: '' });
    // label
    this.label=board.create('point', [p[5].X(), p[5].Y()], {name:"\\("+data[1]+"\\)" ,size:0, label:{offset:[-6,-2], highlight:false}});
    this.l = board.create('segment', [p[1],p[2]], {name: '',highlight:false});
    this.l.setAttribute(normalStyle);
    this.bl = board.create('segment', [p[3],p[4]], {name: ''});
    this.bl.setAttribute(normalStyle);
    this.c = board.create("comb", [p[4],p[3]], { width: 0.25*a, frequency: 0.25*a, angle: -1 * Math.PI / 4, layer:8, highlight:false })
    // implement state switching
    this.obj = [ this.p1, this.l, this.bl, this.c, this.label, this.label.label ];
    // state init
    if (this.state == "show") { show(this) }
    if (this.state == "hide") { hide(this) }
    //switch by doubleclick
    this.bl.parent = this;
    this.bl.lastclick = Date.now();    
    this.bl.on('up', function() {
      if (Date.now()-this.lastclick < 500) { Switch(this.parent) }
      else {this.lastclick = Date.now() }})
  }
  data(){ var a = this.d.slice(0); a.push(this.state); return a}
  name(){ return '"'+this.state+'"' } 
}
// [ "force", "name", [x1, y1], [x2,y2], d , state ]
class force {
  constructor(data) {
    this.d = data;
    this.fname = data[1];
    var fix = true, size = 0; 
    if (data[4]) { this.off = data[4] } else { this.off = 10 }
    const labelopts = {offset:[this.off,0], autoPosition:true, color:'blue'};
    if (this.off >= 0) {this.name1 = ""; this.name2 = "\\("+this.fname+"\\)" } else
      {this.name2 = ""; this.name1 = "\\("+this.fname+"\\)" }
    if (data[5]) { this.state = data[5] } else { this.state = "locked" }
    if (this.state == "active") {fix = false; size = 2} 
    this.p1 = board.create('point', data[2], { 
      name: this.name1, fixed:fix, size: size, label:labelopts  }); 
    this.p2 = board.create('point', data[3], {
      name: this.name2, fixed:fix, size: size, label:labelopts });
    this.p2.start = this.p1;
    this.p2.ref = function() { return [this.start.X(), this.start.Y()] };
    this.p2.infoboxlabel = "Vektor ";
    this.vec = board.create('arrow', [this.p1, this.p2], {
      touchLastPoint: true, fixed:false, lastArrow:{size:5, type:2} });
    this.vec.obj = [this.vec, this.p1, this.p2];
    this.vec.num = objects.length;   
    this.vec.on("up", function(e) { 
      if (isOutside(this.point1) || isOutside(this.point2) ) {
        objects[this.num].d[0] = "deleted";
        board.removeObject(this.obj, true) 
      } })
    // switch off highlighting if locked
    this.obj = [this.vec, this.p1, this.p2, this.p2.label];
    if (this.state == "locked") { lock(this) } 
      }
  data() {  return [this.d[0], this.fname, 
    [this.p1.X(), this.p1.Y()], [this.p2.X(), this.p2.Y()], this.off, this.state ] }
  name() { return this.fname.replace(/\s+/,"*") }
}
// [ "forceGen", "name", [x,y]]
class forceGen {
  constructor(data) {
    // input field
    this.d = data;
    const dy = -20*pxunit, dx = 40*pxunit;
    // HTML trick because input.set() doesn't work in the callback
    var t = board.create('text', [ data[2][0], data[2][1], 
      '<input type="text" id="fname" value="'+data[1]+'" size="1">'], {fixed: true});
    // ref point for checking drag distance
    const ref1 = board.create('point', plus(data[2], [0,dy]), {visible:false});
    const ref2 = board.create('point', plus(data[2], [dx,dy]), {visible:false});
    // arrow
    const p1 = board.create('point', plus(data[2], [0,dy]), { 
      name: '', fixed:false, visible: false });
    const p2 = board.create('point', plus(data[2], [dx,dy]), {
      name: '\\('+document.getElementById("fname").value+'\\)', fixed:false, visible:false, label:{offset:[5,0], visible:true, color:'gray'} });
    p2.addParents(t);
    var vec = board.create('arrow', [p1, p2], 
      { fixed:false, color:'gray',lastArrow:{size:5, type:2} } );
    // callback creates new force object and new name
    t.on('out', function(e) {
      p2.setAttribute({name:'\\('+document.getElementById("fname").value+'\\)'})});
    vec.on('up', function(e) {
      //only generate force if distance is sufficient to not create overlapping objects
      if (ref1.Dist(this.point1)+ref2.Dist(this.point2) >dx) {
      	objects.push(new force(["force", 
          document.getElementById("fname").value, 
          [p1.X(), p1.Y()], [p2.X(), p2.Y()], 10, "active"] ));
        // generate new unique force name
        var f = [];
        for (var m of objects) {
          if (m.data()[0] == 'force') { f = f.concat(m.data()[1]) } }
        var i = 1, n = '', found = true;
        while (found ) { n = 'F_'+i.toString();  found = f.includes(n);i ++;} 
        document.getElementById("fname").value = n;
      }
      // whatever happened, move the arrow back
      p1.setPositionDirectly(JXG.COORDS_BY_USER, [ref1.X(), ref1.Y()],[p1.X(), p1.Y()] );       p2.setPositionDirectly(JXG.COORDS_BY_USER, [ref2.X(), ref2.Y()],[p2.X(), p2.Y()] );
      p2.setAttribute({name:'\\('+document.getElementById("fname").value+'\\)'}) });
    }
  data(){  return this.d }
  name(){  return "0" }
}

// grid control object: [ "grid", "xlabel", "ylabel",  xmin, xmax, ymin, ymax, pix ]
// grid control object: [ "grid", "xlabel", "ylabel",  xmin, xmax, ymin, ymax, pix, [fx, fy] ]
class grid {
 constructor(data) {
   this.d = data;
   const xmin = data[3];
   const xmax = data[4];
   const ymin = data [5];
   const ymax = data [6];
   const pix = data [7];
   var fx = 1, fy = 1;
   if (data[8]) {fx = data[8][0]; fy = data[8][1]};
   board.setBoundingBox([xmin, ymax, xmax, ymin ]);
   board.resizeContainer(pix*(xmax-xmin), pix*(ymax-ymin)); 
   a = 16/pix; 
   pxunit = 1/pix;
   labelshift = 0.2*a;
   //if (data[1] || data[2]) {board.removeGrids()};
   if (data[1]) { 
   		var xaxis = board.create('axis', [[0, 0], [1,0]], 
		  	{name:'\\('+data[1]+'\\)', withLabel: true,
				label: {position: 'rt', offset: [-5, 12], anchorX:'right'},
        ticks: {generateLabelValue:function(p1,p2) {return (p1.usrCoords[1]-p2.usrCoords[1])*fx}} });
      }
   if (data[2]) {  
   		var yaxis = board.create('axis', [[0, 0], [0,1]], 
		  	{name:'\\('+data[2]+'\\)', withLabel: true,
				label: {position: 'rt', offset: [-20, 0]},
        ticks: {generateLabelValue:function(p1,p2) {return (p1.usrCoords[2]-p2.usrCoords[2])*fy}} });    
      }   
   }
 data(){  return this.d }
 name(){  return "0" }
}
// Text label
class label {
  constructor(data){
    if (data[3]) {this.c = data[3]} else {this.c = "black"}
    this.p = board.create('point', data[2], {    
      name:data[1] ,size:0, label:{offset:[0,0], color:this.c}} );
    this.d=data;
  }
  data(){ return this.d }
  name(){  return "0" }
}

// line between along x and y data vectors with optional dash style and thickness
// [ "line", "name", [x1, x2,...], [y1, y2,...] ,dash, th ]
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
 data(){ return this.d }
 name(){  return "0" }
}
//[ "line2P", "label", [x1,y1],[x2,y2], f ]//
class line2p {
  constructor(data){
    this.d = data.slice(0); //make a copy
    this.f = data[4];
    this.p1 = board.create('point', [data[2][0]/this.f,data[2][1]/this.f], { 
    	label:{visible:false}, snaptopoints: true, attractorDistance: 0.2, fixed:false }); 
    this.p2 = board.create('point', [data[3][0]/this.f,data[3][1]/this.f], { 
    	label:{visible:false}, snaptopoints: true, attractorDistance: 0.2, fixed:false }); 
    this.g = board.create('line', [this.p1, this.p2], { 
    strokecolor: 'green', name:data[1],withLabel:true,label:{offset:[10,0]}});
       for (var pt of [this.p1, this.p2]) {	pt.scale = [this.f,this.f] }
  }
  data(){ return [this.d[0], this.d[1], [this.p1.X()*this.f,this.p1.Y()*this.f],[this.p2.X()*this.f,this.p2.Y()*this.f], this.f] } 
  name(){ return "[["+this.data()[2].toString() + "],[" + this.data()[3].toString() + "]]" } 
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
  name(){  return "0" }
}
class moment {
  constructor(data) {
    this.d = data;
    this.mname = data[1];
    var fix = true, size = 0; 
    if (data[5]) { this.state = data[5] } else { this.state = "locked" }
    if (this.state == "active") {fix = false; size = 2} 
    this.p1 = board.create('point', data[2], {
      name: '', fixed:fix, size:size });
    this.p2 = board.create('point', data[3], {
      name: '', fixed:fix, size:size });
    this.p3 = board.create('point', data[4], {
      name: "\\("+this.mname+"\\)", fixed:fix, size:size, 
      label:{offset:[10,0], autoPosition:true, color:'blue'} });
    this.arc = board.create('minorArc', [this.p1, this.p2, this.p3], {
      fixed: fix, strokeWidth: 2, lastArrow: {type: 2, size: 5
      } });
    var g = board.create('group', [this.p1, this.p2, this.p3, this.arc]);
    g.removeTranslationPoint(this.p2);
    g.removeTranslationPoint(this.p3);
    this.arc.obj = [this.arc, this.p1, this.p2, this.p3 ];
    this.arc.num = objects.length;
    this.arc.on("up", function(e) { 
      if (isOutside(this.obj[1]) || isOutside(this.obj[2]) || isOutside(this.obj[3]) ) {
        objects[this.num].d[0] = "deleted";
        board.removeObject(this.obj, true) 
      } })
        // switch off highlighting if locked
    this.obj = [this.p1, this.p2, this.p3, this.arc,this.p3.label];
    if (this.state == "locked") { lock(this) } 

  }
  data() { return [this.d[0], this.mname,  [this.p1.X(), this.p1.Y()], [this.p2.X(), this.p2.Y()], [this.p3.X(), this.p3.Y()], this.state ]  }
  name() {return this.mname.replace(/\s+/,"*") }
}
// [ "momentGen", "name", [x,y]]
class momentGen {
  constructor(data) {
    // input field
    this.d = data;
    const dy = -5*pxunit, dx = 15*pxunit, dy1 = -20*pxunit;
    // HTML trick because input.set() doesn't work in the callback
    var t = board.create('text', [ data[2][0], data[2][1], 
      '<input type="text" id="mname" value="'+data[1]+'" size="1">'], {fixed: true});
    // ref point for checking drag distance and for position reset
    const ref1 = board.create('point', plus(data[2], [dx,dy]), {visible:false});
    const ref2 = board.create('point', plus(data[2], [0,dy1]), {visible:false});
    const ref3 = board.create('point', plus(data[2], [2*dx,dy1]), {visible:false});
    // arrow
    const p1 = board.create('point', plus(data[2], [dx,dy]), { 
      name: '', fixed:false, visible: false });
    const p2 = board.create('point', plus(data[2], [0,dy1]), { 
      name: '', fixed:false, visible: false });
    const p3 = board.create('point', plus(data[2], [2*dx,dy1]), {
      name: '\\('+document.getElementById("mname").value+'\\)', fixed:false, visible:false, label:{offset:[5,0], visible:true, color:'gray'} });
    p2.addParents(t);
    var arc = board.create('minorArc', [p1, p2, p3], { fixed:false, strokeColor:'gray',
      strokeWidth: 2, lastArrow: { type: 2, size: 5}});
    // callback creates new moment object and new name
    t.on('out', function(e) {
      p3.setAttribute({name:'\\('+document.getElementById("mname").value+'\\)'})});
    arc.on('up', function(e) {
      //only generate force if distance is sufficient to not create overlapping objects
      if (ref2.Dist(p2) >dx) {
        objects.push(new moment(["moment", 
          document.getElementById("mname").value, 
          [p1.X(), p1.Y()], [p2.X(), p2.Y()], [p3.X(), p3.Y()], "active"] ));
        // generate new unique moment name
        var f = [];
        for (var m of objects) {
          if (m.data()[0] == 'moment') { f = f.concat(m.data()[1]) } }
        console.log(f);
        var i = 1, n = '', found = true;
        while (found ) { n = 'M_'+i.toString();  found = f.includes(n);i ++;} 
        document.getElementById("mname").value = n;
      }
      // whatever happened, move the arc back
      p1.setPositionDirectly(JXG.COORDS_BY_USER, [ref1.X(), ref1.Y()],[p1.X(), p1.Y()] );       p2.setPositionDirectly(JXG.COORDS_BY_USER, [ref2.X(), ref2.Y()],[p2.X(), p2.Y()] );
      p3.setPositionDirectly(JXG.COORDS_BY_USER, [ref3.X(), ref3.Y()],[p3.X(), p3.Y()] );
      p3.setAttribute({name:'\\('+document.getElementById("mname").value+'\\)'}) });
    }
  data(){  return this.d }
  name(){  return "0" }
}
//  node with label
class node {
  constructor(data) {
    this.d = data;
    if (data.length > 3) {this.dist = data[3]} else {this.dist = 10};
    // node
    this.p1 = board.create('point', data[2],  {name: "\\("+data[1]+"\\)", label:{autoPosition:true, offset:[0,this.dist]}} );
    this.p1.setAttribute(nodeStyle);
    // label
  }
  data() { return this.d }
  name() { return '"'+this.d[1]+'"' }
}
//  point with label
class point {
  constructor(data) {
    this.d = data;
    if (data.length > 3) {this.dist = data[3]} else {this.dist = 10};
    // node
    this.p1 = board.create('point', data[2],  {name: "\\("+data[1]+"\\)", label:{autoPosition:true, offset:[0,this.dist]}} );
    this.p1.setAttribute(pointStyle);
    // label
  }
  data() { return this.d }
  name() { return '"'+this.d[1]+'"'}
}
// grau gefülltes Polygon mit schwarzem Rand. Z.B. für Scheiben oder Balken
class polygon {
  constructor(data){
    this.d = data.slice(0);
    this.v = data.slice(2);
    this.p = board.create('polygon',this.v, {opacity: true, fillcolor:'lightgray', vertices:{size:0, fixed: true} ,borders: normalStyle } );
  }
  data(){ return this.d }
  name(){ return "0" } 
}

// line load 
// line load perpendicular to the line
class q {
  constructor(data){
    if (typeof(data[data.length-1]) == 'string') {this.state = data.pop()}
      else {this.state = "locked"}
    this.d = data.slice(0);
    data.shift(); //"q" wird ausgeblendet
    this.name1 = data.shift();  this.name2 = data.shift(); 
    this.alpha = Math.atan2(data[1][1]-data[0][1],data[1][0]-data[0][0]); //Balkenneigung
    this.phi = data.pop()*Math.PI/180 //Abweichung zur Normalen
    this.width = Math.sqrt(Math.pow(data[0][1]-data[1][1],2)+Math.pow(data[0][0]-data[1][0],2)); //Länge der unteren Kante
    this.n = data[2];
    this.m = (data[3]-data[2])/this.width;
    this.sin = [Math.sin(this.alpha+this.phi), Math.sin(this.alpha)]; 
    this.cos = [Math.cos(this.alpha+this.phi), Math.cos(this.alpha)];
    this.arrow = []; this.p = []; this.label = [];
    for (this.i=0;this.i<=(this.width/a);this.i++) {
      this.p.push(
        [ 0, this.m*((this.i)*this.width/Math.floor(this.width/a))+this.n ]);
      this.p.push([0, 0]);
      for (this.j=0;this.j<=1;this.j++) {
        this.p[2*this.i+this.j] = [
          this.p[2*this.i+this.j][0]*this.cos[this.j]-this.p[2*this.i+this.j][1]*this.sin[this.j]+data[0][0]+this.cos[1]*(this.i*this.width/Math.floor(this.width/a)),
          this.p[2*this.i+this.j][0]*this.sin[this.j]+this.p[2*this.i+this.j][1]*this.cos[this.j]+data[0][1]+this.sin[1]*(this.i*this.width/Math.floor(this.width/a)) ] }
      this.arrow.push(board.create('arrow', [ this.p[2*this.i], this.p[2*this.i+1] ],
        {lastarrow:{size:5}, fixed:true, snapToGrid:false, strokewidth:1, highlight:false})) }
    this.polygon = board.create('polygon', 
      [ this.p[0],this.p[1],this.p[this.p.length-1],this.p[this.p.length-2] ],
      { fillcolor:'#0000ff44', strokecolor:'blue', fixed:true, highlight:false,
        borders:{visible:false},
        vertices:{visible:false} });
    this.border = board.create('curve', [
      [this.p[0][0], this.p[1][0], this.p[this.p.length-1][0],this.p[this.p.length-2][0], this.p[0][0] ],
      [this.p[0][1], this.p[1][1], this.p[this.p.length-1][1],this.p[this.p.length-2][1], this.p[0][1] ]], {strokeColor:'blue'});
    this.label.push(board.create('point',this.p[0],
      { name:'\\('+this.name1+'\\)', size:0, fixed:true,
        label:{autoPosition:true,offset:[-10,10],color:'blue', highlight:false} }));
    this.label.push(board.create('point',this.p[this.p.length-2], 
      { name:'\\('+this.name2+'\\)', size:0, fixed:true,
        label:{autoPosition:true, offset:[5,10], color:'blue', highlight:false} }));
    // implement state switching
    this.obj = this.arrow.concat([this.polygon, this.border, this.label[0].label, this.label[1].label]); 
    // state init
    if (this.state == "show") { show(this) }
    if (this.state == "hide") { hide(this) }
    //switch by doubleclick
    this.border.parent = this;
    this.border.lastclick = Date.now();    
    this.border.on('up', function() {
      if (Date.now()-this.lastclick < 500) { Switch(this.parent) }
      else {this.lastclick = Date.now() }})
  } 
  data(){ var a = this.d.slice(0); a.push(this.state); return a}
  name(){ return '"'+this.state+'"' } 
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
  name() { return '"'+this.state+'"' }
}
//rot
class rot {
  constructor(data) {
  this.d = data;
    this.p1 = board.create('point', data[2], { fixed:true, size:0 , name: '' });
    this.p2 = board.create('point', data[3], { fixed:true, size:0 , name: '' }); 
    // label
    this.p3 = board.create('point', data[4], {    
      name:"\\("+data[1]+"\\)" ,size:0, label:{offset:[0,0],color:'red'}});
    this.arc = board.create('minorArc', [this.p1, this.p2, this.p3], {
      fixed: true, strokeWidth: 1, lastArrow: { type: 1, size: 6 }, strokeColor:"red" });
    //this.arc.setAttribute({strokeColor:"red"});
  }
  data() { return this.d }
  name() { return '"'+this.d[1]+'"' }
}

// [ "spline", "eqn", [X0, Y0], [x1, y1], [x2,y2], [xt1, yt1], [xt2,yt2], style, status ]
class spline {
  constructor(data) {
    this.d = data;
    this.state = data[8];
    this.style = data[7];
    // global coordinates
    this.P = data[2]; // ref point
    var P1 = plus(this.P, data[3]);
    var P2 = plus(this.P, data[4]);
    var PT1 = plus(this.P, data[5]);
    var PT2 = plus(this.P, data[6]);
    var B1 = [P1[0], this.P[1]];
    var B2 = [P2[0], this.P[1]];  
    // points
    this.v1 = board.create('line',[P1,plus(P1,[0,1])], {visible:false, fixed:true});
    this.v2 = board.create('line',[P2,plus(P2,[0,1])], {visible:false, fixed:true});
    this.p1 = board.create('glider',[P1[0], P1[1],this.v1], { name: '', fixed: false ,size:6, color:'red',fillOpacity:0});
    this.p2 = board.create('glider',[P2[0], P2[1],this.v2], { name: '', fixed: false ,size:6, color:'red',fillOpacity:0});
    this.pt1 = board.create('point',PT1, { name: '', fixed: false, snapToGrid:false });
    this.pt2 = board.create('point',PT2, { name: '', fixed: false, snapToGrid:false });
    this.t1 = board.create('segment',[this.p1, this.pt1], {fixed:false, strokecolor:'black', strokewidth: 1});
    this.t2 = board.create('segment',[this.p2, this.pt2], {fixed:false, strokecolor:'black', strokewidth: 1});
    this.v1 = board.create('segment',[this.p1, [P1[0],this.P[1]]], {fixed:true, strokecolor:'black', strokewidth: 1});
    this.v2 = board.create('segment',[this.p2, [P2[0],this.P[1]]], {fixed:true, strokecolor:'black', strokewidth: 1});
    this.v3= board.create('segment',[[P1[0],this.P[1]], [P2[0],this.P[1]]], {fixed:true, strokecolor:'black', strokewidth: 1});
    //this.g1 = board.create('group', [this.p1, this.pt1] ).removeTranslationPoint(this.pt1);
    //this.g2 = board.create('group', [this.p2, this.pt2] ).removeTranslationPoint(this.pt2);
    this.graph = board.create('functiongraph', [hermiteplot(this.P,this.p1, this.p2, this.pt1, this.pt2), this.p1.X(), this.p2.X()], { strokecolor: 'red', strokewidth: 3  });
    // set of control points
    this.obj = [ this.p1, this.p2, this.pt1, this.pt2 ];
    for (var part of this.obj) { part.ref = this.P} // ref point for local system
    // state init
    if (this.state == "active") { activate(this) }
    if (this.state == "inactive") {deactivate(this) }
    if (this.state == "locked") { 
      deactivate(this); this.state = "locked" ;  this.graph.setAttribute({strokeColor:'black'} ); }
    if (this.state == "pure") { 
      deactivate(this); this.state = "pure" ;  
      this.graph.setAttribute({strokeColor:'black'} );  
      this.graph.setAttribute({strokewidth: 2});  
      this.graph.setAttribute({highlight: false} ); 
      this.v1.setAttribute({visible: false}); 
      this.v2.setAttribute({visible: false}); 
      this.v3.setAttribute({visible: false}); 
      this.t1.setAttribute({visible: false}); 
      this.t2.setAttribute({visible: false});
    }
    //switch by doubleclick
    this.graph.parent = this;
    this.graph.lastclick = Date.now();    
    this.graph.on('up', function() {
      if (Date.now()-this.lastclick < 500) { console.log(this.parent.state); Switch(this.parent) }
      else {this.lastclick = Date.now() }})
  }
  data() {  return [
      "spline",
      this.d[1],
      this.d[2],
      minus([this.p1.X(),this.p1.Y()], this.d[2]),
      minus([this.p2.X(),this.p2.Y()], this.d[2]),
      minus([this.pt1.X(),this.pt1.Y()], this.d[2]),
      minus([this.pt2.X(),this.pt2.Y()], this.d[2]),
      this.style,
      this.state
    ];  }
  name() { return hermitename(this.P,this.p1, this.p2, this.pt1, this.pt2) }
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
  data(){ return this.d } 
  name(){ return '"'+this.d[1]+'"' } 
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
  name(){ return '"'+this.d[1]+'"' }
  data(){ return this.d } 
}
// [ "wall", "name", [x1, y1], [x2,y2] , angle ]
class wall {
  constructor(data) {
    this.d = data;
    // dependent objects
    this.bl = board.create('segment', [data[2],data[3]], {name: ''});
    this.bl.setAttribute(normalStyle);
    this.c = board.create("comb", [data[2],data[3]], { width: 0.25*a, frequency: 0.25*a, angle: data[4]* Math.PI / 180 })
  }
  data() { return this.d }
  name(){ return "0" }
}

function init() {
  let state;
  if (stateRef) {
    stateInput = document.getElementById(stateRef);
    if (stateInput.value && stateInput.value != '') {
      state = JSON.parse(stateInput.value); } else { state = JSON.parse(initstring); }
   } else { state = JSON.parse(initstring) }
 console.log("OK");
  var m;
  for (m of state) {
    console.log(m);
    switch (m[0]) {
      case "angle":     objects.push(new angle(m)); break;
      case "angle1":    objects.push(new angle(m)); break;
      case "angle2":    objects.push(new angle(m)); break;
      case "bar":	      objects.push(new bar(m)); break;
      case "beam":	    objects.push(new beam(m)); break;
      case "circle":	  objects.push(new circle(m)); break;
      case "circle2p":	objects.push(new circle2p(m)); break;
      case "crosshair":	objects.push(new crosshair(m)); break;
      case "dashpot":		objects.push(new dashpot(m)); break;
      case "dim": 			objects.push(new dim(m)); break;
      case "dir": 			objects.push(new dir(m)); break;
      case "disp": 			objects.push(new disp(m)); break;
      case "fix1": 	  	objects.push(new fix1(m)); break;
      case "fix12": 	  objects.push(new fix12(m)); break;
      case "fix123": 	  objects.push(new fix123(m)); break;
      case "fix13": 	  objects.push(new fix13(m)); break;
      case "force": 		objects.push(new force(m)); break;
      case "forceGen":  objects.push(new forceGen(m)); break;
      case "grid":  		objects.push(new grid(m)); break;
      case "label":   	objects.push(new label(m)); break;
      case "line": 			objects.push(new line(m)); break
      case "line2p": 		objects.push(new line2p(m)); break
      case "mass": 			objects.push(new mass(m)); break;     
      case "moment":  	objects.push(new moment(m)); break;
      case "momentGen":	objects.push(new momentGen(m)); break;
      case "node":      objects.push(new node(m)); break;
      case "point":     objects.push(new point(m)); break;
      case "polygon":   objects.push(new polygon(m)); break;
      case "q":  	      objects.push(new q(m)); break;
      case "rope":      objects.push(new rope(m)); break;
      case "rot":       objects.push(new rot(m)); break;
      case "spline":  	objects.push(new spline(m)); break;
      case "springc":   objects.push(new springc(m)); break;
      case "springt":  	objects.push(new springt(m)); break;
      case "wall": 			objects.push(new wall(m)); break;
    }
  }
}

function update() {
  if (!stateRef) { return }
  var m;
  var dfield = [];
  var names = "[";
  for (m of objects) {
  	// object key is "deleted" if it has been deleted
    // console.log(m.data()[0], m.name());
    if (m.data()[0] != 'deleted' ) {dfield.push(m.data());
    if (names != "[") { names = names.concat(",") }
    names = names.concat(m.name()); }
  }
  names = names.concat("]");
  if (mode == "jsfiddle") {
    stateInput.innerHTML = JSON.stringify(dfield);
    document.getElementById(fbd_names).innerHTML = names } else {
    stateInput.value = JSON.stringify(dfield);
    document.getElementById(fbd_names).value = names }
}

function plus(a,b) { return [ a[0]+b[0], a[1]+b[1] ] }
function minus(a,b) { return [ a[0]-b[0], a[1]-b[1] ] }
function dist(a,b) { return Math.sqrt( (a[0]-b[0])**2 + (a[1]-b[1])**2 ) }
function hermite(x1,dx,y1,dy,d1,d2) {
  if (!isNaN(d1) && !isNaN(d2)) {
    // cubic spline
    var c0 = (dx**3*y1+(2*dy+(-d2-d1)*dx)*x1**3+(3*dx*dy+(-d2-2*d1)*dx**2)*x1**2-d1*dx**3*x1)/(dx**3);
    var c1 = -((6*dy+(-3*d2-3*d1)*dx)*x1**2+(6*dx*dy+(-2*d2-4*d1)*dx**2)*x1-d1*dx**3)/(dx**3);
    var c2 = ((6*dy+(-3*d2-3*d1)*dx)*x1+3*dx*dy+(-d2-2*d1)*dx**2)/(dx**3);
    var c3 = -(2*dy+(-d2-d1)*dx)/(dx**3); }
  if (isNaN(d1) && !isNaN(d2)) {
    // parabola with 2 points and slope at right point
    var c0 = (dx**2*y1+(d2*dx-dy)*x1**2+(d2*dx**2-2*dx*dy)*x1)/(dx**2);
    var c1 = ((2*dy-2*d2*dx)*x1+2*dx*dy-d2*dx**2)/(dx**2);
    var c2 = -(dy-d2*dx)/(dx**2);
    var c3 = 0;}
  if (!isNaN(d1) && isNaN(d2)) {
    // parabola with 2 points and slope at left point
    var c0 = (dx**2*y1+(dy-d1*dx)*x1**2-d1*dx**2*x1)/(dx**2);
    var c1 = -((2*dy-2*d1*dx)*x1-d1*dx**2)/(dx**2);
    var c2 = (dy-d1*dx)/(dx**2);
    var c3 = 0;}
  if (isNaN(d1) && isNaN(d2)) {
    // straight segment thru 2 points
    var c0 = (dx*y1-dy*x1)/dx;
    var c1 = dy/dx;
    var c2 = 0;
    var c3 = 0;}
  return [c0, c1, c2, c3];
}
function hermiteplot(Ref,p1, p2, t1, t2) {
  var fct = function(x) {
    const tol = 0.09; // min x-range for tangent lines
    var c0 = 0, c1 = 0, c2 = 0, c3 = 0;
    var x1 = p1.X()-Ref[0], dx = p2.X()-p1.X();
    var y1 = p1.Y()-Ref[1], dy = p2.Y()-p1.Y();
    var d1 = (p1.Y()-t1.Y())/(p1.X()-t1.X());
    if (Math.abs(p1.X()-t1.X())<tol) {d1 = NaN};
    var d2 = (p2.Y()-t2.Y())/(p2.X()-t2.X());
    if (Math.abs(p2.X()-t2.X())<tol) {d2 = NaN};
    var c = hermite(x1,dx,y1,dy,d1,d2);
    var s = Ref[1]+c[3]*(x-Ref[0])**3+c[2]*(x-Ref[0])**2+c[1]*(x-Ref[0])+c[0];
    return  s
  }
  return fct; 
};
function hermitename(Ref,p1, p2, t1, t2) {
  const tol = 0.09; // min x-range for tangent lines
  var c0 = 0, c1 = 0, c2 = 0, c3 = 0;
  var x1 = p1.X()-Ref[0], dx = p2.X()-p1.X();
  var y1 = p1.Y()-Ref[1], dy = p2.Y()-p1.Y();
  var d1 = (p1.Y()-t1.Y())/(p1.X()-t1.X());
  var d2 = (p2.Y()-t2.Y())/(p2.X()-t2.X());
  var c = hermite(x1,dx,y1,dy,d1,d2);
  if (!isNaN(c[0]+c[1]+c[2]+c[3])) {
    var n = c[3].toFixed(3) + "*x^3+" + c[2].toFixed(3) + "*x^2+" + c[1].toFixed(3) + "*x+" + c[0].toFixed(3);
    return n.replace(/\+\-/g,"-")  }
  else {return "NaN"}
}
function lock(ref) {
        for (var part of ref.obj) {
          part.setAttribute({highlight:false});
        } update()}
// applies settings for active state of fixed objects
function show(ref) { ref.state = "show";
        for (var part of ref.obj) {
          part.setAttribute({strokeOpacity:1, fillOpacity:1});
        } update()}
// applies settings for inactive state of fixed objects
function hide(ref) { ref.state = "hide";
        for (var part of ref.obj) {
          part.setAttribute({strokeOpacity:0.2, fillOpacity:0.2});
        } update()}
function activate(ref) { ref.state = "active";
        for (var part of ref.obj) {
          part.setAttribute({visible:true});
          part.setAttribute({fixed:false});
          part.setAttribute({snapToGrid:true});
        } update()}
function deactivate(ref) { ref.state = "inactive";
        for (var part of ref.obj) {
          part.setAttribute({visible:false});
          part.setAttribute({fixed:true});
        } update()}
function Switch(ref) { switch (ref.state) {
    case "active":  deactivate(ref); break
    case "inactive":  activate(ref); break
    case "show":  hide(ref); break
    case "hide":  show(ref); break    
  } console.log(ref.state)}  
// checks if if a point is outside the boundingbox
function isOutside(ref) {
  var [xmin, ymax, xmax, ymin] = board.getBoundingBox();
  var x = ref.X(), y = ref.Y();
  return (x<xmin || x>xmax || y<ymin || y>ymax) }

// initialization
var objects = [];
init();
update();
board.on('update', function() {
  update()
});

[[/jsxgraph]]
