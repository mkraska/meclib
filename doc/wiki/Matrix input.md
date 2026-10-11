## Question variables

```
M: matrix( [a, b], [c, d] );
```

The size of the model answer sets the size of the input.

## HTML template for question text

A matrix input is a block of its own, so label, input, unit and validation go into one table row:

```
<table border="0">
 <tbody>
  <tr>
   <td>\( \left[ \begin{array}{cc} a & b \\ c & d \end{array} \right] = \) </td>
   <td>[[input:S_M]]</td>
   <td>\(\, optional unit\)</td>
   <td>[[validation:S_M]]</td>
  </tr>
 </tbody>
</table>
<p>[[feedback:M]]</p>
```

Feedback: [[fb_unit_matrix()]] for numbers, [[fb_vars_matrix()]] for expressions, see also [[Matrix Feedback]].
