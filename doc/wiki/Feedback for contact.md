### `fb_contact(o, n, i, description, [friction, normalNames, frictionNames, ignoreNames])`

- `o` list of objects
- `n` names field
- `i` index of `contact` object
- `description` string with text to identify the object for the user
- `friction` (optional) kind of contact, see [Rough contact](#rough-contact):
  - omitted, `""` or `"smooth"`: no friction
  - `"static"`: static friction
  - `[vx, vy]`: kinetic friction, velocity of the body relative to the environment
  - `"v_A"`: kinetic friction, velocity given by the [["disp"]] object named `v_A`
- `normalNames` (optional) accepted names of the normal force (string or list of strings)
- `frictionNames` (optional) accepted names of the friction force (string or list of strings)
- `ignoreNames` (optional) names of other forces at the contact point that are not commented, e.g. `["G"]` for a weight drawn by the student at a sliding block

These functions provide [[Feedback for Free Body Diagrams]].

[Source](https://github.com/mkraska/meclib/blob/main/Maxima/fb_fbd.mac)

[["contact"]] represents a point contact. Once the referenced (cut-away) object is deactivated, it is replaced by a normal force and, for a rough contact, a friction force. Without the optional arguments, the contact is frictionless and the checks below apply.

Checks done by `fb_contact()`:

- Is the object really of type [["contact"]] (just for developers)?
- Is the referenced object (`targetRef`, resolved by name or by 1-based index via `fb_resolve_ref()`) found and unambiguous?
- Is the referenced object deactivated? If not, the referenced object is named in the feedback (or, if it has no name, reported as "Umgebung bei `targetRef`").
- Has meclib found any reactions by proximity check?
- Is there exactly one reaction?
- Is the reaction of type [["force"]]?
- Is the reaction parallel to the contact's normal direction?

### `fb_resolve_ref(o, ref)`

Resolves a `targetRef` value to an object index: returns `ref` unchanged if it is already an integer, otherwise searches `o` for an object whose name matches `ref`. Returns `false` if no unambiguous match is found.

This is required because the [["contact"]] object contains references that can either be a numerical index or a name.

### Typical PRT

**Feedback variables:**

```
obj: stackjson_parse(objects);
[text, isOK]: fb_contact(obj, names, i_N, "Kontakt bei N: ");
```
**PRT node** test for correct direction

Algebraic test for `isOK = true` and feedback of `{@text@}` for both branches.

## Rough contact

With the optional arguments, `fb_contact()` checks a normal force and, for static or kinetic friction, a friction force at the contact.

**Which forces count.** With names, the forces with one of the accepted names are the reactions of the contact. Every other force at the point is commented as a probable reaction with a wrong name, unless its name is in `ignoreNames`:

- normal to the surface: "Force F_1 acts normal to the contact surface. Expected normal force: N_B."
- tangential: "... Expected friction force: R_B." (for a smooth contact: "The contact is smooth.")
- otherwise with the angle to the nearer of normal and tangent: "Force F_1 deviates by 20° from the tangent. Expected reactions: N_B (normal), R_B (tangential)."

Without names, every load at the point is a reaction and must be either normal or tangential to the contact surface; otherwise the feedback gives its angle to the nearer of the two.

A normal or friction force with an accepted name but the wrong direction gets its angle as well: "Normal force N_B deviates by 12° from the normal." Directions within about 3° count as correct.

| `friction`          | Normal force                     | Friction force                      |
|---------------------|----------------------------------|-------------------------------------|
| `""` / `"smooth"`   | exactly one, compressive         | none                                |
| `"static"`          | exactly one, compressive         | exactly one, tangential, either sense |
| `[vx, vy]` / `"v_A"` | exactly one, compressive        | exactly one, tangential, against the velocity |

For kinetic friction, the velocity is that of the body relative to the environment. Only its tangential component matters. If a `disp` object is named, its arrow in the scene shows the sliding direction, and the feedback names it ("Friction force R_A must act against v_A").

In German, the friction force is called "Haftkraft" for static friction and "Reibkraft" for kinetic friction.

The feedback lists all problems found, e.g. a missing normal force and a friction force in the wrong sense. If everything is correct: "Reactions N_A and R_A found."

### Typical PRT

**Feedback variables:**

```
obj: stackjson_parse(objects);
[text, isOK]: fb_contact(obj, names, i_B, "Contact at B: ", "static", ["N_B"], ["R_B"]);
/* with a weight G drawn by the student at the same point: */
[text, isOK]: fb_contact(obj, names, i_B, "Contact at B: ", "static", ["N_B"], ["R_B"], ["G"]);
```

Kinetic friction with the velocity arrow `v_B` of the scene (`["disp", "v_B", pB, angle, 1, 2]`):

```
[text, isOK]: fb_contact(obj, names, i_B, "Contact at B: ", "v_B", ["N_B"], ["R_B"]);
```

Algebraic test for `isOK = true` and feedback of `{@text@}` for both branches.

For the equilibrium equations, the friction force is a reaction like any other: the student's forces go into the model answer of the equations.

Messages for authoring errors (in English): `disp` object not found, velocity without tangential component, friction names missing when normal names are given.
