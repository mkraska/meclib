# Feedback 

### Feedback for numeric input

- Is the value less or greater than expected? 

### Feedback for numeric input with units

- Correct base units? (is done with UnitRelative and Co)
- Is the value provided strictly numeric (not an un- or just partly simplified expression)? (how to do this?) -> for numeric input only, you have the extra options `intnum` and `floatnum`
- Is the result off by an order of magnitude? ([forum discussion](https://moodle.org/mod/forum/discuss.php?d=414968), MantissaOK)

### Feedback for symbolic input

- missing and spurious variables? [see below](https://github.com/mkraska/meclib/blob/main/Maxima/Maxima.md#maxima-functions).
- correct dimension (simplifies to the same base unit)? This requires specification of units for each variable. ([forum discussion](https://moodle.org/mod/forum/discuss.php?d=406908#p1673135), [Github issue](https://github.com/maths/moodle-qtype_stack/issues/665))
- off by a numeric factor? (note, expressions aren't necessarily products)

### Feedback for interactive graphical input

- extraction of sums of forces and moment, see below
- values and slope of splines, see below.

### Input and validation issues

- ambiguous validation: `x0` and `x_0` ([forum discussion](https://moodle.org/mod/forum/discuss.php?d=412362))
- ambiguous validation: `f(x)` and `f*x` ([forum discussion](https://moodle.org/mod/forum/discuss.php?d=412082))
- wrong validation: `1 *N` as `1^N` ([forum discussion](https://moodle.org/mod/forum/discuss.php?d=397717))
- compound symbols like <img src="https://render.githubusercontent.com/render/math?math=\delta\varphi"> in input and validation ([forum discussion](https://moodle.org/mod/forum/discuss.php?d=414174))
- display of expressions (formatting), [forum discussion](https://moodle.org/mod/forum/discuss.php?d=413914)
- handling of derivatives in input ([forum discussion](https://moodle.org/mod/forum/discuss.php?d=413723))
- input of pure integers or floats ([forum diskussion](https://moodle.org/mod/forum/discuss.php?d=405460))

# Maxima functions

These functions produce dynamic feedback text, which can be displayed in the `false` branch of a PRT.

## Test for missing or spurious variables

 Based on this [Github issue](https://github.com/maths/moodle-qtype_stack/issues/662).
 See also this [Moodle forum post](https://moodle.org/mod/forum/discuss.php?d=424219#p1708698).
 
```
spurious(%_tans,%_sans) := block([%_tansvar,%_sansvar,%_extras,simp],
  simp: true, /* Extract vars with simp:true does mean that "x/x+y" -> [y] */
  %_sansvar: setify(listofvars(%_sans)),
  %_tansvar: setify(listofvars(%_tans)),
  %_extras: setdifference(%_sansvar, %_tansvar),
  if length(%_extras) > 0 then 
    return( [ "<br>Unerwartete Variable: ", %_extras ] ),
  "" );

missing(%_tans,%_sans) := block([%_tansvar,%_sansvar,%_missing, simp],
  simp: true, /* Extract vars with simp:true does mean that "x/x+y" -> [y] */
  %_sansvar: setify(listofvars(%_sans)),
  %_tansvar: setify(listofvars(%_tans)),
  %_missing: setdifference(%_tansvar, %_sansvar),
  if length(%_missing) > 0 then 
    return( [ "<br>Erwartete Variable: ",    %_missing ] ),
  "" );
```
**PRT**

Feedback variables: 

```
stest: spurious(tans, sans);
mtest: missing(tans, sans);
```

any branch of the tree where you want to place the feedback (use the first test by default):

```
{@stest[1]@}{@stest[2]@}
{@mtest[1]@}{@mtest[2]@}
```
## Test for less or greater than expected

```
ltgt(%_sans, %_tans, %_tol) := block(
  if %_tans - %_sans > %_tol*%_tans then  return("Der Wert ist zu klein. "),
  if %_tans - %_sans < -%_tol*%_tans then  return("Der Wert ist zu gro&szlig;. "),
  "" );
```
Feedback variables: 

```
ttest: ltgt(sans, tans, tol);
```

any branch of the tree where you want to place the feedback (use the first test by default):

```
{@ttest@}
```
## Extraction of Sums of Forces and Moments from iMecLib images

### Question Variables

Unit vector from a `force` object

```
unitvec(l):=block( [v] , v:round((l[4]-l[3])*10),v/sqrt(v[1]^2+v[2]^2));
```

Sign of a `moment` object

```
msign(l):=block( [v1,v2] , v1:l[4]-l[3],v2:l[5]-l[3],round(signum(v1[1]*v2[2]-v1[2]*v2[1])));
```

Moment of a force object about a reference point

```
moment(l,p):=block( [f,r] , f:unitvec(l),r:l[3]-p, r[1]*f[2]-r[2]*f[1]);
```

### Feedback Variables

- `rp` reference point
- `lu` symbolic length unit
- `objects` Input field with object list
- `names` Input field with object names

```
rp:[0,0];
lu:a;
data: stackjson_parse(objects);
f:[0,0];
for i:1 thru length(data)  do ( if (data[i][1]="force") then f: f+names[i]*unitvec(data[i])); 
m:0;
for i:1 thru length(data)  do ( if (data[i][1]="force") then m: m+names[i]*lu*moment(data[i],rp)); 
for i:1 thru length(data)  do ( if (data[i][1]="moment") then m: m+names[i]*msign(data[i])); 
```

### PRT Node

Display of the sum of forces and moments (use standard feedback format).

```
<p>\( \displaystyle \Sigma F_x={@f[1]@}\) </p>
<p>\( \displaystyle \Sigma F_y={@f[2]@}\) </p>
<p>\( \displaystyle \Sigma M_0={@m@}\) </p>
```


## Feedback on Value and Slope of Splines


### Question Variables


Generic function for feedback on splines. The comparison is made usng 3 decimal places.


```
splinefeedback(%_sans,%_tans,%_x1,%_x2):=block( [simp,%_s1,%_s2], 
  simp:true, 
  %_s1: string(%_x1),
  %_s2: string(%_x2),
  sconcat( "\\( \\in",  %_s1, "\\ldots ",  %_s2, "\\)",
     if round(1000*(at(%_sans,x=%_x1) - at(%_tans,x=%_x1))) # 0 then sconcat("<br>Der Wert bei \\(", %_s1, "\\) stimmt nicht.") else "", 
     if round(1000*(at(%_sans,x=%_x2) - at(%_tans,x=%_x2))) # 0 then sconcat("<br>Der Wert bei \\(", %_s2, "\\) stimmt nicht.") else "", 
     if round(1000*(at(diff(%_sans,x),x=%_x1) - at(diff(%_tans,x),x=%_x1))) # 0 then sconcat("<br>Der Anstieg bei \\(", %_s1, "\\) stimmt nicht.") else "", 
     if round(1000*(at(diff(%_sans,x),x=%_x2) - at(diff(%_tans,x),x=%_x2))) # 0 then sconcat("<br>Der Anstieg bei \\(", %_s2, "\\) stimmt nicht.") else "" ) );
```


### Feedback Variables

- `S_a1` function for the interactively modified spline (taken from the names input field, referenced by object index in the list)
- `a1` teachers solution
- `x1` x value for left bound
- `x2` x value for the right bound

```
S_a1: names[4];
stext: splinefeedback(S_a1,a1,0,t1);
```

### PRT Node

Test for identity of the curves:

AlgebraicEquivalence(S_a1, a1). The coefficients of the reference solution must be rounded to 3 decimal places. 

Display the interval and eventual hints on wrong values or wrong slope on either side of the interval. Use this in both branches of the node.

```
\(a \) f??r  \(t / \mathrm{s} \) {@stext@}
```