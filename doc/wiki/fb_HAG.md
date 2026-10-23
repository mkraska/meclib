### Hypotenuse too long or too short?

`fb_HAG(H, A, G)`

- `H` hypotenuse
- `A`, `G` legs (Katheten)

Part of `fb_value.mac`:

```
stack_include("https://raw.githubusercontent.com/mkraska/meclib/main/Maxima/fb_value.mac");
```

Returns a feedback text for a feedback branch, after the variables have been checked with [[fb_vars]]:

- the hypotenuse is not longer than the longer leg: "The hypotenuse (1.41·a) must be longer than the longer of the two legs (3·a and 2.24·a)."
- the hypotenuse is not shorter than the sum of the legs: "The hypotenuse (7·a) must be shorter than the sum of the two legs (3·a + 2.24·a = 5.24·a)."
- otherwise `""`.

The texts are in German and English (see [[Multilingual questions]]). The values are shown as formulas with 3 significant figures and with the decimal separator of the question (`1,41·a` with the decimal comma). It is not recommended to have more than one symbolic variable in the expressions. This variable must have a declared sign (e.g. `assume(a>0)`), otherwise the comparisons cannot be decided.

Older questions define their own copy of `fb_HAG()` in the question variables. That copy writes the numbers with a decimal point regardless of the question's setting. The [[Meclib Workbench]] review offers to delete it and include `fb_value.mac` instead.

### PRT node

If you don't need the result of the test elsewhere, then you just put the function call where you want the feedback.

`{@fb_HAG(H, A, G)@}`
