### `[nName, tName, tDir]: fb_contact_reactions(o, n, i)`

- `o` the meclib object list (`stackjson_parse(objects)`)
- `n` the `names` array (content of the `names` input field)
- `i` index of the [["contact"]] object

[Source](https://github.com/mkraska/meclib/blob/main/Maxima/fb_fbd.mac)

`fb_contact_reactions()` returns the names the student gave the reactions at a contact, sorted by direction:

- `nName` name of the force along the contact normal (the normal force),
- `tName` name of the force along the tangent (the friction force),
- `tDir` direction of the friction force as drawn (unit vector), e.g. to read its sense.

Each is `false` if no such force is found (also while the contact is not deactivated). If there are several, the first one is taken. The tolerance is that of [[Feedback for "contact"]] (sine or cosine of the angle below 0.05). Moments and oblique forces are ignored.

It gives no feedback. Check the contact itself with `fb_contact()` and the names with [[fb_unique_names()]]. The function is meant for reference solutions that use the student's names, e.g. equilibrium equations, when several names are accepted for a reaction.

### Example: equilibrium in x with the student's names

Taken from `demo_questions/contact_demo_03 static friction.xml` (smooth contact A, rough contact B, `tAB` points from A to B).

Feedback variables:

    obj: stackjson_parse(objects);
    [nA, tA, dA]: fb_contact_reactions(obj, names, i_A);
    [nB, tB, dB]: fb_contact_reactions(obj, names, i_B);
    if member(false, [nA, nB, tB]) then (
      txt: "Vervollständigen Sie zuerst den Freischnitt.", ok: false
    ) else (
      sR: signum(float(dB . tAB)),      /* sense of the friction force as drawn */
      ref: subst([N_A = nA, N_B = nB, R_B = tB], N_B*sin(alpha) - sR*R_B*cos(alpha)),
      ok: same_sign(S_GGx, ref),
      txt: if ok then "" else fb_vars(S_GGx, ref, [nA, nB, tB, G])
    );

The reference is written with fixed names (`N_A`, `N_B`, `R_B`) and the student's names are substituted.

See also [[fb_reaction_name()]] (the name of the single reaction at a support).
