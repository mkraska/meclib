Inside STACK, there are several restrictions compared to Maxima:
- Don't rely on upper/lowercase for Input and PRT names. Using `M` and `m` as Input names may cause a database write error (you can't save your question).
- A letter must not follow a number. `F1x` isn't allowed. Use `F1_x` instead.
- Even `F1_x` is not allowed in input, validation will complain. [Forum discussion](https://moodle.org/mod/forum/discuss.php?d=433143)
- Names of meclib objects are Maxima expressions, not TeX (no backslash); see [[Labels and names]].
