### `[txt, OK]: fb_EE(S, T, options)`

- `S` the student's expression for one **Equation** of **Equilibrium** (the sum, `= 0` implied), e.g. the input `S_GGx`
- `T` the reference, e.g. `sumF(...)` or `sumM(...)` of the student's own free-body diagram, see [[Sums of Forces and Moments]]
- `options` (optional) list of options `name = value`:
  - `subst` substitutions applied to both sides before comparing, e.g. `[alpha = atan(yB/xA)]`: symbols of the problem that stand for numbers of the sketch, so that `sin(alpha)` and `2/sqrt(13)` count as equal
  - `kind` what is summed, for the hint on a wrong sign: `"M"` for moments, otherwise the name of the direction, e.g. `"x"`, `"y"`, `"\\xi"`
  - `title` LaTeX title put in front of a message, e.g. `"\\Sigma F_x"` (only needed if several equations share one feedback)

[Source](https://github.com/mkraska/meclib/blob/main/Maxima/fb_fbd.mac) (needs `fb_value.mac` too, for `fb_vars()`)

`fb_EE()` gives feedback on one equation of equilibrium:

- right: `txt` is empty, `OK` is `true`,
- only the sign of the whole sum is wrong: *Zählen Sie Kräfte in positiver \(x\)-Richtung positiv.* (`kind = "x"`), *Zählen Sie Momente gegen den Uhrzeigersinn positiv.* (`kind = "M"`), or a general hint without `kind`,
- otherwise the hints of `fb_vars()`: unexpected or missing names, terms to check,
- if even that finds nothing: *Die Gleichung passt nicht zu Ihrem Freischnitt.*

The text starts with `<br>` as with the other feedback functions.

One equation per call: a PRT is evaluated only when all its inputs are answered (STACK), so one PRT per equation gives feedback as soon as that equation is entered. Several calls in one PRT are possible, each with its own `title`.

The reference comes from the student's own free-body diagram, so the equations are checked against the student's names and senses; mistakes in the diagram are judged by [[fb_fbd()]] and the support functions, not twice.

### Example

Taken from `demo_questions/contact_demo_03 static friction.xml`; one PRT per equation.

Feedback variables of PRT GGx:

    obj: stackjson_parse(objects);
    [textGGx, okGGx]: fb_EE(S_GGx, sumF(obj, names, [1,0], [contacts = [i_A, i_B]]),
                            [subst = [alpha = atan(yB/xA)], kind = "x"]);

PRT GGM:

    obj: stackjson_parse(objects);
    [textGGM, okGGM]: fb_EE(S_GGM, sumM(obj, names, names[i_P], a, [contacts = [i_A, i_B], at = [[i_G, pA*a + rS]]]),
                            [subst = [alpha = atan(yB/xA)], kind = "M"]);

Node 1: `AlgEquiv(okGGx, true)`; feedback `{@textGGx@}` in the false branch.
