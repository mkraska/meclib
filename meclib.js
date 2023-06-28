// https://github.com/mkraska/meclib/wiki
// version info
const versionText= "JXG "+JXG.version+" Meclib 2023 06 28";
const highlightColor = "orange";
const movableLineColor = "blue";
const loadColor = "blue";
const defaultMecLayer = 6;
var pxunit = 1/40; // is reset by "grid"
var a = 16*pxunit; // is reset by "grid"
const deg2rad = Math.PI/180, rad2deg = 180/Math.PI;
const tolPointLine = 0.001;
var xscale = 1, yscale = 1; // default scale for infobox, can be modified by "grid"
var dpx = 1, dpy = 1; // default decimal precision for infobox, can be modified by "grid"
// infobox settings, further settings after board initiation
JXG.Options.infobox.layer = defaultMecLayer+5;
JXG.Options.infobox.strokeColor = 'black';
JXG.Options.infobox.cssStyle = 'background-color: #ffffffdd;'
// snap settings. Interactive objects are handled explicity
JXG.Options.point.snapToGrid = false; // grid snap spoils rotated static objects
JXG.Options.point.snapSizeX = 0.1;
JXG.Options.point.snapSizeY = 0.1;
// interactive objects are released explicitly
JXG.Options.point.fixed = true; 
JXG.Options.line.fixed = true; 
JXG.Options.circle.fixed = true;
// label settings
JXG.Options.text.useMathJax = true;
JXG.Options.text.parse = false;
JXG.Options.label.useMathJax = true;
JXG.Options.label.offset = [0, 0];
JXG.Options.label.anchorY = 'middle';
// highlighting is activated explicitly for interactive objects
JXG.Options.curve.highlight = false;
JXG.Options.label.highlight = false;
JXG.Options.text.highlight = false;
JXG.Options.circle.highlight = false;
JXG.Options.line.highlight = false;
JXG.Options.polygon.highlight = false;
JXG.Options.polygon.borders.highlight = false;
JXG.Options.point.highlight = false;
// Styles
// nodes (hinges)
const nodeStyle = { fillcolor: 'white', strokeColor: 'black', size: 2, strokeWidth: 1.5 }; 
// points (black dots)
const pointStyle = { fillcolor: 'black', strokeColor: 'black', size: 1, strokeWidth: 1 };
// invisible points with infobox
const silentPStyle = {size:0, withLabel:false};
// grid snap for control points
const controlSnapStyle = { snapToGrid:true, snapToPoints: true, 
attractorDistance: 0.2, fixed:false, layer:11};
// Style for bars
const barStyle = { strokewidth: 4, strokecolor: "black" };
// Normal line (body outline)
const normalStyle = { strokeWidth: 2, strokeColor: 'black', lineCap: 'round' };
// helper line
const thinStyle = { strokeWidth: 1, strokeColor: 'black', lineCap: 'round' };
// hatch style, must be a function because depending on pxunit
const hatchStyle = function () { return {fixed: true, width:4*pxunit , frequency:4*pxunit, angle:45*deg2rad, layer:8 } };

const board = JXG.JSXGraph.initBoard(divid, {
  boundingbox: [-5, 5, 5, -5], //default values, use "grid" to customize
  axis: false, grid:true, showNavigation:false, showCopyright:false, 
  keepAspectRatio:false, resize: {enabled: false, throttle: 200},
  pan: {enabled:false}, //suppress uninteded pan on touchscreens
  keyboard:{enabled:false} //would spoil textinput in momentGen and forceGen
});

var state;
var stateInput;
// make infobox optionally relative to a given point (define p.ref to [xref, yref])
board.infobox.distanceY = 20;
//board.infobox.setAttribute({highlight:false});
board.highlightInfobox = function(x, y , el) {
    var ref = [0,0];
    var scale = [xscale,yscale];
    var dp = [dpx,dpy];
    var lbl = '';
    if (typeof (el.ref) == 'function') {ref = el.ref()} 
    else if (typeof(el.ref) != 'undefined') {ref = el.ref}
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
   this.p1 = board.create('point',data[2], silentPStyle );
   this.p2 = board.create('point',data[3], silentPStyle );
   this.line = board.create('segment', [this.p1, this.p2], {
     withlabel:false, ...thinStyle });
   // second line
   const a0 = this.line.getAngle();
   const le = this.line.L();
   const a1 = a0+data[5]*deg2rad;
   //console.log(a0*rad2deg, a1*rad2deg);
   this.p3 = board.create('point', plus( XY(this.p1), rect(le,a1) ), silentPStyle );
   this.l2 = board.create('segment', [this.p1, this.p3], {
     withlabel:false, ...thinStyle });
   // arc with arrows
   this.p4 = board.create('point', plus( XY(this.p1), rect(data[4],a0) ), silentPStyle );
   if (data[0] == "angle" ) {
     this.arc = board.create('minorArc', [this.p1, this.p4, this.p3], 
       { ...thinStyle } ) }
   if (data[0] == "angle1" ) { 
     this.arc = board.create('minorArc', [this.p1, this.p4, this.p3], 
       { ...thinStyle, lastArrow:{type: 1, size: 6}})}
   if (data[0] == "angle2" ) {
     this.arc = board.create('minorArc', [this.p1, this.p4, this.p3], 
       { ...thinStyle, firstArrow:{type: 1, size: 6},lastArrow:{type: 1, size: 6}})}
        
   // label
   const al = (a0+a1)/2; // angular position of label
   if (data[1] == ".") {
     const rl = data[4]*0.6;
     this.p5 = board.create('point', plus( XY(this.p1), rect(rl,al) ), {
       name:"" , showInfobox:false, 
       fillcolor:'black',strokeColor:'black',size:0.5, strokeWidth:0}); 
   }
   else {
     const rl = data[4]+10*pxunit;
     this.p5 = board.create('point', plus( XY(this.p1), rect(rl,al) ), { 
       name:toTEX(data[1]), showInfobox:false, size:0, label:{offset:[-6,0]}}); 
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
   this.p1 = board.create('point',data[2],{withlabel:false, ...nodeStyle});
   this.p2 = board.create('point',data[3],{withlabel:false, ...nodeStyle});
   this.line = board.create('segment', [this.p1, this.p2], {
     withlabel:false, ...barStyle});  
   targets.push(this.line);
   // label
   const alpha = this.line.getAngle()+90*deg2rad;
   this.label = board.create('text', plus(  mult( 0.5, plus( XY(this.p1), XY(this.p2) ) ), rect(11*pxunit, alpha) ).concat(data[1]), {
     anchorX:'middle', anchorY:'middle' });
    // implement state switching
    this.obj = [ this.p1, this.p2, this.line, this.label ];
    // state init
    if (this.state == "show") { show(this) }
    if (this.state == "hide") { hide(this) }
    this.loads = [];
    if (this.state != "locked") { makeSwitchable(this.line, this) }
  }
  hasPoint(pt) { 
   return isOn(pt,this.line) && JXG.Math.Geometry.distPointLine([1,pt.X(),pt.Y()], this.line.stdform) < tolPointLine}
  data(){ var a = this.d.slice(0); a.push(this.state); return a}
  name(){ return targetName(this) }  
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
   this.angle = -Math.atan2(this.p[1][1]-this.p[0][1],this.p[1][0]-this.p[0][0])+90*deg2rad;
   this.attr = { opacity: true, layer: defaultMecLayer, fillcolor:this.col[0],
     gradient: 'linear', gradientSecondColor: this.col[1], gradientAngle: this.angle, 
     ...normalStyle };
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
     // snap points
     board.create('point',this.p[0], silentPStyle );
     board.create('point',this.p[1], silentPStyle );
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
    if (this.state != "locked") { makeSwitchable(this.b, this) }
    this.loads = [];
  }
  hasPoint(pt) {return isOn(pt,this.b)}
  data(){ var a = this.d.slice(0); a.push(this.state); return a}
  name(){ return targetName(this) } 
}
// Circle with centerpoint, point on perimeter, optional: use name as radius indicator
// [ "circle", "name", [xc, yc], [xp,yp] , angle]
// [ "circle", "name", [xc, yc], radius , angle]
class circle {
  constructor(data){
    this.d = data.slice(0); //make a copy
    if (data[5]) {this.state = data[5]} else {this.state = "locked"}
    if (data[4]) {this.angle = data[4]*deg2rad} else {this.angle = 0} // pop the angle for the label
    // circle
    this.c = board.create('circle', [ data[2], data[3] ], {
      opacity: true, fillcolor:'lightgray', hasInnerPoints:true, 
      strokeWidth: normalStyle.strokeWidth, 
      strokeColor: normalStyle.strokeColor});
    this.obj = [this.c];
    // arrow and label if name is not empty
    if (data[1] != '') {
      var dir = 1;
      if (this.angle < 0) {dir = -1}
      const r = this.c.Radius();
      //      console.log(dir);
      this.a = board.create('arrow', [ 
        plus( data[2], rect(r+dir*16*pxunit, this.angle)), plus( data[2], rect(r, this.angle))],
        thinStyle);
      // label
      this.p = board.create('point', plus( data[2], rect(r+dir*24*pxunit, this.angle)),
      {name:toTEX(data[1]) , ...centeredLabelStyle }); 
      this.obj.push( this.a, this.p.label );
    }
    // state init
    if (this.state == "show") { show(this) }
    if (this.state == "hide") { hide(this) }
    if (this.state != "locked") { makeSwitchable(this.c, this) }
    this.loads = []
  }
  hasPoint(pt) {return isOn(pt,this.c)} 
  data(){ var a = this.d.slice(0); a.push(this.state); return a}
  name(){ return targetName(this) } 
}

//[ "circle2P", "<label1>","<label2>", [x1,y1],[x2,y2], f ]//
class circle2p {
  constructor(data){
    this.d = data.slice(0); //make a copy
    if (this.data[5]) {this.f = data[5]} 
    else {this.f = xscale};
    const lStyle = {fixed:false, strokeColor:movableLineColor, highlightStrokeColor:highlightColor, highlight:true};
    const iStyle = { visible: true, size: 0 , label:{visible:false} };
    // x-axis for intersection points
    this.xaxis = board.create('line', [ [0, 0], [1, 0] ], { visible: false }); 
    // circle
    this.A = board.create('point', mult( 1/this.f, data[3] ), { 
      name: data[1], ...controlSnapStyle, snapToPoints:false,label:{offset:[5,5]}}); 
    this.AS = board.create('point', mult( 1/this.f, data[4] ), { 
      name: data[2], ...controlSnapStyle, snapToPoints:false,label:{offset:[5,5]} }); 
    this.MSK1 = board.create('semicircle', [this.A, this.AS], lStyle ); 
    this.MSK2 = board.create('semicircle', [this.AS, this.A], lStyle ); 
    // the intersection signature has changed between 1.2.1 and 1.4.4
    if (isNewerVersion ('1.2.1', JXG.version)) {
      this.int1 = board.create('intersection', [this.MSK1, this.xaxis,0], iStyle );
      this.int2 = board.create('intersection', [this.MSK2, this.xaxis,1], iStyle ); 
    } else {
      this.int1 = board.create('intersection', [this.MSK1, this.xaxis], iStyle );
      this.int2 = board.create('intersection', [this.MSK2, this.xaxis], iStyle ); 
    }
    for (var pt of [this.A, this.AS, this.int1, this.int2]) {
    	pt.scale = [this.f,this.f] }
    this.A.on("up", update );
    this.AS.on("up", update );   
  }
  data(){ 
    return [this.d[0], this.d[1], this.d[2],
    mult( this.f, XY(this.A) ), mult( this.f, XY(this.AS) ), this.f] } 
  name(){ return "[["+this.data()[3].toString() + "],[" + this.data()[4].toString() + "]]" } 
}
// crosshair for reading off co-ordinates from graphs
// [ "crosshair", "", [x0, y0], [xref, yref], [xscale, yscale], [dpx, dpy] ]
class crosshair {
  constructor(data) {
    this.d = data;
    const f = 2, r = 7;
    this.p = board.create('point', data[2], {
      name: '',
      fixed: false,
      size: r,
      fillOpacity: 0,
      highlightFillOpacity: 0,
      strokeWidth: 1,
      color: movableLineColor,
      snapToGrid: false,
      attractors: targets,
      attractorDistance: 0.2
    });
    // set properties of infobox
    if (data[3]) { this.p.ref = data[3] } else {this.p.ref = [0,0]}
    if (data[4]) { this.p.scale = data[4] } else {this.p.scale = [1,1]}
    if (data[5]) { this.p.dp = data[5] }
    // cross
    const that = this;
    this.v = board.create('curve', [ [],[] ], { strokeWidth: 1, strokeColor: movableLineColor });
    this.v.updateDataArray = function() {
      this.dataX = [that.p.X() - f * r * pxunit, that.p.X() + f * r * pxunit, NaN, that.p.X(), that.p.X()];
      this.dataY = [that.p.Y(), that.p.Y(), NaN, that.p.Y() - f * r * pxunit, that.p.Y() + f * r * pxunit]
    };
    this.v.fullUpdate();
    // this doesn't work in JSXGraph version 1.2.1
    //this.p1 = board.create('point', [ ()=>that.p.X(), ()=>that.p.Y() ), 
    //  {size:2*r, face: 'plus',strokeWidth:1 , strokeColor: movableLineColor  });
    this.p.on("up", update);
  }
  data() {
    var d = this.d;
    d[2] = XY(this.p);
    return d
  }
  name() {
    return "[" +
      ((this.p.X() - this.p.ref[0]) * this.p.scale[0]).toString() + "," +  
      ((this.p.Y() - this.p.ref[1]) * this.p.scale[1]).toString() +"]"
  }
}
// damper 
// [ "dashpot", "name", [x1,y1], [x2,y2], r, offset ]
class dashpot {
  constructor(data){
    // Parameter handling
    if (typeof(data[data.length-1]) == 'string') {this.state = data.pop()}
      else {this.state = "locked"}
    this.d = data.slice(0); //make a copy
    var x = this.d[2][0];
    var y =  this.d[2][1];
    var dx = (this.d[3][0]-x);
    var dy = (this.d[3][1]-y);
    var l = Math.sqrt(dx**2+dy**2);
    var r;
    if (data.length >4 ) {r = data[4] } else {r = 6*pxunit}
    if (data.length >5 ) {this.off = data[7]} else {this.off = r+10*pxunit}
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
    this.c = board.create('curve',[ px, py ], normalStyle );
    // snap points
    this.p1 = board.create('point',this.d[2], silentPStyle );
    this.p2 = board.create('point',this.d[3], silentPStyle );
    this.s = board.create('segment', [this.p1,this.p2],{strokeWidth:0});
    targets.push(this.s);
    // label
    this.l = board.create('point',[xc-dy/l*this.off, yc+dx/l*this.off], {    
      name:toTEX(data[1]), ...centeredLabelStyle });
    // logging
    console.log("dasphot", data[1], data[2], data[3], r, this.off);   
    // implement state switching
    this.obj = [ this.c, this.l.label ];
    // state init
    if (this.state == "show") { show(this) }
    if (this.state == "hide") { hide(this) }
    if (this.state != "locked") { makeSwitchable(this.c, this) }
    this.loads = []
  }
  data(){ var a = this.d.slice(0); a.push(this.state); return a}
  name(){ return targetName(this) } 
  hasPoint(pt) {return (isOn(pt,this.s) || isOn(pt,this.p1))  && 
    JXG.Math.Geometry.distPointLine(
      [1,pt.X(),pt.Y()], this.s.stdform) < tolPointLine} 
}
// linear dimension ["dim", "name", [x1,y1], [x2,y2], d]
class dim {
 constructor(data) {
   this.d = data; 
   const d = data[4];
   const vd = minus( data[3], data[2]);
   const [le, a0] = polar(vd);
   const vn = rect( 1, a0+90*deg2rad )
   const v1 = plus( data[2], mult( d, vn ) );
   const v2 = plus( v1, vd );
   const vc = mult( 0.5, plus( v1, v2));
   // baseline
   this.bl = board.create('arrow', [ v1, v2], {
     name: '', ...thinStyle, 
     firstArrow: { type: 1, size: 6 }, lastArrow: { type: 1, size: 6 }});
   // perpendicular lines
   var da = 5*pxunit;
   var di = da;
   if (d !=0  ) {di=d};
   if (d<0) {di=d;da=-da};
   this.hl1 = board.create('segment', 
     [ plus (v1, mult( -di, vn)), plus (v1, mult( da, vn)) ], 
     {name: '', ...thinStyle});
   this.hl2 = board.create('segment', 
     [ plus (v2, mult( -di, vn)), plus (v2, mult( da, vn)) ],
     {name: '', ...thinStyle});
   // label
   this.p = board.create('point', plus( vc, mult( 8*pxunit, vn ) ),  
     {name:toTEX(data[1]) , ...centeredLabelStyle});   
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
   if ( data[4] ) { this.dist = data[4] } else {this.dist = 10}
   if ( data[5] ) { le = data[5] }
   if (this.dist >= 0) {this.name1 = ""; this.name2 = toTEX(data[1]) } else
     {this.name2 = ""; this.name1 = toTEX(data[1]) }
   // Arrow
   const off = data[4];
   const v = rect( le, data[3]*deg2rad );
   this.p1 = board.create('point', data[2], { size: 0, name: this.name1, 
     showInfobox:false, label:{offset:[0,this.dist], autoPosition:true}});
   this.p2 = board.create('point', plus(data[2], v), { size: 0, name: this.name2,
     showInfobox:false, label:{offset:[0,this.dist], autoPosition:true}});
   this.vec = board.create('arrow', [this.p1, this.p2], { 
     lastArrow: { type: 1, size: 6 }, ...thinStyle });
 }
 data() { return this.d } 
 name() { return '"'+this.d[1]+'"' }
}
//co-ordinate arrow with red arrow with label 
// [ "disp", "name", [x,y], angle, offset, length]
class disp {
  constructor(data) {
   this.label = data[1];
   this.d =data;
   var le = 24*pxunit;
   if ( data[4] ) { this.dist = data[4] } else {this.dist = 10}
   if ( data[5] ) { le = data[5] }
   if (this.dist >= 0) {this.name1 = ""; this.name2 = toTEX(data[1]) } else
     {this.name2 = ""; this.name1 = toTEX(data[1]) }
   // Arrow
   const off = data[4];
   const v = rect( le, data[3]*deg2rad );
   this.p1 = board.create('point', data[2], { size: 0, name: this.name1, 
     showInfobox:false, label:{offset:[0,this.dist], autoPosition:true, color:"red"}});
   this.p2 = board.create('point', plus(data[2], v), { size: 0, name: this.name2,
     showInfobox:false, label:{offset:[0,this.dist], autoPosition:true, color:"red"}});
   this.vec = board.create('arrow', [this.p1, this.p2], { 
     lastArrow: { type: 1, size: 6 }, ...thinStyle, strokeColor:"red" });
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
     [ 0, - 1.9*a]
    ];
    var p = [];
    var c;
    for (c of coords) { p.push(board.create('point', c, {visible: false})); }
    const t1 = board.create('transform', [data[3]*deg2rad], { type: 'rotate' });
    t1.applyOnce(p);
    const t2 = board.create('transform', data[2], { type: 'translate' });
    t2.applyOnce(p);
    // dependent objects
    // pivot 
    this.p1 = board.create('point', XY( p[0] ),{ name: '', ...nodeStyle });
    // label
    this.label=board.create('point', XY( p[7] ), {name:toTEX(data[1]),
      ...centeredLabelStyle });
    // body
    this.t = board.create('polygon', [p[0], p[1], p[2]], {
      name: '',fillColor: "white", Opacity: true, layer: 7,
      borders: {...normalStyle, layer:8}, vertices: { fixed: true, size: 0 } });
    // baseline with hatch
    this.bl = board.create('segment', [p[5],p[6]], { name: '', ...normalStyle });
    this.c = board.create("comb", [p[6],p[5]], hatchStyle() );
    // implement state switching
    this.obj = [ this.p1, this.t, this.bl, this.c, this.label, this.label.label ];
    this.obj = this.obj.concat(this.t.borders); 
    // state init
    if (this.state == "show") { show(this) }
    if (this.state == "hide") { hide(this) }
    if (this.state != "locked") { makeSwitchable(this.c, this) } 
    if (this.state != "locked") { makeSwitchable(this.t, this) } 
    // proximity 
    this.loads = []
  }
  data(){ var a = this.d.slice(0); a.push(this.state); return a}
  name(){ return targetName(this) } 
  hasPoint(pt) {return isOn(pt,this.p1)} 
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
     [ 0, - 1.9*a] // label
    ];
    var p = [];
    var c;
    for (c of coords) { p.push(board.create('point', c, {visible: false})); }
    const t1 = board.create('transform', [data[3]*deg2rad], { type: 'rotate' });
    t1.applyOnce(p);
    const t2 = board.create('transform', data[2], { type: 'translate' });
    t2.applyOnce(p);
    // dependent objects
    // pivot 
    this.p1 = board.create('point', XY(p[0]), { name: "", ...nodeStyle});
    // label
    this.label=board.create('point', XY(p[5]), {name:toTEX(data[1]),
      ...centeredLabelStyle });
    // body
    this.t = board.create('polygon', [p[0], p[1], p[2]], {
      name: '',fillColor: "white", Opacity: true, layer: 7, 
      borders:{...normalStyle, layer:8}, vertices: { fixed: true, size: 0 } });
    // baseline with hatch
    this.bl = board.create('segment', [p[3],p[4]], {name: '',...normalStyle});
    this.c = board.create("comb", [p[4],p[3]], hatchStyle() )
    // implement state switching
    this.obj = [ this.p1, this.t, this.bl, this.c, this.label, this.label.label ];
    this.obj = this.obj.concat(this.t.borders); 
    // state init
    if (this.state == "show") { show(this) }
    if (this.state == "hide") { hide(this) }
    if (this.state != "locked") { makeSwitchable(this.c, this) } 
    // proximity 
    this.loads = []
  }
  data(){ var a = this.d.slice(0); a.push(this.state); return a}
  name(){ return targetName(this) } 
  hasPoint(pt) {return isOn(pt,this.p1)} 
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
     [-0.9*a,0]   // label
    ];
    var p = [];
    var c;
    for (c of coords) { p.push(board.create('point', c, {visible: false})); }
    const t1 = board.create('transform', [data[3]*deg2rad], { type: 'rotate' });
    t1.applyOnce(p);
    const t2 = board.create('transform', data[2], { type: 'translate' });
    t2.applyOnce(p);
    // dependent objects
    // base point
    this.p1 = board.create('point', XY(p[0]), silentPStyle);
    // label
    this.label=board.create('point', XY(p[3]), {name:toTEX(data[1]), 
      ...centeredLabelStyle });
    // baseline with hatch
    this.bl = board.create('segment', [p[1],p[2]], {name: '',...normalStyle});
    this.c = board.create("comb", [p[2],p[1]], { ...hatchStyle(), angle:-45*deg2rad }) 
    // implement state switching
    this.obj = [ this.p1, this.bl, this.c, this.label, this.label.label ];
    // state init
    if (this.state == "show") { show(this) }
    if (this.state == "hide") { hide(this) }
    if (this.state != "locked") { makeSwitchable(this.c, this) } 
    // proximity 
    this.loads = []
  }
  data(){ var a = this.d.slice(0); a.push(this.state); return a}
  name(){ return targetName(this) } 
  hasPoint(pt) {return isOn(pt,this.p1)} 
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
     [-1.1*a,0]   // label
    ];
    var p = [];
    var c;
    for (c of coords) { p.push(board.create('point', c, {visible: false})); }
    const t1 = board.create('transform', [data[3]*deg2rad], { type: 'rotate' });
    t1.applyOnce(p);
    const t2 = board.create('transform', data[2], { type: 'translate' });
    t2.applyOnce(p);
    // dependent objects
    // base point
    this.p1 = board.create('point', XY(p[0]), {size:0, name: '' });
    // label
    this.label=board.create('point', XY(p[5]), {name:toTEX(data[1]),
      ...centeredLabelStyle });
    this.l = board.create('segment', [p[1],p[2]], {name: '', ...normalStyle});
    this.bl = board.create('segment', [p[3],p[4]], {name: '', ...normalStyle});
    this.c = board.create("comb", [p[4],p[3]], {...hatchStyle(), angle:-45*deg2rad } );
    // switchable objects
    this.obj = [ this.p1, this.l, this.bl, this.c, this.label, this.label.label ];
    // state init
    if (this.state == "show") { show(this) }
    if (this.state == "hide") { hide(this) }
    if (this.state != "locked") { makeSwitchable(this.c, this) } 
    // proximity 
    this.loads = []
  }
  data(){ var a = this.d.slice(0); a.push(this.state); return a}
  name(){ return targetName(this) } 
  hasPoint(pt) {return isOn(pt,this.p1)} 
}
// [ "force", "name", [x1, y1], [x2,y2], d , state ]
class force {
  constructor(data) {
    // parameter handling
    this.d = data;
    this.fname = data[1];
    if (data[4]) { this.off = data[4] } else { this.off = 10 }
    if (this.off >= 0) {this.name1 = ""; this.name2 = toTEX(data[1]) } else
      {this.name2 = ""; this.name1 = toTEX(data[1]) }
    if (data[5]) { this.state = data[5] } else { this.state = "locked" }
	// snap and appearance depending on state
    const labelopts = {offset:[this.off,0], autoPosition:true, color:loadColor};
    var pstyle = {snapToGrid:false, size:0, fixed:true, snapToPoints:false, label:labelopts};
    var	hl = false; 
    if (this.state == "active") {
		pstyle = {snapToGrid:true, fixed:false, size:2, snapToPoints:true, 
		attractors:targets, attractorDistance: 0.2, label:labelopts};
		hl = true;
	}
    // start and end point
    this.p1 = board.create('point', data[2], { name: this.name1, 
      ...controlSnapStyle, ...pstyle }); 
    this.p2 = board.create('point', data[3], { name: this.name2, 
      ...controlSnapStyle, ...pstyle }); 
    // configure infobox
    this.p1.dp = [dpx+1,dpy+1];
    this.p2.start = this.p1;
    this.p2.dp = [dpx+1,dpy+1];
    this.p2.ref = function() { return XY(this.start) };
    this.p2.infoboxlabel = "Vektor ";
    if (this.state == "silent") {this.p2.setAttribute({showInfobox:false})}
    // dash
    var d = 0; if (this.state == "dotted") d=2
    // arrow version with fixed:false doesn't snap to grid
    //this.vec = board.create('arrow', [this.p1, this.p2], {
    //  touchLastPoint: true, fixed:false, snapToGrid:true, lastArrow:{size:5, type:2}, highligh    
    this.vec = board.create('arrow', [this.p1, this.p2], {
      touchLastPoint: true, lastArrow:{size:5, type:2}, highlight:hl,
      highlightStrokeColor:highlightColor, strokeColor:loadColor, dash:d});
    this.vec.obj = [this.vec, this.p1, this.p2];
    this.vec.parent = this;  
    // translation by base point drag
    const g = board.create('group', [this.p1, this.p2]);
    g.removeTranslationPoint(this.p2);
    // delete-function
    this.vec.lastclick = Date.now(); 
    //this.vec.on('drag',function() {
    //  vec.point1.snapToGrid(); vec.point2.snapToGrid()})
    this.vec.on('up', function() {
      if (Date.now()-this.lastclick < 500 && this.parent.state == "active") { 
        this.parent.state = "deleted"; cleanUp();
        board.removeObject(this.obj, true);
        update()
      }
    else {this.lastclick = Date.now() } })
    // switch off highlighting if locked
    this.obj = [this.vec, this.p1, this.p2, this.p2.label];
    if (this.state == "locked") { lock(this) } 
    // update conditions
    this.p1.on("up", update )
    this.p2.on("up", update )
    // points for position check
    this.proximityPoints = [this.p1, this.p2];
  }
  data() { return [this.d[0], this.fname, 
    XY(this.p1), XY(this.p2), this.off, this.state ] }
  name() { return toSTACK(this.fname) }
}
// [ "forceGen", "name", [x,y]]
class forceGen {
  constructor(data) {
    // input field
    this.d = data;
    const dy = -20*pxunit, dx = 40*pxunit;
    // HTML trick because input.set() doesn't work in the callback
    const fid = divid+"_fname"; // unique ID for html object even if multiple widgets on a page
    var t = board.create('text', [ data[2][0], data[2][1], 
      '<input type="text" id='+fid+' value="'+data[1]+'" size="1">'], {fixed: true});
    // ref point for checking drag distance
    const ref1 = board.create('point', plus(data[2], [0,dy]), {visible:false});
    const ref2 = board.create('point', plus(data[2], [dx,dy]), {visible:false});
    // arrow
    const p1 = board.create('point', plus(data[2], [0,dy]), { 
      name: '', fixed:false, visible: false });
    const p2 = board.create('point', plus(data[2], [dx,dy]), {
      name: toTEX(document.getElementById(fid).value), fixed:false, visible:false, label:{offset:[5,0], visible:true, color:'gray'} });
    p2.addParents(t);
    var vec = board.create('arrow', [p1, p2], 
      { fixed:false, color:'gray',lastArrow:{size:5, type:2}, highlight:true,
      highlightStrokeColor:highlightColor} );
    // callback creates new force object and new name
    vec.parent = this;
    t.on('out', function(e) {
      p2.setAttribute({name:toTEX(document.getElementById(fid).value) })});
    vec.on('up', function(e) {
      //only generate force if distance is sufficient to not create overlapping objects
      if (ref1.Dist(this.point1)+ref2.Dist(this.point2) >dx) {
      	objects.push(new force(["force", document.getElementById(fid).value, 
          XY(p1), XY(p2), 10, "active"] ));
        // generate new unique force name
        var f = [];
        for (var m of objects) {
          if (m.data()[0] == 'force') { f = f.concat(m.data()[1]) } }
        var i = 1, n = '', found = true;
        while (found ) { n = 'F_'+i.toString();  found = f.includes(n);i ++;} 
        document.getElementById(fid).value = n;
        vec.parent.d[1] = n;
        update();
      }
      // whatever happened, move the arrow back
      p1.setPositionDirectly(JXG.COORDS_BY_USER, XY(ref1), XY(p1) );    
      p2.setPositionDirectly(JXG.COORDS_BY_USER, XY(ref2), XY(p2) );
      p2.setAttribute({name:toTEX(document.getElementById(fid).value) }) });
    }
  data(){  return this.d }
  name(){  return "0" }
}

// [ "frame", "", [ Array of ccordinates ], tension]
class frame {
	constructor(data) {
  	this.d = data;
    if(data[3]){
    	this.t = data[3];
    } else{
    	this.t = 3;
    }
    this.fr = board.create('metapostspline', [data[2], {
		tension: this.t,  // <--- Je höher desto kantiger
  	isClosed: true
		}], {
		strokeColor: 'grey',
  		strokeWidth: 2,
  		dash: 2,
  		points: {visible: false}
});
  }
  data() { return this.d }
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
    if (data[8]) {fx = data[8][0]; fy = data[8][1]; xscale = fx; yscale = fy };
    if (data[9]) {dpx = data[9][0]; dpy = data[9][1] };
    var width = pix*Math.abs(xmax-xmin)
    var height = pix*Math.abs(ymax-ymin)
    // logics of container sizing and grid scaling has changed between 1.2.1 and 1.3.2 and in 2023
    try {
      if (stack_js) {
        // Stack 2023
		// JSXGraph box sizing and coordinate system
        board.resizeContainer(width, height); 
        board.setBoundingBox([xmin, ymax, xmax, ymin ])
        // sizing the wrapper div
        document.getElementById(divid).parentElement.style.width = width.toFixed(0)+"px";
        document.getElementById(divid).parentElement.style.height = height.toFixed(0)+"px";
		// sizing the iframe
        stack_js.resize_containing_frame((width+3).toFixed(0)+"px", (height+3).toFixed(0)+"px");
      }
    } catch (error) {
      if (error instanceof ReferenceError) {
        // older
        if (isNewerVersion ('1.3.1', JXG.version)) {
          board.resizeContainer(width, height,false,true); 
          board.setBoundingBox([xmin, ymax, xmax, ymin ], true)
        } else {
          board.setBoundingBox([xmin, ymax, xmax, ymin ]);
          board.resizeContainer(width, height); 
        }
      }
    }
    // convenience units
    a = 16/pix; 
    pxunit = 1/pix;
    //labelshift = 0.2*a;
    //if (data[1] || data[2]) {board.removeGrids()};
    // Axes specification
    var labelopt;
    if (data[1]) { 
      if (xmin<xmax) {labelopt = {position: 'rt', offset: [-5, 12] } } 
      else {labelopt = {position: 'lft', offset: [-5, 12] }}
      var xaxis = board.create('axis', [[0, 0], [1,0]], 
	    {name:toTEX(data[1]), withLabel: true, label: labelopt, layer:8,
        ticks: { layer:8, generateLabelValue:function(p1,p2) {
	      return ((p1.usrCoords[1]-p2.usrCoords[1])*fx).toFixed(dpx-1)}} });}
    if (data[2]) { 
      if (ymin<ymax) {labelopt = {position: 'rt', offset: [10, 0] } } 
      else {labelopt = {position: 'rt', offset: [10, 0] }}
   	  var yaxis = board.create('axis', [[0, 0], [0,1]], 
	    {name:toTEX(data[2]), withLabel: true, label: labelopt, layer:8,
        ticks: { layer:8, generateLabelValue:function(p1,p2) {
	      return ((p1.usrCoords[2]-p2.usrCoords[2])*fy).toFixed(dpy-1)}} });    
    } 
    // grid to background
    board.grids[0].setAttribute({layer:0});

    // version info
    this.vs = board.create("text", [xmin + 0.5 * a, ymax - 0.5 * a, versionText], 
      {strokeColor: "lightgray", fixed:true});
    this.vs.setPositionDirectly(JXG.COORDS_BY_SCREEN, [10,10]);
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

// line between along x and y data vectors with optional dash style, thickness and color
// [ "line", "color", [x1, x2,...], [y1, y2,...] ,dash, th ]
class line {
 constructor(data) {
   this.d = data;
   if (data[1]) {this.c = data[1]} else {this.c = "black"}
   console.log(this.c)
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
     { dash:d, strokeColor:this.c, strokeWidth:this.th, layer:8}); 
   // add to attractor list, to be used by crosshair
   targets.push(this.p);
 }
 data(){ return this.d }
 name(){  return "0" }
}
//[ "line2P", "label", [x1,y1],[x2,y2], f ]// f is ignored, set scale using "grid"
//[ "line2P", "label", [x1,y1],[x2,y2], "normal" ]//
class line2p {
  constructor(data){
    this.d = data.slice(0); //make a copy
    this.f = xscale;
    this.p1 = board.create('point', mult( 1/this.f, data[2] ), { 
    	label:{visible:false}, attractors:targets,...controlSnapStyle }); 
    this.p2 = board.create('point', mult( 1/this.f, data[3] ), { 
    	label:{visible:false}, attractors:targets,...controlSnapStyle }); 
    this.g = board.create('line', [this.p1, this.p2], { fixed:false,
      strokecolor: movableLineColor, strokeWidth:1, 
      highlight:true, highlightStrokeColor:highlightColor, 
      name:data[1],withLabel:true});
    for (var pt of [this.p1, this.p2]) {	pt.scale = [this.f,this.f] }
    this.p1.on("up", update );
    this.p2.on("up", update );
    // if required, add normal
    if (typeof(data[4]) === 'string')  {
      this.n = board.create('perpendicular',[this.g, this.p1], { fixed:false,
      strokecolor: movableLineColor, strokeWidth:1, 
      highlight:true, highlightStrokeColor:highlightColor, 
      name:data[4],withLabel:true});
      this.a = board.create('angle', [this.n, this.g, 1,1], {radius:0.5, withLabel:false })
    }     
  }
  data(){ 
    var ans = this.d; 
    ans[2] = [this.p1.X()*this.f,this.p1.Y()*this.f];
    ans[3] = [this.p2.X()*this.f,this.p2.Y()*this.f];
    return ans } 
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
      name:toTEX(data[1]), 
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
    if (data[5]) { this.state = data[5] } else { this.state = "locked" }
    var fix = true, size = 0, hl = false;
    if (this.state == "active") {fix = false; size = 2; hl = true} 
    this.p1 = board.create('point', data[2], {
      name: '', ...controlSnapStyle, fixed:fix, size:size });
    this.p2 = board.create('point', data[3], {
      name: '', ...controlSnapStyle, fixed:fix, size:size });
    this.p3 = board.create('point', data[4], { name: toTEX(this.mname), 
    ...controlSnapStyle, fixed:fix, size:size,
      label:{offset:[0,0], autoPosition:true, color:loadColor} });
    this.arc = board.create('minorArc', [this.p1, this.p2, this.p3], {
      fixed: true, strokeWidth: 2, highlight:hl, highlightStrokeColor:highlightColor,
      lastArrow: {type: 2, size: 5 }, strokeColor:loadColor });
    var g = board.create('group', [this.p1, this.p2, this.p3, this.arc]);
    g.removeTranslationPoint(this.p2);
    g.removeTranslationPoint(this.p3);
    // delete-function
    this.arc.obj = [this.arc, this.p1, this.p2, this.p3 ];
    this.arc.parent = this;
    this.arc.lastclick = Date.now();    
    this.arc.on('up', function() {
    if (Date.now()-this.lastclick < 500) { 
       this.parent.state = "deleted"; cleanUp();
       board.removeObject(this.obj, true); update()
        }
    else {this.lastclick = Date.now() }})
    // switch off highlighting if locked
    this.obj = [this.p1, this.p2, this.p3, this.arc,this.p3.label];
    if (this.state == "locked") { lock(this) } 
    // update condition
    this.p1.on("up", update )
    this.p2.on("up", update )
    this.p3.on("up", update )
    // Points for proximity check
    this.proximityPoints = [this.p1, this.p1];

  }
  data() { return [this.d[0], this.mname, XY(this.p1), XY(this.p2), XY(this.p3), this.state ]  }
  name() {return toSTACK(this.mname) }
}
// [ "momentGen", "name", [x,y]]
class momentGen {
  constructor(data) {
    // input field
    this.d = data;
    const dy = -5*pxunit, dx = 15*pxunit, dy1 = -20*pxunit;
    // HTML trick because input.set() doesn't work in the callback
    const mid = divid+'m_name';
    var t = board.create('text', [ data[2][0], data[2][1], 
      '<input type="text" id='+mid+' value="'+data[1]+'" size="1">'], {fixed: true});
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
      name: toTEX(document.getElementById(mid).value), fixed:false, visible:false, label:{offset:[5,0], visible:true, color:'gray'} });
    p2.addParents(t);
    var arc = board.create('minorArc', [p1, p2, p3], { 
      fixed:false, strokeColor:'gray', strokeWidth: 2, 
      highlight:true, highlightStrokeColor:highlightColor,
      lastArrow: { type: 2, size: 5}});
    // callback creates new moment object and new name
    arc.parent = this;
    t.on('out', function(e) {
      p3.setAttribute({name:toTEX(document.getElementById(mid).value )})});
    arc.on('up', function(e) {
      //only generate force if distance is sufficient to not create overlapping objects
      if (ref2.Dist(p2) >dx) {
        objects.push(new moment(["moment", document.getElementById(mid).value, 
          XY(p1), XY(p2), XY(p3), "active"] ));
        // generate new unique moment name
        var f = [];
        for (var m of objects) {
          if (m.data()[0] == 'moment') { f = f.concat(m.data()[1]) } }
        var i = 1, n = '', found = true;
        while (found ) { n = 'M_'+i.toString();  found = f.includes(n);i ++;} 
        document.getElementById(mid).value = n;
        arc.parent.d[1] = n;
        update();
      }
      // whatever happened, move the arc back
      p1.setPositionDirectly(JXG.COORDS_BY_USER, XY(ref1), XY(p1) );
      p2.setPositionDirectly(JXG.COORDS_BY_USER, XY(ref2), XY(p2) );
      p3.setPositionDirectly(JXG.COORDS_BY_USER, XY(ref3), XY(p3) );
      p3.setAttribute({name:toTEX(document.getElementById(mid).value)}) });
    }
  data(){  return this.d }
  name(){  return "0" }
}
//  node with label
class node {
  constructor(data) {
    this.d = data;
    if (data.length > 3) {this.dist = data[3]} else {this.dist = 10};
    if (data.length > 4) {this.lc = data[4]; this.fc= data[4]} else {this.lc ="black"; this.fc = "white"};
    // node
    this.p1 = board.create('point', data[2],  {name:toTEX(data[1]), 
      label:{autoPosition:true, offset:[0,this.dist], strokeColor:this.lc}, ...nodeStyle, fillcolor:this.fc} );
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
    this.p1 = board.create('point', data[2],  {name:toTEX(data[1]), 
      label:{autoPosition:true, offset:[0,this.dist]}, ...pointStyle} );
    // label
  }
  data() { return this.d }
  name() { return '"'+this.d[1]+'"'}
}
// grau gefülltes Polygon mit schwarzem Rand. Z.B. für Scheiben oder Balken
// Version with hole adapted from https://github.com/Niclas17/meclib 
// gray filled polygon with black border
  class polygon {
    constructor(data) {
      let pstyle = {
        opacity: true,
        fillcolor: 'lightgray',
        vertices: {
          size: 0,
          fixed: true
        },
        borders: normalStyle,
        hasInnerPoints: true
      }
      // if last argument is a string, use it as state flag and remove from list
      if (typeof(data[data.length - 1]) == 'string') {
        this.state = data.pop()
      } else {
        this.state = "locked"
      }
      // data for name()
      this.loads = [];
      this.d = data.slice(0);
      // geometric data
      this.v = data.slice(2);
      // we assume that a polygon has more than 2 points
      // if v[0] has more than two entries, it is a list of points (new format), otherwise it is a point (old format)
      if (this.v[0].length > 2){
        // new format, can have holes
        this.clines = []                         // storage for connector lines
        this.path = this.v.shift()               // store outer contour (counterclöckwise)
        this.path.push(this.path[0])             // close the contour by repeating the first point
        for (const border of this.v) {           // iterate over inner contours      
          this.clines.push(this.path.length-1)   // store connection line 
          this.path = this.path.concat(border)   // add contour
          this.path.push(border[0])              // close contour
          this.clines.push(this.path.length-1)   // store conection line
        } 
        // Create the polygon 
        this.p = board.create('polygon', this.path, pstyle);
        // suppress the connector lines
        for (const i of this.clines)
          this.p.borders[i].setAttribute({visible:false});
      // old format, just a single contour
      } else this.p = board.create('polygon', this.v, pstyle);
      // switching objects
      this.obj = [this.p].concat(this.p.borders);
      // state init
      if (this.state == "show") show(this)
      if (this.state == "hide") hide(this)
      if (this.state != "locked") makeSwitchable(this.p, this)
    }
    hasPoint(pt) {
      return isOn(pt, this.p)
    }
    data() {
      var a = this.d.slice(0);
      a.push(this.state);
      return a
    }
    name() {
      return targetName(this)
    }
  }

// line load 
// line load perpendicular to the line
// [ "q", "q1","q2", [x1, y1], [x2,y2], q1, q2, phi, state ]
class q {
  constructor(data){
    this.d = data.slice(0);
    if (data[8]) {this.state = data[8]} else {this.state = "locked"}
    this.name1 = data[1];  this.name2 = data[2];
    [this.width, this.alpha] = polar( minus( data[4], data[3] ));
    if (data[7]) {this.phi = data[7]*deg2rad} else {this.phi=0} //Abweichung zur Normalen
    this.n = data[5];
    this.m = (data[6]-data[5])/this.width;
    // end of input processing
    this.sin = [Math.sin(this.alpha+this.phi), Math.sin(this.alpha)]; 
    this.cos = [Math.cos(this.alpha+this.phi), Math.cos(this.alpha)];
    this.arrow = []; this.p = []; this.label = []; this.loads = [];   
    for (this.i=0;this.i<=(this.width/a);this.i++) {
      this.p.push(
        [ 0, this.m*((this.i)*this.width/Math.floor(this.width/a))+this.n ]);
      this.p.push([0, 0]);
      for (this.j=0;this.j<=1;this.j++) {
        this.p[2*this.i+this.j] = [
          this.p[2*this.i+this.j][0]*this.cos[this.j]-this.p[2*this.i+this.j][1]*this.sin[this.j]+data[3][0]+this.cos[1]*(this.i*this.width/Math.floor(this.width/a)),
          this.p[2*this.i+this.j][0]*this.sin[this.j]+this.p[2*this.i+this.j][1]*this.cos[this.j]+data[3][1]+this.sin[1]*(this.i*this.width/Math.floor(this.width/a)) ] }
      this.arrow.push(board.create('arrow', [ this.p[2*this.i], this.p[2*this.i+1] ],
        {lastarrow:{size:5}, strokewidth:1, strokeColor:loadColor})) }
    this.polygon = board.create('polygon', 
      [ this.p[0],this.p[1],this.p[this.p.length-1],this.p[this.p.length-2] ],
      { fillcolor:'#0000ff44', fillOpacity:1, strokecolor:loadColor, fixed:true, hasInnerPoints:true,
        vertices:{visible:false}, borders:{fixed:true} });
    this.label.push(board.create('point',this.p[0],
      { name:toTEX(this.name1), size:0, fixed:true,
        label:{autoPosition:true,offset:[-5,5],color:loadColor} }));
    this.label.push(board.create('point',this.p[this.p.length-2], 
      { name:toTEX(this.name2), size:0, fixed:true,
        label:{autoPosition:true, offset:[5,5], color:loadColor} }));
    // implement state switching
    this.obj = this.arrow.concat([this.polygon, this.label[0].label, this.label[1].label]); 
    this.obj = this.obj.concat(this.polygon.borders); 
    // state init
    if (this.state == "show") { show(this) }
    if (this.state == "hide") { hide(this) }
    if (this.state != "locked") { makeSwitchable(this.polygon, this) }
  } 
  data(){ var a = this.d.slice(0); a[8] = this.state; return a}
  name(){ return targetName(this) } 
  hasPoint(pt) {return isOn(pt,this.polygon)} 
}
// rope, tangent line to two circles ["rope", "name",[x1,y1], r1, [x2,y2],r2 ]
// negative r values select the tangent point on the left side from the line p1-p2
class rope {
  constructor(data) {
    if (typeof(data[data.length-1]) == 'string') {this.state = data.pop()}
      else {this.state = "locked"}
    this.d = data;
    const v = minus( data[4], data[2] );
    //const dx = data[4][0]-data[2][0];
    //const dy = data[4][1]-data[2][1];
    const [le, a0] = polar( v );
    //const a0 = Math.atan2(dy,dx);
    //const le = Math.sqrt(dx**2+dy**2);
    const r1 = data[3];
    const r2 = data[5];
    const a1 = Math.acos((r1-r2)/le);
    const p1 = plus( data[2], rect( r1, a0-a1) );
    const p2 = plus( data[4], rect( r2, a0-a1) ) 
    this.l = board.create('segment', [ p1,p2 ],
      {name: data[1], layer: defaultMecLayer, withLabel:true,
       ...normalStyle, label:{offset:[0,8],autoPosition:false}});
    targets.push(this.l);
    // snap targets
    this.p1 = board.create('point', p1, {name: '', ...silentPStyle } );
    this.p2 = board.create('point', p2, {name: '', ...silentPStyle } );
    // implement state switching
    this.obj = [ this.l, this.l.label ]; 
    // state init
    if (this.state == "show") { show(this) }
    if (this.state == "hide") { hide(this) }
    if (this.state != "locked") { makeSwitchable(this.l, this) }

    this.loads = []
  }
  data(){ var a = this.d.slice(0); a.push(this.state); return a}
  name(){ return targetName(this) } 
  hasPoint(pt) {return isOn(pt,this.l) && 
    JXG.Math.Geometry.distPointLine(
      [1,pt.X(),pt.Y()], this.l.stdform) < tolPointLine} 
}//rot
class rot {
  constructor(data) {
  this.d = data;
    this.p1 = board.create('point', data[2], { fixed:true, size:0 , name: '' });
    this.p2 = board.create('point', data[3], { fixed:true, size:0 , name: '' }); 
    // label
    this.p3 = board.create('point', data[4], {    
      name:toTEX(data[1]) ,size:0, label:{offset:[0,0],color:'red'}});
    this.arc = board.create('minorArc', [this.p1, this.p2, this.p3], {
     ...thinStyle, fixed: true, lastArrow: { type: 1, size: 6 }, strokeColor:"red" });
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
    var yStyle = {name: '', fixed: false ,size:6, color:'red',fillOpacity:0, snapToGrid:true};
    var dyStyle = { name: '', fixed: false, snapToGrid:true }
    if (this.state == "pure") {
      yStyle = {name: '', fixed: true ,size:0, color:'red',fillOpacity:0, snapToGrid:false};
      dyStyle = { name: '', fixed: true, snapToGrid:false }
    }
    // vertical slide lines
    this.v1 = board.create('line',[P1,plus(P1,[0,1])], {visible:false, fixed:true});
    this.v2 = board.create('line',[P2,plus(P2,[0,1])], {visible:false, fixed:true});
    // sliding points
    this.p1 = board.create('glider',[P1[0], P1[1],this.v1], yStyle);
    this.p2 = board.create('glider',[P2[0], P2[1],this.v2], yStyle);
    // tangent points
    this.pt1 = board.create('point',PT1, dyStyle);
    this.pt2 = board.create('point',PT2, dyStyle);
    // tangent lines
    this.t1 = board.create('segment',[this.p1, this.pt1], {fixed:false, strokecolor:'black', strokewidth: 1});
    this.t2 = board.create('segment',[this.p2, this.pt2], {fixed:false, strokecolor:'black', strokewidth: 1});
    // decorations
    this.v1 = board.create('segment',[this.p1, [P1[0],this.P[1]]], {fixed:true, strokecolor:'black', strokewidth: 1});
    this.v2 = board.create('segment',[this.p2, [P2[0],this.P[1]]], {fixed:true, strokecolor:'black', strokewidth: 1});
    this.v3= board.create('segment',[[P1[0],this.P[1]], [P2[0],this.P[1]]], {fixed:true, strokecolor:'black', strokewidth: 1});
    //this.g1 = board.create('group', [this.p1, this.pt1] ).removeTranslationPoint(this.pt1);
    //this.g2 = board.create('group', [this.p2, this.pt2] ).removeTranslationPoint(this.pt2);
    this.graph = board.create('functiongraph', [hermiteplot(this.P,this.p1, this.p2, this.pt1, this.pt2), this.p1.X(), this.p2.X()], { strokecolor: movableLineColor, strokewidth: 3  });
    // configure infoboxes
    this.p1.ref = this.P;
    this.p2.ref = this.P;
    if (typeof data[7] != 'string') 
      {this.p1.scale = data[7][1]; this.p2.scale = data[7][1];
       this.pt1.scale = data[7][1]; this.pt2.scale = data[7][1];
       this.p1.dp = data[7][2]; this.p2.dp = data[7][2];
       this.pt1.dp = data[7][2]; this.pt2.dp = data[7][2]};
    // configure info box for the tangent lines
    this.pt1.start = this.p1;
    this.pt2.start = this.p2;
    this.pt1.ref = function() { return XY(this.start) };
    this.pt2.ref = function() { return XY(this.start) };
    this.pt1.infoboxlabel = "Delta ";
    this.pt2.infoboxlabel = "Delta ";
    // state init
    this.obj = [ this.p1, this.p2, this.pt1, this.pt2 ];
    if (this.state == "active") { activate(this) }
    if (this.state == "inactive") {deactivate(this) }
    if (this.state == "locked") { 
      deactivate(this); this.state = "locked" ;  
      this.graph.setAttribute({strokeColor:'black'} ); }
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
    if (this.state == "active" || this.state == "inactive") {makeSwitchable(this.graph, this)};
    this.graph.setAttribute({highlightFillOpacity:0});
    // trigger update on changes
    this.p1.on('up', (function() { console.log("p1");
   update()}) );
    this.p2.on('up', (function() { console.log("p2");
   update()}) );
    this.pt1.on('up', (function() { console.log("pt1");
   update()}) );
    this.pt2.on('up', (function() { console.log("pt2");
   update()}) );
    // add to attractor list, to be used by crosshair
    targets.push(this.graph);
  }
  data() {  return [
      "spline",
      this.d[1],
      this.d[2],
      minus( XY(this.p1), this.d[2]),
      minus( XY(this.p2), this.d[2]),
      minus( XY(this.pt1), this.d[2]),
      minus( XY(this.pt2), this.d[2]),
      this.style,
      this.state
    ];  }
  name() { return hermitename(this.P,this.p1, this.p2, this.pt1, this.pt2) }
}
// compressive spring, ["springc", "k", [x1,y1], [x2,y2], r, n, off]
class springc {
  constructor(data){
    if (typeof(data[data.length-1]) == 'string') {this.state = data.pop()}
      else {this.state = "locked"}
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
    this.line = board.create('curve',[ px, py ], normalStyle );
    // label
    this.lbl = board.create('point',[x+dx/2-dy/l*this.off, y+dy/2+dx/l*this.off], {    
      name: toTEX(data[1]) , ...centeredLabelStyle });
    // logging
    console.log("springc", data[1], data[2], data[3], r,  Math.floor(this.n/2), this.off);
    // implement state switching
    this.obj = [ this.line, this.lbl.label ]; 
    // state init
    if (this.state == "show") { show(this) }
    if (this.state == "hide") { hide(this) }
    if (this.state != "locked") { makeSwitchable(this.line, this) }
    this.line.setAttribute({highlightFillOpacity:0});
    // snap points
    this.p1 = board.create('point',this.d[2], silentPStyle );
    this.p2 = board.create('point',this.d[3], silentPStyle );
    this.s = board.create('segment', [this.p1,this.p2],{strokeWidth:0});
    targets.push(this.s);
    this.loads = []
  }
  data(){ var a = this.d.slice(0); a.push(this.state); return a}
  name(){ return targetName(this) } 
  hasPoint(pt) {return (isOn(pt,this.s) || isOn(pt,this.p1)) && 
    JXG.Math.Geometry.distPointLine(
      [1,pt.X(),pt.Y()], this.s.stdform) < tolPointLine} 
}

//tensile spring
// [ "springt", "name", [x1,y1], [x2,y2], r, proz, n, offset ]
class springt {
  constructor(data){
    // Parameter handling
    if (typeof(data[data.length-1]) == 'string') {this.state = data.pop()}
      else {this.state = "locked"}
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
    this.line = board.create('curve',[ px, py ], normalStyle );
    // label
    this.lbl = board.create('point',[x+dx/2-dy/l*this.off, y+dy/2+dx/l*this.off], {    
      name: toTEX(data[1]),  ...centeredLabelStyle });
    // snap targets
    board.create('point', data[2], {name: '', ...silentPStyle } );
    board.create('point', data[3], {name: '', ...silentPStyle } );
	  // logging
    console.log("springt", data[1], data[2], data[3], r, pr,  Math.floor(this.n/2), this.off);
    // implement state switching
    this.obj = [ this.line, this.lbl.label ]; 
    // state init
    if (this.state == "show") { show(this) }
    if (this.state == "hide") { hide(this) }
    if (this.state != "locked") { makeSwitchable(this.line, this) }
    this.line.setAttribute({highlightFillOpacity:0});
    // snap points
    this.p1 = board.create('point',this.d[2], silentPStyle );
    this.p2 = board.create('point',this.d[3], silentPStyle );
    this.s = board.create('segment', [this.p1,this.p2],{strokeWidth:0});
    targets.push(this.s);
    this.loads = []
  }
  data(){ var a = this.d.slice(0); a.push(this.state); return a}
  name(){ return targetName(this) } 
  hasPoint(pt) {return (isOn(pt,this.s) || isOn(pt,this.p1)) && 
    JXG.Math.Geometry.distPointLine(
      [1,pt.X(),pt.Y()], this.s.stdform) < tolPointLine} 
}
// [ "wall", "name", [x1, y1], [x2,y2] , angle ]
class wall {
  constructor(data) {
    if (typeof(data[data.length-1]) == 'string') {this.state = data.pop()}
      else {this.state = "locked"}
    this.d = data;
    // dependent objects
    this.bl = board.create('segment', [data[2],data[3]], {name: '', ...normalStyle});
    this.c = board.create("comb", [data[2],data[3]], {
      ...hatchStyle(), angle: data[4]*deg2rad })
    // state switching
    this.obj = [ this.bl, this.c ]; 
    if (this.state == "show") { show(this) }
    if (this.state == "hide") { hide(this) }
    if (this.state != "locked") { makeSwitchable(this.c, this) }
    this.loads = []
  }
  data(){ var a = this.d.slice(0); a.push(this.state); return a}
  name(){ return targetName(this) } 
  hasPoint(pt) {return isOn(pt,this.bl) && 
    JXG.Math.Geometry.distPointLine(
      [1,pt.X(),pt.Y()], this.bl.stdform) < tolPointLine } 
}

function init() {
  let state;
  if (stateRef) {
    stateInput = document.getElementById(stateRef);
    if (stateInput.value && stateInput.value != '') {
      state = JSON.parse(stateInput.value); } else { state = JSON.parse(initstring); }
   } else { state = JSON.parse(initstring) }
  //console.log("OK");
  var m;
  for (m of state) {
    console.log(m);
    switch (m[0]) {
      case "angle":     objects.push(new angle(m)); break;
      case "angle1":    objects.push(new angle(m)); break;
      case "angle2":    objects.push(new angle(m)); break;
      case "bar":	    objects.push(new bar(m)); break;
      case "beam":	    objects.push(new beam(m)); break;
      case "circle":	objects.push(new circle(m)); break;
      case "circle2p":	objects.push(new circle2p(m)); break;
      case "crosshair":	objects.push(new crosshair(m)); break;
      case "dashpot":	objects.push(new dashpot(m)); break;
      case "dim": 		objects.push(new dim(m)); break;
      case "dir": 		objects.push(new dir(m)); break;
      case "disp": 		objects.push(new disp(m)); break;
      case "fix1": 	  	objects.push(new fix1(m)); break;
      case "fix12": 	objects.push(new fix12(m)); break;
      case "fix123": 	objects.push(new fix123(m)); break;
      case "fix13": 	objects.push(new fix13(m)); break;
      case "force": 	objects.push(new force(m)); break;
      case "forceGen":  objects.push(new forceGen(m)); break;
      case "frame": 	objects.push(new frame(m)); break;
      case "grid":  	objects.push(new grid(m)); break;
      case "label":   	objects.push(new label(m)); break;
      case "line": 		objects.push(new line(m)); break
      case "line2p": 	objects.push(new line2p(m)); break
      case "mass": 		objects.push(new mass(m)); break;     
      case "moment":  	objects.push(new moment(m)); break;
      case "momentGen":	objects.push(new momentGen(m)); break;
      case "node":      objects.push(new node(m)); break;
      case "point":     objects.push(new point(m)); break;
      case "polygon":   objects.push(new polygon(m)); break;
      case "q":  	    objects.push(new q(m)); break;
      case "rope":      objects.push(new rope(m)); break;
      case "rot":       objects.push(new rot(m)); break;
      case "spline":  	objects.push(new spline(m)); break;
      case "springc":   objects.push(new springc(m)); break;
      case "springt":  	objects.push(new springt(m)); break;
      case "wall": 		objects.push(new wall(m)); break;
	  default: console.log("Unknown object",m);
    }
  }
}

function update() {
  console.log(stateRef);
  if (!stateRef) { return }
  console.log("update")
  var m;
  var dfield = [];
  var names = "[";
  // get list of loads and targets 
  const load = [ "force", "moment"];
  const target = ["bar", "beam", "circle", "fix1", "fix12", "fix123", "fix13", "rope",
    "dashpot", "springc", "springt", "wall", "polygon", "q" ];
  let loadlist = [], targetlist = [];
  for (let i = 0; i < objects.length; i++) {
    if (load.includes( objects[i].data()[0] )) { loadlist.push(i)}
    if (target.includes( objects[i].data()[0] ) && objects[i].state == 'hide') { // only hidden targets
      targetlist.push(i); objects[i].loads = []} // empty load list
    }
  console.log(targetlist)
  // establish proximity relations
  for (let L of loadlist) { 
    for (let T of targetlist) {
      // add load if it is active and has at least one proximity point on target
      try {
        if (objects[L].state=="active" && 
            ( objects[T].hasPoint(objects[L].proximityPoints[0]) || 
            objects[T].hasPoint(objects[L].proximityPoints[1]) ) ) {
          console.log( objects[L].name() + " is on "+ T.toString() );
          objects[T].loads.push(L+1)} // Maxima indices are base 1, therefore increase the index
        }
      catch (err) {console.log(L,T,err.message)}
  } }
    
  
  // generate output   
  for (m of objects) {
    dfield.push(m.data());
    if (names != "[") { names = names.concat(",") }
    names = names.concat(m.name()); }
  // write output
  names = names.concat("]");
  if (mode == "jsfiddle") {
    stateInput.innerHTML = JSON.stringify(dfield);
    document.getElementById(fbd_names).innerHTML = names}
  else {
    stateInput.value = JSON.stringify(dfield);
    stateInput.dispatchEvent(new Event('change'));
    document.getElementById(fbd_names).value = names;
    document.getElementById(fbd_names).dispatchEvent(new Event('change'))}
    
}

function cleanUp() {
  // remove deleted objects from the list
  for (let i = 0; i < objects.length; i++) {
    let d = objects[i].data();
    if (d[d.length-1] == 'deleted') {objects.splice(i,1); i--;}
  }
}
// math helper functions
function rect(r,alpha) { return [ r*Math.cos(alpha), r*Math.sin(alpha) ] }
function polar(a) { return [ Math.sqrt( a[0]**2 + a[1]**2 ), Math.atan2(a[1], a[0]) ] }
function XY(p) { return [p.X(), p.Y() ] }
function mult(f,a) { return [ a[0]*f, a[1]*f ] }
function plus(a,b) { return [ a[0]+b[0], a[1]+b[1] ] }
function minus(a,b) { return [ a[0]-b[0], a[1]-b[1] ] }
function dist(a,b) { return Math.sqrt( (a[0]-b[0])**2 + (a[1]-b[1])**2 ) }
// function for string conversion
// converts whitespace to stars, avoids empty strings
function toSTACK(str) { 
  var st = str.replace(/\s+/g, "*");
  if (st === "") {st = "NONAME"}
  return st
}
function toTEX(str) { 
  if (str.search("_") != -1) { 
    str = str.replaceAll(/_([0-9a-z]+)/ig, '_{\$1}'); // subscript brackets
  };
  str = '\\('+str.replace(/[\*\s]/g, "\\;")+'\\)'; // converts stars to small math spaces and adds math mode brackets
  return  str}
// functions for proximity check (Allfred Wassermann, 2022-12-13)
function isOn(pt, po) {return pt.isOn(po, tolPointLine) }	
function targetName(obj) {if (obj.loads[0]) {return '['+obj.loads+']'} else {return '"'+obj.state+'"' } } 
// functions for splines
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
  if (Math.abs(p1.X()-t1.X())<tol) {d1 = NaN};
  var d2 = (p2.Y()-t2.Y())/(p2.X()-t2.X());
  if (Math.abs(p2.X()-t2.X())<tol) {d2 = NaN};
  var c = hermite(x1,dx,y1,dy,d1,d2);
  if (!isNaN(c[0]+c[1]+c[2]+c[3])) {
    var n = c[3].toFixed(5) + "*x^3+" + c[2].toFixed(5) + "*x^2+" + c[1].toFixed(5) + "*x+" + c[0].toFixed(5);
    return n.replace(/\+\-/g,"-")  } 
  else {return "NaN"}
}
// functions for state switching
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
// sets a state switch callback to element el in object obj
function makeSwitchable(el, obj) {
  //switch by doubleclick
  el.setAttribute({highlight:true});
  el.setAttribute({highlightStrokeColor:highlightColor});
  el.setAttribute({highlightFillColor:highlightColor});
  el.setAttribute({highlightFillOpacity:0.5});
  el.parent = obj;
  el.lastclick = Date.now();    
  el.on('up', function() {
    if (Date.now()-el.lastclick < 500) { Switch(obj) }
      else {el.lastclick = Date.now() }})
}
// https://stackoverflow.com/questions/6832596/how-to-compare-software-version-number-using-js-only-number
function isNewerVersion (oldVer, newVer) {
	const oldParts = oldVer.split('.')	
	const newParts = newVer.split('.')
	for (var i = 0; i < newParts.length; i++) {
		const a = newParts[i] // parse int
		const b = oldParts[i] // parse int
		if (a > b) return true
		if (a < b) return false
	}
	return false
}

// initialization
var objects = [];
var targets = []; /* for sliding of points */
init();
update();

