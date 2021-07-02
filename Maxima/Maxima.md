# Feedback 

### Feedback for numeric input with units

- Correct base units? (is done with UnitRelative and Co)
- Is the value provided strictly numeric (not an un- or just partly simplified expression)? (how to do this?) -> for numeric input only, you have the extra options `intnum` and `floatnum`
- Is the result off by an order of magnitude? ([forum discussion](https://moodle.org/mod/forum/discuss.php?d=414968), MantissaOK)

### Feedback for symbolic input

- missing and spurious variables? 
- correct dimension (simplifies to the same base unit)? This requires specification of units for each variable. ([forum discussion](https://moodle.org/mod/forum/discuss.php?d=406908#p1673135), [Github issue](https://github.com/maths/moodle-qtype_stack/issues/665))
- off by a numeric factor? (note, expressions aren't necessarily products)

### Input and validation issues

- ambiguous validation: x0 and x_0 ([forum discussion](https://moodle.org/mod/forum/discuss.php?d=412362))
- ambiguous validation: f(x) and f*x ([forum discussion](https://moodle.org/mod/forum/discuss.php?d=412082))
- wrong validation: 1 *N as 1^N ([forum discussion](https://moodle.org/mod/forum/discuss.php?d=397717))
- compound symbols like \\/\delta\\varphi\\) in input and validation ([forum discussion](https://moodle.org/mod/forum/discuss.php?d=414174))
- display of expressions (formatting), [forum discussion](https://moodle.org/mod/forum/discuss.php?d=413914)
- handling of derivatives in input ([forum discussion](https://moodle.org/mod/forum/discuss.php?d=413723))
- input of pure integers or floats ([forum diskussion](https://moodle.org/mod/forum/discuss.php?d=405460))

# Maxima functions

## Test for missing or spurious variables

These functions produce dynamic feedback text, which can be displayed in the `false` branch of a PRT. Based on this [Github issue](https://github.com/maths/moodle-qtype_stack/issues/662).
 
```
spurious(%_tans,%_sans) := block([%_tansvar,%_sansvar,%_extras,simp],
  simp: true, /* Extract vars with simp:true does mean that "x/x+y" -> [y] */
  %_sansvar: setify(listofvars(%_sans)),
  %_tansvar: setify(listofvars(%_tans)),
  %_extras: setdifference(%_sansvar, %_tansvar),
  if length(%_extras) > 0 then 
    return(sconcat("<br>Damit kann ich nichts anfangen: \\(",
      stack_disp_comma_separate(listify(%_extras)) , "\\).") ),
  "" );

missing(%_tans,%_sans) := block([%_tansvar,%_sansvar,%_missing, simp],
  simp: true, /* Extract vars with simp:true does mean that "x/x+y" -> [y] */
  %_sansvar: setify(listofvars(%_sans)),
  %_tansvar: setify(listofvars(%_tans)),
  %_missing: setdifference(%_tansvar, %_sansvar),
  if length(%_missing) > 0 then 
    return(sconcat("<br>Folgendes sollte in Ihrem Ergebnis eigentlich vorkommen: \\(",
      stack_disp_comma_separate(listify(%_missing)), "\\).") ),
  "" );
```
**PRT**

Feedback variables: 

```
stext: spurious(tans, sans);
mtext: missing(tans, sans);
```

any branch of the tree where you want to place the feedback (use the first test by default):

```
{@mtext@}{@stext@}
```
