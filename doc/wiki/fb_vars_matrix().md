## `txt: fb_vars_matrix(S, T, [vars, labels, tol])`

- `txt` feedback text, only for the elements with a message (empty otherwise)
- `S` student's answer (content of a matrix input)
- `T` teacher's answer, a matrix of the same size
- `vars` (optional, default `[]`) as for [[fb_vars]]: variables whose terms are checked
- `labels` (optional) names of the elements in the feedback, as for [[fb_unit_matrix()]]
- `tol` (optional, default `0`) as for [[fb_vars]]

[Source](https://github.com/mkraska/meclib/blob/main/Maxima/fb_value.mac)

`fb_vars_matrix()` checks every element of a matrix (or vector) answer with [[fb_vars]] and collects the messages, each element on a line of its own, starting with its label. The texts are bilingual (German and English). The argument positions are those of `fb_vars(sans, tans, vars, label, tol)`, with a list of labels instead of a single label.

Like `fb_vars()`, it returns text only: no message does not prove that the answer is correct. The PRT therefore tests the whole matrix with AlgEquiv and only shows the text.

## Example

Input `S_xM1` of type Matrix, model answer `xM1: matrix([4*a], [3*a]);`

PRT `xM1`:

| Field                     | Value                                   |
|---------------------------|-----------------------------------------|
| Feedback variables        | `txt: fb_vars_matrix(S_xM1, xM1, []);`  |
| Answer test               | AlgEquiv                                |
| SAns                      | `S_xM1`                                 |
| TAns                      | `xM1`                                   |
| Quiet                     | Yes                                     |
| Feedback (true and false) | `{@txt@}`                               |

| Student's answer | feedback |
|------------------|----------|
| `[4*a, 3*a]`     | (none)   |
| `[4*a+b, 3*a]`   | *x*-component: Unexpected variable *b*. |
| `[4*a, 3]`       | *y*-component: Missing variable *a* (`a`). |

The Meclib Workbench creates this input, PRT and table row with its input dialog (type "vector / matrix of expressions").

See also [[Matrix Feedback]].
