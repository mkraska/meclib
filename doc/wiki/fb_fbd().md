### `[txt, OK, parts]: fb_fbd(o, n, options)`

- `o` the meclib object list (`stackjson_parse(objects)`)
- `n` the `names` array (content of the `names` input field)
- `options` list of options `name = value`, each optional:
  - `sys` list of indices of the elements of the system (to be shown)
  - `env` list of indices of the elements of the environment (to be deactivated and replaced by reactions)
  - `hint` text added if the system boundaries are wrong
  - `supports` indices of the supports whose reactions must have different names (default: all [["fix1"]], [["fix12"]], [["fix123"]], [["fix13"]] and [["contact"]] objects)
  - `reserved` further names a reaction must not have, e.g. `[a, b, h, alpha]` (symbols of the problem)
  - `nameform` `true`: each drawn load is named with one letter and, if needed, an index
  - `forces`, `moments` expected number of drawn forces and moments

[Source](https://github.com/mkraska/meclib/blob/main/Maxima/fb_fbd.mac)

`fb_fbd()` does the checks of a free-body diagram that do not depend on a single support. The supports themselves are checked with their own functions ([[Feedback for "contact"]], [[Feedback for "fix12"]], ...).

1. **System boundaries** (if `sys` or `env` is given): as [[fb_system()]].
2. **Names** (always):
   - every drawn force and moment has a name,
   - no drawn load is named like a given load or a name in `reserved` (given loads may share a name, e.g. two weights `G`),
   - the reactions at the supports have different names, as [[fb_unique_names()]],
   - with `nameform = true`: one letter with an optional index, e.g. `F_1`. Usually this is checked per support already.
3. **Number** (if `forces` or `moments` is given): the drawn forces and moments are counted, as [[fb_reactions()]].

Drawn loads are the forces and moments with state `"active"` (created by the student); given loads are the others. Resultants of line loads (a space in the name) are left out.

Result:
- `txt` one line per problem; if there is none, one line naming the checks done: *Geprüft und in Ordnung: Systemgrenzen, Namen, Anzahl der Reaktionen.* The text starts with `<br>` as with the other feedback functions.
- `OK` `true` if all checks pass
- `parts` `[system OK, names OK, number OK]`, `true` for a check not done, e.g. for partial marks in the PRT

All checks run, so the student sees all problems at once.

Note: the option names are evaluated. If the question has a variable named like an option (e.g. `sys`), write the option name quoted: `'sys = [1]`, or as a string: `"sys" = [1]`.

### Example

Taken from `demo_questions/contact_demo_03 static friction.xml`.

Feedback variables:

    obj: stackjson_parse(objects);
    [txtFBD, okFBD, partsFBD]: fb_fbd(obj, names, [sys = [i_beam], env = [i_floor, i_top, i_side],
                                                  supports = [i_A, i_B], reserved = [a, b, h, alpha],
                                                  forces = 3, moments = 0]);
    [textA, okA]: fb_contact(obj, names, i_A, "Kontakt A: ", "smooth", ["N_A", "N"]);
    [textB, okB]: fb_contact(obj, names, i_B, "Kontakt B: ", "static", ["N_B", "N"], ["R_B", "R"]);

Node 1: `AlgEquiv(okFBD, true)`, feedback `{@txtFBD@}` in both branches; further nodes for the contacts.
