### `[txt, OK]: fb_unique_names(o, n, supports)`

- `o` the meclib object list (`stackjson_parse(objects)`)
- `n` the `names` array (content of the `names` input field)
- `supports` list of indices of the supports and contacts whose reactions are compared

[Source](https://github.com/mkraska/meclib/blob/main/Maxima/fb_fbd.mac)

`fb_unique_names()` checks that the reactions at the given supports all have different names. It compares the loads meclib matched to each support (`n[i]`), at different supports and at the same support. Other loads (weights, given forces) are not compared, they may legitimately share a name with something else.

Use it when the accepted names overlap, e.g. if both contacts of a body accept `N` (`fb_contact(o, n, 1, "A: ", "static", ["N", "N_A"], ...)` and the same for B). Each support check then passes on its own, and only `fb_unique_names()` notices that `N` is used twice.

Result:
- `["", true]` if no name occurs twice,
- otherwise one line per repeated name, with the supports where it occurs, and `false`:

  *Der Name \(N\) wird für mehrere Reaktionen verwendet (A, B). Reaktionen brauchen verschiedene Namen.*  
  *The name \(N\) is used for more than one reaction (A, B). Reactions need different names.*

Supports without a name (e.g. contacts with `""` as label, since a label would sit right on the point) are not listed; if none of them has a name, the brackets are left out: *Der Name \(N\) wird für mehrere Reaktionen verwendet. …*

Supports without matched loads are skipped, so the function can run before the support checks.

### Example

Feedback variables:

    obj: stackjson_parse(objects);
    [utxt, uOK]: fb_unique_names(obj, names, [1, 2]);
    [atxt, aOK]: fb_contact(obj, names, 1, "A: ", "static", ["N", "N_A"], ["H", "H_A"]);
    [btxt, bOK]: fb_contact(obj, names, 2, "B: ", "smooth", ["N", "N_B"]);
    txt: castext_concat(utxt, castext_concat(atxt, btxt));
    OK: uOK and aOK and bOK;

Node 1: `AlgEquiv(OK, true)`, feedback `{@txt@}` in both branches.

See also [[Feedback for Free Body Diagrams]], [[Feedback for "contact"]], [[Feedback for "fix12"]] (checks the two reactions of one support).
