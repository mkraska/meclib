# Labels and names

The name of a meclib object (second element of its definition, e.g. `"F_1"` in `["force", "F_1", ...]`) is used twice:

- as the **label** in the sketch, typeset by MathJax in math mode, and
- for interactive scenes, as the object's entry in the input **`names`** (see the column "Return value in `names`" in [[List of Objects]]). There it must be a valid Maxima expression in STACK.

So write names in Maxima syntax, not in TeX. meclib (function `toTEX()`, since Meclib 2026 11 16) turns them into TeX for the label. This applies to all objects with a label: [["angle"]], [["angle1"]], [["angle2"]], [["circle"]], [["contact"]], [["dashpot"]], [["description"]], [["dim"]], [["dir"]], [["disp"]], [["fix1"]], [["fix12"]], [["fix123"]], [["fix13"]], [["force"]], [["forceGen"]], [["grid"]] (axis labels), [["mass"]], [["moment"]], [["momentGen"]], [["node"]], [["point"]], [["q"]], [["rot"]], [["springc"]], [["springt"]].

## Rules

| Name | Label | Rule |
|---|---|---|
| `F_1`, `F_Ax` | $F_{1}$, $F_{Ax}$ | subscript after `_` (letters and digits) |
| `m*g`, `m g` | $m\;g$ | stars and blanks become small spaces `\;` |
| `alpha`, `omega_S`, `x_alpha` | $\alpha$, $\omega_{S}$, $x_{\alpha}$ | names of Greek letters as whole words |
| `Pi`, `Delta`, `Omega` | $\Pi$, $\Delta$, $\Omega$ | capitals only where TeX has them (`Gamma Delta Theta Lambda Xi Pi Sigma Upsilon Phi Psi Omega`) |
| `phi`, `epsilon` | $\varphi$, $\varepsilon$ | variant form, as STACK shows them |
| `alpha1`, `omega12` | $\alpha_{1}$, $\omega_{12}$ | digits after a Greek name become a subscript, as in STACK |
| `Delta*p`, `Delta p` | $\Delta p$ | no space after `Delta` and `delta` |
| `Fhat`, `F_hat` | $\hat{F}$ | accents `hat`, `bar`, `dot`, `ddot` as suffix of a single letter or a Greek name, with or without underscore |
| `xdot`, `x_ddot`, `vbar` | $\dot{x}$, $\ddot{x}$, $\bar{v}$ | |
| `phi_ddot`, `Fhat_A` | $\ddot{\varphi}$, $\hat{F}_{A}$ | subscript after the accent |
| `x_ddot*m`, `phi_ddot*Theta` | $\ddot{x}\;m$, $\ddot{\varphi}\;\Theta$ | e.g. inertial forces and moments in free body diagrams |
| `alphax`, `Alpha`, `F1` | $alphax$, $Alpha$, $F1$ | unchanged (no Greek name, no accent) |

A single letter followed by `hat`, `bar`, `dot` or `ddot` is always read as an accent (`what` gives $\hat{w}$).

## Names in `names`

- Blanks become stars (`m g` → `m*g`), an empty name becomes `NONAME`, which STACK does not accept. A [["force"]] or [["moment"]] in an interactive scene therefore needs a name.
- A backslash makes the whole input invalid in STACK. Do not use TeX names like `"\\Delta p"` or `"\\alpha"` for objects that write their name to `names`. Use `"Delta*p"` and `"alpha"` instead.
- Objects that write `0` (e.g. [["label"]]) or nothing to `names` may use TeX. [["label"]] shows its text as it is, without `toTEX()` (write `"\\(\\Delta p\\)"`).

## Same notation in STACK

STACK shows Greek names in the same way. For accents, give the variable a TeX form in the question variables, e.g. for an impulse $\hat{F}$:

```
texput(Fhat, "\\hat{F}");
```

Then `Fhat` looks the same in the sketch, in the question text (`{@Fhat@}`), in the validation of the students' input and in the feedback. Tell the students how to type it, e.g. "write $\hat{F}$ (F hat) as `Fhat`", since this does not follow from the usual subscript notation.

## Names typed by students ([["forceGen"]], [["momentGen"]])

Before it is used, the name in the input field is brought into the form base, accent, subscript: the base is a Greek letter name or one letter, an accent follows directly without underscore, the rest becomes a subscript. Factors are separated by blanks or stars.

| Typed | Name | Label |
|---|---|---|
| `F1`, `FA` | `F_1`, `F_A` | $F_{1}$, $F_{A}$ |
| `omegaS` | `omega_S` | $\omega_{S}$ |
| `F_hat`, `FhatA`, `F_hat_A` | `Fhat`, `Fhat_A`, `Fhat_A` | $\hat{F}$, $\hat{F}_{A}$ |
| `Ahatx` | `Ahat_x` | $\hat{A}_{x}$ |
| `x_ddot m`, `xddot*m` | `xddot m` | $\ddot{x}\;m$ (in `names`: `xddot*m`) |
| `phi_ddot Theta` | `phiddot Theta` | $\ddot{\varphi}\;\Theta$ |

So the model answer of a question should use the same form, e.g. `xddot*m` for an inertial force, not `x_ddot*m`. The input field grows with the name.

For subscripted names with an accent, put the accent at the base: `Ahat_x`. In STACK, one `texput(Ahat, "\\hat{A}")` then covers `Ahat`, `Ahat_x`, `Ahat_y` (STACK typesets the parts of a name with underscores separately).
