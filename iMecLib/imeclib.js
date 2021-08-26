<p hidden>[[input:objects]] [[validation:objects]]</p>
<p hidden>[[input:names]] [[validation:names]] </p>
<p>
[[jsxgraph width='500px' height='400px' input-ref-objects="stateRef" input-ref-names="fbd_names" ]]
// Version 2021 08 26 https://jsfiddle.net/vtmeq12x/9/
// defaults
JXG.Options.point.snapToGrid = true; // grid snap spoils rotated static objects
JXG.Options.point.snapSizeX = 0.1;
JXG.Options.point.snapSizeY = 0.1;
JXG.Options.point.fixed = true; // this is for static objects
JXG.Options.text.useMathJax = true;
JXG.Options.label.useMathJax = true;
JXG.Options.text.useMathJax = true;
JXG.Options.label.offset = [0, 0];
JXG.Options.label.anchorY = 'middle';
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
    if (typeof (el.ref) != 'undefined') {ref = el.ref}
    if (typeof (el.scale) != 'undefined') {scale = el.scale}
    if (typeof (el.dp) != 'undefined') {dp = el.dp}
    this.infobox.setText( 
        '('+((parseFloat(x)-ref[0])*scale[0]).toFixed(dp[0]) + ', ' + ((parseFloat(y)-ref[1])*scale[1]).toFixed(dp[1])+ ')')
};
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
  name() { return "0" }
  data(){
    return this.d;
  } 
}

// co-ordinate arrow with arrow with label 
// ["dir", "name", [x1,y1], angle]
// ["dir", "name", [x1,y1], angle, offset]
// ["dir", "name", [x1,y1], angle, offset, length]
class dir {
 constructor(data) {
   this.label = data[1];
   this.d =data;
   var le = 1.5*a;
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
 name() { return "0" };
}
//co-ordinate arrow with red arrow with label 
// [ "disp", "name", [x,y], angle, offset, length]
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
  name() { return "0" }
}
// [ "force", "name", [x1, y1], [x2,y2], d ]
class force {
  constructor(data) {
    this.p1 = board.create('point', data[2], {
      name: '', fixed:false
    });
    this.p2 = board.create('point', data[3], {
      name: data[1], fixed:false, label:{offset:[10,10]}
    });
    this.vec = board.create('arrow', [this.p1, this.p2], {
      touchLastPoint: true, fixed:false
    });
  }
  data() {  return ["force", this.p2.name, [this.p1.X(), this.p1.Y()], [this.p2.X(), this.p2.Y()]  ] }
  name() { return this.p2.name.replace(/\s+/,"*") }
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
   this.p = board.create('point', data[2], {    
     name:data[1] ,size:0, label:{offset:[0,0]}} );
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
    this.p1 = board.create('point', data[2], {
      name: '', fixed:false
    });
    this.p2 = board.create('point', data[3], {
      name: '', fixed:false
    });
    this.p3 = board.create('point', data[4], {
      name: data[1], fixed:false, label:{offset:[10,10]}
    });
    this.arc = board.create('minorArc', [this.p1, this.p2, this.p3], {
      fixed: false,
      strokeWidth: 2,
      lastArrow: {
        type: 1,
        size: 5
      },
    });
    var g = board.create('group', [this.p1, this.p2, this.p3, this.arc]);
    g.removeTranslationPoint(this.p2);
    g.removeTranslationPoint(this.p3);
  }
  data() { return ["moment", this.p3.name,  [this.p1.X(), this.p1.Y()], [this.p2.X(), this.p2.Y()], [this.p3.X(), this.p3.Y()]  ]  }
  name() {return this.p3.name.replace(/\s+/,"*") }
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
  name(){ return "0" }
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

// initialization
var objects = [];
init();

update();

board.on('update', function() {
  update()
});

function init() {
  stateInput = document.getElementById(stateRef);
  if (stateInput.value && stateInput.value != '') {
    console.log(stateInput.value); state = JSON.parse(stateInput.value); } else { state = JSON.parse({#init#});
 }
  var m;
  for (m of state) {
    console.log(m);
    switch (m[0]) {
      case "circle2p":	        objects.push(new circle2p(m)); break;
      case "crosshair":	objects.push(new crosshair(m)); break;
      case "dashpot":		objects.push(new dashpot(m)); break;
      case "dir": 			objects.push(new dir(m)); break;
      case "disp": 		objects.push(new disp(m)); break;
      case "force": 		objects.push(new force(m)); break;
      case "grid":  		objects.push(new grid(m)); break;
      case "label":   	        objects.push(new label(m)); break;
      case "line": 		objects.push(new line(m)); break
      case "line2p": 		objects.push(new line2p(m)); break
      case "mass": 		objects.push(new mass(m)); break;     
      case "moment":  	objects.push(new moment(m)); break;
      case "spline":  	        objects.push(new spline(m)); break;
      case "springt":  	        objects.push(new springt(m)); break;
      case "wall": 		objects.push(new wall(m)); break;
    }
  }
}

function update() {
  var m;
  var dfield = [];
  var names ="[";
  for (m of objects) {
    dfield.push(m.data());
    if (names != "[") { names = names.concat(",")  }
    names = names.concat(m.name()); 
  }
  stateInput.value = JSON.stringify(dfield);
  names=names.concat("]");
  document.getElementById(fbd_names).value=names;

}
function plus(a,b) { return [ a[0]+b[0], a[1]+b[1] ] }
function minus(a,b) { return [ a[0]-b[0], a[1]-b[1] ] }
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
  	var d2 = (p2.Y()-t2.Y())/(p2.X()-t2.X());
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
};
function activate(ref) {console.log("activate()"); ref.state = "active";
        for (var part of ref.obj) {
          part.setAttribute({visible:true});
          part.setAttribute({fixed:false});
          part.setAttribute({snapToGrid:true});
        } update()}
function deactivate(ref) {console.log("deactivate()"); ref.state = "inactive";
        for (var part of ref.obj) {
          part.setAttribute({visible:false});
          part.setAttribute({fixed:true});
        } update()}
function Switch(ref) {if (ref.state == "active") { deactivate(ref)}
      else if (ref.state == "inactive") { activate(ref)}
      console.log(ref.state)}

[[/jsxgraph]]</p>