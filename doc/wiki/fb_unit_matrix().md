## `[txt, isOK]: fb_unit_matrix(S, T, tol, [labels])`

- `txt` feedback text, only for the elements outside the tolerance (empty if all are correct)
- `isOK` true if every element is within the tolerance
- `S` student's answer (content of a matrix input)
- `T` teacher's answer, a matrix of the same size
- `tol` relative tolerance, as for [[fb_unit]], e.g. `0.005`
- `labels` (optional) names of the elements in the feedback, see below

[Source](https://github.com/mkraska/meclib/blob/main/Maxima/fb_value.mac)

`fb_unit_matrix()` checks every element of a matrix (or vector) answer with [[fb_unit]] and collects the messages. Each element with a message gets a line of its own, starting with its label; correct elements are not mentioned. The texts are bilingual (German and English).

Since `isOK` covers all elements, it is a complete numeric check: the PRT needs no `NumRelative` test on a list of components.

A list instead of a matrix is taken as a column vector. If `S` is not a matrix or has a different size, `txt` says so and `isOK` is false (STACK's matrix input normally prevents this).

## Labels

| `labels`                                    | label in the feedback      |
|---------------------------------------------|----------------------------|
| omitted or `"xyz"`, vector with up to 3 elements | x-component, y-component, z-component |
| `"index"`, or a vector with more than 3 elements | Element 1, Element 2, ... |
| omitted, matrix (more than one row and column)   | Row 1, column 2           |
| `['x_A, 'y_A]` (row by row)                 | the formulas x_A, y_A      |
| `["left", "right"]`                         | the texts as they are      |

Quote symbol labels (`'x_A`), so that a question variable of the same name is not substituted.

## Example

Input `S_rB` of type Matrix, model answer `rB: matrix([2.5], [-1.2]);`. The question text is a table row with label, input, unit and validation, see [[Matrix input]].

PRT `rB`:

| Field                     | Value                                                     |
|---------------------------|-----------------------------------------------------------|
| Feedback variables        | `[txt, isOK]: fb_unit_matrix(S_rB, rB, 0.005, ['x_B, 'y_B]);` |
| Answer test               | AlgEquiv                                                  |
| SAns                      | `isOK`                                                    |
| TAns                      | `true`                                                    |
| Quiet                     | Yes                                                       |
| Feedback (true and false) | `{@txt@}`                                                 |

| Student's answer | feedback |
|------------------|----------|
| `[2.5, -1.2]`    | (none)   |
| `[2.5, 1.2]`     | *y_B*: Check the sign. |
| `[25, -1.0]`     | *x_B*: The mantissa is correct but the value is off by at least one order of magnitude. Check your unit conversion. *y_B*: The value is too small by at least 10%. |

The Meclib Workbench creates this input, PRT and table row with its input dialog (type "vector / matrix of numbers").

See also [[fb_vars_matrix()]] for symbolic answers and [[Matrix Feedback]].
