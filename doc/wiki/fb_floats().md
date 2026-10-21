### Symbolic answers with rounded coefficients

`fb_floats()` checks a symbolic answer whose numbers may be rounded, e.g. `0.708*c*a` for the exact `(3*sqrt(5)-6)*c*a`. Unlike [[fb_coeffs()]], the expression need not be linear in its variables: products, powers, roots and functions are fine.

The function works in three steps:

1. Both answers are normalised with `expand(float(...))`. Exact constants such as `sqrt(5)` or `%pi` become decimal numbers, integer exponents stay integers, and factored forms are multiplied out (also inside roots and functions). Products of roots are combined first with `rootscontract()`, so that `sqrt(2)*sqrt(x)` (Maxima's form of `sqrt(2*x)`) and a single root agree; the same for `sqrt(a)*sqrt(...)`, which Maxima writes for `sqrt(a*(...))` when `a` is assumed positive.
2. Both are split into their summands. Each summand is a number (its coefficient, with the sign) times a variable part, e.g. `-0.317*a*c/m`; decimal numbers inside the variable part (e.g. under a root) are replaced by a placeholder. Each summand of the model answer gets the summand of the answer with the same variable part. If no summand has a partner, the answer as a whole gets the feedback of [[fb_vars]] (and of the unit check, see below), or, if that has nothing to say, the hint "Sorry, I have no more specific hints."
3. The numbers are compared one by one, in the same position, with [[fb_unit]] and the relative tolerance `tol`. For each number outside the tolerance, a message names the student's number together with the deviation, e.g. "Number 0.75: The value is too large by at least 5%." The student's number is shown with 4 significant figures (an exact answer gives long decimals), the expected value is not shown. If the answer differs from its evaluated form (exact constants such as `2*sqrt(5)-6`, factored forms), the evaluated form is shown first, with the deviating numbers underlined, e.g. "Evaluated, your answer is 0.6833·a·c/m + g. Marked number 0.6833: Check the sign." Without it the student could not find the number, which he never typed; the marking also tells equal numbers apart. The marking is an underline: a colour (`\color`) needs a MathJax extension that Moodle may fail to load.

4. Summands without a partner:
   - an extra summand of the answer is underlined in the evaluated form, e.g. "Evaluated, your answer is g − <u>0.317·a²·c/m</u>." It gets the feedback of [[fb_vars]] against the summands of the model answer without a partner (e.g. "Unexpected variable ac." for a typo), the unit check (see below), or, if neither has something to say, "Check the marked term." The text does not say whether the summand is wrong or does not belong to the result.
   - a summand of the model answer that is left over (more than the extra summands of the answer could stand for) gives "Your result is right except for a missing term." if everything else is right, otherwise "Also, a term is missing."

5. Function arguments: the calls of sin, cos, tan, cot, sec, csc, their inverses, the hyperbolic functions, log, exp and roots (powers with an exponent that is not an integer, e.g. `sqrt(...)`) are paired with those of the model answer, in order and by function. If the arguments of a pair differ, they are compared by `fb_floats()` itself, with the same tolerance, and the feedback is introduced by "In the argument of cos(2·α):" (for roots "Under the root:", for exp "In the exponent of ..."); then the call counts as right, so that the rest of the answer is still checked. A call without a partner (e.g. `sin` where the model answer has `cos`) is marked: if its argument is that of a call of the model answer without a partner, only the function name is underlined and the feedback says "Check the function.", otherwise the term is underlined with "Check the marked term." This also holds for an answer without any summand in common, e.g. `asin(...)` for `acos(...)`: the evaluated answer is shown with the call marked. A missing root (e.g. `v^2` entered for `v`) is not found this way; with `fb_dims` the unit check reports it.

`[text, ok]: fb_floats(sans, tans, tol)`

- `sans` student's answer
- `tans` teacher's answer (exact or decimal)
- `tol` relative tolerance of each number, e.g. `0.01` for 1 %

Returns a list `[text, ok]`:
- `text` the feedback text, empty if everything matches
- `ok` `true` if all summands have a partner and all numbers are within the tolerance, otherwise `false`

#### Example

| model answer `tans` | student's answer | result |
|---|---|---|
| `(3*sqrt(5)-6)*c*a` | `0.708*c*a` | right |
| `g-(3-6/sqrt(5))*c*a/m` | `g-0.317*a*c/m` | right |
| `sqrt(6*g*a-(3*sqrt(5)-6)^2*c*a^2/m)` | `sqrt(a*(6*g-0.502*c*a/m))` | right (same skeleton after `expand`) |
| `(3*sqrt(5)-6)*c*a` | `0.75*c*a` | "Number 0.75: The value is too large by at least 5%." |
| `(3*sqrt(5)-6)*c*a` | `0.708*c` | "Missing variable a" |
| `(3*sqrt(5)-6)*c*a` | `0.708*c*a^2` | general hint |
| `g-(3-6/sqrt(5))*c*a/m` | `g-0.317*a^2*c/m` | the second summand marked, "Check the marked term." |
| `g-(3-6/sqrt(5))*c*a/m` | `g-0.317*ac/m` | the second summand marked, "Unexpected variable ac. Missing variable a, c." |
| `g-(3-6/sqrt(5))*c*a/m` | `g` | "Your result is right except for a missing term." |
| `sqrt(v_0^2+2*g*r*(1-cos(alpha)))` | `sqrt(v_0^2+2*(1-cos(2*alpha))*g*r)` | "Under the root: In the argument of cos(2·α): Number 2: The value is too large by at least 100%." |
| `sqrt(v_0^2+2*g*r*(1-cos(alpha)))` | `sqrt(v_0^2+2*(1-sin(alpha))*g*r)` | "Under the root: Evaluated, your answer is −2·g·r·<u>sin</u>(α) + v₀² + 2·g·r. Check the function." |
| `3*exp(-x)` | `3*exp(-2*x)` | "In the exponent of e^(−2x): Number −2: The value is too large by at least 100%." |

#### Units

If the question declares the units of its variables in `fb_dims`, the marked summands (or the whole answer, if no summand has a partner) are also checked for their unit:

```
fb_dims: [a = "m", c = "N/m", m = "kg", g = "m/s^2"];
```

The units are strings, read by a small parser of the library and not by Maxima, so that the unit `m` (metre) never meets the variable `m` (mass). A name on the left that has a value in the question variables is written as a string, too (`"m" = "kg"`); a dimensionless variable gets `1`. Units: m, g, s, A, K, mol, N, J, W, Pa, bar, Hz, C, V, Ohm, min, h, d, t, l, L, rad, deg, rpm, with the prefixes p, n, u, m, c, d, h, k, M, G, T (e.g. `kN`, `mm`, `MPa`); products with `*` or a blank, quotients with `/`, powers `^2`, `^-1`, `^(1/2)`, parentheses (e.g. `"kg/(m s^2)"`). The feedback shows units in SI base units:

- "The marked term has the unit m²/s², the result m/s²."
- "The marked term adds quantities of different units." (e.g. `sqrt(a+g)`)
- "In the marked term, a function (e.g. sin, exp, ln) or an exponent has an argument with a unit." (e.g. `sin(a)`)
- for the whole answer: "Your result has the unit kg·m/s² instead of m/s²." and the like

If a summand has a wrong unit, the numbers are not judged (neither marked nor named): with a wrong unit, a number cannot be right or wrong. A variable that is not declared, or a unit that the parser does not know, switches the check off for that summand (for the model answer: altogether), so that a typo is reported by [[fb_vars]] and not as a wrong unit. Without `fb_dims` there is no unit check.

`fb_dimension(sans, tans)` does the unit check of the whole answer alone, e.g. together with [[fb_vars]]; it returns the text, `""` if the unit is right or cannot be checked.

#### Limitations

- Equivalent forms that `expand()` does not unify have different variable parts and are not accepted, e.g. `1.41*sqrt(x)` for `sqrt(2*x)` (a decimal factor is not moved into the root), or trigonometric identities.
- The comparison uses Maxima's internal form, in which the sign of a term belongs to its number (`g - 0.3*x` is `g + (-0.3)*x`). A wrong sign is therefore reported for the number ("Check the sign."), also when an exact answer with a wrong integer gives a coefficient of the other sign.
- Integer exponents are compared exactly (they are part of the skeleton), integer factors are compared with the tolerance like every other number.
- The input must allow decimal numbers (`forbidfloat` off).

### Question variables

```
stack_include("https://raw.githubusercontent.com/mkraska/meclib/main/Maxima/fb_value.mac");
```

### PRT

Feedback variables:
```
r: fb_floats(S_F, F, 0.01);
```
Node: answer test `AlgEquiv`, SAns `r[2]`, TAns `true`; feedback `{@r[1]@}` in both branches.
