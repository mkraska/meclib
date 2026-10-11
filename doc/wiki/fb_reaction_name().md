### `name: fb_reaction_name(o, n, i, default)`

- `name` the name the student gave the reaction force at object `i`, or `default`
- `o` the meclib object list (`stackjson_parse(objects)`)
- `n` the `names` array (content of the `names` input field)
- `i` index of the support or contact object that is replaced by the reaction
- `default` value returned if no single reaction force can be found at `i`

[Source](https://github.com/mkraska/meclib/blob/main/Maxima/fb_fbd.mac)

`fb_reaction_name()` returns the name of the reaction force that meclib matched to object `i`. It returns `default` if
- `n[i]` is not a list of matched loads (the object is not deactivated or has no reaction yet),
- more than one load is matched to object `i`, or
- the matched load is not a force (e.g. a moment).

It never produces feedback text and has no `[text, OK]` result. It is meant for cosmetic, dynamic labels, e.g. to show the student's own name of the reaction next to a numeric input field, falling back to a fixed placeholder as long as the reaction is not yet resolved. Check the reaction itself with [[Feedback for "contact"]] (`fb_contact()`), [[Feedback for unidirectional supports]] (`fb_unidir()`) or [[fb_bar]] on the same index, and its name with [[fb_name()]].

### Example: label in front of an input field

Taken from `demo_questions/contact_demo_01.xml`. The label is the feedback of a separate PRT `FA_label`, placed in front of the input field. The PRT gives no score; it only shows the name.

Question text:

    [[feedback:FA_label]] [[input:S_FA]] [[validation:S_FA]] [[feedback:FA]]

PRT `FA_label`, feedback style *Formative* (no score, no symbols):

Feedback variables:

    obj: stackjson_parse(objects);
    nameA: fb_reaction_name(obj, names, i_A, "A");

Node 1: SAns `true`, TAns `true`, answer test AlgEquiv, quiet, score 0; feedback in both branches:

    \({@nameA@} = \)

Here the feedback is a dynamic part of the question text, so its format may stay Markdown (the yellow feedback background is not wanted here).

| Situation at object `i_A` | label |
|---|---|
| contact A shown, or no force on it yet | A = (the default) |
| one force named `F_A` on the deactivated contact | F_A = |
| two forces on the deactivated contact | A = (the default) |
| a moment on the deactivated contact | A = (the default) |
