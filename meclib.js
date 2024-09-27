// https://github.com/mkraska/meclib/wiki
// version info
const versionText= "JXG "+JXG.version+" Meclib 2024 09 24";
const highlightColor = "orange";
const movableLineColor = "blue";
const loadColor = "blue";
const defaultMecLayer = 6;
let pxunit = 1/40; // is reset by "grid"
let a = 16*pxunit; // is reset by "grid"
const deg2rad = Math.PI/180, rad2deg = 180/Math.PI;
const tolPointLine = 0.001;
let xscale = 1, yscale = 1; // default scale for infobox, can be modified by "grid"
let dpx = 1, dpy = 1; // default decimal precision for infobox, can be modified by "grid"
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
// suppress automatic labels
JXG.Options.point.name = ""; 
// highlighting is activated explicitly for interactive objects
JXG.Options.curve.highlight = false;
JXG.Options.label.highlight = false;
JXG.Options.text.highlight = false;
JXG.Options.circle.highlight = false;
JXG.Options.line.highlight = false;
JXG.Options.polygon.highlight = false;
JXG.Options.polygon.borders.highlight = false;
JXG.Options.point.highlight = false;
// grid control
JXG.Options.axis.ticks.insertTicks = false;
JXG.Options.grid.drawZero = true;


// Styles
const [nodeStyle, pointStyle, silentPStyle, controlSnapStyle, barStyle, normalStyle, thinStyle, hatchStyle] = [
// nodes (hinges)
{ fillcolor: 'white', strokeColor: 'black', size: 2, strokeWidth: 1.5 },
// points (black dots)
{ fillcolor: 'black', strokeColor: 'black', size: 1, strokeWidth: 1 },
// invisible points with infobox
{ size: 0, withLabel: false },
// grid snap for control points
{ snapToGrid: true, snapToPoints: true, attractorDistance: 0.2, fixed: false, layer: 11 },
// Style for bars
{ strokewidth: 4, strokecolor: "black" },
// Normal line (body outline)
{ strokeWidth: 2, strokeColor: 'black', lineCap: 'round' },
// helper line
{ strokeWidth: 1, strokeColor: 'black', lineCap: 'round' },
// hatch style, must be a function because depending on pxunit
() => ({ fixed: true, width: 5 * pxunit, frequency: 5 * pxunit, angle: 45 * deg2rad, layer: 8, strokeColor: 'black' })
]; 

const board = JXG.JSXGraph.initBoard(divid, {
  boundingbox: [-5, 5, 5, -5], //default values, use "grid" to customize
  axis: false, grid:true, showNavigation:false, showCopyright:false, 
  keepAspectRatio:false, resize: {enabled: false, throttle: 200},
  pan: {enabled:false}, //suppress uninteded pan on touchscreens
  keyboard:{enabled:false} //would spoil textinput in momentGen and forceGen
});

let state;
let stateInput;
// make infobox optionally relative to a given point (define p.ref to [xref, yref])
board.infobox.distanceY = 20;
//board.infobox.setAttribute({highlight:false});
board.highlightInfobox = function(x, y , el) {
    let ref = [0,0];
    let scale = [xscale,yscale];
    let dp = [dpx,dpy];
    let lbl = '';
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
   this.p1 = board.create('point', data[2], {size:3, name:'p1', fixed:false, visible:false}); 
   this.p3 = board.create('point', data[3], {size:3, name:'p3', fixed:false, visible:false}); 
   this.c2 = board.create('circle', [this.p1, this.p3], {opacity:0.5, visible:false});
   this.l1 = board.create('segment', [this.p1, this.p3], {withlabel:false, ...thinStyle});
   // second line
   const a0 = this.l1.getAngle();
   console.log('here is a0:' + a0);
   const le = this.l1.L();
   const a1 = a0+data[5]*deg2rad;
   this.ln = board.create('line', [this.p1, plus(XY(this.p1), rect(le,a1))], {withlabel:false, ...thinStyle, straightFirst:true, visible:false});	
	 this.in2 = board.create('intersection', [this.ln, this.c2], {visible:false});
   this.p2 = board.create('glider', [this.in2.X(), this.in2.Y(), this.c2], {fixed:false, name:'p2', visible:false});
	 this.l2 = board.create('segment', [this.p1, this.p2], {withlabel:false, ...thinStyle});
   // arc with arrows
   this.p4 = board.create('point', plus( XY(this.p1), rect(data[4],a0) ), {visible:false, name:'p4'}); 
   this.c1 = board.create('circle', [this.p1, this.p4], {opacity:0.5, visible:false});
   this.int1 = board.create('intersection', [this.c1, this.l1], {name:'int1', visible:false}); 
   this.int2 = board.create('intersection', [this.c1, this.l2], {name:'int2', visible:false});
   if (data[0] == "angle" ) {
     this.arc = board.create('minorArc', [this.p1, this.int1, this.int2], 
       { ...thinStyle } ) }
   if (data[0] == "angle1" ) { 
     this.arc = board.create('minorArc', [this.p1, this.int1, this.int2], 
       { ...thinStyle, lastArrow:{type: 1, size: 6}})}
   if (data[0] == "angle2" ) {
     this.arc = board.create('minorArc', [this.p1, this.int1, this.int2], 
       { ...thinStyle, firstArrow:{type: 1, size: 6},lastArrow:{type: 1, size: 6}})}
   // label
   this.mp = board.create('midpoint', [this.int1, this.int2], {visible:false, name:'mp'});
   this.bis = board.create('line', [this.mp, this.p1], {visible:false}); //bisector
   const al = (a0+a1)/2; // angular position of label
   if (data[1] == ".") {
     const rl = data[4]*0.6;
     this.pr = board.create('point', plus(XY(this.p1), rect(rl,al)), {visible:false, name:'pr'});
     this.cl = board.create('circle', [this.p1, this.pr], {strokeColor:'red', opacity:0.5, visible:false} );
     this.p5 = board.create('intersection', [this.bis, this.cl, 1], { name:"" , showInfobox:false, fillcolor:'black',strokeColor:'black',size:0.5, strokeWidth:0}); 
   }
   else {
     const rl = data[4]+10*pxunit;
     this.pr = board.create('point', plus(XY(this.p1), rect(rl,al)), {visible:false, name:'pr'});
     this.cl = board.create('circle', [this.p1, this.pr], {strokeColor:'red', opacity:0.5, visible:false} );
     this.p5 = board.create('intersection', [this.bis, this.cl, 1], {name:toTEX(data[1]), showInfobox:false, size:0}); 
   }
    // Enable object animation
    this.p0 = board.create('point', [0,0], {fixed:true, visible:false, name:'p0'});
    const diffX = this.p1.X() - this.p0.X();
    const diffY = this.p1.Y() - this.p0.Y();
    const t1 = board.create('transform', [() => this.p1.X() - diffX, () => this.p1.Y() - diffY], {type: 'translate'});
    t1.bindTo([this.in2, this.p3, this.p4, this.pr]); 
 }
 data() {return this.d}
 name() {return '"'+this.d[1]+'"'}
}

// Fachwerkstab
class bar {
 constructor(data) {
   this.state = (typeof data[data.length-1] == 'string') ? data.pop() : "SHOW";
   this.d = data.slice(0);
   // line
   this.p1 = board.create('point',data[2],{withlabel:false, ...nodeStyle, fixed:true});
   this.p2 = board.create('point',data[3],{withlabel:false, ...nodeStyle, fixed:true});
   this.l = board.create('line', [this.p1, this.p2], {visible:false});
   this.mp = board.create('midpoint', [this.p1, this.p2], {name:'mp', visible:false});
   this.line = board.create('segment', [this.p1, this.p2], {withlabel:false, ...barStyle});  
   targets.push(this.line);
   // label
   const alpha = this.line.getAngle()+90*deg2rad;
   this.lp = board.create('point', plus(  mult( 0.5, plus( XY(this.p1), XY(this.p2) ) ), rect(11*pxunit, alpha)), {visible:false});
   const r = Math.sqrt((this.lp.X()-this.mp.X())**2 + (this.lp.Y()-this.mp.Y())**2);
   this.perpl = board.create('perpendicular', [this.mp, this.l], {visible:false});
   this.lc = board.create('circle', [this.mp, r], {visible:false});
   this.int1 = board.create('intersection', [this.perpl, this.lc], {name:'int1', visible:false});
   this.int2 = board.create('otherintersection', [this.perpl, this.lc, this.int1], {visible:false});
   let x = () => this.int2.X(), y = () => this.int2.Y();
   this.label = board.create('text', [x, y, data[1]], {anchorX:'middle', anchorY:'middle'});
   // implement state switching
   this.obj = [this.p1, this.p2, this.line, this.label];
   switch (this.state) {
   case 'show': show(this); makeSwitchable(this.line, this); break;
   case 'hide': hide(this); makeSwitchable(this.line, this); break;
   case 'SHOW': SHOW(this); break;
   case 'HIDE': HIDE(this); break;
    } 
   // state init
   this.loads = [];
  }
  hasPoint(pt) { 
   return isOn(pt,this.line) && JXG.Math.Geometry.distPointLine([1,pt.X(),pt.Y()], this.line.stdform) < tolPointLine}
  data(){ let a = this.d.slice(0); a.push(this.state); return a}
  name(){ return targetName(this) }  
}

// Rectangle with centerline given by pair of points. Even number of points generates multiple rectangles which are merged if they overlap.
// [ "beam", "color", [x1,y1], [x2,y2] ..., radius, state ]
class beam {
 constructor(data){
   this.state = (typeof data[data.length-1] == 'string') ? data.pop() : "SHOW";
   this.d = data.slice(0); //make a copy
   this.r = data.pop(); // radius
   data.shift(); // drop the type string
   if (typeof data[1] === 'string') {
     this.col = [data.shift(),data.shift()]; //droping the attributes for fillcolor and gradientcolor into an array
   } else {
     this.col = [ 'lightgrey', 'lightgrey']; data.shift(); // drop the name and use default uniform color
   }
   this.p = data; // end points of center line
   // loop over pairs of points
   this.angle = -Math.atan2(this.p[1][1]-this.p[0][1],this.p[1][0]-this.p[0][0])+90*deg2rad;
   this.attr = {opacity: true, layer:defaultMecLayer, fillcolor:this.col[0],
     gradient:'linear', gradientSecondColor:this.col[1], gradientAngle:this.angle, hasInnerPoints:true,
     ...normalStyle};
   this.b = board.create('curve', [[],[]], {...normalStyle, hasInnerPoints:true});
   let beams = [], beamUnions = [];
   let x, y, dx, dy, l , c;
   console.log('this.p.length is here: ' + this.p.length);
   // variable names plays a big role, has to be different in every iteration to prevent overriding
   // previous problem with only 1 beam appearing is due to overwriting of variables
   // need to use IIFE
	// Initialize arrays to store function values
	let xArray = [], yArray = [], dxArray = [], dyArray = [], lArray = [], cArray = [];

   for (let i = 0; i < this.p.length; i+=2) {
   (function () {
      let pointName1 = `p${i+1}`, pointName2 = `p${i+2}`, beamName1 = `b${i+1}`;
      this[pointName1] = board.create('point', this.p[i], {visible:false, fixed:true, name:pointName1});
      this[pointName2] = board.create('point', this.p[i+1], {visible:false, fixed:true, name:pointName2});

      // Store the function values in arrays
  		xArray[i] = () => this[pointName1].X();
  		yArray[i] = () => this[pointName1].Y();
  		dxArray[i] = () => this[pointName2].X() - this[pointName1].X();
  		dyArray[i] = () => this[pointName2].Y() - this[pointName1].Y();
  		lArray[i] = () => Math.sqrt(dxArray[i]()**2 + dyArray[i]()**2);
  		cArray[i] = () => this.r/lArray[i]();

  		let bneu = board.create('curve', [[],[]], {strokeWidth:0, hasInnerPoints:true});
  		bneu.updateDataArray = function () {
    	this.dataX = [xArray[i]()+dyArray[i]()*cArray[i](), xArray[i]()+dxArray[i]()+dyArray[i]()*cArray[i](), xArray[i]()+dxArray[i]()-dyArray[i]()*cArray[i](),
		      xArray[i]()-dyArray[i]()*cArray[i](), xArray[i]()+dyArray[i]()*cArray[i]()];
    	this.dataY = [yArray[i]()-dxArray[i]()*cArray[i](), yArray[i]()+dyArray[i]()-dxArray[i]()*cArray[i](), yArray[i]()+dyArray[i]()+dxArray[i]()*cArray[i](), 
		      yArray[i]()+dxArray[i]()*cArray[i](), yArray[i]()-dxArray[i]()*cArray[i]()];}  

      beams.push(bneu);
      }).call(this);
      }
				
  	if (this.p.length === 2) {
        	this.b = beams[0];
                this.b.setAttribute(this.attr);
       } else if (this.p.length === 4) {
       this.b = board.create('curveunion', [beams[0], beams[1]], this.attr); 
       } else {
	for (let i = 0; i < beams.length; i += 2) {
  		if (i + 1 < beams.length) {
    		let newBeamUnion = board.create('curveunion', [beams[i], beams[i + 1]], this.attr);
    		beamUnions.push(newBeamUnion);
  		} else {beamUnions.push(beams[i]);} // If there's an odd number of beams, add the last beam as is
  		}
		// Combine the curve unions if there are more than one
		this.b = board.create('curveunion', beamUnions, this.attr); 
  		}         
   this.b.rendNode.setAttributeNS(null, 'fill-rule', 'evenodd');  //Workaround for correct fill, see https://github.com/jsxgraph/jsxgraph/issues/362
  
    // group points
    this.b.obj = [this.b];
    this.b.parent = this;  
    //const pointgroup = board.create('group', pointsArray); 
    //const pointgroup = board.create('group', pointsArray).setRotationCenter('centroid').setRotationPoints(pointsArray);

    // implement state switching
    this.obj = [this.b];
    
    // state init
    switch (this.state) {
    case 'show': show(this); makeSwitchable(this.b, this); break;
    case 'hide': hide(this); makeSwitchable(this.b, this); break;
    case 'SHOW': SHOW(this); break;
    case 'HIDE': HIDE(this); break;
    } 
    this.loads = [];
  }
  hasPoint(pt) {return isOn(pt,this.b)}
  data(){ let a = this.d.slice(0); a.push(this.state); return a}
  name(){ return targetName(this) } 
}

// Circle with centerpoint, point on perimeter, optional: use name as radius indicator
// [ "circle", "name", [xc, yc], [xp,yp] , angle]
// [ "circle", "name", [xc, yc], radius , angle]
class circle {
  constructor(data){
    this.d = data.slice(0); //make a copy
    this.state = data[5] ?? "SHOW";
    this.angle = data[4] ? data[4] * deg2rad : 0; // pop the angle for the label
    this.p1 = board.create('point', data[2], {visible:true, size:0});
    // specify circle radius - check if data[3] is an array of coordinates or radius from midpoint
    const theta = Math.atan2(this.p1.Y(),this.p1.X());
    if (typeof(data[3]) == 'number') {this.p2 = board.create('point', [this.p1.X() + data[3] * Math.cos(theta), this.p1.Y() + data[3] * Math.sin(theta)], {visible:false})}
     else {this.p2 = board.create('point', data[3], {visible:false});}
    // circle
    this.c = board.create('circle', [this.p1,this.p2], {opacity: true, fillcolor:'lightgray', hasInnerPoints:true, strokeWidth: normalStyle.strokeWidth, strokeColor: normalStyle.strokeColor});
    this.obj = [this.c];
    this.p0 = board.create('point', [0,0], {fixed:true, visible:false});
    const diffX = this.p1.X() - this.p0.X();
    const diffY = this.p1.Y() - this.p0.Y();
    const t1 = board.create('transform', [() => this.p1.X() - diffX, () => this.p1.Y() - diffY], {type: 'translate'});
    // arrow and label if name is not empty or does not contain whitespaces
    if (data[1].trim() !== "") {
      let dir = 1;
      if (this.angle < 0) {dir = -1}
      const r = this.c.Radius();
      // console.log(dir);
      this.p3 = board.create('point',plus(XY(this.p1), rect(r+dir*16*pxunit, this.angle)), {visible:false} );
      this.p4 = board.create('point',plus(XY(this.p1), rect(r, this.angle)), {visible:false} );
      this.a = board.create('arrow', [this.p3, this.p4], thinStyle);
      // label
      this.p = board.create('point', plus( XY(this.p1), rect(r+dir*24*pxunit, this.angle)),
      {name:toTEX(data[1]), ...centeredLabelStyle});
      this.obj.push( this.a, this.p.label );
      t1.bindTo([this.p2, this.p3, this.p4, this.a, this.c, this.p]);
    } else {
      t1.bindTo([this.p2, this.c]);
    }
    // state init
    switch (this.state) {
    case 'show': show(this); makeSwitchable(this.c, this); break;
    case 'hide': hide(this); makeSwitchable(this.c, this); break;
    case 'SHOW': SHOW(this); break;
    case 'HIDE': HIDE(this); break;
    } 
    this.loads = []
  }
  hasPoint(pt) {return isOn(pt,this.c)} 
  data(){ return ["circle", this.d[1], XY(this.p1), this.c.Radius(), this.angle/deg2rad, this.state]}
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
    for (let pt of [this.A, this.AS, this.int1, this.int2]) {
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
    let d = this.d;
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
    this.state = (typeof data[data.length-1] == 'string') ? data.pop() : "SHOW";
    this.d = data.slice(0); //make a copy
    this.p1 = board.create('point', this.d[2], {name:'p1', fixed:true, visible:false});
    this.p2 = board.create('point', this.d[3], {name:'p2', fixed:true, visible:false});
    let x = () => this.p1.X(), y = () => this.p1.Y();
    let dx = () => (this.p2.X()-x()), dy = () => (this.p2.Y()-y());
    let l = () => Math.sqrt(dx()**2+dy()**2);
    if (data.length >4 ) {this.r = data[4]} else {this.r = 6*pxunit}
    if (data.length >5 ) {this.off = data[5]} else {this.off = (this.r)+10*pxunit} // check data[7]
    let c = () => this.r/l();
    let xc = () => x()+0.5*dx(), yc = () => y()+0.5*dy();
    let dlx = () => c()*dx(), dly = () => c()*dy(), dqx = () => -c()*dy(), dqy = () => c()*dx();   
    this.c = board.create('curve',[[0],[0]], {hasInnerPoints:true, ...normalStyle} );
    this.c.updateDataArray = function() {
    this.dataX = [x(), xc(), NaN, xc()+dqx(), xc()-dqx(), NaN,
      xc()+dqx()-dlx(), xc()+dqx()+dlx(), xc()-dqx()+dlx(), xc()-dqx()-dlx(), NaN,
      xc()+dlx(), x()+dx()];
    this.dataY = [y(), yc(), NaN, yc()+dqy(), yc()-dqy(), NaN,
      yc()+dqy()-dly(), yc()+dqy()+dly(), yc()-dqy()+dly(), yc()-dqy()-dly(), NaN,
      yc()+dly(), y()+dy()];
    }; 
    // snap points
    this.s = board.create('segment', [this.p1,this.p2],{strokeWidth:0});
    targets.push(this.s);
    // label
    let labelX = () => xc()-dy()/l()*this.off, labelY = () => yc()+dx()/l()*this.off;
    this.l = board.create('point',[labelX,labelY], {name:toTEX(data[1]), ...centeredLabelStyle});
    // logging
    console.log("dasphot", data[1], data[2], data[3], this.r, this.off);   
    // implement state switching
    this.obj = [ this.c, this.l.label ];
    // state init
    switch (this.state) {
    case 'show': show(this); makeSwitchable(this.c, this); break;
    case 'hide': hide(this); makeSwitchable(this.c, this); break;
    case 'SHOW': SHOW(this); break;
    case 'HIDE': HIDE(this); break;
    } 
    this.loads = []
  }
  data(){ let a = this.d.slice(0); a.push(this.state); return a}
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
   const vd = minus(data[3], data[2]);
   const [le, a0] = polar(vd);
   const vn = rect(1, a0+90*deg2rad);	// ao is used here
   const vmult = mult(d, vn);
   this.p01 = board.create('point', [data[2][0] + vmult[0], data[2][1] + vmult[1]], {fixed:true, visible:false, name:'p01'});
   this.p02 = board.create('point', [data[2][0] + vmult[0] + vd[0], data[2][1] + vmult[1] + vd[1]], {fixed:false, visible:false, name:'p02'});
   this.mp1 = board.create('midpoint', [this.p01, this.p02], {name:'mp1', visible:false});
   
   // p01, p02 are the initial points, p1 and p2 are based on these 2 points, in turn, pv1 and pv2 are based on p1 and p2
   let p01x = this.p01.X(), p01y = this.p01.Y(), p02x = this.p02.X(), p02y = this.p02.Y();
   // perpendicular lines
   let da = 5*pxunit;
   let di = da;
   if (d !=0  ) {di=d}
   if (d<0) {di=d;da=-da}
   let negdivn = mult(-di,vn), posdavn = mult(da, vn);

   this.p1 = board.create('point', [p01x + negdivn[0], p01y + negdivn[1]], {visible:false, name:'p1', fixed:false});
   this.p2 = board.create('point', [p02x + negdivn[0], p02y + negdivn[1]], {visible:false, name:'p2', fixed:false});
   this.l = board.create('line', [this.p1, this.p2], {visible:false});
   let p1x = () => this.p1.X(), p1y = () => this.p1.Y(), p2x = () => this.p2.X(), p2y = () => this.p2.Y();

   this.perpl1 = board.create('perpendicular', [this.l, this.p1], {visible:false});
   this.perpl2 = board.create('perpendicular', [this.l, this.p2], {visible:false});
   const vd1 = minus(XY(this.p2), XY(this.p1));
   const [le1, a01] = polar(vd1);
   const vn1 = rect(1, a01+90*deg2rad);	// ao is used here
   const vmult1 = mult( d, vn1 );
   // perpendicular lines
   this.p3 = board.create('point', [p01x + posdavn[0], p01y + posdavn[1]], {visible:false, name:'p3', fixed:false});
   this.p4 = board.create('point', [p02x + posdavn[0], p02y + posdavn[1]], {visible:false, name:'p4', fixed:false});
   this.hl1 = board.create('segment', [this.p1, this.p3], {visible:false});
   this.hl2 = board.create('segment', [this.p2, this.p4], {visible:false});
   this.pv1 = board.create('glider', [p01x, p01y, this.hl1], {fixed:true, visible:false, name:'pv1'});
   this.pv2 = board.create('glider', [p02x, p02y, this.hl2], {fixed:true, visible:false, name:'pv2'});
   let pv1x = () => this.pv1.X(), pv1y = () => this.pv1.Y(), pv2x = () => this.pv2.X(), pv2y = () => this.pv2.Y();
   this.l2 = board.create('line', [this.pv1, this.pv2], {visible:false});
   let dx = pv1x() - p1x(), dy = pv1y() - p1y();
   let dist = Math.sqrt(dx*dx + dy*dy);
   
   // use circles to maintain constant offset
   let circle1 = board.create('circle', [this.p1, dist], {visible:false});
   this.int3 = board.create('intersection', [circle1, this.perpl1], {name:'int3', visible:false});
   this.int4 = board.create('otherintersection', [circle1, this.perpl1, this.int3], {name:'int4', visible:false});
   let circle2 = board.create('circle', [this.p2, dist], {visible:false});
   this.int5 = board.create('intersection', [circle2, this.perpl2], {name:'int5', visible:false});
   this.int6 = board.create('otherintersection', [circle2, this.perpl2, this.int5], {name:'int6', visible:false});
   let circle3 =  board.create('circle', [this.p1, this.p3], {visible:false});
   this.int7 = board.create('intersection', [circle3, this.perpl1], {name:'int7', visible:false});
   this.int8 = board.create('otherintersection', [circle3, this.perpl1, this.int7], {name:'int8', visible:false});
   let circle4 =  board.create('circle', [this.p2, this.p4], {visible:false});
   this.int9 = board.create('intersection', [circle4, this.perpl2], {name:'int9', visible:false});
   this.int10 = board.create('otherintersection', [circle4, this.perpl2, this.int9], {name:'int10', visible:false});
   
   if (d >= 0) {
   this.hl3 = board.create('segment', [this.p1, this.int8], {name:'', ...thinStyle});
   this.hl4 = board.create('segment', [this.p2, this.int10], {name:'', ...thinStyle});
   // midpoint used in label positioning
   this.mp0 = board.create('midpoint', [this.int4, this.int6], {name:'mp0', visible:false});
   // baseline
   this.bl = board.create('arrow', [this.int4, this.int6],{name:'', ...thinStyle, firstArrow:{type:1,size:6}, lastArrow:{type:1,size:6}});} 
   else {
   this.hl3 = board.create('segment', [this.p1, this.int7], {name:'', ...thinStyle});
   this.hl4 = board.create('segment', [this.p2, this.int9], {name:'', ...thinStyle});
   // midpoint used in label positioning
   this.mp0 = board.create('midpoint', [this.int3, this.int5], {name:'mp0', visible:false});
   // baseline
   this.bl = board.create('arrow', [this.int3, this.int5],{name:'', ...thinStyle, firstArrow:{type:1,size:6}, lastArrow:{type:1,size:6}});
   }
   this.gp1 = board.create('group', [this.p1, this.p3]).setTranslationPoints(this.p1);
   this.gp2 = board.create('group', [this.p2, this.p4]).setTranslationPoints(this.p2); 
   // label
   const vd2 = minus(XY(this.pv2), XY(this.pv1));
   const [le2, a02] = polar(vd2);
   const vn2 = rect( 1, a02+90*deg2rad );
   const lmult = mult(8*pxunit, vn2);
   let lcoords = plus(XY(this.mp0), lmult);
   this.pl = board.create('point', lcoords, {name:'pl', visible:false});
   this.perpl3 = board.create('perpendicular', [this.bl, this.mp0], {visible:false});
   let circle5 =  board.create('circle', [this.mp0, this.pl], {visible:false});
   this.int11 = board.create('intersection', [circle5, this.perpl3], {name:'int11', visible:false});
   this.int12 = board.create('otherintersection', [circle5, this.perpl3, this.int11], {name:toTEX(data[1]), ...centeredLabelStyle});
   const tp03 = board.create('point', [0,0], {size:0, visible:false});
   const diffX1 = this.mp0.X() - tp03.X();
   const diffY1 = this.mp0.Y() - tp03.Y();
   let t1 = board.create('transform', [() => (this.mp0.X()-diffX1), () => (this.mp0.Y()-diffY1)], {type:'translate'});
   t1.bindTo(this.pl);
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
   this.d = data;
   let le = 24*pxunit;
   this.dist = data[4] || 10;
   data[5] && (le = data[5]);
   this.dist >= 0 ? (this.name1 = "", this.name2 = toTEX(data[1])) : (this.name2 = "", this.name1 = toTEX(data[1]));
   // Arrow
   const off = data[3];
   const v = rect( le, data[3]*deg2rad );
   const pAttr = {fixed:true, size: 0, showInfobox:false, label:{offset:[0,this.dist], autoPosition:true}};
   this.p1 = board.create('point', data[2], {name: this.name1, ...pAttr});
   this.p2 = board.create('point', plus(data[2], v), {name: this.name2, ...pAttr});
   this.vec = board.create('arrow', [this.p1, this.p2], {lastArrow: { type: 1, size: 6 }, ...thinStyle });
 }
 data() { return this.d } 
 name() { return '"'+this.d[1]+'"' }
}

//co-ordinate arrow with red arrow with label 
// [ "disp", "name", [x,y], angle, offset, length]
class disp {
  constructor(data) {
   this.label = data[1];
   this.d = data;
   let le = 24*pxunit;
   this.dist = data[4] || 10;
   data[5] && (le = data[5]);
   this.dist >= 0 ? (this.name1 = "", this.name2 = toTEX(data[1])) : (this.name2 = "", this.name1 = toTEX(data[1]));
   // Arrow
   const off = data[4];
   const v = rect( le, data[3]*deg2rad );
   this.p1 = board.create('point', data[2], {name: this.name1, fixed:true, size:0, showInfobox:false, label:{offset:[0,this.dist], autoPosition:true, color:"red"}});
   this.p2 = board.create('point', plus(data[2], v), {name: this.name2, fixed:true, size:0, showInfobox:false, label:{offset:[0,this.dist], autoPosition:true, color:"red"}});
   this.vec = board.create('arrow', [this.p1, this.p2], {lastArrow: { type: 1, size: 6 }, ...thinStyle, strokeColor:"red" });
}
  data() { return this.d } 
  name() { return '"'+this.d[1]+'"' }
}

//  Loslager
class fix1 {
  constructor(data) {
    this.state = (typeof data[data.length-1] == 'string') ? data.pop() : "SHOW";
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
     [ 0, - 1.9*a] //label
    ];
    let p = [], c;
    for (c of coords) { p.push(board.create('point', c, {visible: false})); }
    const t1 = board.create('transform', [data[3]*deg2rad], {type:'rotate'});
    const t2 = board.create('transform', data[2], {type:'translate'});
    t1.applyOnce(p);
    t2.applyOnce(p);
    // dependent objects
    // pivot 
    const pointConfigs = {fixed: true, visible: false};
    const points = p.map((coord, index) => board.create('point', XY(coord), index === 0 ? 
    {name: '', ...nodeStyle} : pointConfigs));
    [this.p1, this.p2, this.p3, this.p4, this.p5, this.p6, this.p7, this.p8] = points;
    // label
    this.label = board.create('point', XY(this.p8), {name:toTEX(data[1]), ...centeredLabelStyle });
    // body
    this.t = board.create('polygon', [this.p1, this.p2, this.p3], {name: '',fillColor: "white", Opacity: true, layer: 7,
      borders: {...normalStyle, layer:8}, vertices: {fixed:true, size:0}});
    // baseline with hatch
    this.bl = board.create('segment', [this.p6,this.p7], {name: '', ...normalStyle});
    this.c = board.create("comb", [this.p7,this.p6], hatchStyle() );
    // Enable object animation	
    this.p0 = board.create('point', [0,0], {fixed:true, visible:false});
    const diffX = this.p1.X() - this.p0.X(), diffY = this.p1.Y() - this.p0.Y();
    const t3 = board.create('transform', [() => this.p1.X() - diffX, () => this.p1.Y() - diffY], {type:'translate'});
    t3.bindTo([this.p2, this.p3, this.p4, this.p5, this.p6, this.p7, this.p8, this.label, this.t, this.bl]);
    // implement state switching
    this.obj = [ this.p1, this.t, this.bl, this.c, this.label, this.label.label ];
    this.obj = this.obj.concat(this.t.borders); 
    // state init
    switch (this.state) {
    case 'show': show(this); makeSwitchable(this.c, this); makeSwitchable(this.t, this); break;
    case 'hide': hide(this); makeSwitchable(this.c, this); makeSwitchable(this.t, this); break;
    case 'SHOW': SHOW(this); break;
    case 'HIDE': HIDE(this); break;
    }
    // proximity 
    this.loads = []
    }
  data(){ let a = this.d.slice(0); a.push(this.state); return a}
  name(){ return targetName(this) } 
  hasPoint(pt) {return isOn(pt,this.p1)} 
}

//  Festlager
//  [ "fix12", "name", [x, y], angle, state ]
class fix12 {
  constructor(data) {    
    this.state = (typeof data[data.length-1] == 'string') ? data.pop() : "SHOW";
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
    let p = [], c;
    for (c of coords) {p.push(board.create('point', c, {visible: false}));}
    const t1 = board.create('transform', [data[3]*deg2rad], {type:'rotate'});
    const t2 = board.create('transform', data[2], {type:'translate'});
    t1.applyOnce(p);
    t2.applyOnce(p);
    // dependent objects
    // pivot 
    const pointConfigs = {fixed: true, visible: false};
    const points = p.map((coord, index) => board.create('point', XY(coord), index === 0 ? 
    {name: '', ...nodeStyle} : pointConfigs));
    [this.p1, this.p2, this.p3, this.p4, this.p5, this.p6] = points;
    this.label = board.create('point', XY(this.p6), {name:toTEX(data[1]), ...centeredLabelStyle});
    // body
    this.t = board.create('polygon', [this.p1, this.p2, this.p3], {name:'',fillColor:"white", Opacity:true, layer:7, 
      borders:{...normalStyle, layer:8}, vertices: {fixed:true, size:0}});
    // baseline with hatch
    this.bl = board.create('segment', [this.p4, this.p5], {name: '',...normalStyle});
    this.c = board.create("comb", [this.p5, this.p4], hatchStyle() )
    // Enable object animation	
    this.p0 = board.create('point', [0,0], {fixed:true, visible:false});
    const diffX = this.p1.X() - this.p0.X(), diffY = this.p1.Y() - this.p0.Y();
    const t3 = board.create('transform', [() => this.p1.X() - diffX, () => this.p1.Y() - diffY], {type:'translate'});
    t3.bindTo([this.p2, this.p3, this.p4, this.p5, this.p6, this.label, this.t, this.bl]);     
    // implement state switching
    this.obj = [this.p1, this.t, this.bl, this.c, this.label, this.label.label];
    this.obj = this.obj.concat(this.t.borders); 
    // state init
    switch (this.state) {
    case 'show': show(this); makeSwitchable(this.c, this); makeSwitchable(this.t, this); break;
    case 'hide': hide(this); makeSwitchable(this.c, this); makeSwitchable(this.t, this); break;
    case 'SHOW': SHOW(this); break;
    case 'HIDE': HIDE(this); break;
    } 
    // proximity 
    this.loads = []
  }
  data(){ let a = this.d.slice(0); a.push(this.state); return a}
  name(){ return targetName(this) } 
  hasPoint(pt) {return isOn(pt,this.p1)} 
}

//  Einspannung
//  [ "fix123", "name", [x, y], angle, state ]	angle = 0, object faces right
class fix123 {
  constructor(data) {    
    this.state = (typeof data[data.length-1] == 'string') ? data.pop() : "SHOW";
    this.d = data.slice(0);
    // base points
    const coords = [
     [0,0],       // base point
     [0, -0.8*a], // p
     [0, +0.8*a], // p
     [-0.9*a,0]   // label
    ];
    let p = [], c;
    for (c of coords) { p.push(board.create('point', c, {visible:false}));}
    const t1 = board.create('transform', [data[3]*deg2rad], {type:'rotate'});
    const t2 = board.create('transform', data[2], {type:'translate'});
    t1.applyOnce(p);
    t2.applyOnce(p);
    // dependent objects
    // base point
    const pointConfigs = {fixed:true, visible:false};
    const points = p.map((coord, index) => board.create('point', XY(coord), index === 0 ? 
    {name: '', ...silentPStyle} : pointConfigs));
    [this.p1, this.p2, this.p3, this.p4] = points;
    // label
    this.label = board.create('point', XY(this.p4), {name:toTEX(data[1]), ...centeredLabelStyle});
    // baseline with hatch
    this.bl = board.create('segment', [this.p2,this.p3], {name: '',...normalStyle});
    this.c = board.create("comb", [this.p3, this.p2], { ...hatchStyle(), angle:-45*deg2rad})
    // Enable object animation
    this.p0 = board.create('point', [0,0], {fixed:true, visible:false});
    const diffX = this.p1.X() - this.p0.X(), diffY = this.p1.Y() - this.p0.Y();
    const t3 = board.create('transform', [() => this.p1.X() - diffX, () => this.p1.Y() - diffY], {type:'translate'});
    t3.bindTo([this.p2, this.p3, this.p4, this.label, this.bl]);
    // implement state switching
    this.obj = [ this.p1, this.bl, this.c, this.label, this.label.label];
    // state init
    switch (this.state) {
    case 'show': show(this); makeSwitchable(this.c, this); break;
    case 'hide': hide(this); makeSwitchable(this.c, this); break;
    case 'SHOW': SHOW(this); break;
    case 'HIDE': HIDE(this); break;
    } 
    // proximity 
    this.loads = []
  }
  data(){ let a = this.d.slice(0); a.push(this.state); return a}
  name(){ return targetName(this) } 
  hasPoint(pt) {return isOn(pt,this.p1)} 
}

//  Slider 
//  [ "fix13", "name", [x, y], angle, state ]
class fix13 {
 constructor(data) {
    this.state = (typeof data[data.length-1] == 'string') ? data.pop() : "SHOW";
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
    let p = [], c;
    for (c of coords) { p.push(board.create('point', c, {visible:false}));}
    const t1 = board.create('transform', [data[3]*deg2rad], {type:'rotate'});
    const t2 = board.create('transform', data[2], {type:'translate'});
    t1.applyOnce(p);
    t2.applyOnce(p);
    // dependent objects
    // base point
    const pointConfigs = {fixed: true, visible: false};
    const points = p.map((coord, index) => board.create('point', XY(coord), index === 0 ? 
    {name: '', ...silentPStyle} : pointConfigs));
    [this.p1, this.p2, this.p3, this.p4, this.p5, this.p6] = points;
    // label
    this.label = board.create('point', XY(this.p6), {name:toTEX(data[1]), ...centeredLabelStyle});
    this.l = board.create('segment', [this.p2,this.p3], {name: '', ...normalStyle});
    this.bl = board.create('segment', [this.p4,this.p5], {name: '', ...normalStyle});
    this.c = board.create("comb", [this.p5,this.p4], {...hatchStyle(), angle:-45*deg2rad});
    // Enable object animation	
    this.p0 = board.create('point', [0,0], {fixed:true, visible:false});
    const diffX = this.p1.X() - this.p0.X(), diffY = this.p1.Y() - this.p0.Y();
    const t3 = board.create('transform', [() => this.p1.X() - diffX, () => this.p1.Y() - diffY], {type:'translate'});
    t3.bindTo([this.p2, this.p3, this.p4, this.p5, this.p6, this.label, this.bl]);
    // switchable objects
    this.obj = [ this.p1, this.l, this.bl, this.c, this.label, this.label.label];
    // state init
    switch (this.state) {
    case 'show': show(this); makeSwitchable(this.c, this); makeSwitchable(this.l, this); break;
    case 'hide': hide(this); makeSwitchable(this.c, this); makeSwitchable(this.l, this); break;
    case 'SHOW': SHOW(this); break;
    case 'HIDE': HIDE(this); break;
    }
    // proximity 
    this.loads = []
  }
  data(){ let a = this.d.slice(0); a.push(this.state); return a}
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
    let pstyle = {snapToGrid:false, size:0, fixed:true, snapToPoints:false, label:labelopts};
    let	hl = false; 
    if (this.state == "active") {
		  pstyle = {snapToGrid:true, fixed:false, size:2, snapToPoints:true, 
		  attractors:targets, attractorDistance: 0.1, snatchdistance:0.2, label:labelopts};
		  hl = true; }
    // start and end point
    this.p1 = board.create('point', data[2], { name: this.name1, 
       ...pstyle }); 
    this.p2 = board.create('point', data[3], { name: this.name2, 
       ...pstyle });   
    // configure infobox
    this.p1.dp = [dpx+1,dpy+1];
    this.p2.start = this.p1;
    this.p2.dp = [dpx+1,dpy+1];
    this.p2.ref = function() { return XY(this.start) };
    this.p2.infoboxlabel = "Vektor ";
    if (this.state == "silent") {this.p2.setAttribute({showInfobox:false})}
    // dash
    let d = 0; if (this.state == "dotted") d=2  
    this.vec = board.create('arrow', [this.p1, this.p2], {
      touchLastPoint: true, lastArrow:{size:5, type:2}, highlight:hl, snaptogrid:true,
      highlightStrokeColor:highlightColor, strokeColor:loadColor, dash:d});
    // interactive control
    if (this.state == "active") {this.vec.setAttribute({fixed:false, snapToGrid:true})}
    this.vec.obj = [this.vec, this.p1, this.p2];
    this.vec.parent = this;  
    // postproceswsing
    this.vec.lastclick = Date.now(); 
    let that = this
    // remove object on doubleclick
    this.vec.on('up', function() {
      if (Date.now()-this.lastclick < 500 && that.state == "active") { 
        console.log("delete force")
        that.state = "deleted"; cleanUp();
        board.removeObject(this.obj, true); update()
      } else {this.lastclick = Date.now(); update()}
    })
    this.vec.on('drag', function() {  board.update(); that.p1.moveTo(XY(that.p1)); that.p2.moveTo(XY(that.p2))
    //  that.p1.moveTo(XY(that.p1)); that.p2.moveTo(XY(that.p2)) }
    })
    // avoid zero length of vector
    this.p2.on('up', function() {
      console.log("length check")
      if (that.vec.L() === 0) {
        console.log('Force length should not be zero.');
        that.p2.moveTo(plus(XY(that.p2),[0.5,0]),0) }
        else {board.update(); update()} })
    // switch off highlighting if locked
    this.obj = [this.vec, this.p1, this.p2, this.p2.label];
    if (this.state == "locked") { lock(this) } 
    // update conditions
    this.p1.on("up", function () {board.update(); update()})
    // points for position check
    this.proximityPoints = [this.p1, this.p2];
  }
  data() { return [this.d[0], this.fname, XY(this.p1), XY(this.p2), this.off, this.state ] }
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
    let t = board.create('text', [ data[2][0], data[2][1], 
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
    let vec = board.create('arrow', [p1, p2], 
      { fixed:false, color:'gray',lastArrow:{size:5, type:2}, highlight:true,
      highlightStrokeColor:highlightColor} );
    // callback creates new force object and new name
    vec.parent = this;
    t.on('out', function(e) {
      document.getElementById(fid).value = cleanupName(document.getElementById(fid).value)
      p2.setAttribute({name:toTEX(document.getElementById(fid).value) })});
    vec.on('up', function(e) {
      //only generate force if distance is sufficient to not create overlapping objects
      if (ref1.Dist(this.point1)+ref2.Dist(this.point2) >dx) {
      	objects.push(new force(["force", document.getElementById(fid).value, 
          XY(p1), XY(p2), 10, "active"] ));
        // generate new unique force name
        let f = [];
        for (let m of objects) {
          if (m.data()[0] == 'force') { f = f.concat(m.data()[1]) } }
        let i = 1, n = '', found = true;
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
// newer version of class grid to fix grid lines issue
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
    // Axes specification. The dp is 1 less than infobox dp but not less than 0
    var labelopt;
    if (data[1]) { 
      if (xmin<xmax) {labelopt = {position: 'rt', offset: [-5, 12] } } 
      else {labelopt = {position: 'lft', offset: [-5, 12] }}
      this.xaxis = board.create('axis', [[0, 0], [1,0]], 
	    {name:toTEX(data[1]), withLabel: true, label: labelopt, layer:0,
        ticks: { label:{layer:3}, generateLabelValue:function(p1,p2) {
	      return ((p1.usrCoords[1]-p2.usrCoords[1])*fx).toFixed(Math.max(...[0,dpx-1]))}} });}
    if (data[2]) { 
      if (ymin<ymax) {labelopt = {position: 'rt', offset: [10, 0] } } 
      else {labelopt = {position: 'rt', offset: [10, 0] }}
   	  this.yaxis = board.create('axis', [[0, 0], [0,1]], 
	    {name:toTEX(data[2]), withLabel: true, label: labelopt, layer:0,
        ticks: { label:{layer:3}, generateLabelValue:function(p1,p2) {
	      return ((p1.usrCoords[2]-p2.usrCoords[2])*fy).toFixed(Math.max(...[0,dpy-1]))}} });    
    } 
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
    this.c = data[3] ?? "black";
    this.p1 = board.create('point', data[2], { name:data[1] ,size:0, label:{offset:[0,0], color:this.c}} );
    this.d = data;
  }
  data(){ return this.d }
  name(){  return "0" }
}

// line between along x and y data vectors with optional dash style, thickness and color
// [ "line", "color", [x1, x2,...], [y1, y2,...] ,dash, th ]
class line {
 constructor(data) {
   this.d = data;
   this.c = data[1] ? data[1]: "black";
   console.log(this.c)
   this.dash = data.length >= 5 ? data[4] : "-";
   this.th = data.length >= 6 ? data[5] : 0.8;
   let d;
   switch (this.dash) {
     case "-": d = 0; break;
     case ".": d = 1; break;
     case "--": d = 2; break;
     case "-.": d = 6; break;
   }
   this.p = board.create('curve',[this.d[2],this.d[3]], {dash:d, strokeColor:this.c, strokeWidth:this.th, layer:8}); 
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
    for (let pt of [this.p1, this.p2]) {	pt.scale = [this.f,this.f] }
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
    let ans = this.d; 
    ans[2] = [this.p1.X()*this.f,this.p1.Y()*this.f];
    ans[3] = [this.p2.X()*this.f,this.p2.Y()*this.f];
    return ans } 
  name(){ return "[["+this.data()[2].toString() + "],[" + this.data()[3].toString() + "]]" } 
}

//  point mass [ "mass", [x,y],r, off]
class mass {
  constructor(data) {
    this.d = data;
    const r = data.length > 3 ? data[3] : 4;
    const off = data.length > 4 ? data[4] : 11;
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
    let fix = true, size = 0, hl = false;
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
    let g = board.create('group', [this.p1, this.p2, this.p3, this.arc]);
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
    let t = board.create('text', [ data[2][0], data[2][1], 
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
    let arc = board.create('minorArc', [p1, p2, p3], { 
      fixed:false, strokeColor:'gray', strokeWidth: 2, 
      highlight:true, highlightStrokeColor:highlightColor,
      lastArrow: { type: 2, size: 5}});
    // callback creates new moment object and new name
    arc.parent = this;
    t.on('out', function(e) {
    document.getElementById(mid).value = cleanupName(document.getElementById(mid).value)
      p3.setAttribute({name:toTEX(document.getElementById(mid).value )})});
    arc.on('up', function(e) {
      //only generate force if distance is sufficient to not create overlapping objects
      if (ref2.Dist(p2) >dx) {
        objects.push(new moment(["moment", document.getElementById(mid).value, 
          XY(p1), XY(p2), XY(p3), "active"] ));
        // generate new unique moment name
        let f = [];
        for (let m of objects) {
          if (m.data()[0] == 'moment') { f = f.concat(m.data()[1]) } }
        let i = 1, n = '', found = true;
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
    this.dist = data.length > 3 ? data[3] : 10;
    this.lc = data[4] || "black";
    this.fc = data[4] || "white";
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
    this.dist = data.length > 3 ? data[3] : 10;
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
class polygon{
    constructor(data) {
      let pstyle = {opacity:true, fillcolor:'lightgray', vertices:{size:0, fixed:true}, borders:normalStyle, hasInnerPoints:true}
      // if last argument is a string, use it as state flag and remove from list
      this.state = typeof data[data.length - 1] === 'string' ? data.pop() : 'SHOW';      
      // data for name()
      this.loads = [];
      this.d = data.slice(0);
      // geometric data
      this.v = data.slice(2);
      console.log('this.v is here: ' + this.v);
      //this.vflat = this.v.flat();
      this.pArr = [];
      let hasHole = false;
      // Check if the polygon has holes
      if (this.v[0].length > 2) {hasHole = true;}
      // Create dynamic points based on the number of vertices
      for (let i = 0; i < this.v.length; i++) {
      const x = this.v[i][0], y = this.v[i][1];
      this.pArr.push(board.create('point', [x,y], {size:0, visible:true, fixed:false}));
      this[`p${i + 1}`] = this.pArr[i]; // Create dynamic point properties
      } 
      // Create polygon
      if (hasHole) {
      this.clines = [];
      this.path = this.v.shift();
      this.path.push(this.path[0]);
      for (const border of this.v) {
      this.clines.push(this.path.length - 1);
      this.path = this.path.concat(border);
      this.path.push(border[0]);
      this.clines.push(this.path.length - 1);
      }
      // suppress the connector lines
      for (const i of this.clines)
      this.p.borders[i].setAttribute({visible:false});
      const outerContour = pArr.slice(0, 2); 
      const innerContours = [];
      let startIndex = 2;
      while (startIndex < pArr.length) {
        const innerContour = pArr.slice(startIndex, startIndex + 2);
        innerContours.push(innerContour);
        startIndex += 2;
      }
      this.p = board.create('polygon', [outerContour, innerContours], pstyle);
      // Adjust the visibility of inner borders inside overlapping polygons
      for (const i of this.clines) {
      if (this.p.borders[i] && this.p.borders[i].getAttribute('withLabel') === 'false') {this.p.borders[i].setAttribute(invisibleBorderStyle);}}} 
      else {this.p = board.create('polygon', this.pArr, pstyle);
      // Adjust the visibility of inner borders inside overlapping polygons
      for (const border of this.p.borders) {
      if (border.getAttribute('withLabel') === 'false') {border.setAttribute(invisibleBorderStyle);}}}
      this.p.setAttribute({fixed:true});
      this.p.obj = [this.p, this.pArr];
      this.p.parent = this;
      const pointgroup = board.create('group', this.pArr);
      //.setRotationCenter('centroid').setRotationPoints(this.pArr);
      //this.pArr[3].moveTo([10,4], 2000);		// test random point movement
      // switching objects
      this.obj = [this.p].concat(this.p.borders);
      // state init
      switch (this.state) {
      case 'show': show(this); makeSwitchable(this.p, this); break;
      case 'hide': hide(this); makeSwitchable(this.p, this); break;
      case 'SHOW': SHOW(this); break;
      case 'HIDE': HIDE(this); break;
      }
    }
    hasPoint(pt) { return isOn(pt, this.p) }
    data() { let a = this.d.slice(0); a.push(this.state); return a }
    name() { return targetName(this) }
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
    if (this.state == "SHOW") { SHOW(this) }
    if (this.state == "HIDE") { HIDE(this) }
  } 
  data(){ let a = this.d.slice(0); a[8] = this.state; return a}
  name(){ return targetName(this) } 
  hasPoint(pt) {return this.polygon.hasPoint(pt.coords.scrCoords[1], pt.coords.scrCoords[2])} 
}

// rope, tangent line to two circles ["rope", "name",[x1,y1], r1, [x2,y2],r2 ]
// negative r values select the tangent point on the left side from the line p1-p2
class rope {
  constructor(data) {
    if (typeof(data[data.length - 1]) == 'string') {this.state = data.pop()} else {this.state = "SHOW"}
    this.d = data;
    const v = minus(data[4], data[2]);
    //const dx = data[4][0]-data[2][0];
    //const dy = data[4][1]-data[2][1];
    const [le, a0] = polar(v);
    //const a0 = Math.atan2(dy,dx);
    //const le = Math.sqrt(dx**2+dy**2);
    const r1 = data[3];
    const r2 = data[5];
    const a1 = Math.acos((r1-r2)/le);
    // to make it easier to switch between collective visibility of object frames 
    let vis = {visible:false}; // use spread operator ( ...vis ) for elements with multiple attributes, otherwise just use variable itself
	  
    this.p1 = board.create('point', data[2], {name:'p1', visible:false, fixed:false});
    this.p2 = board.create('point', data[4], {name:'p2', visible:false, fixed:false});
    this.pm = board.create('midpoint', [this.p1, this.p2], {name:'pm', visible:false});
    this.c1 = board.create('circle', [this.p1, r1], vis);
    this.c2 = board.create('circle', [this.p2, r2], vis);
    this.cm = board.create('circle', [this.pm, this.p1], vis);
    this.ropeAttr = {name:"", layer: defaultMecLayer, withLabel:true, ...normalStyle, label:{offset:[0,0],autoPosition:true}};
	
    if (Math.abs(r1) > Math.abs(r2)) {
   	  this.c3 = board.create('circle', [this.p1, function() {return r1 - r2}], {strokeWidth:'1px', strokeColor:'red', ...vis});
   	  this.i1 = board.create('intersection', [this.cm, this.c3], {name:'i1', ...vis});
   	  this.i2 = board.create('otherintersection', [this.cm, this.c3, this.i1], {name:'i2', ...vis});
   	  this.l1 = board.create('line', [this.p1, this.i2], vis);
      this.l2 = board.create('line', [this.p1, this.i1], vis);
   	  this.i3 = board.create('intersection', [this.c1, this.l1], {name:'i3', ...vis});
      this.i31 = board.create('otherintersection', [this.c1, this.l1, this.i3], {name:'i31', ...vis});
      this.i4 = board.create('intersection', [this.c1, this.l2], {name:'i4', ...vis});
      this.i41 = board.create('otherintersection', [this.c1, this.l2, this.i4], {name:'i41', ...vis});
      if (r1 < 0) {
        this.lpl = board.create('parallel', [this.i1,this.p2,this.i41], {color:'purple', ...vis});
   	    this.lpr = board.create('parallel', [this.i2,this.p2,this.i31], {color:'green', ...vis});
      } else {
        this.lpl = board.create('parallel', [this.i1,this.p2,this.i4], {color:'purple', ...vis});
   	    this.lpr = board.create('parallel', [this.i2,this.p2,this.i3], {color:'green', ...vis});
      }
   	  this.i5 = board.create('intersection', [this.c2, this.lpr], {name:'i5', ...vis});
      this.i6 = board.create('intersection', [this.c2, this.lpl], {name:'i6', ...vis});
      if (r1 > 0) { 
        this.l = board.create('segment', [this.i3, this.i5], this.ropeAttr); 
        this.mp = board.create('midpoint', [this.i3, this.i5], {name:'mp', visible:false});
            //const alpha = this.l.getAngle()+90*deg2rad;
            //this.lp = board.create('point', plus(  mult( 0.5, plus( XY(this.i3), XY(this.i5) ) ), rect(11*pxunit, alpha)), {visible:false});
      } else { 
        this.l = board.create('segment', [this.i31, this.i5], this.ropeAttr);
        this.mp = board.create('midpoint', [this.i31, this.i5], {name:'mp', visible:false});
            //const alpha = this.l.getAngle()+90*deg2rad;
            //this.lp = board.create('point', plus(  mult( 0.5, plus( XY(this.i31), XY(this.i5) ) ), rect(11*pxunit, alpha)), {visible:false});
      }      
    } 
    else if (Math.abs(r1) < Math.abs(r2)) {
   	  this.c3 = board.create('circle', [this.p2, function() {return r2 - r1}], {strokeWidth:'1px', strokeColor:'red', ...vis});
   	  this.i1 = board.create('intersection', [this.cm, this.c3], {name:'i1', ...vis});
   	  this.i2 = board.create('otherintersection', [this.cm, this.c3, this.i1], {name:'i2', ...vis});
   	  this.l1 = board.create('line', [this.p2, this.i2], vis);
   	  this.l2 = board.create('line', [this.p2, this.i1], vis);
   	  this.i3 = board.create('intersection', [this.c2, this.l1], {name:'i3', ...vis});
   	  this.i31 = board.create('otherintersection', [this.c2, this.l1, this.i3], {name:'i31', ...vis});
   	  this.i4 = board.create('intersection', [this.c2, this.l2], {name:'i4', ...vis});
   	  this.i41 = board.create('otherintersection', [this.c2, this.l2, this.i4], {name:'i41', ...vis});
   	  if (r2 < 0) {
   	    this.lpl = board.create('parallel', [this.i1,this.p1,this.i41], {color:'purple', ...vis});
   	    this.lpr = board.create('parallel', [this.i2,this.p1,this.i31], {color:'green', ...vis});
   	  } else {
   	    this.lpl = board.create('parallel', [this.i1,this.p1,this.i4], {color:'purple', ...vis});
   	    this.lpr = board.create('parallel', [this.i2,this.p1,this.i3], {color:'green', ...vis});
   	  }
   	  this.i5 = board.create('intersection', [this.c1, this.lpr], {name:'i5', ...vis});
      this.i6 = board.create('intersection', [this.c1, this.lpl], {name:'i6', ...vis});
   	  if (r2 > 0) { 
        this.l = board.create('segment', [this.i4, this.i6], this.ropeAttr);
        this.mp = board.create('midpoint', [this.i4, this.i6], {name:'mp', visible:false});
        const alpha = this.l.getAngle()+90*deg2rad;
        this.lp = board.create('point', plus(  mult( 0.5, plus( XY(this.i4), XY(this.i6) ) ), rect(11*pxunit, alpha)), {visible:false});
      } else { 
        this.l = board.create('segment', [this.i41, this.i6], this.ropeAttr);
        this.mp = board.create('midpoint', [this.i41, this.i6], {name:'mp', visible:false});
        //const alpha = this.l.getAngle()+90*deg2rad;
        //this.lp = board.create('point', plus(  mult( 0.5, plus( XY(this.i41), XY(this.i6) ) ), rect(11*pxunit, alpha)), {visible:false});
      }  
   	} 
   
    else if (Math.abs(r1) == Math.abs(r2)) {
      if ((r1 > 0 && r2 > 0) || (r1 < 0 && r2 < 0)) {
    	this.l1 = board.create('line', [this.p1, this.p2], vis);
    	this.perp1 = board.create('perpendicular', [this.l1, this.p1], vis);
    	this.i1 = board.create('intersection', [this.c1, this.perp1], {name:'i1', ...vis});
    	this.i2 = board.create('otherintersection', [this.c1, this.perp1, this.i1], {name:'i2', ...vis});
    	this.perp2 = board.create('perpendicular', [this.l1, this.p2], vis);
    	this.i3 = board.create('intersection', [this.c2, this.perp2], {name:'i3', ...vis});
    	this.i4 = board.create('otherintersection', [this.c2, this.perp2, this.i3], {name:'i4', ...vis});
    	this.l = board.create('segment', [this.i1,this.i3], this.ropeAttr);
        this.mp = board.create('midpoint', [this.i1, this.i3], {name:'mp', visible:false});
        //const alpha = this.l.getAngle()+90*deg2rad;
        //this.lp = board.create('point', plus(  mult( 0.5, plus( XY(this.i1), XY(this.i3) ) ), rect(11*pxunit, alpha)), {visible:false});
      } else if (r1 == 0 && r2 == 0) {
    	this.l = board.create('segment', [this.p1, this.p2], this.ropeAttr); 
        this.mp = board.create('midpoint', [this.p1, this.p2], {name:'mp', visible:false});
        //const alpha = this.l.getAngle()+90*deg2rad;
        //this.lp = board.create('point', plus(  mult( 0.5, plus( XY(this.p1), XY(this.p2) ) ), rect(11*pxunit, alpha)), {visible:false});
      } else {
    	this.i1 = board.create('intersection', [this.c1, this.cm], {name:'i1', ...vis});
    	this.i2 = board.create('otherintersection', [this.c1, this.cm, this.i1], {name:'i2', ...vis});
    	this.mp1 = board.create('midpoint', [this.i1, this.i2], {name:'mp1', ...vis});
    	this.c3 = board.create('circle', [this.pm, this.mp1], vis);
    	this.i3 = board.create('intersection', [this.c1, this.c3], {name:'i3', ...vis});
    	this.i4 = board.create('otherintersection', [this.c1, this.c3, this.i3], {name:'i4', ...vis});
    	this.i5 = board.create('intersection', [this.c2, this.c3], {name:'i5', ...vis});
    	this.i6 = board.create('otherintersection', [this.c2, this.c3, this.i5], {name:'i6', ...vis});
        if (r1 > 0 && r2 < 0) {
    	  this.l = board.create('segment', [this.i3,this.i5], this.ropeAttr); 
          this.mp = board.create('midpoint', [this.i3, this.i5], {name:'mp', visible:false});
        //const alpha = this.l.getAngle()+90*deg2rad;
        //this.lp = board.create('point', plus(  mult( 0.5, plus( XY(this.i3), XY(this.i5) ) ), rect(11*pxunit, alpha)), {visible:false});
    	} else if (r1 < 0 && r2 > 0) {
    	  this.l = board.create('segment', [this.i4,this.i6], this.ropeAttr); 
          this.mp = board.create('midpoint', [this.i4, this.i6], {name:'mp', visible:false});
        //const alpha = this.l.getAngle()+90*deg2rad;
        //this.lp = board.create('point', plus(  mult( 0.5, plus( XY(this.i4), XY(this.i6) ) ), rect(11*pxunit, alpha)), {visible:false});
    	}
      }
    } 

		// rope label
	//	const alpha = this.l.getAngle()+90*deg2rad;
    //this.lp = board.create('point', plus(  mult( 0.5, plus( XY(this.p1), XY(this.p2) ) ), rect(11*pxunit, alpha)), {visible:false});
    //const r = Math.sqrt((this.lp.X()-this.mp.X())**2 + (this.lp.Y()-this.mp.Y())**2);
    this.ppl = board.create('perpendicular', [this.mp, this.l], vis);
    this.cl = board.create('circle', [this.mp, 11*pxunit], vis);
    this.int1 = board.create('intersection', [this.ppl, this.cl], {name:data[1], size:0, visible:false});
    this.int2 = board.create('otherintersection', [this.ppl, this.cl, this.int1], {name:data[1], size:0, visible:true});
	  
    const p1 = plus(data[2], rect(r1, a0-a1));
    const p2 = plus(data[4], rect(r2, a0-a1));
    targets.push(this.l);
    // snap targets
    this.p01 = board.create('point', p1, {name:'p01', ...silentPStyle} );
    this.p02 = board.create('point', p2, {name:'p02', ...silentPStyle} );
    // implement state switching
    this.obj = [this.l, this.int2.label];  
    // state init
    switch (this.state) {
    case 'show': show(this); makeSwitchable(this.l, this); break;
    case 'hide': hide(this); makeSwitchable(this.l, this); break;
    case 'SHOW': SHOW(this); break;
    case 'HIDE': HIDE(this); break;
    } 
    this.loads = []
  }
  data(){ var a = this.d.slice(0); a.push(this.state); return a}
  name(){ return targetName(this) } 
  hasPoint(pt) {return isOn(pt,this.l) && 
    JXG.Math.Geometry.distPointLine(
      [1,pt.X(),pt.Y()], this.l.stdform) < tolPointLine} 
}

//rot
class rot {
  constructor(data) {
  this.d = data;		
    this.p1 = board.create('point', data[2], {visible:false, fixed:true, showInfobox:false, name:'p1'});
    this.p2 = board.create('point', data[3], {visible:false, fixed:true, showInfobox:false, name:'p2'}); 
    // label
    this.p3 = board.create('point', data[4], 
    {name:toTEX(data[1]) , fixed:true, size:0, label:{offset:[0,0],color:'red'}, showInfobox:false});
    this.arc = board.create('minorArc', [this.p1, this.p2, this.p3], 
    {fixed:true, ...thinStyle,  lastArrow: { type: 1, size: 6 }, strokeColor:"red"});
    // Enable object animation
    this.p0 = board.create('point', [0,0], {fixed:true, visible:false});
    const diffX = this.p1.X() - this.p0.X();
    const diffY = this.p1.Y() - this.p0.Y();
    const t1 = board.create('transform', [() => this.p1.X() - diffX, () => this.p1.Y() - diffY], {type:'translate'});
    t1.bindTo([this.p2, this.p3]);
    // The translation is bound to the points, but the points are not updated, yet
    //this.p1.moveTo([5,7], 2000);    
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
    let P1 = plus(this.P, data[3]);
    let P2 = plus(this.P, data[4]);
    let PT1 = plus(this.P, data[5]);
    let PT2 = plus(this.P, data[6]);
    let B1 = [P1[0], this.P[1]];
    let B2 = [P2[0], this.P[1]]; 
    let yStyle = {name: '', fixed: false ,size:6, color:'red',fillOpacity:0, snapToGrid:true};
    let dyStyle = { name: '', fixed: false, snapToGrid:true }
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
    this.state = (typeof data[data.length-1] == 'string') ? data.pop() : "SHOW";
    this.d = data.slice(0); //make a copy
    this.p1 = board.create('point', data[2], {fixed:true, name:'p1', visible:false});
    this.p2 = board.create('point', data[3], {fixed:true, name:'p2', visible:false});
    let x1 = () => this.p1.X(), y1 = () => this.p1.Y();
    let x2 = () => this.p2.X(), y2 = () => this.p2.Y();
    let dx = () => (x2() - x1());
    let dy = () => (y2() - y1());
    let l = () => Math.sqrt(dx()**2+dy()**2);
    this.r = data.length > 4 ? data[4] : 6*pxunit;
    this.n = data.length > 5 ? data[5]*2+1 : Math.ceil(l()/(5*pxunit));
    this.off = data.length > 6 ? data[6] : 14*pxunit;
    this.line = board.create('curve', [[0],[0]], normalStyle); // init the curve
    
    // Enable springc animation
    this.line.updateDataArray = function() {
    let xcoords = [], ycoords = [];
    // since this.r and this.n is used in this function scope, they have to be defined in here too
    this.r = data.length > 4 ? data[4] : 6*pxunit;
    this.n = data.length > 5 ? data[5]*2+1 : Math.ceil(l()/(5*pxunit));
    let c = () => this.r/l();
    // ensure this.n (or any other data) is in the correct variable scope
    //console.log('this.n is here: ' + this.n);   // check if number of turns changes during animation
    // start point
    xcoords.push(x1()-dy()*c());
    ycoords.push(y1()+dx()*c()); 
    // intermediate points
    for (let j = 0; j < this.n+1; j++) {
      xcoords.push(x1()+dx()*j/this.n+dy()*c()*(-1)**j);
      ycoords.push(y1()+dy()*j/this.n-dx()*c()*(-1)**j);
    }
    // last point
    xcoords.push(x1()+dx()+dy()*c(),x1()+dx()-dy()*c());
    ycoords.push(y1()+dy()-dx()*c(),y1()+dy()+dx()*c());   
    this.dataX = xcoords;
    this.dataY = ycoords;
    }
    // label
    let labelX = () => x1()+dx()/2-dy()/l()*(this.off+this.r);
    let labelY = () => y1()+dy()/2+dx()/l()*(this.off+this.r);
    this.lbl = board.create('point', [labelX,labelY], {name:toTEX(data[1]), ...centeredLabelStyle});
    // logging
    console.log("springc", data[1], data[2], data[3], this.r, Math.floor(this.n/2), this.off);
    // implement state switching
    this.obj = [this.line, this.lbl.label]; 
    // state init
    switch (this.state) {
    case 'show': show(this); makeSwitchable(this.line, this); break;
    case 'hide': hide(this); makeSwitchable(this.line, this); break;
    case 'SHOW': SHOW(this); break;
    case 'HIDE': HIDE(this); break;
    }
    this.line.setAttribute({highlightFillOpacity:0});
    this.s = board.create('segment', [this.p1,this.p2],{strokeWidth:0});
    targets.push(this.s);
    this.loads = []
  }
  data(){ let a = this.d.slice(0); a.push(this.state); return a}
  name(){ return targetName(this) } 
  hasPoint(pt) {return (isOn(pt,this.s) || isOn(pt,this.p1)) && JXG.Math.Geometry.distPointLine(
  [1,pt.X(),pt.Y()], this.s.stdform) < tolPointLine} 
}

//tensile spring
// [ "springt", "name", [x1,y1], [x2,y2], r, proz, n, offset ]
class springt {
  constructor(data){
    // Parameter handling
    this.state = (typeof data[data.length-1] == 'string') ? data.pop() : "SHOW";
    this.d = data.slice(0); //make a copy
    this.p1 = board.create('point', data[2], {fixed:false, name:'p1', visible:false});
    this.p2 = board.create('point', data[3], {fixed:false, name:'p2', visible:false});
    
    let x1 = () => this.p1.X(), y1 = () => this.p1.Y();
    let x2 = () => this.p2.X(), y2 = () => this.p2.Y(); 
    let dx = () => (x2() - x1());
    let dy = () => (y2() - y1()); 
    const dx1 = (this.p2.X() - this.p1.X());
    const dy1 = (this.p2.Y() - this.p1.Y());
    // need two types of length to solve issue of changing number of turns during animation
    let l1 = Math.sqrt(dx1**2+dy1**2);  
    let l2 = () => Math.sqrt(dx()**2+dy()**2);
    this.r = data.length > 4 ? data[4] : 6*pxunit;
    this.pr = data.length > 5 ? data[5] : 20;
    this.n = data.length > 6 ? data[6]*2+1 : Math.ceil(l1*(1-this.pr/50)/(5*pxunit));
    this.off = data.length > 7 ? data[7] : 14*pxunit;
    this.line = board.create('curve', [[0],[0]], normalStyle); // init the curve
    
    let lf = () => l2()/l1;
    let xf = () => x1()+this.pr/(lf()*100)*dx();		
    let yf = () => y1()+this.pr/(lf()*100)*dy();
    let dxf = () => dx() - 2*this.pr/(lf()*100)*dx();
    let dyf = () => dy() - 2*this.pr/(lf()*100)*dy();
    const cf = () => this.r/(l2()*(1-this.pr/(lf()*50)));
    
    // Enable springt animation
    this.line.updateDataArray = function() {
    let xcoords = [], ycoords = [];
    // since this.r, this.pr and this.n is used in this function scope, they have to be defined in here too
    this.r = data.length > 4 ? data[4] : 6*pxunit;
    this.pr = data.length > 5 ? data[5] : 20;
    this.n = data.length > 6 ? data[6]*2+1 : Math.ceil(l1*(1-this.pr/50)/(5*pxunit));   
    // start point
    xcoords.push(x1(), xf()); 
    ycoords.push(y1(), yf());  
    // intermediate points
    for (let j = 1; j < (this.n+1); j++) {
      xcoords.push(xf()+dxf()*(j-0.5)/this.n+dyf()*cf()*(-1)**j);
      ycoords.push(yf()+dyf()*(j-0.5)/this.n-dxf()*cf()*(-1)**j);
    }
    // end point
    xcoords.push(xf()+dxf(), x2());	
    ycoords.push(yf()+dyf(), y2());	
    this.dataX = xcoords;
    this.dataY = ycoords;
    }
    // label
    let labelX = () => x1()+dx()/2-dy()/l2()*(this.off+this.r);
    let labelY = () => y1()+dy()/2+dx()/l2()*(this.off+this.r);
    this.lbl = board.create('point', [labelX,labelY], {name: toTEX(data[1]), ...centeredLabelStyle});
    // logging
    console.log("springt", data[1], data[2], data[3], this.r, this.pr, Math.floor(this.n/2), this.off);
    //this.p1.moveTo([4,1], 2000);
    // implement state switching
    this.obj = [ this.line, this.lbl.label ]; 
    // state init
    switch (this.state) {
    case 'show': show(this); makeSwitchable(this.line, this); break;
    case 'hide': hide(this); makeSwitchable(this.line, this); break;
    case 'SHOW': SHOW(this); break;
    case 'HIDE': HIDE(this); break;
    } 
    this.line.setAttribute({highlightFillOpacity:0});
    this.s = board.create('segment', [this.p1,this.p2],{strokeWidth:0});
    targets.push(this.s);
    this.loads = []
  }
  data(){ let a = this.d.slice(0); a.push(this.state); return a}
  name(){ return targetName(this) } 
  hasPoint(pt) {return (isOn(pt,this.s) || isOn(pt,this.p1)) && 
    JXG.Math.Geometry.distPointLine(
      [1,pt.X(),pt.Y()], this.s.stdform) < tolPointLine} 
}  

// [ "wall", "name", [x1, y1], [x2,y2] , angle ]
class wall {
  constructor(data) {
    this.state = (typeof data[data.length-1] == 'string') ? data.pop() : "SHOW";
    this.d = data;
    // dependent objects
    this.bl = board.create('segment', [data[2],data[3]], {name: '', ...normalStyle});
    this.c = board.create("comb", [data[2],data[3]], {
      ...hatchStyle(), angle: data[4]*deg2rad })
    // state switching
    this.obj = [ this.bl, this.c ]; 
    switch (this.state) {
    case 'show': show(this); makeSwitchable(this.c, this); break;
    case 'hide': hide(this); makeSwitchable(this.c, this); break;
    case 'SHOW': SHOW(this); break;
    case 'HIDE': HIDE(this); break;
    } 
    this.loads = []
  }
  data(){ let a = this.d.slice(0); a.push(this.state); return a}
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
  let m;
  for (m of state) {
    console.log(m);
    switch (m[0]) {
      case "angle":     objects.push(new angle(m)); break;
      case "angle1":    objects.push(new angle(m)); break;
      case "angle2":    objects.push(new angle(m)); break;
      case "bar":	objects.push(new bar(m)); break;
      case "beam":	objects.push(new beam(m)); break;
      case "circle":	objects.push(new circle(m)); break;
      case "circle2p":	objects.push(new circle2p(m)); break;
      case "crosshair":	objects.push(new crosshair(m)); break;
      case "dashpot":	objects.push(new dashpot(m)); break;
      case "dim": 	objects.push(new dim(m)); break;
      case "dir": 	objects.push(new dir(m)); break;
      case "disp": 	objects.push(new disp(m)); break;
      case "fix1": 	objects.push(new fix1(m)); break;
      case "fix12": 	objects.push(new fix12(m)); break;
      case "fix123": 	objects.push(new fix123(m)); break;
      case "fix13": 	objects.push(new fix13(m)); break;
      case "force": 	objects.push(new force(m)); break;
      case "forceGen":  objects.push(new forceGen(m)); break;
      case "frame": 	objects.push(new frame(m)); break;
      case "grid":  	objects.push(new grid(m)); break;
      case "label":   	objects.push(new label(m)); break;
      case "line": 	objects.push(new line(m)); break
      case "line2p": 	objects.push(new line2p(m)); break
      case "mass": 	objects.push(new mass(m)); break;     
      case "moment":  	objects.push(new moment(m)); break;
      case "momentGen":	objects.push(new momentGen(m)); break;
      case "node":      objects.push(new node(m)); break;
      case "point":     objects.push(new point(m)); break;
      case "polygon":   objects.push(new polygon(m)); break;
      case "q":  	objects.push(new q(m)); break;
      case "rope":      objects.push(new rope(m)); break;
      case "rot":       objects.push(new rot(m)); break;
      case "spline":  	objects.push(new spline(m)); break;
      case "springc":   objects.push(new springc(m)); break;
      case "springt":  	objects.push(new springt(m)); break;
      case "wall": 	objects.push(new wall(m)); break;
      default: console.log("Unknown object",m);
    }
  }
}

function update() {
  console.log(stateRef);
  if (!stateRef) { return }
  console.log("update")
  let m;
  let dfield = [];
  let names = "[";
  // get list of loads and targets 
  const load = [ "force", "moment"];
  const target = ["bar", "beam", "circle", "fix1", "fix12", "fix123", "fix13", "rope",
    "dashpot", "springc", "springt", "wall", "polygon", "q"];
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
// original toSTACK function
function toSTACK(str) { 
  let st = str.replace(/\s+/g, "*");
  if (st === "") {st = "NONAME"}
  return st
}

// toSTACK() test
//let input = "";
//let input = "q_0*3a";
//let input = "3a q_0";
let input = "a3 q_0";
//let input = "q_0 3a";
let result = toSTACK(input);
console.log(result);

function toTEX(str) { 
  if (str.search("_") != -1) { 
    str = str.replaceAll(/_([0-9a-z]+)/ig, '_{\$1}'); // subscript brackets
  }
  str = '\\('+str.replace(/[\*\s]/g, "\\;")+'\\)'; // converts stars to small math spaces and adds math mode brackets
  return  str}
// makes sure that a name consists of a single character with or without subscript. 
// If there is more than one character before the end or before the first subscript, then the name is modified.
// https://jsfiddle.net/0pzeu68g/1/
function cleanupName(str) {
  console.log('original string input is here: ' + str);
  let strList = str.split(/\s+|\*/);
  let out =""
  console.log("here is strList: " + strList)
  
  strList.forEach(function(st) {
  console.log("here is st: " + st);
  let pos = st.search("_") 
  if (st.length>1 && pos>1) { 
    // remove underscores at wrong places
    st = st.replace(/_/g, '')
    pos = -1}
  if (isNaN(st[0]) == true && st.length>1 && pos===-1) { st = st.substring(0, 1) + "_" + st.substring(1);} // insert an underscore if string is longer than one character
  else if (isNaN(st[0]) == false && st.length>1 && pos===-1) { st = st.substring(0, 1) + " " + st.substring(1);}
  // should output have * or just empty space? since toTEX() replaces * with empty spaces
  out = out + st + " "
  });
  out = out.slice(0, -1); // renove trailing space
  return out
  }

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
        for (let part of ref.obj) {
          part.setAttribute({highlight:false});
        } update()}
// applies settings for active state of fixed objects
function show(ref) { ref.state = "show";
        for (let part of ref.obj) {
          part.setAttribute({strokeOpacity:1, fillOpacity:1});
        } update()}
// applies settings for inactive state of fixed objects
function hide(ref) { ref.state = "hide";
        for (let part of ref.obj) {
          part.setAttribute({strokeOpacity:0.2, fillOpacity:0.2});
        } update()}
        // applies settings for active state of fixed objects with locked property (not highlighted)
function SHOW(ref) {
    ref.state = "SHOW";
    for (let part of ref.obj) {
      part.setAttribute({
        strokeOpacity: 1,
        fillOpacity: 1,
        highlight: false
      });
    }
    update()
  }
  // applies settings for inactive state of fixed objects with locked property (not highlighted)
  function HIDE(ref) {
    ref.state = "HIDE";
    for (let part of ref.obj) {
      part.setAttribute({
        strokeOpacity: 0.2,
        fillOpacity: 0.2,
        highlight: false
      });
    }
    update()
  }
    function hideforce(ref) {
    ref.state = "hideforce";
    for (let part of ref.obj) {
      part.setAttribute({
        strokeOpacity: 0,
        fillOpacity: 0,
        highlight: false
      });
    }
    update()
  }
  
function activate(ref) { ref.state = "active";
        for (let part of ref.obj) {
          part.setAttribute({visible:true});
          part.setAttribute({fixed:false});
          part.setAttribute({snapToGrid:true});
        } update()}
function deactivate(ref) { ref.state = "inactive";
        for (let part of ref.obj) {
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
  let [xmin, ymax, xmax, ymin] = board.getBoundingBox();
  let x = ref.X(), y = ref.Y();
  return (x<xmin || x>xmax || y<ymin || y>ymax) }
// sets a state switch callback to element el in object obj
function makeSwitchable(element, obj) {
 if (!Array.isArray(element)) {
    element = [element];
  }
for (const el of element) {
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
} 

// https://stackoverflow.com/questions/6832596/how-to-compare-software-version-number-using-js-only-number
function isNewerVersion (oldVer, newVer) {
	const oldParts = oldVer.split('.')	
	const newParts = newVer.split('.')
	for (let i = 0; i < newParts.length; i++) {
		const a = newParts[i] // parse int
		const b = oldParts[i] // parse int
		if (a > b) return true
		if (a < b) return false
	}
	return false
}

// initialization
let objects = [];
let targets = []; // for sliding of points 
init();
update();
