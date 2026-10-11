Feedback for matrix (vector) answers checks every element and reports only the wrong elements, each with a label such as "x-component" or "Row 2, column 1". Two functions from `fb_value.mac` do this:

| Answer      | Function               | Result                                                  |
|-------------|------------------------|---------------------------------------------------------|
| numbers     | [[fb_unit_matrix()]]   | `[txt, isOK]`: feedback text and a complete numeric check |
| expressions | [[fb_vars_matrix()]]   | `txt`: feedback text only                               |

Both are bilingual (German and English, chosen by the question's language like all meclib feedback). For the question text (a table row with label, input, unit and validation) see [[Matrix input]].

## Input

| Field                | Value                                                                 |
|----------------------|-----------------------------------------------------------------------|
| Input type           | Matrix                                                                |
| Model answer         | matrix variable, e.g. `A: matrix([2.5], [-1.2]);` (its size sets the size of the input) |
| Students must verify | Yes                                                                   |
| Show validation      | Yes, compact                                                          |

## PRT for numeric answers

| Field                     | Value                                        |
|---------------------------|----------------------------------------------|
| Feedback variables        | `[txt, isOK]: fb_unit_matrix(S_A, A, 0.005);` |
| Answer test               | AlgEquiv                                     |
| SAns                      | `isOK`                                       |
| TAns                      | `true`                                       |
| Quiet                     | Yes                                          |
| Feedback (true and false) | `{@txt@}`                                    |

`isOK` is true only if every element is within the relative tolerance (as in [[fb_unit]]), so no `NumRelative` test on a list of components is needed.

## PRT for symbolic answers

| Field                     | Value                                   |
|---------------------------|-----------------------------------------|
| Feedback variables        | `txt: fb_vars_matrix(S_A, A, []);`      |
| Answer test               | AlgEquiv                                |
| SAns                      | `S_A`                                   |
| TAns                      | `A`                                     |
| Quiet                     | Yes                                     |
| Feedback (true and false) | `{@txt@}`                               |

The third argument is the list of variables whose terms are checked, as in [[fb_vars]]. `fb_vars_matrix()` has no flag: no message does not prove that the answer is correct, so the answer test compares the whole matrix.

## Labels

Without a label argument:

- vectors with up to 3 elements: x-component, y-component, z-component
- longer vectors: Element 1, Element 2, ...
- matrices: Row 1, column 2

Other labels:

```
fb_unit_matrix(S_A, A, 0.005, "index")            /* Element 1, Element 2, ... */
fb_unit_matrix(S_A, A, 0.005, ['N, 'Q_y, 'Q_z])   /* formulas N, Q_y, Q_z, row by row */
fb_vars_matrix(S_A, A, [], ['x_A, 'y_A])          /* formulas x_A, y_A */
```

Quote symbol labels (`'x_A`), so that a question variable of the same name is not substituted.

## Example

Model answer `A: matrix([2.5], [-1.2])`, labels `['x_B, 'y_B]`, student's answer `[25, -1.0]`. Feedback (each element on its own line):

- *x_B*: The mantissa is correct but the value is off by at least one order of magnitude. Check your unit conversion.
- *y_B*: The value is too small by at least 10%.

The Meclib Workbench creates input, PRT and question text with its input dialog (types "vector / matrix of numbers" and "vector / matrix of expressions").

## Older questions

Questions written before these functions compare the components with `NumRelative` on a list and add one `fb_unit` or `fb_vars` line per component to the feedback:

```
toList(m):= args(transpose(m))[1];      /* feedback variables */
SAns: toList(S_A)   TAns: toList(A)     /* NumRelative, quiet */
```

They keep working; `toList` covers column vectors only.
